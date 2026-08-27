import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Exam, Settings } from '../types';
import type { View } from '../App';
import { getSettings, saveSettings, getAllExams, deleteExam, createBackupData, restoreBackupData } from '../lib/storage';
import { getDropboxConfig, isDropboxConnected as checkDbxStatus, getDropboxAuthCodeUrl, exchangeAuthCodeForToken, clearDropboxToken, uploadToDropbox, downloadFromDropbox, getDropboxSpaceUsage, DropboxSpaceUsage, saveDropboxConfig, getDropboxToken, saveDropboxToken } from '../lib/dropbox';
import { saveGeminiKey, getGeminiKey } from '../lib/gemini';
import { generateDocx } from '../lib/docxGenerator';
import { generateHtmlContent } from '../lib/htmlGenerator';
import { TEMPLATE_PRESETS, applyPresetToSettings, TemplatePresetMeta } from '../lib/templatePresets';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    PlusIcon, TrashIcon, DropboxIcon, CloudUploadIcon, CloudDownloadIcon, 
    CheckIcon, SettingsIcon, CardTextIcon, PrinterIcon, 
    HddIcon, DownloadIcon, SearchIcon, BackupIcon, RestoreIcon, StarsIcon, RobotIcon, WordIcon, FileCodeIcon, InfoIcon,
    QrCodeIcon, ScanIcon, CopyIcon, CloseIcon,
    PaletteIcon, MortarboardIcon, MoonStarsIcon, GlobeIcon, BuildingIcon, TreeIcon, SparklesIcon,
    EyeIcon, ShieldCheckIcon
} from '../components/Icons';

export type SettingsTab = 'template' | 'general' | 'header' | 'format' | 'ai' | 'cloud' | 'storage';

