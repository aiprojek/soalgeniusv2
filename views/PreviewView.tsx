import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getExam, getSettings, saveExam, saveSettings } from '../lib/storage';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { generateDocx } from '../lib/docxGenerator';
import { generateMoodleXML } from '../lib/lmsGenerator';
import { validateExam } from '../lib/examValidator';
import ExamValidationModal from '../components/ExamValidationModal';
import LmsExportModal from '../components/LmsExportModal';
import SmartPageFitModal from '../components/SmartPageFitModal';
import {
    ChevronLeftIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon, PrinterIcon, 
    WordIcon, ServerIcon, ShieldCheckIcon, ExclamationTriangleIcon, CheckIcon,
    SparklesIcon
} from '../components/Icons';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';

const PreviewView: React.FC<{ examId: string; onBack: () => void; }> = ({ examId, onBack }) => {
    const [exam, setExam] = useState<Exam | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const [isExportingWord, setIsExportingWord] = useState(false);
    const [isLmsModalOpen, setIsLmsModalOpen] = useState(false);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [isSmartFitModalOpen, setIsSmartFitModalOpen] = useState(false);
    const [pageCount, setPageCount] = useState<number>(1);
    const [iframeHeight, setIframeHeight] = useState<string | number>('297mm');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const mobileActionsMenuRef = useRef<HTMLDivElement>(null);
    const actionsButtonRef = useRef<HTMLButtonElement>(null);
    const mainContainerRef = useRef<HTMLElement>(null);
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const loadedExam = await getExam(examId);
            const loadedSettings = await getSettings();
            if (loadedExam && loadedSettings) {
                setExam(loadedExam);
                setSettings(loadedSettings);
            } else {
                onBack();
            }
            setIsLoading(false);
        };
        loadData();
    }, [examId, onBack]);

    const validation = useMemo(() => exam ? validateExam(exam) : null, [exam]);

    useEffect(() => {
        if (!settings || !mainContainerRef.current || isLoading) return;

        const calculateZoom = () => {
            if (!mainContainerRef.current) return;
            const paperWidthMap = { 'A4': 210, 'F4': 215, 'Legal': 216, 'Letter': 216 };
            const paperWidthMm = paperWidthMap[settings.paperSize];
            const containerStyles = window.getComputedStyle(mainContainerRef.current);
            const paddingX = parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight);
            const containerWidth = mainContainerRef.current.clientWidth - paddingX;
            const paperWidthPx = paperWidthMm * 3.78;
            setZoom(containerWidth < paperWidthPx ? containerWidth / paperWidthPx : 1);
        };

        calculateZoom();
        window.addEventListener('resize', calculateZoom);
        return () => window.removeEventListener('resize', calculateZoom);
    }, [settings, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (actionsButtonRef.current && actionsButtonRef.current.contains(target)) {
                return;
            }
            if (
                (actionsMenuRef.current && !actionsMenuRef.current.contains(target)) &&
                (mobileActionsMenuRef.current && !mobileActionsMenuRef.current.contains(target))
            ) {
                setActionsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const examHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'exam', false);
    }, [exam, settings]);

    const answerKeyHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'answer_key', false);
    }, [exam, settings]);

    const getExportBaseFileName = useCallback(() => {
        if (!exam) return 'naskah_ujian';
        const sanitize = (str: string) => (str || '')
            .trim()
            .replace(/[\/\\:*?"<>|]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_');

        const parts: string[] = [];
        if (exam.title) parts.push(sanitize(exam.title));
        if (exam.subject) parts.push(sanitize(exam.subject));
        if (exam.class) parts.push(sanitize(exam.class));

        return parts.length > 0 ? parts.join('_') : 'naskah_ujian';
    }, [exam]);

    const showDonationPrompt = useCallback(() => {
        showConfirm({
            title: "Dukung SoalGenius",
            content: "Aplikasi ini bermanfaat untuk kebutuhan pembuatan naskah ujian Anda? Pertimbangkan untuk berdonasi sukarela demi mendukung pengembangan dan pemeliharaan aplikasi ini.",
            confirmLabel: "Dukung Sekarang",
            confirmVariant: "primary",
            onConfirm: () => {
                window.open('https://lynk.id/aiprojek/s/bvBJvdA', '_blank');
            }
        });
    }, [showConfirm]);

    const executeExportHtml = useCallback(() => {
        if (!exam || !settings) return;
        const currentMode = showAnswerKey ? 'answer_key' : 'exam';
        const baseName = getExportBaseFileName();
        const contentToExport = generateHtmlContent(exam, settings, currentMode, true);
        const blob = new Blob([contentToExport], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}${showAnswerKey ? '_Kunci_Jawaban' : ''}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`File Web HTML ${showAnswerKey ? 'Kunci Jawaban ' : ''}berhasil diunduh.`, 'success');

        showDonationPrompt();
    }, [exam, settings, showAnswerKey, getExportBaseFileName, addToast, showDonationPrompt]);

    const handleExportHtml = useCallback(() => {
        executeExportHtml();
    }, [executeExportHtml]);

    const executeExportWord = useCallback(async () => {
        if (!exam || !settings) return;
        setIsExportingWord(true);
        addToast('Menyiapkan dokumen Word...', 'info');

        try {
            const currentMode = showAnswerKey ? 'answer_key' : 'exam';
            const blob = await generateDocx(exam, settings, currentMode);
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            const baseName = getExportBaseFileName();
            const suffix = showAnswerKey ? '_Kunci_Jawaban' : '';
            const fileName = `${baseName}${suffix}_${timestamp}.docx`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast(`Dokumen Word ${showAnswerKey ? 'Kunci Jawaban ' : ''}berhasil diunduh.`, 'success');

            showDonationPrompt();
        } catch (error) {
            console.error("Export Word failed", error);
            addToast('Gagal mengekspor ke Word.', 'error');
        } finally {
            setIsExportingWord(false);
        }
    }, [exam, settings, showAnswerKey, getExportBaseFileName, addToast, showDonationPrompt]);

    const handleExportWord = useCallback(() => {
        executeExportWord();
    }, [executeExportWord]);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
        showDonationPrompt();
    };

    const handleApplySmartFit = async (newSettings: Settings, newExam: Exam, saveAsDefault: boolean) => {
        setSettings(newSettings);
        setExam(newExam);
        await saveExam(newExam);
        if (saveAsDefault) {
            await saveSettings(newSettings);
        }
    };

    const handleLivePreview = (tempSettings: Settings, tempExam: Exam) => {
        setSettings(tempSettings);
        setExam(tempExam);
    };

    const syncIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument;
        const frameWindow = iframe?.contentWindow;
        if (!iframe || !doc) return;

        const resize = () => {
            const html = doc.documentElement;
            const body = doc.body;
            const container = doc.querySelector('.exam-sheet-container');
            const sheets = doc.querySelectorAll('.exam-sheet');
            
            let sheetsTotalHeight = 0;
            if (sheets && sheets.length > 0) {
                const count = sheets.length;
                setPageCount(prev => (prev !== count ? count : prev));
                sheets.forEach(sheet => {
                    sheetsTotalHeight += (sheet as HTMLElement).offsetHeight || 0;
                });
                // 1.5rem (24px) gap between sheets + 2rem (32px) top and bottom padding
                sheetsTotalHeight += Math.max(0, sheets.length - 1) * 24 + 80;
            } else {
                setPageCount(prev => (prev !== 1 ? 1 : prev));
            }

            const nextHeight = Math.max(
                sheetsTotalHeight,
                (container as HTMLElement)?.scrollHeight || 0,
                html?.scrollHeight || 0,
                body?.scrollHeight || 0,
            );
            if (nextHeight > 0) {
                setIframeHeight(prev => (prev !== nextHeight ? nextHeight : prev));
            }
        };

        resize();
        const t1 = window.setTimeout(resize, 80);
        const t2 = window.setTimeout(resize, 200);

        frameWindow?.addEventListener('soalgenius-preview-paginated', resize);
        frameWindow?.addEventListener('resize', resize);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            frameWindow?.removeEventListener('soalgenius-preview-paginated', resize);
            frameWindow?.removeEventListener('resize', resize);
        };
    }, []);

    useEffect(() => {
        syncIframeHeight();
    }, [showAnswerKey, examHtml, answerKeyHtml, syncIframeHeight]);

    if (isLoading || !exam || !settings) {
        return <div className="fixed inset-0 app-shell-page flex items-center justify-center text-[var(--text-secondary)]">Memuat Pratinjau...</div>;
    }

    return (
        <div className="fixed inset-0 app-shell-page z-50 flex flex-col print:bg-white">
            <header className="relative z-30 flex-shrink-0 print:hidden border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-xs">
                {/* Row 1: Primary Identity, Navigation & Export Action */}
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
                        <button 
                            onClick={onBack} 
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors sm:h-10 sm:w-10"
                            title="Kembali ke Editor"
                            aria-label="Kembali"
                        >
                            <ChevronLeftIcon className="text-base sm:text-lg" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)] truncate" title={exam.title}>
                                {exam.title || 'Pratinjau Naskah Ujian'}
                            </h1>
                            <div className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[var(--text-muted)] truncate">
                                <span className="font-medium text-[var(--text-secondary)] truncate">{exam.subject?.trim() || 'Tanpa Mapel'}</span>
                                <span>•</span>
                                <span className="truncate">{exam.class?.trim() || 'Semua Kelas'}</span>
                                <span>•</span>
                                <span className="font-semibold text-[var(--text-primary)]">{pageCount} Halaman ({settings.paperSize || 'A4'})</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Primary Quick Action / Export Dropdown */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                            onClick={() => handlePrint()}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-3 py-2 text-xs sm:text-sm transition-colors shadow-2xs"
                            title="Cetak Langsung / Simpan PDF"
                        >
                            <PrinterIcon className="text-sm text-indigo-600 dark:text-indigo-400" />
                            <span className="hidden md:inline">Cetak PDF</span>
                        </button>

                        <div className="relative inline-flex">
                            <button 
                                ref={actionsButtonRef} 
                                onClick={() => setActionsMenuOpen(open => !open)} 
                                className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95" 
                                aria-haspopup="menu" 
                                aria-expanded={isActionsMenuOpen}
                            >
                                <DownloadIcon className="text-sm" />
                                <span>Ekspor & Aksi</span>
                                <i className={`bi bi-chevron-down text-[10px] transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`}></i>
                            </button>

                            {isActionsMenuOpen && (
                                <div ref={actionsMenuRef} className="animate-scale-in absolute right-0 top-[calc(100%+0.5rem)] z-[120] w-80 sm:w-92 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2 shadow-2xl origin-top-right">
                                    <div className="px-3 pb-2 pt-1 border-b border-[var(--border-primary)] mb-1">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">Format Ekspor & Dokumen</p>
                                        <p className="text-xs text-[var(--text-secondary)]">Pilih format unduhan naskah ujian atau kuis online</p>
                                    </div>
                                    <div className="space-y-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleExportWord(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400 rounded-xl">
                                            {isExportingWord ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <WordIcon className="text-lg" />}
                                            <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-sm block">Dokumen Word (.docx)</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] block">Format standar cetak & kunci terpisah</span>
                                            </div>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setIsLmsModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] text-orange-600 dark:text-orange-400 rounded-xl">
                                            <ServerIcon className="text-lg" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-sm block">Ekspor LMS & Bank Soal</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] block">Moodle, Canvas, GIFT, Quizizz, Excel</span>
                                            </div>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleExportHtml(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl">
                                            <DownloadIcon className="text-lg text-emerald-600" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-sm block">Ekspor Web HTML</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] block">Naskah halaman web mandiri</span>
                                            </div>
                                        </button>
                                        <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl">
                                            <PrinterIcon className="text-lg text-indigo-600" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-sm block">Cetak / Simpan PDF</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] block">Cetak langsung atau simpan PDF per halaman</span>
                                            </div>
                                        </button>

                                        <div className="border-t border-[var(--border-primary)] my-1 pt-1"></div>

                                        <button onClick={() => { setIsValidationModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] text-teal-600 dark:text-teal-400 rounded-xl">
                                            <ShieldCheckIcon className="text-lg" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-sm block">Audit & Validasi Naskah</span>
                                                <span className="text-[11px] text-[var(--text-secondary)] block">Cek kelengkapan kunci & kesiapan soal</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Secondary Toolbar (View Mode, Zoom, Smart Fit, Audit Status) */}
                <div className="border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/75 px-3 py-1.5 sm:px-5 sm:py-2 flex items-center justify-between gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                    {/* Left: View Mode Toggle & Zoom Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Soal / Kunci Jawaban Switcher */}
                        <div className="flex items-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-0.5 shadow-2xs">
                            <button 
                                onClick={() => setShowAnswerKey(false)} 
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${!showAnswerKey ? 'bg-blue-600 text-white shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                            >
                                Naskah Soal
                            </button>
                            <button 
                                onClick={() => setShowAnswerKey(true)} 
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${showAnswerKey ? 'bg-blue-600 text-white shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                            >
                                Kunci Jawaban
                            </button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-0.5 shadow-2xs">
                            <button 
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                                aria-label="Perkecil Zoom" 
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                            >
                                <ZoomOutIcon className="text-xs sm:text-sm" />
                            </button>
                            <span className="text-[var(--text-primary)] font-mono font-bold text-xs w-11 text-center select-none">
                                {(zoom * 100).toFixed(0)}%
                            </span>
                            <button 
                                onClick={() => setZoom(z => Math.min(2, z + 0.1))} 
                                aria-label="Perbesar Zoom" 
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                            >
                                <ZoomInIcon className="text-xs sm:text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Smart Fit Button & Audit Health Indicator */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {/* Page Count & Smart Page Fit Trigger */}
                        <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] shadow-2xs">
                                {pageCount} Lembar
                            </span>
                            <button
                                onClick={() => setIsSmartFitModalOpen(true)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                                    pageCount > 1 && pageCount % 2 !== 0
                                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                                        : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                                }`}
                                title="Optimalkan tata letak naskah agar hemat kertas fotokopi"
                            >
                                <SparklesIcon className="text-xs text-amber-500" />
                                <span>Pas Halaman (Smart Fit)</span>
                                {pageCount > 1 && pageCount % 2 !== 0 && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                )}
                            </button>
                        </div>

                        {/* Health Status Indicator Badge */}
                        {validation && (
                            <button 
                                onClick={() => setIsValidationModalOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                                    validation.healthScore >= 90
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                                        : validation.healthScore >= 70
                                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                                }`}
                                title="Klik untuk melihat hasil audit & validasi naskah"
                            >
                                <ShieldCheckIcon className="text-xs" />
                                <span>Kesiapan {validation.healthScore}%</span>
                                {validation.criticalIssues.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                                        {validation.criticalIssues.length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <main ref={mainContainerRef} className="flex-grow overflow-auto px-2 py-3 sm:p-8 flex justify-center app-bottom-safe" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #e2e8f0' }}>
                <div className="my-1 sm:my-8 origin-top transition-transform duration-200 ease-in-out flex-shrink-0 rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1 shadow-[var(--shadow-card)] sm:rounded-[24px] sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none" style={{ transform: `scale(${zoom})`, width: settings.paperSize === 'A4' ? '210mm' : settings.paperSize === 'F4' ? '215mm' : '216mm' }}>
                    <iframe ref={iframeRef} onLoad={syncIframeHeight} sandbox="allow-modals allow-same-origin allow-scripts" srcDoc={showAnswerKey ? answerKeyHtml : examHtml} title="Pratinjau Ujian" className="w-full rounded-[12px] sm:rounded-none shadow-lg sm:shadow-2xl" style={{ height: iframeHeight }} />
                </div>
            </main>

            {/* Mobile Actions Bottom Sheet */}
            {isActionsMenuOpen && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 md:hidden" onClick={() => setActionsMenuOpen(false)}>
                    <div ref={mobileActionsMenuRef} className="w-full rounded-t-[28px] bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] shadow-2xl animate-scale-in md:mt-16 md:w-[22rem] md:rounded-[22px] md:border md:border-[var(--border-primary)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center py-3 md:hidden">
                            <div className="h-1.5 w-14 rounded-full bg-[var(--border-secondary)]"></div>
                        </div>
                        <div className="px-5 pb-2 pt-1 md:pt-4 border-b border-[var(--border-primary)]">
                            <h4 className="text-base font-bold text-[var(--text-primary)] line-clamp-1">{exam.title}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">Pilih aksi ekspor atau cetak</p>
                        </div>
                        <div className="px-3 py-3 space-y-1">
                            <button onClick={(e) => { e.stopPropagation(); handleExportWord(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400">
                                {isExportingWord ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <WordIcon className="text-lg" />}
                                <span className="font-medium">Ekspor Word (.docx)</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsLmsModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-orange-600 dark:text-orange-400">
                                <ServerIcon className="text-lg" />
                                <span className="font-medium">Ekspor LMS & Bank Soal (Moodle, Canvas, CSV)</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleExportHtml(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                <DownloadIcon className="text-lg" />
                                <span className="font-medium">Ekspor HTML</span>
                            </button>
                            <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                <PrinterIcon className="text-lg" />
                                <span className="font-medium">Cetak / Simpan PDF</span>
                            </button>
                            <div className="border-t border-[var(--border-primary)] my-1"></div>
                            <button onClick={() => { setIsValidationModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-teal-600 dark:text-teal-400">
                                <ShieldCheckIcon className="text-lg" />
                                <span className="font-medium">Audit & Validasi Naskah</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Page Fit Modal */}
            <SmartPageFitModal
                isOpen={isSmartFitModalOpen}
                onClose={() => setIsSmartFitModalOpen(false)}
                exam={exam}
                settings={settings}
                currentPageCount={pageCount}
                onApplySettings={handleApplySmartFit}
                onLivePreview={handleLivePreview}
            />

            {/* LMS Export Hub Modal */}
            <LmsExportModal
                isOpen={isLmsModalOpen}
                onClose={() => setIsLmsModalOpen(false)}
                exam={exam}
                settings={settings}
                onValidateFirst={() => {
                    setIsLmsModalOpen(false);
                    setIsValidationModalOpen(true);
                }}
                showDonationPrompt={showDonationPrompt}
            />

            {/* Validation & Health Check Modal */}
            <ExamValidationModal
                isOpen={isValidationModalOpen}
                onClose={() => setIsValidationModalOpen(false)}
                exam={exam}
            />
        </div>
    );
};

export default PreviewView;
