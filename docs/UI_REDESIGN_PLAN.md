# Rencana Redesign UI SoalGenius

Dokumen ini menjadi pegangan untuk pembenahan UI SoalGenius ke depan secara lebih menyeluruh. Fokusnya bukan sekadar mempercantik tampilan, tetapi membuat aplikasi benar-benar nyaman dipakai baik di mobile maupun desktop.

Dokumen ini melengkapi [docs/UI_GUIDELINES.md](/home/abdullah-home/Documents/GitHub/soalgeniusv2/docs/UI_GUIDELINES.md). Jika `UI_GUIDELINES` menjelaskan bahasa visual dan prinsip desain, dokumen ini menjelaskan arah redesign produk dan prioritas implementasi.

## Kesimpulan Jujur

UI SoalGenius saat ini sudah lebih rapi dibanding sebelumnya, tetapi masih belum benar-benar nyaman.

Masalah utamanya bukan hanya visual. Akar persoalannya ada pada:

- terlalu banyak informasi dan aksi muncul bersamaan
- struktur interaksi belum cukup tegas
- mobile dan desktop masih terasa sebagai adaptasi dari sistem yang sama, bukan dua pengalaman yang dirancang dengan kebutuhan berbeda
- bahasa visual mulai konsisten, tetapi arsitektur UX-nya belum cukup sederhana

Artinya, perbaikan berikutnya tidak cukup jika hanya berupa polishing kecil. Dibutuhkan redesign bertahap yang menyentuh alur utama aplikasi.

## Tujuan Redesign

Redesign dianggap berhasil jika:

- pengguna lebih cepat memahami apa yang harus dilakukan di setiap layar
- mobile tidak terasa sesak
- desktop tidak terasa penuh dan melelahkan
- aksi primer selalu jelas
- aksi sekunder tidak mengganggu fokus
- aplikasi terasa seperti alat kerja yang tenang, cepat, dan profesional

## Diagnosis Utama

### 1. Kepadatan antarmuka terlalu tinggi

Beberapa layar masih menampilkan terlalu banyak elemen setara:

- metadata
- aksi utama
- aksi sekunder
- status
- filter
- panel tambahan

Akibatnya, pengguna harus bekerja lebih keras untuk memutuskan fokus.

### 2. Hierarki aksi belum cukup kuat

Masih banyak kondisi di mana:

- terlalu banyak tombol tampil bersamaan
- semua aksi tampak sama penting
- tombol sekunder terlalu dekat dengan tombol primer

Akibatnya, layar terasa sibuk dan melelahkan.

### 3. Mobile dan desktop belum dipisahkan secara konseptual

Saat ini keduanya sudah responsif, tetapi belum cukup dibedakan secara strategi:

- mobile seharusnya lebih linear, fokus, dan hemat elemen
- desktop seharusnya lebih kaya konteks, tapi tetap terstruktur

### 4. Layar kerja belum cukup “bernafas”

Masih ada area yang:

- terlalu banyak sticky/fixed control
- jarak visual antar blok belum ideal
- konten inti kalah oleh chrome UI

Ini paling terasa di editor dan preview.

## Prinsip Redesign Produk

### 1. Satu layar, satu fokus utama

Setiap layar harus memiliki satu tujuan dominan.

Contoh:

- Arsip: menemukan dan membuka ujian
- Editor: menyusun isi ujian
- Preview: memeriksa hasil dan export
- Settings: mengubah preferensi dan konfigurasi

### 2. Aksi sekunder harus turun satu level

Jangan tampilkan semua aksi sekaligus.

Gunakan:

- bottom sheet
- dropdown terarah
- menu overflow
- section lanjutan

### 3. Konten utama harus menang

Di layar kerja seperti editor dan preview:

- ruang terbesar harus diberikan ke konten
- toolbar, badge, indikator, dan helper text harus mendukung, bukan mendominasi

### 4. Mobile dan desktop harus diperlakukan sebagai dua mode kerja

Mobile:

- lebih ringkas
- lebih linear
- aksi utama besar dan jelas
- sedikit elemen per layar

Desktop:

- boleh lebih kaya konteks
- lebih banyak shortcut
- lebih banyak panel paralel
- tetapi tetap punya hirarki kuat

## Prioritas Halaman

Redesign total sebaiknya dimulai dari empat halaman utama:

