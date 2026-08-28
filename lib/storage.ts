import { db } from './db';
import type { Exam, Settings, BankQuestion, Question, Folder } from '../types';
import { QuestionType } from '../types';
import type { LjkScanResult } from './ljkGenerator';

// Kunci ini hanya digunakan untuk proses migrasi dari localStorage.
export const EXAMS_STORAGE_KEY = 'soalgenius_exams';
export const SETTINGS_STORAGE_KEY = 'soalgenius_settings';
export const QBANK_STORAGE_KEY = 'soalgenius_qbank';

// Kunci statis untuk data pengaturan di dalam IndexedDB
const SETTINGS_DB_KEY = 'app_settings';

// Keys for Sync Tracking
export const LOCAL_CHANGE_TIMESTAMP_KEY = 'soalgenius_last_local_change';

// Helper to update local change timestamp
export const touchLocalChange = () => {
    localStorage.setItem(LOCAL_CHANGE_TIMESTAMP_KEY, new Date().toISOString());
};

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
        { id: crypto.randomUUID(), text: 'PEMERINTAH KOTA CONTOH', sizeMode: 'auto', sizePt: 12 },
        { id: crypto.randomUUID(), text: 'DINAS PENDIDIKAN DAN KEBUDAYAAN', sizeMode: 'auto', sizePt: 12 },
        { id: crypto.randomUUID(), text: 'SEKOLAH MENENGAH PERTAMA HARAPAN BANGSA', sizeMode: 'auto', sizePt: 12 },
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
        const id = await db.exams.put(examToSave);
        touchLocalChange(); // Update timestamp
        return id;
    } catch (e) {
        console.error("Gagal menyimpan ujian", e);
        throw e;
    }
};

