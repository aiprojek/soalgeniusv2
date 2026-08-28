import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Exam, Settings } from '../types';
import { generateLjkHtml, type LjkConfig } from '../lib/ljkGenerator';
import { CloseIcon, PrinterIcon, DownloadIcon, ScanIcon, CheckIcon, ZoomInIcon, ZoomOutIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface LjkGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: Exam;
    settings: Settings;
    onOpenScanner: () => void;
}

export const LjkGeneratorModal: React.FC<LjkGeneratorModalProps> = ({
    isOpen,
    onClose,
    exam,
    settings,
    onOpenScanner
}) => {
    const { addToast } = useToast();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Auto-detect question count from multiple choice questions in the exam
    const detectedCounts = useMemo(() => {
        let mcCount = 0;
        let essayCount = 0;
        for (const section of exam.sections || []) {
            for (const q of section.questions || []) {
                if (q.choices && q.choices.length > 0) {
                    mcCount++;
                } else if (q.type !== 'Informasi / Stimulus' as any) {
                    essayCount++;
                }
            }
        }
        return {
            mc: mcCount > 0 ? mcCount : 30,
            essay: essayCount > 0 ? essayCount : 5,
            hasOptionE: exam.sections?.some(s => s.questions.some(q => (q.choices?.length || 0) >= 5)) || false
        };
    }, [exam]);

    const [config, setConfig] = useState<LjkConfig>({
        layout: '2-page', // Default to 2 per A4 (hemat kertas)
        optionCount: detectedCounts.hasOptionE ? 5 : 4,
        totalQuestions: detectedCounts.mc,
        hasEssay: detectedCounts.essay > 0,
        essayCount: Math.min(10, detectedCounts.essay),
        showStudentNis: true,
        showStudentName: true,
        showPacketCode: true,
        showScoreBox: true,
        showInstructions: true,
        customSchoolName: settings.examHeaderLines?.[0]?.text || '',
        customExamTitle: exam.title || ''
    });

    // Mobile view tab: 'settings' | 'preview'
    const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('preview');

    // Zoom state for LJK preview with auto-center
    const [zoom, setZoom] = useState<number>(0.85);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Initial zoom calculation based on container width (like in PreviewView)
    useEffect(() => {
        if (!isOpen) return;

        const calculateZoom = () => {
            if (!previewContainerRef.current) return;
            const containerWidth = previewContainerRef.current.clientWidth - 32; // padding
            if (containerWidth <= 0) return;
            const paperWidthPx = 210 * 3.78; // 210mm in px (~794px)
            if (containerWidth < paperWidthPx) {
                setZoom(Math.max(0.3, Number((containerWidth / paperWidthPx).toFixed(2))));
            } else {
                setZoom(0.85);
            }
        };

        const timer = setTimeout(calculateZoom, 60);
        window.addEventListener('resize', calculateZoom);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateZoom);
        };
    }, [isOpen, mobileTab]);

    // Generate HTML for preview
    const ljkHtml = useMemo(() => {
        return generateLjkHtml(exam, settings, config, false);
    }, [exam, settings, config]);

    // Handle Direct Print
    const handlePrint = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print();
        } else {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(ljkHtml);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    // Handle Download HTML
    const handleDownloadHtml = () => {
        const fullHtml = generateLjkHtml(exam, settings, config, true);
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = (exam.title || 'LJK').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `LJK_${cleanTitle}_${config.layout}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Template LJK berhasil diunduh.', 'success');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
            <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3.5 py-2.5 sm:px-6 sm:py-3 gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <i className="bi bi-grid-3x3-gap-fill text-lg sm:text-xl"></i>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)] truncate">
                                Generator Lembar Jawab Komputer (LJK)
                            </h2>
                            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                                Template siap cetak, hemat kertas & kompatibel dengan koreksi scan.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 flex-shrink-0">
                        <button
                            onClick={() => {
                                onClose();
                                onOpenScanner();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 sm:px-3 text-xs font-bold shadow-xs transition-all"
                        >
                            <ScanIcon className="text-sm" />
                            <span className="hidden xs:inline sm:inline">Scanner & Koreksi</span>
                            <span className="xs:hidden sm:hidden">Scanner</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                            title="Tutup"
                            aria-label="Tutup"
                        >
                            <CloseIcon className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Mobile View Switcher (Tab toggle on small screens) */}
                <div className="flex md:hidden items-center border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setMobileTab('settings')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'settings'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                    >
                        <i className="bi bi-sliders text-xs"></i>
                        <span>Format LJK</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMobileTab('preview');
                            setTimeout(() => calculateAutoZoom(), 50);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'preview'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                    >
                        <i className="bi bi-eye-fill text-xs"></i>
                        <span>Pratinjau LJK</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
                    {/* Settings Panel (Left) */}
                    <div className={`${mobileTab === 'settings' ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 flex-col border-b md:border-b-0 md:border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-3.5 sm:p-4 overflow-y-auto space-y-4 text-xs`}>
                        {/* Format & Layout Selection */}
                        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3.5 space-y-3">
                            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                                Model Tata Letak (Kertas A4)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfig(c => ({ ...c, layout: '2-page' }))}
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                                        config.layout === '2-page'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                                            : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-blue-300'
                                    }`}
                                >
                                    <i className="bi bi-layout-split text-lg mb-1"></i>
                                    <span className="text-[11px] leading-tight">2 LJK / A4</span>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Hemat 50%</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setConfig(c => ({ ...c, layout: '1-page' }))}
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                                        config.layout === '1-page'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                                            : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-blue-300'
                                    }`}
                                >
                                    <i className="bi bi-file-earmark-text text-lg mb-1"></i>
                                    <span className="text-[11px] leading-tight">1 LJK / A4</span>
                                    <span className="text-[9px] text-[var(--text-muted)]">Ukuran Penuh</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setConfig(c => ({ ...c, layout: '4-page' }))}
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                                        config.layout === '4-page'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                                            : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-blue-300'
                                    }`}
                                >
                                    <i className="bi bi-grid-fill text-lg mb-1"></i>
                                    <span className="text-[11px] leading-tight">4 LJK / A4</span>
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Mini Kuis</span>
                                </button>
                            </div>
                        </div>

                        {/* Jumlah Soal & Opsi Pilihan Ganda */}
                        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3.5 space-y-3">
                            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                                Konfigurasi Soal Pilihan Ganda
                            </label>

                            {/* Opsi Pilihan (A-D vs A-E) */}
                            <div>
                                <span className="text-[11px] text-[var(--text-secondary)] font-medium mb-1 block">
                                    Pilihan Jawaban:
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, optionCount: 4 }))}
                                        className={`py-1.5 px-3 rounded-lg border text-center font-bold transition-all ${
                                            config.optionCount === 4
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        A, B, C, D (4 Opsi)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, optionCount: 5 }))}
                                        className={`py-1.5 px-3 rounded-lg border text-center font-bold transition-all ${
                                            config.optionCount === 5
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        A, B, C, D, E (5 Opsi)
                                    </button>
                                </div>
                            </div>

                            {/* Jumlah Butir Soal PG */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                                        Jumlah Butir Soal PG:
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {config.totalQuestions} Soal
                                    </span>
                                </div>

                                {/* Manual Number Input with - and + Stepper */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, totalQuestions: Math.max(1, c.totalQuestions - 1) }))}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
                                        title="Kurangi 1 soal"
                                        aria-label="Kurangi 1 soal"
                                    >
                                        <i className="bi bi-dash"></i>
                                    </button>
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={config.totalQuestions || ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (isNaN(val)) {
                                                    setConfig(c => ({ ...c, totalQuestions: 1 }));
                                                } else {
                                                    setConfig(c => ({ ...c, totalQuestions: Math.max(1, Math.min(100, val)) }));
                                                }
                                            }}
                                            placeholder="Jml Soal"
                                            className="w-full h-8 text-center font-bold text-xs rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] pointer-events-none">
                                            butir
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, totalQuestions: Math.min(100, c.totalQuestions + 1) }))}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
                                        title="Tambah 1 soal"
                                        aria-label="Tambah 1 soal"
                                    >
                                        <i className="bi bi-plus"></i>
                                    </button>
                                </div>

                                {/* Quick Presets & Sesuai Naskah */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[var(--text-muted)]">Pilihan Cepat:</span>
                                        {detectedCounts.mc > 0 && config.totalQuestions !== detectedCounts.mc && (
                                            <button
                                                type="button"
                                                onClick={() => setConfig(c => ({ ...c, totalQuestions: detectedCounts.mc }))}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                                            >
                                                <i className="bi bi-magic"></i>
                                                Sesuai Naskah ({detectedCounts.mc})
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {[10, 20, 25, 30, 35, 40, 45, 50, 60].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setConfig(c => ({ ...c, totalQuestions: num }))}
                                                className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-all ${
                                                    config.totalQuestions === num
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                                                        : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-blue-300'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min="5"
                                    max="80"
                                    step="1"
                                    value={config.totalQuestions}
                                    onChange={(e) => setConfig(c => ({ ...c, totalQuestions: parseInt(e.target.value, 10) }))}
                                    className="w-full accent-blue-600 mt-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Bagian Uraian & Isian */}
                        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-[var(--text-primary)]">
                                    Sertakan Kolom Esai / Uraian
                                </label>
                                <input
                                    type="checkbox"
                                    checked={config.hasEssay}
                                    onChange={(e) => setConfig(c => ({ ...c, hasEssay: e.target.checked }))}
                                    className="h-4 w-4 rounded border-[var(--border-primary)] text-blue-600 focus:ring-blue-500"
                                />
                            </div>

                            {config.hasEssay && (
                                <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between">
                                    <span className="text-[11px] text-[var(--text-secondary)]">Jumlah Butir Uraian:</span>
                                    <select
                                        value={config.essayCount}
                                        onChange={(e) => setConfig(c => ({ ...c, essayCount: parseInt(e.target.value, 10) }))}
                                        className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs"
                                    >
                                        <option value="3">3 Butir</option>
                                        <option value="5">5 Butir</option>
                                        <option value="10">10 Butir</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Komponen Header & Kolom Identitas */}
                        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3.5 space-y-2.5">
                            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                                Kelengkapan Form & Petunjuk
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showPacketCode}
                                    onChange={(e) => setConfig(c => ({ ...c, showPacketCode: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded border-[var(--border-primary)] text-blue-600"
                                />
                                <span className="text-[11px] text-[var(--text-primary)]">Bulatan Kode Paket (A/B/C/D)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showScoreBox}
                                    onChange={(e) => setConfig(c => ({ ...c, showScoreBox: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded border-[var(--border-primary)] text-blue-600"
                                />
                                <span className="text-[11px] text-[var(--text-primary)]">Kotak Nilai & Paraf Guru</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showInstructions}
                                    onChange={(e) => setConfig(c => ({ ...c, showInstructions: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded border-[var(--border-primary)] text-blue-600"
                                />
                                <span className="text-[11px] text-[var(--text-primary)]">Petunjuk Pengisian Bulatan</span>
                            </label>
                        </div>

                        {/* Mobile Quick Action to View Preview */}
                        <div className="pt-2 md:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileTab('preview')}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-2.5 px-4 shadow-sm"
                            >
                                <i className="bi bi-eye-fill"></i>
                                <span>Lihat Pratinjau Lembar LJK</span>
                            </button>
                        </div>
                    </div>

                    {/* Preview Panel (Right) */}
                    <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-[var(--bg-tertiary)] p-3 sm:p-4 overflow-hidden h-full`}>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 truncate">
                                <i className="bi bi-eye-fill text-blue-600"></i>
                                Pratinjau Lembar (A4)
                            </span>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                                    {config.layout === '2-page' ? '2 Lembar / A4' : config.layout === '4-page' ? '4 Lembar / A4' : '1 Lembar / A4'}
                                </span>

                                {/* Zoom Controls (Identical to PreviewView) */}
                                <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-0.5 shadow-2xs">
                                    <button 
                                        type="button"
                                        onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))))} 
                                        aria-label="Perkecil Zoom" 
                                        className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                        title="Perkecil Zoom"
                                    >
                                        <ZoomOutIcon className="text-xs sm:text-sm" />
                                    </button>
                                    <span className="text-[var(--text-primary)] font-mono font-bold text-xs w-11 text-center select-none">
                                        {(zoom * 100).toFixed(0)}%
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => setZoom(z => Math.min(2, Number((z + 0.1).toFixed(2))))} 
                                        aria-label="Perbesar Zoom" 
                                        className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                        title="Perbesar Zoom"
                                    >
                                        <ZoomInIcon className="text-xs sm:text-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Viewport container with auto-centering identical to PreviewView */}
                        <div 
                            ref={previewContainerRef}
                            className="flex-1 rounded-xl bg-slate-200/70 dark:bg-slate-900/60 border border-[var(--border-primary)] overflow-auto p-3 sm:p-5 flex justify-center items-start w-full h-full"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            {/* Scaled paper viewport container that accurately sizes to zoom and stays centered */}
                            <div 
                                className="my-1 sm:my-2 mx-auto flex-shrink-0 flex justify-center items-start transition-[width,height] duration-200 ease-in-out"
                                style={{
                                    width: `calc(210mm * ${zoom})`,
                                    height: `calc(297mm * ${zoom})`
                                }}
                            >
                                <div 
                                    className="origin-top transition-transform duration-200 ease-in-out flex-shrink-0 shadow-lg bg-white rounded"
                                    style={{ 
                                        transform: `scale(${zoom})`, 
                                        width: '210mm',
                                        height: '297mm'
                                    }}
                                >
                                    <iframe
                                        ref={iframeRef}
                                        srcDoc={ljkHtml}
                                        title="Pratinjau Lembar LJK"
                                        sandbox="allow-modals allow-same-origin allow-scripts"
                                        className="w-[210mm] h-[297mm] border-0 bg-white block rounded"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3.5 py-2.5 sm:px-6 sm:py-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <i className="bi bi-info-circle text-blue-500"></i>
                        <span>Dilengkapi 4 jangkar sudut untuk presisi scanner kamera.</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleDownloadHtml}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-3 py-2 text-xs transition-colors"
                        >
                            <DownloadIcon className="text-xs" />
                            <span>Unduh File HTML</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 text-xs shadow-sm transition-all active:scale-95"
                        >
                            <PrinterIcon className="text-xs" />
                            <span>Cetak / Simpan PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LjkGeneratorModal;