- Arsip
- Editor
- Preview
- Settings

Halaman lain mengikuti setelah fondasi ini stabil.

## Arah Redesign Per Halaman

### 1. Arsip

#### Masalah saat ini

- kartu ujian masih menyimpan terlalu banyak beban
- filter, pencarian, dan aksi belum cukup terstruktur
- pengguna melihat terlalu banyak pilihan sejak awal

#### Tujuan redesign

- membuat daftar ujian cepat dipindai
- membuat aksi utama sangat jelas
- membuat pengelolaan arsip terasa ringan

#### Arah mobile

- kartu fokus pada:
  - judul
  - status
  - mapel/kelas
  - tanggal/jumlah soal
- aksi utama hanya:
  - edit
  - preview
  - overflow
- filter ditempatkan sebagai bar ringkas atau sheet

#### Arah desktop

- daftar/grid lebih informatif
- filter bisa tampil lebih lengkap
- hover/quick action tetap ada tapi tidak mendominasi

#### Wireframe tekstual mobile

- header: `Arsip`, search
- row filter ringkas: `Folder`, `Label`
- CTA utama: `Buat Ujian`
- daftar kartu:
  - status
  - judul
  - metadata
  - 2 tombol utama + 1 overflow

### 2. Editor

#### Masalah saat ini

- terlalu banyak kontrol dalam satu viewport
- area kerja bersaing dengan header, status, pagination, dan toolbar
- struktur section dan question builder masih terasa berat

#### Tujuan redesign

- membuat editor terasa tenang
- membuat input soal lebih mudah diproses mental
- mengurangi rasa “form besar yang melelahkan”

#### Arah mobile

- header sangat ringkas:
  - back
  - status
  - save
- informasi ujian jadi section yang bisa diringkas
- builder soal lebih modular
- aksi tambahan pindah ke sheet
- pagination jangan terasa seperti bar besar yang mengunci layar

#### Arah desktop

- panel informasi ujian bisa tetap penuh
- toolbar lebih kaya, tapi terstruktur
- section builder lebih jelas antar blok

#### Wireframe tekstual mobile

- top bar tipis
- card `Info Ujian` collapsible
- daftar `Bagian Soal`
- tiap bagian:
  - judul/instruksi
  - daftar soal
  - tombol `Tambah Soal`
- bottom capsule untuk paging jika perlu

### 3. Preview

#### Masalah saat ini

- preview masih terlalu seperti kertas desktop yang diperkecil
- kontrol export dan tampilan belum cukup fokus
- mobile preview belum terasa native

#### Tujuan redesign

- membuat preview nyaman untuk review cepat
- membuat export sangat jelas
- mempertahankan fidelity dokumen tanpa mengorbankan kenyamanan

#### Arah mobile

- mode `Soal / Kunci` tampil langsung
- `Export` jadi aksi utama yang jujur
- zoom cukup minimal
- viewer dibingkai lembut agar terasa sebagai lembar dokumen

#### Arah desktop

- toolbar bisa tetap kaya
- tetapi pengelompokan aksi harus lebih jelas:
  - tampilan
  - export
  - cetak

#### Wireframe tekstual mobile

- bar atas: back, export
- sub-bar: judul + zoom + toggle soal/kunci
- area preview kertas
- export sheet dengan format:
  - Word
  - HTML
  - Moodle XML
  - Cetak/PDF

### 4. Settings

#### Masalah saat ini

- masih terasa seperti tab desktop yang dikecilkan
- banyak section masih terlalu form-heavy
- user belum cukup dibantu memahami prioritas tiap bagian

#### Tujuan redesign

- membuat settings terasa sebagai pusat konfigurasi yang mudah dipahami
- mengurangi rasa “halaman teknis”
- membantu pengguna memahami fungsi tiap section

#### Arah mobile

- gunakan section picker atau daftar kategori
- setiap kategori punya deskripsi singkat
- isi dibuat seperti panel-card, bukan lembar form panjang tanpa ritme

#### Arah desktop

- tab atau segmented nav tetap boleh
- tetapi tiap halaman isi harus punya struktur visual kuat

#### Wireframe tekstual mobile

- header `Pengaturan`
- active section summary
- selector category
- card isi per kategori

## Sistem Komponen yang Harus Distabilkan

Sebelum redesign besar masuk terlalu jauh, komponen ini harus dianggap final atau semi-final:

