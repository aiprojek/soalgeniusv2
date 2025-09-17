import type { Exam, Settings, Section, BankQuestion, Question } from '../types';
import { QuestionType } from '../types';

export const EXAMS_STORAGE_KEY = 'soalgenius_exams';
export const SETTINGS_STORAGE_KEY = 'soalgenius_settings';
export const QBANK_STORAGE_KEY = 'soalgenius_qbank';

const initialExam: Exam = {
    id: 'b23a7125-e2f6-4a47-8141-5509c95aad45',
    title: 'Ujian Akhir Semester - Contoh',
    subject: 'Ilmu Pengetahuan Alam',
    class: 'Kelas IX',
    date: new Date().toISOString().split('T')[0],
    waktuUjian: '90 Menit',
    keterangan: 'Kurikulum Merdeka, Fase D, Penilaian Akhir Semester',
    instructions: '1. Berdoalah sebelum mengerjakan soal.\n2. Jawablah pertanyaan dengan jujur dan teliti.\n3. Periksa kembali jawaban Anda sebelum dikumpulkan.',
    status: 'draft',
    direction: 'ltr',
    layoutColumns: 1,
    sections: [
        {
            id: crypto.randomUUID(),
            instructions: 'I. Pilihlah salah satu jawaban yang paling tepat!',
            questions: [
                {
                    id: crypto.randomUUID(),
                    number: '1',
                    type: QuestionType.MULTIPLE_CHOICE,
                    text: 'Apa <b>planet terbesar</b> di tata surya kita?',
                    choices: [
                        { id: crypto.randomUUID(), text: 'Bumi' },
                        { id: crypto.randomUUID(), text: 'Mars' },
                        { id: crypto.randomUUID(), text: 'Jupiter' },
                        { id: crypto.randomUUID(), text: 'Saturnus' }
                    ],
                    answerKey: ''
                }
            ]
        },
        {
            id: crypto.randomUUID(),
            instructions: 'II. Jawablah pertanyaan berikut dengan singkat dan jelas!',
            questions: [
                 {
                    id: crypto.randomUUID(),
                    number: '2',
                    type: QuestionType.ESSAY,
                    text: 'Jelaskan proses terjadinya hujan secara singkat.',
                    hasAnswerSpace: true,
                    answerKey: 'Siklus air yang melibatkan evaporasi, kondensasi, dan presipitasi.'
                }
            ]
        }
    ]
};

const defaultSettings: Settings = {
    examHeaderLines: [
        { id: crypto.randomUUID(), text: 'PEMERINTAH KOTA CONTOH' },
        { id: crypto.randomUUID(), text: 'DINAS PENDIDIKAN DAN KEBUDAYAAN' },
        { id: crypto.randomUUID(), text: 'SEKOLAH MENENGAH PERTAMA HARAPAN BANGSA' },
    ],
    logos: [null, null],
    paperSize: 'A4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    lineSpacing: 1.1,
    fontFamily: 'Liberation Serif',
    fontSize: 12,
};

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Updated to handle data migration from old format
export const getAllExams = (): Exam[] => {
    try {
        const examsJson = localStorage.getItem(EXAMS_STORAGE_KEY);
        if (!examsJson) {
            localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify([initialExam]));
            return [initialExam];
        }
        const exams = JSON.parse(examsJson) as (Exam & { questions?: any[] })[];
        
        // Migration logic for exams
        const migratedExams = exams.map(exam => {
            // Migrate old format (questions at root) to sections
            if (exam.questions && !exam.sections) {
                console.log(`Migrating exam: ${exam.title}`);
                const newSection: Section = {
                    id: crypto.randomUUID(),
                    instructions: 'I. Jawablah pertanyaan-pertanyaan berikut dengan benar!',
                    questions: exam.questions.map((q: any, index: number) => ({
                        ...q,
                        number: String(index + 1),
                        choices: q.choices || undefined,
                    })),
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { questions, ...restOfExam } = exam;
                return { ...restOfExam, sections: [newSection] };
            }
            // Add default direction if missing
             if (!exam.direction) {
                exam.direction = 'ltr';
            }
            // Add default layout columns if missing
            if (exam.layoutColumns === undefined) {
                exam.layoutColumns = 1;
            }
            return exam;
        });

        return migratedExams;
    } catch (e) {
        console.error("Gagal memuat ujian dari localStorage", e);
        return [];
    }
};

