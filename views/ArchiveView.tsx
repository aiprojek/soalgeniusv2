import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exam, Folder } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { 
    getAllExams, deleteExam, duplicateExam, shuffleExam, 
    getFolders, saveFolder, deleteFolder, saveExam, 
    renameGlobalTag, deleteGlobalTag 
} from '../lib/storage';
import { useDebounce } from '../hooks/useDebounce';
import PacketGeneratorModal from '../components/PacketGeneratorModal';
import { 
    PlusIcon, EditIcon, PrinterIcon, ShuffleIcon, CopyIcon, TrashIcon, SearchIcon, CloseIcon,
    FolderIcon, FolderOpenIcon, TagIcon, MoveIcon, CheckIcon, ChevronLeftIcon, StackIcon, MoreIcon, 
    FunnelIcon, ArchiveIcon, BookIcon, CheckCircleIcon
} from '../components/Icons';

// --- Sub-components ---

const ExamCard: React.FC<{
    exam: Exam;
    totalQuestions: number;
    folderName?: string;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onCopy: (id: string) => void;
    onShuffle: (id: string) => void;
    onGeneratePackets: (id: string, title: string) => void;
    onPreview: (id: string) => void;
    onManageTags: (id: string) => void;
    onMove: (id: string) => void;
}> = ({ 
    exam, 
    totalQuestions, 
    folderName,
    onEdit, 
    onDelete, 
    onCopy, 
    onShuffle, 
    onGeneratePackets, 
    onPreview, 
    onManageTags, 
    onMove 
}) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const actionItems = [
        { label: 'Generator Paket Soal', icon: StackIcon, onClick: () => onGeneratePackets(exam.id, exam.title), tone: 'text-purple-600 dark:text-purple-400' },
        { label: 'Acak Varian Soal', icon: ShuffleIcon, onClick: () => onShuffle(exam.id), tone: 'text-violet-600 dark:text-violet-400' },
        { label: 'Duplikat Ujian', icon: CopyIcon, onClick: () => onCopy(exam.id), tone: 'text-amber-600 dark:text-amber-400' },
        { label: 'Pindahkan ke Folder', icon: MoveIcon, onClick: () => onMove(exam.id), tone: 'text-orange-600 dark:text-orange-400' },
        { label: 'Kelola Label (Tag)', icon: TagIcon, onClick: () => onManageTags(exam.id), tone: 'text-pink-600 dark:text-pink-400' },
        { label: 'Hapus Ujian', icon: TrashIcon, onClick: () => onDelete(exam.id), tone: 'text-rose-600 dark:text-rose-400' },
    ];

    return (
        <>
            <div className="app-surface rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-focus)] hover:shadow-md transition-all duration-200 flex flex-col group relative overflow-hidden animate-fade-in">
                {/* Top Clickable Area */}
                <div className="p-4 sm:p-5 flex-grow cursor-pointer flex flex-col" onClick={() => onEdit(exam.id)}>
                    {/* Header Row: Title & Status */}
                    <div className="flex justify-between items-start gap-2.5 mb-2.5">
                        <div className="min-w-0 flex-1">
                            <h3 
                                className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--text-accent)] transition-colors" 
                                title={exam.title}
                            >
                                {exam.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
                                <span className="font-semibold text-[var(--text-primary)]">{exam.subject || 'Mata Pelajaran Umum'}</span>
                                {exam.class && (
                                    <>
                                        <span className="text-[var(--text-muted)]">•</span>
                                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-medium">
                                            {exam.class}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <span className={`app-status-pill flex-shrink-0 !px-2.5 !py-0.5 !text-[10px] font-bold ${exam.status === 'published' ? 'app-status-success' : 'app-status-warning'}`}>
                            {exam.status === 'published' ? 'Selesai' : 'Draf'}
                        </span>
                    </div>

                    {/* Folder & Tags Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5 mt-1">
                        {folderName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <FolderIcon className="text-[10px]" />
                                <span className="truncate max-w-[120px]">{folderName}</span>
                            </span>
                        )}
                        {exam.tags && exam.tags.length > 0 && exam.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-medium bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-secondary)]">
                                #{tag}
                            </span>
                        ))}
                        {exam.tags && exam.tags.length > 2 && (
                            <span className="text-[10px] font-medium text-[var(--text-muted)] px-1">
                                +{exam.tags.length - 2}
                            </span>
                        )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-auto pt-3 border-t border-[var(--border-primary)] border-dashed">
                        <div className="flex items-center gap-1.5">
                            <i className="bi bi-calendar3 text-[10px]"></i>
                            <span>{new Date(exam.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-secondary)] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[10px]">
                                {totalQuestions} Butir Soal
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Action Controls */}
                <div className="border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-2 md:hidden">
                    <div className="grid grid-cols-3 gap-1.5">
                        <button 
                            onClick={() => onEdit(exam.id)} 
                            aria-label="Edit Ujian" 
                            title="Edit" 
                            className="app-control flex items-center justify-center gap-1.5 px-2 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-primary)] rounded-[var(--radius-control)] text-xs transition-colors"
                        >
                            <EditIcon className="text-blue-600 dark:text-blue-400" />
                            <span>Edit</span>
                        </button>
                        <button 
                            onClick={() => onPreview(exam.id)} 
                            aria-label="Cetak atau Preview Ujian" 
                            title="Preview" 
                            className="app-control flex items-center justify-center gap-1.5 px-2 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-primary)] rounded-[var(--radius-control)] text-xs transition-colors"
                        >
                            <PrinterIcon className="text-emerald-600 dark:text-emerald-400" />
                            <span>Cetak</span>
                        </button>
                        <button 
                            onClick={() => setIsActionsOpen(true)} 
                            aria-label="Menu Aksi Tambahan" 
                            title="Aksi Tambahan" 
                            className="app-control flex items-center justify-center gap-1.5 px-2 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold border border-[var(--border-primary)] rounded-[var(--radius-control)] text-xs transition-colors"
                        >
                            <MoreIcon />
                            <span>Menu</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Action Controls */}
                <div className="hidden md:grid bg-[var(--bg-tertiary)] p-1.5 grid-cols-8 gap-1 border-t border-[var(--border-primary)]">
                    <button onClick={() => onEdit(exam.id)} title="Edit Naskah Soal" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-blue-400 flex justify-center items-center transition-colors">
                        <EditIcon className="text-sm" />
                    </button>
                    <button onClick={() => onPreview(exam.id)} title="Pratinjau & Cetak / PDF" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-400 flex justify-center items-center transition-colors">
                        <PrinterIcon className="text-sm" />
                    </button>
                    <button onClick={() => onGeneratePackets(exam.id, exam.title)} title="Generator Paket Soal (A/B/C/D)" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-purple-600 dark:hover:text-purple-400 flex justify-center items-center transition-colors">
                        <StackIcon className="text-sm" />
                    </button>
                    <button onClick={() => onShuffle(exam.id)} title="Acak Cepat Sederhana" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-violet-600 dark:hover:text-violet-400 flex justify-center items-center transition-colors">
                        <ShuffleIcon className="text-sm" />
                    </button>
                    <button onClick={() => onCopy(exam.id)} title="Duplikat Ujian" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-amber-600 dark:hover:text-amber-400 flex justify-center items-center transition-colors">
                        <CopyIcon className="text-sm" />
                    </button>
                    <button onClick={() => onMove(exam.id)} title="Pindahkan ke Folder" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-orange-600 dark:hover:text-orange-400 flex justify-center items-center transition-colors">
                        <MoveIcon className="text-sm" />
                    </button>
                    <button onClick={() => onManageTags(exam.id)} title="Kelola Label (Tag)" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-pink-600 dark:hover:text-pink-400 flex justify-center items-center transition-colors">
                        <TagIcon className="text-sm" />
                    </button>
                    <button onClick={() => onDelete(exam.id)} title="Hapus Ujian" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 flex justify-center items-center transition-colors">
                        <TrashIcon className="text-sm" />
                    </button>
                </div>
            </div>

            {/* Mobile Actions Bottom Sheet */}
            {isActionsOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 md:hidden animate-fade-in" onClick={() => setIsActionsOpen(false)}>
                    <div className="w-full rounded-t-[24px] bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center py-2.5">
                            <div className="h-1.5 w-12 rounded-full bg-[var(--border-secondary)]"></div>
                        </div>
                        <div className="px-5 pb-2.5 border-b border-[var(--border-primary)] flex items-center justify-between">
                            <div className="min-w-0 pr-3">
                                <h4 className="text-base font-extrabold text-[var(--text-primary)] line-clamp-1">{exam.title}</h4>
                                <p className="text-xs text-[var(--text-secondary)]">{exam.subject} • {totalQuestions} Butir Soal</p>
                            </div>
                            <button onClick={() => setIsActionsOpen(false)} className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
                                <CloseIcon className="text-sm" />
                            </button>
                        </div>
                        <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
                            {actionItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        setIsActionsOpen(false);
                                        item.onClick();
                                    }}
                                    className="w-full app-control flex items-center gap-3 px-3.5 py-2.5 text-left rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0 ${item.tone}`}>
                                        <item.icon className="text-sm" />
                                    </div>
                                    <span className="font-semibold text-xs text-[var(--text-primary)]">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
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
        className={`app-control inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold whitespace-nowrap transition-all border ${
            isActive 
                ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] border-[var(--bg-accent)] shadow-xs' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'
        }`}
    >
        <Icon className={isActive ? 'text-[var(--text-on-accent)] text-xs' : 'text-[var(--text-muted)] text-xs'} />
        <span className="truncate max-w-[140px]">{label}</span>
        {isActive && onClear && (
            <span 
                onClick={onClear} 
                className="ml-1 p-0.5 hover:bg-black/20 rounded-full cursor-pointer transition-colors"
                title="Hapus filter"
            >
                <CloseIcon className="text-[10px]" />
            </span>
        )}
    </button>
);

const LoadingCard: React.FC = () => (
    <div className="app-surface rounded-[var(--radius-card)] border border-[var(--border-primary)] overflow-hidden">
        <div className="p-5 space-y-4 animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                    <div className="h-5 w-3/4 rounded bg-[var(--bg-muted)]"></div>
                    <div className="h-4 w-1/2 rounded bg-[var(--bg-muted)]"></div>
                </div>
                <div className="h-6 w-16 rounded-full bg-[var(--bg-muted)]"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-[var(--bg-muted)]"></div>
                <div className="h-6 w-20 rounded-full bg-[var(--bg-muted)]"></div>
            </div>
            <div className="h-4 w-2/3 rounded bg-[var(--bg-muted)]"></div>
        </div>
        <div className="border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-2.5">
            <div className="grid grid-cols-3 gap-2">
                <div className="h-9 rounded-[var(--radius-control)] bg-[var(--bg-muted)] animate-pulse"></div>
                <div className="h-9 rounded-[var(--radius-control)] bg-[var(--bg-muted)] animate-pulse"></div>
                <div className="h-9 rounded-[var(--radius-control)] bg-[var(--bg-muted)] animate-pulse"></div>
            </div>
        </div>
    </div>
);

const ITEMS_PER_PAGE = 12;
type SortOption = 'recent' | 'oldest' | 'title' | 'questions';
type StatusFilter = 'all' | 'published' | 'draft';

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
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Modals State
    const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
    const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
    const [isSortSelectorOpen, setIsSortSelectorOpen] = useState(false);
    const [isPacketGeneratorOpen, setIsPacketGeneratorOpen] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    
    // Packet Generator State
    const [packetGeneratorExamId, setPacketGeneratorExamId] = useState<string | null>(null);
    const [packetGeneratorExamTitle, setPacketGeneratorExamTitle] = useState('');

    // Create/Edit Folder State (Inside Selector)
    const [isEditingFolder, setIsEditingFolder] = useState(false);
    const [folderNameInput, setFolderNameInput] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

    // Tag Manager State
    const [targetExamId, setTargetExamId] = useState<string | null>(null);
    const [isTagExamModalOpen, setIsTagExamModalOpen] = useState(false);
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
    }, [selectedFolderId, debouncedSearchTerm, selectedTag, statusFilter]);

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
                if (folder) await saveFolder({ ...folder, name: folderNameInput.trim() });
            } else {
                await saveFolder({ id: crypto.randomUUID(), name: folderNameInput.trim(), createdAt: new Date().toISOString() });
            }
            setFolderNameInput('');
            setEditingFolderId(null);
            setIsEditingFolder(false);
            loadData();
            addToast('Folder berhasil disimpan.', 'success');
        } catch (e) { addToast('Gagal menyimpan folder.', 'error'); }
    };

    const handleDeleteFolder = (folderId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        showConfirm({
            title: 'Hapus Folder',
            content: 'Hapus folder ini? Ujian di dalamnya TIDAK akan terhapus dan akan menjadi Tanpa Folder.',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus Folder',
            onConfirm: async () => {
                try {
                    await deleteFolder(folderId);
                    if (selectedFolderId === folderId) setSelectedFolderId(null);
                    loadData();
                    addToast('Folder dihapus.', 'info');
                } catch (e) { addToast('Gagal menghapus folder.', 'error'); }
            }
        });
    };

    // --- Exam CRUD ---
    const handleDeleteExam = useCallback((id: string) => {
        showConfirm({
            title: 'Hapus Ujian',
            content: 'Yakin ingin menghapus ujian ini secara permanen?',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                await deleteExam(id);
                loadData();
                addToast('Ujian dihapus dari arsip.', 'success');
            }
        });
    }, [showConfirm, addToast, loadData]);

    const handleCopyExam = async (id: string) => { 
        await duplicateExam(id); 
        loadData(); 
        addToast('Ujian berhasil diduplikasi.', 'success'); 
    };

    const handleShuffleExam = async (id: string) => { 
        await shuffleExam(id); 
        loadData(); 
        addToast('Varian acak berhasil dibuat.', 'success'); 
    };
    
    // Packet Generator Handler
    const handleOpenPacketGenerator = (id: string, title: string) => {
        setPacketGeneratorExamId(id);
        setPacketGeneratorExamTitle(title);
        setIsPacketGeneratorOpen(true);
    };

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
            addToast('Label ujian disimpan.', 'success');
        }
        setIsTagExamModalOpen(false);
    };

    const handleGlobalDeleteTag = (tag: string, e: React.MouseEvent) => {
        e.stopPropagation();
        showConfirm({
            title: 'Hapus Label Global',
            content: `Hapus label "${tag}" dari semua ujian di arsip?`,
            confirmVariant: 'danger',
            confirmLabel: 'Hapus Label',
            onConfirm: async () => {
                await deleteGlobalTag(tag);
                if (selectedTag === tag) setSelectedTag('');
                loadData();
                addToast(`Label "${tag}" dihapus.`, 'info');
            }
        });
    };

    const handleGlobalRenameTag = async () => {
        if (!editingTagName || !renameTagInput.trim()) { setEditingTagName(null); return; }
        await renameGlobalTag(editingTagName, renameTagInput.trim());
        if (selectedTag === editingTagName) setSelectedTag(renameTagInput.trim());
        setEditingTagName(null);
        loadData();
        addToast('Label berhasil diubah namanya.', 'success');
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
            addToast('Ujian berhasil dipindahkan.', 'success');
        }
        setIsMoveModalOpen(false);
    };

    // Folder counts map
    const folderCountMap = useMemo(() => {
        const counts: Record<string, number> = { uncategorized: 0 };
        folders.forEach(f => { counts[f.id] = 0; });
        exams.forEach(e => {
            if (e.folderId && counts[e.folderId] !== undefined) {
                counts[e.folderId]++;
            } else {
                counts.uncategorized++;
            }
        });
        return counts;
    }, [exams, folders]);

    // Tag counts map
    const tagCountMap = useMemo(() => {
        const counts: Record<string, number> = {};
        exams.forEach(e => {
            e.tags?.forEach(t => {
                counts[t] = (counts[t] || 0) + 1;
            });
        });
        return counts;
    }, [exams]);

    // Total questions in archive
    const totalQuestionsInArchive = useMemo(() => {
        return exams.reduce((total, exam) => {
            return total + exam.sections.reduce((sTotal, s) => sTotal + s.questions.length, 0);
        }, 0);
    }, [exams]);

    // --- Filtered Data ---
    const filteredExams = useMemo(() => {
        const base = exams.filter(exam => {
            const searchLower = debouncedSearchTerm.toLowerCase();
            const matchesSearch = !debouncedSearchTerm || 
                exam.title.toLowerCase().includes(searchLower) || 
                (exam.subject && exam.subject.toLowerCase().includes(searchLower)) ||
                (exam.class && exam.class.toLowerCase().includes(searchLower)) ||
                (exam.tags && exam.tags.some(t => t.toLowerCase().includes(searchLower)));

            const matchesFolder = selectedFolderId === null 
                ? true 
                : selectedFolderId === 'uncategorized' 
                    ? !exam.folderId 
                    : exam.folderId === selectedFolderId;

            const matchesTag = !selectedTag || (exam.tags && exam.tags.includes(selectedTag));

            const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;

            return matchesSearch && matchesFolder && matchesTag && matchesStatus;
        });

        return base.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'title':
                    return a.title.localeCompare(b.title, 'id');
                case 'questions':
                    return b.sections.reduce((acc, s) => acc + s.questions.length, 0) - a.sections.reduce((acc, s) => acc + s.questions.length, 0);
                case 'recent':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
    }, [exams, debouncedSearchTerm, selectedFolderId, selectedTag, statusFilter, sortBy]);

    // --- Pagination Logic ---
    const paginatedExams = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExams.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredExams, currentPage]);

    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);

    const allUniqueTags = useMemo(() => {
        return Object.keys(tagCountMap).sort();
    }, [tagCountMap]);

    const selectedFolderName = selectedFolderId === null 
        ? 'Semua Folder' 
        : selectedFolderId === 'uncategorized' 
            ? 'Tanpa Folder' 
            : folders.find(f => f.id === selectedFolderId)?.name || 'Folder';

    const selectedSortLabel = {
        recent: 'Terbaru',
        oldest: 'Terlama',
        title: 'Nama A-Z',
        questions: 'Soal Terbanyak',
    }[sortBy];

    const hasActiveFilters = selectedFolderId !== null || !!selectedTag || statusFilter !== 'all' || !!debouncedSearchTerm;

    const handleClearAllFilters = () => {
        setSelectedFolderId(null);
        setSelectedTag('');
        setStatusFilter('all');
        setSearchTerm('');
    };

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col space-y-5 pb-8 px-1 sm:px-2 md:px-4 animate-fade-in">
            {/* Header Area styled identically to HelpView & CommunityView */}
            <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-accent)] mb-1">
                            <ArchiveIcon className="text-xs" />
                            <span>Penyimpanan & Manajemen Arsip</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Arsip Naskah Soal & Ujian
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            Kelola koleksi ujian, cari cepat, kategorikan dalam folder & label, atau buat varian paket acak.
                        </p>
                    </div>

                    {/* Create New Exam Action Button */}
                    <button 
                        onClick={onCreateExam} 
                        title="Buat Ujian Baru"
                        className="inline-flex items-center justify-center gap-2 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-bold py-2.5 px-4 rounded-[var(--radius-control)] shadow-xs transition-all flex-shrink-0 text-xs sm:text-sm"
                    >
                        <PlusIcon className="text-base" /> 
                        <span>Buat Ujian Baru</span>
                    </button>
                </div>

                {/* Quick Summary Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--border-primary)]">
                    <div className="flex items-center gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            <BookIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-[var(--text-muted)] font-medium leading-none">Total Ujian</div>
                            <div className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] mt-0.5">{exams.length} Berkas</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            <CheckCircleIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-[var(--text-muted)] font-medium leading-none">Total Soal</div>
                            <div className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] mt-0.5">{totalQuestionsInArchive} Butir</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            <FolderIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-[var(--text-muted)] font-medium leading-none">Folder Aktif</div>
                            <div className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] mt-0.5">{folders.length} Folder</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            <TagIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-[var(--text-muted)] font-medium leading-none">Label / Tag</div>
                            <div className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] mt-0.5">{allUniqueTags.length} Label</div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="space-y-2.5 pt-1">
                    {/* Search Input */}
                    <div className="relative w-full">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                        <input
                            type="text"
                            placeholder="Cari judul ujian, mata pelajaran, kelas, atau label..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--bg-accent)] transition-all shadow-xs"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                                title="Hapus pencarian"
                            >
                                <CloseIcon className="text-xs" />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills Bar */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            {/* Folder Filter Pill */}
                            <FilterPill 
                                label={selectedFolderName} 
                                icon={selectedFolderId === 'uncategorized' ? FolderIcon : FolderOpenIcon}
                                isActive={selectedFolderId !== null} 
                                onClick={() => setIsFolderSelectorOpen(true)}
                                onClear={(e) => { e.stopPropagation(); setSelectedFolderId(null); }}
                            />

                            {/* Tag Filter Pill */}
                            <FilterPill 
                                label={selectedTag ? `#${selectedTag}` : 'Semua Label'} 
                                icon={TagIcon}
                                isActive={!!selectedTag} 
                                onClick={() => setIsTagSelectorOpen(true)}
                                onClear={(e) => { e.stopPropagation(); setSelectedTag(''); }}
                            />

                            {/* Status Filter Segment */}
                            <div className="inline-flex items-center p-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs font-semibold">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-all ${
                                        statusFilter === 'all' 
                                            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs' 
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setStatusFilter('published')}
                                    className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-all ${
                                        statusFilter === 'published' 
                                            ? 'bg-emerald-500 text-white shadow-xs' 
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Selesai
                                </button>
                                <button
                                    onClick={() => setStatusFilter('draft')}
                                    className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-all ${
                                        statusFilter === 'draft' 
                                            ? 'bg-amber-500 text-white shadow-xs' 
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Draf
                                </button>
                            </div>

                            {/* Sort Filter Pill */}
                            <FilterPill 
                                label={selectedSortLabel}
                                icon={FunnelIcon}
                                isActive={sortBy !== 'recent'}
                                onClick={() => setIsSortSelectorOpen(true)}
                                onClear={(e) => { e.stopPropagation(); setSortBy('recent'); }}
                            />
                        </div>

                        {/* Clear All Filters Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearAllFilters}
                                className="text-xs font-semibold text-[var(--text-accent)] hover:underline whitespace-nowrap px-1"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content: Exam Cards Grid or Empty State */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        {Array.from({ length: 6 }).map((_, idx) => <LoadingCard key={idx} />)}
                    </div>
                ) : filteredExams.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                            <span>Menampilkan <strong className="text-[var(--text-primary)]">{filteredExams.length}</strong> naskah ujian</span>
                            {totalPages > 1 && (
                                <span>Halaman {currentPage} dari {totalPages}</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 min-[580px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                            {paginatedExams.map(exam => {
                                const folder = folders.find(f => f.id === exam.folderId);
                                return (
                                    <ExamCard 
                                        key={exam.id}
                                        exam={exam}
                                        folderName={folder?.name}
                                        totalQuestions={exam.sections.reduce((acc, s) => acc + s.questions.length, 0)}
                                        onEdit={onEditExam} 
                                        onDelete={handleDeleteExam} 
                                        onCopy={handleCopyExam}
                                        onShuffle={handleShuffleExam} 
                                        onGeneratePackets={handleOpenPacketGenerator} 
                                        onPreview={onPreviewExam}
                                        onManageTags={openTagModal} 
                                        onMove={openMoveModal}
                                    />
                                );
                            })}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 py-4">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] disabled:opacity-40 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm transition-colors shadow-xs"
                                    title="Halaman Sebelumnya"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const pageNum = idx + 1;
                                        // Show first, last, and pages around current
                                        if (
                                            pageNum === 1 || 
                                            pageNum === totalPages || 
                                            Math.abs(pageNum - currentPage) <= 1
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-[var(--radius-control)] text-xs font-bold transition-all ${
                                                        currentPage === pageNum
                                                            ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-xs'
                                                            : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === 2 && currentPage > 3 ||
                                            pageNum === totalPages - 1 && currentPage < totalPages - 2
                                        ) {
                                            return <span key={pageNum} className="px-1 text-[var(--text-muted)] text-xs">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] disabled:opacity-40 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm transition-colors shadow-xs"
                                    title="Halaman Berikutnya"
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Refined Empty State matching Help & Community design */
                    <div className="app-surface p-10 sm:p-14 rounded-[var(--radius-card)] border border-dashed border-[var(--border-secondary)] text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-2xl text-[var(--text-accent)] shadow-xs">
                            <FolderOpenIcon />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                {hasActiveFilters ? 'Tidak Ada Ujian yang Cocok' : 'Belum Ada Ujian di Arsip'}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                {hasActiveFilters 
                                    ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter folder/label yang aktif.'
                                    : 'Mulai buat naskah soal pertama Anda dengan editor interaktif SoalGenius.'
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            {hasActiveFilters ? (
                                <button
                                    onClick={handleClearAllFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors shadow-xs"
                                >
                                    <CloseIcon className="text-xs" />
                                    <span>Bersihkan Filter</span>
                                </button>
                            ) : (
                                <button
                                    onClick={onCreateExam}
                                    className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--bg-accent)] px-4 py-2 text-xs font-bold text-[var(--text-on-accent)] hover:bg-[var(--bg-accent-hover)] transition-all shadow-xs"
                                >
                                    <PlusIcon className="text-sm" />
                                    <span>Buat Ujian Baru</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS (Retouched for unified surface styling) --- */}

            {/* 1. Folder Selector & Manager Modal */}
            {isFolderSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up sm:animate-scale-in">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-tertiary)] sm:rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <FolderIcon className="text-amber-500 text-base" />
                                <h3 className="font-extrabold text-base text-[var(--text-primary)]">Kelola & Pilih Folder</h3>
                            </div>
                            <button onClick={() => setIsFolderSelectorOpen(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)]">
                                <CloseIcon className="text-xs" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-grow space-y-2">
                            {/* Create New / Edit Input */}
                            <div className="mb-3">
                                {isEditingFolder ? (
                                    <div className="flex items-center gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                                        <input 
                                            autoFocus 
                                            type="text" 
                                            value={folderNameInput} 
                                            onChange={e => setFolderNameInput(e.target.value)}
                                            className="flex-grow p-1.5 text-xs rounded border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                            placeholder="Nama folder baru..."
                                            onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
                                        />
                                        <button onClick={handleSaveFolder} className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] p-1.5 rounded hover:bg-[var(--bg-accent-hover)] transition-colors" title="Simpan">
                                            <CheckIcon className="text-xs" />
                                        </button>
                                        <button onClick={() => { setIsEditingFolder(false); setEditingFolderId(null); setFolderNameInput(''); }} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="Batal">
                                            <CloseIcon className="text-xs" />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditingFolder(true)} 
                                        className="w-full py-2.5 px-3 border border-dashed border-[var(--border-secondary)] rounded-[var(--radius-control)] text-xs text-[var(--text-accent)] hover:bg-[var(--bg-hover)] font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="text-sm" /> 
                                        <span>Tambah Folder Baru</span>
                                    </button>
                                )}
                            </div>

                            {/* Standard Options */}
                            <button 
                                onClick={() => { setSelectedFolderId(null); setIsFolderSelectorOpen(false); }} 
                                className={`w-full text-left p-2.5 rounded-[var(--radius-control)] flex items-center justify-between text-xs transition-colors ${
                                    selectedFolderId === null 
                                        ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold shadow-xs' 
                                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FolderOpenIcon className="text-sm" /> 
                                    <span>Semua Ujian</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedFolderId === null ? 'bg-white/20 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                                    {exams.length}
                                </span>
                            </button>

                            <button 
                                onClick={() => { setSelectedFolderId('uncategorized'); setIsFolderSelectorOpen(false); }} 
                                className={`w-full text-left p-2.5 rounded-[var(--radius-control)] flex items-center justify-between text-xs transition-colors ${
                                    selectedFolderId === 'uncategorized' 
                                        ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold shadow-xs' 
                                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FolderIcon className="text-sm opacity-60" /> 
                                    <span>Tanpa Folder</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedFolderId === 'uncategorized' ? 'bg-white/20 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                                    {folderCountMap.uncategorized || 0}
                                </span>
                            </button>

                            <div className="border-t border-[var(--border-primary)] my-2"></div>

                            {/* Dynamic Folders */}
                            <div className="space-y-1">
                                {folders.map(f => {
                                    const isSelected = selectedFolderId === f.id;
                                    const count = folderCountMap[f.id] || 0;
                                    return (
                                        <div 
                                            key={f.id} 
                                            className={`group flex items-center justify-between p-2 rounded-[var(--radius-control)] transition-colors ${
                                                isSelected ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <button 
                                                onClick={() => { setSelectedFolderId(f.id); setIsFolderSelectorOpen(false); }} 
                                                className="flex items-center gap-2.5 flex-grow text-left truncate text-xs min-w-0 pr-2"
                                            >
                                                <FolderIcon className="text-amber-500 text-sm flex-shrink-0" /> 
                                                <span className="truncate">{f.name}</span>
                                                <span className="text-[10px] text-[var(--text-muted)] font-normal">({count})</span>
                                            </button>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingFolderId(f.id); setFolderNameInput(f.name); setIsEditingFolder(true); }} 
                                                    className="p-1 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-[var(--bg-primary)] rounded transition-colors"
                                                    title="Ubah nama folder"
                                                >
                                                    <EditIcon className="text-xs" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteFolder(f.id, e)} 
                                                    className="p-1 text-[var(--text-secondary)] hover:text-rose-600 hover:bg-[var(--bg-primary)] rounded transition-colors"
                                                    title="Hapus folder"
                                                >
                                                    <TrashIcon className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {folders.length === 0 && (
                                    <p className="text-center text-xs text-[var(--text-muted)] py-4">Belum ada folder kustom.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Tag Selector & Manager Modal */}
            {isTagSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up sm:animate-scale-in">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-tertiary)] sm:rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <TagIcon className="text-pink-500 text-base" />
                                <h3 className="font-extrabold text-base text-[var(--text-primary)]">Filter & Kelola Label</h3>
                            </div>
                            <button onClick={() => setIsTagSelectorOpen(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)]">
                                <CloseIcon className="text-xs" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-grow space-y-2">
                            <button 
                                onClick={() => { setSelectedTag(''); setIsTagSelectorOpen(false); }} 
                                className={`w-full text-left p-2.5 rounded-[var(--radius-control)] text-xs transition-colors flex items-center justify-between ${
                                    !selectedTag 
                                        ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold shadow-xs' 
                                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                                }`}
                            >
                                <span>Semua Label</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${!selectedTag ? 'bg-white/20 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                                    {exams.length}
                                </span>
                            </button>
                            
                            <div className="border-t border-[var(--border-primary)] my-2"></div>

                            <div className="space-y-1">
                                {allUniqueTags.map(tag => {
                                    const isSelected = selectedTag === tag;
                                    const count = tagCountMap[tag] || 0;
                                    return (
                                        <div key={tag} className="flex items-center justify-between group p-1.5 rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)]">
                                            {editingTagName === tag ? (
                                                <div className="flex items-center gap-2 flex-grow">
                                                    <input 
                                                        autoFocus 
                                                        type="text" 
                                                        value={renameTagInput} 
                                                        onChange={e => setRenameTagInput(e.target.value)} 
                                                        className="w-full p-1.5 text-xs rounded border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)]" 
                                                        onKeyDown={e => e.key === 'Enter' && handleGlobalRenameTag()} 
                                                    />
                                                    <button onClick={handleGlobalRenameTag} className="p-1 text-emerald-600 hover:bg-[var(--bg-primary)] rounded">
                                                        <CheckIcon className="text-xs" />
                                                    </button>
                                                    <button onClick={() => setEditingTagName(null)} className="p-1 text-rose-500 hover:bg-[var(--bg-primary)] rounded">
                                                        <CloseIcon className="text-xs" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedTag(tag); setIsTagSelectorOpen(false); }} 
                                                        className={`flex-grow text-left flex items-center justify-between text-xs pr-2 truncate ${
                                                            isSelected ? 'font-bold text-[var(--text-accent)]' : 'text-[var(--text-primary)]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <TagIcon className="text-xs text-pink-500 flex-shrink-0" />
                                                            <span className="truncate">#{tag}</span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--text-muted)] font-normal ml-2">({count})</span>
                                                    </button>
                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingTagName(tag); setRenameTagInput(tag); }} 
                                                            className="p-1 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-blue-600 rounded"
                                                            title="Ubah nama label"
                                                        >
                                                            <EditIcon className="text-xs" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleGlobalDeleteTag(tag, e)} 
                                                            className="p-1 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-rose-600 rounded"
                                                            title="Hapus label dari semua ujian"
                                                        >
                                                            <TrashIcon className="text-xs" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                {allUniqueTags.length === 0 && (
                                    <p className="text-center text-xs text-[var(--text-muted)] py-4">Belum ada label dibuat.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Sort Selector Modal */}
            {isSortSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-full sm:w-[380px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-slide-up sm:animate-scale-in">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-tertiary)] sm:rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="text-[var(--text-accent)] text-base" />
                                <h3 className="font-extrabold text-base text-[var(--text-primary)]">Urutan Tampilan Arsip</h3>
                            </div>
                            <button onClick={() => setIsSortSelectorOpen(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)]">
                                <CloseIcon className="text-xs" />
                            </button>
                        </div>
                        <div className="p-4 space-y-1.5">
                            {[
                                { id: 'recent', label: 'Terbaru terlebih dahulu' },
                                { id: 'oldest', label: 'Terlama terlebih dahulu' },
                                { id: 'title', label: 'Nama Ujian (A-Z)' },
                                { id: 'questions', label: 'Jumlah butir soal terbanyak' },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => { setSortBy(option.id as SortOption); setIsSortSelectorOpen(false); }}
                                    className={`w-full text-left p-3 rounded-[var(--radius-control)] text-xs transition-colors flex items-center justify-between ${
                                        sortBy === option.id 
                                            ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] font-bold shadow-xs' 
                                            : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {sortBy === option.id && <CheckIcon className="text-sm" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Move Exam Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-2 mb-3">
                            <MoveIcon className="text-orange-500 text-lg" />
                            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Pindahkan ke Folder</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-4">Pilih folder tujuan untuk berkas ujian ini:</p>
                        
                        <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
                            <button 
                                onClick={() => handleMoveExam(null)} 
                                className="w-full text-left px-3 py-2.5 rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] flex items-center gap-2.5 font-medium transition-colors"
                            >
                                <FolderIcon className="opacity-50 text-sm" /> 
                                <span>Tanpa Folder (Lepas dari folder)</span>
                            </button>
                            {folders.map(f => (
                                <button 
                                    key={f.id} 
                                    onClick={() => handleMoveExam(f.id)} 
                                    className="w-full text-left px-3 py-2.5 rounded-[var(--radius-control)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-primary)] flex items-center gap-2.5 font-medium transition-colors"
                                >
                                    <FolderIcon className="text-amber-500 text-sm" /> 
                                    <span className="truncate">{f.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-[var(--border-primary)]">
                            <button 
                                onClick={() => setIsMoveModalOpen(false)} 
                                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-control)] transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Tag Modal (Single Exam) */}
            {isTagExamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-2 mb-2">
                            <TagIcon className="text-pink-500 text-lg" />
                            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Kelola Label Ujian</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-4">Tambahkan label pengelompokan (misal: PAS, PTS, Ulangan Harian):</p>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={tagInput} 
                                onChange={e => setTagInput(e.target.value)}
                                placeholder="Ketik label lalu tekan Enter..."
                                className="flex-grow p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                onKeyDown={e => { 
                                    if (e.key === 'Enter' && tagInput.trim()) { 
                                        const clean = tagInput.trim().replace(/^#/, '');
                                        if (!currentExamTags.includes(clean)) {
                                            setCurrentExamTags([...currentExamTags, clean]);
                                        }
                                        setTagInput(''); 
                                    } 
                                }}
                            />
                            <button 
                                onClick={() => { 
                                    if (tagInput.trim()) { 
                                        const clean = tagInput.trim().replace(/^#/, '');
                                        if (!currentExamTags.includes(clean)) {
                                            setCurrentExamTags([...currentExamTags, clean]);
                                        }
                                        setTagInput(''); 
                                    } 
                                }} 
                                className="bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] px-3 py-2 rounded-[var(--radius-control)] text-xs font-bold transition-colors"
                            >
                                <PlusIcon />
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-5 min-h-[48px] p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] max-h-36 overflow-y-auto">
                            {currentExamTags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-pink-500/20">
                                    #{tag}
                                    <button 
                                        onClick={() => setCurrentExamTags(currentExamTags.filter(t => t !== tag))} 
                                        className="hover:text-rose-500 rounded-full p-0.5 ml-0.5"
                                        title="Hapus label"
                                    >
                                        <CloseIcon className="text-[10px]" />
                                    </button>
                                </span>
                            ))}
                            {currentExamTags.length === 0 && (
                                <p className="text-xs text-[var(--text-muted)] italic self-center">Belum ada label pada ujian ini.</p>
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-primary)]">
                            <button 
                                onClick={() => setIsTagExamModalOpen(false)} 
                                className="px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-control)] transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSaveTags} 
                                className="px-4 py-2 text-xs font-bold bg-[var(--bg-accent)] text-[var(--text-on-accent)] hover:bg-[var(--bg-accent-hover)] rounded-[var(--radius-control)] transition-all shadow-xs"
                            >
                                Simpan Label
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Packet Generator Modal */}
            <PacketGeneratorModal 
                isOpen={isPacketGeneratorOpen}
                onClose={() => setIsPacketGeneratorOpen(false)}
                examId={packetGeneratorExamId}
                examTitle={packetGeneratorExamTitle}
                onSuccess={loadData}
            />
        </div>
    );
};

export default ArchiveView;