- App header
- Bottom navigation
- Tab shell
- Card shell
- Form field
- Status badge
- Bottom sheet
- Modal
- Empty state
- Loading state
- Action row

Jika komponen-komponen ini masih berubah liar, redesign akan terasa tidak selesai-selesai.

## Strategi Implementasi

### Fase 1: Wireframe

Jangan mulai dari coding penuh.

Lakukan:

- wireframe tekstual mobile
- wireframe tekstual desktop
- validasi alur utama

Prioritas:

1. Arsip
2. Editor
3. Preview
4. Settings

### Fase 2: Build ulang shell halaman

Implementasi struktur dulu:

- header
- area konten
- panel aksi
- sheet
- tab/filter bar

Belum perlu fokus penuh pada detail warna.

### Fase 3: Design system application

Setelah struktur kuat, baru ratakan:

- spacing
- status colors
- emphasis
- hover/focus
- motion

### Fase 4: QA berbasis alur

Uji 5 alur nyata:

1. buat ujian baru
2. edit banyak soal
3. import dari teks
4. preview lalu export
5. backup/cloud sync

## Hal yang Harus Dihindari

- redesign per bagian tanpa arah keseluruhan
- terlalu banyak eksperimen visual sebelum alur beres
- menyamakan kebutuhan mobile dan desktop
- menambah aksi baru sebelum aksi lama diprioritaskan
- memoles detail kecil sebelum struktur utama sehat

## Rekomendasi Praktis

Jika hanya boleh memilih satu titik mulai, pilih:

### Opsi terbaik

- **Editor**

Alasannya:

- ini pusat nilai produk
- layar paling kompleks
- dampak kenyamanannya paling besar

### Opsi paling aman

- **Arsip**

Alasannya:

- lebih mudah dibangun ulang
- cepat memberi kesan bahwa aplikasi lebih ringan
- bagus sebagai fondasi pola kartu dan aksi

## Keputusan yang Disarankan

Mulai redesign total dengan urutan:

1. Arsip
2. Editor
3. Preview
4. Settings

Alasan urutan ini:

- Arsip menetapkan pola discovery dan card
- Editor menyelesaikan pusat kerja
- Preview menyelesaikan output
- Settings menyelesaikan konfigurasi

## Penutup

UI SoalGenius tidak membutuhkan lebih banyak ornamen.

Yang dibutuhkan adalah:

- lebih sedikit beban per layar
- hirarki aksi yang lebih jelas
- pemisahan strategi mobile dan desktop
- struktur kerja yang lebih tenang

Dengan kata lain, pembenahan total berikutnya harus dipimpin oleh **penyederhanaan pengalaman**, bukan sekadar perapihan tampilan.

---

# Wireframe Detail: Arsip

Bagian ini adalah turunan langsung dari rencana redesign. Fokusnya hanya satu halaman: `Arsip`.

Tujuannya:

- membuat daftar ujian cepat dipindai
- memperjelas aksi utama
- membuat mobile dan desktop punya strategi yang berbeda tetapi tetap satu sistem

## Tujuan Halaman Arsip

Pengguna datang ke halaman Arsip untuk 4 hal:

- menemukan ujian yang sudah ada
- membuat ujian baru
- memfilter arsip
- membuka ujian untuk diedit atau dipreview

Halaman ini **bukan** tempat untuk menampilkan semua aksi detail sekaligus.

## Prioritas Informasi

Setiap kartu ujian hanya perlu menonjolkan:

1. status
2. judul
3. mapel dan kelas
4. metadata ringkas
5. aksi primer

Aksi lain turun ke overflow.

---

## Wireframe Mobile

### Struktur Halaman

1. Header halaman
2. Search bar
3. Filter row
4. CTA utama
5. Daftar kartu ujian
6. Bottom nav global aplikasi

### Wireframe Tekstual

```text
[Header]
Arsip Soal
Subteks pendek: Kelola dan temukan ujian Anda

[Search]
[ Cari judul, mapel, atau kelas... ]

[Filter Row]
[ Folder ] [ Label ] [ Sortir ]

[Primary CTA]
[ + Buat Ujian Baru ]

[List]
--------------------------------
[Status]        [Overflow]
Judul Ujian
Mapel • Kelas
Tanggal • 25 soal

[ Edit ] [ Preview ]
--------------------------------

[Status]        [Overflow]
Judul Ujian
Mapel • Kelas
Tanggal • 40 soal

[ Edit ] [ Preview ]
--------------------------------
```

