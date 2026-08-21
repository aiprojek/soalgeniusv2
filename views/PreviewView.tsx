import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getExam, getSettings } from '../lib/storage';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { generateDocx } from '../lib/docxGenerator';
import { generateMoodleXML } from '../lib/lmsGenerator';
import { validateExam } from '../lib/examValidator';
import ExamValidationModal from '../components/ExamValidationModal';
import LmsExportModal from '../components/LmsExportModal';
import {
    ChevronLeftIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon, PrinterIcon, 
    WordIcon, ServerIcon, ShieldCheckIcon, ExclamationTriangleIcon, CheckIcon
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

    const showDonationPrompt = useCallback(() => {
        const key = 'lastDonationPrompt';
        const lastPrompt = localStorage.getItem(key);
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (!lastPrompt || (now - parseInt(lastPrompt, 10)) > oneDay) {
            localStorage.setItem(key, now.toString());
            showConfirm({
                title: "Dukung SoalGenius",
                content: "Aplikasi ini bermanfaat? Pertimbangkan untuk berdonasi agar pengembangan dapat terus berlanjut.",
                confirmLabel: "Donasi Sekarang",
                cancelLabel: "Nanti Saja",
                confirmVariant: "primary",
                onConfirm: () => {
                    window.open('https://saweria.co/akzashine', '_blank');
                }
            });
        }
    }, [showConfirm]);

    const executeExportHtml = useCallback(() => {
        if (!exam || !settings) return;
        const currentMode = showAnswerKey ? 'answer_key' : 'exam';
        const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_');
        const baseName = sanitize(exam.title);
        const contentToExport = generateHtmlContent(exam, settings, currentMode, true);
        const blob = new Blob([contentToExport], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}${showAnswerKey ? '_kunci_jawaban' : ''}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showDonationPrompt();
    }, [exam, settings, showAnswerKey, showDonationPrompt]);

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
            const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_');
            const suffix = showAnswerKey ? '_Kunci_Jawaban' : '';
            const fileName = `${sanitize(exam.title)}${suffix}_${timestamp}.docx`;

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
    }, [exam, settings, showAnswerKey, addToast, showDonationPrompt]);

    const handleExportWord = useCallback(() => {
        executeExportWord();
    }, [executeExportWord]);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
        showDonationPrompt();
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
                setPageCount(sheets.length);
                sheets.forEach(sheet => {
                    sheetsTotalHeight += (sheet as HTMLElement).offsetHeight || 0;
                });
                // 1.5rem (24px) gap between sheets + 2rem (32px) top and bottom padding
                sheetsTotalHeight += Math.max(0, sheets.length - 1) * 24 + 80;
            } else {
                setPageCount(1);
            }

            const nextHeight = Math.max(
                sheetsTotalHeight,
                (container as HTMLElement)?.scrollHeight || 0,
                (container as HTMLElement)?.offsetHeight || 0,
                html?.scrollHeight || 0,
                body?.scrollHeight || 0,
                html?.offsetHeight || 0,
                body?.offsetHeight || 0,
            );
            if (nextHeight > 0) {
                setIframeHeight(nextHeight);
            }
        };

        resize();
        window.setTimeout(resize, 60);
        window.setTimeout(resize, 180);
        window.setTimeout(resize, 400);
        window.setTimeout(resize, 1000);
        frameWindow?.addEventListener('soalgenius-preview-paginated', resize);
        frameWindow?.addEventListener('resize', resize);
    }, []);

    useEffect(() => {
        syncIframeHeight();
    }, [showAnswerKey, examHtml, answerKeyHtml, syncIframeHeight]);

    if (isLoading || !exam || !settings) {
        return <div className="fixed inset-0 app-shell-page flex items-center justify-center text-[var(--text-secondary)]">Memuat Pratinjau...</div>;
    }

    return (
        <div className="fixed inset-0 app-shell-page z-50 flex flex-col print:bg-white">
            <header className="relative z-30 flex-shrink-0 print:hidden border-b border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_90%,transparent)] backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button onClick={onBack} className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] font-semibold py-2 px-3 rounded-xl hover:bg-[var(--bg-hover)]">
                            <ChevronLeftIcon className="text-xl" />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>

                        {/* Health Status Indicator Badge */}
                        {validation && (
                            <button 
                                onClick={() => setIsValidationModalOpen(true)}
                                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                    validation.healthScore >= 90
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                                        : validation.healthScore >= 70
                                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                                }`}
                                title="Klik untuk melihat hasil audit & validasi naskah"
                            >
                                <ShieldCheckIcon />
                                <span>Kesiapan {validation.healthScore}%</span>
                                {validation.criticalIssues.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                                        {validation.criticalIssues.length} Isu
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="hidden md:flex flex-1 items-center justify-center gap-3 lg:gap-4 px-3">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} aria-label="Perkecil" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg"><ZoomOutIcon className="text-xl" /></button>
                            <span className="text-[var(--text-primary)] font-semibold w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} aria-label="Perbesar" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg"><ZoomInIcon className="text-xl" /></button>
                        </div>
                        <div className="flex items-center rounded-xl bg-[var(--bg-muted)] p-0.5">
                            <button onClick={() => setShowAnswerKey(false)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${!showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>Soal</button>
                            <button onClick={() => setShowAnswerKey(true)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>Kunci Jawaban</button>
                        </div>
                        <div className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                            {pageCount} Lembar
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-2">
                        <div className="hidden md:block">
                            <div className="relative inline-flex">
                                <button ref={actionsButtonRef} onClick={() => setActionsMenuOpen(open => !open)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3.5 rounded-xl shadow-sm transition-colors" aria-haspopup="menu" aria-expanded={isActionsMenuOpen}>
                                    <DownloadIcon />
                                    <span>Ekspor & Aksi</span>
                                    <i className={`bi bi-chevron-down text-xs transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isActionsMenuOpen && (
                                    <div ref={actionsMenuRef} className="animate-fade-in absolute right-0 top-[calc(100%+0.65rem)] z-[120] w-[23rem] rounded-[20px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2 shadow-2xl">
                                        <div className="px-3 pb-2 pt-1 border-b border-[var(--border-primary)] mb-1">
                                            <p className="text-sm font-bold text-[var(--text-primary)]">Format Ekspor & Dokumen</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Pilih format unduhan naskah ujian atau kuis online</p>
                                        </div>
                                        <div className="space-y-1">
                                            <button onClick={(e) => { e.stopPropagation(); handleExportWord(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400 rounded-xl">
                                                {isExportingWord ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <WordIcon className="text-lg" />}
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-sm block">Dokumen Word (.docx)</span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] block">Format standar cetak & kunci terpisah</span>
                                                </div>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setIsLmsModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--bg-hover)] text-orange-600 dark:text-orange-400 rounded-xl">
                                                <ServerIcon className="text-lg" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-sm block">Ekspor LMS & Bank Soal</span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] block">Moodle, Canvas, GIFT, Quizizz, Excel</span>
                                                </div>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleExportHtml(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl">
                                                <DownloadIcon className="text-lg text-emerald-600" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-sm block">Ekspor Web HTML</span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] block">Naskah halaman web mandiri</span>
                                                </div>
                                            </button>
                                            <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl">
                                                <PrinterIcon className="text-lg text-indigo-600" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-sm block">Cetak / Simpan PDF</span>
                                                    <span className="text-[11px] text-[var(--text-secondary)] block">Cetak langsung atau simpan PDF per halaman</span>
                                                </div>
                                            </button>

                                            <div className="border-t border-[var(--border-primary)] my-1 pt-1"></div>

                                            <button onClick={() => { setIsValidationModalOpen(true); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--bg-hover)] text-teal-600 dark:text-teal-400 rounded-xl">
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
                        <div className="md:hidden">
                            <button onClick={() => setActionsMenuOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-sm sm:px-4 shadow-sm" aria-haspopup="dialog" aria-expanded={isActionsMenuOpen}>
                                <DownloadIcon />
                                <span>Ekspor</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl px-2.5 pb-2 md:hidden">
                    <div className="app-surface-muted rounded-[var(--radius-card)] px-2.5 py-2 sm:px-3 sm:py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="truncate text-[13px] sm:text-sm font-bold text-[var(--text-primary)]">{exam.title}</h1>
                                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <span>{showAnswerKey ? 'Kunci Jawaban' : 'Lembar Soal'}</span>
                                    <span>•</span>
                                    <span>{pageCount} Lembar</span>
                                    <span>•</span>
                                    <span>{(zoom * 100).toFixed(0)}%</span>
                                    {validation && (
                                        <>
                                            <span>•</span>
                                            <span 
                                                onClick={() => setIsValidationModalOpen(true)}
                                                className={`font-semibold cursor-pointer underline ${validation.healthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}
                                            >
                                                Audit: {validation.healthScore}%
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} aria-label="Perkecil" className="app-control p-1.5 sm:p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><ZoomOutIcon className="text-base sm:text-lg" /></button>
                                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} aria-label="Perbesar" className="app-control p-1.5 sm:p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><ZoomInIcon className="text-base sm:text-lg" /></button>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center rounded-[var(--radius-control)] bg-[var(--bg-muted)] p-0.5">
                            <button onClick={() => setShowAnswerKey(false)} className={`flex-1 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-semibold rounded-lg transition-colors ${!showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 shadow-sm' : 'text-[var(--text-secondary)]'}`}>Soal</button>
                            <button onClick={() => setShowAnswerKey(true)} className={`flex-1 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-semibold rounded-lg transition-colors ${showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 shadow-sm' : 'text-[var(--text-secondary)]'}`}>Kunci</button>
                        </div>
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
