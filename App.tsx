


import React, { useState, useCallback, useEffect } from 'react';
import type { Exam, Settings } from './types';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

import MainLayout from './components/MainLayout';
import ArchiveView from './views/ArchiveView';
import EditorView from './views/EditorView';
import PreviewView from './views/PreviewView';
import SettingsView from './views/SettingsView';
import QuestionBankView from './views/QuestionBankView';
import HelpView from './views/HelpView';
import { saveExam } from './lib/storage';

export type View = 'archive' | 'editor' | 'bank' | 'settings' | 'preview' | 'help';

function AppContent() {
    const [view, setView] = useState<View>('archive');
    const [editingExamId, setEditingExamId] = useState<string | null>(null);
    const [previewingExamId, setPreviewingExamId] = useState<string | null>(null);
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    useEffect(() => {
        // Check if we are in a browser environment that supports service workers
        // and if we are not running inside an iframe (like the AI Studio preview).
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
                                        onConfirm: () => {
                                            installingWorker.postMessage({ type: 'SKIP_WAITING' });
                                        }
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
        } else if (window.self !== window.top) {
            console.log('Running in a sandboxed environment (iframe), skipping service worker registration.');
        }
    }, [showConfirm]);


    const handleNavigate = useCallback((newView: View) => {
        setView(newView);
    }, []);

    const handleEditExam = useCallback((id: string) => {
        setEditingExamId(id);
        setView('editor');
    }, []);
    
    const handlePreviewExam = useCallback((id: string) => {
        setPreviewingExamId(id);
        setView('preview');
    }, []);

    const handleCreateExam = useCallback(() => {
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
        saveExam(newExam);
        addToast('Ujian baru berhasil dibuat.', 'success');
        setEditingExamId(newExam.id);
        setView('editor');
    }, [addToast]);

    const handleBackToArchive = useCallback(() => {
        setEditingExamId(null);
        setPreviewingExamId(null);
        setView('archive');
    }, []);
    
    if (view === 'editor' && editingExamId) {
        return <EditorView examId={editingExamId} onBack={handleBackToArchive} />;
    }
    
    if (view === 'preview' && previewingExamId) {
        return <PreviewView examId={previewingExamId} onBack={handleBackToArchive} />;
    }
    
    return (
        <MainLayout currentView={view} onNavigate={handleNavigate}>
            {view === 'archive' && <ArchiveView onEditExam={handleEditExam} onCreateExam={handleCreateExam} onPreviewExam={handlePreviewExam} />}
            {view === 'settings' && <SettingsView />}
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