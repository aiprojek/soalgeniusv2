import { db } from './db';
import { EXAMS_STORAGE_KEY, SETTINGS_STORAGE_KEY, QBANK_STORAGE_KEY, defaultSettings, initialExam } from './storage';
import type { Exam, Settings, BankQuestion, Section } from '../types';

const MIGRATION_FLAG_KEY = 'soalgenius_migrated_to_indexeddb';
const SETTINGS_DB_KEY = 'app_settings';

/**
 * Menjalankan proses migrasi satu kali dari localStorage ke IndexedDB.
 * Proses ini memeriksa sebuah 'flag' di localStorage. Jika flag tidak ada,
 * ia akan membaca semua data yang ada dari localStorage, memindahkannya ke IndexedDB,
 * lalu mengatur flag untuk mencegah migrasi berjalan lagi di masa depan.
 */
export async function migrateFromLocalStorage() {
  const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (isMigrated === 'true') {
    console.log('Data sudah dimigrasikan ke IndexedDB. Melewati...');
    return;
  }

  console.log('Memulai migrasi data dari localStorage ke IndexedDB...');

  try {
    // 1. Migrasi Ujian (Exams)
    const examsJson = localStorage.getItem(EXAMS_STORAGE_KEY);
    let examsToMigrate: Exam[] = [];
    if (examsJson) {
      const examsFromStorage = JSON.parse(examsJson) as (Exam & { questions?: any[] })[];
       // Jalankan logika migrasi yang ada untuk memastikan format data terbaru
      examsToMigrate = examsFromStorage.map(exam => {
          if (exam.questions && !exam.sections) {
              const newSection: Section = {
                  id: crypto.randomUUID(),
                  instructions: 'I. Jawablah pertanyaan-pertanyaan berikut dengan benar!',
                  questions: exam.questions.map((q: any, index: number) => ({ ...q, number: String(index + 1) })),
              };
              const { questions, ...restOfExam } = exam;
              return { ...restOfExam, sections: [newSection], direction: 'ltr', layoutColumns: 1 };
          }
           if (!exam.direction) exam.direction = 'ltr';
           if (exam.layoutColumns === undefined) exam.layoutColumns = 1;
          return exam;
      });
    } else {
        // Jika tidak ada data, gunakan contoh data awal
        examsToMigrate = [initialExam];
    }

    // 2. Migrasi Pengaturan (Settings)
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    let settingsToMigrate: Settings = defaultSettings;
     if (settingsJson) {
        const loadedSettings = JSON.parse(settingsJson);
        if (loadedSettings.logo !== undefined) {
            loadedSettings.logos = [loadedSettings.logo, null];
            delete loadedSettings.logo;
        }
        if (!loadedSettings.logos) {
            loadedSettings.logos = [null, null];
        }
        settingsToMigrate = { ...defaultSettings, ...loadedSettings };
    }
    const settingsForDb = { ...settingsToMigrate, key: SETTINGS_DB_KEY };

    // 3. Migrasi Bank Soal (Question Bank)
    const qbankJson = localStorage.getItem(QBANK_STORAGE_KEY);
    const qbankToMigrate: BankQuestion[] = qbankJson ? JSON.parse(qbankJson) : [];

    // 4. Lakukan transaksi database untuk memasukkan semua data
    await db.transaction('rw', db.exams, db.settings, db.bankQuestions, async () => {
      await db.exams.bulkPut(examsToMigrate);
      await db.settings.put(settingsForDb);
      await db.bankQuestions.bulkPut(qbankToMigrate);
    });

    // 5. Atur flag bahwa migrasi telah berhasil
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    console.log('Migrasi data berhasil diselesaikan.');

  } catch (error) {
    console.error('Terjadi kesalahan selama migrasi data:', error);
    // Jika migrasi gagal, kita tidak mengatur flag agar bisa dicoba lagi nanti.
  }
}