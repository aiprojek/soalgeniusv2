import React from 'react';
import { CoffeeIcon, GithubIcon, DiscussionIcon } from '../../components/Icons';

const QuickFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="app-surface-muted rounded-[var(--radius-control)] px-3 py-2.5 text-left">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
);

const ValuePoint: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3.5 py-3">
        <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </div>
);

const SocialButton: React.FC<{ href: string; icon: React.ElementType; label: string; subLabel: string; colorClass: string }> = ({ href, icon: Icon, label, subLabel, colorClass }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`flex items-center gap-4 p-4 rounded-[var(--radius-card)] transition-all duration-300 transform hover:-translate-y-0.5 border border-transparent ${colorClass} group`}
    >
        <div className="p-3 bg-white/20 rounded-2xl">
            <Icon className="text-2xl text-white" />
        </div>
        <div className="text-left">
            <div className="font-bold text-white text-lg leading-tight">{label}</div>
            <div className="text-white/80 text-xs font-medium">{subLabel}</div>
        </div>
    </a>
);

const AppLogo = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 512 512" 
        className={className} 
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
    >
        <g transform="matrix(8.5333333,0,0,8.5333333,-17.066666,34.133334)">
            {/* Top Flap */}
            <path d="M 32,6 2,20 32,34 62,20 Z" fill="white" fillOpacity="0.95" />
            {/* Body */}
            <path d="m 6,22 v 18 c 0,0 10,6 26,6 16,0 26,-6 26,-6 V 22" fill="white" fillOpacity="0.8" />
            {/* Checkmark - using current text color (usually transparent or dark in this context) to cut through or standout */}
            <path d="m 24,33 6,6 14,-14" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Sparks */}
            <line x1="50" y1="20" x2="50" y2="30" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="m 50,30 c -2,2 2,2 0,4 -2,2 2,2 0,4" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
    </svg>
);

const AboutTab: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-8">
            <section className="relative overflow-hidden rounded-[20px] border border-[var(--border-primary)] bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(255,255,255,0.16))] px-4 py-5 sm:px-6 sm:py-6">
                <div className="absolute right-10 top-10 hidden md:block opacity-60">
                    <div className="grid grid-cols-2 gap-2 rotate-6">
                        <div className="h-14 w-14 rounded-2xl border border-blue-200/70 bg-white/35 backdrop-blur-sm"></div>
                        <div className="h-10 w-10 rounded-xl border border-amber-200/70 bg-white/30 backdrop-blur-sm mt-6"></div>
                        <div className="h-8 w-8 rounded-lg border border-blue-200/70 bg-white/25 backdrop-blur-sm ml-5"></div>
                        <div className="h-12 w-12 rounded-2xl border border-blue-200/70 bg-white/35 backdrop-blur-sm"></div>
                    </div>
                </div>
                <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] backdrop-blur-sm">
                            Tentang SoalGenius
                        </div>
                        <div className="space-y-2.5">
                            <div className="relative inline-flex items-center justify-center p-4 rounded-[28px] bg-gradient-to-br from-[#2d60df] to-[#4f7ff4] shadow-[var(--shadow-soft)]">
                                <div className="absolute inset-0 rounded-[28px] ring-1 ring-white/30"></div>
                                <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-amber-300/90 blur-[1px]"></div>
                                <div className="absolute -left-1 bottom-1 h-3 w-3 rounded-full bg-white/80"></div>
                                <AppLogo className="relative w-16 h-16 drop-shadow-md" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                Soal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2457d6] to-[#5f86ec]">Genius</span>
                            </h2>
                            <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                Aplikasi pembuat soal yang dirancang agar guru bisa fokus pada kualitas butir soal, bukan repot mengatur layout dokumen.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="app-status-pill app-status-info">Versi 2.1</span>
                            <span className="app-status-pill app-status-success">100% Offline</span>
                            <span className="app-status-pill" style={{ background: 'rgba(124, 58, 237, 0.12)', color: 'rgb(109, 40, 217)' }}>Open Source</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1">
                        <QuickFact label="Filosofi" value="Fokus pada konten" />
                        <QuickFact label="Penyimpanan" value="Browser lokal (IndexedDB)" />
                        <QuickFact label="Tujuan" value="Cepat, rapi, siap cetak" />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="app-surface rounded-[var(--radius-card)] p-4 sm:p-5">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 text-lg">Kenapa aplikasi ini dibuat?</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-5">
                    SoalGenius dirancang dengan filosofi "Fokus pada Konten". Kami menangani tata letak, penomoran, dan format teknis lainnya, sehingga Anda bisa fokus menyusun butir soal yang berkualitas.
                    Semua data tersimpan aman di browser Anda (IndexedDB) dan tidak dikirim ke server manapun kecuali Anda mengaktifkan sinkronisasi Cloud.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ValuePoint
                            title="Cepat dipakai"
                            description="Mulai dari arsip, susun soal di editor, lalu preview dan export tanpa alur yang berbelit."
                        />
                        <ValuePoint
                            title="Mandiri dan aman"
                            description="Data utama tetap lokal, cocok untuk penggunaan sekolah atau perangkat pribadi tanpa bergantung ke server pusat."
                        />
                    </div>
                </div>
                
                <div className="app-surface rounded-[var(--radius-card)] p-4 sm:p-5">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 text-lg">Informasi Proyek</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Pengembang</span>
                            <a href="https://www.aiprojek01.my.id/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">AI Projek</a>
                        </div>
                        <div className="pt-4 border-t border-[var(--border-primary)]">
                            <span className="block text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Lisensi</span>
                            <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">GNU GPL v3</a>
                        </div>
                        <div className="pt-4 border-t border-[var(--border-primary)]">
                            <span className="block text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Karakter Produk</span>
                            <p className="text-sm text-[var(--text-secondary)]">Offline-first, client-first, dan berfokus pada kebutuhan pendidik sehari-hari.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div className="text-center space-y-1">
                    <h3 className="font-bold text-[var(--text-primary)] text-lg">Dukung & Bergabung</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Jika aplikasi ini membantu, Anda bisa mendukung atau ikut mengikuti pengembangannya.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        subLabel="Lihat kode sumber"
                        colorClass="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black"
                    />
                    <SocialButton 
                        href="https://t.me/aiprojek_community/32" 
                        icon={DiscussionIcon} 
                        label="Telegram" 
                        subLabel="Diskusi komunitas"
                        colorClass="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                    />
                </div>
            </section>
        </div>
    );
};

export default AboutTab;
