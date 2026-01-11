import React, { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import { getSettings, saveSettings } from '../lib/storage';
import { getDropboxAppKey, getDropboxToken, saveDropboxAppKey, getDropboxAuthUrl, clearDropboxToken, uploadToDropbox, downloadFromDropbox } from '../lib/dropbox';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    PlusIcon, TrashIcon, DropboxIcon, CloudUploadIcon, CloudDownloadIcon, 
    CheckIcon, CloudCheckIcon, SettingsIcon, CardTextIcon, PrinterIcon 
} from '../components/Icons';

type SettingsTab = 'general' | 'header' | 'format' | 'cloud';

const SettingsView = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dropboxAppKey, setDropboxAppKey] = useState('');
    const [isDropboxConnected, setIsDropboxConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    
    const { addToast } = useToast();
    const { showConfirm } = useModal();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getSettings();
            setSettings(data);
            
            // Load Dropbox state
            const key = getDropboxAppKey();
            const token = getDropboxToken();
            if (key) setDropboxAppKey(key);
            setIsDropboxConnected(!!token);
        };
        loadSettings();
    }, []);

    const handleSave = useCallback(async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await saveSettings(settings);
            addToast('Pengaturan berhasil disimpan.', 'success');
        } catch (error) {
            addToast('Gagal menyimpan pengaturan.', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [settings, addToast]);
    
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
        updateSettings(s => ({...s, margins: {...s.margins, [name]: Number(value) }}));
    };
    
    // --- Dropbox Handlers ---
    
    const handleConnectDropbox = () => {
        if (!dropboxAppKey.trim()) {
            addToast('Masukkan App Key terlebih dahulu.', 'error');
            return;
        }
        saveDropboxAppKey(dropboxAppKey);
        // Redirect user to Dropbox Auth
        window.location.href = getDropboxAuthUrl(dropboxAppKey);
    };

    const handleDisconnectDropbox = () => {
        clearDropboxToken();
        setIsDropboxConnected(false);
        addToast('Akun Dropbox diputuskan.', 'info');
    };

    const handleUploadToCloud = async () => {
        showConfirm({
            title: "Upload ke Dropbox",
            content: "Ini akan menimpa file backup 'soalgenius_backup.json' yang ada di Dropbox Anda dengan data saat ini. Lanjutkan?",
            confirmLabel: "Upload",
            onConfirm: async () => {
                setIsSyncing(true);
                try {
                    await uploadToDropbox();
                    addToast('Berhasil upload data ke Dropbox.', 'success');
                } catch (error: any) {
                    if (error.message.includes('kadaluarsa')) setIsDropboxConnected(false);
                    addToast(error.message, 'error');
                } finally {
                    setIsSyncing(false);
                }
            }
        });
    };

    const handleDownloadFromCloud = async () => {
        showConfirm({
            title: "Download dari Dropbox",
            content: "PERINGATAN: Semua data di perangkat ini akan DITIMPA dengan data dari Dropbox. Tindakan ini tidak dapat dibatalkan.",
            confirmVariant: 'danger',
            confirmLabel: "Download & Timpa",
            onConfirm: async () => {
                setIsSyncing(true);
                try {
                    await downloadFromDropbox();
                    addToast('Data berhasil dipulihkan dari Dropbox. Memuat ulang...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error: any) {
                    if (error.message.includes('kadaluarsa')) setIsDropboxConnected(false);
                    addToast(error.message, 'error');
                    setIsSyncing(false);
                }
            }
        });
    };

    if (!settings) {
        return <div className="text-center py-16">Memuat pengaturan...</div>;
    }

    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'Umum', icon: SettingsIcon },
        { id: 'header', label: 'Kop Surat', icon: CardTextIcon },
        { id: 'format', label: 'Format Kertas', icon: PrinterIcon },
        { id: 'cloud', label: 'Cloud Sync', icon: DropboxIcon },
    ];

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
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

                {/* Cloud Sync Tab */}
                {activeTab === 'cloud' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-primary)] pb-2">
                            <DropboxIcon className="text-2xl text-blue-600" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Sinkronisasi Cloud (Dropbox)</h3>
                        </div>
                        
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Simpan dan sinkronkan data antar perangkat menggunakan akun Dropbox Anda. Kami menggunakan metode "App Key" untuk privasi maksimal.
                        </p>

                        {!isDropboxConnected ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Dropbox App Key</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={dropboxAppKey} 
                                            onChange={(e) => setDropboxAppKey(e.target.value)} 
                                            placeholder="Masukkan App Key Anda" 
                                            className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" 
                                        />
                                        <button 
                                            onClick={handleConnectDropbox} 
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Hubungkan
                                        </button>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                                        Belum punya App Key? <a href="https://www.dropbox.com/developers/apps/create" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Buat di sini</a>. Pilih "Scoped Access", "Full Dropbox" atau "App Folder", lalu copy App Key. <br/>
                                        Pastikan "Redirect URI" diatur ke: <code className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded border border-[var(--border-secondary)] select-all font-mono text-[var(--text-primary)]">{window.location.origin + window.location.pathname}</code>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                                        <CloudCheckIcon />
                                        <span>Terhubung ke Dropbox</span>
                                    </div>
                                    <button onClick={handleDisconnectDropbox} className="text-xs text-red-500 hover:text-red-700 underline">Putuskan</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={handleUploadToCloud} 
                                        disabled={isSyncing}
                                        className="flex flex-col items-center justify-center p-4 border border-[var(--border-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                                    >
                                        <CloudUploadIcon className="text-3xl text-[var(--text-accent)] mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-[var(--text-primary)]">Backup ke Cloud</span>
                                        <span className="text-xs text-[var(--text-muted)] text-center mt-1">Upload data saat ini ke Dropbox</span>
                                    </button>

                                    <button 
                                        onClick={handleDownloadFromCloud} 
                                        disabled={isSyncing}
                                        className="flex flex-col items-center justify-center p-4 border border-[var(--border-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                                    >
                                        <CloudDownloadIcon className="text-3xl text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-[var(--text-primary)]">Restore dari Cloud</span>
                                        <span className="text-xs text-[var(--text-muted)] text-center mt-1">Timpa data lokal dengan data Dropbox</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Header Tab */}
                {activeTab === 'header' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Kop Soal</h3>
                        <div className="space-y-3">
                            {settings.examHeaderLines.map((line) => (
                                <div key={line.id} className="flex items-center space-x-2">
                                    <input type="text" value={line.text} onChange={(e) => handleHeaderChange(line.id, e.target.value)} placeholder="Teks baris kop" className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" />
                                    <button onClick={() => removeHeaderLine(line.id)} aria-label={`Hapus baris kop: ${line.text}`} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors" disabled={settings.examHeaderLines.length <= 1}>
                                        <TrashIcon className="text-base" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addHeaderLine} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2">
                            <PlusIcon className="text-base" /> <span>Tambah Baris</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <h4 className="font-semibold text-[var(--text-secondary)] mb-2">Logo Kiri (Opsional)</h4>
                                {settings.logos[0] ? (
                                    <div className="flex items-center space-x-4">
                                        <img src={settings.logos[0]} alt="Logo Kiri" className="h-16 w-16 object-contain border border-[var(--border-primary)] p-1 rounded-md bg-[var(--bg-tertiary)]" />
                                        <button onClick={() => handleLogoRemove(0)} className="text-red-500 dark:text-red-400 text-sm font-semibold">Hapus</button>
                                    </div>
                                ) : (
                                    <input type="file" aria-label="Unggah logo kiri" accept="image/*" onChange={(e) => handleLogoUpload(e, 0)} className="text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-[var(--text-secondary)] mb-2">Logo Kanan (Opsional)</h4>
                                {settings.logos[1] ? (
                                    <div className="flex items-center space-x-4">
                                        <img src={settings.logos[1]} alt="Logo Kanan" className="h-16 w-16 object-contain border border-[var(--border-primary)] p-1 rounded-md bg-[var(--bg-tertiary)]" />
                                        <button onClick={() => handleLogoRemove(1)} className="text-red-500 dark:text-red-400 text-sm font-semibold">Hapus</button>
                                    </div>
                                ) : (
                                    <input type="file" aria-label="Unggah logo kanan" accept="image/*" onChange={(e) => handleLogoUpload(e, 1)} className="text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900" />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Format Tab */}
                {activeTab === 'format' && (
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md animate-fade-in">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Format Kertas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="paperSize" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Kertas</label>
                                <select id="paperSize" value={settings.paperSize} onChange={(e) => updateSettings(s => ({...s, paperSize: e.target.value as Settings['paperSize']}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]">
                                    <option value="A4">A4</option>
                                    <option value="F4">F4</option>
                                    <option value="Legal">Legal</option>
                                    <option value="Letter">Letter</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="fontSize" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Huruf Soal (pt)</label>
                                <input type="number" id="fontSize" name="fontSize" min="8" max="24" step="1" value={settings.fontSize} onChange={(e) => updateSettings(s => ({...s, fontSize: Number(e.target.value)}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                            </div>
                            <div>
                                <label htmlFor="fontFamily" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenis Huruf (Font)</label>
                                <select id="fontFamily" value={settings.fontFamily} onChange={(e) => updateSettings(s => ({...s, fontFamily: e.target.value as Settings['fontFamily']}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]">
                                    <option value="Liberation Serif">Liberation Serif</option>
                                    <option value="Liberation Sans">Liberation Sans</option>
                                    <option value="Amiri">Amiri (untuk Arab)</option>
                                    <option value="Areef Ruqaa">Areef Ruqaa (untuk Arab)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="lineSpacing" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jarak Antar Baris</label>
                                <input type="number" id="lineSpacing" name="lineSpacing" min="1" max="3" step="0.05" value={settings.lineSpacing} onChange={(e) => updateSettings(s => ({...s, lineSpacing: Number(e.target.value)}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Margin Kertas (mm)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label htmlFor="margin-top" className="block text-xs font-medium text-[var(--text-muted)] mb-1">Atas</label>
                                        <input id="margin-top" type="number" name="top" value={settings.margins.top} onChange={handleMarginChange} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                                    </div>
                                    <div>
                                        <label htmlFor="margin-right" className="block text-xs font-medium text-[var(--text-muted)] mb-1">Kanan</label>
                                        <input id="margin-right" type="number" name="right" value={settings.margins.right} onChange={handleMarginChange} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                                    </div>
                                    <div>
                                        <label htmlFor="margin-bottom" className="block text-xs font-medium text-[var(--text-muted)] mb-1">Bawah</label>
                                        <input id="margin-bottom" type="number" name="bottom" value={settings.margins.bottom} onChange={handleMarginChange} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                                    </div>
                                    <div>
                                        <label htmlFor="margin-left" className="block text-xs font-medium text-[var(--text-muted)] mb-1">Kiri</label>
                                        <input id="margin-left" type="number" name="left" value={settings.margins.left} onChange={handleMarginChange} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                                    </div>
                                </div>
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