export const deleteExam = async (id: string): Promise<void> => {
    try {
        await db.exams.delete(id);
        touchLocalChange(); // Update timestamp
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
    await saveExam(newExam); // saveExam calls touchLocalChange
    return newExam;
};

export const renumberSectionsQuestions = (sections: Section[]): Section[] => {
    let currentNumber = 1;
    return sections.map(section => ({
        ...section,
        questions: section.questions.map(q => {
            if (q.type === QuestionType.STIMULUS) {
                return { ...q, number: '' };
            }
            const qNum = String(currentNumber++);
            return {
                ...q,
                number: qNum
            };
        })
    }));
};

export const shuffleExam = async (id: string): Promise<Exam> => {
    const allExams = await getAllExams();
    const examToShuffle = allExams.find(exam => exam.id === id);
    if (!examToShuffle) throw new Error("Ujian tidak ditemukan untuk diacak");

    const variantRegex = / - Varian (\d+)$/;
    const baseTitle = examToShuffle.title.replace(variantRegex, '').trim();

    let highestVariant = 0;
    allExams.forEach(exam => {
        if (exam.title.startsWith(baseTitle)) {
            const match = exam.title.match(variantRegex);
            if (match && match[1]) {
                const variantNumber = parseInt(match[1], 10);
                if (variantNumber > highestVariant) highestVariant = variantNumber;
            }
        }
    });

    const newVariantNumber = highestVariant + 1;
    const newTitle = `${baseTitle} - Varian ${newVariantNumber}`;

    const shuffledSections = examToShuffle.sections.map(section => ({
        ...section,
        questions: shuffleArray(section.questions),
    }));

    const newExam: Exam = {
        ...JSON.parse(JSON.stringify(examToShuffle)),
        id: crypto.randomUUID(),
        title: newTitle,
        sections: renumberSectionsQuestions(shuffledSections),
        status: 'draft',
    };
    await saveExam(newExam); // saveExam calls touchLocalChange
    return newExam;
};

/**
 * Membuat paket soal berbeda (Paket A, Paket B, dst) dari satu master.
 * Mengacak urutan soal DAN urutan opsi jawaban, serta me-reset urutan nomor soal agar tetap 1, 2, 3...
 */
export const createExamPackets = async (masterId: string, count: number): Promise<void> => {
    const masterExam = await getExam(masterId);
    if (!masterExam) throw new Error("Ujian master tidak ditemukan");

    // Loop to create packets
    for (let i = 0; i < count; i++) {
        const packetLetter = String.fromCharCode(65 + i); // A, B, C...
        const newExam: Exam = JSON.parse(JSON.stringify(masterExam)); // Deep copy
        
        newExam.id = crypto.randomUUID();
        newExam.title = `${masterExam.title} [Paket ${packetLetter}]`;
        newExam.status = 'draft';

        // Process sections
        const shuffledSections = newExam.sections.map(section => {
            // 1. Shuffle Questions order within section
            const shuffledQuestions = shuffleArray(section.questions);

            // 2. Shuffle Choices within questions (if applicable)
            const fullyShuffledQuestions = shuffledQuestions.map(q => {
                if (
                    (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) && 
                    q.choices && q.choices.length > 0
                ) {
                    return {
                        ...q,
                        choices: shuffleArray(q.choices)
                    };
                }
                return q;
            });

            return {
                ...section,
                questions: fullyShuffledQuestions
            };
        });

        // 3. Reset and sequentially renumber all questions (1, 2, 3...)
        newExam.sections = renumberSectionsQuestions(shuffledSections);

        await saveExam(newExam);
    }
};


// --- FUNGSI FOLDER ---

export const getFolders = async (): Promise<Folder[]> => {
    try {
        return await db.folders.toArray();
    } catch (e) {
        console.error("Gagal memuat folder", e);
        return [];
    }
};

export const saveFolder = async (folder: Folder): Promise<string> => {
    try {
        const id = await db.folders.put(folder);
        touchLocalChange();
        return id;
    } catch (e) {
        console.error("Gagal menyimpan folder", e);
        throw e;
    }
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    try {
        await (db as any).transaction('rw', db.folders, db.exams, async () => {
            // Delete folder
            await db.folders.delete(folderId);
            
            // Move exams in this folder to 'Uncategorized' (remove folderId)
            const examsInFolder = (await db.exams.toArray()).filter(exam => exam.folderId === folderId);
            for (const exam of examsInFolder) {
                delete exam.folderId;
                await db.exams.put(exam);
            }
        });
        touchLocalChange();
    } catch (e) {
        console.error("Gagal menghapus folder", e);
        throw e;
    }
};

// --- FUNGSI GLOBAL TAG MANAGEMENT ---

export const renameGlobalTag = async (oldTag: string, newTag: string): Promise<void> => {
    try {
        await (db as any).transaction('rw', db.exams, async () => {
            const exams = await db.exams.toArray();
            for (const exam of exams) {
                if (exam.tags && exam.tags.includes(oldTag)) {
                    // Replace oldTag with newTag, ensuring no duplicates if newTag already exists
                    const newTags = exam.tags.map(t => t === oldTag ? newTag : t);
                    // Filter duplicates using Set
                    exam.tags = Array.from(new Set(newTags));
                    await db.exams.put(exam);
                }
            }
        });
        touchLocalChange();
    } catch (e) {
        console.error("Gagal mengubah nama label", e);
        throw e;
    }
};

export const deleteGlobalTag = async (tagToDelete: string): Promise<void> => {
    try {
        await (db as any).transaction('rw', db.exams, async () => {
            const exams = await db.exams.toArray();
            for (const exam of exams) {
                if (exam.tags && exam.tags.includes(tagToDelete)) {
                    exam.tags = exam.tags.filter(t => t !== tagToDelete);
                    await db.exams.put(exam);
                }
            }
        });
        touchLocalChange();
    } catch (e) {
        console.error("Gagal menghapus label", e);
        throw e;
    }
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
        touchLocalChange(); // Update timestamp
    } catch (e) {
        console.error("Gagal menyimpan pengaturan", e);
        throw e;
    }
};


// --- FUNGSI BANK SOAL (QUESTION BANK) ---

