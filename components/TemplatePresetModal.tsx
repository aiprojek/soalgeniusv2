import React, { useState } from 'react';
import type { Settings } from '../types';
import { TEMPLATE_PRESETS, TemplatePresetMeta, applyPresetToSettings } from '../lib/templatePresets';
import { 
    CloseIcon, CheckIcon, PaletteIcon, MortarboardIcon, 
    MoonStarsIcon, GlobeIcon, BuildingIcon, TreeIcon, SparklesIcon
} from './Icons';

interface TemplatePresetModalProps {
    isOpen?: boolean;
    onClose: () => void;
    currentSettings: Settings;
    onApplySettings: (newSettings: Settings) => void;
}

export const TemplatePresetModal: React.FC<TemplatePresetModalProps> = ({
    isOpen = true,
    onClose,
    currentSettings,
    onApplySettings
}) => {
    const [selectedPresetId, setSelectedPresetId] = useState<TemplatePresetMeta['id']>(
        currentSettings.templatePreset || 'kemendikbud'
    );
    const [includeSampleHeaders, setIncludeSampleHeaders] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'presets' | 'customize'>('presets');

    // Customized local state for fine-tuning
    const [customShowBasmalah, setCustomShowBasmalah] = useState<boolean>(
        currentSettings.showBasmalah ?? false
    );
    const [customShowHamdalah, setCustomShowHamdalah] = useState<boolean>(
        currentSettings.showHamdalah ?? false
    );
    const [customArabicOptionStyle, setCustomArabicOptionStyle] = useState<'latin' | 'hijaiyah'>(
        currentSettings.arabicOptionStyle || 'latin'
    );
    const [customShowPointsBadge, setCustomShowPointsBadge] = useState<boolean>(
        currentSettings.showPointsBadge ?? false
    );
    const [customStimulusStyle, setCustomStimulusStyle] = useState<'modern_card' | 'bordered' | 'minimal'>(
        currentSettings.stimulusStyle || 'modern_card'
    );
    const [customHeaderStyle, setCustomHeaderStyle] = useState<'standard' | 'madrasah' | 'kemendikbud' | 'cambridge' | 'minimal'>(
        currentSettings.headerStyle || 'kemendikbud'
    );
    const [customDividerStyle, setCustomDividerStyle] = useState<'double' | 'solid' | 'modern' | 'dashed'>(
        currentSettings.dividerStyle || 'modern'
    );

    if (!isOpen) return null;

    const selectedPreset = TEMPLATE_PRESETS.find(p => p.id === selectedPresetId) || TEMPLATE_PRESETS[0];

    const getPresetIcon = (id: string) => {
        switch (id) {
            case 'kemendikbud': return <MortarboardIcon className="text-xl text-blue-600 dark:text-blue-400" />;
            case 'madrasah': return <MoonStarsIcon className="text-xl text-emerald-600 dark:text-emerald-400" />;
            case 'cambridge': return <GlobeIcon className="text-xl text-purple-600 dark:text-purple-400" />;
            case 'minimal': return <TreeIcon className="text-xl text-emerald-600 dark:text-emerald-400" />;
            default: return <BuildingIcon className="text-xl text-slate-600 dark:text-slate-400" />;
        }
    };

    const handleSelectPreset = (preset: TemplatePresetMeta) => {
        setSelectedPresetId(preset.id);
        // Sync custom states with the chosen preset
        if (preset.settings.showBasmalah !== undefined) setCustomShowBasmalah(preset.settings.showBasmalah);
        if (preset.settings.showHamdalah !== undefined) setCustomShowHamdalah(preset.settings.showHamdalah);
        if (preset.settings.arabicOptionStyle !== undefined) setCustomArabicOptionStyle(preset.settings.arabicOptionStyle);
        if (preset.settings.showPointsBadge !== undefined) setCustomShowPointsBadge(preset.settings.showPointsBadge);
        if (preset.settings.stimulusStyle !== undefined) setCustomStimulusStyle(preset.settings.stimulusStyle);
        if (preset.settings.headerStyle !== undefined) setCustomHeaderStyle(preset.settings.headerStyle);
        if (preset.settings.dividerStyle !== undefined) setCustomDividerStyle(preset.settings.dividerStyle);
    };

    const handleApply = () => {
        if (activeTab === 'presets') {
            const newSettings = applyPresetToSettings(currentSettings, selectedPresetId, {
                updateHeaderLines: includeSampleHeaders
            });
            onApplySettings(newSettings);
        } else {
            // Apply customized settings
            const baseSettings = applyPresetToSettings(currentSettings, selectedPresetId, {
                updateHeaderLines: includeSampleHeaders
            });
            const customized: Settings = {
                ...baseSettings,
                showBasmalah: customShowBasmalah,
                showHamdalah: customHamdalah,
                arabicOptionStyle: customArabicOptionStyle,
                showPointsBadge: customShowPointsBadge,
                stimulusStyle: customStimulusStyle,
                headerStyle: customHeaderStyle,
                dividerStyle: customDividerStyle,
            };
            onApplySettings(customized);
        }
        onClose();
    };

    return (
        <div 
            id="template-preset-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
            <div 
                id="template-preset-modal-content"
                className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-primary)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                            <PaletteIcon className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Preset Gaya Naskah & Template</h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Pilih tata letak visual instan: Madrasah, Kurikulum Merdeka, Cambridge, atau Klasik Dinas.</p>
                        </div>
                    </div>
                    <button 
                        id="btn-close-preset-modal"
                        onClick={onClose} 
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        aria-label="Tutup modal"
                    >
                        <CloseIcon className="text-lg" />
                    </button>
                </div>

                {/* Sub-Tabs: Galeri Preset vs Penyesuaian Detail */}
                <div className="px-5 pt-3 pb-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center gap-2">
                    <button
                        id="tab-btn-presets"
                        onClick={() => setActiveTab('presets')}
                        className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'presets'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <SparklesIcon className="text-sm" />
                        <span>Galeri Preset Instan</span>
                    </button>
                    <button
                        id="tab-btn-customize"
                        onClick={() => setActiveTab('customize')}
                        className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'customize'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <span>Kustomisasi Elemen Khusus</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                    {activeTab === 'presets' ? (
                        <>
                            {/* Preset Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {TEMPLATE_PRESETS.map((preset) => {
                                    const isSelected = selectedPresetId === preset.id;
                                    return (
                                        <div
                                            key={preset.id}
                                            id={`preset-card-${preset.id}`}
                                            onClick={() => handleSelectPreset(preset)}
                                            className={`group relative rounded-xl p-4 cursor-pointer border-2 transition-all flex flex-col justify-between ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
                                                    : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] flex items-center justify-center flex-shrink-0">
                                                            {getPresetIcon(preset.id)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                                                                {preset.name}
                                                            </h3>
                                                            <p className="text-[11px] text-[var(--text-secondary)]">{preset.subtitle}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                                                            <CheckIcon />
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="my-2.5">
                                                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${preset.tagColor}`}>
                                                        {preset.tag}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                                                    {preset.description}
                                                </p>
                                            </div>

                                            {/* Highlights checklist */}
                                            <div className="pt-2.5 border-t border-[var(--border-primary)] space-y-1.5">
                                                {preset.highlights.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]">
                                                        <span className="text-blue-500 mt-0.5">•</span>
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Active Preset Detail & Live Spec Banner */}
                            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Preset Terpilih</p>
                                        <h4 className="text-base font-bold text-[var(--text-primary)]">{selectedPreset.name} — {selectedPreset.subtitle}</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2.5 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-secondary)] font-mono">
                                            Font: {selectedPreset.settings.fontFamily} ({selectedPreset.settings.fontSize}pt)
                                        </span>
                                        <span className="px-2.5 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-secondary)]">
                                            Spasi: {selectedPreset.settings.lineSpacing}
                                        </span>
                                    </div>
                                </div>

                                {/* Option to apply sample headers */}
                                <div className="pt-2 border-t border-[var(--border-secondary)] flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="chk-include-sample-headers"
                                        checked={includeSampleHeaders}
                                        onChange={(e) => setIncludeSampleHeaders(e.target.checked)}
                                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="chk-include-sample-headers" className="text-xs text-[var(--text-secondary)] cursor-pointer">
                                        <strong className="text-[var(--text-primary)]">Ganti teks Kop Surat</strong> dengan contoh resmi preset ini (
                                        <em>{selectedPreset.sampleHeaderLines?.join(' / ') || 'Sesuai template'}</em>).
                                        <span className="block text-[var(--text-muted)]">Biarkan tidak dicentang jika ingin mempertahankan nama sekolah/madrasah yang sudah Anda ketik.</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Customized Tab: Fine-tuning elements */
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                                <strong>Kustomisasi Spesifik:</strong> Sesuaikan fitur-fitur visual naskah secara independen. Pengaturan di bawah ini akan digabungkan dengan preset yang dipilih.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Madrasah Elements */}
                                <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-primary)]">
                                        <MoonStarsIcon className="text-emerald-600" />
                                        <h4 className="font-bold text-sm">Elemen Khas Madrasah / Islami</h4>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={customShowBasmalah}
                                                onChange={(e) => setCustomShowBasmalah(e.target.checked)}
                                                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-sm font-semibold text-[var(--text-primary)]">Teks Basmalah di Awal Naskah</span>
                                                <p className="text-xs text-[var(--text-secondary)]">Menampilkan kaligrafi <em>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</em> sebelum butir soal nomor 1.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={customShowHamdalah}
                                                onChange={(e) => setCustomShowHamdalah(e.target.checked)}
                                                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-sm font-semibold text-[var(--text-primary)]">Teks Hamdalah di Akhir Naskah</span>
                                                <p className="text-xs text-[var(--text-secondary)]">Menampilkan kalimat syukur <em>الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ</em> di penutup soal terakhir.</p>
                                            </div>
                                        </label>

                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                                Penomoran Opsi Pilihan Ganda
                                            </label>
                                            <select
                                                value={customArabicOptionStyle}
                                                onChange={(e) => setCustomArabicOptionStyle(e.target.value as 'latin' | 'hijaiyah')}
                                                className="w-full p-2 text-sm border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                            >
                                                <option value="latin">Latin Baku: A, B, C, D, E</option>
                                                <option value="hijaiyah">Hijaiyah / Arab Pegon: أ, ب, ج, د, هـ</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Modern & Cambridge Elements */}
                                <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-primary)]">
                                        <GlobeIcon className="text-purple-600" />
                                        <h4 className="font-bold text-sm">Elemen Kurikulum Merdeka & Cambridge</h4>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={customShowPointsBadge}
                                                onChange={(e) => setCustomShowPointsBadge(e.target.checked)}
                                                className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-sm font-semibold text-[var(--text-primary)]">Alokasi Poin / [Marks] per Butir</span>
                                                <p className="text-xs text-[var(--text-secondary)]">Menampilkan badge skor bobot (misal: [2 poin] / [1 mark]) di sebelah kanan tiap pertanyaan.</p>
                                            </div>
                                        </label>

                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                                Gaya Kotak Stimulus Literasi / Bacaan
                                            </label>
                                            <select
                                                value={customStimulusStyle}
                                                onChange={(e) => setCustomStimulusStyle(e.target.value as any)}
                                                className="w-full p-2 text-sm border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                            >
                                                <option value="modern_card">Modern Callout Card (Aksen Garis Samping)</option>
                                                <option value="bordered">Bordered Box (Kotak Garis Utuh Klasik)</option>
                                                <option value="minimal">Minimalist Divider (Garis Pembatas Putus-putus)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                                Gaya Garis Pembatas Kop Surat
                                            </label>
                                            <select
                                                value={customDividerStyle}
                                                onChange={(e) => setCustomDividerStyle(e.target.value as any)}
                                                className="w-full p-2 text-sm border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                            >
                                                <option value="double">Garis Ganda Dinas Tebal-Tipis (Double Rule)</option>
                                                <option value="modern">Garis Modern Gradasi Halus</option>
                                                <option value="solid">Garis Tunggal Tegas (Single Solid)</option>
                                                <option value="dashed">Garis Putus-Putus (Dashed)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-primary)]">
                    <div className="text-xs text-[var(--text-secondary)]">
                        Template dapat diubah kapan saja tanpa menghilangkan butir soal yang sudah ada.
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            id="btn-cancel-preset-modal"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            id="btn-apply-preset-modal"
                            onClick={handleApply}
                            className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckIcon />
                            <span>Terapkan Preset ({selectedPreset.name})</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplatePresetModal;
