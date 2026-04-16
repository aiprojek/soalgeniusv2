import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getExam, getSettings } from '../lib/storage';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { generateDocx } from '../lib/docxGenerator';
import { generateMoodleXML } from '../lib/lmsGenerator';
import {
    ChevronLeftIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon, PrinterIcon, WordIcon, ServerIcon
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
    const [iframeHeight, setIframeHeight] = useState<string | number>('297mm');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
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

        const timer = setTimeout(calculateZoom, 100);
        window.addEventListener('resize', calculateZoom);
        return () => { clearTimeout(timer); window.removeEventListener('resize', calculateZoom); };
    }, [settings, isLoading]);

    useEffect(() => {
        if (!isActionsMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;

            const clickedMenu = actionsMenuRef.current?.contains(target);
            const clickedButton = actionsButtonRef.current?.contains(target);
            if (!clickedMenu && !clickedButton) {
                setActionsMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActionsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActionsMenuOpen]);

    useEffect(() => {
        if (!settings) return;
        const defaultHeight = settings.paperSize === 'A4' ? '297mm' : settings.paperSize === 'F4' ? '330mm' : settings.paperSize === 'Legal' ? '356mm' : '279mm';
        setIframeHeight(defaultHeight);
    }, [settings, showAnswerKey]);

    const examHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'exam', false);
    }, [exam, settings]);

    const answerKeyHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'answer_key', false);
    }, [exam, settings]);

    // --- Donation Prompt Helper ---
    const showDonationPrompt = useCallback(() => {
        // Small delay to make it feel natural after the download starts
        setTimeout(() => {
            showConfirm({
                title: "Dukungan Pengembangan ☕",
                content: (
                    <div className="text-sm text-[var(--text-secondary)] space-y-3">
                        <p>Dokumen berhasil diproses! Semoga bermanfaat untuk kegiatan mengajar Bapak/Ibu.</p>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p><strong>SoalGenius</strong> dikembangkan secara mandiri dan gratis (Open Source). Jika aplikasi ini membantu pekerjaan Anda, pertimbangkan untuk mentraktir kami kopi agar kami semangat mengembangkan fitur baru.</p>
                        </div>
                    </div>
                ),
                confirmLabel: "Traktir Kopi",
                confirmVariant: "primary",
                onConfirm: () => window.open("https://lynk.id/aiprojek/s/bvBJvdA", "_blank")
            });
        }, 1500);
    }, [showConfirm]);

    const handleExportHtml = useCallback(() => {
        if (!exam || !settings) return;
        
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_').replace(/_+/g, '_');
        const baseName = [sanitize(exam.subject), sanitize(exam.class), sanitize(exam.title), timestamp].filter(Boolean).join('_');
        const currentMode = showAnswerKey ? 'answer_key' : 'exam';
        const contentToExport = generateHtmlContent(exam, settings, currentMode, false);
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

    const handleExportWord = useCallback(async () => {
        if (!exam || !settings) return;
        setIsExportingWord(true);
        addToast('Menyiapkan dokumen Word...', 'info');
        
        try {
            const blob = await generateDocx(exam, settings);
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_');
            const fileName = `${sanitize(exam.title)}_${timestamp}.docx`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Dokumen Word berhasil diunduh.', 'success');
            
            showDonationPrompt();
        } catch (error) {
            console.error("Export Word failed", error);
            addToast('Gagal mengekspor ke Word.', 'error');
        } finally {
            setIsExportingWord(false);
        }
    }, [exam, settings, addToast, showDonationPrompt]);

    const handleExportMoodle = useCallback(() => {
        if (!exam) return;
        try {
            const xml = generateMoodleXML(exam);
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_');
            a.download = `${sanitize(exam.title)}_moodle.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('File Moodle XML berhasil diunduh.', 'success');
            
            showDonationPrompt();
        } catch (error) {
            console.error("Export Moodle failed", error);
            addToast('Gagal mengekspor ke Moodle XML.', 'error');
        }
    }, [exam, addToast, showDonationPrompt]);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
        // In many browsers, code execution pauses at print(), then resumes.
        // We add a delay to ensure the dialog is likely closed or the user is done interacting.
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
            const nextHeight = Math.max(
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
        window.setTimeout(resize, 80);
        window.setTimeout(resize, 220);
        window.setTimeout(resize, 500);
        frameWindow?.addEventListener('soalgenius-preview-paginated', resize);
        frameWindow?.addEventListener('resize', resize);
    }, []);
    
    if (isLoading || !exam || !settings) {
        return <div className="fixed inset-0 app-shell-page flex items-center justify-center text-[var(--text-secondary)]">Memuat Pratinjau...</div>;
    }

    return (
        <div className="fixed inset-0 app-shell-page z-50 flex flex-col print:bg-white">
            <header className="relative z-30 flex-shrink-0 print:hidden border-b border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_90%,transparent)] backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5">
                    <div className="flex min-w-0 flex-1 justify-start">
                        <button onClick={onBack} className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] font-semibold py-2 px-3 rounded-xl hover:bg-[var(--bg-hover)]">
                            <ChevronLeftIcon className="text-xl" />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>
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
                    </div>
                    
                    <div className="flex-1 flex justify-end">
                        <div className="hidden md:block">
                            <div className="relative inline-flex">
                                <button ref={actionsButtonRef} onClick={() => setActionsMenuOpen(open => !open)} className="flex items-center space-x-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-3 rounded-xl" aria-haspopup="menu" aria-expanded={isActionsMenuOpen}>
                                    <DownloadIcon />
                                    <span>Aksi</span>
                                </button>
                                {isActionsMenuOpen && (
                                <div ref={actionsMenuRef} className="animate-fade-in absolute right-0 top-[calc(100%+0.65rem)] z-[120] w-[22rem] rounded-[18px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2 shadow-[var(--shadow-card)]">
                                    <div className="px-3 pb-2 pt-1">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Aksi Dokumen</p>
                                        <p className="text-xs text-[var(--text-secondary)]">Export atau cetak dokumen dari sini</p>
                                    </div>
                                    <div className="space-y-1">
                                        <button onClick={() => { handleExportWord(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400">
                                            {isExportingWord ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <WordIcon />}
                                            <span className="font-medium">Ekspor Word (.docx)</span>
                                        </button>
                                        <button onClick={() => { handleExportHtml(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                            <DownloadIcon />
                                            <span className="font-medium">Ekspor HTML</span>
                                        </button>
                                        <button onClick={() => { handleExportMoodle(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-orange-600 dark:text-orange-400">
                                            <ServerIcon />
                                            <span className="font-medium">Ekspor Moodle XML</span>
                                        </button>
                                        <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                            <PrinterIcon />
                                            <span className="font-medium">Cetak / Simpan PDF</span>
                                        </button>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setActionsMenuOpen(true)} className="flex items-center space-x-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-3 rounded-xl text-sm sm:px-4" aria-haspopup="dialog" aria-expanded={isActionsMenuOpen}>
                                <DownloadIcon />
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl px-2.5 pb-2 md:hidden">
                    <div className="app-surface-muted rounded-[var(--radius-card)] px-2.5 py-2 sm:px-3 sm:py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="truncate text-[13px] sm:text-sm font-bold text-[var(--text-primary)]">{exam.title}</h1>
                                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                                    {showAnswerKey ? 'Kunci Jawaban' : 'Lembar Soal'} • {(zoom * 100).toFixed(0)}%
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

            {isActionsMenuOpen && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 md:hidden" onClick={() => setActionsMenuOpen(false)}>
                    <div className="w-full rounded-t-[28px] bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] shadow-2xl animate-scale-in md:mt-16 md:w-[22rem] md:rounded-[22px] md:border md:border-[var(--border-primary)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center py-3 md:hidden">
                            <div className="h-1.5 w-14 rounded-full bg-[var(--border-secondary)]"></div>
                        </div>
                        <div className="px-5 pb-2 pt-1 md:pt-4">
                            <h4 className="text-base font-bold text-[var(--text-primary)] line-clamp-1">{exam.title}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">Pilih aksi export atau cetak</p>
                        </div>
                        <div className="px-3 pb-5 space-y-1">
                            <button onClick={() => { handleExportWord(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400">
                                {isExportingWord ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <WordIcon />}
                                <span className="font-medium">Ekspor Word (.docx)</span>
                            </button>
                            <button onClick={() => { handleExportHtml(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                <DownloadIcon />
                                <span className="font-medium">Ekspor HTML</span>
                            </button>
                            <button onClick={() => { handleExportMoodle(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-orange-600 dark:text-orange-400">
                                <ServerIcon />
                                <span className="font-medium">Ekspor Moodle XML</span>
                            </button>
                            <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full app-control flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                                <PrinterIcon />
                                <span className="font-medium">Cetak / Simpan PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviewView;