export const getBankQuestions = async (): Promise<BankQuestion[]> => {
    try {
        const questions = await db.bankQuestions.toArray();
        if (questions.length === 0) {
            // Check if there are legacy questions in localStorage that weren't migrated
            const legacyJson = localStorage.getItem(QBANK_STORAGE_KEY);
            if (legacyJson) {
                try {
                    const legacyQuestions: BankQuestion[] = JSON.parse(legacyJson);
                    if (legacyQuestions.length > 0) {
                        await db.bankQuestions.bulkPut(legacyQuestions);
                        return legacyQuestions.sort((a, b) => {
                            const timeA = new Date(a.createdAt || 0).getTime();
                            const timeB = new Date(b.createdAt || 0).getTime();
                            return timeB - timeA;
                        });
                    }
                } catch (e) {
                    console.warn("Gagal membaca legacy bank questions", e);
                }
            }
        }
        return questions.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
        });
    } catch (e) {
        console.error("Gagal memuat bank soal dari IndexedDB", e);
        try {
            const legacyJson = localStorage.getItem(QBANK_STORAGE_KEY);
            return legacyJson ? JSON.parse(legacyJson) : [];
        } catch {
            return [];
        }
    }
};

export const saveQuestionToBank = async (question: Question, metadata?: { subject?: string; class?: string }): Promise<string> => {
    try {
        const newBankQuestion: BankQuestion = {
            bankId: crypto.randomUUID(),
            question: JSON.parse(JSON.stringify(question)), // Deep copy
            subject: metadata?.subject || 'Umum',
            class: metadata?.class || 'Semua Kelas',
            createdAt: new Date().toISOString(),
        };
        const id = await db.bankQuestions.put(newBankQuestion);
        
        // Also keep localStorage in sync as resilient fallback
        try {
            const existing = await getBankQuestions();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(existing));
        } catch (e) {
            // ignore localStorage quota warnings
        }

        touchLocalChange(); // Update timestamp
        return id || newBankQuestion.bankId;
    } catch (e) {
        console.error("Gagal menyimpan soal ke bank", e);
        // Fallback directly to localStorage if IndexedDB has unexpected issue
        try {
            const legacyJson = localStorage.getItem(QBANK_STORAGE_KEY);
            const current: BankQuestion[] = legacyJson ? JSON.parse(legacyJson) : [];
            const newBankQuestion: BankQuestion = {
                bankId: crypto.randomUUID(),
                question: JSON.parse(JSON.stringify(question)),
                subject: metadata?.subject || 'Umum',
                class: metadata?.class || 'Semua Kelas',
                createdAt: new Date().toISOString(),
            };
            current.unshift(newBankQuestion);
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(current));
            touchLocalChange();
            return newBankQuestion.bankId;
        } catch (storageError) {
            throw e;
        }
    }
};

export const saveMultipleQuestionsToBank = async (
    questions: Question[], 
    metadata?: { subject?: string; class?: string }
): Promise<number> => {
    try {
        const newBankQuestions: BankQuestion[] = questions.map(q => ({
            bankId: crypto.randomUUID(),
            question: JSON.parse(JSON.stringify(q)),
            subject: metadata?.subject || 'Umum',
            class: metadata?.class || 'Semua Kelas',
            createdAt: new Date().toISOString(),
        }));

        await db.bankQuestions.bulkPut(newBankQuestions);
        
        try {
            const all = await db.bankQuestions.toArray();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(all));
        } catch (e) {}

        touchLocalChange();
        return newBankQuestions.length;
    } catch (e) {
        console.error("Gagal menyimpan batch soal ke bank", e);
        throw e;
    }
};

export const updateBankQuestion = async (bankQuestion: BankQuestion): Promise<void> => {
    try {
        await db.bankQuestions.put(bankQuestion);
        try {
            const current = await db.bankQuestions.toArray();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(current));
        } catch (e) {}
        touchLocalChange(); // Update timestamp
    } catch (e) {
        console.error("Gagal memperbarui soal di bank", e);
        throw e;
    }
};