interface SettingsViewProps {
    initialTab?: SettingsTab;
    onNavigate?: (view: View) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'template', onNavigate }) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [offlineStatus, setOfflineStatus] = useState<'checking' | 'ready' | 'not_ready'>('checking');
    const [isRefreshingOfflineCache, setIsRefreshingOfflineCache] = useState(false);
    
    // AI Settings
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

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
    const [storageBreakdown, setStorageBreakdown] = useState<{ examData: number; offlineCacheEstimate: number } | null>(null);
    const [examList, setExamList] = useState<(Exam & { size: number })[]>([]);
    const [storageSearchTerm, setStorageSearchTerm] = useState('');
    const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
    const [presetIncludeHeader, setPresetIncludeHeader] = useState<boolean>(false);
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
        if (!('caches' in window)) {
            setOfflineStatus('not_ready');
            return;
        }

        try {
            const cache = await caches.open('soalgenius-cache-v10-offline-first');
            const keys = await cache.keys();
            const hasIndex = (await cache.match('./index.html')) || (await cache.match('./')) || (await cache.match(window.location.origin + '/')) || (await cache.match(window.location.href));

            setOfflineStatus(hasIndex || keys.length >= 2 ? 'ready' : 'not_ready');
        } catch (error) {
            console.warn('Failed to check offline status:', error);
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
        let totalUsage = 0;
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            if (estimate.usage !== undefined && estimate.quota !== undefined) {
                totalUsage = estimate.usage;
                setStorageUsage({ usage: estimate.usage, quota: estimate.quota });
            }
        }
        
        const exams = await getAllExams();
        const examsWithSize = exams.map(exam => ({
            ...exam,
            size: new Blob([JSON.stringify(exam)]).size
        })).sort((a, b) => b.size - a.size); // Sort by size desc

        const examData = examsWithSize.reduce((total, exam) => total + exam.size, 0);

        let offlineCacheEstimate = 0;
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    for (const request of requests) {
                        const response = await cache.match(request);
                        if (response) {
                            const blob = await response.clone().blob();
                            offlineCacheEstimate += blob.size;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to estimate offline cache size:', error);
        }

        setStorageBreakdown({ examData, offlineCacheEstimate });
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
        updateSettings(s => ({...s, examHeaderLines: [...s.examHeaderLines, {id: crypto.randomUUID(), text: '', sizeMode: 'auto', sizePt: 12}]}));
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
    };

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateSettings(s => ({...s, margins: {...s.margins, [name as keyof Settings['margins']]: Number(value) }}));
    };

    const handleRefreshOfflineCache = useCallback(async () => {
        setIsRefreshingOfflineCache(true);
        try {
            // 1. Kumpulkan semua URL yang perlu di-cache
            const urlsToCache = new Set<string>([
                './',
                './index.html',
                './manifest.json',
                './icon.svg',
                window.location.origin + '/',
                window.location.href,
            ]);

            document.querySelectorAll('script[src], link[rel="stylesheet"]').forEach((el) => {
                const src = el instanceof HTMLScriptElement ? el.src : (el as HTMLLinkElement).href;
                if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
                    urlsToCache.add(src);
                }
            });

            document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
                const href = (el as HTMLLinkElement).href;
                if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                    urlsToCache.add(href);
                }
            });

            const allUrls = Array.from(urlsToCache);

            // 2. Simpan langsung ke Cache Storage API
            if ('caches' in window) {
                const cache = await caches.open('soalgenius-cache-v10-offline-first');
                
                await Promise.allSettled(
                    allUrls.map(async (url) => {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 6000);
                            
                            let response: Response;
                            try {
                                response = await fetch(url, { 
                                    cache: 'reload',
                                    signal: controller.signal 
                                });
                            } catch {
                                response = await fetch(url, { 
                                    mode: 'no-cors',
                                    signal: controller.signal 
                                });
                            }
                            
                            clearTimeout(timeoutId);
                            if (response && (response.ok || response.type === 'opaque')) {
                                await cache.put(url, response.clone());
                            }
                        } catch (err) {
                            console.warn('Gagal menyimpan cache asset:', url, err);
                        }
                    })
                );
            }

            // 3. Daftarkan Service Worker
            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.register('./sw.js');
                    if (reg.update) {
                        reg.update().catch(() => {});
                    }
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'CACHE_URLS',
                            urls: allUrls,
                        });
                    }
                } catch (swErr) {
                    console.warn('Service worker update warning:', swErr);
                }
            }

            await checkOfflineStatus();
            addToast('Unduh library selesai! Seluruh komponen aplikasi telah tersimpan untuk penggunaan offline.', 'success');
        } catch (error) {
            console.error('Failed to refresh offline cache:', error);
            addToast('Gagal mengunduh library. Pastikan internet aktif dan coba lagi.', 'error');
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
                    <div className="text-xs sm:text-sm text-[var(--text-secondary)] space-y-3">
                        <p>Dokumen berhasil diproses! Semoga bermanfaat untuk kegiatan mengajar Bapak/Ibu.</p>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-[var(--radius-card)] border border-blue-100 dark:border-blue-800">
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
                const backupPayload = {
                    source: 'SoalGeniusDB',
                    version: 3,
                    createdAt: new Date().toISOString(),
                    data: { exams: [exam] }
                };
                blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            } else if (format === 'docx') {
                blob = await generateDocx(exam, settings);
            } else {
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
            
            const shouldAutoSync = sessionStorage.getItem('soalgenius_auto_restore');
            if (shouldAutoSync === '1') {
                addToast('Koneksi berhasil! Mengunduh data dari Cloud...', 'info');
                await downloadFromDropbox();
                sessionStorage.removeItem('soalgenius_auto_restore');
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
            scannerRef.current.clear().catch((error: any) => {
                console.error("Failed to clear scanner", error);
            });
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const onScanSuccess = (decodedText: any) => {
        stopScanner();
        const text = typeof decodedText === 'string' ? decodedText : String(decodedText);
        processPairingCode(text);
    };

    const onScanFailure = () => {};

    const startScanner = () => {
        setIsScanning(true);
        setTimeout(async () => {
            if (!document.getElementById('reader')) return;
            
            try {
                const { Html5QrcodeScanner } = await import('html5-qrcode');
                if (Html5QrcodeScanner) {
                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        false
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
                    loadStorageData();
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

        if (selectedExams.length > 5) {
             const ok = window.confirm(`Anda akan mengunduh ${selectedExams.length} file terpisah. Browser mungkin meminta izin untuk mengunduh banyak file. Lanjutkan?`);
             if (!ok) return;
        }

        addToast(`Mulai mengunduh ${selectedExams.length} dokumen...`, 'info');

        for (let i = 0; i < selectedExams.length; i++) {
            await handleExportExam(selectedExams[i], format, true);
            if (i < selectedExams.length - 1) {
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
            }
        }
        
        addToast(`Selesai mengunduh ${selectedExams.length} dokumen.`, 'success');
        setSelectedExamIds(new Set<string>());
        showDonationPrompt();
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
        return (
            <div className="mx-auto w-full max-w-5xl flex items-center justify-center p-12 app-surface rounded-[var(--radius-card)]">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                    <div className="w-5 h-5 border-2 border-[var(--bg-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span>Memuat preferensi pengaturan...</span>
                </div>
            </div>
        );
    }

    const tabs: { id: SettingsTab; label: string; sublabel: string; icon: React.ElementType }[] = [
        { id: 'template', label: 'Preset Gaya', sublabel: 'Layout & tema naskah instan', icon: PaletteIcon },
        { id: 'general', label: 'Tampilan & Offline', sublabel: 'Mode tema & cache browser', icon: SettingsIcon },
        { id: 'header', label: 'Kop Surat', sublabel: 'Identitas sekolah & logo naskah', icon: CardTextIcon },
        { id: 'format', label: 'Kertas & Tipografi', sublabel: 'Ukuran kertas, font & spasi', icon: PrinterIcon },
        { id: 'ai', label: 'AI Gemini', sublabel: 'Model generatif & API Key', icon: StarsIcon },
        { id: 'cloud', label: 'Cloud Dropbox', sublabel: 'Sinkron & pairing perangkat', icon: DropboxIcon },
        { id: 'storage', label: 'Manajemen Data', sublabel: 'Backup, restore & arsip', icon: HddIcon },
    ];

    const getPresetIconElement = (id: string) => {
        switch (id) {
            case 'kemendikbud': return <MortarboardIcon className="text-xl text-blue-600 dark:text-blue-400" />;
            case 'madrasah': return <MoonStarsIcon className="text-xl text-emerald-600 dark:text-emerald-400" />;
            case 'cambridge': return <GlobeIcon className="text-xl text-purple-600 dark:text-purple-400" />;
            case 'minimal': return <TreeIcon className="text-xl text-emerald-600 dark:text-emerald-400" />;
            default: return <BuildingIcon className="text-xl text-slate-600 dark:text-slate-400" />;
        }
    };

    const handleApplyPreset = (presetId: TemplatePresetMeta['id']) => {
        updateSettings(s => applyPresetToSettings(s, presetId, { updateHeaderLines: presetIncludeHeader }));
        addToast(`Preset "${TEMPLATE_PRESETS.find(p => p.id === presetId)?.name}" berhasil diterapkan!`, 'success');
    };

    const storagePercent = storageUsage ? Math.min(100, (storageUsage.usage / storageUsage.quota) * 100) : 0;
    const dropboxPercent = dropboxUsage ? Math.min(100, (dropboxUsage.used / dropboxUsage.allocation.allocated) * 100) : 0;

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col space-y-5 pb-12 px-1 sm:px-2 md:px-4 animate-fade-in">
            <input type="file" ref={restoreInputRef} onChange={handleFileRestore} className="hidden" accept="application/json" />

            {/* QR Scanner Modal */}
            {isScanning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="app-surface w-full max-w-sm rounded-[var(--radius-card)] p-4 shadow-2xl border border-[var(--border-primary)]">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                                <ScanIcon className="text-base text-purple-600" />
                                <span>Pindai QR Code Pairing</span>
                            </h3>
                            <button onClick={stopScanner} className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                <CloseIcon className="text-sm" />
                            </button>
                        </div>
                        <div id="reader" className="w-full rounded-[var(--radius-control)] overflow-hidden"></div>
                        <p className="text-[11px] text-center text-[var(--text-secondary)] mt-3">Arahkan kamera ke QR Code di perangkat utama (Menu Cloud).</p>
                    </div>
                </div>
            )}

            {/* Header Area with Title & Action Button */}
            <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-accent)] mb-1">
                            <i className="bi bi-sliders text-xs"></i>
                            <span>Konfigurasi & Personalisasi Sistem</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Pengaturan SoalGenius
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            Kustomisasi preset naskah, kop sekolah, ukuran kertas & tipografi, integrasi AI, hingga sinkronisasi cloud.
                        </p>
                    </div>

                    {/* Quick Save Header Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] transition-all shadow-xs disabled:opacity-60"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="text-base" />
                                    <span>Simpan Pengaturan</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Hint Notice */}
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-control)] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                    <InfoIcon className="text-base flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="leading-snug">
                        <strong>Pengingat:</strong> Jangan lupa klik tombol <strong>"Simpan Pengaturan"</strong> di atas setelah mengubah konfigurasi agar seluruh preferensi tersimpan permanen.
                    </span>
                </div>

                {/* Unified Smooth Horizontal Scrollable Tab Navigation */}
                <div className="app-tab-shell p-1 w-full overflow-x-auto no-scrollbar">
                    <div className="flex items-stretch gap-1 min-w-max xl:min-w-0 xl:w-full xl:grid xl:grid-cols-7">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`app-tab-button flex flex-col items-start justify-center gap-0.5 px-3.5 py-2 text-xs font-semibold text-left transition-all flex-shrink-0 ${
                                        isActive ? 'app-tab-button-active' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 w-full">
                                        <Icon className={`text-sm flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                                        <span className="truncate font-bold leading-tight">{tab.label}</span>
                                    </div>
                                    <div className={`text-[10px] truncate w-full ${isActive ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                        {tab.sublabel}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* 1. PRESET TEMPLATE TAB */}
                {activeTab === 'template' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-primary)] pb-3">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                        <PaletteIcon className="text-blue-600 dark:text-blue-400" />
                                        <span>Preset Tata Letak & Gaya Visual Ujian</span>
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                        Pilih preset 1-klik untuk otomatis menyesuaikan tipografi, font Arab/Latin, header, pembatas, dan format stimulus.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all">
                                        <input
                                            type="checkbox"
                                            checked={presetIncludeHeader}
                                            onChange={(e) => setPresetIncludeHeader(e.target.checked)}
                                            className="rounded border-[var(--border-secondary)] text-[var(--bg-accent)] focus:ring-[var(--bg-accent)] w-4 h-4 cursor-pointer"
                                        />
                                        <span>Terapkan juga teks Kop contoh</span>
                                    </label>
                                </div>
                            </div>

                            {/* Preset Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {TEMPLATE_PRESETS.map((preset) => {
                                    const isCurrent = settings.templatePreset === preset.id;
                                    return (
                                        <div
                                            key={preset.id}
                                            className={`p-4 sm:p-4.5 rounded-[var(--radius-card)] border transition-all flex flex-col justify-between group shadow-xs ${
                                                isCurrent
                                                    ? 'border-[var(--bg-accent)] bg-blue-50/40 dark:bg-blue-950/20 shadow-sm ring-1 ring-[var(--bg-accent)]'
                                                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0">
                                                            {getPresetIconElement(preset.id)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-tight">
                                                                {preset.name}
                                                            </h4>
                                                            <p className="text-[11px] text-[var(--text-secondary)]">{preset.subtitle}</p>
                                                        </div>
                                                    </div>
                                                    {isCurrent && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-control)] text-[10px] font-bold bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-xs">
                                                            <CheckIcon />
                                                            <span>Aktif</span>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="my-2">
                                                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-[var(--radius-control)] ${preset.tagColor}`}>
                                                        {preset.tag}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                                                    {preset.description}
                                                </p>

                                                <div className="space-y-1 mb-4 pt-2 border-t border-[var(--border-primary)]">
                                                    {preset.highlights.map((h, i) => (
                                                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]">
                                                            <span className="text-[var(--text-accent)] font-bold">•</span>
                                                            <span>{h}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleApplyPreset(preset.id)}
                                                disabled={isCurrent}
                                                className={`w-full py-2 px-3 rounded-[var(--radius-control)] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                                    isCurrent
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 cursor-default font-bold'
                                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-accent)] text-[var(--text-primary)] hover:text-[var(--text-on-accent)] border border-[var(--border-secondary)] shadow-xs'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    <>
                                                        <CheckIcon />
                                                        <span>Template Sedang Digunakan</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SparklesIcon />
                                                        <span>Terapkan Gaya {preset.name}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Fine-Tuning Granular Controls Card */}
                            <div className="border-t border-[var(--border-primary)] pt-5 space-y-4">
                                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <SettingsIcon className="text-slate-500" />
                                    <span>Penyesuaian Elemen Visual Khusus</span>
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Madrasah Toggles */}
                                    <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
                                        <h5 className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                                            <MoonStarsIcon className="text-emerald-600" />
                                            <span>Fitur Madrasah & Keagamaan</span>
                                        </h5>

                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.showBasmalah ?? false}
                                                onChange={(e) => updateSettings(s => ({ ...s, showBasmalah: e.target.checked }))}
                                                className="mt-0.5 rounded border-[var(--border-secondary)] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                            />
                                            <div>
                                                <span className="text-xs font-semibold text-[var(--text-primary)]">Teks Basmalah di Awal Ujian</span>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Menampilkan kaligrafi Basmalah sebelum butir soal nomor 1.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.showHamdalah ?? false}
                                                onChange={(e) => updateSettings(s => ({ ...s, showHamdalah: e.target.checked }))}
                                                className="mt-0.5 rounded border-[var(--border-secondary)] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                            />
                                            <div>
                                                <span className="text-xs font-semibold text-[var(--text-primary)]">Teks Hamdalah di Akhir Ujian</span>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Menampilkan kalimat syukur di penutup lembar soal terakhir.</p>
                                            </div>
                                        </label>

                                        <div className="pt-1">
                                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                                                Penomoran Pilihan Ganda Arab
                                            </label>
                                            <select
                                                value={settings.arabicOptionStyle || 'latin'}
                                                onChange={(e) => updateSettings(s => ({ ...s, arabicOptionStyle: e.target.value as 'latin' | 'hijaiyah' }))}
                                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            >
                                                <option value="latin">Latin Baku (A, B, C, D, E)</option>
                                                <option value="hijaiyah">Hijaiyah / Arab Pegon (أ, ب, ج, د, هـ)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Stimulus & Layout Toggles */}
                                    <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
                                        <h5 className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                                            <GlobeIcon className="text-purple-600" />
                                            <span>Format Soal & Stimulus</span>
                                        </h5>

                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.showPointsBadge ?? false}
                                                onChange={(e) => updateSettings(s => ({ ...s, showPointsBadge: e.target.checked }))}
                                                className="mt-0.5 rounded border-[var(--border-secondary)] text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                            />
                                            <div>
                                                <span className="text-xs font-semibold text-[var(--text-primary)]">Badge Alokasi Poin / Marks</span>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Menampilkan bobot nilai [marks] di samping nomor soal (gaya Cambridge).</p>
                                            </div>
                                        </label>

                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                                                Gaya Kotak Stimulus / Wacana Literasi
                                            </label>
                                            <select
                                                value={settings.stimulusStyle || 'modern_card'}
                                                onChange={(e) => updateSettings(s => ({ ...s, stimulusStyle: e.target.value as any }))}
                                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            >
                                                <option value="modern_card">Modern Callout Card (Kurikulum Merdeka)</option>
                                                <option value="bordered">Bordered Box (Kotak Garis Utuh Klasik)</option>
                                                <option value="minimal">Minimalist Line (Garis Pembatas Putus-putus)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                                                Gaya Garis Pembatas Kop Surat
                                            </label>
                                            <select
                                                value={settings.dividerStyle || 'modern'}
                                                onChange={(e) => updateSettings(s => ({ ...s, dividerStyle: e.target.value as any }))}
                                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            >
                                                <option value="modern">Garis Modern Gradasi Halus</option>
                                                <option value="double">Garis Ganda Dinas Tebal-Tipis (Double Rule)</option>
                                                <option value="solid">Garis Tunggal Tegas (Single Solid)</option>
                                                <option value="dashed">Garis Putus-Putus (Dashed)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GENERAL / TAMPILAN & OFFLINE TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Theme Mode Card */}
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <SettingsIcon className="text-blue-600 dark:text-blue-400" />
                                    <span>Tampilan & Tema Aplikasi</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Sesuaikan tema antarmuka sesuai kenyamanan visual saat menyusun naskah ujian.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`p-4 rounded-[var(--radius-card)] border text-left transition-all flex items-center justify-between ${
                                        theme === 'light'
                                            ? 'border-[var(--bg-accent)] bg-blue-50/40 dark:bg-blue-950/20 shadow-xs ring-1 ring-[var(--bg-accent)]'
                                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                                            <i className="bi bi-sun-fill text-lg"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Mode Terang (Light)</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">Kontras tinggi, cocok di siang hari atau saat mencetak.</p>
                                        </div>
                                    </div>
                                    {theme === 'light' && (
                                        <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-white flex items-center justify-center text-xs">
                                            <CheckIcon />
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`p-4 rounded-[var(--radius-card)] border text-left transition-all flex items-center justify-between ${
                                        theme === 'dark'
                                            ? 'border-[var(--bg-accent)] bg-blue-50/40 dark:bg-blue-950/20 shadow-xs ring-1 ring-[var(--bg-accent)]'
                                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-indigo-900/40 text-indigo-300 border border-indigo-700 flex items-center justify-center font-bold">
                                            <i className="bi bi-moon-stars-fill text-base"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Mode Gelap (Dark)</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">Nyaman untuk mata saat bekerja di ruangan redup.</p>
                                        </div>
                                    </div>
                                    {theme === 'dark' && (
                                        <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-white flex items-center justify-center text-xs">
                                            <CheckIcon />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Offline Mode & Cache Section */}
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <ShieldCheckIcon className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Kesiapan Mode Offline (PWA & Cache)</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    SoalGenius dirancang dengan arsitektur Offline-First. Seluruh pustaka editor dan cetak dapat dijalankan tanpa internet.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Status Kesiapan Cache Offline:</span>
                                        <div>
                                            <div className={`inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-1 text-xs font-bold ${
                                                offlineStatus === 'ready'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                    : offlineStatus === 'checking'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                            }`}>
                                                {offlineStatus === 'ready' ? <CheckIcon /> : <InfoIcon />}
                                                <span>
                                                    {offlineStatus === 'ready'
                                                        ? 'Aplikasi 100% Siap Digunakan Tanpa Internet'
                                                        : offlineStatus === 'checking'
                                                            ? 'Memeriksa status cache browser...'
                                                            : 'Library offline belum lengkap tersimpan'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRefreshOfflineCache}
                                        disabled={isRefreshingOfflineCache}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm rounded-[var(--radius-control)] font-semibold shadow-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isRefreshingOfflineCache ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Mengunduh Library...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CloudDownloadIcon />
                                                <span>Unduh & Perbarui Library Offline</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-secondary)] space-y-2">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0">
                                            <InfoIcon className="text-base" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-[var(--text-primary)]">Cara Pakai Mode Offline</p>
                                            <p className="leading-relaxed">
                                                Klik <strong>Unduh & Perbarui Library Offline</strong> saat internet aktif. Seluruh aset aplikasi (JS, CSS, font, ikon KaTeX, dan mesin DOCX/PDF) akan disimpan ke cache browser lokal Anda.
                                            </p>
                                            <p className="leading-relaxed text-[var(--text-muted)]">
                                                Setelah berstatus siap offline, Anda bisa membuka aplikasi kapan saja tanpa perlu sinyal internet.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. HEADER / KOP SURAT TAB */}
                {activeTab === 'header' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <CardTextIcon className="text-blue-600 dark:text-blue-400" />
                                    <span>Identitas Sekolah & Kop Surat Naskah</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Atur susunan teks kop lembaga, kementerian/dinas, nama madrasah/sekolah, dan logo naskah ujian.
                                </p>
                            </div>
                            
                            {/* Lines Editor */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                    Baris Teks Kop (Atas ke Bawah)
                                </label>

                                <div className="space-y-2.5">
                                    {settings.examHeaderLines.map((line, idx) => (
                                        <div key={line.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border border-[var(--border-primary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] shadow-xs">
                                            <div className="w-6 h-6 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <input 
                                                type="text" 
                                                value={line.text} 
                                                onChange={(e) => handleHeaderChange(line.id, e.target.value)} 
                                                placeholder={`Contoh: PEMERINTAH DAERAH PROVINSI...`} 
                                                className="flex-grow px-3 py-2 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]" 
                                            />
                                            <div className="flex items-center gap-2 justify-between sm:justify-start">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">Ukuran:</span>
                                                    <select 
                                                        value={line.sizeMode || 'auto'} 
                                                        onChange={(e) => updateSettings(s => ({...s, examHeaderLines: s.examHeaderLines.map(l => l.id === line.id ? {...l, sizeMode: e.target.value as 'auto'|'fixed'} : l)}))} 
                                                        className="text-xs px-2 py-1.5 border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                                    >
                                                        <option value="auto">Auto (Dinamis)</option>
                                                        <option value="fixed">Fixed (Manual)</option>
                                                    </select>
                                                </div>
                                                {line.sizeMode === 'fixed' && (
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" min={6} max={24} step={0.5} 
                                                            value={line.sizePt ?? 12} 
                                                            onChange={(e) => updateSettings(s => ({...s, examHeaderLines: s.examHeaderLines.map(l => l.id === line.id ? {...l, sizePt: parseFloat(e.target.value) || 12} : l)}))} 
                                                            className="w-14 text-xs p-1.5 border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-center text-[var(--text-primary)] font-mono" 
                                                        />
                                                        <span className="text-[11px] text-[var(--text-muted)]">pt</span>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => removeHeaderLine(line.id)} 
                                                    disabled={settings.examHeaderLines.length <= 1}
                                                    className="p-1.5 rounded-[var(--radius-control)] hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-600 disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors" 
                                                    title="Hapus Baris"
                                                >
                                                    <TrashIcon className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={addHeaderLine} 
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-secondary)] transition-all shadow-xs"
                                >
                                    <PlusIcon className="text-sm" />
                                    <span>Tambah Baris Teks Kop</span>
                                </button>
                            </div>

                            {/* Logos Upload Grid */}
                            <div className="border-t border-[var(--border-primary)] pt-4">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                                    Logo Lembaga & Sekolah
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[0, 1].map((index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                                    {index === 0 ? 'Logo Kiri (Misal: Lambang Pemda/Kemenag)' : 'Logo Kanan (Misal: Logo Sekolah/Madrasah)'}
                                                </span>
                                            </div>
                                            <div className="border-2 border-dashed border-[var(--border-secondary)] hover:border-[var(--bg-accent)] rounded-[var(--radius-card)] p-4 flex flex-col items-center justify-center min-h-[130px] bg-[var(--bg-secondary)] relative group transition-all">
                                                {settings.logos[index] ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <img src={settings.logos[index]!} alt="Logo Preview" className="max-h-20 max-w-[140px] object-contain rounded" />
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleLogoRemove(index as 0 | 1); }} 
                                                            className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded-full hover:bg-red-200 transition-colors shadow-xs"
                                                            title="Hapus Logo"
                                                        >
                                                            <TrashIcon className="text-xs" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center space-y-1">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-muted)] mx-auto flex items-center justify-center">
                                                            <CardTextIcon className="text-sm" />
                                                        </div>
                                                        <span className="text-xs text-[var(--text-muted)] block">Belum ada logo terunggah</span>
                                                        <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Klik untuk memilih berkas gambar (Maks. 1MB)</span>
                                                    </div>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleLogoUpload(e, index as 0 | 1)} 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. FORMAT / KERTAS & TIPOGRAFI TAB */}
                {activeTab === 'format' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <PrinterIcon className="text-blue-600 dark:text-blue-400" />
                                    <span>Format Kertas, Tipografi & Margin</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Sesuaikan dimensi cetak, jenis huruf, spasi naskah, dan margin presisi milimeter.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Ukuran Kertas Standar</label>
                                    <select 
                                        value={settings.paperSize} 
                                        onChange={(e) => updateSettings(s => ({...s, paperSize: e.target.value as Settings['paperSize']}))} 
                                        className="w-full p-2.5 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                    >
                                        <option value="A4">A4 (210 x 297 mm) — Standar Nasional & Ujian</option>
                                        <option value="F4">F4 / Folio (215 x 330 mm) — Standar Sekolah Indonesia</option>
                                        <option value="Legal">Legal (216 x 356 mm) — Panjang Ekstra</option>
                                        <option value="Letter">Letter (216 x 279 mm) — Standar Internasional</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Jenis Huruf Naskah (Font Family)</label>
                                    <select 
                                        value={settings.fontFamily} 
                                        onChange={(e) => updateSettings(s => ({...s, fontFamily: e.target.value as Settings['fontFamily']}))} 
                                        className="w-full p-2.5 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                    >
                                        <option value="Liberation Serif">Liberation Serif (Serif Resmi Ujian / Mirip Times New Roman)</option>
                                        <option value="Liberation Sans">Liberation Sans (Sans-Serif Modern / Mirip Arial)</option>
                                        <option value="Amiri">Amiri (Arabic Naskh Klasik & Formal)</option>
                                        <option value="Areef Ruqaa">Areef Ruqaa (Arabic Handwriting Style)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Ukuran Font Dasar (pt)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" min="8" max="24" step="0.5" 
                                            value={settings.fontSize} 
                                            onChange={(e) => updateSettings(s => ({...s, fontSize: Number(e.target.value)}))} 
                                            className="w-full p-2 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--bg-accent)]" 
                                        />
                                        <span className="text-xs text-[var(--text-muted)] font-semibold">pt</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Kerapatan Spasi Baris (Line Spacing)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" min="1" max="3" step="0.05" 
                                            value={settings.lineSpacing} 
                                            onChange={(e) => updateSettings(s => ({...s, lineSpacing: Number(e.target.value)}))} 
                                            className="w-full p-2 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--bg-accent)]" 
                                        />
                                        <span className="text-xs text-[var(--text-muted)] font-semibold">x</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--border-primary)] pt-4 space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                    Batas Margin Halaman (Milimeter)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1">
                                        <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Margin Atas</label>
                                        <div className="flex items-center gap-1.5">
                                            <input type="number" name="top" value={settings.margins.top} onChange={handleMarginChange} className="w-full p-1.5 text-xs font-mono border border-[var(--border-secondary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                                            <span className="text-[11px] text-[var(--text-muted)]">mm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1">
                                        <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Margin Bawah</label>
                                        <div className="flex items-center gap-1.5">
                                            <input type="number" name="bottom" value={settings.margins.bottom} onChange={handleMarginChange} className="w-full p-1.5 text-xs font-mono border border-[var(--border-secondary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                                            <span className="text-[11px] text-[var(--text-muted)]">mm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1">
                                        <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Margin Kiri</label>
                                        <div className="flex items-center gap-1.5">
                                            <input type="number" name="left" value={settings.margins.left} onChange={handleMarginChange} className="w-full p-1.5 text-xs font-mono border border-[var(--border-secondary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                                            <span className="text-[11px] text-[var(--text-muted)]">mm</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1">
                                        <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Margin Kanan</label>
                                        <div className="flex items-center gap-1.5">
                                            <input type="number" name="right" value={settings.margins.right} onChange={handleMarginChange} className="w-full p-1.5 text-xs font-mono border border-[var(--border-secondary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                                            <span className="text-[11px] text-[var(--text-muted)]">mm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. AI / CERDAS TAB */}
                {activeTab === 'ai' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <RobotIcon className="text-purple-600 dark:text-purple-400" />
                                    <span>Integrasi Kecerdasan Buatan (Google Gemini API)</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Konfigurasikan kunci API resmi untuk pembuatan butir soal otomatis, penulisan stimulus wacana, dan perumusan KaTeX.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-[var(--radius-card)] bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200">
                                        Google Gemini API Key (Opsional / Disarankan)
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        Memasukkan API Key Gemini pribadi memberikan performa pembuatan soal yang jauh lebih cepat, stabil, dan berakurasi tinggi. Jika dikosongkan, fitur AI menggunakan penyedia gratis bawaan.
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                                        Kunci API Gemini (AI Studio Key)
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <input 
                                                type={showApiKey ? "text" : "password"} 
                                                value={geminiApiKey} 
                                                onChange={(e) => setGeminiApiKey(e.target.value)} 
                                                placeholder="Tempel API Key di sini (misal: AIzaSy...)"
                                                className="w-full pr-10 px-3 py-2 text-xs sm:text-sm border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--bg-accent)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 text-sm"
                                                title={showApiKey ? "Sembunyikan" : "Tampilkan"}
                                            >
                                                <EyeIcon />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 text-[11px] text-[var(--text-muted)]">
                                        <span>Kunci ini disimpan 100% aman di penyimpanan lokal browser Anda.</span>
                                        <a 
                                            href="https://aistudio.google.com/app/apikey" 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <span>Dapatkan API Key Gratis di Google AI Studio</span>
                                            <i className="bi bi-box-arrow-up-right text-[9px]"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. CLOUD / DROPBOX TAB */}
                {activeTab === 'cloud' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <DropboxIcon className="text-blue-600 dark:text-blue-400 text-xl" />
                                    <span>Sinkronisasi Cloud & Pairing Perangkat (Dropbox)</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Hubungkan akun Dropbox untuk mencadangkan seluruh bank naskah secara otomatis dan berpindah perangkat secara instan.
                                </p>
                            </div>

                            {!isDropboxConnected ? (
                                <div className="space-y-5">
                                    <div className="p-4 rounded-[var(--radius-card)] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                                        <InfoIcon className="text-amber-600 dark:text-amber-400 text-lg mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1 text-xs sm:text-sm text-amber-900 dark:text-amber-100">
                                            <p className="font-bold">Model Keamanan Client-First</p>
                                            <p className="leading-relaxed">
                                                Kredensial Dropbox dikelola langsung di browser Anda tanpa server perantara. Gunakan fitur ini pada laptop atau smartphone pribadi terpercaya Anda.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {/* Step 1 Card */}
                                        <div className="p-4 sm:p-5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-4" id="auth-section">
                                            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                                                    <div>
                                                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Setup Perangkat Utama</h4>
                                                        <p className="text-[11px] text-[var(--text-secondary)]">Lakukan langkah ini terlebih dahulu di perangkat utama.</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-[var(--radius-control)] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">Wajib</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Dropbox App Key</label>
                                                    <input 
                                                        type="text" 
                                                        value={dropboxAppKey} 
                                                        onChange={e => setDropboxAppKey(e.target.value)} 
                                                        className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono" 
                                                        placeholder="Masukkan Dropbox App Key" 
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">Dropbox App Secret</label>
                                                    <input 
                                                        type="password" 
                                                        value={dropboxAppSecret} 
                                                        onChange={e => setDropboxAppSecret(e.target.value)} 
                                                        className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono" 
                                                        placeholder="Masukkan Dropbox App Secret" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2">
                                                <p className="text-xs font-bold text-[var(--text-primary)]">Langkah A: Dapatkan Kode Otorisasi</p>
                                                <button 
                                                    onClick={handleGetAuthCode} 
                                                    className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3.5 py-2 rounded-[var(--radius-control)] font-semibold text-xs transition-colors"
                                                >
                                                    <i className="bi bi-box-arrow-up-right text-xs"></i>
                                                    <span>Buka Dropbox & Salin Kode Otorisasi</span>
                                                </button>
                                            </div>

                                            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2">
                                                <p className="text-xs font-bold text-[var(--text-primary)]">Langkah B: Masukkan Kode & Hubungkan</p>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={dropboxAuthCode} 
                                                        onChange={e => setDropboxAuthCode(e.target.value)} 
                                                        className="flex-grow p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono" 
                                                        placeholder="Tempel kode otorisasi Dropbox di sini..." 
                                                    />
                                                    <button 
                                                        onClick={handleConnectWithCode} 
                                                        disabled={isExchangingCode} 
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[var(--radius-control)] font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                    >
                                                        {isExchangingCode ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>Menghubungkan...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckIcon />
                                                                <span>Hubungkan Akun</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 Card */}
                                        <div className="p-4 sm:p-5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-4">
                                            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                                                    <div>
                                                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Pairing Cepat Perangkat Kedua</h4>
                                                        <p className="text-[11px] text-[var(--text-secondary)]">Salin koneksi cloud ke HP/laptop lain tanpa setup ulang.</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-[var(--radius-control)] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">Instan</span>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                                                <button 
                                                    onClick={startScanner} 
                                                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-[var(--radius-control)] font-semibold text-xs transition-all shadow-xs"
                                                >
                                                    <ScanIcon className="text-base" />
                                                    <span>Pindai QR Code Pairing</span>
                                                </button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                <input 
                                                    type="text" 
                                                    value={inputPairingCode} 
                                                    onChange={(e) => setInputPairingCode(e.target.value)} 
                                                    className="flex-grow p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono" 
                                                    placeholder="Atau tempel teks kode pairing di sini..."
                                                />
                                                <button 
                                                    onClick={handleApplyPairingCode} 
                                                    className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] rounded-[var(--radius-control)] text-xs font-bold transition-all"
                                                >
                                                    Terapkan Kode
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Connected Status Card */}
                                    <div className="p-4 rounded-[var(--radius-card)] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-[var(--radius-control)] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold">
                                                    <CheckIcon className="text-xl" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Dropbox Terhubung & Siap Sinkron</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Data naskah ujian dapat dicadangkan dan disinkronkan ke cloud.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleDisconnectDropbox} 
                                                className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline px-2 py-1 rounded"
                                            >
                                                Putuskan Hubungan
                                            </button>
                                        </div>

                                        {dropboxUsage && (
                                            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                                                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                                                    <span>Kapasitas Cloud Terpakai: {formatBytes(dropboxUsage.used)}</span>
                                                    <span>Total: {formatBytes(dropboxUsage.allocation.allocated)}</span>
                                                </div>
                                                <div className="w-full bg-[var(--bg-muted)] rounded-full h-2 overflow-hidden border border-[var(--border-secondary)]">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${dropboxPercent > 90 ? 'bg-red-500' : 'bg-emerald-600'}`} 
                                                        style={{ width: `${dropboxPercent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button 
                                            onClick={handleUploadToCloud} 
                                            disabled={isSyncing} 
                                            className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--bg-accent)] hover:bg-[var(--bg-hover)] transition-all text-left shadow-xs group"
                                        >
                                            <div className="w-10 h-10 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                <CloudUploadIcon className="text-xl" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Unggah Data ke Cloud</h4>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Kirim cadangan database lokal ke Dropbox.</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={handleDownloadFromCloud} 
                                            disabled={isSyncing} 
                                            className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--bg-accent)] hover:bg-[var(--bg-hover)] transition-all text-left shadow-xs group"
                                        >
                                            <div className="w-10 h-10 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                <CloudDownloadIcon className="text-xl" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Unduh Data dari Cloud</h4>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Pulihkan data naskah dari cadangan Dropbox.</p>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Fast Pairing Host Card */}
                                    <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                                                <QrCodeIcon className="text-purple-600" />
                                                <span>Pairing Cepat ke Perangkat Lain</span>
                                            </h4>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                            Tampilkan barcode QR untuk menghubungkan laptop/HP kedua Anda tanpa perlu memasukkan App Key dan Secret secara manual.
                                        </p>
                                        
                                        {!showPairingHost ? (
                                            <button 
                                                onClick={handleGeneratePairingCode} 
                                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold transition-all shadow-xs"
                                            >
                                                <QrCodeIcon />
                                                <span>Tampilkan Barcode QR Pairing</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-4 pt-2 border-t border-[var(--border-primary)]">
                                                <div className="flex flex-col items-center gap-3 p-4 rounded-[var(--radius-card)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                                                    <div className="bg-white p-3 rounded-[var(--radius-card)] shadow-md">
                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedPairingCode}`} alt="QR Code Pairing" className="w-40 h-40" />
                                                    </div>
                                                    <p className="text-xs font-bold text-[var(--text-primary)] text-center">Pindai menggunakan tombol "Pindai QR" pada perangkat kedua</p>
                                                </div>
                                                
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-[var(--text-muted)] font-bold uppercase">Atau Salin Kode Teks Pairing:</label>
                                                    <div className="flex gap-2">
                                                        <input readOnly value={generatedPairingCode} className="flex-grow p-2 text-xs font-mono border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                                                        <button onClick={handleCopyPairingCode} className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] rounded-[var(--radius-control)] text-xs font-semibold flex items-center gap-1">
                                                            <CopyIcon />
                                                            <span>Salin</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <button onClick={() => setShowPairingHost(false)} className="text-xs text-red-500 hover:underline font-semibold">
                                                    Sembunyikan QR Code
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 7. STORAGE / MANAJEMEN DATA TAB */}
                {activeTab === 'storage' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Storage Usage Info Card */}
                        <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                            <div className="border-b border-[var(--border-primary)] pb-3">
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <HddIcon className="text-blue-600 dark:text-blue-400" />
                                    <span>Penyimpanan Lokal & Cadangan Data</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                                    Kelola kuota penyimpanan IndexedDB browser, unduh berkas backup JSON, dan ekspor arsip ujian.
                                </p>
                            </div>
                            
                            {storageUsage && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                                        <span>Total Memori Browser Terpakai: {formatBytes(storageUsage.usage)}</span>
                                        <span>Alokasi Kuota: {formatBytes(storageUsage.quota)}</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-muted)] rounded-full h-2.5 overflow-hidden border border-[var(--border-secondary)]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                                            style={{ width: `${storagePercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {storageBreakdown && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-0.5">
                                        <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Data Naskah Ujian</p>
                                        <p className="text-sm font-extrabold text-[var(--text-primary)] font-mono">{formatBytes(storageBreakdown.examData)}</p>
                                    </div>
                                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-0.5">
                                        <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Cache PWA & Aset Offline</p>
                                        <p className="text-sm font-extrabold text-[var(--text-primary)] font-mono">{formatBytes(storageBreakdown.offlineCacheEstimate)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button 
                                    onClick={handleLocalBackup} 
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-[var(--radius-control)] text-xs sm:text-sm font-semibold transition-all shadow-xs"
                                >
                                    <BackupIcon />
                                    <span>Backup Seluruh Data (JSON)</span>
                                </button>
                                <button 
                                    onClick={handleRestoreClick} 
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-[var(--radius-control)] text-xs sm:text-sm font-semibold transition-all shadow-xs"
                                >
                                    <RestoreIcon />
                                    <span>Pulihkan Data dari Cadangan (Restore)</span>
                                </button>
                            </div>
                        </div>

                        {/* Exam Data Management Table Card */}
                        <div className="app-surface rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-primary)] shadow-xs">
                            <div className="p-4 border-b border-[var(--border-primary)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                        <HddIcon className="text-[var(--text-accent)]" />
                                        <span>Daftar Naskah Tersimpan ({filteredExamList.length})</span>
                                    </h3>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari judul / mapel..." 
                                        value={storageSearchTerm}
                                        onChange={(e) => setStorageSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                    />
                                </div>
                            </div>
                            
                            {selectedExamIds.size > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 px-4 flex flex-wrap justify-between items-center gap-2 border-b border-blue-200 dark:border-blue-800">
                                    <span className="text-xs text-blue-700 dark:text-blue-300 font-bold whitespace-nowrap">
                                        {selectedExamIds.size} naskah terpilih
                                    </span>
                                    <div className="flex gap-2 flex-nowrap">
                                        <button onClick={handleBulkBackup} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-[var(--radius-control)] flex items-center gap-1 font-semibold">
                                            <DownloadIcon className="text-xs"/> JSON
                                        </button>
                                        <button onClick={() => handleBulkExportFiles('docx')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-[var(--radius-control)] flex items-center gap-1 font-semibold">
                                            <WordIcon className="text-xs"/> Word
                                        </button>
                                        <button onClick={() => handleBulkExportFiles('html')} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-[var(--radius-control)] flex items-center gap-1 font-semibold">
                                            <FileCodeIcon className="text-xs"/> HTML
                                        </button>
                                        <button onClick={handleBulkDelete} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-[var(--radius-control)] flex items-center gap-1 font-semibold">
                                            <TrashIcon className="text-xs"/> Hapus
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-tertiary)] sticky top-0 border-b border-[var(--border-primary)]">
                                        <tr>
                                            <th className="p-3.5 w-4">
                                                <input type="checkbox" checked={filteredExamList.length > 0 && selectedExamIds.size === filteredExamList.length} onChange={toggleSelectAll} className="rounded border-[var(--border-secondary)] text-[var(--bg-accent)] focus:ring-[var(--bg-accent)] cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Judul Naskah</th>
                                            <th className="px-3 py-3">Mata Pelajaran</th>
                                            <th className="px-3 py-3 text-right">Ukuran</th>
                                            <th className="px-3 py-3 text-center">Aksi Cepat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-primary)]">
                                        {filteredExamList.length > 0 ? filteredExamList.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                <td className="p-3.5 w-4">
                                                    <input type="checkbox" checked={selectedExamIds.has(exam.id)} onChange={() => toggleSelection(exam.id)} className="rounded border-[var(--border-secondary)] text-[var(--bg-accent)] focus:ring-[var(--bg-accent)] cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{exam.title}</td>
                                                <td className="px-3 py-3 text-[var(--text-secondary)]">{exam.subject}</td>
                                                <td className="px-3 py-3 text-right text-[var(--text-muted)] font-mono text-[11px]">{formatBytes(exam.size, 0)}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex justify-center items-center gap-1">
                                                        <button onClick={() => handleExportExam(exam, 'json')} className="p-1 rounded-[var(--radius-control)] hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 transition-colors" title="Backup (JSON)">
                                                            <DownloadIcon className="text-xs"/>
                                                        </button>
                                                        <button onClick={() => handleExportExam(exam, 'docx')} className="p-1 rounded-[var(--radius-control)] hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 transition-colors" title="Ekspor Word .docx">
                                                            <WordIcon className="text-xs"/>
                                                        </button>
                                                        <button onClick={() => handleExportExam(exam, 'html')} className="p-1 rounded-[var(--radius-control)] hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors" title="Ekspor HTML Mandiri">
                                                            <FileCodeIcon className="text-xs"/>
                                                        </button>
                                                        <button onClick={() => handleDeleteExam(exam.id, exam.title)} className="p-1 rounded-[var(--radius-control)] hover:bg-red-50 text-red-500 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors" title="Hapus Permanen">
                                                            <TrashIcon className="text-xs"/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                                                    Tidak ada data naskah yang ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
