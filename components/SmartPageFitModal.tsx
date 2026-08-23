import React, { useState, useEffect } from 'react';
import { Exam, Settings, QuestionType } from '../types';
import { SMART_FIT_PRESETS, calculateSmartPageFit, FitPreset } from '../lib/smartFit';
import { useToast } from '../contexts/ToastContext';
import { 
    CloseIcon, CheckIcon, SparklesIcon, LightningIcon, 
    CardTextIcon, LayoutSplitIcon, SaveIcon, UndoIcon
} from './Icons';

interface SmartPageFitModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: Exam;
    settings: Settings;
    currentPageCount: number;
    onApplySettings: (newSettings: Settings, newExam: Exam, saveAsDefault: boolean) => Promise<void>;
    onLivePreview?: (tempSettings: Settings, tempExam: Exam) => void;
}

export const SmartPageFitModal: React.FC<SmartPageFitModalProps> = ({
    isOpen,
    onClose,
    exam,
    settings,
    currentPageCount,
    onApplySettings,
    onLivePreview
}) => {
    const { addToast } = useToast();

    // Working state
    const [targetPage, setTargetPage] = useState<number>(() => {
        if (currentPageCount <= 1) return 1;
        if (currentPageCount === 3) return 2;
        if (currentPageCount === 5) return 4;
        return Math.max(1, currentPageCount - 1);
    });

    const [fontSize, setFontSize] = useState<number>(settings.fontSize || 12);
    const [lineSpacing, setLineSpacing] = useState<number>(settings.lineSpacing || 1.1);
    const [marginAll, setMarginAll] = useState<number>(settings.margins?.top || 15);
    const [layoutColumns, setLayoutColumns] = useState<1 | 2>(exam.layoutColumns || 1);
    const [paperSize, setPaperSize] = useState<Settings['paperSize']>(settings.paperSize || 'A4');
    const [compactChoices, setCompactChoices] = useState<boolean>(false);
    const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'smart' | 'presets' | 'custom'>('smart');
    const [isApplying, setIsApplying] = useState(false);

    // Initial snapshot backup for reset / rollback
    const prevIsOpenRef = React.useRef(false);
    const baseExamRef = React.useRef(exam);
    const baseSettingsRef = React.useRef(settings);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Capture baseline ONLY when modal opens (transition false -> true)
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            baseExamRef.current = exam;
            baseSettingsRef.current = settings;
            setFontSize(settings.fontSize || 12);
            setLineSpacing(settings.lineSpacing || 1.1);
            setMarginAll(settings.margins?.top || 15);
            setLayoutColumns(exam.layoutColumns || 1);
            setPaperSize(settings.paperSize || 'A4');
            setCompactChoices(false);
            setTargetPage(currentPageCount > 1 ? (currentPageCount % 2 !== 0 ? currentPageCount - 1 : currentPageCount) : 1);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

    // Live preview update with debounce to avoid rapid iframe re-render jitter
    useEffect(() => {
        if (!isOpen || !onLivePreview) return;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const tempSettings: Settings = {
                ...baseSettingsRef.current,
                fontSize,
                lineSpacing,
                paperSize,
                margins: { top: marginAll, right: marginAll, bottom: marginAll, left: marginAll }
            };

            let tempExam: Exam = {
                ...baseExamRef.current,
                layoutColumns
            };

            if (compactChoices) {
                tempExam = {
                    ...tempExam,
                    sections: tempExam.sections.map(sec => ({
                        ...sec,
                        questions: sec.questions.map(q => {
                            if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                                return { ...q, isTwoColumns: true };
                            }
                            return q;
                        })
                    }))
                };
            }

            onLivePreview(tempSettings, tempExam);
        }, 120);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [fontSize, lineSpacing, marginAll, layoutColumns, paperSize, compactChoices, isOpen, onLivePreview]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (onLivePreview) {
            onLivePreview(baseSettingsRef.current, baseExamRef.current);
        }
        onClose();
    };

    const handleApplyPreset = (preset: FitPreset) => {
        setFontSize(preset.fontSize);
        setLineSpacing(preset.lineSpacing);
        setMarginAll(preset.margins.top);
        setLayoutColumns(preset.layoutColumns);
        if (preset.compactChoices !== undefined) {
            setCompactChoices(preset.compactChoices);
        }
        addToast(`Preset "${preset.name}" diterapkan`, 'info');
    };

    const handleAutoFitToTarget = (target: number) => {
        setTargetPage(target);
        const result = calculateSmartPageFit(baseExamRef.current, baseSettingsRef.current, currentPageCount, target);
        setFontSize(result.fontSize);
        setLineSpacing(result.lineSpacing);
        setMarginAll(result.margins.top);
        setLayoutColumns(result.layoutColumns);
        setCompactChoices(result.compactChoices);
        addToast(`Kompakkan ke target ${target} halaman: ${result.strategySummary}`, 'success');
    };

    const handleSave = async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setIsApplying(true);
        try {
            const newSettings: Settings = {
                ...baseSettingsRef.current,
                fontSize,
                lineSpacing,
                paperSize,
                margins: { top: marginAll, right: marginAll, bottom: marginAll, left: marginAll }
            };

            let newExam: Exam = {
                ...baseExamRef.current,
                layoutColumns
            };

            if (compactChoices) {
                newExam = {
                    ...newExam,
                    sections: newExam.sections.map(sec => ({
                        ...sec,
                        questions: sec.questions.map(q => {
                            if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                                return { ...q, isTwoColumns: true };
                            }
                            return q;
                        })
                    }))
                };
            }

            await onApplySettings(newSettings, newExam, saveAsDefault);
            addToast('Format naskah ujian berhasil diperbarui & disimpan.', 'success');
            onClose();
        } catch (error) {
            console.error('Failed to apply smart fit:', error);
            addToast('Gagal menerapkan pengaturan format.', 'error');
        } finally {
            setIsApplying(false);
        }
    };

    const handleReset = () => {
        setFontSize(baseSettingsRef.current.fontSize || 12);
        setLineSpacing(baseSettingsRef.current.lineSpacing || 1.1);
        setMarginAll(baseSettingsRef.current.margins?.top || 15);
        setLayoutColumns(baseExamRef.current.layoutColumns || 1);
        setPaperSize(baseSettingsRef.current.paperSize || 'A4');
        setCompactChoices(false);
        if (onLivePreview) {
            onLivePreview(baseSettingsRef.current, baseExamRef.current);
        }
        addToast('Pengaturan dikembalikan ke format awal', 'info');
    };

    const isOddExcess = currentPageCount > 1 && currentPageCount % 2 !== 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={handleClose}>
            <div 
                className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[24px] shadow-2xl overflow-hidden animate-scale-in my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-muted)]/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            <SparklesIcon className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Mode Cetak Ujian Cerdas</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Optimalkan tata letak, margin, dan spasi agar hemat kertas fotokopi</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <CloseIcon className="text-lg" />
                    </button>
                </div>

                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {/* Status & Efficiency Diagnostics */}
                    <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isOddExcess 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`text-2xl font-black px-3 py-1.5 rounded-xl ${
                                isOddExcess ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                                {currentPageCount} Hal
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-75">Status Halaman Saat Ini</p>
                                <p className="text-xs sm:text-sm font-medium">
                                    {isOddExcess 
                                        ? `Naskah ganjil (${currentPageCount} halaman). Berpotensi boros 1 sisi lembar fotokopi.`
                                        : currentPageCount === 2
                                            ? 'Sempurna! Pas 1 lembar bolak-balik (2 muka) hemat kertas.'
                                            : `Naskah genap (${currentPageCount} halaman) pas ${currentPageCount / 2} lembar bolak-balik.`
                                    }
                                </p>
                            </div>
                        </div>
                        {isOddExcess && (
                            <button
                                onClick={() => handleAutoFitToTarget(currentPageCount - 1)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                            >
                                <LightningIcon />
                                <span>Kompakkan ke {currentPageCount - 1} Hal</span>
                            </button>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex rounded-xl bg-[var(--bg-muted)] p-1">
                        <button
                            onClick={() => setActiveTab('smart')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'smart' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <LightningIcon />
                            <span>Kompakkan Cerdas</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('presets')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'presets' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <SparklesIcon />
                            <span>Preset Format</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'custom' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <CardTextIcon />
                            <span>Kustom Manual</span>
                        </button>
                    </div>

                    {/* Tab 1: Smart Target Optimizer */}
                    {activeTab === 'smart' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                    Pilih Target Jumlah Halaman Ujian:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleAutoFitToTarget(num)}
                                            className={`p-3 rounded-2xl border text-left transition-all relative ${
                                                targetPage === num
                                                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm ring-2 ring-blue-500/20'
                                                    : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-blue-400 text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <div className="text-base font-bold flex items-center justify-between">
                                                <span>{num} Halaman</span>
                                                {num === 2 && (
                                                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">Hemat</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                                {num === 1 ? '1 Lembar (1 Muka)' : num === 2 ? '1 Lembar Bolak-Balik' : num === 3 ? '2 Lembar (Sisa 1 Muka)' : '2 Lembar Bolak-Balik'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary of active values */}
                            <div className="p-3.5 bg-[var(--bg-muted)]/50 rounded-2xl border border-[var(--border-primary)] space-y-2">
                                <p className="text-xs font-semibold text-[var(--text-secondary)]">Parameter format aktif setelah kompresi:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                    <div className="p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                        <span className="text-[10px] text-[var(--text-secondary)] block">Ukuran Font</span>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{fontSize} pt</span>
                                    </div>
                                    <div className="p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                        <span className="text-[10px] text-[var(--text-secondary)] block">Spasi Baris</span>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{lineSpacing}</span>
                                    </div>
                                    <div className="p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                        <span className="text-[10px] text-[var(--text-secondary)] block">Margin Kertas</span>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{marginAll} mm</span>
                                    </div>
                                    <div className="p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                        <span className="text-[10px] text-[var(--text-secondary)] block">Kolom Naskah</span>
                                        <span className="text-xs font-bold text-[var(--text-primary)]">{layoutColumns === 2 ? '2 Kolom' : '1 Kolom'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Presets */}
                    {activeTab === 'presets' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SMART_FIT_PRESETS.map((preset) => {
                                const isCurrent = fontSize === preset.fontSize && lineSpacing === preset.lineSpacing && marginAll === preset.margins.top && layoutColumns === preset.layoutColumns;
                                return (
                                    <div
                                        key={preset.id}
                                        onClick={() => handleApplyPreset(preset)}
                                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                            isCurrent
                                                ? 'border-blue-600 bg-blue-500/10 ring-2 ring-blue-500/20'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-blue-400'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-sm font-bold text-[var(--text-primary)]">{preset.name}</h4>
                                                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400">
                                                    {preset.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mb-3">{preset.description}</p>
                                        </div>
                                        <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                            <span>Font: {preset.fontSize}pt • Spasi: {preset.lineSpacing}</span>
                                            <span>{preset.layoutColumns === 2 ? '2 Kolom' : '1 Kolom'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tab 3: Custom Manual Controls */}
                    {activeTab === 'custom' && (
                        <div className="space-y-4">
                            {/* Font Size & Line Spacing */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-[var(--text-primary)]">Ukuran Font</label>
                                        <span className="text-xs font-bold text-blue-600">{fontSize} pt</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="9" 
                                        max="14" 
                                        step="0.5" 
                                        value={fontSize} 
                                        onChange={(e) => setFontSize(parseFloat(e.target.value))}
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                                        <span>9 pt (Ultra Padat)</span>
                                        <span>12 pt (Standar)</span>
                                        <span>14 pt (Besar)</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-[var(--text-primary)]">Spasi Baris</label>
                                        <span className="text-xs font-bold text-blue-600">{lineSpacing}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1.0" 
                                        max="1.4" 
                                        step="0.05" 
                                        value={lineSpacing} 
                                        onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                                        <span>1.0 (Rapat)</span>
                                        <span>1.15 (Normal)</span>
                                        <span>1.4 (Longgar)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Margins & Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-[var(--text-primary)]">Margin Kertas</label>
                                        <span className="text-xs font-bold text-blue-600">{marginAll} mm</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="8" 
                                        max="25" 
                                        step="1" 
                                        value={marginAll} 
                                        onChange={(e) => setMarginAll(parseInt(e.target.value, 10))}
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                                        <span>8 mm (Maksimal Luas)</span>
                                        <span>15 mm</span>
                                        <span>25 mm</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-primary)] block">Layout Kolom Naskah</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLayoutColumns(1)}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                                layoutColumns === 1
                                                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                                    : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-blue-400'
                                            }`}
                                        >
                                            <CardTextIcon />
                                            <span>1 Kolom</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLayoutColumns(2)}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                                layoutColumns === 2
                                                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                                    : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-blue-400'
                                            }`}
                                        >
                                            <LayoutSplitIcon />
                                            <span>2 Kolom</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <label className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-xs font-semibold text-[var(--text-primary)] block">Pilihan Ganda 2 Kolom</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Ratakan opsi A, B, C, D hemat ruang</span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={compactChoices}
                                        onChange={(e) => setCompactChoices(e.target.checked)}
                                        className="h-4 w-4 rounded accent-blue-600"
                                    />
                                </label>

                                <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-[var(--text-primary)] block">Ukuran Kertas</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Standar cetak sekolah</span>
                                    </div>
                                    <select
                                        value={paperSize}
                                        onChange={(e) => setPaperSize(e.target.value as Settings['paperSize'])}
                                        className="text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-2 py-1 outline-none text-[var(--text-primary)]"
                                    >
                                        <option value="A4">A4 (210×297mm)</option>
                                        <option value="F4">F4 / Folio (215×330mm)</option>
                                        <option value="Legal">Legal (216×356mm)</option>
                                        <option value="Letter">Letter (216×279mm)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Save Preference */}
                    <div className="pt-2 border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)]">
                            <input 
                                type="checkbox"
                                checked={saveAsDefault}
                                onChange={(e) => setSaveAsDefault(e.target.checked)}
                                className="h-4 w-4 rounded accent-blue-600"
                            />
                            <span>Simpan juga sebagai format bawaan (default) semua ujian</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                        >
                            <UndoIcon className="text-xs" />
                            <span>Kembalikan ke Semula</span>
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-muted)]/30 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
                    >
                        Tutup
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isApplying}
                        className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isApplying ? (
                            <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <CheckIcon className="text-sm" />
                        )}
                        <span>Terapkan Format Ini</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartPageFitModal;
