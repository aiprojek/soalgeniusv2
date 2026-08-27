import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { generateLjkHtml, type LjkConfig } from '../lib/ljkGenerator';
import { CloseIcon, PrinterIcon, DownloadIcon, ScanIcon, CheckIcon } from './Icons';
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
                <div className="flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                            <i className="bi bi-grid-3x3-gap-fill text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                Generator Lembar Jawab Komputer / Kamera (LJK)
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Cetak template LJK standar siap pakai, hemat kertas, dan kompatibel dengan koreksi foto/kamera otomatis.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                onOpenScanner();
                            }}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all"
                        >
                            <ScanIcon className="text-sm" />
                            <span>Buka Scanner & Koreksi</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <CloseIcon className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                    {/* Settings Panel (Left) */}
                    <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-4 overflow-y-auto space-y-4 text-xs">
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
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                                        Jumlah Butir Soal PG:
                                    </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {config.totalQuestions} Soal
                                    </span>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {[20, 25, 30, 35, 40, 50].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setConfig(c => ({ ...c, totalQuestions: num }))}
                                            className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-all ${
                                                config.totalQuestions === num
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                                                    : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="60"
                                    step="5"
                                    value={config.totalQuestions}
                                    onChange={(e) => setConfig(c => ({ ...c, totalQuestions: parseInt(e.target.value, 10) }))}
                                    className="w-full mt-2 accent-blue-600"
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
                    </div>

                    {/* Preview Panel (Right) */}
                    <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] p-3 sm:p-5 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <i className="bi bi-eye-fill text-blue-500"></i>
                                Pratinjau Lembar Cetak LJK (A4)
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                                {config.layout === '2-page' ? '1 Halaman A4 = 2 Lembar LJK (Gunting di tengah)' : 'Ukuran Standar A4'}
                            </span>
                        </div>

                        {/* Iframe Viewport */}
                        <div className="flex-1 rounded-xl border border-[var(--border-primary)] bg-slate-100 overflow-hidden relative shadow-inner">
                            <iframe
                                ref={iframeRef}
                                srcDoc={ljkHtml}
                                title="Pratinjau LJK"
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <i className="bi bi-info-circle text-blue-500"></i>
                        <span>Dilengkapi 4 jangkar sudut untuk presisi scanner kamera.</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleDownloadHtml}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-3.5 py-2 text-xs transition-colors"
                        >
                            <DownloadIcon className="text-xs" />
                            <span>Unduh File HTML</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs shadow-sm transition-all active:scale-95"
                        >
                            <PrinterIcon className="text-xs" />
                            <span>Cetak LJK / Simpan PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LjkGeneratorModal;