### Penjelasan Interaksi Mobile

#### Header

- Hanya berisi judul halaman dan subteks singkat.
- Tidak perlu terlalu banyak badge atau indikator tambahan.

#### Search

- Search selalu terlihat.
- Ini harus menjadi entry point paling cepat untuk menemukan arsip.

#### Filter Row

- Filter cukup 2-3 pill.
- Jangan tampilkan semua kontrol sekaligus.
- `Sortir` bisa membuka sheet kecil:
  - terbaru
  - terlama
  - nama A-Z
  - ukuran terbesar

#### Primary CTA

- `Buat Ujian Baru` harus sangat jelas dan berada sebelum daftar.
- Di mobile, CTA ini boleh sticky ringan jika diperlukan, tetapi jangan terlalu agresif.

#### Exam Card Mobile

- Aksi utama hanya:
  - `Edit`
  - `Preview`
- Aksi sekunder masuk ke overflow:
  - generator paket
  - acak sederhana
  - duplikat
  - pindah folder
  - label
  - hapus

#### Overflow Sheet

```text
Judul Ujian
Aksi tambahan

- Generator Paket
- Acak Sederhana
- Duplikat
- Pindah Folder
- Kelola Label
- Hapus Ujian
```

#### Empty State Mobile

```text
[Icon]
Belum ada ujian
Mulai dengan membuat ujian baru atau ubah filter pencarian

[ + Buat Ujian ]
```

#### Loading State Mobile

- Gunakan 2-3 skeleton card sederhana.
- Hindari hanya teks `Memuat...`.

---

## Wireframe Desktop

### Struktur Halaman

1. Header halaman + CTA
2. Search dan filter toolbar
3. Grid kartu ujian
4. Pagination atau infinite list

### Wireframe Tekstual

```text
[Header]
Arsip Soal
Subteks pendek
                                 [ + Buat Ujian Baru ]

[Toolbar]
[ Cari ujian..................... ] [ Folder ] [ Label ] [ Sortir ]

[Grid 3 kolom]
---------------------------------------------------------
[Status]                [Quick actions hover/overflow]
Judul
Mapel • Kelas
Label kecil
Tanggal • 25 soal

[ Edit ] [ Preview ]
---------------------------------------------------------
```

### Penjelasan Interaksi Desktop

#### Header

- CTA `Buat Ujian Baru` tetap di kanan atas.
- Jangan digabung terlalu rapat dengan filter.

#### Toolbar

- Search lebih dominan daripada filter.
- Filter tampil sebagai control sekunder.

#### Exam Card Desktop

- Card boleh sedikit lebih informatif daripada mobile.
- Quick actions boleh muncul lebih banyak saat hover, tetapi tetap jangan kembali ke pola 8 aksi selalu terlihat.
- Rekomendasi:
  - tampil default: `Edit`, `Preview`
  - tampil saat hover: ikon kecil sekunder atau tombol overflow

#### Metadata

- Jangan terlalu banyak tag.
- Maksimal 2 label terlihat, sisanya `+N`.

#### Pagination

- Jika pagination dipertahankan, letakkan di bawah daftar secara natural.
- Hindari footer fixed di desktop untuk halaman arsip.

---

## Komponen yang Dibutuhkan

Untuk mewujudkan wireframe Arsip, komponen yang perlu distabilkan:

- `ArchiveHeader`
- `ArchiveSearchBar`
- `ArchiveFilterBar`
- `ExamCard`
- `ExamOverflowSheet`
- `ArchiveEmptyState`
- `ArchiveLoadingSkeleton`

## Aturan Desain Khusus Arsip

- Satu kartu tidak boleh terasa seperti toolbar.
- Judul lebih penting daripada aksi tambahan.
- Search lebih penting daripada filter.
- CTA `Buat Ujian Baru` harus selalu mudah ditemukan.
- Status harus terbaca dalam sekali lihat.

## Hal yang Tidak Boleh Kembali

- 8 aksi selalu terlihat di semua kartu mobile
- filter terlalu banyak dalam satu baris tanpa prioritas
- empty state yang terlalu datar
- metadata yang terlalu ramai
- kartu yang terlihat seperti panel utilitas, bukan item arsip

