import { Question, QuestionType, MultipleChoiceOption } from "../types";

interface ParsedRawQuestion {
    text: string;
    options: { letter: string; text: string }[];
    answerKeyRaw: string | null;
}

/**
 * Membersihkan karakter kontrol Unicode yang sering terbawa saat copy-paste teks Arab (RTL).
 * Karakter seperti \u200E (LTR Mark), \u200F (RTL Mark), dll bisa mengacaukan deteksi awal baris (^).
 */
const cleanLine = (line: string): string => {
    // Hapus karakter kontrol arah teks dan spasi berlebih
    return line.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').trim();
};

// Helper: Normalisasi Angka Arab (١ -> 1, ۱ -> 1)
const normalizeArabicNumerals = (str: string): string => {
    return str
        .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
        .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
};

// Helper: Normalisasi Huruf Opsi Arab (أ -> A)
const normalizeOptionLetter = (char: string): string => {
    // Hapus tanda kurung, titik, strip, spasi, dan Tatweel (ـ)
    const clean = char.replace(/[\(\)\.\-\s\u0640]/g, '').trim();
    
    // Jika sudah Latin
    if (/[a-zA-Z]/.test(clean)) return clean.toUpperCase();
    
    // Mapping Abjad Arab ke Latin (Urutan ABJADIYAH: Alif, Ba, Jim, Dal, Ha)
    const map: Record<string, string> = {
        'أ': 'A', 'ا': 'A', 'آ': 'A', 'إ': 'A', 'ء': 'A',
        'ب': 'B', 
        'ج': 'C', 
        'د': 'D', 
        'ه': 'E', 'ة': 'E',
        'و': 'F',
        'ز': 'G'
    };
    
    // Handle karakter pertama jika sisa string masih panjang (misal 'أ.' menjadi 'أ')
    const firstChar = clean.charAt(0);
    return map[firstChar] || clean; 
};

export const parseRawText = (text: string): Question[] => {
    // 1. Pre-process text: Normalize newlines
    const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    const rawQuestions: ParsedRawQuestion[] = [];
    let currentQuestion: ParsedRawQuestion | null = null;
    
    // Context tracking
    let context: 'NONE' | 'QUESTION_TEXT' | 'OPTION_TEXT' = 'NONE';
    let currentOptionIndex = -1;

    // --- REGEX PATTERNS (Updated for Arabic Support) ---

    // 1. Deteksi Awal Soal
    // Mendukung: Latin (1.), Arab (١.), Arab-Farsi (۱.)
    const questionStartRegex = /^(\d+|[\u0660-\u0669]+|[\u06F0-\u06F9]+)(?:[\.\)\-]|\s\.)\s+(.*)/; 
    
    // 2. Deteksi Awal Opsi
    // Mendukung: A., (A), أ., (أ), هـ.
    // Menangkap huruf Arab apa saja di awal yg diikuti pemisah
    const optionStartRegex = /^(\(?\s*(?:[a-zA-Z]|[أ-ي]{1,2})\s*[\.\)\-]?\)?)\s+(.*)/; 
    
    // 3. Deteksi Kunci Jawaban
    const answerKeyRegex = /^(?:Kunci|Jawab|Jawaban|Ans|Answer|Key|الجواب|الإجابة|الحل)\s*:?\s*([a-zA-Z]|[أ-ي])(?:\s|$)/i;

    for (let i = 0; i < rawLines.length; i++) {
        // PENTING: Bersihkan baris dari karakter aneh sebelum di-regex
        let line = cleanLine(rawLines[i]); 
        
        if (!line) continue; // Skip empty lines

        const questionMatch = line.match(questionStartRegex);
        const optionMatch = line.match(optionStartRegex);
        const answerMatch = line.match(answerKeyRegex);

        // PRIORITY 1: Check for Answer Key (Baris khusus kunci)
        if (answerMatch) {
            if (currentQuestion) {
                // Normalize key (e.g. 'أ' becomes 'A')
                currentQuestion.answerKeyRaw = normalizeOptionLetter(answerMatch[1]);
            }
            continue; 
        }

        // PRIORITY 2: Check for New Question Start
        if (questionMatch) {
            const rawNumber = questionMatch[1];
            const qText = questionMatch[2];
            
            currentQuestion = {
                text: qText,
                options: [],
                answerKeyRaw: null
            };
            rawQuestions.push(currentQuestion);
            context = 'QUESTION_TEXT';
            currentOptionIndex = -1;
            continue;
        }

        // PRIORITY 3: Check for Option Start
        if (optionMatch && currentQuestion) {
            const rawLetterMarker = optionMatch[1]; 
            const normalizedLetter = normalizeOptionLetter(rawLetterMarker);
            const optText = optionMatch[2];

            // Validasi: Pastikan huruf yang dideteksi masuk akal (A-E)
            if (['A', 'B', 'C', 'D', 'E'].includes(normalizedLetter)) {
                currentQuestion.options.push({
                    letter: normalizedLetter,
                    text: optText
                });
                
                context = 'OPTION_TEXT';
                currentOptionIndex = currentQuestion.options.length - 1;
                continue;
            }
        }

        // PRIORITY 4: Text Continuation (Baris lanjutan teks soal/opsi)
        if (currentQuestion) {
            if (context === 'QUESTION_TEXT') {
                currentQuestion.text += `<br>${line}`;
            } else if (context === 'OPTION_TEXT' && currentOptionIndex >= 0) {
                currentQuestion.options[currentOptionIndex].text += ` ${line}`;
            }
        }
    }

    // Convert raw parsed data to App Question format
    return rawQuestions.map(raw => {
        const questionId = crypto.randomUUID();
        const choices: MultipleChoiceOption[] = raw.options.map(opt => ({
            id: crypto.randomUUID(),
            text: opt.text
        }));

        // Map answer key letter (A, B, C...) to UUID
        let answerKey = '';
        if (raw.answerKeyRaw) {
            const index = raw.answerKeyRaw.charCodeAt(0) - 65; // A=0, B=1
            if (index >= 0 && index < choices.length) {
                answerKey = choices[index].id;
            }
        }

        // Deteksi Tipe: Jika ada opsi -> PG, jika tidak -> Esai
        const type = choices.length > 0 ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY;

        return {
            id: questionId,
            number: '', // Nanti diatur ulang oleh parent
            type: type,
            text: raw.text,
            choices: type === QuestionType.MULTIPLE_CHOICE ? choices : undefined,
            answerKey: answerKey,
            hasAnswerSpace: type === QuestionType.ESSAY ? true : undefined
        };
    });
};