export const updateMultipleBankQuestions = async (
    bankIds: string[], 
    updates: { subject?: string; class?: string; tags?: string[]; appendTags?: boolean }
): Promise<number> => {
    try {
        let updatedCount = 0;
        await (db as any).transaction('rw', db.bankQuestions, async () => {
            for (const id of bankIds) {
                const item = await db.bankQuestions.get(id);
                if (item) {
                    if (updates.subject !== undefined) {
                        item.subject = updates.subject;
                    }
                    if (updates.class !== undefined) {
                        item.class = updates.class;
                    }
                    if (updates.tags !== undefined) {
                        if (updates.appendTags && item.tags) {
                            item.tags = Array.from(new Set([...item.tags, ...updates.tags]));
                        } else {
                            item.tags = updates.tags;
                        }
                    }
                    await db.bankQuestions.put(item);
                    updatedCount++;
                }
            }
        });

        try {
            const current = await db.bankQuestions.toArray();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(current));
        } catch (e) {}

        touchLocalChange();
        return updatedCount;
    } catch (e) {
        console.error("Gagal memperbarui massal bank soal", e);
        throw e;
    }
};

export const deleteQuestionFromBank = async (bankId: string): Promise<void> => {
    try {
        await db.bankQuestions.delete(bankId);
        try {
            const current = await db.bankQuestions.toArray();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(current));
        } catch (e) {}
        touchLocalChange(); // Update timestamp
    } catch (e) {
        console.error("Gagal menghapus soal dari bank", e);
        throw e;
    }
};

export const deleteMultipleQuestionsFromBank = async (bankIds: string[]): Promise<void> => {
    try {
        await db.bankQuestions.bulkDelete(bankIds);
        try {
            const current = await db.bankQuestions.toArray();
            localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(current));
        } catch (e) {}
        touchLocalChange(); // Update timestamp
    } catch (e) {
        console.error("Gagal menghapus beberapa soal dari bank", e);
        throw e;
    }
};

// --- FUNGSI BACKUP & RESTORE DATA (HELPER) ---

export const createBackupData = async (): Promise<string> => {
    const exams = await getAllExams();
    const settings = await getSettings();
    const bankQuestions = await db.bankQuestions.toArray();
    const folders = await getFolders();
    const geminiApiKey = localStorage.getItem('soalgenius_gemini_api_key') || '';

    const backupData = {
        source: 'SoalGeniusDB',
        version: 3, // Current schema version
        createdAt: new Date().toISOString(),
        data: { 
            exams, 
            settings, 
            bankQuestions, 
            folders,
            preferences: {
                geminiApiKey
            }
        }
    };

    return JSON.stringify(backupData, null, 2);
};

