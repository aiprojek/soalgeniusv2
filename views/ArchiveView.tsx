import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exam, Folder } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { getAllExams, deleteExam, duplicateExam, shuffleExam, getFolders, saveFolder, deleteFolder, saveExam, renameGlobalTag, deleteGlobalTag } from '../lib/storage';
import { useDebounce } from '../hooks/useDebounce';
import { 
    PlusIcon, EditIcon, PrinterIcon, ShuffleIcon, CopyIcon, TrashIcon, SearchIcon, CloseIcon,
    FolderIcon, FolderOpenIcon, TagIcon, MoveIcon, CheckIcon, ChevronLeftIcon
} from '../components/Icons';

// --- Sub-components ---

const ExamCard: React.FC<{
    exam: Exam;
    totalQuestions: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onCopy: (id: string) => void;
    onShuffle: (id: string) => void;
    onPreview: (id: string) => void;
    onManageTags: (id: string) => void;
    onMove: (id: string) => void;
}> = ({ exam, totalQuestions, onEdit, onDelete, onCopy, onShuffle, onPreview, onManageTags, onMove }) => {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-primary)] hover:shadow-md transition-all duration-200 flex flex-col group relative overflow-hidden animate-fade-in">
            <div className="p-5 flex-grow cursor-pointer" onClick={() => onEdit(exam.id)}>
                <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight line-clamp-2" title={exam.title}>{exam.title}</h3>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                        exam.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                        {exam.status === 'published' ? 'Selesai' : 'Draf'}
                    </span>
                </div>
                
                <p className="text-sm text-[var(--text-secondary)] mb-3">{exam.subject} • {exam.class}</p>
                
                {/* Tags Display */}
                {exam.tags && exam.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {exam.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
                                #{tag}
                            </span>
                        ))}
                        {exam.tags.length > 3 && <span className="text-[10px] text-[var(--text-muted)]">+{exam.tags.length - 3}</span>}
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-auto pt-2 border-t border-[var(--border-primary)] border-dashed">
                   <span>{new Date(exam.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                   <span>•</span>
                   <span>{totalQuestions} Soal</span>
                </div>
            </div>
            
            {/* Quick Actions Bar - Always visible on mobile, hover on desktop */}
            <div className="bg-[var(--bg-tertiary)] p-2 grid grid-cols-7 gap-1 border-t border-[var(--border-primary)]">
                <button onClick={() => onEdit(exam.id)} title="Edit" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-blue-600 flex justify-center items-center transition-colors"><EditIcon/></button>
                <button onClick={() => onPreview(exam.id)} title="Cetak/Preview" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-green-600 flex justify-center items-center transition-colors"><PrinterIcon/></button>
                <button onClick={() => onShuffle(exam.id)} title="Acak Soal" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-purple-600 flex justify-center items-center transition-colors"><ShuffleIcon/></button>
                <button onClick={() => onCopy(exam.id)} title="Duplikat" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-yellow-600 flex justify-center items-center transition-colors"><CopyIcon/></button>
                <button onClick={() => onMove(exam.id)} title="Pindah Folder" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-orange-600 flex justify-center items-center transition-colors"><MoveIcon/></button>
                <button onClick={() => onManageTags(exam.id)} title="Label" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-pink-600 flex justify-center items-center transition-colors"><TagIcon/></button>
                <button onClick={() => onDelete(exam.id)} title="Hapus" className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-red-600 flex justify-center items-center transition-colors"><TrashIcon/></button>
            </div>
        </div>
    );
};

const FilterPill: React.FC<{ 
    label: string; 
    icon: React.ElementType; 
    isActive: boolean; 
    onClick: () => void;
    onClear?: (e: React.MouseEvent) => void;
}> = ({ label, icon: Icon, isActive, onClick, onClear }) => (
    <button 
        onClick={onClick}
        title={label}
        className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-full text-sm font-medium transition-all border ${
            isActive 
            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' 
            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
    >
        <Icon className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]'} />
        <span className="hidden sm:block truncate max-w-[150px]">{label}</span>
        {isActive && onClear && (
            <div 
                onClick={onClear} 
                className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full cursor-pointer"
            >
                <CloseIcon className="text-xs" />
            </div>
        )}
    </button>
);