export const getExam = (id: string): Exam | undefined => {
    const exams = getAllExams();
    return exams.find(exam => exam.id === id);
};

export const saveExam = (examToSave: Exam): Exam[] => {
    const exams = getAllExams();
    const existingIndex = exams.findIndex(exam => exam.id === examToSave.id);
    if (existingIndex > -1) {
        exams[existingIndex] = examToSave;
    } else {
        exams.unshift(examToSave);
    }
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
    return exams;
};

export const deleteExam = (id: string): Exam[] => {
    let exams = getAllExams();
    exams = exams.filter(exam => exam.id !== id);
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
    return exams;
};

export const duplicateExam = (id: string): Exam[] => {
    const examToCopy = getExam(id);
    if (!examToCopy) return getAllExams();
    
    const newExam: Exam = {
        ...JSON.parse(JSON.stringify(examToCopy)),
        id: crypto.randomUUID(),
        title: `${examToCopy.title} (Salinan)`,
        status: 'draft',
    };
    return saveExam(newExam);
};

// Updated to shuffle questions and create numbered variants
export const shuffleExam = (id: string): Exam[] => {
    const allExams = getAllExams();
    const examToShuffle = allExams.find(exam => exam.id === id);
    if (!examToShuffle) return allExams;

    // Determine the base title, removing any existing " - Varian X" suffix
    const variantRegex = / - Varian \d+$/;
    const baseTitle = examToShuffle.title.replace(variantRegex, '').trim();

    // Find the highest existing variant number for this base title
    let highestVariant = 0;
    allExams.forEach(exam => {
        if (exam.title.startsWith(baseTitle)) {
            const match = exam.title.match(/ - Varian (\d+)$/);
            if (match && match[1]) {
                const variantNumber = parseInt(match[1], 10);
                if (variantNumber > highestVariant) {
                    highestVariant = variantNumber;
                }
            }
        }
    });

    const newVariantNumber = highestVariant + 1;
    const newTitle = `${baseTitle} - Varian ${newVariantNumber}`;

    const newExam: Exam = {
        ...JSON.parse(JSON.stringify(examToShuffle)),
        id: crypto.randomUUID(),
        title: newTitle,
        sections: examToShuffle.sections.map(section => ({
            ...section,
            questions: shuffleArray(section.questions),
        })),
        status: 'draft',
    };
    return saveExam(newExam);
};


export const getSettings = (): Settings => {
    try {
        const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!settingsJson) {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
            return defaultSettings;
        }
        
        const loadedSettings = JSON.parse(settingsJson);

        // Migration logic for old single logo format
        if (loadedSettings.logo !== undefined) {
            loadedSettings.logos = [loadedSettings.logo, null];
            delete loadedSettings.logo;
        }
        
        // Ensure logos is always a two-element array
        if (!loadedSettings.logos) {
            loadedSettings.logos = [null, null];
        } else if (loadedSettings.logos.length === 1) {
            loadedSettings.logos = [loadedSettings.logos[0], null];
        }


        return { ...defaultSettings, ...loadedSettings };
    } catch (e) {
        console.error("Gagal memuat pengaturan dari localStorage", e);
        return defaultSettings;
    }
};

export const saveSettings = (settings: Settings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};


// --- Question Bank Functions ---

export const getBankQuestions = (): BankQuestion[] => {
    try {
        const bankJson = localStorage.getItem(QBANK_STORAGE_KEY);
        return bankJson ? JSON.parse(bankJson) : [];
    } catch (e) {
        console.error("Gagal memuat bank soal dari localStorage", e);
        return [];
    }
};

export const saveQuestionToBank = (question: Question, metadata: { subject: string; class: string }): BankQuestion[] => {
    const bank = getBankQuestions();
    const newBankQuestion: BankQuestion = {
        bankId: crypto.randomUUID(),
        question: JSON.parse(JSON.stringify(question)), // Deep copy to prevent reference issues
        subject: metadata.subject,
        class: metadata.class,
        createdAt: new Date().toISOString(),
    };
    const newBank = [newBankQuestion, ...bank];
    localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(newBank));
    return newBank;
};

export const deleteQuestionFromBank = (bankId: string): BankQuestion[] => {
    let bank = getBankQuestions();
    bank = bank.filter(bq => bq.bankId !== bankId);
    localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(bank));
    return bank;
};