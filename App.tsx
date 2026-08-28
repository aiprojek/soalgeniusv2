import React, { useState, useCallback, useEffect } from 'react';
import type { Exam } from './types';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { migrateFromLocalStorage } from './lib/migration';
import { isDropboxConnected, checkForCloudUpdates, downloadFromDropbox, hasUnsavedLocalChanges } from './lib/dropbox';

import MainLayout from './components/MainLayout';
import ArchiveView from './views/ArchiveView';
import EditorView from './views/EditorView';
import PreviewView from './views/PreviewView';
import SettingsView from './views/SettingsView';
import QuestionBankView from './views/QuestionBankView';
import CommunityView from './views/CommunityView';
import HelpView from './views/HelpView';
import { saveExam } from './lib/storage';

export type View = 'archive' | 'editor' | 'bank' | 'community' | 'settings' | 'preview' | 'help';

// Gabungkan semua state navigasi ke dalam satu objek agar update bersifat atomik
interface NavState {
    view: View;
    examId: string | null;
    settingsTab: 'template' | 'general' | 'header' | 'format' | 'ai' | 'cloud' | 'storage';
}

// Interface untuk state history browser
interface HistoryState {
    view: View;
    examId?: string | null;
    settingsTab?: 'template' | 'general' | 'header' | 'format' | 'ai' | 'cloud' | 'storage';
}

const defaultNav: NavState = { view: 'archive', examId: null, settingsTab: 'general' };

