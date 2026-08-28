import React, { useState, useEffect, useMemo } from 'react';
import type { BankQuestion, Question, Exam, Section } from '../types';
import { QuestionType } from '../types';
import { toRoman, stripHtml } from '../lib/utils';
import { ltrTranslations } from '../lib/translations';
import { 
    CloseIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    CheckIcon, 
    TagIcon, 
    FileTextIcon,
    SparklesIcon,
    BookmarkPlusIcon
} from './Icons';

export interface CreateExamFromBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedQuestions: BankQuestion[];
    onConfirmCreate: (exam: Exam) => void;
}

interface DraftSectionItem {
    id: string;
    type: QuestionType;
    typeName: string;
    instructionBody: string;
    questions: Question[];
    isExpanded?: boolean;
}

const ORDER_PRIORITY: Record<QuestionType, number> = {
    [QuestionType.MULTIPLE_CHOICE]: 1,
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 2,
    [QuestionType.TRUE_FALSE]: 3,
    [QuestionType.MATCHING]: 4,
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 5,
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 6,
    [QuestionType.TABLE]: 7,
    [QuestionType.SHORT_ANSWER]: 8,
    [QuestionType.ESSAY]: 9,
    [QuestionType.STIMULUS]: 10,
};

const DEFAULT_INSTRUCTIONS: Record<QuestionType, string> = {
    [QuestionType.MULTIPLE_CHOICE]: 'Berilah tanda silang (X) pada pilihan jawaban yang paling tepat!',
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 'Pilihlah jawaban yang benar dengan memberi tanda centang (✓). Jawaban benar bisa lebih dari satu.',
    [QuestionType.TRUE_FALSE]: 'Tentukan apakah pernyataan-pernyataan berikut Benar atau Salah!',
    [QuestionType.MATCHING]: 'Jodohkanlah pernyataan di kolom A dengan jawaban yang sesuai di kolom B!',
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 'Lengkapilah tabel berikut dengan memilih jawaban yang paling tepat!',
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 'Lengkapilah tabel berikut. Jawaban benar bisa lebih dari satu untuk setiap baris.',
    [QuestionType.TABLE]: 'Lengkapilah sel-sel tabel isian berikut dengan jawaban yang tepat!',
    [QuestionType.SHORT_ANSWER]: 'Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat!',
    [QuestionType.ESSAY]: 'Jawablah pertanyaan-pertanyaan uraian di bawah ini dengan jelas dan lengkap!',
    [QuestionType.STIMULUS]: 'Bacalah teks wacana dan informasi stimulus berikut dengan saksama.',
};

