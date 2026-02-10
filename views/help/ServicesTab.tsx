import React from 'react';
import { BuildingIcon, ServerIcon, CheckIcon, WhatsappIcon, CoffeeIcon, GithubIcon } from '../../components/Icons';

const ServiceCard: React.FC<{
    title: string;
    icon: React.ElementType;
    description: string;
    price: string;
    subPrice?: string;
    features: string[];
    ctaText: string;
    ctaLink: string;
    variant: 'blue' | 'purple';
    badge?: string;
}> = ({ title, icon: Icon, description, price, subPrice, features, ctaText, ctaLink, variant, badge }) => {
    const bgHeader = variant === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-purple-500 to-purple-700';
    const btnClass = variant === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white';
    
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-md border border-[var(--border-primary)] overflow-hidden flex flex-col h-full transform hover:-translate-y-1 transition-all duration-300">
            <div className={`p-6 ${bgHeader} text-white relative`}>
                {badge && (
                    <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        {badge}
                    </span>
                )}
                <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                        <Icon />
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                        <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Mulai Dari</p>
                        <p className="font-bold text-lg leading-tight">{price}</p>
                        {subPrice && <p className="text-[10px] opacity-90">{subPrice}</p>}
                    </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">{title}</h3>
                <p className="text-white/80 text-sm">{description}</p>
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <ul className="space-y-3 mb-6 flex-grow">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                            <CheckIcon className={`flex-shrink-0 mt-0.5 ${variant === 'blue' ? 'text-blue-500' : 'text-purple-500'}`} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <a 
                    href={ctaLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`block w-full py-3 rounded-xl font-bold text-center transition-colors shadow-sm ${btnClass} flex items-center justify-center gap-2`}
                >
                    <WhatsappIcon /> {ctaText}
                </a>
            </div>
        </div>
    );
};

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

const ServicesTab: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Layanan Premium & Dukungan</h2>
                <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Selain versi gratis (Open Source), kami menawarkan layanan profesional untuk Institusi Pendidikan yang membutuhkan solusi terintegrasi.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service 1: School Setup (One Time) */}
                <ServiceCard 
                    title="Jasa Setup Sekolah"
                    icon={BuildingIcon}
                    description="Instalasi & Branding (Sekali Bayar)."
                    price="Rp 499rb"
                    subPrice="Sekali bayar (One-time)"
                    variant="blue"
                    features={[
                        "Instalasi di subdomain sekolah (ujian.sekolah.sch.id).",
                        "Ganti Logo & Kop Surat Permanen.",
                        "Warna tema disesuaikan identitas sekolah.",
                        "Panduan PDF khusus untuk guru.",
                        "Garansi teknis 3 bulan."
                    ]}
                    ctaText="Konsultasi Setup"
                    ctaLink="https://wa.me/6281225879494?text=Halo%2C%20saya%20tertarik%20dengan%20Jasa%20Setup%20Sekolah%20SoalGenius"
                />

                {/* Service 2: Hosted Pro (Annual Recurring) */}
                <ServiceCard 
                    title="Hosted Pro (SaaS)"
                    icon={ServerIcon}
                    description="Terima beres, domain khusus."
                    price="Rp 249rb"
                    subPrice="Per Tahun (Hemat 2 bulan)"
                    variant="purple"
                    features={[
                        "Termasuk Domain .my.id atau Subdomain.",
                        "Hosting Server Premium (Cloudflare Global).",
                        "Update fitur terbaru otomatis.",
                        "Integrasi Cloud Dropbox dibantu setup.",
                        "Prioritas Support via WhatsApp."
                    ]}
                    ctaText="Langganan Pro"
                    ctaLink="https://wa.me/6281225879494?text=Halo%2C%20saya%20ingin%20berlangganan%20Hosted%20Pro%20SoalGenius%20(Tahunan)"
                />
            </div>

            {/* Donation Banner (Reused style) */}
            <div className="pt-8 border-t border-[var(--border-primary)]">
                <h3 className="text-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-widest mb-6">Dukung Pengembangan Open Source</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <SocialButton 
                        href="https://lynk.id/aiprojek/s/bvBJvdA" 
                        icon={CoffeeIcon} 
                        label="Traktir Kopi" 
                        subLabel="Donasi via Lynk.id"
                        colorClass="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    />
                    <SocialButton 
                        href="https://github.com/aiprojek/soalgeniusv2" 
                        icon={GithubIcon} 
                        label="GitHub Star" 
                        subLabel="Beri bintang di repo"
                        colorClass="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black"
                    />
                </div>
            </div>
        </div>
    );
};

export default ServicesTab;