## Rekomendasi Implementasi Arsip

Urutan implementasi:

1. rapikan struktur header dan toolbar
2. finalkan bentuk kartu ujian baru
3. finalkan overflow sheet untuk aksi sekunder
4. buat empty state dan loading skeleton
5. baru setelah itu evaluasi filter dan pagination

## Kriteria Selesai untuk Arsip

Halaman Arsip dianggap selesai jika:

- pengguna bisa memahami isi satu kartu dalam kurang dari 2 detik
- pengguna bisa membuat ujian baru tanpa mencari-cari
- pengguna bisa menemukan ujian dengan search/filter tanpa kebingungan
- pengguna mobile tidak merasa kartu terlalu padat
- pengguna desktop tetap merasa cepat dan efisien

---

# Wireframe Detail: Editor

Editor adalah pusat nilai produk SoalGenius. Redesign editor harus diperlakukan sebagai redesign layar kerja utama, bukan sekadar form panjang.

## Tujuan Halaman Editor

Pengguna datang ke editor untuk:

- mengisi informasi ujian
- menyusun bagian soal
- menulis dan mengedit soal
- menambahkan soal dari bank, AI, atau smart import
- menyimpan pekerjaan dengan tenang

## Prioritas Informasi

Urutan kepentingan di editor:

1. konten soal
2. struktur bagian
3. aksi simpan / status
4. informasi ujian
5. aksi tambahan

Yang penting: editor tidak boleh terasa seperti kumpulan panel kontrol yang menekan konten.

---

## Wireframe Mobile

### Struktur Halaman

1. Top bar ringkas
2. Ringkasan ujian
3. Card info ujian yang bisa diringkas
4. Daftar section
5. Tiap section berisi daftar soal
6. Aksi tambah soal
7. Pagination ringan jika memang tetap dipakai

### Wireframe Tekstual

```text
[Top Bar]
[Back] Judul Ujian              [Status] [Simpan]
Halaman 1/3

[Exam Summary Card]
Mapel • Kelas • Tanggal
[Tampilkan Detail]

[Section Card]
Bagian 1
Instruksi singkat

[Soal 1]
Konten soal...
[Edit opsi / jawaban]

[Soal 2]
Konten soal...

[ + Tambah Soal ]
[ Dari Bank ] [ AI ] [ Smart Import ]

[Section Card]
Bagian 2
...

[ + Tambah Bagian ]

[Pagination Capsule]
[ < ] Halaman 1 dari 3 [ > ]
```

### Penjelasan Interaksi Mobile

#### Top Bar

- hanya memuat:
  - kembali
  - judul
  - status
  - simpan
- undo/redo dan aksi lain masuk ke sheet atau menu sekunder

#### Ringkasan Ujian

- tampil singkat dulu
- informasi lengkap masuk ke card collapsible

#### Info Ujian

- default boleh dalam kondisi terbuka saat pertama masuk
- saat konten soal sudah banyak, pengguna bisa collapse
- isinya:
  - judul
  - mapel
  - kelas
  - tanggal
  - layout
  - petunjuk umum

#### Section Card

- tiap section harus terasa sebagai blok kerja yang jelas
- jangan biarkan tiap section terlihat seperti satu panel besar yang berat

#### Soal

- tampilkan satu card per soal
- toolbar dan kontrol tidak boleh meledak sekaligus
- aksi per soal:
  - simpan ke bank
  - hapus
  - opsi tambahan

#### Tambah Soal

- tombol utama cukup satu: `Tambah Soal`
- saat ditekan, munculkan sheet:
  - Pilihan Ganda
  - Esai
  - Tipe lain
  - Ambil dari Bank
  - AI Generator
  - Smart Import

#### Pagination

- jika pagination dipertahankan, tampilkan sebagai capsule kecil, bukan bar penuh yang menekan layar

---

## Wireframe Desktop

### Struktur Halaman

1. Top bar editor
2. Dua area utama:
   - panel info ujian
   - area konten soal
3. Section cards
4. Pagination natural di bawah

### Wireframe Tekstual

```text
[Top Bar]
[Back] Judul Ujian      status autosave      [Status] [Simpan]

[Main Area]
--------------------------------------------------------------
| Info Ujian Card         | Area Section dan Soal            |
| Judul                   | Bagian 1                         |
| Mapel                   | Instruksi                        |
| Kelas                   | [Soal 1]                         |
| Tanggal                 | [Soal 2]                         |
| Layout                  | [Tambah Soal]                    |
| Petunjuk                |                                  |
--------------------------------------------------------------

[ + Tambah Bagian ]
[ Pagination ]
```

