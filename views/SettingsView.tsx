import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getSettings, saveSettings, getAllExams, deleteExam, createBackupData, restoreBackupData } from '../lib/storage';
import { getDropboxConfig, isDropboxConnected as checkDbxStatus, getDropboxAuthCodeUrl, exchangeAuthCodeForToken, clearDropboxToken, uploadToDropbox, downloadFromDropbox, getDropboxSpaceUsage, DropboxSpaceUsage } from '../lib/dropbox';
import { saveGeminiKey, getGeminiKey } from '../lib/gemini';
import { generateDocx } from '../lib/docxGenerator';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    PlusIcon, TrashIcon, DropboxIcon, CloudUploadIcon, CloudDownloadIcon, 
    CheckIcon, CloudCheckIcon, SettingsIcon, CardTextIcon, PrinterIcon, 
    HddIcon, DownloadIcon, SearchIcon, BackupIcon, RestoreIcon, StarsIcon, RobotIcon, WordIcon, FileCodeIcon, InfoIcon
} from '../components/Icons';

type SettingsTab = 'general' | 'header' | 'format' | 'ai' | 'cloud' | 'storage';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const SettingsView: React.FC<{ initialTab?: SettingsTab }> = ({ initialTab = 'general' }) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // AI Settings
    const [geminiApiKey, setGeminiApiKey] = useState('');

    // Dropbox States
    const [dropboxAppKey, setDropboxAppKey] = useState('');
    const [dropboxAppSecret, setDropboxAppSecret] = useState('');
    const [dropboxAuthCode, setDropboxAuthCode] = useState('');
    const [isDropboxConnected, setIsDropboxConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExchangingCode, setIsExchangingCode] = useState(false);
    const [dropboxUsage, setDropboxUsage] = useState<DropboxSpaceUsage | null>(null);

    // Storage States
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const [storageUsage, setStorageUsage] = useState<{usage: number, quota: number} | null>(null);
    const [examList, setExamList] = useState<(Exam & { size: number })[]>([]);
    const [storageSearchTerm, setStorageSearchTerm] = useState('');
    const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
    const restoreInputRef = useRef<HTMLInputElement>(null);
    
    const { addToast } = useToast();
    const { showConfirm } = useModal();
    const { theme, setTheme } = useTheme();

    // Update active tab when prop changes
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getSettings();
            setSettings(data);
            
            // Load AI Key
            const savedKey = getGeminiKey();
            if(savedKey) setGeminiApiKey(savedKey);

            // Load Dropbox state
            const config = getDropboxConfig();
            setDropboxAppKey(config.appKey);
            setDropboxAppSecret(config.appSecret);
            setIsDropboxConnected(checkDbxStatus());
        };
        loadSettings();
    }, []);

    // Load Dropbox Usage when connected
    useEffect(() => {
        if (isDropboxConnected && activeTab === 'cloud') {
            getDropboxSpaceUsage().then(setDropboxUsage);
        }
    }, [isDropboxConnected, activeTab]);

    // Load Storage Info when tab active
    useEffect(() => {
        if (activeTab === 'storage') {
            loadStorageData();
            setSelectedExamIds(new Set()); // Reset selection
        }
    }, [activeTab]);

    const loadStorageData = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            if (estimate.usage !== undefined && estimate.quota !== undefined) {
                setStorageUsage({ usage: estimate.usage, quota: estimate.quota });
            }
        }
        
        const exams = await getAllExams();
        const examsWithSize = exams.map(exam => ({
            ...exam,
            size: new Blob([JSON.stringify(exam)]).size
        })).sort((a, b) => b.size - a.size); // Sort by size desc
        
        setExamList(examsWithSize);
    };

    const handleSave = useCallback(async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await saveSettings(settings);
            // Save API Key separately
            saveGeminiKey(geminiApiKey);
            addToast('Pengaturan berhasil disimpan.', 'success');
        } catch (error: any) {
            addToast('Gagal menyimpan pengaturan.', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [settings, geminiApiKey, addToast]);
    
    const updateSettings = (updater: (s: Settings) => Settings) => {
        setSettings(prev => prev ? updater(prev) : null);
    };

    const handleHeaderChange = (id: string, newText: string) => {
        updateSettings(s => ({...s, examHeaderLines: s.examHeaderLines.map(line => line.id === id ? {...line, text: newText} : line)}));
    };
    const addHeaderLine = () => {
        updateSettings(s => ({...s, examHeaderLines: [...s.examHeaderLines, {id: crypto.randomUUID(), text: ''}]}));
    };
    const removeHeaderLine = (id: string) => {
        updateSettings(s => ({...s, examHeaderLines: s.examHeaderLines.filter(line => line.id !== id)}));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
        const file = e.target.files?.[0];
        if (file) {
             if (file.size > 1 * 1024 * 1024) { // 1MB limit
                addToast('Ukuran file logo tidak boleh melebihi 1MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                updateSettings(s => {
                    const newLogos = [...s.logos] as [string | null, string | null];
                    newLogos[index] = event.target?.result as string;
                    return { ...s, logos: newLogos };
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoRemove = (index: 0 | 1) => {
         updateSettings(s => {
            const newLogos = [...s.logos] as [string | null, string | null];
            newLogos[index] = null;
            return { ...s, logos: newLogos };
        });
    }

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateSettings(s => ({...s, margins: {...s.margins, [name as keyof Settings['margins']]: Number(value) }}));
    };
    
    // --- Local Backup & Restore ---
    const handleLocalBackup = useCallback(async () => {
        try {
            const backupData = await createBackupData();
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `soalgenius_backup_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Data backup berhasil diunduh.', 'success');
        } catch (error) {
            console.error('Backup failed:', error);
            addToast('Gagal membuat backup data.', 'error');
        }
    }, [addToast]);

    const handleRestoreClick = useCallback(() => {
        restoreInputRef.current?.click();
    }, []);

    const handleFileRestore = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            await restoreBackupData(text);
            addToast('Data berhasil dipulihkan dari backup. Memuat ulang...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : 'Gagal memulihkan data. Format file tidak valid.';
            addToast(msg, 'error');
        }
        event.target.value = ''; // Reset input
    }, [addToast]);

    // --- Single Export Handler ---
    const handleExportExam = useCallback(async (exam: Exam, format: 'json' | 'docx' | 'html', silent = false) => {
        if (!settings) return;
        
        const sanitize = (str: string) => (str || '').replace(/[^a-z0-9_.-]/gi, '_');
        const fileName = `${sanitize(exam.title)}.${format}`;

        let blob: Blob;

        try {
            if (format === 'json') {
                // Create a compatible backup structure for single exam so it can be restored
                const backupPayload = {
                    source: 'SoalGeniusDB',
                    version: 3,
                    createdAt: new Date().toISOString(),
                    data: { exams: [exam] } // Wrap in array
                };
                blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            } else if (format === 'docx') {
                blob = await generateDocx(exam, settings);
            } else { // html
                const htmlContent = generateHtmlContent(exam, settings, 'exam', false);
                blob = new Blob([htmlContent], { type: 'text/html' });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (!silent) addToast(`Berhasil mengekspor ${format.toUpperCase()}`, 'success');
        } catch (e: any) {
            console.error(e);
            if (!silent) addToast(`Gagal mengekspor ${format.toUpperCase()}`, 'error');
        }
    }, [settings, addToast]);

    // --- Dropbox Handlers ---
    const handleGetAuthCode = () => {
        if (!dropboxAppKey) {
            addToast('App Key Dropbox belum diisi.', 'error');
            return;
        }
        window.open(getDropboxAuthCodeUrl(dropboxAppKey), '_blank');
    };

    const handleConnectWithCode = async () => {
        if (!dropboxAppKey || !dropboxAppSecret || !dropboxAuthCode) {
            addToast('App Key, Secret, dan Auth Code harus diisi.', 'error');
            return;
        }
        setIsExchangingCode(true);
        try {
            await exchangeAuthCodeForToken(dropboxAuthCode, dropboxAppKey, dropboxAppSecret);
            setIsDropboxConnected(true);
            addToast('Berhasil terhubung ke Dropbox!', 'success');
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Gagal menghubungkan ke Dropbox.';
            addToast(msg, 'error');
        } finally {
            setIsExchangingCode(false);
        }
    };

    const handleDisconnectDropbox = () => {
        showConfirm({
            title: "Putuskan Hubungan Dropbox",
            content: "Anda tidak akan bisa menyinkronkan data lagi sampai Anda menghubungkannya kembali. Data di Dropbox tidak akan terhapus.",
            confirmVariant: 'danger',
            confirmLabel: 'Putuskan',
            onConfirm: () => {
                clearDropboxToken();
                setIsDropboxConnected(false);
                setDropboxUsage(null);
                addToast('Akun Dropbox diputuskan.', 'success');
            }
        });
    };

    const handleUploadToCloud = async () => {
        setIsSyncing(true);
        try {
            await uploadToDropbox();
            addToast('Data lokal berhasil diunggah ke Dropbox.', 'success');
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Gagal upload ke cloud.';
            addToast(msg, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDownloadFromCloud = async () => {
        showConfirm({
            title: "Download dari Cloud",
            content: "Peringatan: Data lokal saat ini akan DITIMPA dengan data dari Dropbox. Lanjutkan?",
            confirmVariant: 'danger',
            confirmLabel: 'Download & Timpa',
            onConfirm: async () => {
                setIsSyncing(true);
                try {
                    await downloadFromDropbox();
                    addToast('Data berhasil dipulihkan dari Dropbox. Memuat ulang...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error: any) {
                    const msg = error instanceof Error ? error.message : 'Gagal download dari cloud.';
                    addToast(msg, 'error');
                    setIsSyncing(false);
                }
            }
        });
    };

    // --- Storage Handlers ---
    const handleDeleteExam = (examId: string, title: string) => {
        showConfirm({
            title: 'Hapus Data Ujian',
            content: `Yakin ingin menghapus data "${title}" secara permanen?`,
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                try {
                    await deleteExam(examId);
                    addToast('Data dihapus.', 'success');
                    loadStorageData(); // Refresh list
                } catch (e: any) {
                    addToast('Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleBulkDelete = () => {
        showConfirm({
            title: 'Hapus Banyak Data',
            content: `Yakin ingin menghapus ${selectedExamIds.size} ujian yang dipilih?`,
            confirmVariant: 'danger',
            confirmLabel: 'Hapus Semua',
            onConfirm: async () => {
                try {
                    await Promise.all(Array.from(selectedExamIds).map(id => deleteExam(id)));
                    addToast(`${selectedExamIds.size} data dihapus.`, 'success');
                    setSelectedExamIds(new Set());
                    loadStorageData();
                } catch (e: any) {
                    addToast('Gagal menghapus beberapa data.', 'error');
                }
            }
        });
    };

    const handleBulkBackup = useCallback(() => {
        const selectedExams = examList.filter(e => selectedExamIds.has(e.id));
        if (selectedExams.length === 0) return;

        const backupPayload = {
            source: 'SoalGeniusDB',
            version: 3,
            createdAt: new Date().toISOString(),
            data: { exams: selectedExams }
        };

        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `soalgenius_bulk_backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`${selectedExams.length} data berhasil diunduh (JSON).`, 'success');
        setSelectedExamIds(new Set());
    }, [examList, selectedExamIds, addToast]);

    const handleBulkExportFiles = useCallback(async (format: 'docx' | 'html') => {
        const selectedExams = examList.filter(e => selectedExamIds.has(e.id));
        if (selectedExams.length === 0) return;

        // Browser constraint warning
        if (selectedExams.length > 5) {
             const ok = window.confirm(`Anda akan mengunduh ${selectedExams.length} file terpisah. Browser mungkin meminta izin untuk mengunduh banyak file. Lanjutkan?`);
             if (!ok) return;
        }

        addToast(`Mulai mengunduh ${selectedExams.length} dokumen...`, 'info');

        // Sequential download to prevent browser choking
        for (let i = 0; i < selectedExams.length; i++) {
            await handleExportExam(selectedExams[i], format, true); // Silent mode
            // Small delay between downloads
            if (i < selectedExams.length - 1) {
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
            }
        }
        
        addToast(`Selesai mengunduh ${selectedExams.length} dokumen.`, 'success');
        setSelectedExamIds(new Set());
    }, [examList, selectedExamIds, addToast, handleExportExam]);

    const toggleSelection = (id: string) => {
        setSelectedExamIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedExamIds.size === filteredExamList.length) {
            setSelectedExamIds(new Set());
        } else {
            setSelectedExamIds(new Set(filteredExamList.map(e => e.id)));
        }
    };

    const filteredExamList = examList.filter(exam => 
        storageSearchTerm === '' || 
        exam.title.toLowerCase().includes(storageSearchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(storageSearchTerm.toLowerCase())
    );

    if (!settings) {
        return <div className="text-center py-16">Memuat pengaturan...</div>;
    }

    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'Umum', icon: SettingsIcon },
        { id: 'header', label: 'Kop', icon: CardTextIcon },
        { id: 'format', label: 'Kertas', icon: PrinterIcon },
        { id: 'ai', label: 'AI / Cerdas', icon: StarsIcon },
        { id: 'cloud', label: 'Cloud', icon: DropboxIcon },
        { id: 'storage', label: 'Data', icon: HddIcon },
    ];

    const storagePercent = storageUsage ? Math.min(100, (storageUsage.usage / storageUsage.quota) * 100) : 0;

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
            <input type="file" ref={restoreInputRef} onChange={handleFileRestore} className="hidden" accept="application/json" />

            <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Pengaturan</h2>
                
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-[var(--bg-secondary)] p-1 rounded-xl shadow-sm border border-[var(--border-primary)] overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
                                activeTab === tab.id
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                            }`}
                        >
                            <tab.icon className="text-lg" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Tampilan Aplikasi</h3>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Mode Tema</label>
                            <div className="flex items-center rounded-lg bg-[var(--bg-muted)] p-0.5">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${theme === 'light' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Terang
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${theme === 'dark' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Gelap
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-primary)] pb-2">
                            <RobotIcon className="text-2xl text-purple-600" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Konfigurasi Kecerdasan Buatan (AI)</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Google Gemini API (Opsional)</h4>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">
                                    Masukkan API Key Anda untuk menggunakan model Gemini yang lebih canggih dan akurat dalam membuat soal.
                                    Tanpa kunci ini, fitur AI akan menggunakan mode "Default" (Gratis/Pollinations).
                                </p>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)]">API Key Gemini</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="password" 
                                            value={geminiApiKey} 
                                            onChange={(e) => setGeminiApiKey(e.target.value)} 
                                            placeholder="Tempel API Key di sini (AIza...)"
                                            className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Data ini disimpan lokal di browser Anda. Dapatkan kunci gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Tab */}
                {activeTab === 'header' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Kop Surat</h3>
                        
                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-medium text-[var(--text-secondary)]">Teks Kop (Baris demi Baris)</label>
                            <div className="space-y-2">
                                {settings.examHeaderLines.map((line) => (
                                    <div key={line.id} className="flex items-center gap-2">
                                        <input type="text" value={line.text} onChange={(e) => handleHeaderChange(line.id, e.target.value)} placeholder="Teks baris kop" className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" />
                                        <button onClick={() => removeHeaderLine(line.id)} className="text-[var(--text-muted)] hover:text-red-500 p-2" disabled={settings.examHeaderLines.length <= 1}><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addHeaderLine} className="text-blue-600 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon /> <span>Tambah Baris</span></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[0, 1].map((index) => (
                                <div key={index} className="space-y-2">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)]">Logo {index === 0 ? 'Kiri' : 'Kanan'}</label>
                                    <div className="border-2 border-dashed border-[var(--border-secondary)] rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] bg-[var(--bg-tertiary)] relative group">
                                        {settings.logos[index] ? (
                                            <>
                                                <img src={settings.logos[index]!} alt="Logo" className="max-h-20 object-contain mb-2" />
                                                <button onClick={() => handleLogoRemove(index as 0 | 1)} className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><TrashIcon className="text-sm" /></button>
                                            </>
                                        ) : (
                                            <span className="text-[var(--text-muted)] text-sm">Tidak ada logo</span>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, index as 0 | 1)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] text-center">Klik untuk upload (Max 1MB)</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Format Tab */}
                {activeTab === 'format' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in space-y-6">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Format Kertas & Huruf</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Kertas</label>
                                <select value={settings.paperSize} onChange={(e) => updateSettings(s => ({...s, paperSize: e.target.value as any}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                                    <option value="A4">A4 (210 x 297 mm)</option>
                                    <option value="F4">F4 (215 x 330 mm)</option>
                                    <option value="Legal">Legal (216 x 356 mm)</option>
                                    <option value="Letter">Letter (216 x 279 mm)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenis Huruf (Font)</label>
                                <select value={settings.fontFamily} onChange={(e) => updateSettings(s => ({...s, fontFamily: e.target.value as any}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                                    <option value="Liberation Serif">Times New Roman (Serif)</option>
                                    <option value="Liberation Sans">Arial (Sans-Serif)</option>
                                    <option value="Amiri">Amiri (Arabic Serif)</option>
                                    <option value="Areef Ruqaa">Areef Ruqaa (Arabic Handwriting)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Font (pt)</label>
                                <input type="number" min="8" max="24" value={settings.fontSize} onChange={(e) => updateSettings(s => ({...s, fontSize: Number(e.target.value)}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Spasi Baris</label>
                                <input type="number" min="1" max="3" step="0.1" value={settings.lineSpacing} onChange={(e) => updateSettings(s => ({...s, lineSpacing: Number(e.target.value)}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Margin (mm)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><label className="text-xs text-[var(--text-muted)]">Atas</label><input type="number" name="top" value={settings.margins.top} onChange={handleMarginChange} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" /></div>
                                <div><label className="text-xs text-[var(--text-muted)]">Bawah</label><input type="number" name="bottom" value={settings.margins.bottom} onChange={handleMarginChange} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" /></div>
                                <div><label className="text-xs text-[var(--text-muted)]">Kiri</label><input type="number" name="left" value={settings.margins.left} onChange={handleMarginChange} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" /></div>
                                <div><label className="text-xs text-[var(--text-muted)]">Kanan</label><input type="number" name="right" value={settings.margins.right} onChange={handleMarginChange} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cloud Tab */}
                {activeTab === 'cloud' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in space-y-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-primary)] pb-2">
                            <DropboxIcon className="text-2xl text-blue-600" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Sinkronisasi Cloud (Dropbox)</h3>
                        </div>

                        {!isDropboxConnected ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                                    Hubungkan ke Dropbox untuk menyimpan backup data ujian Anda secara otomatis dan mengaksesnya dari perangkat lain.
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)]">App Key</label>
                                            <input type="text" value={dropboxAppKey} onChange={e => setDropboxAppKey(e.target.value)} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Masukkan Dropbox App Key" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)]">App Secret</label>
                                            <input type="password" value={dropboxAppSecret} onChange={e => setDropboxAppSecret(e.target.value)} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Masukkan Dropbox App Secret" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">Langkah 1: Dapatkan Kode Otorisasi</p>
                                        <button onClick={handleGetAuthCode} className="w-full md:w-auto bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md font-semibold text-sm text-left">Buka Dropbox & Salin Kode</button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">Langkah 2: Masukkan Kode</p>
                                        <div className="flex gap-2">
                                            <input type="text" value={dropboxAuthCode} onChange={e => setDropboxAuthCode(e.target.value)} className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Tempel kode di sini..." />
                                            <button onClick={handleConnectWithCode} disabled={isExchangingCode} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-50">
                                                {isExchangingCode ? 'Menghubungkan...' : 'Hubungkan'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-300"><CheckIcon className="text-xl" /></div>
                                        <div>
                                            <p className="font-bold text-green-800 dark:text-green-300">Terhubung ke Dropbox</p>
                                            {dropboxUsage && (
                                                <p className="text-xs text-green-700 dark:text-green-400">
                                                    Terpakai: {formatBytes(dropboxUsage.used)} / {formatBytes(dropboxUsage.allocation.allocated)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={handleDisconnectDropbox} className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline">Putuskan</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={handleUploadToCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-4 border border-[var(--border-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-all group">
                                        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800"><CloudUploadIcon className="text-2xl" /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-[var(--text-primary)]">Upload ke Cloud</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Simpan data lokal ke Dropbox</p>
                                        </div>
                                    </button>
                                    <button onClick={handleDownloadFromCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-4 border border-[var(--border-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-all group">
                                        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-300 group-hover:bg-green-200 dark:group-hover:bg-green-800"><CloudDownloadIcon className="text-2xl" /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-[var(--text-primary)]">Download dari Cloud</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Timpa data lokal dari Dropbox</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Storage Tab */}
                {activeTab === 'storage' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Storage Usage Info */}
                        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md border border-[var(--border-primary)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Penyimpanan Lokal</h3>
                            
                            {storageUsage && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-1 font-medium text-[var(--text-secondary)]">
                                        <span>Terpakai: {formatBytes(storageUsage.usage)}</span>
                                        <span>Total: {formatBytes(storageUsage.quota)}</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-muted)] rounded-full h-3 border border-[var(--border-secondary)]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${storagePercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3 mb-6">
                                <InfoIcon className="text-blue-600 dark:text-blue-300 text-xl flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <p><strong>Penting:</strong> Data aplikasi ini disimpan secara lokal di browser perangkat Anda. Kapasitas penyimpanan bergantung pada sisa ruang disk di perangkat Anda.</p>
                                    <p>Jika penyimpanan hampir penuh, sebaiknya <strong>hapus ujian lama</strong> yang tidak diperlukan atau gunakan fitur <strong>Cloud Sync (Dropbox)</strong> untuk memindahkan data ke cloud.</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleLocalBackup} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors shadow-sm">
                                    <BackupIcon /> Backup Data (JSON)
                                </button>
                                <button onClick={handleRestoreClick} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors shadow-sm">
                                    <RestoreIcon /> Restore Data (JSON)
                                </button>
                            </div>
                        </div>

                        {/* Exam Data Management */}
                        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-primary)] overflow-hidden">
                            <div className="p-4 border-b border-[var(--border-primary)] flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2"><HddIcon/> Data Ujian ({filteredExamList.length})</h3>
                                <div className="relative w-full sm:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="Cari data..." 
                                        value={storageSearchTerm}
                                        onChange={(e) => setStorageSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-primary)] focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                                </div>
                            </div>
                            
                            {selectedExamIds.size > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 px-4 flex justify-between items-center border-b border-blue-100 dark:border-blue-900 overflow-x-auto">
                                    <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold whitespace-nowrap mr-4">{selectedExamIds.size} dipilih</span>
                                    <div className="flex gap-2 flex-nowrap">
                                        <button onClick={handleBulkBackup} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 whitespace-nowrap">
                                            <DownloadIcon className="text-xs"/> JSON
                                        </button>
                                        <button onClick={() => handleBulkExportFiles('docx')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 whitespace-nowrap">
                                            <WordIcon className="text-xs"/> Word
                                        </button>
                                        <button onClick={() => handleBulkExportFiles('html')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 whitespace-nowrap">
                                            <FileCodeIcon className="text-xs"/> HTML
                                        </button>
                                        <button onClick={handleBulkDelete} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 whitespace-nowrap">
                                            <TrashIcon className="text-xs"/> Hapus
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-tertiary)] sticky top-0">
                                        <tr>
                                            <th className="p-4 w-4">
                                                <input type="checkbox" checked={filteredExamList.length > 0 && selectedExamIds.size === filteredExamList.length} onChange={toggleSelectAll} className="rounded border-[var(--border-secondary)]" />
                                            </th>
                                            <th className="px-4 py-3">Judul Ujian</th>
                                            <th className="px-4 py-3">Mapel</th>
                                            <th className="px-4 py-3 text-right">Ukuran</th>
                                            <th className="px-4 py-3 text-center">Aksi / Unduh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-primary)]">
                                        {filteredExamList.length > 0 ? filteredExamList.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-[var(--bg-hover)]">
                                                <td className="p-4 w-4">
                                                    <input type="checkbox" checked={selectedExamIds.has(exam.id)} onChange={() => toggleSelection(exam.id)} className="rounded border-[var(--border-secondary)]" />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{exam.title}</td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">{exam.subject}</td>
                                                <td className="px-4 py-3 text-right text-[var(--text-muted)] font-mono text-xs">{formatBytes(exam.size, 0)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center items-center gap-1">
                                                        <button onClick={() => handleExportExam(exam, 'json')} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400" title="Backup (JSON)">
                                                            <DownloadIcon className="text-sm"/>
                                                        </button>
                                                        <button onClick={() => handleExportExam(exam, 'docx')} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400" title="Ekspor Word">
                                                            <WordIcon className="text-sm"/>
                                                        </button>
                                                        <button onClick={() => handleExportExam(exam, 'html')} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400" title="Ekspor HTML">
                                                            <FileCodeIcon className="text-sm"/>
                                                        </button>
                                                        <button onClick={() => handleDeleteExam(exam.id, exam.title)} className="p-1.5 rounded hover:bg-red-100 text-red-500 dark:hover:bg-red-900/30 dark:text-red-400" title="Hapus Permanen">
                                                            <TrashIcon className="text-sm"/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">Tidak ada data ujian.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 pt-4 flex items-center justify-end border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <button onClick={handleSave} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow hover:shadow-lg disabled:opacity-70 w-full md:w-auto" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                </button>
            </div>
        </div>
    );
};

export default SettingsView;