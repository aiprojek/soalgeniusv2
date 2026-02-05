import React, { useState } from 'react';
import { CoffeeIcon, GithubIcon, DiscussionIcon, InfoIcon, StarsIcon, BankIcon } from '../components/Icons';

type HelpTab = 'about' | 'features' | 'guide';

const FeatureCard = ({ icon, title, children }: { icon: string, title: string, children?: React.ReactNode }) => (
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

const GuideStep = ({ number, title, children }: { number: number, title: string, children?: React.ReactNode }) => (
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
  const [activeTab, setActiveTab] = useState<HelpTab>('about');

  const tabs: { id: HelpTab; label: string; icon: React.ElementType }[] = [
      { id: 'about', label: 'Tentang', icon: InfoIcon },
      { id: 'features', label: 'Fitur', icon: StarsIcon },
      { id: 'guide', label: 'Panduan', icon: BankIcon }, // Reusing BankIcon as generic 'Guide' book icon
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header & Tabs */}
      <div className="flex-shrink-0 mb-6">
          <div className="text-center p-4">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">SoalGenius</h1>
            <p className="text-md font-semibold text-[var(--text-accent)] mt-1">Versi 2.0</p>
          </div>
          
          <div className="flex space-x-1 bg-[var(--bg-secondary)] p-1 rounded-xl shadow-sm border border-[var(--border-primary)]">
              {tabs.map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${
                          activeTab === tab.id
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                      <tab.icon className="text-lg" />
                      <span>{tab.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto pr-1 pb-4">
          
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
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
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FeatureCard icon="bi-pencil-square" title="Editor Canggih">
                    Format teks, gambar, tabel, dan superskrip/subskrip dengan mudah. Kini dilengkapi navigasi halaman untuk performa lebih cepat.
                </FeatureCard>
                <FeatureCard icon="bi-stars" title="Kecerdasan Buatan (AI)">
                    Bingung membuat soal? Gunakan fitur "Buat dengan AI" untuk menghasilkan draf soal secara otomatis berdasarkan topik.
                </FeatureCard>
                <FeatureCard icon="bi-cloud-check-fill" title="Sinkronisasi Cloud">
                    Hubungkan akun Dropbox Anda untuk menyimpan dan menyinkronkan data ujian antar perangkat dengan aman.
                </FeatureCard>
                <FeatureCard icon="bi-folder-fill" title="Organisasi Rapi">
                    Kelompokkan ujian ke dalam Folder dan gunakan Label (Tags) untuk memudahkan pencarian di arsip.
                </FeatureCard>
                <FeatureCard icon="bi-list-ol" title="Berbagai Jenis Soal">
                    Mendukung Pilihan Ganda (termasuk kompleks), Esai, Isian Singkat, Menjodohkan, Benar-Salah, hingga Tabel Isian.
                </FeatureCard>
                <FeatureCard icon="bi-eye-fill" title="Pratinjau & Ekspor">
                    Lihat hasil akhir secara real-time. Ekspor ke <strong>Word (.docx)</strong>, HTML, PDF, atau format Moodle XML.
                </FeatureCard>
                <FeatureCard icon="bi-translate" title="Dukungan Teks Arab (RTL)">
                    Tulis soal berbahasa Arab dengan mudah. Arah teks, penomoran, dan tata letak otomatis menyesuaikan.
                </FeatureCard>
                <FeatureCard icon="bi-layout-split" title="Tata Letak Kolom Ganda">
                    Hemat kertas dengan mengatur soal agar tampil dalam format dua kolom secara otomatis pada pratinjau.
                </FeatureCard>
                <FeatureCard icon="bi-journal-richtext" title="Bank Soal Personal">
                    Simpan soal-soal terbaik Anda untuk digunakan kembali di ujian lain, mempercepat proses pembuatan soal.
                </FeatureCard>
                <FeatureCard icon="bi-wifi-off" title="100% Offline">
                    Setelah dimuat, aplikasi berjalan tanpa internet. Data tersimpan lokal di browser (IndexedDB) atau Cloud jika diaktifkan.
                </FeatureCard>
                </div>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] animate-fade-in">
                <div className="space-y-8">
                <GuideStep number={1} title="Manajemen Arsip & Folder">
                    <p>Halaman <strong className="text-[var(--text-accent)]">Arsip</strong> adalah pusat data Anda. Gunakan fitur <strong>Filter Folder</strong> dan <strong>Label</strong> di bagian atas untuk mengelompokkan ujian.</p>
                    <ul className="list-disc list-inside mt-2 ml-1">
                        <li>Klik <code className="bg-[var(--bg-muted)] px-2 py-1 rounded">Buat Ujian Baru</code> untuk memulai naskah kosong.</li>
                        <li>Gunakan ikon-ikon pada kartu ujian untuk <strong>Edit, Cetak, Duplikat,</strong> atau <strong>Pindahkan</strong> ujian ke folder lain.</li>
                    </ul>
                </GuideStep>
                
                <GuideStep number={2} title="Editor Soal & AI">
                    <p>Editor kini menggunakan sistem <strong>Halaman (Pagination)</strong>. Jika soal Anda banyak (lebih dari 10), gunakan navigasi di bagian bawah layar untuk pindah halaman.</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Tambah Soal:</strong> Klik tombol <code className="bg-[var(--bg-muted)] px-2 py-1 rounded">+ Tambah Soal</code>. Anda bisa memilih jenis soal manual, mengambil dari <strong>Bank Soal</strong>, atau menggunakan <strong>Buat dengan AI</strong> untuk generate otomatis.</li>
                        <li><strong>Kunci Jawaban:</strong> Jangan lupa mengisi kunci jawaban di bawah setiap soal agar dapat dicetak terpisah.</li>
                        <li><strong>Simpan:</strong> Perubahan disimpan otomatis setiap beberapa detik. Anda juga bisa menekan tombol <strong>Simpan</strong> manual di pojok kanan atas.</li>
                    </ul>
                </GuideStep>

                <GuideStep number={3} title="Pratinjau & Ekspor Dokumen">
                    <p>Masuk ke menu <strong className="text-[var(--text-accent)]">Pratinjau</strong> untuk melihat hasil akhir naskah.</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Cetak / PDF:</strong> Klik ikon Printer untuk mencetak langsung atau simpan sebagai PDF lewat dialog browser.</li>
                        <li><strong>Word (.docx):</strong> Unduh file yang bisa diedit di Microsoft Word.</li>
                        <li><strong>Moodle XML:</strong> Ekspor soal untuk diimpor ke sistem LMS berbasis Moodle/E-Learning.</li>
                        <li>Gunakan tombol <strong>Soal / Kunci Jawaban</strong> untuk beralih tampilan antara naskah soal dan kunci.</li>
                    </ul>
                </GuideStep>

                <GuideStep number={4} title="Sinkronisasi Cloud & Backup">
                    <p>Amankan data Anda agar tidak hilang saat cache browser dibersihkan.</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Cloud Sync (Dropbox):</strong> Klik ikon Dropbox di header atau menu Pengaturan. Hubungkan akun untuk menyimpan backup otomatis ke cloud.</li>
                        <li><strong>Backup Lokal:</strong> Di menu Pengaturan > Data, Anda bisa mengunduh file <strong>.json</strong> berisi semua ujian Anda secara manual.</li>
                        <li><strong>Storage Warning:</strong> Data tersimpan di browser (IndexedDB). Jangan menghapus "Site Data" browser Anda kecuali sudah melakukan backup.</li>
                    </ul>
                </GuideStep>

                <GuideStep number={5} title="Instalasi Aplikasi (PWA)">
                    <p>Agar lebih ringan dan cepat, instal SoalGenius sebagai aplikasi:</p>
                    <ul className="list-disc list-inside space-y-2 mt-1">
                        <li><strong>Desktop (Chrome/Edge):</strong> Klik ikon 'Instal' (layar dengan panah) di sisi kanan bilah alamat URL.</li>
                        <li><strong>Android:</strong> Buka menu browser (titik tiga) > "Instal Aplikasi" atau "Tambahkan ke Layar Utama".</li>
                        <li><strong>iOS (Safari):</strong> Tekan tombol 'Share' > "Add to Home Screen".</li>
                    </ul>
                </GuideStep>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default HelpView;