# Panduan UI SoalGenius

Dokumen ini menjadi acuan perubahan UI SoalGenius ke depan. Tujuannya bukan mengejar tampilan yang sekadar "cantik", tetapi membuat aplikasi terasa lebih fokus, nyaman dipakai di ponsel, dan konsisten sebagai alat kerja guru yang serius namun tetap hangat.

## Arah Visual

SoalGenius memakai arah **soft editorial utility**.

Karakter utamanya:

- Bersih dan fungsional seperti alat kerja.
- Hangat dan ringan, tidak terlalu dingin seperti dashboard SaaS generik.
- Tetap jelas dan kontras, tidak mengorbankan keterbacaan demi gaya.
- Memprioritaskan ritme baca, hierarki, dan kenyamanan sentuh di mobile.

## Kenapa Bukan Neomorphism

Neomorphism penuh tidak dipilih karena:

- Kontras tombol, input, dan status menjadi terlalu lembut.
- Banyak elemen form dan aksi cepat di aplikasi ini butuh affordance yang tegas.
- Di layar kecil, elemen neumorphic cenderung tampak menyatu dan membuat antarmuka terasa kabur.

Elemen soft depth tetap boleh dipakai secara terbatas, tetapi hanya sebagai aksen halus pada:

- segmented control
- floating action
- state aktif
- sheet atau panel tertentu

## Prinsip Desain

1. Mobile-first adalah alur utama, bukan fallback.
2. Satu layar hanya menonjolkan satu fokus utama.
3. Aksi sekunder dipindah ke menu, sheet, atau overflow.
4. Komponen harus terasa ringan, cepat, dan jelas disentuh.
5. Dokumen, soal, dan konten pendidikan tetap menjadi pusat perhatian.

## Ciri Visual Utama

### Palet

- Dasar: paper, slate, ink.
- Aksen utama: cobalt.
- Aksen status: teal untuk berhasil, amber untuk perhatian, rose untuk destruktif.

### Surface

- Latar belakang utama terasa seperti "meja kerja" yang lembut.
- Card menggunakan elevasi halus, bukan shadow tebal.
- Border tetap penting untuk membantu pemisahan antar area.

### Radius

- Card utama: 14-18px.
- Input, button, tab, pill: 10-12px.
- Sheet dan modal mobile: 20-24px di bagian atas.

### Shadow

- Pendek, lembut, dan hemat.
- Gunakan shadow sebagai dukungan, bukan identitas utama.

### Tipografi

- UI Latin: gunakan font modern yang ramah mobile seperti `Plus Jakarta Sans`, `Manrope`, atau `DM Sans`.
- Konten Arab tetap memakai font khusus yang sudah mendukung kebutuhan soal.
- Heading harus tegas, body text harus santai dan mudah dipindai.

### Motion

- Gunakan transisi singkat dan purposeful.
- Hindari animasi dekoratif berlebihan.
- Prioritaskan animasi untuk navigasi, sheet, state aktif, dan feedback.

## Aturan Mobile-First

### Navigasi

- Mobile memakai bottom navigation untuk tujuan utama.
- Burger menu dipakai untuk tujuan sekunder.
- Header mobile harus ringkas dan fokus.

### Kartu dan Daftar

- Kartu di mobile tidak boleh memuat terlalu banyak aksi setara.
- Aksi utama tampil langsung, aksi lain masuk menu "Aksi".
- Metadata harus mudah dipindai dalam 1-2 sapuan mata.

### Editor

- Toolbar mobile harus prioritas pada aksi inti.
- Hindari terlalu banyak elemen sticky/fixed yang menggerus area kerja.
- Konten editor harus menang atas chrome UI.

### Settings

- Pengaturan di mobile harus lebih mirip daftar section daripada tab desktop yang dipaksa.
- Prioritaskan kelompok penting lebih dulu: tampilan, format, cloud, AI, storage.

### Preview

- Mobile preview fokus pada review dan export cepat.
- Jangan memperlakukan layar ponsel sebagai kertas A4 mini tanpa adaptasi.

## Pola Komponen

### Shell

- Gunakan shell yang lebih breathable di mobile.
- Header dan bottom nav menjadi kerangka utama.
- Footer dekoratif bisa disederhanakan atau disembunyikan di mobile.

### Buttons

- Primary: solid accent.
- Secondary: filled soft surface.
- Tertiary: minimal, text/icon only.
- Destructive: tinted, tidak perlu terlalu berteriak.

### Inputs

- Gunakan background surface yang sedikit berbeda dari halaman.
- Border jelas, focus ring konsisten, placeholder tidak terlalu pucat.

### Cards

- Card adalah container kerja, bukan sekadar kotak dekoratif.
- Usahakan maksimal 3 level informasi: judul, metadata, aksi.

## Prioritas Redesign

### Fase 1

- Fondasi token warna, radius, shadow, dan spacing.
- Shell mobile: header, bottom nav, spacing konten.
- Konsistensi surface antar halaman.

### Fase 2

- Arsip: card lebih fokus, action overflow.
- Editor: header mobile lebih ramping, toolbar lebih efektif.
- Settings: struktur mobile lebih jelas.

### Fase 3

- Preview mode mobile.
- Modal, sheet, dan micro-interaction.
- Polishing visual akhir.

## Batasan

- Jangan mengorbankan kejelasan demi style.
- Jangan menggunakan gradien, glow, atau shadow berat sebagai solusi default.
- Jangan menambah variasi warna baru tanpa alasan sistemik.
- Jangan membuat komponen mobile menjadi miniatur desktop.

## Definisi Keberhasilan

Perubahan UI dianggap berhasil jika:

- layar mobile terasa lebih lega
- aksi utama lebih cepat ditemukan
- hierarki visual lebih jelas
- komponen lebih konsisten
- aplikasi terasa seperti alat kerja profesional, bukan kumpulan panel utilitas
