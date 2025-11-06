import React from 'react';
import { CoffeeIcon, GithubIcon, DiscussionIcon } from '../components/Icons';

const FeatureCard = ({ icon, title, children }: { icon: string, title: string, children: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
      <i className={`bi ${icon} text-xl`}></i>
    </div>
    <div>
      <h3 className="font-semibold text-lg text-[var(--text-primary)]">{title}</h3>
      <p className="text-[var(--text-secondary)] text-sm mt-1">{children}</p>
    </div>
  </div>
);

const GuideStep = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold bg-[var(--bg-accent)] text-[var(--text-on-accent)]">
      {number}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-1">{title}</h3>
      <div className="text-[var(--text-secondary)] text-sm space-y-2">
        {children}
      </div>
    </div>
  </div>
);

const HelpView = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center p-4">
        <h1 className="text-5xl font-bold text-[var(--text-primary)]">SoalGenius</h1>
        <p className="text-lg font-semibold text-[var(--text-accent)] mt-1">Versi 2.0</p>
      </div>

      {/* Description, Developer & License */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <p className="text-center text-[var(--text-secondary)] leading-relaxed text-base">
          Aplikasi untuk membantu para pendidik membuat, mengelola, dan mencetak soal ujian. Setelah dimuat, aplikasi dapat dijalankan <strong>sepenuhnya offline</strong>. Semua data Anda disimpan dengan aman di browser Anda.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--border-primary)] text-center text-sm text-[var(--text-secondary)] space-y-1">
          <p>
            <strong>Pengembang:</strong> <a href="https://www.aiprojek01.my.id/" target="_blank" rel="noopener noreferrer" className="text-[var(--text-accent)] hover:underline">AI Projek</a>
          </p>
          <p>
            <strong>Lisensi:</strong> <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-[var(--text-accent)] hover:underline">GNU General Public License v3 (GPLv3)</a>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">Fitur Unggulan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* FIX: Converted self-closing FeatureCard components to include children content as required by the component's props. */}
          <FeatureCard icon="bi-pencil-square" title="Editor Canggih">
            Format teks (bold, italic), sisipkan gambar, atur perataan, dan gunakan superskrip/subskrip dengan mudah.
          </FeatureCard>
           <FeatureCard icon="bi-list-ol" title="Berbagai Jenis Soal">
            Mendukung Pilihan Ganda (termasuk kompleks), Esai, Isian Singkat, Menjodohkan, Benar-Salah, hingga Tabel Isian.
          </FeatureCard>
          <FeatureCard icon="bi-eye-fill" title="Pratinjau Langsung">
            Lihat tampilan akhir soal atau kunci jawaban secara real-time saat mengedit melalui tab "Pratinjau".
          </FeatureCard>
          <FeatureCard icon="bi-translate" title="Dukungan Teks Arab (RTL)">
            Tulis soal berbahasa Arab dengan mudah. Arah teks, penomoran, dan tata letak otomatis menyesuaikan.
          </FeatureCard>
          <FeatureCard icon="bi-rulers" title="Format Kertas Fleksibel">
            Atur ukuran kertas (A4, F4), margin, jenis dan ukuran font, serta spasi baris sesuai kebutuhan di menu Pengaturan.
          </FeatureCard>
          <FeatureCard icon="bi-layout-split" title="Tata Letak Kolom Ganda">
            Hemat kertas dengan mengatur soal agar tampil dalam format dua kolom secara otomatis pada pratinjau.
          </FeatureCard>
          <FeatureCard icon="bi-file-earmark-arrow-down-fill" title="Ekspor & Cetak">
            Simpan ujian sebagai file HTML mandiri atau cetak langsung ke printer/PDF dari halaman Pratinjau.
          </FeatureCard>
          <FeatureCard icon="bi-journal-richtext" title="Bank Soal Personal">
            Simpan soal-soal terbaik Anda untuk digunakan kembali di ujian lain, mempercepat proses pembuatan soal.
          </FeatureCard>
           <FeatureCard icon="bi-shuffle" title="Acak Soal (Varian)">
            Buat varian soal yang berbeda secara otomatis dari satu naskah ujian untuk mencegah kecurangan.
          </FeatureCard>
           <FeatureCard icon="bi-cloud-arrow-up-fill" title="Backup & Restore Data">
            Amankan semua data ujian dan pengaturan Anda dalam satu file JSON, dan pulihkan kapan saja dengan mudah.
          </FeatureCard>
           <FeatureCard icon="bi-wifi-off" title="100% Offline">
            Setelah halaman dimuat pertama kali, aplikasi tidak lagi memerlukan koneksi internet untuk bekerja.
          </FeatureCard>
           <FeatureCard icon="bi-moon-stars-fill" title="Mode Terang & Gelap">
            Pilih tema tampilan yang nyaman untuk mata Anda, baik saat bekerja di siang hari maupun malam hari.
          </FeatureCard>
          <FeatureCard icon="bi-app-indicator" title="Aplikasi Instan (PWA)">
            Instal SoalGenius di desktop atau ponsel Anda untuk pengalaman seperti aplikasi asli. Akses lebih cepat dan mudah.
          </FeatureCard>
        </div>
      </div>

      {/* User Guide */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">Panduan Cepat</h2>
        <div className="space-y-8">
           {/* FIX: Converted self-closing GuideStep components to include children content as required by the component's props. */}
           <GuideStep number={1} title="Membuat & Mengelola Ujian">
             <p>Dari halaman utama <strong className="text-[var(--text-accent)]">Arsip Ujian</strong>, klik tombol <code className="bg-[var(--bg-muted)] px-2 py-1 rounded">Buat Ujian Baru</code> untuk memulai. Gunakan ikon-ikon pada setiap kartu ujian untuk mengedit, mencetak, mengacak, menyalin, atau menghapus ujian.</p>
           </GuideStep>
           <GuideStep number={2} title="Menggunakan Editor Soal">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Informasi Ujian:</strong> Isi detail seperti Judul, Mapel, dan Kelas. Di sini Anda juga bisa mengubah <strong className="text-[var(--text-accent)]">Arah Tulis</strong> ke RTL untuk soal Arab.</li>
              <li><strong>Tata Letak Pratinjau:</strong> Di bagian bawah form Informasi Ujian, pilih tata letak <strong className="text-[var(--text-accent)]">1 Kolom</strong> atau <strong className="text-[var(--text-accent)]">2 Kolom</strong> untuk mengatur tampilan soal di pratinjau dan hasil cetak.</li>
              <li><strong>Bagian Soal:</strong> Ujian dapat dibagi menjadi beberapa bagian. Klik <code className="bg-[var(--bg-muted)] px-2 py-1 rounded">Tambah Bagian Soal</code> untuk membuat bagian baru (misal: I. Pilihan Ganda, II. Esai).</li>
              <li><strong>Tambah Soal:</strong> Di setiap bagian, klik <code className="bg-[var(--bg-muted)] px-2 py-1 rounded">Tambah Soal</code>, lalu pilih jenis soal yang diinginkan atau <strong className="text-[var(--text-accent)]">Ambil dari Bank Soal</strong>.</li>
              <li><strong>Kunci Jawaban:</strong> Isi kunci jawaban di bawah setiap soal untuk digunakan pada pratinjau kunci jawaban.</li>
            </ul>
           </GuideStep>
           <GuideStep number={3} title="Pratinjau, Simpan & Cetak">
              <p>Saat mengedit, gunakan tab <strong className="text-[var(--text-accent)]">Pratinjau</strong> dan <strong className="text-[var(--text-accent)]">Kunci Jawaban</strong> untuk melihat tampilan akhir. Perubahan disimpan otomatis.</p>
              <p>Untuk mencetak atau ekspor ke HTML, kembali ke halaman <strong className="text-[var(--text-accent)]">Arsip Ujian</strong> dan klik ikon <i className="bi bi-printer-fill text-green-600"></i> pada kartu ujian yang diinginkan.</p>
           </GuideStep>
           <GuideStep number={4} title="Backup & Restore Data">
            <p>Gunakan menu navigasi (ikon di kanan atas pada desktop, atau menu burger di mobile) untuk mengakses fitur <strong className="text-[var(--text-accent)]">Backup</strong> dan <strong className="text-[var(--text-accent)]">Restore</strong>. Lakukan backup secara berkala untuk menjaga keamanan data Anda.</p>
           </GuideStep>
           <GuideStep number={5} title="Instalasi Aplikasi (PWA)">
             <p>Dapatkan akses lebih cepat dengan menginstal SoalGenius di perangkat Anda:</p>
             <ul className="list-disc list-inside space-y-2">
                <li><strong>Desktop (Chrome/Edge):</strong> Cari ikon 'Instal' (layar dengan panah) di bilah alamat browser, lalu klik dan konfirmasi.</li>
                <li><strong>Mobile (Android/Chrome):</strong> Buka menu browser (tiga titik) dan pilih 'Instal aplikasi' atau 'Tambahkan ke layar utama'.</li>
                <li><strong>Mobile (iOS/Safari):</strong> Ketuk tombol 'Bagikan', gulir ke bawah, lalu pilih 'Tambahkan ke Layar Utama'.</li>
             </ul>
           </GuideStep>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4 pt-4">
        <p className="text-[var(--text-secondary)]">Dukung & Terhubung dengan Kami!</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="https://lynk.id/aiprojek/s/bvBJvdA" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow hover:shadow-md">
            <CoffeeIcon />
            Traktir Kopi
          </a>
          <a href="https://github.com/aiprojek/soalgeniusv2" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#333] hover:bg-[#444] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow hover:shadow-md">
            <GithubIcon />
            GitHub
          </a>
          <a href="https://t.me/aiprojek_community/32" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow hover:shadow-md">
            <DiscussionIcon />
            Diskusi
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpView;