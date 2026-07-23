import React, { useState } from 'react';
import { CoffeeIcon, GithubIcon, DiscussionIcon } from '../../components/Icons';

const QuickFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-left border border-[var(--border-primary)]/50">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-bold">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
);

const ValuePoint: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--bg-accent)]"></span>
            {title}
        </h4>
        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </div>
);

const SocialButton: React.FC<{ href: string; icon: React.ElementType; label: string; subLabel: string; colorClass: string }> = ({ href, icon: Icon, label, subLabel, colorClass }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`flex items-center gap-3.5 p-4 rounded-[20px] transition-all duration-300 transform hover:-translate-y-0.5 border border-transparent ${colorClass} group shadow-sm`}
    >
        <div className="p-2.5 bg-white/20 rounded-[16px]">
            <Icon className="text-xl text-white" />
        </div>
        <div className="text-left">
            <div className="font-bold text-white text-base leading-tight">{label}</div>
            <div className="text-white/85 text-xs font-medium mt-0.5 leading-relaxed">{subLabel}</div>
        </div>
    </a>
);

const FaqItem: React.FC<{ question: string; answer: React.ReactNode }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-[var(--border-primary)] rounded-[var(--radius-card)] bg-[var(--bg-secondary)] overflow-hidden transition-all duration-200">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left font-bold text-sm sm:text-base text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
            >
                <span>{question}</span>
                <i className={`bi bi-chevron-down text-xs text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`transition-all duration-200 ease-in-out ${isOpen ? 'max-h-60 border-t border-[var(--border-primary)]' : 'max-h-0'} overflow-hidden`}>
                <div className="p-4 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/30">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const AppLogo = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 512 512" 
        className={className} 
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
    >
        <g transform="matrix(8.5333333,0,0,8.5333333,-17.066666,34.133334)">
            <path d="M 32,6 2,20 32,34 62,20 Z" fill="white" fillOpacity="0.95" />
            <path d="m 6,22 v 18 c 0,0 10,6 26,6 16,0 26,-6 26,-6 V 22" fill="white" fillOpacity="0.8" />
            <path d="m 24,33 6,6 14,-14" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="50" y1="20" x2="50" y2="30" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="m 50,30 c -2,2 2,2 0,4 -2,2 2,2 0,4" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
    </svg>
);

const AboutTab: React.FC = () => {
    const buildVersion = import.meta.env.VITE_APP_BUILD_VERSION || 'dev';

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-8 px-1">
            {/* Hero Card */}
            <section className="relative overflow-hidden rounded-[24px] border border-[var(--border-primary)] bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(255,255,255,0.16))] px-5 py-6 sm:px-8 sm:py-8 shadow-sm">
                <div className="absolute right-10 top-10 hidden md:block opacity-60">
                    <div className="grid grid-cols-2 gap-2 rotate-6">
                        <div className="h-14 w-14 rounded-2xl border border-blue-200/70 bg-white/35 backdrop-blur-sm"></div>
                        <div className="h-10 w-10 rounded-xl border border-amber-200/70 bg-white/30 backdrop-blur-sm mt-6"></div>
                        <div className="h-8 w-8 rounded-lg border border-blue-200/70 bg-white/25 backdrop-blur-sm ml-5"></div>
                        <div className="h-12 w-12 rounded-2xl border border-blue-200/70 bg-white/35 backdrop-blur-sm"></div>
                    </div>
                </div>
                <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]/70 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm">
                            Tentang Aplikasi
                        </div>
                        <div className="space-y-3">
                            <div className="relative inline-flex items-center justify-center p-4 rounded-[28px] bg-gradient-to-br from-[#2d60df] to-[#4f7ff4] shadow-[var(--shadow-soft)]">
                                <div className="absolute inset-0 rounded-[28px] ring-1 ring-white/30"></div>
                                <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-amber-300/90 blur-[1px]"></div>
                                <AppLogo className="relative w-14 h-14 drop-shadow-md" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                Soal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2457d6] to-[#5f86ec]">Genius</span>
                            </h2>
                            <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                Aplikasi pembuat soal yang dirancang agar guru dapat fokus sepenuhnya pada penyusunan butir soal berkualitas, tanpa terganggu oleh masalah format, tata letak halaman, atau penomoran yang rumit.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="app-status-pill app-status-info font-bold">Versi {buildVersion}</span>
                            <span className="app-status-pill font-bold" style={{ background: 'rgba(124, 58, 237, 0.12)', color: 'rgb(109, 40, 217)' }}>Open Source</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1">
                        <QuickFact label="Filosofi Utama" value="Prioritaskan Isi & Konten" />
                        <QuickFact label="Penyimpanan" value="Browser Lokal (IndexedDB)" />
                        <QuickFact label="Tujuan Desain" value="Rapi, Presisi, Siap Cetak" />
                    </div>
                </div>
            </section>

            {/* Why SoalGenius */}
            <section className="app-surface rounded-[var(--radius-card)] p-5 sm:p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] text-lg sm:text-xl border-b border-[var(--border-primary)] pb-3">Kenapa SoalGenius dibuat?</h3>
                <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
                    <p>
                        Pembuatan naskah soal ujian di sekolah seringkali memakan waktu lama hanya untuk merapikan spasi, menyelaraskan nomor, menyusun tata letak opsi Pilihan Ganda agar hemat kertas, atau menggabungkan baris tabel secara manual di Word.
                    </p>
                    <p>
                        <strong>SoalGenius</strong> hadir sebagai solusi mandiri berbasis peramban (browser) yang menangani seluruh tata letak dokumen secara otomatis. Semua naskah soal tersimpan dengan aman di penyimpanan lokal komputer Anda.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                    <ValuePoint
                        title="Instan & Otomatis"
                        description="Kelola bagian naskah ujian, atur kolom ganda, dan buat varian paket soal acak hanya dalam satu kali klik."
                    />
                    <ValuePoint
                        title="Privasi & Keamanan Penuh"
                        description="Data Anda tidak pernah terkirim ke server mana pun. Kendali penuh penyimpanan lokal ada di browser perangkat Anda."
                    />
                </div>
            </section>

            {/* FAQ Section */}
            <section className="app-surface rounded-[var(--radius-card)] p-5 sm:p-6 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)] text-lg sm:text-xl border-b border-[var(--border-primary)] pb-3">Pertanyaan Umum (FAQ)</h3>
                <div className="space-y-2">
                    <FaqItem 
                        question="Di mana file soal dan data ujian saya disimpan?"
                        answer={
                            <p>
                                Seluruh data disimpan secara lokal pada browser perangkat Anda menggunakan teknologi database <strong>IndexedDB</strong> (dikelola lewat Dexie.js). Aplikasi ini bekerja 100% secara lokal dan tidak menyimpan data di server kami.
                            </p>
                        }
                    />
                    <FaqItem 
                        question="Apakah data saya bisa terhapus dengan sendirinya?"
                        answer={
                            <div className="space-y-2">
                                <p>
                                    Secara umum tidak, namun data Anda <strong>bisa terhapus</strong> jika Anda melakukan tindakan berikut:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Melakukan "Hapus Data Situs" atau pembersihan cache browser secara menyeluruh.</li>
                                    <li>Menggunakan aplikasi pembersih pihak ketiga (seperti CCleaner atau fitur pembersih disk otomatis bawaan OS) yang menargetkan cache browser.</li>
                                </ul>
                                <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1.5">
                                    Sangat direkomendasikan untuk rutin mengekspor cadangan JSON lokal atau menghubungkan integrasi Dropbox di menu Pengaturan.
                                </p>
                            </div>
                        }
                    />
                    <FaqItem 
                        question="Bagaimana cara kerja mode offline?"
                        answer={
                            <p>
                                SoalGenius dirancang sebagai <strong>Progressive Web App (PWA)</strong>. Saat pertama kali Anda memuat aplikasi ini dengan internet, Service Worker (`sw.js`) akan otomatis menyimpan seluruh file aplikasi ke dalam cache browser Anda. Kunjungan berikutnya dapat diakses tanpa koneksi internet sama sekali.
                            </p>
                        }
                    />
                    <FaqItem 
                        question="Apakah aplikasi ini berbayar?"
                        answer={
                            <p>
                                 Tidak. SoalGenius berstatus <strong>100% gratis dan Open Source</strong> di bawah lisensi GNU GPL v3. Siapa pun (guru maupun sekolah) dapat memanfaatkannya secara gratis tanpa batasan fitur.
                            </p>
                        }
                    />
                </div>
            </section>

            {/* Social Support */}
            <section className="space-y-3.5 pt-2">
                <div className="text-center space-y-1">
                    <h3 className="font-bold text-[var(--text-primary)] text-lg">Dukung & Bergabung</h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Kembangkan ekosistem SoalGenius bersama komunitas pendidik dan pengembang lainnya.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <SocialButton 
                        href="https://lynk.id/aiprojek/s/bvBJvdA" 
                        icon={CoffeeIcon} 
                        label="Traktir Kopi" 
                        subLabel="Dukung pengembangan"
                        colorClass="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    />
                    <SocialButton 
                        href="https://github.com/aiprojek/soalgeniusv2" 
                        icon={GithubIcon} 
                        label="GitHub" 
                        subLabel="Beri Bintang & Kontribusi"
                        colorClass="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black"
                    />
                    <SocialButton 
                        href="https://t.me/aiprojek_community/32" 
                        icon={DiscussionIcon} 
                        label="Telegram" 
                        subLabel="Komunitas & Diskusi"
                        colorClass="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                    />
                </div>
                <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-xs sm:text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between shadow-sm">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Dikembangkan oleh <a href="https://www.aiprojek01.my.id/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">AI Projek</a></span>
                        <span className="hidden sm:inline text-[var(--text-muted)]">•</span>
                        <span>Lisensi <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">GNU GPL v3</a></span>
                    </div>
                    <a href="https://github.com/aiprojek/soalgeniusv2" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        Lihat Repositori Proyek
                    </a>
                </div>
            </section>
        </div>
    );
};

export default AboutTab;
