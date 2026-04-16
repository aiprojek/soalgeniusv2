import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { getSettings, saveSettings, getAllExams, deleteExam, createBackupData, restoreBackupData } from '../lib/storage';
import { getDropboxConfig, isDropboxConnected as checkDbxStatus, getDropboxAuthCodeUrl, exchangeAuthCodeForToken, clearDropboxToken, uploadToDropbox, downloadFromDropbox, getDropboxSpaceUsage, DropboxSpaceUsage, saveDropboxConfig, getDropboxToken, saveDropboxToken } from '../lib/dropbox';
import { saveGeminiKey, getGeminiKey } from '../lib/gemini';
import { generateDocx } from '../lib/docxGenerator';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    PlusIcon, TrashIcon, DropboxIcon, CloudUploadIcon, CloudDownloadIcon, 
    CheckIcon, SettingsIcon, CardTextIcon, PrinterIcon, 
    HddIcon, DownloadIcon, SearchIcon, BackupIcon, RestoreIcon, StarsIcon, RobotIcon, WordIcon, FileCodeIcon, InfoIcon,
    QrCodeIcon, ScanIcon, CopyIcon, CloseIcon
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
    const [offlineStatus, setOfflineStatus] = useState<'checking' | 'ready' | 'not_ready'>('checking');
    const [isRefreshingOfflineCache, setIsRefreshingOfflineCache] = useState(false);
    
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
    
    // Pairing States
    const [showPairingHost, setShowPairingHost] = useState(false);
    const [generatedPairingCode, setGeneratedPairingCode] = useState('');
    
    // Scanning States
    const [isScanning, setIsScanning] = useState(false);
    const [inputPairingCode, setInputPairingCode] = useState('');
    const scannerRef = useRef<any>(null);

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

    const checkOfflineStatus = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('caches' in window)) {
            setOfflineStatus('not_ready');
            return;
        }

        try {
            const [controller, cachedIndex] = await Promise.all([
                navigator.serviceWorker.ready.then(() => Boolean(navigator.serviceWorker.controller)).catch(() => false),
                caches.match('./index.html').then(response => Boolean(response)).catch(() => false),
            ]);

            setOfflineStatus(controller && cachedIndex ? 'ready' : 'not_ready');
        } catch (error) {
            console.error('Failed to check offline status:', error);
            setOfflineStatus('not_ready');
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'general') {
            checkOfflineStatus();
        }
    }, [activeTab, checkOfflineStatus]);

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
            setSelectedExamIds(new Set<string>()); // Reset selection
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
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const result = reader.result;
                    updateSettings(s => {
                        const newLogos = [...s.logos] as [string | null, string | null];
                        newLogos[index] = result;
                        return { ...s, logos: newLogos };
                    });
                }
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

    const handleRefreshOfflineCache = useCallback(async () => {
        setIsRefreshingOfflineCache(true);
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.update();
            }

            const urlsToWarm = new Set<string>([
                './',
                './index.html',
                './manifest.json',
                './icon.svg',
            ]);

            document.querySelectorAll('script[src], link[rel="stylesheet"]').forEach((element) => {
                const source = element instanceof HTMLScriptElement ? element.src : (element as HTMLLinkElement).href;
                if (source && source.startsWith(window.location.origin)) {
                    urlsToWarm.add(source);
                }
            });

            await Promise.all(
                Array.from(urlsToWarm).map((url) =>
                    fetch(url, { cache: 'reload' }).catch((error) => {
                        console.warn('Failed to refresh offline asset:', url, error);
                    })
                )
            );

            await checkOfflineStatus();
            addToast('Aset aplikasi dicoba diperbarui untuk penggunaan offline.', 'success');
        } catch (error) {
            console.error('Failed to refresh offline cache:', error);
            addToast('Gagal memperbarui aset offline.', 'error');
        } finally {
            setIsRefreshingOfflineCache(false);
        }
    }, [addToast, checkOfflineStatus]);
    
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
        } catch (error: any) {
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
        } catch (error: any) {
            console.error(error);
            const msg = error instanceof Error ? error.message : 'Gagal memulihkan data. Format file tidak valid.';
            addToast(`${msg}`, 'error');
        }
        event.target.value = ''; // Reset input
    }, [addToast]);

    // --- Donation Prompt ---
    const showDonationPrompt = useCallback(() => {
        setTimeout(async () => {
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
            if (!silent) {
                addToast(`Berhasil mengekspor ${format.toUpperCase()}`, 'success');
                // Prompt donation for single exports in settings too, as user requested "export lainnya juga"
                showDonationPrompt();
            }
        } catch (e: any) {
            console.error(e);
            if (!silent) addToast(`Gagal mengekspor ${format.toUpperCase()}`, 'error');
        }
    }, [settings, addToast, showDonationPrompt]);

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
            
            // AUTO-RESTORE CHECK
            // If this connection was triggered by Pairing, we auto-download and restart.
            const shouldAutoSync = sessionStorage.getItem('soalgenius_auto_restore');
            if (shouldAutoSync === '1') {
                addToast('Koneksi berhasil! Mengunduh data dari Cloud...', 'info');
                await downloadFromDropbox();
                sessionStorage.removeItem('soalgenius_auto_restore'); // Clean up
                addToast('Data berhasil dipulihkan. Restarting...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                addToast('Berhasil terhubung ke Dropbox!', 'success');
            }
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Gagal menghubungkan ke Dropbox.';
            addToast(`${msg}`, 'error');
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
                setShowPairingHost(false);
                addToast('Akun Dropbox diputuskan.', 'success');
            }
        });
    };

    const handleUploadToCloud = async () => {
        setIsSyncing(true);
        try {
            await uploadToDropbox();
            addToast('Data lokal berhasil diunggah ke Dropbox.', 'success');
            // Refresh Usage
            getDropboxSpaceUsage().then(setDropboxUsage);
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Gagal upload ke cloud.';
            addToast(`${msg}`, 'error');
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
                    addToast(`${msg}`, 'error');
                    setIsSyncing(false);
                }
            }
        });
    };

    // --- Pairing Logic ---
    const handleGeneratePairingCode = () => {
        if (!dropboxAppKey || !dropboxAppSecret) {
            addToast('Konfigurasi App Key dan Secret belum lengkap.', 'error');
            return;
        }

        const token = getDropboxToken();

        try {
            const payload = {
                k: dropboxAppKey,
                s: dropboxAppSecret,
                t: token || ''
            };
            const json = JSON.stringify(payload);
            const code = btoa(json);
            setGeneratedPairingCode(code);
            setShowPairingHost(true);
        } catch (e: any) {
            addToast('Gagal membuat kode pairing.', 'error');
        }
    };

    const handleCopyPairingCode = () => {
        navigator.clipboard.writeText(generatedPairingCode);
        addToast('Kode Pairing disalin!', 'success');
    };

    const processPairingCode = async (code: string) => {
        try {
            const json = atob(code.trim());
            const data = JSON.parse(json);
            
            if (data.k && data.s) {
                setDropboxAppKey(data.k);
                setDropboxAppSecret(data.s);
                saveDropboxConfig(data.k, data.s);

                if (data.t) {
                    saveDropboxToken(data.t);
                    setIsDropboxConnected(true);
                    
                    addToast('Berhasil terhubung ke Dropbox (Instant Auth).', 'success');
                    
                    showConfirm({
                        title: "Sinkronisasi Data",
                        content: "Perangkat terhubung! Apakah Anda ingin mengunduh data dari Cloud sekarang?",
                        confirmVariant: 'primary',
                        confirmLabel: 'Unduh Data',
                        onConfirm: async () => {
                            setIsSyncing(true);
                            try {
                                await downloadFromDropbox();
                                addToast('Data berhasil dipulihkan. Memuat ulang...', 'success');
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (e: any) {
                                addToast('Gagal mengunduh data.', 'error');
                                setIsSyncing(false);
                            }
                        }
                    });
                } else {
                    sessionStorage.setItem('soalgenius_auto_restore', '1');
                    addToast('Konfigurasi diterapkan! Silakan klik "Dapatkan Kode" untuk melanjutkan.', 'success');
                    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
                }

                setIsScanning(false);
            } else {
                throw new Error('Format kode salah');
            }
        } catch (e: any) {
            addToast('Kode pairing tidak valid.', 'error');
        }
    };

    const handleApplyPairingCode = () => {
        if (!inputPairingCode.trim()) return;
        processPairingCode(inputPairingCode);
    };

    // --- QR Scanner Logic ---
    const stopScanner = () => {
        if (scannerRef.current) {
            // Fix: Use unknown for catch variable and handle logging safely
            scannerRef.current.clear().catch((error: any) => {
                console.error("Failed to clear scanner", error);
            });
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const onScanSuccess = (decodedText: any) => {
        stopScanner();
        // decodedText passed from library might be unknown type, safely cast to string
        const text = typeof decodedText === 'string' ? decodedText : String(decodedText);
        processPairingCode(text);
    };

    const onScanFailure = (error: any) => {
        // Handle scan failure, usually better to ignore to avoid spamming logs
    };

    const startScanner = () => {
        setIsScanning(true);
        // Wait for DOM element to exist
        setTimeout(async () => {
            if (!document.getElementById('reader')) return;
            
            try {
                const { Html5QrcodeScanner } = await import('html5-qrcode');
                if (Html5QrcodeScanner) {
                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        /* verbose= */ false
                    );
                    scannerRef.current = scanner;
                    scanner.render(onScanSuccess, onScanFailure);
                } else {
                    addToast('Pustaka scanner tidak tersedia.', 'error');
                    setIsScanning(false);
                }
            } catch (e: any) {
                console.error("Scanner init error", e);
                addToast('Gagal inisialisasi kamera.', 'error');
                setIsScanning(false);
            }
        }, 100);
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
                    await Promise.all(Array.from(selectedExamIds).map((id: string) => deleteExam(id)));
                    addToast(`${selectedExamIds.size} data dihapus.`, 'success');
                    setSelectedExamIds(new Set<string>());
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
        setSelectedExamIds(new Set<string>());
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
                // Fix: Ensure resolve is called properly for void
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
            }
        }
        
        addToast(`Selesai mengunduh ${selectedExams.length} dokumen.`, 'success');
        setSelectedExamIds(new Set<string>());
        showDonationPrompt(); // Show for bulk export as well
    }, [examList, selectedExamIds, addToast, handleExportExam, showDonationPrompt]);

    const toggleSelection = (id: string) => {
        setSelectedExamIds(prev => {
            const newSet = new Set<string>(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedExamIds.size === filteredExamList.length) {
            setSelectedExamIds(new Set<string>());
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
        return <div className="app-loading-state">Memuat pengaturan...</div>;
    }

    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'Umum', icon: SettingsIcon },
        { id: 'header', label: 'Kop', icon: CardTextIcon },
        { id: 'format', label: 'Kertas', icon: PrinterIcon },
        { id: 'ai', label: 'AI / Cerdas', icon: StarsIcon },
        { id: 'cloud', label: 'Cloud', icon: DropboxIcon },
        { id: 'storage', label: 'Data', icon: HddIcon },
    ];
    const tabDescriptions: Record<SettingsTab, string> = {
        general: 'Tema aplikasi dan kesiapan offline.',
        header: 'Identitas sekolah, teks kop, dan logo.',
        format: 'Ukuran kertas, font, spasi, dan margin.',
        ai: 'Konfigurasi fitur AI dan kunci Gemini.',
        cloud: 'Sinkronisasi Dropbox dan pairing perangkat.',
        storage: 'Backup lokal, restore, dan penggunaan data.',
    };
    const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
    const ActiveTabIcon = activeTabMeta.icon;

    const storagePercent = storageUsage ? Math.min(100, (storageUsage.usage / storageUsage.quota) * 100) : 0;
    const dropboxPercent = dropboxUsage ? Math.min(100, (dropboxUsage.used / dropboxUsage.allocation.allocated) * 100) : 0;

    return (
        <div className="space-y-4 flex flex-col h-[calc(100vh-140px)]">
            <input type="file" ref={restoreInputRef} onChange={handleFileRestore} className="hidden" accept="application/json" />

            {/* QR Scanner Modal */}
            {isScanning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-xl p-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Scan QR Code</h3>
                            <button onClick={stopScanner}><CloseIcon className="text-gray-500 hover:text-red-500" /></button>
                        </div>
                        <div id="reader" className="w-full"></div>
                        <p className="text-xs text-center text-gray-500 mt-4">Arahkan kamera ke QR Code di perangkat utama (Menu Cloud).</p>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-3">Pengaturan</h2>

                <div className="md:hidden app-tab-shell p-3 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-accent)]">
                            <ActiveTabIcon className="text-lg" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Section Aktif</p>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">{activeTabMeta.label}</h3>
                            <p className="text-xs text-[var(--text-secondary)]">{tabDescriptions[activeTab]}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="settings-tab-select" className="block text-sm font-medium text-[var(--text-secondary)]">
                            Pindah section
                        </label>
                        <select
                            id="settings-tab-select"
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
                            className="w-full p-2.5 border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                        >
                            {tabs.map((tab) => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="hidden md:flex space-x-1 app-tab-shell p-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`app-tab-button flex items-center space-x-2 px-3 py-2 text-sm font-semibold whitespace-nowrap flex-1 justify-center ${
                                activeTab === tab.id
                                    ? 'app-tab-button-active'
                                    : ''
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
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-primary)] pb-2">Tampilan Aplikasi</h3>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Mode Tema</label>
                                <div className="flex items-center rounded-xl bg-[var(--bg-muted)] p-0.5">
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

                        {/* Offline Mode Section */}
                        <div className="app-surface p-4 sm:p-5">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-primary)] pb-2">Mode Offline</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-[var(--text-secondary)]">Status kesiapan aplikasi untuk dipakai tanpa internet.</p>
                                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                                            offlineStatus === 'ready'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : offlineStatus === 'checking'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {offlineStatus === 'ready' ? <CheckIcon /> : <InfoIcon />}
                                            <span>
                                                {offlineStatus === 'ready'
                                                    ? 'Aplikasi siap offline'
                                                    : offlineStatus === 'checking'
                                                        ? 'Memeriksa status offline...'
                                                        : 'Aplikasi belum siap offline'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRefreshOfflineCache}
                                        disabled={isRefreshingOfflineCache}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-sm whitespace-nowrap bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isRefreshingOfflineCache ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Menyegarkan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CloudDownloadIcon />
                                                <span>Refresh Cache</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="app-surface-muted rounded-[var(--radius-control)] p-4 text-sm text-[var(--text-secondary)]">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="mt-0.5 text-blue-600" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-[var(--text-primary)]">Cara pakai sederhana</p>
                                            <p>Jika status belum siap, tekan <strong>Refresh Cache</strong> saat internet aktif.</p>
                                            <p>Setelah status siap, aplikasi bisa dibuka lagi saat offline untuk data dan aset yang sudah tersimpan.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                    <div className="app-surface p-4 sm:p-5 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-primary)] pb-2">
                            <RobotIcon className="text-xl text-purple-600" />
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Konfigurasi Kecerdasan Buatan (AI)</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3.5 rounded-[var(--radius-control)] border border-purple-100 dark:border-purple-800">
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
                    <div className="app-surface p-4 sm:p-5 animate-fade-in">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-primary)] pb-2">Kop Surat</h3>
                        
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="app-surface p-4 sm:p-5 animate-fade-in space-y-5">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-primary)] pb-2">Format Kertas & Huruf</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Kertas</label>
                                <select value={settings.paperSize} onChange={(e) => updateSettings(s => ({...s, paperSize: e.target.value as Settings['paperSize']}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                                    <option value="A4">A4 (210 x 297 mm)</option>
                                    <option value="F4">F4 (215 x 330 mm)</option>
                                    <option value="Legal">Legal (216 x 356 mm)</option>
                                    <option value="Letter">Letter (216 x 279 mm)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenis Huruf (Font)</label>
                                <select value={settings.fontFamily} onChange={(e) => updateSettings(s => ({...s, fontFamily: e.target.value as Settings['fontFamily']}))} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
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
                            <div className="space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                                    Hubungkan ke Dropbox untuk menyimpan backup data ujian Anda secara otomatis dan mengaksesnya dari perangkat lain.
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="text-amber-600 dark:text-amber-300 text-lg mt-0.5 flex-shrink-0" />
                                        <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                                            <p className="font-semibold">Model keamanan Dropbox di SoalGenius: client-first, bukan server-managed.</p>
                                            <p>Kredensial Dropbox disimpan lokal di browser ini agar aplikasi bisa sinkron tanpa backend tambahan. Ini praktis, tetapi berarti keamanan akun Dropbox mengikuti keamanan perangkat dan browser yang digunakan.</p>
                                            <p className="text-xs opacity-90">Saran: gunakan fitur ini di perangkat pribadi, lindungi browser dengan akun OS yang aman, dan hindari pairing cepat pada perangkat publik atau milik bersama.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="app-surface overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--border-primary)] flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-[var(--text-primary)]">Setup Perangkat Utama</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Lakukan ini terlebih dahulu di perangkat utama Anda.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">Wajib</span>
                                        </div>
                                        <div className="p-4 space-y-4" id="auth-section">
                                            <p className="text-sm text-[var(--text-secondary)]">Masukkan konfigurasi Dropbox lalu lakukan otorisasi langsung di perangkat utama. Setelah perangkat utama berhasil terhubung, barulah pairing cepat dipakai untuk perangkat kedua.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)]">App Key</label>
                                                    <input type="text" value={dropboxAppKey} onChange={e => setDropboxAppKey(e.target.value)} className="w-full min-w-0 p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Masukkan Dropbox App Key" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)]">App Secret</label>
                                                    <input type="password" value={dropboxAppSecret} onChange={e => setDropboxAppSecret(e.target.value)} className="w-full min-w-0 p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Masukkan Dropbox App Secret" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">Langkah 1: Dapatkan Kode Otorisasi</p>
                                                <button onClick={handleGetAuthCode} className="w-full md:w-auto bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md font-semibold text-sm text-left">Buka Dropbox & Salin Kode</button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">Langkah 2: Masukkan Kode</p>
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <input type="text" value={dropboxAuthCode} onChange={e => setDropboxAuthCode(e.target.value)} className="flex-grow min-w-0 p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" placeholder="Tempel kode di sini..." />
                                                    <button onClick={handleConnectWithCode} disabled={isExchangingCode} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-50">
                                                        {isExchangingCode ? 'Menghubungkan...' : 'Hubungkan'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="app-surface-muted overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--border-primary)] flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">2</div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-[var(--text-primary)]">Pairing Perangkat Kedua</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Gunakan setelah perangkat utama sudah berhasil terhubung.</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Butuh perangkat utama aktif</span>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">Opsional</span>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-start gap-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-3">
                                                <div className="mt-0.5 text-green-600 dark:text-green-400">
                                                    <CheckIcon className="text-base" />
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)]">
                                                    <p className="font-semibold text-[var(--text-primary)]">Syarat sebelum pairing</p>
                                                    <p>Pastikan perangkat utama sudah berhasil login dan terhubung ke Dropbox terlebih dahulu.</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)]">Jika Anda sudah punya perangkat utama yang aktif, gunakan pairing cepat ini untuk menyalin akses ke perangkat kedua milik Anda tanpa setup ulang dari nol.</p>
                                            <div className="text-xs rounded-[var(--radius-control)] bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3 text-purple-900 dark:text-purple-100">
                                                Pairing cepat paling cocok antar perangkat pribadi yang sama-sama Anda percaya. Hindari memakai alur ini pada perangkat publik atau bersama.
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                <button onClick={startScanner} className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                                                    <ScanIcon className="text-lg" /> Scan QR Code
                                                </button>
                                            </div>

                                            <div className="text-center text-xs text-[var(--text-muted)]">- ATAU -</div>

                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <input 
                                                    type="text" 
                                                    value={inputPairingCode} 
                                                    onChange={(e) => setInputPairingCode(e.target.value)} 
                                                    className="flex-grow min-w-0 p-2 text-sm border border-[var(--border-secondary)] rounded bg-[var(--bg-secondary)]"
                                                    placeholder="Tempel kode teks pairing..."
                                                />
                                                <button onClick={handleApplyPairingCode} className="w-full sm:w-auto bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] px-3 py-2 rounded text-sm font-bold">Masuk dengan Kode</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Connected Status & Storage Indicator */}
                                <div className="app-surface-muted p-4">
                                    <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:justify-between sm:items-start">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-300"><CheckIcon className="text-lg" /></div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[var(--text-primary)]">Terhubung ke Dropbox</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Akun Anda siap untuk sinkronisasi.</p>
                                            </div>
                                        </div>
                                        <button onClick={handleDisconnectDropbox} className="self-start text-red-500 hover:text-red-700 text-sm font-semibold hover:underline">Putuskan</button>
                                    </div>
                                    
                                    {dropboxUsage && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs mb-1 font-medium text-[var(--text-secondary)]">
                                                <span>Penyimpanan: {formatBytes(dropboxUsage.used)} terpakai</span>
                                                <span>Total: {formatBytes(dropboxUsage.allocation.allocated)}</span>
                                            </div>
                                            <div className="w-full bg-[var(--bg-muted)] rounded-full h-2.5">
                                                <div 
                                                    className={`h-2.5 rounded-full ${dropboxPercent > 90 ? 'bg-red-500' : 'bg-green-600'}`} 
                                                    style={{ width: `${dropboxPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="app-surface-muted p-4">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="text-slate-600 dark:text-slate-300 text-lg mt-0.5 flex-shrink-0" />
                                        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                                            <p className="font-semibold text-[var(--text-primary)]">Catatan arsitektur</p>
                                            <p>Sinkronisasi Dropbox di SoalGenius memakai model client-first. Artinya proses otorisasi, token, dan pairing dikelola langsung di browser agar aplikasi bisa tetap sederhana, offline-friendly, dan tanpa backend sendiri.</p>
                                            <p className="text-xs">Konsekuensinya, pairing cepat paling aman dipakai hanya antar perangkat pribadi yang Anda percaya.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Host Pairing Section */}
                                <div className="app-surface-muted p-4">
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><QrCodeIcon /> Pairing Cepat Antar Perangkat</h4>
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">Gunakan ini untuk menghubungkan perangkat lain tanpa memasukkan App Key manual. Rekomendasi: hanya untuk perangkat Anda sendiri.</p>
                                    
                                    {!showPairingHost ? (
                                        <button onClick={handleGeneratePairingCode} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Tampilkan Kode Pairing Cepat</button>
                                    ) : (
                                        <div className="space-y-4 animate-fade-in bg-[var(--bg-secondary)] p-4 rounded-[var(--radius-control)] border border-[var(--border-primary)]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm border border-[var(--border-secondary)]">
                                                    {/* External API for QR Code display */}
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedPairingCode}`} alt="QR Code" className="w-40 h-40" />
                                                </div>
                                                <p className="text-xs font-bold text-[var(--text-secondary)] text-center">Scan menggunakan "Scan QR" di perangkat baru</p>
                                            </div>
                                            
                                            <div className="space-y-2 pt-2 border-t border-[var(--border-primary)]">
                                                <label className="text-xs text-[var(--text-muted)] font-bold uppercase">Atau salin kode teks</label>
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <input readOnly value={generatedPairingCode} className="flex-grow min-w-0 p-2 text-xs font-mono border rounded bg-[var(--bg-primary)]" />
                                                    <button onClick={handleCopyPairingCode} className="w-full sm:w-auto p-2 bg-[var(--bg-hover)] rounded hover:bg-gray-300 dark:hover:bg-gray-600"><CopyIcon /></button>
                                                </div>
                                            </div>
                                            <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 text-amber-900 dark:text-amber-100">
                                                Jangan bagikan QR/kode ini ke orang lain. Kode pairing cepat dimaksudkan untuk memindahkan akses ke perangkat Anda yang lain, bukan untuk perangkat publik atau bersama.
                                            </div>
                                            <button onClick={() => setShowPairingHost(false)} className="text-xs text-red-500 hover:underline w-full text-center">Tutup</button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button onClick={handleUploadToCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-3.5 border border-[var(--border-secondary)] rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] transition-all group">
                                        <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-full text-blue-600 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800"><CloudUploadIcon className="text-xl" /></div>
                                        <div className="min-w-0 text-left">
                                            <p className="font-bold text-[var(--text-primary)]">Upload ke Cloud</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Simpan data lokal ke Dropbox</p>
                                        </div>
                                    </button>
                                    <button onClick={handleDownloadFromCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-3.5 border border-[var(--border-secondary)] rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] transition-all group">
                                        <div className="bg-green-100 dark:bg-green-900/50 p-2.5 rounded-full text-green-600 dark:text-green-300 group-hover:bg-green-200 dark:group-hover:bg-green-800"><CloudDownloadIcon className="text-xl" /></div>
                                        <div className="min-w-0 text-left">
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