export const restoreBackupData = async (jsonString: string): Promise<boolean> => {
    try {
        let backupData: any;
        try {
            backupData = JSON.parse(jsonString);
        } catch {
            throw new Error('Format file tidak valid. Pastikan file berupa JSON.');
        }

        // Support both full backup wrapper and direct raw objects
        const rawPayload = backupData.data || backupData;
        if (!rawPayload || (typeof rawPayload !== 'object')) {
            throw new Error('Struktur data backup tidak valid.');
        }

        // 1. Normalize Exams
        let rawExams: any[] = [];
        if (Array.isArray(rawPayload.exams)) {
            rawExams = rawPayload.exams;
        } else if (rawPayload.id && (rawPayload.sections || rawPayload.questions || rawPayload.title)) {
            // Single exam object passed directly
            rawExams = [rawPayload];
        }

        const normalizedExams: Exam[] = rawExams.map((exam: any, idx: number) => {
            let sections = exam.sections;
            if (!sections && exam.questions) {
                // Convert legacy root questions to sections
                sections = [
                    {
                        id: crypto.randomUUID(),
                        instructions: 'I. Jawablah pertanyaan-pertanyaan berikut dengan benar!',
                        questions: Array.isArray(exam.questions) ? exam.questions.map((q: any, qIdx: number) => ({
                            ...q,
                            number: q.number || String(qIdx + 1)
                        })) : []
                    }
                ];
            } else if (!Array.isArray(sections)) {
                sections = [];
            }

            return {
                id: exam.id || crypto.randomUUID(),
                title: exam.title || `Ujian ${idx + 1}`,
                subject: exam.subject || '',
                date: exam.date || new Date().toISOString().split('T')[0],
                class: exam.class || '',
                instructions: exam.instructions || '',
                waktuUjian: exam.waktuUjian || '',
                keterangan: exam.keterangan || '',
                status: exam.status === 'published' ? 'published' : 'draft',
                direction: exam.direction === 'rtl' ? 'rtl' : 'ltr',
                layoutColumns: exam.layoutColumns === 2 ? 2 : 1,
                folderId: typeof exam.folderId === 'string' ? exam.folderId : undefined,
                tags: Array.isArray(exam.tags) ? exam.tags : [],
                sections
            };
        });

        // 2. Normalize Settings
        let settingsToSave: Settings | null = null;
        if (rawPayload.settings) {
            const rawSettings = rawPayload.settings;
            let logos = rawSettings.logos;
            if (!logos && rawSettings.logo !== undefined) {
                logos = [rawSettings.logo, null];
            }
            if (!Array.isArray(logos)) {
                logos = [null, null];
            }
            settingsToSave = {
                ...defaultSettings,
                ...rawSettings,
                logos: [logos[0] || null, logos[1] || null]
            };
        }

        // 3. Normalize Folders
        const rawFolders = Array.isArray(rawPayload.folders) ? rawPayload.folders : [];
        const normalizedFolders: Folder[] = rawFolders.map((f: any, idx: number) => ({
            id: f.id || crypto.randomUUID(),
            name: f.name || `Folder ${idx + 1}`,
            createdAt: f.createdAt || new Date().toISOString()
        }));

        // 4. Normalize Question Bank
        const rawBank = Array.isArray(rawPayload.bankQuestions) ? rawPayload.bankQuestions : [];
        const normalizedBank: BankQuestion[] = rawBank.map((bq: any) => ({
            bankId: bq.bankId || crypto.randomUUID(),
            question: bq.question || {
                id: crypto.randomUUID(),
                number: '1',
                type: QuestionType.MULTIPLE_CHOICE,
                text: ''
            },
            subject: bq.subject || '',
            class: bq.class || '',
            createdAt: bq.createdAt || new Date().toISOString()
        }));

        // Execute atomic database write
        await (db as any).transaction('rw', db.exams, db.settings, db.bankQuestions, db.folders, async () => {
            // Hapus dan masukkan data yang diperbarui
            await db.exams.clear();
            if (normalizedExams.length > 0) {
                await db.exams.bulkPut(normalizedExams);
            }

            if (settingsToSave) {
                await db.settings.clear();
                await db.settings.put({ ...settingsToSave, key: SETTINGS_DB_KEY });
            }

            await db.bankQuestions.clear();
            if (normalizedBank.length > 0) {
                await db.bankQuestions.bulkPut(normalizedBank);
            }

            await db.folders.clear();
            if (normalizedFolders.length > 0) {
                await db.folders.bulkPut(normalizedFolders);
            }
        });

        // 5. Restore Preferences if available
        const prefs = rawPayload.preferences || backupData.preferences;
        if (prefs?.geminiApiKey && typeof prefs.geminiApiKey === 'string') {
            localStorage.setItem('soalgenius_gemini_api_key', prefs.geminiApiKey);
        }
        
        touchLocalChange(); // Update change tracking for cloud sync
        return true;
    } catch (error) {
        console.error("Gagal restore:", error);
        throw error;
    }
};

export const LJK_STORAGE_PREFIX = 'soalgenius_ljk_results_';

export const saveLjkResults = async (examId: string, results: LjkScanResult[]): Promise<void> => {
    try {
        localStorage.setItem(`${LJK_STORAGE_PREFIX}${examId}`, JSON.stringify(results));
        touchLocalChange();
    } catch (e) {
        console.error("Gagal menyimpan hasil LJK:", e);
    }
};

export const getLjkResults = async (examId: string): Promise<LjkScanResult[]> => {
    try {
        const raw = localStorage.getItem(`${LJK_STORAGE_PREFIX}${examId}`);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Gagal membaca hasil LJK:", e);
        return [];
    }
};

export const clearLjkResults = async (examId: string): Promise<void> => {
    try {
        localStorage.removeItem(`${LJK_STORAGE_PREFIX}${examId}`);
        touchLocalChange();
    } catch (e) {
        console.error("Gagal menghapus hasil LJK:", e);
    }
};
