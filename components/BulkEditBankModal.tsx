import React, { useState } from 'react';
import type { BankQuestion } from '../types';
import { CloseIcon, EditIcon, CheckIcon, TagIcon } from './Icons';

export interface BulkEditBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedQuestions: BankQuestion[];
    onConfirmBulkEdit: (updates: {
        subject?: string;
        class?: string;
        tags?: string[];
        appendTags?: boolean;
    }) => Promise<void>;
}

const PRESET_SUBJECTS = [
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila / PPKn',
    'Informatika',
    'PJOK / Penjasorkes',
    'Seni Budaya',
    'Prakarya'
];

const PRESET_CLASSES = [
    'Kelas VII (SMP/MTs)',
    'Kelas VIII (SMP/MTs)',
    'Kelas IX (SMP/MTs)',
    'Kelas X (SMA/MA/SMK)',
    'Kelas XI (SMA/MA/SMK)',
    'Kelas XII (SMA/MA/SMK)',
    'Kelas IV (SD/MI)',
    'Kelas V (SD/MI)',
    'Kelas VI (SD/MI)',
    'Fase D (SMP/MTs)',
    'Fase E (SMA/SMK Kelas 10)',
    'Fase F (SMA/SMK Kelas 11-12)'
];

const SUGGESTED_TAGS = [
    'HOTS',
    'Sumatif Akhir Semester',
    'Sumatif Tengah Semester',
    'Asesmen Formatif',
    'Bab 1',
    'Bab 2',
    'Literasi',
    'Numerasi'
];

