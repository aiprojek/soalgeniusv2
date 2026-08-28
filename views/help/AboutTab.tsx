import React, { useState } from 'react';
import {
    AppMarkIcon, CoffeeIcon, GithubIcon, DiscussionIcon,
    ShieldCheckIcon, SparklesIcon, GlobeIcon, ServerIcon,
    HddIcon, CheckIcon, CloseIcon
} from '../../components/Icons';
import type { View } from '../../App';
import type { HelpTab } from '../HelpView';

interface AboutTabProps {
    onNavigate?: (view: View) => void;
    onSwitchTab?: (tab: HelpTab, query?: string) => void;
}

interface FaqItemData {
    q: string;
    a: string;
    category: string;
}

const AboutTab: React.FC<AboutTabProps> = ({ onNavigate, onSwitchTab }) => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const rawBuildVersion = (import.meta as any).env?.VITE_APP_BUILD_VERSION;
    const displayVersion = rawBuildVersion ? `Build ${rawBuildVersion}` : 'v1.4.0 (Latest)';

    const faqs: FaqItemData[] = [
        {
            category: 'Penyimpanan & Keamanan',
            q: 'Di mana seluruh naskah ujian dan butir soal saya disimpan?',
            a: 'Seluruh naskah ujian, butir soal, kunci jawaban, dan konfigurasi disimpan secara lokal di dalam browser Anda menggunakan database IndexedDB (Dexie.js). Data tidak dikirimkan ke server pengembang mana pun sehingga privasi naskah ujian rahasia Anda terjamin 100% aman.'
        },
        {
            category: 'Bank Soal & Manajemen Butir',
            q: 'Bagaimana cara mengubah mata pelajaran, kelas, atau label tag pada puluhan butir bank soal sekaligus?',
            a: 'Buka menu Bank Soal, centang butir-butir soal yang ingin diperbarui (atau klik "Pilih Semua"), lalu klik tombol "Edit Massal". Pada dialog modal, centang atribut yang ingin diubah (Mata Pelajaran, Jenjang/Kelas, atau Tag materi seperti #HOTS, #Sumatif, #Bab 1) tanpa mengubah atribut butir soal lainnya.'
        },
        {
            category: 'Bank Soal & Manajemen Butir',
            q: 'Bisakah saya langsung membuat naskah ujian baru dari kumpulan butir di Bank Soal?',
            a: 'Tentu saja! Di Bank Soal, tandai butir-butir soal yang ingin diujikan lalu klik "Buat Ujian dari Terpilih". Sistem akan otomatis menyusun naskah ujian baru dengan pengelompokan format soal (PG, PGK, Esai, dll.), penomoran berurutan, perhitungan bobot nilai, serta judul dan alokasi waktu ujian.'
        },
        {
            category: 'Penilaian & Koreksi LJK',
            q: 'Bagaimana cara mengoreksi ujian yang memiliki beberapa paket soal (misal Paket A dan Paket B)?',
            a: 'Pisahkan tumpukan lembar LJK siswa sesuai paketnya (Paket A dan Paket B). Buka naskah Paket A di aplikasi lalu scan seluruh lembar Paket A. Setelah selesai dan mengunduh rekapan nilai, buka naskah Paket B di Arsip lalu scan seluruh lembar Paket B.'
        },
        {
            category: 'Penyimpanan & Keamanan',
            q: 'Bagaimana cara mencegah data hilang jika ganti laptop atau browser dibersihkan?',
            a: 'Anda dapat memanfaatkan fitur Sinkronisasi Dropbox di menu Pengaturan untuk pencadangan otomatis ke cloud pribadi Anda. Selain itu, Anda juga dapat mengekspor berkas Backup Arsip (.json) atau mengekspor paket bank soal (.sgpkg) secara berkala untuk disimpan di flashdisk atau Google Drive.'
        },
        {
            category: 'Kolaborasi & MGMP',
            q: 'Bagaimana cara berbagi paket bank soal ke rekan guru atau komunitas MGMP?',
            a: 'Gunakan fitur Pusat Berbagi MGMP. Pilih butir soal yang ingin dibagikan, lengkapi metadata mata pelajaran & penyusun, lalu unduh berkas .sgpkg. Berkas ini berukuran sangat ringan dan dapat dibagikan langsung melalui WhatsApp, Telegram, email, atau flashdisk.'
        },
        {
            category: 'Gaya & Efisiensi',
            q: 'Bagaimana cara membuat naskah ujian dengan teks Basmalah dan opsi huruf Arab?',
            a: 'Buka menu Pengaturan → Preset Gaya, lalu pilih preset "Madrasah / Kemenag". Sistem akan otomatis menyematkan teks Basmalah & Hamdalah di naskah, mengubah opsi menjadi abjad Arab (أ, ب, ج, د), serta menerapkan font formal Amiri yang rapi.'
        },
        {
            category: 'Akses & Instalasi',
            q: 'Apakah aplikasi ini dapat diakses secara offline tanpa internet?',
            a: 'Ya. SoalGenius mendukung teknologi Progressive Web App (PWA) dan arsitektur Offline-First. Setelah dibuka pertama kali, seluruh aset aplikasi tersimpan di cache perangkat. Anda dapat menginstalnya sebagai aplikasi mandiri dan menggunakannya kapan saja tanpa sambungan internet.'
        },
        {
            category: 'Lisensi & Hak Cipta',
            q: 'Apakah aplikasi SoalGenius dapat digunakan bebas untuk kebutuhan sekolah?',
            a: 'Ya, SoalGenius dikembangkan oleh AI Projek di bawah lisensi resmi GNU General Public License v3.0 (GNU GPL v3). Anda bebas menggunakan, memodifikasi, dan mendistribusikan aplikasi ini secara gratis untuk seluruh kegiatan pendidikan sekolah, madrasah, dan komunitas guru.'
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="space-y-6">
            {/* Hero Identity Card */}
            <div className="app-surface p-5 sm:p-7 rounded-[var(--radius-card)] border border-[var(--border-primary)] space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-3 shadow-md flex items-center justify-center flex-shrink-0">
                        <AppMarkIcon className="w-full h-full text-white" />
                    </div>

                    <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                                SoalGenius
                            </h2>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-control)] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                                {displayVersion}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-[var(--radius-control)] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                100% Offline-First
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                            Aplikasi pembuat soal yang dibuat agar guru dapat fokus pada penyusunan butir soal berkualitas, tanpa terganggu oleh masalah format, tata letak halaman, atau penomoran yang rumit.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-shield-lock-fill text-[var(--text-accent)]"></i> Privasi Lokal
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-cpu-fill text-[var(--text-accent)]"></i> Render KaTeX
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-file-earmark-zip-fill text-[var(--text-accent)]"></i> Portabel .sgpkg
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3 Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border-primary)]">
                    <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-1">
                        <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                            <ShieldCheckIcon className="text-emerald-500 text-sm" />
                            <span>Privasi & Nol Server</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            Data naskah soal tersimpan di memori browser lokal perangkat Anda, aman dan bebas risiko kebocoran.
                        </p>
                    </div>

                    <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-1">
                        <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                            <SparklesIcon className="text-blue-500 text-sm" />
                            <span>Otomasi Tata Letak</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            Preset visual 1-klik, smart page fit hemat kertas, dan penomoran otomatis tanpa ribet.
                        </p>
                    </div>

                    <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-1">
                        <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                            <GlobeIcon className="text-purple-500 text-sm" />
                            <span>Ekosistem MGMP</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            Distribusi paket bank soal portabel (.sgpkg) antar-pendidik secara mandiri dan cepat.
                        </p>
                    </div>
                </div>
            </div>

            {/* System Status & Architecture Specs */}
            <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] border border-[var(--border-primary)] space-y-3">
                <h3 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <ServerIcon className="text-[var(--text-accent)] text-base" />
                    <span>Spesifikasi Arsitektur Sistem</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Database Mesin</span>
                        <span className="font-bold text-[var(--text-primary)] mt-0.5 block">IndexedDB (Dexie.js)</span>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Mesin Rumus</span>
                        <span className="font-bold text-[var(--text-primary)] mt-0.5 block">KaTeX High-Speed</span>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Mode Offline</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Aktif (PWA Ready)</span>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Paket Soal</span>
                        <span className="font-bold text-[var(--text-primary)] mt-0.5 block">.sgpkg (Standard v1)</span>
                    </div>
                </div>
            </div>

            {/* Interactive FAQ Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                            <i className="bi bi-question-circle-fill text-[var(--text-accent)]"></i>
                            <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Jawaban praktis seputar privasi data, pencadangan, dan penggunaan fitur.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaqIndex === index;
                        return (
                            <div
                                key={index}
                                className="app-surface rounded-[var(--radius-card)] border border-[var(--border-primary)] overflow-hidden transition-all shadow-xs"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-[var(--text-accent)] uppercase tracking-wider block mb-0.5">
                                            {faq.category}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-tight">
                                            {faq.q}
                                        </h4>
                                    </div>
                                    <i className={`bi bi-chevron-down text-xs text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''}`}></i>
                                </button>

                                {isOpen && (
                                    <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/40 text-xs text-[var(--text-secondary)] leading-relaxed animate-fade-in">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Community, Links & Support Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <a
                    href="https://www.aiprojek01.my.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-surface p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all flex flex-col justify-between group shadow-xs"
                >
                    <div className="space-y-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                            <GlobeIcon className="text-base" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                            AI Projek (Pengembang)
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Kunjungi situs AI Projek untuk melihat portofolio dan proyek lainnya.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 mt-3">
                        <span>Kunjungi Situs</span>
                        <i className="bi bi-arrow-right text-[10px]"></i>
                    </span>
                </a>

                <a
                    href="https://www.gnu.org/licenses/gpl-3.0.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-surface p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all flex flex-col justify-between group shadow-xs"
                >
                    <div className="space-y-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                            <ShieldCheckIcon className="text-base" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                            Lisensi GNU GPL v3
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Perangkat lunak bebas & sumber terbuka. Hak cipta dilindungi di bawah lisensi GNU General Public License v3.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mt-3">
                        <span>Lihat Dokumen Lisensi</span>
                        <i className="bi bi-arrow-right text-[10px]"></i>
                    </span>
                </a>

                <a
                    href="https://github.com/aiprojek/soalgeniusv2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-surface p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all flex flex-col justify-between group shadow-xs"
                >
                    <div className="space-y-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <GithubIcon className="text-base" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                            GitHub Repository
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Beri bintang, laporkan kendala teknis (bug issue), atau berkontribusi dalam kode sumber.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1 mt-3">
                        <span>Buka Repositori</span>
                        <i className="bi bi-arrow-right text-[10px]"></i>
                    </span>
                </a>

                <a
                    href="https://t.me/aiprojek_community/32"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-surface p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all flex flex-col justify-between group shadow-xs"
                >
                    <div className="space-y-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                            <DiscussionIcon className="text-base" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                            Komunitas Telegram
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Bergabung dalam grup diskusi Telegram sesama pengguna dan ikuti pembaruan terkini.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 mt-3">
                        <span>Gabung Telegram</span>
                        <i className="bi bi-arrow-right text-[10px]"></i>
                    </span>
                </a>

                <a
                    href="https://lynk.id/aiprojek/s/bvBJvdA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-surface p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all flex flex-col justify-between group shadow-xs sm:col-span-2 lg:col-span-2"
                >
                    <div className="space-y-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                            <CoffeeIcon className="text-base" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                            Traktir Kopi
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Dukung pengembang agar aplikasi ini tetap gratis, bebas iklan, dan terus diperbarui untuk seluruh pendidik di Indonesia.
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 mt-3">
                        <span>Traktir Pengembang (Lynk.id)</span>
                        <i className="bi bi-arrow-right text-[10px]"></i>
                    </span>
                </a>
            </div>
        </div>
    );
};

export default AboutTab;