### Penjelasan Interaksi Desktop

#### Top Bar

- tetap ramping
- autosave indicator cukup kecil
- status tetap terlihat

#### Info Ujian Panel

- boleh selalu tampil di desktop
- tetapi tidak boleh terlalu dominan secara visual

#### Area Konten

- section harus menjadi inti perhatian
- setiap soal adalah card kerja

#### Action Density

- desktop boleh sedikit lebih kaya
- tetapi tetap batasi aksi yang selalu terlihat

---

## Komponen yang Dibutuhkan

- `EditorTopBar`
- `EditorSummaryCard`
- `EditorInfoPanel`
- `SectionCard`
- `QuestionCard`
- `AddQuestionSheet`
- `EditorPaginationCapsule`

## Aturan Desain Khusus Editor

- soal harus menjadi pusat visual
- informasi ujian adalah konteks, bukan fokus utama
- status dan simpan harus selalu jelas
- aksi tambahan tidak boleh mendominasi
- layar mobile tidak boleh terasa “tertutup” sticky bar

## Hal yang Tidak Boleh Kembali

- terlalu banyak kontrol sticky sekaligus
- info ujian terlalu besar sepanjang waktu
- aksi tambah soal tersebar ke terlalu banyak tombol setara
- satu soal terasa seperti form besar yang melelahkan

## Rekomendasi Implementasi Editor

1. rapikan top bar
2. buat exam summary + info panel/collapsible
3. finalkan section card
4. finalkan question card
5. satukan flow tambah soal ke satu pintu masuk
6. evaluasi ulang pagination

## Kriteria Selesai untuk Editor

- pengguna merasa konten soal lebih dominan daripada chrome UI
- pengguna mobile bisa bekerja lebih lama tanpa cepat lelah
- aksi simpan dan status selalu jelas
- struktur section mudah dipahami

---

# Wireframe Detail: Preview

Preview adalah jembatan antara proses menulis soal dan hasil akhir dokumen.

## Tujuan Halaman Preview

Pengguna datang ke preview untuk:

- memeriksa hasil tampilan
- beralih antara soal dan kunci
- mencetak
- mengekspor dokumen

## Prioritas Informasi

1. lembar dokumen
2. mode preview
3. export / print
4. zoom

Preview tidak boleh terasa seperti halaman toolbar.

---

## Wireframe Mobile

### Struktur Halaman

1. Top bar
2. Ringkasan preview
3. Toggle soal/kunci
4. Area preview
5. Export sheet

### Wireframe Tekstual

```text
[Top Bar]
[Back]                         [Export]

[Preview Meta]
Judul Ujian
Soal • 92%
[ - ] [ + ]

[Toggle]
[ Soal ] [ Kunci ]

[Document Viewer]
[ lembar preview ]

[Export Sheet]
- Word
- HTML
- Moodle XML
- Cetak / Simpan PDF
```

### Penjelasan Interaksi Mobile

- tombol utama harus `Export`, bukan label generik
- toggle soal/kunci harus selalu terlihat
- zoom cukup minimal
- viewer framed softly agar terasa seperti dokumen kerja

---

## Wireframe Desktop

### Struktur Halaman

1. Top bar
2. Group actions
3. Centered document

### Wireframe Tekstual

```text
[Back]   Judul Ujian / Mode

[Group 1: Zoom]
[ - ] 100% [ + ]

[Group 2: Mode]
[ Soal ] [ Kunci ]

[Group 3: Export]
[ Word ] [ HTML ] [ Cetak ] [ Moodle ]

[Document]
[ centered paper preview ]
```

### Penjelasan Interaksi Desktop

- kelompokkan aksi jelas:
  - zoom
  - mode
  - export
- jangan campur semua jadi satu deret yang setara

---

## Komponen yang Dibutuhkan

- `PreviewTopBar`
- `PreviewMetaCard`
- `PreviewModeToggle`
- `PreviewExportSheet`
- `PreviewDocumentFrame`

## Aturan Desain Khusus Preview

- dokumen harus terasa sebagai hasil utama
- export harus sangat jelas
- mobile harus fokus pada review cepat
- desktop harus fokus pada fidelity dan export

