import React from 'react';
import { CoffeeIcon, GithubIcon, DiscussionIcon } from '../../components/Icons';

const SocialButton: React.FC<{ href: string; icon: React.ElementType; label: string; subLabel: string; colorClass: string }> = ({ href, icon: Icon, label, subLabel, colorClass }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-transparent ${colorClass} group`}
    >
        <div className="p-3 bg-white/20 rounded-full">
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
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-block p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl mb-2">
                    <AppLogo className="w-20 h-20 drop-shadow-md" />
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
                    Soal<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Genius</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto leading-relaxed">
                    Aplikasi modern untuk membantu pendidik membuat, mengelola, dan mencetak soal ujian tanpa kerumitan format dokumen.
                </p>
                <div className="flex justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">Versi 2.1</span>
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wider">100% Offline</span>
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">Open Source</span>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border-primary)] shadow-sm">
                <h3 className="font-bold text-[var(--text-primary)] mb-4 text-lg">Tentang Aplikasi</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                    SoalGenius dirancang dengan filosofi "Fokus pada Konten". Kami menangani tata letak, penomoran, dan format teknis lainnya, sehingga Anda bisa fokus menyusun butir soal yang berkualitas.
                    Semua data tersimpan aman di browser Anda (IndexedDB) dan tidak dikirim ke server manapun kecuali Anda mengaktifkan sinkronisasi Cloud.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-primary)]">
                    <div>
                        <span className="block text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Pengembang</span>
                        <a href="https://www.aiprojek01.my.id/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">AI Projek</a>
                    </div>
                    <div>
                        <span className="block text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Lisensi</span>
                        <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">GNU GPL v3</a>
                    </div>
                </div>
            </div>

            {/* Social Actions */}
            <div className="space-y-4">
                <h3 className="text-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-widest">Dukung & Bergabung</h3>
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
            </div>
        </div>
    );
};

export default AboutTab;