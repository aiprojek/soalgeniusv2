import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getBankQuestions, deleteQuestionFromBank } from '../lib/storage';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import type { BankQuestion, Question } from '../types';
import { TrashIcon, PlusIcon } from '../components/Icons';

interface QuestionBankViewProps {
  isModalMode?: boolean;
  onAddQuestions?: (questions: Question[]) => void;
  onClose?: () => void;
}

const QuestionPreview: React.FC<{ question: Question }> = ({ question }) => {
    return <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: question.text }} />;
};

const QuestionBankView: React.FC<QuestionBankViewProps> = ({ isModalMode = false, onAddQuestions, onClose }) => {
    const [bank, setBank] = useState<BankQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const { showConfirm } = useModal();
    const { addToast } = useToast();

    const loadBank = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBankQuestions();
            setBank(data);
        } catch (error) {
            console.error("Gagal memuat bank soal:", error);
            addToast("Gagal memuat bank soal.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadBank();
    }, [loadBank]);

    const handleDelete = (bankId: string) => {
        showConfirm({
            title: 'Hapus Soal dari Bank',
            content: 'Apakah Anda yakin ingin menghapus soal ini dari bank soal? Tindakan ini tidak dapat dibatalkan.',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                try {
                    await deleteQuestionFromBank(bankId);
                    addToast('Soal berhasil dihapus dari bank.', 'success');
                    loadBank(); // Muat ulang
                } catch (error) {
                    addToast('Gagal menghapus soal dari bank.', 'error');
                }
            }
        });
    };

    const handleSelectQuestion = (bankId: string) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            newSet.has(bankId) ? newSet.delete(bankId) : newSet.add(bankId);
            return newSet;
        });
    };

    const handleAddSelected = () => {
        const selectedQuestions = bank
            .filter(bq => selectedQuestionIds.has(bq.bankId))
            .map(bq => bq.question);
        onAddQuestions?.(selectedQuestions);
    };

    const { uniqueSubjects, uniqueClasses } = useMemo(() => {
        const subjects = new Set<string>();
        const classes = new Set<string>();
        bank.forEach(bq => {
            if (bq.subject) subjects.add(bq.subject);
            if (bq.class) classes.add(bq.class);
        });
        return { 
            uniqueSubjects: Array.from(subjects).sort(),
            uniqueClasses: Array.from(classes).sort()
        };
    }, [bank]);

    const filteredBank = useMemo(() => {
        return bank.filter(bq => {
            const searchMatch = !searchTerm || bq.question.text.toLowerCase().includes(searchTerm.toLowerCase());
            const subjectMatch = !subjectFilter || bq.subject === subjectFilter;
            const classMatch = !classFilter || bq.class === classFilter;
            return searchMatch && subjectMatch && classMatch;
        });
    }, [bank, searchTerm, subjectFilter, classFilter]);

    const containerPadding = isModalMode ? 'p-4' : 'p-0';
    
    return (
        <div className={`flex flex-col h-full ${containerPadding}`}>
             {!isModalMode && (
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Bank Soal</h2>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input type="text" placeholder="Cari teks soal..." aria-label="Cari teks soal" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]" />
                <select aria-label="Filter berdasarkan mata pelajaran" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                    <option value="">Semua Mata Pelajaran</option>
                    {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select aria-label="Filter berdasarkan kelas" value={classFilter} onChange={e => setClassFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                    <option value="">Semua Kelas</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4">
                {isLoading ? (
                    <div className="text-center py-16 text-[var(--text-secondary)]">Memuat bank soal...</div>
                ) : filteredBank.length > 0 ? (
                    filteredBank.map(bq => (
                        <div key={bq.bankId} className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-md border border-[var(--border-primary)] flex gap-4">
                            {isModalMode && (
                                <div className="flex-shrink-0 flex items-center justify-center">
                                    <input type="checkbox" aria-label={`Pilih soal: ${bq.question.text.substring(0, 50)}`} className="h-5 w-5 rounded text-blue-600 bg-transparent border-[var(--border-secondary)] focus:ring-blue-500" checked={selectedQuestionIds.has(bq.bankId)} onChange={() => handleSelectQuestion(bq.bankId)} />
                                </div>
                            )}
                            <div className="flex-grow">
                                <QuestionPreview question={bq.question} />
                                <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex justify-between items-center text-xs text-[var(--text-secondary)]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 rounded-full font-semibold">{bq.question.type}</span>
                                        <span className="font-bold text-[var(--text-primary)]">{bq.subject}</span>
                                        <span>/</span>
                                        <span>{bq.class}</span>
                                    </div>
                                    {!isModalMode && (
                                        <button onClick={() => handleDelete(bq.bankId)} aria-label="Hapus soal dari bank" className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                     <div className="text-center py-16 px-6 bg-[var(--bg-tertiary)] rounded-lg">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">Bank Soal Kosong</h3>
                        <p className="text-[var(--text-secondary)] mt-2">Simpan soal dari editor untuk menambahkannya ke sini.</p>
                    </div>
                )}
            </div>

            {isModalMode && (
                <div className="flex-shrink-0 pt-4 border-t border-[var(--border-primary)] flex justify-end items-center space-x-3">
                    <span className="text-sm text-[var(--text-secondary)] font-semibold">{selectedQuestionIds.size} soal terpilih</span>
                    <button onClick={onClose} className="bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg">Batal</button>
                    <button onClick={handleAddSelected} disabled={selectedQuestionIds.size === 0} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                       <PlusIcon/>
                       <span className="hidden sm:inline">Tambah Soal Terpilih</span>
                       <span className="sm:hidden">Tambah</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuestionBankView;