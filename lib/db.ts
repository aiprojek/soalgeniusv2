import Dexie, { type EntityTable } from 'dexie';
import type { Exam, Settings, BankQuestion, Folder } from '../types';

/**
 * Mendefinisikan kelas database SoalGeniusDB menggunakan Dexie.
 * Ini adalah cara yang diketik-aman untuk mendeklarasikan tabel dan skema kita.
 * - `exams`: Menyimpan semua objek ujian, diindeks berdasarkan `id` uniknya.
 * - `settings`: Menyimpan objek pengaturan tunggal. Kita akan menggunakan kunci statis untuk mengaksesnya.
 * - `bankQuestions`: Menyimpan semua soal di bank soal, diindeks berdasarkan `bankId`.
 * - `folders`: Menyimpan struktur folder untuk pengorganisasian.
 */
class SoalGeniusDB extends Dexie {
  exams!: EntityTable<Exam, 'id'>;
  settings!: EntityTable<Settings & { key: string }, 'key'>;
  bankQuestions!: EntityTable<BankQuestion, 'bankId'>;
  folders!: EntityTable<Folder, 'id'>;

  version!: Dexie['version'];
  transaction!: Dexie['transaction'];

  constructor() {
    super('SoalGeniusDB');
    this.version(3).stores({
      // Menambahkan indeks 'date' untuk memungkinkan pengurutan yang efisien.
      exams: 'id, date, folderId', // Primary key 'id', indexes 'date', 'folderId'
      settings: 'key', // Primary key 'key'
      bankQuestions: 'bankId', // Primary key 'bankId'
      folders: 'id', // Primary key 'id'
    });
  }
}

// Buat instance tunggal dari database untuk digunakan di seluruh aplikasi.
export const db = new SoalGeniusDB();