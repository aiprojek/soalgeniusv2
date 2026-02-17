import React, { useState, useEffect } from 'react';
import { Question, QuestionType } from '../types';
import { parseRawText } from '../lib/smartImport.ts';
import { LightningIcon, CloseIcon, CheckIcon, InfoIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: Question[]) => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [rawText, setRawText] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const { addToast } = useToast();

    // Auto-parse when text changes (debounced slightly via effect logic)
    useEffect(() => {
        if (rawText.trim()) {
            const timer = setTimeout(() => {
                const results = parseRawText(rawText);
                setParsedQuestions(results);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setParsedQuestions([]);
        }
    }, [rawText]);

    const handleImport = () => {
        if (parsedQuestions.length === 0) {
            addToast('Tidak ada soal yang terdeteksi untuk diimpor.', 'error');
            return;
        }
        onImport(parsedQuestions);
        addToast(`Berhasil mengimpor ${parsedQuestions.length} soal.`, 'success');
        onClose();
        setRawText('');
        setParsedQuestions([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-secondary)] w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col border border-[var(--border-primary)] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                            <LightningIcon className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Smart Import</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Tempel teks soal dari Word/PDF, kami akan memformatnya otomatis.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-secondary)]">
                        <CloseIcon />
                    </button>
                </div>

                {/* Content - Split View */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Input */}
                    <div className="w-full md:w-1/2 p-4 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-primary)]">
                        <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex gap-2 items-start">
                            <InfoIcon className="text-sm mt-0.5 shrink-0" />
                            <p>
                                <strong>Catatan:</strong> Fitur ini saat ini dioptimalkan untuk <strong>Huruf Latin</strong>. 
                                Pengenalan karakter non-Latin (seperti Arab/Jawi) mungkin belum akurat karena keterbatasan deteksi format otomatis.
                            </p>
                        </div>

                        <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex justify-between">
                            <span>Area Tempel (Paste)</span>
                            <span className="text-xs font-normal text-[var(--text-muted)]">Format: 1. Soal... A. Opsi...</span>
                        </label>
                        <textarea
                            className="flex-grow w-full p-4 border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-primary)] font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder={`Contoh Format:\n\n1. Siapa presiden pertama Indonesia?\nA. Soeharto\nB. Soekarno\nC. Habibie\nD. Gus Dur\nKunci: B\n\n2. Jelaskan pengertian demokrasi!\n(Otomatis terdeteksi sebagai Esai)`}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-full md:w-1/2 p-4 flex flex-col bg-[var(--bg-muted)]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Pratinjau Hasil ({parsedQuestions.length})</label>
                            {parsedQuestions.length > 0 && <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Siap Impor</span>}
                        </div>
                        
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {parsedQuestions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-center p-8 opacity-60">
                                    <InfoIcon className="text-4xl mb-2" />
                                    <p>Hasil parsing akan muncul di sini.</p>
                                </div>
                            ) : (
                                parsedQuestions.map((q, idx) => (
                                    <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-secondary)] text-sm shadow-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-blue-600">{idx + 1}.</span>
                                            <div className="flex-grow">
                                                <div dangerouslySetInnerHTML={{ __html: q.text }} className="font-medium text-[var(--text-primary)] mb-2" />
                                                
                                                {q.type === QuestionType.MULTIPLE_CHOICE ? (
                                                    <div className="space-y-1 ml-1">
                                                        {q.choices?.map((opt, i) => (
                                                            <div key={i} className={`flex gap-2 ${q.answerKey === opt.id ? 'text-green-600 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                                                                <span>{String.fromCharCode(65 + i)}.</span>
                                                                <span>{opt.text}</span>
                                                                {q.answerKey === opt.id && <CheckIcon className="text-xs mt-1" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-[var(--text-muted)] italic border-t border-[var(--border-primary)] pt-1 mt-1">
                                                        Tipe: Esai / Uraian
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                        Batal
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={parsedQuestions.length === 0}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:-translate-y-0.5"
                    >
                        <LightningIcon />
                        Impor {parsedQuestions.length > 0 ? `${parsedQuestions.length} Soal` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartImportModal;