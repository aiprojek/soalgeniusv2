import Dexie, { type EntityTable } from 'dexie';
import type { Exam, Settings, BankQuestion } from '../types';

/**
 * Mendefinisikan kelas database SoalGeniusDB menggunakan Dexie.
 * Ini adalah cara yang diketik-aman untuk mendeklarasikan tabel dan skema kita.
 * - `exams`: Menyimpan semua objek ujian, diindeks berdasarkan `id` uniknya.
 * - `settings`: Menyimpan objek pengaturan tunggal. Kita akan menggunakan kunci statis untuk mengaksesnya.
 * - `bankQuestions`: Menyimpan semua soal di bank soal, diindeks berdasarkan `bankId`.
 */
class SoalGeniusDB extends Dexie {
  exams!: EntityTable<Exam, 'id'>;
  settings!: EntityTable<Settings & { key: string }, 'key'>;
  bankQuestions!: EntityTable<BankQuestion, 'bankId'>;

  version!: Dexie['version'];
  transaction!: Dexie['transaction'];

  constructor() {
    super('SoalGeniusDB');
    this.version(2).stores({
      // Menambahkan indeks 'date' untuk memungkinkan pengurutan yang efisien.
      exams: 'id, date', // Primary key 'id', index 'date'
      settings: 'key', // Primary key 'key'
      bankQuestions: 'bankId', // Primary key 'bankId'
    });
  }
}

// Buat instance tunggal dari database untuk digunakan di seluruh aplikasi.
export const db = new SoalGeniusDB();