export const BulkEditBankModal: React.FC<BulkEditBankModalProps> = ({
    isOpen,
    onClose,
    selectedQuestions,
    onConfirmBulkEdit
}) => {
    // Checkbox toggles for selective updates
    const [updateSubject, setUpdateSubject] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(PRESET_SUBJECTS[0]);
    const [customSubject, setCustomSubject] = useState('');
    const [isCustomSubject, setIsCustomSubject] = useState(false);

    const [updateClass, setUpdateClass] = useState(false);
    const [selectedClass, setSelectedClass] = useState(PRESET_CLASSES[0]);
    const [customClass, setCustomClass] = useState('');
    const [isCustomClass, setIsCustomClass] = useState(false);

    const [updateTags, setUpdateTags] = useState(false);
    const [tagsInput, setTagsInput] = useState('');
    const [tagMode, setTagMode] = useState<'append' | 'replace'>('append');

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleToggleTagChip = (tag: string) => {
        const currentList = tagsInput
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        
        let newList: string[];
        if (currentList.includes(tag)) {
            newList = currentList.filter(t => t !== tag);
        } else {
            newList = [...currentList, tag];
        }
        setTagsInput(newList.join(', '));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!updateSubject && !updateClass && !updateTags) return;

        setIsSubmitting(true);
        try {
            const updates: {
                subject?: string;
                class?: string;
                tags?: string[];
                appendTags?: boolean;
            } = {};

            if (updateSubject) {
                updates.subject = isCustomSubject ? customSubject.trim() || 'Umum' : selectedSubject;
            }

            if (updateClass) {
                updates.class = isCustomClass ? customClass.trim() || 'Semua Kelas' : selectedClass;
            }

            if (updateTags) {
                const tags = tagsInput
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean);
                updates.tags = tags;
                updates.appendTags = tagMode === 'append';
            }

            await onConfirmBulkEdit(updates);
            onClose();
        } catch (error) {
            console.error('Gagal menerapkan bulk edit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const anySelected = updateSubject || updateClass || updateTags;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="app-surface w-full max-w-xl max-h-[90vh] rounded-[var(--radius-card)] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-edit-title"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-accent)] text-[var(--text-on-accent)] flex items-center justify-center shadow-xs">
                            <EditIcon className="text-sm" />
                        </div>
                        <div>
                            <h3 id="bulk-edit-title" className="text-base font-extrabold text-[var(--text-primary)]">
                                Edit Massal Bank Soal
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Memperbarui metadata untuk <strong className="text-[var(--text-accent)]">{selectedQuestions.length}</strong> butir soal terpilih.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-control)] transition-colors"
                        aria-label="Tutup Dialog"
                    >
                        <CloseIcon className="text-sm" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
                        <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                            💡 Centang hanya atribut yang ingin diubah. Atribut yang tidak dicentang tidak akan diubah dan tetap mempertahankan nilai aslinya.
                        </div>

                        {/* Opsi 1: Mata Pelajaran */}
                        <div className={`p-3.5 rounded-[var(--radius-card)] border transition-all ${updateSubject ? 'border-[var(--bg-accent)] bg-[var(--bg-secondary)]' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] opacity-85'}`}>
                            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-[var(--text-primary)]">
                                <input
                                    type="checkbox"
                                    checked={updateSubject}
                                    onChange={e => setUpdateSubject(e.target.checked)}
                                    className="w-4 h-4 rounded text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                />
                                <span>Perbarui Mata Pelajaran</span>
                            </label>

                            {updateSubject && (
                                <div className="mt-3 pl-6 space-y-2.5 animate-fade-in">
                                    <div className="flex gap-2">
                                        <select
                                            disabled={isCustomSubject}
                                            value={selectedSubject}
                                            onChange={e => setSelectedSubject(e.target.value)}
                                            className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                        >
                                            {PRESET_SUBJECTS.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomSubject(!isCustomSubject)}
                                            className={`px-2.5 py-1 text-xs rounded-[var(--radius-control)] border whitespace-nowrap font-medium transition-colors ${isCustomSubject ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] border-[var(--bg-accent)]' : 'border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
                                        >
                                            {isCustomSubject ? 'Pilih Daftar' : 'Tulis Bebas'}
                                        </button>
                                    </div>

                                    {isCustomSubject && (
                                        <input
                                            type="text"
                                            value={customSubject}
                                            onChange={e => setCustomSubject(e.target.value)}
                                            placeholder="Ketik nama mata pelajaran kustom..."
                                            className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Opsi 2: Kelas / Jenjang */}
                        <div className={`p-3.5 rounded-[var(--radius-card)] border transition-all ${updateClass ? 'border-[var(--bg-accent)] bg-[var(--bg-secondary)]' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] opacity-85'}`}>
                            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-[var(--text-primary)]">
                                <input
                                    type="checkbox"
                                    checked={updateClass}
                                    onChange={e => setUpdateClass(e.target.checked)}
                                    className="w-4 h-4 rounded text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                />
                                <span>Perbarui Jenjang / Kelas</span>
                            </label>

                            {updateClass && (
                                <div className="mt-3 pl-6 space-y-2.5 animate-fade-in">
                                    <div className="flex gap-2">
                                        <select
                                            disabled={isCustomClass}
                                            value={selectedClass}
                                            onChange={e => setSelectedClass(e.target.value)}
                                            className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                        >
                                            {PRESET_CLASSES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomClass(!isCustomClass)}
                                            className={`px-2.5 py-1 text-xs rounded-[var(--radius-control)] border whitespace-nowrap font-medium transition-colors ${isCustomClass ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] border-[var(--bg-accent)]' : 'border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
                                        >
                                            {isCustomClass ? 'Pilih Daftar' : 'Tulis Bebas'}
                                        </button>
                                    </div>

                                    {isCustomClass && (
                                        <input
                                            type="text"
                                            value={customClass}
                                            onChange={e => setCustomClass(e.target.value)}
                                            placeholder="Ketik jenjang/kelas kustom..."
                                            className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Opsi 3: Label / Tag */}
                        <div className={`p-3.5 rounded-[var(--radius-card)] border transition-all ${updateTags ? 'border-[var(--bg-accent)] bg-[var(--bg-secondary)]' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] opacity-85'}`}>
                            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-[var(--text-primary)]">
                                <input
                                    type="checkbox"
                                    checked={updateTags}
                                    onChange={e => setUpdateTags(e.target.checked)}
                                    className="w-4 h-4 rounded text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                />
                                <span>Perbarui Label / Tag Materi</span>
                            </label>

                            {updateTags && (
                                <div className="mt-3 pl-6 space-y-2.5 animate-fade-in">
                                    <div className="flex items-center gap-3 text-xs">
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                            <input
                                                type="radio"
                                                name="tagMode"
                                                checked={tagMode === 'append'}
                                                onChange={() => setTagMode('append')}
                                                className="text-[var(--bg-accent)]"
                                            />
                                            <span>Tambahkan ke tag yang ada</span>
                                        </label>
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                            <input
                                                type="radio"
                                                name="tagMode"
                                                checked={tagMode === 'replace'}
                                                onChange={() => setTagMode('replace')}
                                                className="text-[var(--bg-accent)]"
                                            />
                                            <span>Ganti semua tag</span>
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        value={tagsInput}
                                        onChange={e => setTagsInput(e.target.value)}
                                        placeholder="Contoh: HOTS, Sumatif Akhir Semester, Bab 1 (pisahkan dengan koma)"
                                        className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                    />

                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[10px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                                            <TagIcon className="text-[10px]" /> Rekomendasi:
                                        </span>
                                        {SUGGESTED_TAGS.map(t => (
                                            <button
                                                type="button"
                                                key={t}
                                                onClick={() => handleToggleTagChip(t)}
                                                className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:border-[var(--bg-accent)] hover:text-[var(--text-accent)] text-[var(--text-secondary)] transition-colors"
                                            >
                                                + {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                            {anySelected ? 'Siap diperbarui' : 'Pilih minimal satu atribut di atas'}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-control)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={!anySelected || isSubmitting}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                            >
                                <CheckIcon className="text-xs" />
                                <span>{isSubmitting ? 'Menyimpan...' : `Terapkan ke ${selectedQuestions.length} Soal`}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
