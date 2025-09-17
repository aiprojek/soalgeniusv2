import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exam } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { getAllExams, deleteExam, duplicateExam, shuffleExam } from '../lib/storage';
import { 
    PlusIcon, EditIcon, PrinterIcon, ShuffleIcon, CopyIcon, TrashIcon, FunnelIcon, SearchIcon, CloseIcon
} from '../components/Icons';

const ExamCard: React.FC<{
    exam: Exam;
    totalQuestions: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onCopy: (id: string) => void;
    onShuffle: (id: string) => void;
    onPreview: (id: string) => void;
}> = ({ exam, totalQuestions, onEdit, onDelete, onCopy, onShuffle, onPreview }) => {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md flex flex-col hover:shadow-xl transition-shadow duration-300">
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{exam.title}</h3>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        exam.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                        {exam.status === 'published' ? 'Selesai' : 'Draf'}
                    </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{exam.subject} - {exam.class}</p>
                {exam.keterangan && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 italic truncate" title={exam.keterangan}>
                      {exam.keterangan}
                  </p>
                )}
                <div className="mt-4 flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                   <span>{new Date(exam.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                   <span className="h-1 w-1 bg-[var(--text-muted)] rounded-full"></span>
                   <span>{totalQuestions} Soal</span>
                </div>
            </div>
            <div className="border-t border-[var(--border-primary)] p-2 flex justify-around items-center bg-[var(--bg-tertiary)] rounded-b-lg">
                <button onClick={() => onEdit(exam.id)} aria-label={`Edit ${exam.title}`} title="Edit" className="p-2 text-[var(--text-secondary)] hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-300 rounded-full transition-colors"><EditIcon className="text-lg" /></button>
                <button onClick={() => onPreview(exam.id)} aria-label={`Cetak ${exam.title}`} title="Cetak" className="p-2 text-[var(--text-secondary)] hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-300 rounded-full transition-colors"><PrinterIcon className="text-lg" /></button>
                <button onClick={() => onShuffle(exam.id)} aria-label={`Acak ${exam.title}`} title="Acak" className="p-2 text-[var(--text-secondary)] hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-300 rounded-full transition-colors"><ShuffleIcon className="text-lg" /></button>
                <button onClick={() => onCopy(exam.id)} aria-label={`Salin ${exam.title}`} title="Salin" className="p-2 text-[var(--text-secondary)] hover:bg-yellow-100 dark:hover:bg-yellow-900/50 hover:text-yellow-600 dark:hover:text-yellow-300 rounded-full transition-colors"><CopyIcon className="text-lg" /></button>
                <button onClick={() => onDelete(exam.id)} aria-label={`Hapus ${exam.title}`} title="Hapus" className="p-2 text-[var(--text-secondary)] hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300 rounded-full transition-colors"><TrashIcon className="text-lg" /></button>
            </div>
        </div>
    );
};

