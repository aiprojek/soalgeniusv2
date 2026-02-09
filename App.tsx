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
import HelpView from './views/HelpView';
import { saveExam } from './lib/storage';

export type View = 'archive' | 'editor' | 'bank' | 'settings' | 'preview' | 'help';

// Interface untuk state history browser
interface HistoryState {
    view: View;
    examId?: string | null;
    settingsTab?: 'general' | 'header' | 'format' | 'cloud' | 'storage';
}

function AppContent() {
    const [view, setView] = useState<View>('archive');
    const [editingExamId, setEditingExamId] = useState<string | null>(null);
    const [previewingExamId, setPreviewingExamId] = useState<string | null>(null);
    const [isMigrating, setIsMigrating] = useState(true);
    // State to control which tab is open when Settings is loaded
    const [initialSettingsTab, setInitialSettingsTab] = useState<'general' | 'header' | 'format' | 'cloud' | 'storage'>('general');
    
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
            window.history.replaceState({ view: 'archive' }, '', '');
        }

        // 2. Handler saat tombol back ditekan
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state as HistoryState;
            
            if (state && state.view) {
                // Restore state dari history
                setView(state.view);
                
                if (state.view === 'editor' && state.examId) {
                    setEditingExamId(state.examId);
                } else if (state.view === 'preview' && state.examId) {
                    setPreviewingExamId(state.examId);
                } else if (state.view === 'settings' && state.settingsTab) {
                    setInitialSettingsTab(state.settingsTab);
                } else {
                    // Reset ID jika kembali ke root/archive
                    setEditingExamId(null);
                    setPreviewingExamId(null);
                }
            } else {
                // Fallback jika state hilang (misal refresh keras), kembali ke archive
                setView('archive');
                setEditingExamId(null);
                setPreviewingExamId(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Helper untuk push history
    const pushViewHistory = (targetView: View, extraState: Partial<HistoryState> = {}) => {
        const newState: HistoryState = { view: targetView, ...extraState };
        window.history.pushState(newState, '', '');
        
        // Update React State sync
        setView(targetView);
        if (targetView === 'editor' && extraState.examId) setEditingExamId(extraState.examId);
        if (targetView === 'preview' && extraState.examId) setPreviewingExamId(extraState.examId);
        if (targetView === 'settings' && extraState.settingsTab) setInitialSettingsTab(extraState.settingsTab);
        
        // Reset jika masuk ke menu utama
        if (['archive', 'bank', 'help'].includes(targetView)) {
            setEditingExamId(null);
            setPreviewingExamId(null);
        }
    };

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
                // Modern browsers ignore the custom message, but triggering the event
                // causes the standard "Leave site? Changes you made may not be saved" dialog.
                e.preventDefault();
                e.returnValue = ''; 
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);
    
    useEffect(() => {
        if ('serviceWorker' in navigator && window.self === window.top) {
            const registerServiceWorker = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
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
                    console.error('Error during service worker registration:', error);
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

    const handleNavigate = useCallback((newView: View) => {
        // Reset settings tab to default when navigating normally via menu
        const settingsTab = newView === 'settings' ? 'general' : undefined;
        pushViewHistory(newView, { settingsTab });
    }, []);

    const handleEditExam = useCallback((id: string) => { 
        pushViewHistory('editor', { examId: id });
    }, []);

    const handlePreviewExam = useCallback((id: string) => { 
        pushViewHistory('preview', { examId: id });
    }, []);
    
    // Special handler to jump to Cloud Settings
    const handleOpenCloudSettings = useCallback(() => {
        pushViewHistory('settings', { settingsTab: 'cloud' });
    }, []);

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
            // Navigasi ke editor dengan push history
            pushViewHistory('editor', { examId: newExam.id });
        } catch (error) {
            console.error("Gagal membuat ujian baru:", error);
            addToast('Gagal membuat ujian baru.', 'error');
        }
    }, [addToast]);

    const handleBackToArchive = useCallback(() => {
        // Saat tombol "Kembali" di UI ditekan, kita panggil history.back()
        // Ini akan memicu event 'popstate' yang sudah kita handle di useEffect
        // sehingga state aplikasi akan mundur secara alami.
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
    
    if (view === 'editor' && editingExamId) {
        return <EditorView examId={editingExamId} onBack={handleBackToArchive} />;
    }
    
    if (view === 'preview' && previewingExamId) {
        return <PreviewView examId={previewingExamId} onBack={handleBackToArchive} />;
    }
    
    return (
        <MainLayout 
            currentView={view} 
            onNavigate={handleNavigate}
            onOpenCloudSettings={handleOpenCloudSettings}
        >
            {view === 'archive' && <ArchiveView onEditExam={handleEditExam} onCreateExam={handleCreateExam} onPreviewExam={handlePreviewExam} />}
            {view === 'settings' && <SettingsView initialTab={initialSettingsTab} />}
            {view === 'bank' && <QuestionBankView />}
            {view === 'help' && <HelpView />}
        </MainLayout>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ModalProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </ModalProvider>
        </ThemeProvider>
    );
}