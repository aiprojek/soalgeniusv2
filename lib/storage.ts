import { db } from './db';
import type { Exam, Settings, BankQuestion, Question } from '../types';
import { QuestionType } from '../types';

// Kunci ini hanya digunakan untuk proses migrasi dari localStorage.
export const EXAMS_STORAGE_KEY = 'soalgenius_exams';
export const SETTINGS_STORAGE_KEY = 'soalgenius_settings';
export const QBANK_STORAGE_KEY = 'soalgenius_qbank';

// Kunci statis untuk data pengaturan di dalam IndexedDB
const SETTINGS_DB_KEY = 'app_settings';

// Data awal ini sekarang diekspor untuk digunakan oleh skrip migrasi
// jika tidak ada data yang ditemukan di localStorage.
export const initialExam: Exam = {
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

export const defaultSettings: Settings = {
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

// --- FUNGSI UJIAN (EXAM) ---

export const getAllExams = async (): Promise<Exam[]> => {
    try {
        // Mengambil semua ujian dan mengurutkannya berdasarkan tanggal (terbaru dulu)
        return await db.exams.orderBy('date').reverse().toArray();
    } catch (e) {
        console.error("Gagal memuat ujian dari IndexedDB", e);
        return [];
    }
};

export const getExam = async (id: string): Promise<Exam | undefined> => {
    try {
        return await db.exams.get(id);
    } catch (e) {
        console.error(`Gagal memuat ujian dengan id ${id}`, e);
        return undefined;
    }
};

export const saveExam = async (examToSave: Exam): Promise<string> => {
    try {
        // .put() akan meng-update jika ada, atau menambahkan jika baru.
        return await db.exams.put(examToSave);
    } catch (e) {
        console.error("Gagal menyimpan ujian", e);
        throw e;
    }
};

export const deleteExam = async (id: string): Promise<void> => {
    try {
        await db.exams.delete(id);
    } catch (e) {
        console.error("Gagal menghapus ujian", e);
        throw e;
    }
};

export const duplicateExam = async (id: string): Promise<Exam> => {
    const examToCopy = await getExam(id);
    if (!examToCopy) throw new Error("Ujian tidak ditemukan untuk diduplikasi");
    
    const newExam: Exam = {
        ...JSON.parse(JSON.stringify(examToCopy)), // Deep copy
        id: crypto.randomUUID(),
        title: `${examToCopy.title} (Salinan)`,
        status: 'draft',
    };
    await saveExam(newExam);
    return newExam;
};

export const shuffleExam = async (id: string): Promise<Exam> => {
    const allExams = await getAllExams();
    const examToShuffle = allExams.find(exam => exam.id === id);
    if (!examToShuffle) throw new Error("Ujian tidak ditemukan untuk diacak");

    const variantRegex = / - Varian \d+$/;
    const baseTitle = examToShuffle.title.replace(variantRegex, '').trim();

    let highestVariant = 0;
    allExams.forEach(exam => {
        if (exam.title.startsWith(baseTitle)) {
            const match = exam.title.match(/ - Varian (\d+)$/);
            if (match && match[1]) {
                const variantNumber = parseInt(match[1], 10);
                if (variantNumber > highestVariant) highestVariant = variantNumber;
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
    await saveExam(newExam);
    return newExam;
};


// --- FUNGSI PENGATURAN (SETTINGS) ---

export const getSettings = async (): Promise<Settings> => {
    try {
        const settings = await db.settings.get(SETTINGS_DB_KEY);
        // Hapus properti 'key' sebelum mengembalikan
        if (settings) {
            const { key, ...rest } = settings;
            return { ...defaultSettings, ...rest };
        }
        return defaultSettings;
    } catch (e) {
        console.error("Gagal memuat pengaturan dari IndexedDB", e);
        return defaultSettings;
    }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
    try {
        // Menambahkan 'key' yang diperlukan oleh skema database
        await db.settings.put({ ...settings, key: SETTINGS_DB_KEY });
    } catch (e) {
        console.error("Gagal menyimpan pengaturan", e);
        throw e;
    }
};


// --- FUNGSI BANK SOAL (QUESTION BANK) ---

export const getBankQuestions = async (): Promise<BankQuestion[]> => {
    try {
        return await db.bankQuestions.orderBy('createdAt').reverse().toArray();
    } catch (e) {
        console.error("Gagal memuat bank soal dari IndexedDB", e);
        return [];
    }
};

export const saveQuestionToBank = async (question: Question, metadata: { subject: string; class: string }): Promise<string> => {
    try {
        const newBankQuestion: BankQuestion = {
            bankId: crypto.randomUUID(),
            question: JSON.parse(JSON.stringify(question)), // Deep copy
            subject: metadata.subject,
            class: metadata.class,
            createdAt: new Date().toISOString(),
        };
        return await db.bankQuestions.add(newBankQuestion);
    } catch (e) {
        console.error("Gagal menyimpan soal ke bank", e);
        throw e;
    }
};

export const deleteQuestionFromBank = async (bankId: string): Promise<void> => {
    try {
        await db.bankQuestions.delete(bankId);
    } catch (e) {
        console.error("Gagal menghapus soal dari bank", e);
        throw e;
    }
};
