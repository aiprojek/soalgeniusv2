import React, { useState, useCallback } from 'react';
import type { Settings } from '../types';
import { getSettings, saveSettings } from '../lib/storage';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, TrashIcon } from '../components/Icons';

const SettingsView = () => {
    const [settings, setSettings] = useState<Settings>(getSettings);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();
    const { theme, setTheme } = useTheme();

    const handleSave = useCallback(() => {
        setIsSaving(true);
        saveSettings(settings);
        setTimeout(() => {
            addToast('Pengaturan berhasil disimpan.', 'success');
            setIsSaving(false);
        }, 300);
    }, [settings, addToast]);

    const handleHeaderChange = (id: string, newText: string) => {
        setSettings(s => ({...s, examHeaderLines: s.examHeaderLines.map(line => line.id === id ? {...line, text: newText} : line)}));
    };
    const addHeaderLine = () => {
        setSettings(s => ({...s, examHeaderLines: [...s.examHeaderLines, {id: crypto.randomUUID(), text: ''}]}));
    };
    const removeHeaderLine = (id: string) => {
        setSettings(s => ({...s, examHeaderLines: s.examHeaderLines.filter(line => line.id !== id)}));
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
                setSettings(s => {
                    // FIX: Explicitly cast the spread array to a tuple to satisfy TypeScript's strict type checking for `logos`.
                    const newLogos = [...s.logos] as [string | null, string | null];
                    newLogos[index] = event.target?.result as string;
                    return { ...s, logos: newLogos };
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoRemove = (index: 0 | 1) => {
         setSettings(s => {
            // FIX: Explicitly cast the spread array to a tuple to satisfy TypeScript's strict type checking for `logos`.
            const newLogos = [...s.logos] as [string | null, string | null];
            newLogos[index] = null;
            return { ...s, logos: newLogos };
        });
    }

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(s => ({...s, margins: {...s.margins, [name]: Number(value) }}));
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Pengaturan</h2>
                <p className="text-[var(--text-secondary)]">Sesuaikan tampilan dan format kertas ujian Anda. Klik simpan untuk menerapkan perubahan.</p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Tampilan</h3>
                 <div className="flex items-center justify-between">
                    <label htmlFor="theme-toggle" className="text-sm font-medium text-[var(--text-secondary)]">Mode Gelap</label>
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

            <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Kop Soal</h3>
                <div className="space-y-3">
                    {settings.examHeaderLines.map((line) => (
                        <div key={line.id} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={line.text}
                                onChange={(e) => handleHeaderChange(line.id, e.target.value)}
                                placeholder="Teks baris kop"
                                className="flex-grow p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]"
                            />
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
                    {/* Left Logo */}
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
                    {/* Right Logo */}
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

            <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">Format Kertas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="paperSize" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Kertas</label>
                        <select id="paperSize" value={settings.paperSize} onChange={(e) => setSettings(s => ({...s, paperSize: e.target.value as Settings['paperSize']}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]">
                            <option value="A4">A4</option>
                            <option value="F4">F4</option>
                            <option value="Legal">Legal</option>
                            <option value="Letter">Letter</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="fontSize" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ukuran Huruf Soal (pt)</label>
                        <input type="number" id="fontSize" name="fontSize" min="8" max="24" step="1" value={settings.fontSize} onChange={(e) => setSettings(s => ({...s, fontSize: Number(e.target.value)}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
                    </div>
                    <div>
                        <label htmlFor="fontFamily" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenis Huruf (Font)</label>
                        <select id="fontFamily" value={settings.fontFamily} onChange={(e) => setSettings(s => ({...s, fontFamily: e.target.value as Settings['fontFamily']}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]">
                            <option value="Liberation Serif">Liberation Serif</option>
                            <option value="Liberation Sans">Liberation Sans</option>
                            <option value="Amiri">Amiri (untuk Arab)</option>
                            <option value="Areef Ruqaa">Areef Ruqaa (untuk Arab)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lineSpacing" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jarak Antar Baris</label>
                        <input type="number" id="lineSpacing" name="lineSpacing" min="1" max="3" step="0.05" value={settings.lineSpacing} onChange={(e) => setSettings(s => ({...s, lineSpacing: Number(e.target.value)}))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />
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
            <div className="mt-4 flex items-center justify-end space-x-4">
                <button onClick={handleSave} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow hover:shadow-lg disabled:opacity-70" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
