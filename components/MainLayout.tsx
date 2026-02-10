import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../App';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { isDropboxConnected, uploadToDropbox, downloadFromDropbox } from '../lib/dropbox';
import { 
    BurgerMenuIcon, CloseIcon, ArchiveIcon, BankIcon, SettingsIcon, HelpIcon,
    CloudUploadIcon, CloudDownloadIcon, DropboxIcon, CheckIcon, CloudCheckIcon
} from './Icons';

const MainLayout: React.FC<{
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
    onOpenCloudSettings?: () => void;
}> = ({ children, currentView, onNavigate, onOpenCloudSettings }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [hasDropbox, setHasDropbox] = useState(false);
    
    // Cloud Menu State
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);
    const cloudMenuRef = useRef<HTMLDivElement>(null);

    const { showConfirm } = useModal();
    const { addToast } = useToast();

    // Check Dropbox status on mount and whenever sidebar/header interacts
    useEffect(() => {
        setHasDropbox(isDropboxConnected());
    }, [isSidebarOpen, isCloudMenuOpen]);

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
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
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
                    
                    {/* Unified Mobile Menu List - No Separator */}
                    <div className="flex-grow overflow-y-auto py-2">
                        <nav className="px-3">
                            <ul className="space-y-1">
                                {sidebarItems.map(item => (
                                    <li key={item.id}>
                                        <a href="#" aria-current={currentView === item.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); item.action(); setSidebarOpen(false); }} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                                            <item.icon className="text-xl" /><span>{item.label}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                    
                    <div className="p-4 border-t border-[var(--border-primary)] text-center">
                        <p className="text-xs text-[var(--text-muted)]">SoalGenius v2.0</p>
                    </div>
                </aside>
            </div>

            {/* Main Page Content */}
            <div aria-hidden={isSidebarOpen} className="flex flex-col flex-grow">
                {/* Changed z-10 to z-20 to stack above page content sticky headers */}
                <header className="bg-[var(--bg-secondary)] shadow-md sticky top-0 z-20 border-b border-[var(--border-primary)]">
                    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            Soal<span className="text-[var(--text-accent)]">Genius</span>
                        </h1>
                        
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
                                    className={`p-2 rounded-lg transition-colors ${hasDropbox ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                                    title={hasDropbox ? "Cloud Sync" : "Hubungkan ke Dropbox"}
                                >
                                    <DropboxIcon className="text-xl" />
                                    {hasDropbox && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></span>}
                                </button>

                                {/* Dropdown Menu */}
                                {isCloudMenuOpen && hasDropbox && (
                                    <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] rounded-lg shadow-xl border border-[var(--border-primary)] z-20 overflow-hidden">
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

                            {/* Mobile Burger Button */}
                            <button onClick={() => setSidebarOpen(true)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg md:hidden" aria-label="Buka menu">
                                <BurgerMenuIcon className="text-2xl" />
                            </button>
                        </div>
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