## Hal yang Tidak Boleh Kembali

- tombol berlabel generik seperti `Opsi`
- toolbar terlalu padat di mobile
- preview terasa seperti iframe mentah tanpa framing

## Rekomendasi Implementasi Preview

1. finalkan top bar mobile/desktop
2. finalkan export sheet mobile
3. finalkan toolbar grouping desktop
4. evaluasi framing dokumen

## Kriteria Selesai untuk Preview

- pengguna langsung tahu bagaimana export
- pengguna mudah berpindah antara soal dan kunci
- preview mobile tidak terasa seperti versi desktop yang dipaksa kecil

---

# Wireframe Detail: Settings

Settings adalah pusat konfigurasi, bukan halaman teknis yang melelahkan.

## Tujuan Halaman Settings

Pengguna datang ke settings untuk:

- mengatur tampilan
- mengatur format dokumen
- mengelola AI
- mengelola cloud
- mengelola backup/data

## Prioritas Informasi

1. kategori pengaturan
2. penjelasan singkat kategori
3. aksi dan input paling penting
4. detail lanjutan

---

## Wireframe Mobile

### Struktur Halaman

1. Header
2. Active section card
3. Section selector
4. Card isi kategori

### Wireframe Tekstual

```text
[Header]
Pengaturan

[Active Section Card]
Icon
Kategori aktif
Deskripsi singkat

[Selector]
[ Pilih kategori ]

[Content Card]
Judul kategori
Deskripsi

[Sub Card]
Input / toggle / action
```

### Penjelasan Interaksi Mobile

- jangan pakai tab horizontal panjang sebagai pola utama
- kategori aktif harus punya konteks singkat
- tiap kategori harus terasa sebagai modul terpisah

#### Kategori `Umum`

- tema
- mode offline

#### Kategori `Kop`

- baris kop
- logo

#### Kategori `Kertas`

- ukuran kertas
- font
- margin

#### Kategori `AI`

- API key
- penjelasan singkat

#### Kategori `Cloud`

- status
- setup perangkat utama
- pairing perangkat kedua

#### Kategori `Data`

- storage usage
- backup
- restore

---

## Wireframe Desktop

### Struktur Halaman

1. Header
2. Tab shell / segmented category
3. Content panel per kategori

### Wireframe Tekstual

```text
[Header]
Pengaturan

[Tab Shell]
[ Umum ] [ Kop ] [ Kertas ] [ AI ] [ Cloud ] [ Data ]

[Content]
Panel kategori aktif
```

### Penjelasan Interaksi Desktop

- tab boleh tetap ada
- tetapi isi kategori harus punya blok-blok yang jelas
- satu kategori tidak boleh terlihat seperti satu form panjang tanpa ritme

---

## Komponen yang Dibutuhkan

- `SettingsHeader`
- `SettingsCategoryCard`
- `SettingsSectionSelector`
- `SettingsPanel`
- `SettingsSubCard`

## Aturan Desain Khusus Settings

- kategorikan dengan jelas
- jangan tampilkan terlalu banyak field tanpa pengantar
- gunakan sub-card untuk memecah form besar
- jelaskan konteks trust/risk jika menyangkut cloud dan credential

## Hal yang Tidak Boleh Kembali

- tab mobile yang terlalu panjang dan terasa desktop-first
- satu panel kategori terasa seperti form datar yang panjang
- aksi penting bercampur dengan field sekunder tanpa hirarki

## Rekomendasi Implementasi Settings

1. finalkan category shell mobile
2. finalkan tab shell desktop
3. pecah kategori besar menjadi sub-card
4. rapikan copy penjelas
5. finalkan CTA utama per kategori

## Kriteria Selesai untuk Settings

- pengguna paham fungsi setiap kategori tanpa banyak membaca
- mobile terasa seperti pusat pengaturan yang ringan
- desktop tetap cepat dan efisien

---

# Ringkasan Urutan Implementasi Lanjutan

Setelah wireframe detail tersedia, urutan eksekusi yang direkomendasikan:

1. Arsip
2. Editor
3. Preview
4. Settings

Jika semua empat halaman ini stabil, barulah halaman sekunder seperti:

- Help
- Question Bank
- modal khusus
- utilitas tambahan

diikuti dengan konsolidasi final.