const ArchiveView: React.FC<{ 
    onEditExam: (id: string) => void; 
    onCreateExam: () => void;
    onPreviewExam: (id: string) => void;
}> = ({ onEditExam, onCreateExam, onPreviewExam }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // For controlled input
    const [statusFilter, setStatusFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    // Temporary states for the modal
    const [tempStatusFilter, setTempStatusFilter] = useState('');
    const [tempSubjectFilter, setTempSubjectFilter] = useState('');
    const [tempClassFilter, setTempClassFilter] = useState('');

    const { showConfirm } = useModal();
    const { addToast } = useToast();

    useEffect(() => {
        setExams(getAllExams());
    }, []);

    const handleDelete = useCallback((id: string) => {
        showConfirm({
            title: 'Konfirmasi Hapus Ujian',
            content: 'Apakah Anda yakin ingin menghapus ujian ini? Aksi ini tidak dapat dibatalkan.',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: () => {
                setExams(deleteExam(id));
                addToast('Ujian berhasil dihapus.', 'success');
            }
        });
    }, [showConfirm, addToast]);

    const handleCopy = useCallback((id: string) => {
        setExams(duplicateExam(id));
        addToast('Ujian berhasil disalin.', 'success');
    }, [addToast]);
    
    const handleShuffle = useCallback((id: string) => {
        setExams(shuffleExam(id));
        addToast('Varian ujian acak berhasil dibuat.', 'success');
    }, [addToast]);
    
    const totalQuestions = (exam: Exam) => exam.sections.reduce((acc, section) => acc + section.questions.length, 0);

    const { uniqueSubjects, uniqueClasses } = useMemo(() => {
        const subjects = new Set<string>();
        const classes = new Set<string>();
        // Use all exams for filters, not just filtered ones
        getAllExams().forEach(exam => {
            if (exam.subject) subjects.add(exam.subject);
            if (exam.class) classes.add(exam.class);
        });
        return { 
            uniqueSubjects: Array.from(subjects).sort(),
            uniqueClasses: Array.from(classes).sort()
        };
    }, [exams]); // Depends on exams to re-calculate if exams list changes

    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = 
                searchTerm === '' ||
                exam.title.toLowerCase().includes(searchLower) ||
                exam.subject.toLowerCase().includes(searchLower) ||
                exam.class.toLowerCase().includes(searchLower);
            
            const statusMatch = statusFilter === '' || exam.status === statusFilter;
            const subjectMatch = subjectFilter === '' || exam.subject === subjectFilter;
            const classMatch = classFilter === '' || exam.class === classFilter;

            return searchMatch && statusMatch && subjectMatch && classMatch;
        });
    }, [exams, searchTerm, statusFilter, subjectFilter, classFilter]);
    
    const handleOpenFilterModal = () => {
        setTempStatusFilter(statusFilter);
        setTempSubjectFilter(subjectFilter);
        setTempClassFilter(classFilter);
        setIsFilterModalOpen(true);
    };

    const handleApplyFilters = () => {
        setStatusFilter(tempStatusFilter);
        setSubjectFilter(tempSubjectFilter);
        setClassFilter(tempClassFilter);
        setIsFilterModalOpen(false);
    };
    
    const handleResetFilters = () => {
        setTempStatusFilter('');
        setTempSubjectFilter('');
        setTempClassFilter('');
    };
    
    const handleSearch = () => setSearchTerm(searchInput);
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Arsip Ujian</h2>
                {/* Desktop: Full button */}
                <button onClick={onCreateExam} className="hidden md:flex flex-shrink-0 items-center space-x-2 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow hover:shadow-lg">
                    <PlusIcon />
                    <span>Buat Ujian Baru</span>
                </button>
                {/* Mobile: Icon buttons */}
                <div className="md:hidden flex items-center space-x-2">
                     <button onClick={onCreateExam} aria-label="Buat Ujian Baru" className="flex items-center justify-center h-10 w-10 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] rounded-full shadow-md">
                        <PlusIcon className="text-lg" />
                    </button>
                    <button onClick={handleOpenFilterModal} aria-label="Buka Filter" className="flex items-center justify-center h-10 w-10 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-full shadow-md border border-[var(--border-primary)]">
                        <FunnelIcon className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar */}
             <div className="relative mb-6 md:hidden">
                <input
                    type="text"
                    placeholder="Cari ujian..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full p-3 pl-4 pr-12 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--border-focus)] outline-none transition-shadow"
                />
                <button onClick={handleSearch} aria-label="Cari" className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors">
                    <SearchIcon className="text-xl"/>
                </button>
            </div>

            {/* Desktop Combined Search & Filter */}
            {exams.length > 0 && (
                <div className="hidden md:grid bg-[var(--bg-secondary)] p-4 rounded-lg shadow-md mb-6 grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Cari ujian..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full p-2 pl-4 pr-12 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] rounded-lg focus:ring-2 focus:ring-[var(--border-focus)] outline-none"
                        />
                        <button onClick={handleSearch} aria-label="Cari" className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors">
                            <SearchIcon className="text-xl"/>
                        </button>
                    </div>
                    {/* Filters */}
                    <select aria-label="Filter berdasarkan status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                        <option value="">Semua Status</option>
                        <option value="draft">Draf</option>
                        <option value="published">Selesai</option>
                    </select>
                    <select aria-label="Filter berdasarkan mata pelajaran" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                        <option value="">Semua Mapel</option>
                        {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select aria-label="Filter berdasarkan kelas" value={classFilter} onChange={e => setClassFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                        <option value="">Semua Kelas</option>
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}
            
            {/* Mobile Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true">
                     <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-sm m-4">
                        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Filter Ujian</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><CloseIcon /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                                <select value={tempStatusFilter} onChange={e => setTempStatusFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draf</option>
                                    <option value="published">Selesai</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mata Pelajaran</label>
                                <select value={tempSubjectFilter} onChange={e => setTempSubjectFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                                    <option value="">Semua Mapel</option>
                                    {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Kelas</label>
                                <select value={tempClassFilter} onChange={e => setTempClassFilter(e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] w-full">
                                    <option value="">Semua Kelas</option>
                                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-[var(--bg-tertiary)] rounded-b-lg">
                            <button onClick={handleResetFilters} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400">Reset Filter</button>
                            <button onClick={handleApplyFilters} className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg">Terapkan</button>
                        </div>
                    </div>
                </div>
            )}


            {exams.length > 0 ? (
                filteredExams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map(exam => (
                            <ExamCard 
                                key={exam.id} 
                                exam={exam} 
                                totalQuestions={totalQuestions(exam)}
                                onEdit={onEditExam}
                                onDelete={handleDelete}
                                onCopy={handleCopy}
                                onShuffle={handleShuffle}
                                onPreview={onPreviewExam}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-[var(--bg-secondary)] rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">Tidak Ada Ujian yang Cocok</h3>
                        <p className="text-[var(--text-secondary)] mt-2">Coba ubah kata kunci pencarian atau filter Anda.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 px-6 bg-[var(--bg-secondary)] rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">Arsip Anda Kosong</h3>
                        <p className="text-[var(--text-secondary)] mt-2">Klik "Buat Ujian Baru" untuk memulai.</p>
                </div>
            )}
        </>
    );
}

export default ArchiveView;