import React, { useState } from 'react';
import { Exam, Settings } from '../types';
import { 
    generateMoodleXML, 
    generateGIFTFormat, 
    generateAikenFormat, 
    generateQTI21XML, 
    generateQuizCSV, 
    generateGridAndKeyCSV 
} from '../lib/lmsGenerator';
import { useToast } from '../contexts/ToastContext';
import { 
    ServerIcon, FileCodeIcon, FileTextIcon, FileSpreadsheetIcon, 
    CloseIcon, DownloadIcon, CheckIcon, ShieldCheckIcon
} from './Icons';

interface LmsExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: Exam;
    settings?: Settings;
    onValidateFirst?: () => void;
    showDonationPrompt?: () => void;
}

export type LMSFormatType = 'moodle_xml' | 'gift' | 'aiken' | 'qti21' | 'quiz_csv' | 'grid_csv';

export const LmsExportModal: React.FC<LmsExportModalProps> = ({
    isOpen,
    onClose,
    exam,
    settings,
    onValidateFirst,
    showDonationPrompt
}) => {
    const [selectedFormat, setSelectedFormat] = useState<LMSFormatType>('moodle_xml');
    const [isExporting, setIsExporting] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const sanitize = (str: string) => (str || '')
        .trim()
        .replace(/[\/\\:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');

    const getExportBaseFileName = () => {
        const parts: string[] = [];
        if (exam.title) parts.push(sanitize(exam.title));
        if (exam.subject) parts.push(sanitize(exam.subject));
        if (exam.class) parts.push(sanitize(exam.class));

        return parts.length > 0 ? parts.join('_') : 'naskah_ujian';
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExecuteExport = () => {
        setIsExporting(true);
        const baseName = getExportBaseFileName();

        try {
            switch (selectedFormat) {
                case 'moodle_xml': {
                    const xml = generateMoodleXML(exam, settings);
                    downloadFile(xml, `${baseName}_moodle.xml`, 'application/xml');
                    addToast('File Moodle XML kuis berhasil diunduh.', 'success');
                    break;
                }
                case 'gift': {
                    const gift = generateGIFTFormat(exam);
                    downloadFile(gift, `${baseName}_gift.gift`, 'text/plain;charset=utf-8');
                    addToast('File GIFT format berhasil diunduh.', 'success');
                    break;
                }
                case 'aiken': {
                    const aiken = generateAikenFormat(exam);
                    downloadFile(aiken, `${baseName}_aiken.txt`, 'text/plain;charset=utf-8');
                    addToast('File Aiken format (Pilihan Ganda) berhasil diunduh.', 'success');
                    break;
                }
                case 'qti21': {
                    const qti = generateQTI21XML(exam);
                    downloadFile(qti, `${baseName}_canvas_qti.xml`, 'application/xml');
                    addToast('File QTI 2.1 (Canvas/Blackboard) berhasil diunduh.', 'success');
                    break;
                }
                case 'quiz_csv': {
                    const csv = generateQuizCSV(exam);
                    downloadFile(csv, `${baseName}_quizizz_googleforms.csv`, 'text/csv;charset=utf-8');
                    addToast('Format Spreadsheet Quizizz / Google Forms berhasil diunduh.', 'success');
                    break;
                }
                case 'grid_csv': {
                    const csv = generateGridAndKeyCSV(exam);
                    downloadFile(csv, `${baseName}_kisi_kisi_dan_kunci.csv`, 'text/csv;charset=utf-8');
                    addToast('Rekap Kisi-Kisi & Kunci Jawaban Excel berhasil diunduh.', 'success');
                    break;
                }
            }

            if (showDonationPrompt) {
                showDonationPrompt();
            }
            onClose();
        } catch (err) {
            console.error('Export error', err);
            addToast('Terjadi kesalahan saat membuat file ekspor.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const formatOptions: {
        id: LMSFormatType;
        title: string;
        description: string;
        badge: string;
        icon: React.ComponentType<{ className?: string }>;
        iconColor: string;
    }[] = [
        {
            id: 'moodle_xml',
            title: 'Moodle XML Quiz (.xml)',
            description: 'Format kuis Moodle paling lengkap: mendukung semua jenis soal, tabel Cloze, KaTeX/MathJax, dan bahasa Arab.',
            badge: 'Standar Moodle',
            icon: ServerIcon,
            iconColor: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50',
        },
        {
            id: 'gift',
            title: 'GIFT Format (.gift / .txt)',
            description: 'Format teks Moodle & Canvas yang ringkas dan mudah diedit secara manual di text editor.',
            badge: 'Moodle & Canvas',
            icon: FileCodeIcon,
            iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
        },
        {
            id: 'qti21',
            title: 'Canvas & Blackboard QTI 2.1 (.xml)',
            description: 'Standar IMS QTI internasional untuk impor kuis langsung ke Canvas LMS, Blackboard, atau Schoology.',
            badge: 'IMS Standard',
            icon: FileCodeIcon,
            iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50',
        },
        {
            id: 'aiken',
            title: 'Aiken Format (.txt)',
            description: 'Format sederhana berbasis teks baris demi baris untuk bank soal pilihan ganda standar.',
            badge: 'Teks Simpel',
            icon: FileTextIcon,
            iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
        },
        {
            id: 'quiz_csv',
            title: 'Google Forms & Quizizz CSV (.csv)',
            description: 'Tabel terstruktur kolom (pertanyaan, opsi 1-5, kunci) untuk impor bank soal cepat ke Quizizz / spreadsheet.',
            badge: 'Quizizz / GForms',
            icon: FileSpreadsheetIcon,
            iconColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50',
        },
        {
            id: 'grid_csv',
            title: 'Rekap Kisi-Kisi & Kunci Jawaban (.csv)',
            description: 'Lembar kerja Excel (UTF-8 BOM) berisi daftar butir soal, indikator bagian, tipe, dan pedoman penskoran/kunci.',
            badge: 'Arsip Kurikulum',
            icon: FileSpreadsheetIcon,
            iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[var(--bg-secondary)] w-full max-w-2xl max-h-[92vh] rounded-[24px] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
                            <ServerIcon />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Ekspor Bank Soal & LMS</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Pilih format target pembelajaran online atau spreadsheet</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Tutup"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Options List */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-grow" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                    {formatOptions.map((opt) => {
                        const isSelected = selectedFormat === opt.id;
                        return (
                            <label
                                key={opt.id}
                                onClick={() => setSelectedFormat(opt.id)}
                                className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 shadow-sm'
                                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-lg ${opt.iconColor}`}>
                                    <opt.icon />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-[var(--text-primary)]">{opt.title}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] flex-shrink-0">
                                            {opt.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{opt.description}</p>
                                </div>
                                <div className="pt-0.5">
                                    <input 
                                        type="radio" 
                                        name="lmsFormat" 
                                        checked={isSelected} 
                                        onChange={() => setSelectedFormat(opt.id)} 
                                        className="form-radio text-blue-600 focus:ring-blue-500 mt-1"
                                    />
                                </div>
                            </label>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex flex-wrap items-center justify-between gap-3">
                    {onValidateFirst ? (
                        <button
                            onClick={onValidateFirst}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            <ShieldCheckIcon />
                            <span>Cek Validasi Naskah</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleExecuteExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
                        >
                            {isExporting ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                                <DownloadIcon />
                            )}
                            <span>Unduh File</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LmsExportModal;
