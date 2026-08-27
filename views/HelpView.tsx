import React, { useState } from 'react';
import { InfoIcon, StarsIcon, BankIcon, SearchIcon, CloseIcon } from '../components/Icons';
import type { View } from '../App';
import AboutTab from './help/AboutTab';
import FeaturesTab from './help/FeaturesTab';
import GuideTab from './help/GuideTab';

export type HelpTab = 'guide' | 'features' | 'about';

interface HelpViewProps {
    onNavigate?: (view: View) => void;
}

const HelpView: React.FC<HelpViewProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<HelpTab>('guide');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs: { id: HelpTab; label: string; sublabel: string; icon: React.ElementType }[] = [
        { id: 'guide', label: 'Panduan & Tutorial', sublabel: 'Langkah pengerjaan & tips', icon: BankIcon },
        { id: 'features', label: 'Katalog Fitur', sublabel: 'Daftar kemampuan sistem', icon: StarsIcon },
        { id: 'about', label: 'Tentang & FAQ', sublabel: 'Spesifikasi & tanya jawab', icon: InfoIcon },
    ];

    const handleQuickTopicSelect = (tab: HelpTab, query?: string) => {
        setActiveTab(tab);
        if (query !== undefined) {
            setSearchQuery(query);
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col space-y-5 pb-8 px-1 sm:px-2 md:px-4 animate-fade-in">
            {/* Header Area with Title & Global Search */}
            <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-accent)] mb-1">
                            <i className="bi bi-patch-question-fill text-xs"></i>
                            <span>Pusat Bantuan & Dokumentasi</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Pusat Pengetahuan SoalGenius
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            Panduan interaktif, trik efisiensi kertas, sintaks rumus KaTeX, dan dokumentasi ekosistem MGMP.
                        </p>
                    </div>

                    {/* Quick Search Input */}
                    <div className="relative w-full md:w-80 flex-shrink-0">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                        <input
                            type="text"
                            placeholder="Cari panduan, rumus KaTeX, .sgpkg..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--bg-accent)] transition-all shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                                title="Hapus pencarian"
                            >
                                <CloseIcon className="text-xs" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Section Switcher & Selector */}
                <div className="md:hidden space-y-2.5">
                    <div className="space-y-1.5">
                        <label htmlFor="help-tab-select" className="block text-xs font-semibold text-[var(--text-secondary)]">
                            Pindah Halaman / Section:
                        </label>
                        <select
                            id="help-tab-select"
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as HelpTab)}
                            className="w-full p-2.5 text-xs font-semibold border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                        >
                            {tabs.map((tab) => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.label} — {tab.sublabel}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mobile Horizontal Scrollable Tab Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border ${
                                        isActive
                                            ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] border-[var(--bg-accent)] shadow-xs'
                                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-primary)]'
                                    }`}
                                >
                                    <Icon className="text-sm flex-shrink-0" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Tabs - Desktop (md and up) */}
                <div className="hidden md:block app-tab-shell p-1 w-full">
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`app-tab-button flex items-center justify-start gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-left transition-all ${
                                        isActive ? 'app-tab-button-active' : ''
                                    }`}
                                >
                                    <Icon className={`text-base flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                                    <div className="min-w-0">
                                        <div className="truncate font-bold leading-tight">{tab.label}</div>
                                        <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                            {tab.sublabel}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'guide' && (
                    <GuideTab 
                        searchQuery={searchQuery} 
                        onClearSearch={() => setSearchQuery('')}
                        onNavigate={onNavigate}
                        onSwitchTab={handleQuickTopicSelect}
                    />
                )}
                {activeTab === 'features' && (
                    <FeaturesTab 
                        searchQuery={searchQuery} 
                        onClearSearch={() => setSearchQuery('')}
                        onNavigate={onNavigate}
                        onSwitchTab={handleQuickTopicSelect}
                    />
                )}
                {activeTab === 'about' && (
                    <AboutTab 
                        onNavigate={onNavigate}
                        onSwitchTab={handleQuickTopicSelect}
                    />
                )}
            </div>
        </div>
    );
};

export default HelpView;
