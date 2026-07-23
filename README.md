# SoalGenius

![Logo SoalGenius](icon.svg)

**Aplikasi Cerdas untuk Membuat, Mengelola, dan Mencetak Soal Ujian.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Versi](https://img.shields.io/badge/versi-2.0-brightgreen.svg)](https://github.com/aiprojek/soalgeniusv2)
[![Live App](https://img.shields.io/badge/Akses%20Aplikasi-Online-orange.svg)](https://aiprojek.github.io/soalgeniusv2/)

---

## 👋 Tentang SoalGenius

SoalGenius adalah aplikasi web yang dirancang khusus untuk para pendidik / pengajar. Lupakan kerumitan pemformatan dokumen—fokuslah pada pembuatan soal. Dengan SoalGenius, Anda dapat membuat naskah soal ujian yang rapi dan profesional dalam hitungan menit.

Aplikasi ini dapat bekerja **offline** setelah dimuat pertama kali, dan semua data Anda disimpan dengan aman **hanya di browser Anda**, menjamin privasi dan aksesibilitas penuh bahkan tanpa koneksi internet.

### Kolaborasi Unik AI dan Manusia

SoalGenius adalah hasil dari **kolaborasi erat antara kecerdasan buatan (AI) dan pengembang manusia** di mana setiap pihak memainkan peran penting:

-   **Peran AI sebagai Partner Koding**:
    -   **Generator Kode**: Menulis sebagian besar kode boilerplate, komponen UI, dan logika fungsional berdasarkan instruksi yang detail.
    -   **Problem Solver**: Memberikan solusi cepat untuk tantangan teknis dan algoritma yang kompleks.
    -   **Refactor & Optimasi**: Membantu merapikan dan mengoptimalkan kode untuk performa yang lebih baik.

-   **Peran Manusia sebagai Sutradara & Kurator**:
    -   **Arsitek & Visioner**: Merancang konsep awal, arsitektur aplikasi, dan pengalaman pengguna (UI/UX) secara keseluruhan.
    -   **Prompt Engineer**: Memberikan arahan yang presisi dan kreatif kepada AI untuk menghasilkan kode yang sesuai dengan visi.
    -   **Quality Control**: Melakukan review, debugging, dan integrasi terhadap kode yang dihasilkan AI, memastikan kualitas, keamanan, dan kohesi aplikasi.
    -   **Sentuhan Akhir**: Menambahkan nuansa, kreativitas, dan solusi untuk kasus-kasus unik yang hanya dapat dipahami oleh intuisi manusia.

Kolaborasi ini adalah bukti bagaimana kemitraan antara AI dan manusia dapat menciptakan produk yang inovatif dan bermanfaat.

## ✨ Fitur

-   **✍️ Editor**: Format teks (bold, italic), sisipkan gambar, atur perataan, dan gunakan superskrip/subskrip dengan mudah.
-   **📚 Berbagai Jenis Soal**: Mendukung Pilihan Ganda (termasuk kompleks), Esai, Isian Singkat, Menjodohkan, Benar-Salah, hingga Tabel Isian.
-   **👁️ Pratinau Langsung**: Lihat tampilan akhir soal atau kunci jawaban secara real-time saat Anda mengedit.
-   **🌍 Dukungan Teks Arab (RTL)**: Tulis soal berbahasa Arab dengan mudah. Arah teks, penomoran, dan tata letak otomatis menyesuaikan.
-   **📏 Format Kertas Fleksibel**: Atur ukuran kertas (A4, F4), margin, jenis dan ukuran font, serta spasi baris sesuai kebutuhan.
-   **📰 Tata Letak Dua Kolom**: Hemat kertas dengan mengatur soal agar tampil dalam format dua kolom secara otomatis.
-   **🖨️ Ekspor & Cetak**: Simpan ujian sebagai file HTML mandiri atau cetak langsung ke printer/PDF.
-   **🏦 Bank Soal Personal**: Simpan soal-soal terbaik Anda untuk digunakan kembali di ujian lain, mempercepat proses pembuatan soal.
-   **🎲 Acak Soal (Varian)**: Buat varian soal yang berbeda secara otomatis dari satu naskah ujian untuk mencegah kecurangan.
-   **☁️ Backup & Restore**: Amankan semua data ujian dan pengaturan Anda dalam satu file JSON, dan pulihkan kapan saja.
-   **📴 Bekerja Penuh Offline**: Setelah halaman dimuat, tidak ada lagi koneksi internet yang diperlukan.
-   **🌙 Mode Terang & Gelap**: Pilih tema tampilan yang nyaman untuk mata Anda.
-   **📱 Aplikasi Instan (PWA)**: Instal SoalGenius di desktop atau ponsel Anda untuk pengalaman seperti aplikasi asli.

## 🚀 Panduan Cepat

1.  **Buat Ujian Baru**: Dari halaman **Arsip Ujian**, klik tombol `+ Buat Ujian Baru`.
2.  **Isi Informasi Ujian**: Masukkan judul, mata pelajaran, kelas, dan detail lainnya. Atur juga **Arah Tulis** (LTR/RTL) dan **Tata Letak Pratinjau** (1 atau 2 kolom) di sini.
3.  **Tambah Bagian & Soal**:
    - Klik `Tambah Bagian Soal` untuk mengelompokkan soal (misal: I. Pilihan Ganda, II. Esai).
    - Di setiap bagian, klik `Tambah Soal` dan pilih jenisnya, atau ambil dari **Bank Soal**.
    - Tulis pertanyaan Anda dan isi kunci jawaban di bagian bawah setiap soal.
4.  **Pratinjau & Cetak**:
    - Gunakan tab **Pratinjau** dan **Kunci Jawaban** untuk melihat hasil akhir. Perubahan disimpan secara otomatis.
    - Untuk mencetak, kembali ke **Arsip Ujian** dan klik ikon printer (🖨️) pada kartu ujian yang diinginkan.

## 💻 Instalasi Aplikasi (PWA)

Dapatkan akses lebih cepat dengan menginstal SoalGenius di perangkat Anda:

-   **Desktop (Chrome/Edge)**: Cari ikon 'Instal' (layar dengan panah ke bawah) di bilah alamat browser, lalu klik dan konfirmasi.
-   **Mobile (Android/Chrome)**: Buka menu browser (tiga titik) dan pilih 'Instal aplikasi' atau 'Tambahkan ke layar utama'.
-   **Mobile (iOS/Safari)**: Ketuk tombol 'Bagikan', gulir ke bawah, lalu pilih 'Tambahkan ke Layar Utama'.

## 🛠️ Tumpukan Teknologi

-   **Frontend**: React.js, TypeScript
-   **Editor Teks**: Quill.js
-   **Styling**: Tailwind CSS
-   **Penyimpanan Lokal**: Dexie.js (IndexedDB)
-   **Offline**: Service Workers (Progressive Web App)

## 🤝 Kontribusi & Dukungan

SoalGenius adalah proyek sumber terbuka yang dikembangkan dengan cinta untuk para pendidik. Kontribusi dan dukungan Anda sangat kami hargai! Jika Anda merasa aplikasi ini bermanfaat, berikut adalah beberapa cara untuk terlibat:

-   ⭐ **Beri Bintang di GitHub**: Bantu tingkatkan visibilitas proyek dengan memberi bintang pada [repositori ini](https://github.com/aiprojek/soalgeniusv2).
-   🐞 **Laporkan Bug atau Usulkan Fitur**: Jika Anda menemukan masalah atau punya ide keren, silakan buka *issue* baru di [halaman Issues kami](https://github.com/aiprojek/soalgeniusv2/issues).
-   💻 **Berkontribusi Kode**: Jika Anda ingin membantu pengembangan, silakan *fork* repositori ini dan buat *pull request*.
-   💬 **Bergabung dengan Komunitas**: Ikut serta dalam [grup diskusi Telegram](https://t.me/aiprojek_community/32) kami untuk bertanya, berbagi ide, atau sekadar menyapa.
-   ☕ **Dukung Pengembang**: Pertimbangkan untuk [mentraktir kami kopi](https://lynk.id/aiprojek/s/bvBJvdA). 

## 📄 Lisensi

Proyek ini dilisensikan di bawah **GNU General Public License v3.0**. Lihat file [LICENSE](https://www.gnu.org/licenses/gpl-3.0.html) untuk detail lengkap.

---
Dibuat dengan ❤️ untuk para pendidik.