export const CreateExamFromBankModal: React.FC<CreateExamFromBankModalProps> = ({
    isOpen,
    onClose,
    selectedQuestions,
    onConfirmCreate
}) => {
    const [examTitle, setExamTitle] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [className, setClassName] = useState<string>('');
    const [examTime, setExamTime] = useState<string>('90 Menit');
    const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [sections, setSections] = useState<DraftSectionItem[]>([]);

    // Inisialisasi dan pengelompokan pintar otomatis saat modal dibuka
    useEffect(() => {
        if (!isOpen || selectedQuestions.length === 0) return;

        // 1. Hitung frekuensi Subject & Class dominan
        const subjectMap: Record<string, number> = {};
        const classMap: Record<string, number> = {};

        selectedQuestions.forEach(bq => {
            if (bq.subject) {
                subjectMap[bq.subject] = (subjectMap[bq.subject] || 0) + 1;
            }
            if (bq.class) {
                classMap[bq.class] = (classMap[bq.class] || 0) + 1;
            }
        });

        const dominantSubject = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mata Pelajaran';
        const dominantClass = Object.entries(classMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Kelas VII';

        setSubject(dominantSubject);
        setClassName(dominantClass);
        setExamTitle(`Asesmen / Ujian ${dominantSubject} - ${dominantClass}`);
        setExamTime('90 Menit');
        setExamDate(new Date().toISOString().split('T')[0]);

        // 2. Kelompokkan soal per QuestionType
        const groupedMap = new Map<QuestionType, Question[]>();
        selectedQuestions.forEach(bq => {
            const q = bq.question;
            const currentList = groupedMap.get(q.type) || [];
            currentList.push(q);
            groupedMap.set(q.type, currentList);
        });

        // 3. Susun daftar draft sections sesuai urutan prioritas standar
        const sortedTypes = Array.from(groupedMap.keys()).sort((a, b) => {
            const prioA = ORDER_PRIORITY[a] ?? 99;
            const prioB = ORDER_PRIORITY[b] ?? 99;
            return prioA - prioB;
        });

        const draftList: DraftSectionItem[] = sortedTypes.map(type => {
            const qs = groupedMap.get(type) || [];
            const typeLabel = ltrTranslations.questionTypes[type] || type;
            const defaultBody = DEFAULT_INSTRUCTIONS[type] || 'Jawablah pertanyaan berikut!';

            return {
                id: crypto.randomUUID(),
                type,
                typeName: typeLabel,
                instructionBody: defaultBody,
                questions: qs,
                isExpanded: false
            };
        });

        setSections(draftList);
    }, [isOpen, selectedQuestions]);

    if (!isOpen) return null;

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;
        setSections(newSections);
    };

    const handleInstructionChange = (index: number, newBody: string) => {
        setSections(prev => {
            const next = [...prev];
            next[index] = { ...next[index], instructionBody: newBody };
            return next;
        });
    };

    const handleToggleExpand = (index: number) => {
        setSections(prev => {
            const next = [...prev];
            next[index] = { ...next[index], isExpanded: !next[index].isExpanded };
            return next;
        });
    };

    const handleConfirm = () => {
        let globalQuestionNumber = 1;

        const finalSections: Section[] = sections.map((sec, idx) => {
            const roman = toRoman(idx + 1);
            const fullInstruction = `${roman}. ${sec.instructionBody.trim()}`;

            const numberedQuestions: Question[] = sec.questions.map(q => {
                const isStimulus = q.type === QuestionType.STIMULUS;
                const assignedNumber = isStimulus ? '' : String(globalQuestionNumber++);
                return {
                    ...q,
                    id: crypto.randomUUID(),
                    number: assignedNumber
                };
            });

            return {
                id: crypto.randomUUID(),
                instructions: fullInstruction,
                questions: numberedQuestions
            };
        });

        const newExam: Exam = {
            id: crypto.randomUUID(),
            title: examTitle.trim() || `Ujian ${subject || 'Baru'}`,
            subject: subject.trim(),
            class: className.trim(),
            date: examDate || new Date().toISOString().split('T')[0],
            waktuUjian: examTime.trim() || '90 Menit',
            keterangan: `Dibuat otomatis dari ${selectedQuestions.length} butir Bank Soal`,
            instructions: '1. Berdoalah sebelum mengerjakan soal.\n2. Jawablah pertanyaan dengan jujur dan teliti.\n3. Periksa kembali lembar jawaban Anda sebelum dikumpulkan.',
            sections: finalSections,
            status: 'draft',
            direction: 'ltr',
            layoutColumns: 1
        };

        onConfirmCreate(newExam);
    };

    const totalQuestionsCount = sections.reduce((acc, s) => acc + s.questions.length, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="app-surface w-full max-w-3xl max-h-[90vh] rounded-[var(--radius-card)] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-exam-title"
            >
                {/* Header Modal */}
                <div className="px-5 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-accent)] text-[var(--text-on-accent)] flex items-center justify-center shadow-xs">
                            <SparklesIcon className="text-base" />
                        </div>
                        <div>
                            <h3 id="create-exam-title" className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
                                Buat Naskah Ujian dari Soal Terpilih
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {totalQuestionsCount} butir soal telah dikelompokkan secara cerdas per jenis soal.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-control)] transition-colors"
                        aria-label="Tutup Dialog"
                    >
                        <CloseIcon className="text-sm" />
                    </button>
                </div>

                {/* Body Content (Scrollable) */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin">
                    
                    {/* Bagian 1: Informasi Identitas Ujian */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-primary)]">
                            <FileTextIcon className="text-xs text-[var(--text-accent)]" />
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                                1. Identitas Naskah Ujian
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Judul Ujian <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={examTitle}
                                    onChange={e => setExamTitle(e.target.value)}
                                    placeholder="Contoh: Penilaian Akhir Semester (PAS) IPA"
                                    className="w-full px-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Mata Pelajaran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Contoh: Ilmu Pengetahuan Alam (IPA)"
                                    className="w-full px-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Kelas / Jenjang <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={className}
                                    onChange={e => setClassName(e.target.value)}
                                    placeholder="Contoh: Kelas IX (SMP/MTs)"
                                    className="w-full px-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Waktu Pengerjaan
                                </label>
                                <input
                                    type="text"
                                    value={examTime}
                                    onChange={e => setExamTime(e.target.value)}
                                    placeholder="Contoh: 90 Menit"
                                    className="w-full px-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Tanggal Pelaksanaan
                                </label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={e => setExamDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bagian 2: Pengelompokan & Urutan Bagian Soal */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-[var(--border-primary)]">
                            <div className="flex items-center gap-2">
                                <TagIcon className="text-xs text-[var(--text-accent)]" />
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                                    2. Urutan Bagian & Instruksi ({sections.length} Bagian Terbentuk)
                                </h4>
                            </div>
                            <span className="text-[11px] text-[var(--text-muted)] italic">
                                Gunakan tombol panah untuk menukar urutan bagian
                            </span>
                        </div>

                        <div className="space-y-3">
                            {sections.map((sec, index) => {
                                const romanNumeral = toRoman(index + 1);
                                return (
                                    <div 
                                        key={sec.id}
                                        className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-3 transition-all shadow-2xs hover:border-[var(--border-secondary)]"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] font-extrabold text-xs text-[var(--text-primary)]">
                                                    {romanNumeral}
                                                </span>
                                                <span className="app-status-pill app-status-info text-xs font-bold">
                                                    {sec.typeName}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-semibold text-[var(--text-secondary)]">
                                                    {sec.questions.length} Butir Soal
                                                </span>
                                            </div>

                                            {/* Tombol Reorder Urutan Bagian */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveSection(index, 'up')}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Pindah ke Atas"
                                                >
                                                    <ArrowUpIcon className="text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === sections.length - 1}
                                                    onClick={() => handleMoveSection(index, 'down')}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Pindah ke Bawah"
                                                >
                                                    <ArrowDownIcon className="text-xs" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Input Teks Instruksi */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                                                Kalimat Instruksi Bagian {romanNumeral}:
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-extrabold text-[var(--text-secondary)] flex-shrink-0">
                                                    {romanNumeral}.
                                                </span>
                                                <input
                                                    type="text"
                                                    value={sec.instructionBody}
                                                    onChange={e => handleInstructionChange(index, e.target.value)}
                                                    className="w-full px-3 py-1.5 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                                    placeholder="Tulis instruksi pengerjaan bagian ini..."
                                                />
                                            </div>
                                        </div>

                                        {/* Accordion Preview Butir Soal */}
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleExpand(index)}
                                                className="text-[11px] text-[var(--text-accent)] font-semibold hover:underline inline-flex items-center gap-1"
                                            >
                                                <span>{sec.isExpanded ? 'Sembunyikan Butir Soal' : 'Lihat Ringkasan Butir Soal'}</span>
                                                <span>({sec.questions.length})</span>
                                            </button>

                                            {sec.isExpanded && (
                                                <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-[var(--border-primary)]">
                                                    {sec.questions.map((q, qIdx) => (
                                                        <div key={q.id || qIdx} className="text-xs text-[var(--text-secondary)] py-1 line-clamp-1">
                                                            <span className="font-bold text-[var(--text-primary)] mr-1.5">#{qIdx + 1}.</span>
                                                            <span>{stripHtml(q.text) || '(Tanpa Teks / Tabel Soal)'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="px-5 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-[var(--text-secondary)]">
                        Total: <span className="font-extrabold text-[var(--text-primary)]">{totalQuestionsCount} Butir Soal</span> dalam <span className="font-extrabold text-[var(--text-primary)]">{sections.length} Bagian</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-control)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] transition-all shadow-xs"
                        >
                            <BookmarkPlusIcon className="text-xs" />
                            <span>Buat Naskah Ujian Sekarang</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
