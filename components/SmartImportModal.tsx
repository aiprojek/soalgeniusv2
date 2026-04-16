import React, { useState, useEffect } from 'react';
import { Question, QuestionType } from '../types';
import { detectTextDirection, parseRawText } from '../lib/smartImport.ts';
import { sanitizeRichHtml } from '../lib/utils';
import { LightningIcon, CloseIcon, CheckIcon, InfoIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: Question[]) => void;
}

const toArabicNumeral = (value: number): string => {
    const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(value).replace(/\d/g, digit => digits[Number(digit)]);
};

const toArabicOptionLabel = (index: number): string => {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز'];
    return letters[index] || String.fromCharCode(65 + index);
};

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [rawText, setRawText] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const { addToast } = useToast();
    const detectedDirection = detectTextDirection(rawText);

    // Auto-parse when text changes (debounced slightly via effect logic)
    useEffect(() => {
        if (rawText.trim()) {
            const timer = setTimeout(() => {
                try {
                    const results = parseRawText(rawText);
                    setParsedQuestions(results);
                } catch (error) {
                    console.error('Smart import parsing failed:', error);
                    setParsedQuestions([]);
                    addToast('Gagal membaca format teks yang ditempel.', 'error');
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setParsedQuestions([]);
        }
    }, [rawText, addToast]);

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
            <div className="app-modal-panel w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="app-modal-header flex justify-between items-center p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-[var(--radius-control)] text-yellow-600">
                            <LightningIcon className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Smart Import</h2>
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
                    <div className="w-full md:w-1/2 p-3.5 sm:p-4 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border-primary)]">
                        <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs p-2.5 rounded-[var(--radius-control)] border border-blue-200 dark:border-blue-800 flex gap-2 items-start">
                            <InfoIcon className="text-sm mt-0.5 shrink-0" />
                            <p>
                                <strong>Catatan:</strong> Smart Import sekarang mencoba membaca teks <strong>Latin maupun Arab</strong>,
                                termasuk angka Arab dan opsi seperti <strong>أ. ب. ج. د.</strong>. Hasil terbaik tetap didapat jika nomor soal,
                                opsi, dan kunci jawaban ditulis konsisten per baris.
                            </p>
                        </div>

                        <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex justify-between">
                            <span>Area Tempel (Paste)</span>
                            <span className="text-xs font-normal text-[var(--text-muted)]">
                                Deteksi arah: {detectedDirection === 'rtl' ? 'RTL / Arab' : 'LTR / Latin'}
                            </span>
                        </label>
                        <textarea
                            dir={detectedDirection}
                            className="flex-grow w-full p-3 border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder={`Contoh Format:\n\n1. Siapa presiden pertama Indonesia?\nA. Soeharto\nB. Soekarno\nC. Habibie\nD. Gus Dur\nKunci: B\n\n١. من هو أول رئيس لإندونيسيا؟\nأ. سوهارتو\nب. سوكارنو\nج. حبيبي\nد. عبد الرحمن وحيد\nالإجابة: ب`}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-full md:w-1/2 p-3.5 sm:p-4 flex flex-col bg-[var(--bg-muted)]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Pratinjau Hasil ({parsedQuestions.length})</label>
                            {parsedQuestions.length > 0 && <span className="app-status-pill app-status-success !tracking-[0.08em]">Siap Impor</span>}
                        </div>
                        
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {parsedQuestions.length === 0 ? (
                                <div className="app-empty-state h-full text-[var(--text-muted)] opacity-70">
                                    <InfoIcon className="text-4xl mb-2" />
                                    <p>Hasil parsing akan muncul di sini.</p>
                                </div>
                            ) : (
                                parsedQuestions.map((q, idx) => {
                                    const previewDirection = detectTextDirection(`${q.text} ${(q.choices || []).map(choice => choice.text).join(' ')}`);
                                    const questionLabel = previewDirection === 'rtl' ? `${toArabicNumeral(idx + 1)}.` : `${idx + 1}.`;

                                    return (
                                    <div key={idx} className="app-surface p-2.5 rounded-[var(--radius-control)] text-sm shadow-sm" dir={previewDirection}>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-blue-600">{questionLabel}</span>
                                            <div className="flex-grow">
                                                <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(q.text) }} className="font-medium text-[var(--text-primary)] mb-2" />
                                                
                                                {q.type === QuestionType.MULTIPLE_CHOICE ? (
                                                    <div className="space-y-1 ml-1">
                                                        {q.choices?.map((opt, i) => {
                                                            const optionDirection = detectTextDirection(opt.text);
                                                            const optionLabel = previewDirection === 'rtl' ? toArabicOptionLabel(i) : String.fromCharCode(65 + i);
                                                            return (
                                                            <div key={i} className={`flex gap-2 ${q.answerKey === opt.id ? 'text-green-600 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                                                                <span>{optionLabel}.</span>
                                                                <span dir={optionDirection} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(opt.text) }} />
                                                                {q.answerKey === opt.id && <CheckIcon className="text-xs mt-1" />}
                                                            </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-[var(--text-muted)] italic border-t border-[var(--border-primary)] pt-1 mt-1">
                                                        Tipe: Esai / Uraian
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="app-modal-footer p-3.5 sm:p-4 flex justify-end gap-2.5">
                    <button onClick={onClose} className="px-4 py-2 rounded-[var(--radius-control)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                        Batal
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={parsedQuestions.length === 0}
                        className="px-4 py-2 rounded-[var(--radius-control)] text-sm font-semibold bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
