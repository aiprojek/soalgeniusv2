import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getExam, getSettings } from '../lib/storage';
import { generateHtmlContent } from '../lib/htmlGenerator';
import {
    ChevronLeftIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon, PrinterIcon
} from '../components/Icons';


const PreviewView: React.FC<{ examId: string; onBack: () => void; }> = ({ examId, onBack }) => {
    const [exam, setExam] = useState<Exam | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLElement>(null);


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
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setActionsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [actionsMenuRef]);

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

    const examHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'exam', false);
    }, [exam, settings]);

    const answerKeyHtml = useMemo(() => {
        if (!exam || !settings) return '';
        return generateHtmlContent(exam, settings, 'answer_key', false);
    }, [exam, settings]);

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
    }, [exam, settings, showAnswerKey]);

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
    };
    
    if (isLoading || !exam || !settings) {
        return <div className="fixed inset-0 bg-slate-200 flex items-center justify-center text-slate-700">Memuat Pratinjau...</div>;
    }

    return (
        <div className="fixed inset-0 bg-slate-200 dark:bg-slate-950 z-50 flex flex-col print:bg-white">
            <header className="bg-[var(--bg-secondary)] shadow-md flex-shrink-0 print:hidden border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
                    <div className="flex-1 flex justify-start">
                        <button onClick={onBack} className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] font-semibold py-2 px-3 rounded-lg">
                            <ChevronLeftIcon className="text-xl" />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} aria-label="Perkecil" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg"><ZoomOutIcon className="text-xl" /></button>
                            <span className="text-[var(--text-primary)] font-semibold w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} aria-label="Perbesar" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg"><ZoomInIcon className="text-xl" /></button>
                        </div>
                        <div className="hidden sm:flex items-center rounded-lg bg-[var(--bg-muted)] p-0.5">
                            <button onClick={() => setShowAnswerKey(false)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${!showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>Soal</button>
                            <button onClick={() => setShowAnswerKey(true)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${showAnswerKey ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>Kunci Jawaban</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex justify-end">
                        <div className="hidden md:flex items-center space-x-3">
                            <button onClick={handleExportHtml} className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"><DownloadIcon /><span>Ekspor HTML</span></button>
                            <button onClick={handlePrint} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"><PrinterIcon /><span>Cetak / Simpan PDF</span></button>
                        </div>
                        <div className="md:hidden relative" ref={actionsMenuRef}>
                            <button onClick={() => setActionsMenuOpen(p => !p)} className="flex items-center space-x-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg" aria-haspopup="true" aria-expanded={isActionsMenuOpen}>
                                <span>Opsi</span><i className="bi bi-chevron-down text-xs"></i>
                            </button>
                            {isActionsMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg z-20 border border-[var(--border-primary)] py-1">
                                    <div className="px-4 py-2 text-xs text-[var(--text-muted)] uppercase">Tampilan</div>
                                    <button onClick={() => { setShowAnswerKey(false); setActionsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><span>Lihat Soal</span></button>
                                    <button onClick={() => { setShowAnswerKey(true); setActionsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><span>Lihat Kunci Jawaban</span></button>
                                    <div className="my-1 border-t border-[var(--border-primary)]"></div>
                                    <button onClick={() => { handleExportHtml(); setActionsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><DownloadIcon /><span>Ekspor HTML</span></button>
                                    <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><PrinterIcon /><span>Cetak / Simpan PDF</span></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main ref={mainContainerRef} className="flex-grow overflow-auto p-4 sm:p-8 flex justify-center" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #e2e8f0' }}>
                 <div className="my-8 origin-top transition-transform duration-200 ease-in-out flex-shrink-0" style={{ transform: `scale(${zoom})`, width: settings.paperSize === 'A4' ? '210mm' : settings.paperSize === 'F4' ? '215mm' : '216mm' }}>
                    <iframe ref={iframeRef} srcDoc={showAnswerKey ? answerKeyHtml : examHtml} title="Pratinjau Ujian" className="w-full shadow-2xl" style={{ height: settings.paperSize === 'A4' ? '297mm' : settings.paperSize === 'F4' ? '330mm' : settings.paperSize === 'Legal' ? '356mm' : '279mm' }} />
                </div>
            </main>
        </div>
    );
};

export default PreviewView;