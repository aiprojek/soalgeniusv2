import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { View } from '../App';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { getAllExams, getSettings } from '../lib/storage';
import { db } from '../lib/db';
import { isDropboxConnected, uploadToDropbox, downloadFromDropbox } from '../lib/dropbox';
import { 
    BurgerMenuIcon, CloseIcon, ArchiveIcon, BankIcon, BackupIcon, RestoreIcon, SettingsIcon, HelpIcon,
    CloudUploadIcon, CloudDownloadIcon, DropboxIcon
} from './Icons';

const MainLayout: React.FC<{
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}> = ({ children, currentView, onNavigate }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [hasDropbox, setHasDropbox] = useState(false);

    const restoreInputRef = useRef<HTMLInputElement>(null);
    const { showConfirm } = useModal();
    const { addToast } = useToast();

    // Check Dropbox status on mount and whenever sidebar opens
    useEffect(() => {
        setHasDropbox(isDropboxConnected());
    }, [isSidebarOpen]);

    useEffect(() => {
        if (isSidebarOpen) {
            setIsRendered(true);
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isSidebarOpen]);
    
    useEffect(() => {
        if (isRendered) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isRendered]);

    const handleBackup = useCallback(async () => {
        try {
            const exams = await getAllExams();
            const settings = await getSettings();
            const bankQuestions = await db.bankQuestions.toArray();

            const backupData = {
                source: 'SoalGeniusDB',
                version: 2,
                createdAt: new Date().toISOString(),
                data: { exams, settings, bankQuestions }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `soalgenius_backup_v2_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('File backup berhasil dibuat.', 'success');
            setSidebarOpen(false);
        } catch (error) {
            console.error("Backup failed", error);
            addToast('Gagal membuat file backup.', 'error');
        }
    }, [addToast]);

    const handleRestoreClick = useCallback(() => {
        restoreInputRef.current?.click();
    }, []);

    const handleFileRestore = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File reading error");
                const backupData = JSON.parse(text);

                if ((backupData.source !== 'SoalGeniusDB' && backupData.source !== 'SoalGenius') || !backupData.data) {
                    addToast('File backup tidak valid atau rusak.', 'error');
                    return;
                }
                
                showConfirm({
                    title: "Konfirmasi Restore",
                    content: "Apakah Anda yakin ingin merestore data? Semua data ujian dan pengaturan saat ini akan ditimpa.",
                    confirmVariant: "danger",
                    confirmLabel: "Restore",
                    onConfirm: async () => {
                        try {
                             await db.transaction('rw', db.exams, db.settings, db.bankQuestions, async () => {
                                // Hapus semua data yang ada
                                await db.exams.clear();
                                await db.settings.clear();
                                await db.bankQuestions.clear();

                                // Masukkan data baru
                                if (backupData.data.exams) await db.exams.bulkPut(backupData.data.exams);
                                if (backupData.data.settings) await db.settings.put({ ...backupData.data.settings, key: 'app_settings' });
                                if (backupData.data.bankQuestions) await db.bankQuestions.bulkPut(backupData.data.bankQuestions);
                            });

                            addToast('Data berhasil direstore. Aplikasi akan dimuat ulang.', 'success');
                            setTimeout(() => window.location.reload(), 1500);
                        } catch(err) {
                            console.error("Gagal melakukan restore ke database", err);
                            addToast('Terjadi kesalahan saat menyimpan data restore.', 'error');
                        }
                    },
                });

            } catch (error) {
                console.error("Gagal merestore:", error);
                addToast('Gagal memproses file backup. Pastikan file valid.', 'error');
            } finally {
                if (event.target) event.target.value = '';
                setSidebarOpen(false);
            }
        };
        reader.readAsText(file);
    }, [showConfirm, addToast]);

    // --- Dropbox Actions in Sidebar ---
    const handleCloudUpload = async () => {
        showConfirm({
            title: "Upload ke Dropbox",
            content: "Ini akan menimpa file backup di Dropbox Anda dengan data dari perangkat ini. Lanjutkan?",
            confirmLabel: "Upload",
            onConfirm: async () => {
                try {
                    addToast('Mengupload ke Dropbox...', 'info');
                    await uploadToDropbox();
                    addToast('Berhasil upload data ke Dropbox.', 'success');
                    setSidebarOpen(false);
                } catch (error: any) {
                    addToast(error.message, 'error');
                }
            }
        });
    };

    const handleCloudDownload = async () => {
        showConfirm({
            title: "Ambil dari Dropbox",
            content: "PERINGATAN: Semua data di perangkat ini akan DITIMPA dengan data dari Dropbox. Pastikan Anda sudah backup data lokal jika perlu.",
            confirmVariant: 'danger',
            confirmLabel: "Download & Timpa",
            onConfirm: async () => {
                try {
                    addToast('Mengunduh dari Dropbox...', 'info');
                    await downloadFromDropbox();
                    addToast('Data berhasil dipulihkan. Memuat ulang...', 'success');
                    setSidebarOpen(false);
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error: any) {
                    addToast(error.message, 'error');
                }
            }
        });
    };
    
    const handleHelp = () => {
        onNavigate('help');
    };

    const sidebarItems = [
        { id: 'archive', label: 'Arsip Soal', icon: ArchiveIcon, action: () => onNavigate('archive') },
        { id: 'bank', label: 'Bank Soal', icon: BankIcon, action: () => onNavigate('bank') },
        { id: 'backup', label: 'Backup Lokal', icon: BackupIcon, action: handleBackup },
        { id: 'restore', label: 'Restore Lokal', icon: RestoreIcon, action: handleRestoreClick },
    ];
    
    const sidebarBottomItems = [
        { id: 'settings', label: 'Pengaturan', icon: SettingsIcon, action: () => onNavigate('settings') },
        { id: 'help', label: 'Bantuan', icon: HelpIcon, action: handleHelp },
    ];
    
    // Combine for Desktop header
    const allNavItems = [...sidebarItems, ...sidebarBottomItems];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
            <input type="file" ref={restoreInputRef} onChange={handleFileRestore} className="hidden" accept="application/json" />
            {/* Mobile Sidebar Overlay & Container */}
            <div
                className={`fixed inset-0 z-30 md:hidden ${isRendered ? 'visible' : 'invisible'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-title"
            >
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
                <aside 
                    className={`relative ml-auto h-full w-72 bg-[var(--bg-secondary)] shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                        <h2 id="sidebar-title" className="text-lg font-semibold text-[var(--text-primary)]">Menu</h2>
                        <button onClick={() => setSidebarOpen(false)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Tutup menu">
                            <CloseIcon className="text-xl" />
                        </button>
                    </div>
                     <nav className="p-4 flex-grow overflow-y-auto">
                        <ul className="space-y-2">
                            {sidebarItems.map(item => (
                                <li key={item.id}>
                                    <a href="#" aria-current={currentView === item.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); item.action(); if(item.id !== 'backup' && item.id !== 'restore') setSidebarOpen(false); }} className={`flex items-center space-x-3 p-3 rounded-lg ${currentView === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                                        <item.icon className="text-xl" /><span>{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>

                        {/* Dropbox Section */}
                        {hasDropbox && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                                <div className="px-3 mb-2 text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-2">
                                    <DropboxIcon /> <span>Cloud Sync</span>
                                </div>
                                <ul className="space-y-2">
                                    <li>
                                        <button onClick={handleCloudUpload} className="w-full flex items-center space-x-3 p-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] text-left">
                                            <CloudUploadIcon className="text-xl text-blue-600 dark:text-blue-400" />
                                            <span>Upload ke Cloud</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={handleCloudDownload} className="w-full flex items-center space-x-3 p-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] text-left">
                                            <CloudDownloadIcon className="text-xl text-green-600 dark:text-green-400" />
                                            <span>Ambil dari Cloud</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </nav>
                    <nav className="p-4 border-t border-[var(--border-primary)]">
                        <ul className="space-y-2">
                             {sidebarBottomItems.map(item => (
                                <li key={item.id}>
                                    <a href="#" aria-current={currentView === item.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); item.action(); setSidebarOpen(false); }} className={`flex items-center space-x-3 p-3 rounded-lg ${currentView === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                                        <item.icon className="text-xl" /><span>{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
            </div>

            {/* Main Page Content */}
            <div aria-hidden={isSidebarOpen} className="flex flex-col flex-grow">
                <header className="bg-[var(--bg-secondary)] shadow-md sticky top-0 z-10 border-b border-[var(--border-primary)]">
                    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            Soal<span className="text-[var(--text-accent)]">Genius</span>
                        </h1>
                         {/* Mobile Burger Button */}
                         <button onClick={() => setSidebarOpen(true)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg md:hidden" aria-label="Buka menu">
                            <BurgerMenuIcon className="text-2xl" />
                        </button>
                        {/* Desktop Header Navigation */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {allNavItems.map(item => (
                                <div key={item.id} className="relative group">
                                     <button 
                                        onClick={item.action} 
                                        className={`p-3 rounded-full transition-colors duration-200 ${currentView === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                                        aria-label={item.label}
                                        aria-current={currentView === item.id ? 'page' : undefined}
                                    >
                                        <item.icon className="text-xl" />
                                    </button>
                                     <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 w-max bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg border border-[var(--border-primary)]">
                                        {item.label}
                                        <svg className="absolute text-[var(--bg-secondary)] h-3 w-2 left-full top-1/2 -translate-y-1/2" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 255,127.5 0,255"/></svg>
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </header>
                <main className="container mx-auto p-4 md:p-8 flex-grow">
                    {children}
                </main>
                <footer className="text-center py-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
                     © {new Date().getFullYear()} SoalGenius. Dibuat dengan ❤️ untuk para pendidik.
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;