function AppContent() {
    const [nav, setNav] = useState<NavState>(defaultNav);
    const [isMigrating, setIsMigrating] = useState(true);
    
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    useEffect(() => {
        // Jalankan migrasi saat aplikasi pertama kali dimuat
        const runMigration = async () => {
            try {
                await migrateFromLocalStorage();
            } catch (error) {
                console.error("Proses migrasi gagal:", error);
                addToast("Gagal memigrasi data lama. Beberapa data mungkin tidak muncul.", "error");
            } finally {
                setIsMigrating(false);
            }
        };
        runMigration();
    }, [addToast]);

    // --- History API Integration (Native Back Button Support) ---
    useEffect(() => {
        // 1. Set initial state saat load pertama kali agar tidak null
        if (!window.history.state) {
            window.history.replaceState({ view: 'archive' } as HistoryState, '', '');
        }

        // 2. Handler saat tombol back ditekan
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state as HistoryState | null;

            if (state && state.view) {
                // Restore state secara atomik (satu setNav panggilan)
                setNav({
                    view: state.view,
                    examId: state.examId ?? null,
                    settingsTab: state.settingsTab ?? 'general',
                });
            } else {
                // Fallback jika state hilang (misal refresh keras), kembali ke archive
                setNav(defaultNav);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // --- Automatic Cloud Sync Check ---
    useEffect(() => {
        if (!isMigrating && isDropboxConnected()) {
            const checkSync = async () => {
                const hasUpdates = await checkForCloudUpdates();
                if (hasUpdates) {
                    showConfirm({
                        title: "Sinkronisasi Data Cloud",
                        content: "Terdeteksi data yang lebih baru di Dropbox (mungkin dari perangkat lain). Apakah Anda ingin mengunduhnya? Data lokal saat ini akan ditimpa.",
                        confirmLabel: "Unduh & Sinkronkan",
                        confirmVariant: "primary",
                        onConfirm: async () => {
                            try {
                                addToast('Mengunduh pembaruan...', 'info');
                                await downloadFromDropbox();
                                addToast('Aplikasi telah disinkronkan dengan Cloud. Memuat ulang...', 'success');
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (e) {
                                addToast('Gagal menyinkronkan data.', 'error');
                            }
                        }
                    });
                }
            };
            // Delay slightly to ensure DB is ready
            setTimeout(checkSync, 2000);
        }
    }, [isMigrating, showConfirm, addToast]);

    // --- Unsaved Changes Guard (Before Unload) ---
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDropboxConnected() && hasUnsavedLocalChanges()) {
                e.preventDefault();
                e.returnValue = ''; 
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);
    
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const registerServiceWorker = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('./sw.js');
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showConfirm({
                                        title: "Pembaruan Tersedia",
                                        content: "Versi baru SoalGenius telah diunduh. Muat ulang untuk mendapatkan fitur terbaru.",
                                        confirmLabel: "Muat Ulang",
                                        onConfirm: () => installingWorker.postMessage({ type: 'SKIP_WAITING' }),
                                    });
                                }
                            };
                        }
                    };
                } catch (error) {
                    console.warn('Service worker registration note (e.g. running in sandbox or iframe):', error);
                }
            };

            registerServiceWorker();
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        }
    }, [showConfirm]);

    // Helper untuk push history — update state secara atomik
    const pushViewHistory = useCallback((targetView: View, extra: Partial<Omit<NavState, 'view'>> = {}) => {
        const newNav: NavState = {
            view: targetView,
            examId: extra.examId ?? null,
            settingsTab: extra.settingsTab ?? 'general',
        };
        const historyState: HistoryState = { view: targetView, examId: newNav.examId, settingsTab: newNav.settingsTab };
        window.history.pushState(historyState, '', '');
        setNav(newNav);
    }, []);

    const handleNavigate = useCallback((newView: View) => {
        pushViewHistory(newView);
    }, [pushViewHistory]);

    const handleEditExam = useCallback((id: string) => { 
        pushViewHistory('editor', { examId: id });
    }, [pushViewHistory]);

    const handlePreviewExam = useCallback((id: string) => { 
        pushViewHistory('preview', { examId: id });
    }, [pushViewHistory]);
    
    // Special handler to jump to Cloud Settings
    const handleOpenCloudSettings = useCallback(() => {
        pushViewHistory('settings', { settingsTab: 'cloud' });
    }, [pushViewHistory]);

    const handleCreateExam = useCallback(async () => {
        const newExam: Exam = {
            id: crypto.randomUUID(),
            title: 'Ujian Baru Tanpa Judul',
            subject: '',
            class: '',
            date: new Date().toISOString().split('T')[0],
            waktuUjian: '90 Menit',
            keterangan: '',
            instructions: '1. Berdoalah sebelum mengerjakan soal.\n2. Jawablah pertanyaan dengan jujur dan teliti.',
            sections: [{
                id: crypto.randomUUID(),
                instructions: 'I. (Instruksi akan muncul di sini saat soal pertama ditambahkan)',
                questions: []
            }],
            status: 'draft',
            direction: 'ltr',
            layoutColumns: 1,
        };
        try {
            await saveExam(newExam);
            addToast('Ujian baru berhasil dibuat.', 'success');
            pushViewHistory('editor', { examId: newExam.id });
        } catch (error) {
            console.error("Gagal membuat ujian baru:", error);
            addToast('Gagal membuat ujian baru.', 'error');
        }
    }, [addToast, pushViewHistory]);

    const handleCreateExamFromBank = useCallback(async (newExam: Exam) => {
        try {
            await saveExam(newExam);
            addToast('Naskah ujian berhasil dibuat dari Bank Soal!', 'success');
            pushViewHistory('editor', { examId: newExam.id });
        } catch (error) {
            console.error("Gagal membuat ujian dari Bank Soal:", error);
            addToast('Gagal membuat ujian dari Bank Soal.', 'error');
        }
    }, [addToast, pushViewHistory]);

    const handleBackToArchive = useCallback(() => {
        // Panggil history.back() — akan memicu popstate yang handle state secara atomik
        window.history.back();
    }, []);

    if (isMigrating) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <div className="text-center">
                    <div className="text-2xl font-bold">Soal<span className="text-[var(--text-accent)]">Genius</span></div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Mempersiapkan data Anda...</p>
                </div>
            </div>
        );
    }
    
    if (nav.view === 'editor' && nav.examId) {
        return <EditorView examId={nav.examId} onBack={handleBackToArchive} onPreview={() => handlePreviewExam(nav.examId!)} />;
    }
    
    if (nav.view === 'preview' && nav.examId) {
        return <PreviewView examId={nav.examId} onBack={handleBackToArchive} />;
    }
    
    return (
        <MainLayout 
            currentView={nav.view} 
            onNavigate={handleNavigate}
            onOpenCloudSettings={handleOpenCloudSettings}
        >
            {nav.view === 'archive' && <ArchiveView onEditExam={handleEditExam} onCreateExam={handleCreateExam} onPreviewExam={handlePreviewExam} />}
            {nav.view === 'settings' && <SettingsView initialTab={nav.settingsTab} />}
            {nav.view === 'bank' && (
                <QuestionBankView 
                    onNavigateToCommunity={() => handleNavigate('community')} 
                    onCreateExam={handleCreateExamFromBank}
                />
            )}
            {nav.view === 'community' && <CommunityView onEditExam={handleEditExam} onNavigateToBank={() => handleNavigate('bank')} />}
            {nav.view === 'help' && <HelpView onNavigate={handleNavigate} />}
        </MainLayout>
    );
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught application error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-primary)] p-4 text-[var(--text-primary)]">
                    <div className="max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 text-center shadow-lg">
                        <div className="text-xl font-bold text-red-500">Terjadi Kesalahan</div>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                            {this.state.error?.message || "Aplikasi mengalami kendala saat memuat komponen."}
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Muat Ulang Aplikasi
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ModalProvider>
                    <ToastProvider>
                        <AppContent />
                    </ToastProvider>
                </ModalProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