const ITEMS_PER_PAGE = 12;

const ArchiveView: React.FC<{ 
    onEditExam: (id: string) => void; 
    onCreateExam: () => void;
    onPreviewExam: (id: string) => void;
}> = ({ onEditExam, onCreateExam, onPreviewExam }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtering State
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All, 'uncategorized' = No Folder
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
    const [selectedTag, setSelectedTag] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Modals State
    const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
    const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
    
    // Create/Edit Folder State (Inside Selector)
    const [isEditingFolder, setIsEditingFolder] = useState(false);
    const [folderNameInput, setFolderNameInput] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

    // Tag Manager State
    const [targetExamId, setTargetExamId] = useState<string | null>(null);
    const [isTagExamModalOpen, setIsTagExamModalOpen] = useState(false); // For single exam
    const [tagInput, setTagInput] = useState('');
    const [currentExamTags, setCurrentExamTags] = useState<string[]>([]);

    // Move Exam State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [moveExamId, setMoveExamId] = useState<string | null>(null);

    // Global Tag Renaming
    const [editingTagName, setEditingTagName] = useState<string | null>(null);
    const [renameTagInput, setRenameTagInput] = useState('');

    const { showConfirm } = useModal();
    const { addToast } = useToast();

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFolderId, debouncedSearchTerm, selectedTag]);

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [examsData, foldersData] = await Promise.all([getAllExams(), getFolders()]);
            setExams(examsData);
            setFolders(foldersData);
        } catch (error) {
            addToast("Gagal memuat arsip.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // --- Folder Logic ---
    const handleSaveFolder = async () => {
        if (!folderNameInput.trim()) return;
        try {
            if (editingFolderId) {
                const folder = folders.find(f => f.id === editingFolderId);
                if (folder) await saveFolder({ ...folder, name: folderNameInput });
            } else {
                await saveFolder({ id: crypto.randomUUID(), name: folderNameInput, createdAt: new Date().toISOString() });
            }
            setFolderNameInput('');
            setEditingFolderId(null);
            setIsEditingFolder(false);
            loadData();
        } catch (e) { addToast('Gagal menyimpan folder.', 'error'); }
    };

    const handleDeleteFolder = (folderId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        showConfirm({
            title: 'Hapus Folder',
            content: 'Hapus folder ini? Ujian di dalamnya TIDAK akan terhapus.',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                try {
                    await deleteFolder(folderId);
                    if (selectedFolderId === folderId) setSelectedFolderId(null);
                    loadData();
                } catch (e) { addToast('Gagal menghapus folder.', 'error'); }
            }
        });
    };

    // --- Exam CRUD ---
    const handleDeleteExam = useCallback((id: string) => {
        showConfirm({
            title: 'Hapus Ujian',
            content: 'Yakin ingin menghapus ujian ini permanen?',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                await deleteExam(id);
                loadData();
                addToast('Ujian dihapus.', 'success');
            }
        });
    }, [showConfirm, addToast, loadData]);

    const handleCopyExam = async (id: string) => { await duplicateExam(id); loadData(); addToast('Ujian disalin.', 'success'); };
    const handleShuffleExam = async (id: string) => { await shuffleExam(id); loadData(); addToast('Varian acak dibuat.', 'success'); };

    // --- Tag Logic ---
    const openTagModal = (examId: string) => {
        const exam = exams.find(e => e.id === examId);
        if (exam) {
            setTargetExamId(examId);
            setCurrentExamTags(exam.tags || []);
            setIsTagExamModalOpen(true);
        }
    };

    const handleSaveTags = async () => {
        if (!targetExamId) return;
        const exam = exams.find(e => e.id === targetExamId);
        if (exam) {
            exam.tags = currentExamTags;
            await saveExam(exam);
            loadData();
            addToast('Tag disimpan.', 'success');
        }
        setIsTagExamModalOpen(false);
    };

    const handleGlobalDeleteTag = (tag: string, e: React.MouseEvent) => {
        e.stopPropagation();
        showConfirm({
            title: 'Hapus Label',
            content: `Hapus label "${tag}" dari semua ujian?`,
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                await deleteGlobalTag(tag);
                if (selectedTag === tag) setSelectedTag('');
                loadData();
            }
        });
    };

    const handleGlobalRenameTag = async () => {
        if (!editingTagName || !renameTagInput.trim()) { setEditingTagName(null); return; }
        await renameGlobalTag(editingTagName, renameTagInput.trim());
        if (selectedTag === editingTagName) setSelectedTag(renameTagInput.trim());
        setEditingTagName(null);
        loadData();
    };

    // --- Move Logic ---
    const openMoveModal = (id: string) => { setMoveExamId(id); setIsMoveModalOpen(true); };
    const handleMoveExam = async (targetId: string | null) => {
        if (!moveExamId) return;
        const exam = exams.find(e => e.id === moveExamId);
        if (exam) {
            if (targetId) exam.folderId = targetId; else delete exam.folderId;
            await saveExam(exam);
            loadData();
            addToast('Ujian dipindahkan.', 'success');
        }
        setIsMoveModalOpen(false);
    };

    // --- Filtered Data ---
    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const searchLower = debouncedSearchTerm.toLowerCase();
            const matchesSearch = !debouncedSearchTerm || exam.title.toLowerCase().includes(searchLower) || exam.subject.toLowerCase().includes(searchLower);
            const matchesFolder = selectedFolderId === null ? true : selectedFolderId === 'uncategorized' ? !exam.folderId : exam.folderId === selectedFolderId;
            const matchesTag = !selectedTag || (exam.tags && exam.tags.includes(selectedTag));
            return matchesSearch && matchesFolder && matchesTag;
        });
    }, [exams, debouncedSearchTerm, selectedFolderId, selectedTag]);

    // --- Pagination Logic ---
    const paginatedExams = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExams.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredExams, currentPage]);

    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);

    const allUniqueTags = useMemo(() => {
        const tags = new Set<string>();
        exams.forEach(e => e.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [exams]);

    const selectedFolderName = selectedFolderId === null ? 'Semua Folder' : selectedFolderId === 'uncategorized' ? 'Tanpa Folder' : folders.find(f => f.id === selectedFolderId)?.name || 'Folder';

    if (isLoading) return <div className="flex h-full items-center justify-center text-[var(--text-muted)]">Memuat...</div>;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            {/* --- TOP BAR (Sticky) --- */}
            <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm pb-4 pt-1 space-y-3">
                {/* Row 1: Search */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Cari judul atau mapel..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    </div>
                </div>

                {/* Row 2: Filters & Actions */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                    <div className="flex items-center gap-2">
                        <FilterPill 
                            label={selectedFolderName} 
                            icon={selectedFolderId === 'uncategorized' ? FolderIcon : FolderOpenIcon}
                            isActive={selectedFolderId !== null} 
                            onClick={() => setIsFolderSelectorOpen(true)}
                            onClear={(e) => { e.stopPropagation(); setSelectedFolderId(null); }}
                        />
                        <FilterPill 
                            label={selectedTag || 'Semua Label'} 
                            icon={TagIcon}
                            isActive={!!selectedTag} 
                            onClick={() => setIsTagSelectorOpen(true)}
                            onClear={(e) => { e.stopPropagation(); setSelectedTag(''); }}
                        />
                    </div>
                    
                    <button 
                        onClick={onCreateExam} 
                        title="Buat Ujian Baru"
                        className="flex-shrink-0 flex items-center gap-2 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-3 sm:px-5 rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <PlusIcon className="text-lg" /> 
                        <span className="hidden sm:inline">Buat Ujian</span>
                    </button>
                </div>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="flex-grow overflow-y-auto pb-4 -mx-1 px-1">
                {filteredExams.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                            {paginatedExams.map(exam => (
                                <ExamCard 
                                    key={exam.id}
                                    exam={exam}
                                    totalQuestions={exam.sections.reduce((acc, s) => acc + s.questions.length, 0)}
                                    onEdit={onEditExam} onDelete={handleDeleteExam} onCopy={handleCopyExam}
                                    onShuffle={handleShuffleExam} onPreview={onPreviewExam}
                                    onManageTags={openTagModal} onMove={openMoveModal}
                                />
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-6">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] disabled:opacity-50 hover:bg-[var(--bg-hover)]"
                                >
                                    <ChevronLeftIcon className="text-xl" />
                                </button>
                                <span className="text-sm font-medium text-[var(--text-secondary)]">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] disabled:opacity-50 hover:bg-[var(--bg-hover)]"
                                >
                                    <i className="bi bi-chevron-right text-xl"></i>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="bg-[var(--bg-tertiary)] p-6 rounded-full mb-4">
                            <FolderOpenIcon className="text-4xl text-[var(--text-muted)]" />
                        </div>
                        <p className="text-lg font-medium text-[var(--text-secondary)]">Tidak ada ujian ditemukan</p>
                        <p className="text-sm text-[var(--text-muted)]">Coba ubah filter atau buat ujian baru.</p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* 1. Folder Selector & Manager Modal */}
            {isFolderSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-[var(--bg-secondary)] w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up sm:animate-scale-in">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-tertiary)] rounded-t-2xl">
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">Pilih Folder</h3>
                            <button onClick={() => setIsFolderSelectorOpen(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded-full"><CloseIcon/></button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-grow space-y-1">
                            {/* Create New / Edit Input */}
                            <div className="mb-4">
                                {isEditingFolder ? (
                                    <div className="flex gap-2">
                                        <input 
                                            autoFocus type="text" value={folderNameInput} onChange={e => setFolderNameInput(e.target.value)}
                                            className="flex-grow p-2 text-sm border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-primary)]"
                                            placeholder="Nama Folder..."
                                            onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
                                        />
                                        <button onClick={handleSaveFolder} className="bg-blue-600 text-white p-2 rounded-lg"><CheckIcon/></button>
                                        <button onClick={() => { setIsEditingFolder(false); setEditingFolderId(null); setFolderNameInput(''); }} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg"><CloseIcon/></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditingFolder(true)} className="w-full py-2.5 border-2 border-dashed border-[var(--border-secondary)] rounded-xl text-[var(--text-muted)] hover:border-blue-500 hover:text-blue-500 font-medium transition-colors flex items-center justify-center gap-2">
                                        <PlusIcon /> Tambah Folder Baru
                                    </button>
                                )}
                            </div>

                            {/* Standard Options */}
                            <button onClick={() => { setSelectedFolderId(null); setIsFolderSelectorOpen(false); }} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedFolderId === null ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold' : 'hover:bg-[var(--bg-hover)]'}`}>
                                <FolderOpenIcon className="text-xl"/> Semua Ujian
                            </button>
                            <button onClick={() => { setSelectedFolderId('uncategorized'); setIsFolderSelectorOpen(false); }} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedFolderId === 'uncategorized' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold' : 'hover:bg-[var(--bg-hover)]'}`}>
                                <FolderIcon className="text-xl opacity-50"/> Tanpa Folder
                            </button>

                            <div className="border-t border-[var(--border-primary)] my-2"></div>

                            {/* Dynamic Folders */}
                            {folders.map(f => (
                                <div key={f.id} className={`group flex items-center justify-between p-2 rounded-lg transition-colors ${selectedFolderId === f.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-[var(--bg-hover)]'}`}>
                                    <button onClick={() => { setSelectedFolderId(f.id); setIsFolderSelectorOpen(false); }} className="flex items-center gap-3 flex-grow text-left truncate">
                                        <FolderIcon className="text-yellow-500 text-xl"/> 
                                        <span className={`truncate ${selectedFolderId === f.id ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-[var(--text-primary)]'}`}>{f.name}</span>
                                    </button>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setFolderNameInput(f.name); setIsEditingFolder(true); }} className="p-1.5 text-[var(--text-secondary)] hover:bg-white dark:hover:bg-black/20 rounded"><EditIcon className="text-xs"/></button>
                                        <button onClick={(e) => handleDeleteFolder(f.id, e)} className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-white dark:hover:bg-black/20 rounded"><TrashIcon className="text-xs"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Tag Selector & Manager Modal */}
            {isTagSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-[var(--bg-secondary)] w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up sm:animate-scale-in">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-tertiary)] rounded-t-2xl">
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">Filter Label</h3>
                            <button onClick={() => setIsTagSelectorOpen(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded-full"><CloseIcon/></button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto">
                            <button onClick={() => { setSelectedTag(''); setIsTagSelectorOpen(false); }} className={`w-full text-left p-3 rounded-lg mb-2 ${!selectedTag ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 font-semibold' : 'hover:bg-[var(--bg-hover)]'}`}>
                                Semua Label
                            </button>
                            
                            <div className="space-y-1">
                                {allUniqueTags.map(tag => (
                                    <div key={tag} className="flex items-center justify-between group p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                                        {editingTagName === tag ? (
                                            <div className="flex gap-2 flex-grow">
                                                <input autoFocus type="text" value={renameTagInput} onChange={e => setRenameTagInput(e.target.value)} className="w-full p-1 text-sm border rounded bg-[var(--bg-primary)]" onKeyDown={e => e.key === 'Enter' && handleGlobalRenameTag()} />
                                                <button onClick={handleGlobalRenameTag}><CheckIcon className="text-green-600"/></button>
                                                <button onClick={() => setEditingTagName(null)}><CloseIcon className="text-red-500"/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => { setSelectedTag(tag); setIsTagSelectorOpen(false); }} className={`flex-grow text-left flex items-center gap-2 ${selectedTag === tag ? 'font-bold text-blue-600' : ''}`}>
                                                    <TagIcon className="text-xs opacity-50"/> {tag}
                                                </button>
                                                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingTagName(tag); setRenameTagInput(tag); }} className="p-1 hover:bg-[var(--bg-primary)] rounded"><EditIcon className="text-xs"/></button>
                                                    <button onClick={(e) => handleGlobalDeleteTag(tag, e)} className="p-1 hover:bg-[var(--bg-primary)] text-red-500 rounded"><TrashIcon className="text-xs"/></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {allUniqueTags.length === 0 && <p className="text-center text-[var(--text-muted)] py-4">Belum ada label dibuat.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Move Exam Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-6 w-full max-w-sm shadow-xl border border-[var(--border-primary)]">
                        <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Pindahkan ke Folder</h3>
                        <div className="space-y-1 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
                            <button onClick={() => handleMoveExam(null)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center gap-3">
                                <FolderIcon className="opacity-50"/> Tanpa Folder
                            </button>
                            {folders.map(f => (
                                <button key={f.id} onClick={() => handleMoveExam(f.id)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-[var(--bg-hover)] text-blue-600 dark:text-blue-400 flex items-center gap-3">
                                    <FolderIcon className="text-yellow-500"/> {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => setIsMoveModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg">Batal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Tag Modal (Single Exam) */}
            {isTagExamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-6 w-full max-w-sm shadow-xl border border-[var(--border-primary)]">
                        <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Label Ujian</h3>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                                placeholder="Tambah label..."
                                className="flex-grow p-2 border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setCurrentExamTags([...currentExamTags, tagInput.trim()]); setTagInput(''); } }}
                            />
                            <button onClick={() => { if (tagInput.trim()) { setCurrentExamTags([...currentExamTags, tagInput.trim()]); setTagInput(''); } }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><PlusIcon /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6 min-h-[50px]">
                            {currentExamTags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-sm border border-blue-100 dark:border-blue-800">
                                    {tag}
                                    <button onClick={() => setCurrentExamTags(currentExamTags.filter(t => t !== tag))} className="hover:text-red-500 rounded-full p-0.5"><CloseIcon className="text-xs" /></button>
                                </span>
                            ))}
                            {currentExamTags.length === 0 && <p className="text-sm text-[var(--text-muted)] italic self-center">Belum ada label.</p>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsTagExamModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg">Batal</button>
                            <button onClick={handleSaveTags} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchiveView;