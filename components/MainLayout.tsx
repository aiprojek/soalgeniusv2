import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../App';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { isDropboxConnected, uploadToDropbox, downloadFromDropbox } from '../lib/dropbox';
import { 
    ArchiveIcon, BankIcon, SettingsIcon, HelpIcon,
    CloudUploadIcon, CloudDownloadIcon, DropboxIcon, CloudCheckIcon
} from './Icons';

const MainLayout: React.FC<{
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
    onOpenCloudSettings?: () => void;
}> = ({ children, currentView, onNavigate, onOpenCloudSettings }) => {
    const [hasDropbox, setHasDropbox] = useState(false);
    
    // Cloud Menu State
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);
    const cloudMenuRef = useRef<HTMLDivElement>(null);

    const { showConfirm } = useModal();
    const { addToast } = useToast();

    // Check Dropbox status on mount and whenever sidebar/header interacts
    useEffect(() => {
        setHasDropbox(isDropboxConnected());
    }, [currentView, isCloudMenuOpen]);

    // Handle Click Outside for Cloud Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cloudMenuRef.current && !cloudMenuRef.current.contains(event.target as Node)) {
                setIsCloudMenuOpen(false);
            }
        };
        if (isCloudMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCloudMenuOpen]);

    // --- Dropbox Actions ---
    const handleCloudUpload = async () => {
        setIsCloudMenuOpen(false);
        showConfirm({
            title: "Update ke Cloud (Upload)",
            content: "Ini akan menimpa file backup di Dropbox Anda dengan data dari perangkat ini. Lanjutkan?",
            confirmLabel: "Upload",
            onConfirm: async () => {
                try {
                    addToast('Mengupload ke Dropbox...', 'info');
                    await uploadToDropbox();
                    addToast('Berhasil update data ke Dropbox.', 'success');
                } catch (error: any) {
                    addToast(error.message, 'error');
                }
            }
        });
    };

    const handleCloudDownload = async () => {
        setIsCloudMenuOpen(false);
        showConfirm({
            title: "Restore dari Cloud (Download)",
            content: "PERINGATAN: Semua data di perangkat ini akan DITIMPA dengan data dari Dropbox. Pastikan Anda sudah backup data lokal jika perlu.",
            confirmVariant: 'danger',
            confirmLabel: "Download & Timpa",
            onConfirm: async () => {
                try {
                    addToast('Mengunduh dari Dropbox...', 'info');
                    await downloadFromDropbox();
                    addToast('Data berhasil dipulihkan. Memuat ulang...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error: any) {
                    addToast(error.message, 'error');
                }
            }
        });
    };
    
    const handleOpenCloudSettingsClick = () => {
        setIsCloudMenuOpen(false);
        if (onOpenCloudSettings) onOpenCloudSettings();
    };
    
    const handleHelp = () => {
        onNavigate('help');
    };

    const sidebarItems = [
        { id: 'archive', label: 'Arsip Soal', icon: ArchiveIcon, action: () => onNavigate('archive') },
        { id: 'bank', label: 'Bank Soal', icon: BankIcon, action: () => onNavigate('bank') },
        { id: 'settings', label: 'Pengaturan', icon: SettingsIcon, action: () => onNavigate('settings') },
        { id: 'help', label: 'Bantuan', icon: HelpIcon, action: handleHelp },
    ];

    return (
        <div className="app-shell-page min-h-screen flex flex-col">
            {/* Main Page Content */}
            <div className="flex flex-col flex-grow">
                {/* Changed z-10 to z-20 to stack above page content sticky headers */}
                <header className="sticky top-0 z-20 border-b border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_88%,transparent)] backdrop-blur-md">
                    <div className="mx-auto flex w-full max-w-6xl justify-between items-center gap-3 px-4 py-3 md:px-6">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                Soal<span className="text-[var(--text-accent)]">Genius</span>
                            </h1>
                            <p className="hidden sm:block text-xs text-[var(--text-secondary)]">
                                Editor soal yang ringan, fokus, dan siap offline
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Desktop Header Navigation (Moved here to group with icons) */}
                            <nav className="hidden md:flex items-center space-x-1 mr-2">
                                {sidebarItems.map(item => (
                                    <div key={item.id} className="relative group">
                                        <button 
                                            onClick={item.action} 
                                            className={`p-3 rounded-full transition-colors duration-200 ${currentView === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                                            aria-label={item.label}
                                            aria-current={currentView === item.id ? 'page' : undefined}
                                        >
                                            <item.icon className="text-xl" />
                                        </button>
                                        <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-max bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg border border-[var(--border-primary)]">
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            {/* Cloud Sync Header Button */}
                            <div className="relative" ref={cloudMenuRef}>
                                <button 
                                    onClick={() => hasDropbox ? setIsCloudMenuOpen(!isCloudMenuOpen) : handleOpenCloudSettingsClick()}
                                    className={`app-control p-2.5 transition-colors ${hasDropbox ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                    title={hasDropbox ? "Cloud Sync" : "Hubungkan ke Dropbox"}
                                >
                                    <DropboxIcon className="text-xl" />
                                    {hasDropbox && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></span>}
                                </button>

                                {/* Dropdown Menu */}
                                {isCloudMenuOpen && hasDropbox && (
                                    <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] z-20 overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }}>
                                        <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center gap-2">
                                            <CloudCheckIcon className="text-green-600" />
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">Terhubung ke Cloud</span>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button onClick={handleCloudUpload} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-md">
                                                <CloudUploadIcon className="text-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[var(--text-primary)]">Update ke Cloud</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Upload data lokal</span>
                                                </div>
                                            </button>
                                            <button onClick={handleCloudDownload} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-md">
                                                <CloudDownloadIcon className="text-green-500" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[var(--text-primary)]">Restore dari Cloud</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Ambil data backup</span>
                                                </div>
                                            </button>
                                        </div>
                                        <div className="border-t border-[var(--border-primary)] p-2">
                                            <button onClick={handleOpenCloudSettingsClick} className="w-full text-center text-xs font-semibold text-[var(--text-accent)] hover:underline py-1">
                                                Pengaturan Cloud Lengkap
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-4 md:px-6 md:py-8 app-bottom-safe">
                    {children}
                </main>
                <footer className="hidden md:block text-center py-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]">
                     © {new Date().getFullYear()} SoalGenius. Dibuat dengan ❤️ untuk para pendidik.
                </footer>

                <nav className="app-mobile-nav fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_92%,transparent)] backdrop-blur-md md:hidden">
                    <div className="grid grid-cols-4 gap-1 px-2 py-2">
                        {sidebarItems.map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={item.action}
                                    className={`app-control flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <item.icon className="text-lg" />
                                    <span className="truncate">{item.label.replace('Arsip ', '').replace('Bank ', 'Bank ')}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default MainLayout;
