import React, { useState, useEffect, useMemo } from 'react';
import type { Question, QuestionPackage, BankQuestion, Exam } from '../types';
import { QuestionType } from '../types';
import { 
    GlobeIcon, SparklesIcon, CloudDownloadIcon, PlusIcon, 
    SearchIcon, CheckIcon, EyeIcon, TagIcon, TrashIcon, 
    FolderIcon, StackIcon, CheckCircleIcon, ArrowLeftIcon, CloseIcon,
    FunnelIcon, ShuffleIcon
} from '../components/Icons';
import { STARTER_COMMUNITY_PACKAGES, downloadPackageFile, parsePackageFile } from '../lib/questionPackageService';
import { getBankQuestions, saveMultipleQuestionsToBank, saveExam } from '../lib/storage';
import { sanitizeRichHtml, stripHtml } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';

interface CommunityViewProps {
    onEditExam?: (id: string) => void;
    onNavigateToBank?: () => void;
}

const PRESET_CURRICULUMS = [
    'Kurikulum Merdeka',
    'Kemenag / Madrasah',
    'Kurikulum 2013 (K13)',
    'Cambridge / Internasional',
    'CUSTOM'
];

const CommunityView: React.FC<CommunityViewProps> = ({ onEditExam, onNavigateToBank }) => {
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    const [activeTab, setActiveTab] = useState<'preset' | 'export' | 'import'>('preset');
    const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCurriculumFilter, setSelectedCurriculumFilter] = useState('ALL');

    // Preview state
    const [previewPackage, setPreviewPackage] = useState<QuestionPackage | null>(null);

    // Export State Form
    const [exportTitle, setExportTitle] = useState('Paket Soal Kolaborasi MGMP - ' + new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    const [exportSubject, setExportSubject] = useState('');
    const [exportGrade, setExportGrade] = useState('');
    const [exportCurriculum, setExportCurriculum] = useState('Kurikulum Merdeka');
    const [customCurriculum, setCustomCurriculum] = useState('');
    const [exportAuthor, setExportAuthor] = useState('');
    const [exportInstitution, setExportInstitution] = useState('');
    const [exportDescription, setExportDescription] = useState('');
    const [selectedExportBankIds, setSelectedExportBankIds] = useState<Set<string>>(new Set());

    // Export Filters
    const [exportSearchTerm, setExportSearchTerm] = useState('');
    const [exportSubjectFilter, setExportSubjectFilter] = useState('');
    const [exportClassFilter, setExportClassFilter] = useState('');
    const [exportTypeFilter, setExportTypeFilter] = useState('');

    // Import State
    const [importedPackage, setImportedPackage] = useState<QuestionPackage | null>(null);
    const [selectedImportQuestionIds, setSelectedImportQuestionIds] = useState<Set<string>>(new Set());
    const [importSearchTerm, setImportSearchTerm] = useState('');
    const [importTypeFilter, setImportTypeFilter] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Load bank questions for export
    const loadBank = async () => {
        const data = await getBankQuestions();
        setBankQuestions(data);
    };

    useEffect(() => {
        loadBank();
    }, []);

    // Filter preset packages
    const filteredPresets = useMemo(() => {
        return STARTER_COMMUNITY_PACKAGES.filter(pkg => {
            const matchesSearch = !searchQuery.trim() || 
                pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCurriculum = selectedCurriculumFilter === 'ALL' || pkg.curriculum === selectedCurriculumFilter;

            return matchesSearch && matchesCurriculum;
        });
    }, [searchQuery, selectedCurriculumFilter]);

    // Unique values for Export filters
    const { uniqueExportSubjects, uniqueExportClasses, uniqueExportTypes } = useMemo(() => {
        const subjects = new Set<string>();
        const classes = new Set<string>();
        const types = new Set<string>();

        bankQuestions.forEach(bq => {
            if (bq.subject) subjects.add(bq.subject);
            if (bq.class) classes.add(bq.class);
            if (bq.question?.type) types.add(bq.question.type);
        });

        return {
            uniqueExportSubjects: Array.from(subjects).sort(),
            uniqueExportClasses: Array.from(classes).sort(),
            uniqueExportTypes: Array.from(types).sort()
        };
    }, [bankQuestions]);

    // Filtered Bank Questions for Export
    const filteredExportQuestions = useMemo(() => {
        return bankQuestions.filter(bq => {
            const matchesSearch = !exportSearchTerm.trim() || 
                (bq.question.text && bq.question.text.toLowerCase().includes(exportSearchTerm.toLowerCase())) ||
                (bq.subject && bq.subject.toLowerCase().includes(exportSearchTerm.toLowerCase()));

            const matchesSubject = !exportSubjectFilter || bq.subject === exportSubjectFilter;
            const matchesClass = !exportClassFilter || bq.class === exportClassFilter;
            const matchesType = !exportTypeFilter || bq.question.type === exportTypeFilter;

            return matchesSearch && matchesSubject && matchesClass && matchesType;
        });
    }, [bankQuestions, exportSearchTerm, exportSubjectFilter, exportClassFilter, exportTypeFilter]);

    // Unique values for Import filters
    const uniqueImportTypes = useMemo(() => {
        if (!importedPackage) return [];
        const types = new Set<string>();
        importedPackage.questions.forEach(q => {
            if (q.type) types.add(q.type);
        });
        return Array.from(types).sort();
    }, [importedPackage]);

    // Filtered Questions for Import
    const filteredImportQuestions = useMemo(() => {
        if (!importedPackage) return [];
        return importedPackage.questions.filter(q => {
            const matchesSearch = !importSearchTerm.trim() || 
                (q.text && q.text.toLowerCase().includes(importSearchTerm.toLowerCase()));
            const matchesType = !importTypeFilter || q.type === importTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [importedPackage, importSearchTerm, importTypeFilter]);

    // Handle Import Preset to Bank
    const handleImportPresetToBank = async (pkg: QuestionPackage) => {
        try {
            setIsProcessing(true);
            await saveMultipleQuestionsToBank(pkg.questions, {
                subject: pkg.subject || 'Umum',
                class: pkg.grade || 'Semua Kelas'
            });
            await loadBank();
            addToast(`Berhasil menambahkan ${pkg.questions.length} butir soal dari "${pkg.title}" ke Bank Soal Anda!`, 'success');
        } catch (e) {
            addToast('Gagal mengimpor paket soal ke bank.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Create New Exam from Package
    const handleCreateExamFromPackage = async (pkg: QuestionPackage) => {
        showConfirm({
            title: "Buat Ujian Baru dari Paket Soal",
            content: `Apakah Anda ingin membuat naskah ujian baru secara instan yang berisi seluruh ${pkg.questions.length} butir soal dari paket "${pkg.title}"?`,
            confirmLabel: "Buat Naskah Ujian",
            confirmVariant: "primary",
            onConfirm: async () => {
                try {
                    const newExam: Exam = {
                        id: crypto.randomUUID(),
                        title: pkg.title,
                        subject: pkg.subject,
                        class: pkg.grade || '',
                        date: new Date().toISOString().split('T')[0],
                        waktuUjian: '90 Menit',
                        keterangan: pkg.institution || 'Asesmen MGMP',
                        instructions: '1. Berdoalah sebelum mengerjakan soal.\n2. Jawablah pertanyaan dengan jujur, teliti, dan mandiri.',
                        sections: [{
                            id: crypto.randomUUID(),
                            instructions: 'I. Jawablah pertanyaan-pertanyaan berikut dengan tepat.',
                            questions: JSON.parse(JSON.stringify(pkg.questions))
                        }],
                        status: 'draft',
                        direction: 'ltr',
                        layoutColumns: 1,
                        tags: pkg.tags || ['MGMP']
                    };

                    await saveExam(newExam);
                    addToast(`Naskah ujian "${pkg.title}" berhasil dibuat!`, 'success');
                    if (onEditExam) {
                        onEditExam(newExam.id);
                    }
                } catch (e) {
                    addToast('Gagal membuat naskah ujian dari paket.', 'error');
                }
            }
        });
    };

    // Handle File Upload for Import
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const pkg = await parsePackageFile(file);
            setImportedPackage(pkg);
            const allIds = new Set<string>();
            pkg.questions.forEach(q => allIds.add(q.id));
            setSelectedImportQuestionIds(allIds);
            setImportSearchTerm('');
            setImportTypeFilter('');
            addToast(`Paket "${pkg.title}" berhasil dibaca (${pkg.questions.length} butir soal).`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Gagal membaca berkas paket.', 'error');
            setImportedPackage(null);
        } finally {
            setIsProcessing(false);
            e.target.value = '';
        }
    };

    // Handle Confirm Import from File
    const handleConfirmImportFile = async () => {
        if (!importedPackage) return;
        const questionsToSave = importedPackage.questions.filter(q => selectedImportQuestionIds.has(q.id));
        if (questionsToSave.length === 0) {
            addToast('Pilih minimal satu butir soal untuk diimpor.', 'warning');
            return;
        }

        try {
            setIsProcessing(true);
            await saveMultipleQuestionsToBank(questionsToSave, {
                subject: importedPackage.subject || 'Umum',
                class: importedPackage.grade || 'Semua Kelas'
            });
            await loadBank();
            addToast(`Berhasil mengimpor ${questionsToSave.length} butir soal ke Bank Soal!`, 'success');
            setImportedPackage(null);
        } catch (e) {
            addToast('Gagal menyimpan butir soal ke basis data.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Export Package to .sgpkg
    const handleExportPackage = () => {
        if (selectedExportBankIds.size === 0) {
            addToast('Pilih minimal satu butir soal dari bank untuk diekspor.', 'warning');
            return;
        }

        const effectiveCurriculum = exportCurriculum === 'CUSTOM'
            ? (customCurriculum.trim() || 'Kurikulum Kustom')
            : exportCurriculum;

        const selectedQuestions = bankQuestions
            .filter(bq => selectedExportBankIds.has(bq.bankId))
            .map(bq => bq.question);

        const pkg: QuestionPackage = {
            id: crypto.randomUUID(),
            title: exportTitle.trim() || 'Paket Bank Soal MGMP',
            subject: exportSubject.trim() || 'Umum',
            grade: exportGrade.trim() || 'Semua Kelas',
            curriculum: effectiveCurriculum,
            author: exportAuthor.trim() || 'Guru SoalGenius',
            institution: exportInstitution.trim() || 'MGMP',
            description: exportDescription.trim(),
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            questions: selectedQuestions,
            tags: [exportSubject, exportGrade, effectiveCurriculum].filter(Boolean)
        };

        downloadPackageFile(pkg);
        addToast(`Paket "${pkg.title}" (.sgpkg) berhasil diunduh! Siap dibagikan ke rekan guru.`, 'success');
    };

    // Auto-fill package info from selected questions
    const handleAutoFillFromSelection = () => {
        const selected = bankQuestions.filter(bq => selectedExportBankIds.has(bq.bankId));
        if (selected.length === 0) return;

        const firstSubject = selected.find(s => s.subject)?.subject;
        const firstClass = selected.find(s => s.class)?.class;

        if (firstSubject && !exportSubject) setExportSubject(firstSubject);
        if (firstClass && !exportGrade) setExportGrade(firstClass);
        if (firstSubject) {
            setExportTitle(`Paket Bank Soal ${firstSubject} ${firstClass ? `- ${firstClass}` : ''}`);
        }
        addToast('Identitas paket berhasil diselaraskan dengan soal terpilih!', 'info');
    };

    // Selection helpers for export
    const handleSelectAllFilteredExport = () => {
        setSelectedExportBankIds(prev => {
            const next = new Set(prev);
            filteredExportQuestions.forEach(bq => next.add(bq.bankId));
            return next;
        });
    };

    const handleDeselectAllFilteredExport = () => {
        setSelectedExportBankIds(prev => {
            const next = new Set(prev);
            filteredExportQuestions.forEach(bq => next.delete(bq.bankId));
            return next;
        });
    };

    const handleResetExportFilters = () => {
        setExportSearchTerm('');
        setExportSubjectFilter('');
        setExportClassFilter('');
        setExportTypeFilter('');
    };

    // Selection helpers for import
    const handleSelectAllFilteredImport = () => {
        setSelectedImportQuestionIds(prev => {
            const next = new Set(prev);
            filteredImportQuestions.forEach(q => next.add(q.id));
            return next;
        });
    };

    const handleDeselectAllFilteredImport = () => {
        setSelectedImportQuestionIds(prev => {
            const next = new Set(prev);
            filteredImportQuestions.forEach(q => next.delete(q.id));
            return next;
        });
    };

    const tabs: { id: 'preset' | 'export' | 'import'; label: string; sublabel: string; icon: React.ElementType }[] = [
        { id: 'preset', label: 'Koleksi Komunitas', sublabel: 'Paket bank soal siap pakai', icon: SparklesIcon },
        { id: 'export', label: 'Ekspor Paket (.sgpkg)', sublabel: 'Kemas soal lokal jadi berkas', icon: CloudDownloadIcon },
        { id: 'import', label: 'Impor Berkas (.sgpkg)', sublabel: 'Ekstrak & tambahkan ke bank', icon: PlusIcon },
    ];

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col space-y-5 pb-8 px-1 sm:px-2 md:px-4 animate-fade-in">
            {/* Header Area with Title, Navigation & Bank Link in Single Card */}
            <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-accent)] mb-1">
                            <i className="bi bi-people-fill text-xs"></i>
                            <span>Kolaborasi & Komunitas Guru</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Pusat Berbagi Soal MGMP
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            Pertukaran paket bank soal portabel (.sgpkg) untuk MGMP, KKG, dan rekan guru tanpa ketergantungan server.
                        </p>
                    </div>
                    {onNavigateToBank && (
                        <button
                            onClick={onNavigateToBank}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors shadow-xs flex-shrink-0"
                        >
                            <FolderIcon className="text-sm text-[var(--text-accent)]" />
                            <span>Buka Bank Soal Lokal</span>
                        </button>
                    )}
                </div>

                {/* Unified Horizontal Scrollable / Grid Tab Navigation */}
                <div className="app-tab-shell p-1 w-full overflow-x-auto no-scrollbar">
                    <div className="flex items-stretch gap-1 min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`app-tab-button flex items-center justify-start gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-left transition-all flex-shrink-0 ${
                                        isActive ? 'app-tab-button-active' : ''
                                    }`}
                                >
                                    <Icon className={`text-base flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                                    <div className="min-w-0">
                                        <div className="truncate font-bold leading-tight">{tab.label}</div>
                                        <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                            {tab.sublabel}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* TAB 1: PRESET PACKAGES */}
            {activeTab === 'preset' && (
                <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="app-surface p-3.5 sm:p-4 rounded-[var(--radius-card)] flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                            <input
                                type="text"
                                placeholder="Cari topik, mapel, atau kata kunci..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={selectedCurriculumFilter}
                                onChange={(e) => setSelectedCurriculumFilter(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--bg-accent)]"
                            >
                                <option value="ALL">Semua Kurikulum</option>
                                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                                <option value="Kemenag / Madrasah">Kemenag / Madrasah</option>
                            </select>
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredPresets.length === 0 && (
                        <div className="app-surface p-8 rounded-[var(--radius-card)] text-center space-y-2">
                            <p className="font-semibold text-xs text-[var(--text-secondary)]">Tidak ada paket soal yang cocok dengan pencarian.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCurriculumFilter('ALL'); }}
                                className="text-xs text-[var(--text-accent)] font-semibold hover:underline"
                            >
                                Reset Filter Pencarian
                            </button>
                        </div>
                    )}

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPresets.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] flex flex-col justify-between hover:border-[var(--border-secondary)] transition-all group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="app-status-pill app-status-info">
                                            {pkg.subject}
                                        </span>
                                        <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-[var(--radius-control)] border border-[var(--border-primary)]">
                                            {pkg.questions.length} Soal
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                                            {pkg.title}
                                        </h3>
                                        <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                                            <span>{pkg.grade}</span>
                                            <span>•</span>
                                            <span>{pkg.curriculum}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                                        {pkg.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {pkg.tags?.map((t, idx) => (
                                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[var(--border-primary)] space-y-2">
                                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                                        Penyusun: <strong className="text-[var(--text-secondary)]">{pkg.author}</strong> ({pkg.institution})
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPreviewPackage(pkg)}
                                            className="px-2.5 py-2 text-xs font-semibold rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors border border-[var(--border-primary)]"
                                        >
                                            <EyeIcon className="text-xs" />
                                            <span>Tinjau Butir</span>
                                        </button>

                                        <button
                                            onClick={() => handleImportPresetToBank(pkg)}
                                            disabled={isProcessing}
                                            className="px-2.5 py-2 text-xs font-semibold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                        >
                                            <PlusIcon className="text-xs" />
                                            <span>Impor ke Bank</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleCreateExamFromPackage(pkg)}
                                        className="w-full py-1.5 px-2.5 rounded-[var(--radius-control)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <StackIcon className="text-xs" />
                                        <span>Buat Naskah Ujian dari Paket Ini</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: EXPORT PACKAGE */}
            {activeTab === 'export' && (
                <div className="app-surface p-4 sm:p-5 rounded-[var(--radius-card)] space-y-5">
                    <div className="border-s-4 border-[var(--bg-accent)] ps-3 py-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base">
                                Ekspor Paket Bank Soal Portabel (.sgpkg)
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Pilih butir soal dari Bank Soal lokal Anda, gunakan filter pencarian cepat, dan unduh berkas .sgpkg untuk dibagikan.
                            </p>
                        </div>
                        {selectedExportBankIds.size > 0 && (
                            <button
                                onClick={handleAutoFillFromSelection}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-primary)] transition-colors w-fit"
                                title="Otomatis isi judul, mapel, dan kelas berdasarkan butir soal yang dicentang"
                            >
                                <SparklesIcon className="text-xs text-[var(--text-accent)]" />
                                <span>Sesuaikan Info dari Soal Terpilih</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="sm:col-span-2">
                            <label className="block font-bold text-[var(--text-primary)] mb-1">Judul Paket Soal *</label>
                            <input
                                type="text"
                                value={exportTitle}
                                onChange={(e) => setExportTitle(e.target.value)}
                                placeholder="Contoh: Paket Asesmen Sumatif Matematika Kelas 8"
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[var(--text-primary)] mb-1">Mata Pelajaran</label>
                            <input
                                type="text"
                                value={exportSubject}
                                onChange={(e) => setExportSubject(e.target.value)}
                                placeholder="Contoh: Matematika, Bahasa Indonesia"
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[var(--text-primary)] mb-1">Jenjang / Kelas / Fase</label>
                            <input
                                type="text"
                                value={exportGrade}
                                onChange={(e) => setExportGrade(e.target.value)}
                                placeholder="Contoh: Fase D / Kelas 8"
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[var(--text-primary)] mb-1">Kurikulum</label>
                            <select
                                value={exportCurriculum}
                                onChange={(e) => setExportCurriculum(e.target.value)}
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            >
                                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                                <option value="Kemenag / Madrasah">Kemenag / Madrasah</option>
                                <option value="Kurikulum 2013 (K13)">Kurikulum 2013 (K13)</option>
                                <option value="Cambridge / Internasional">Cambridge / Internasional</option>
                                <option value="CUSTOM">+ Lainnya (Kustom / Tulis Sendiri...)</option>
                            </select>

                            {exportCurriculum === 'CUSTOM' && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        value={customCurriculum}
                                        onChange={(e) => setCustomCurriculum(e.target.value)}
                                        placeholder="Ketik nama kurikulum kustom (misal: Kurikulum Muatan Lokal, Muadalah, IB, dll)"
                                        autoFocus
                                        className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--bg-accent)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none"
                                    />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Nama kurikulum kustom akan disimpan di dalam metadata paket berkas .sgpkg.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-[var(--text-primary)] mb-1">Nama Penyusun / Asal MGMP</label>
                            <input
                                type="text"
                                value={exportAuthor}
                                onChange={(e) => setExportAuthor(e.target.value)}
                                placeholder="Contoh: Tim MGMP Matematika Kab. Bandung"
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block font-semibold text-[var(--text-primary)] mb-1">Keterangan / Catatan Paket (Opsional)</label>
                            <input
                                type="text"
                                value={exportDescription}
                                onChange={(e) => setExportDescription(e.target.value)}
                                placeholder="Contoh: Berisi stimulus literasi dan numerasi asesmen akhir semester ganjil."
                                className="w-full p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                            />
                        </div>
                    </div>

                    {/* Question Selection & Filtering Toolbar */}
                    <div className="space-y-3 pt-2 border-t border-[var(--border-primary)]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                                    <span>Pilih Butir Soal untuk Paket</span>
                                    <span className="app-status-pill app-status-info text-[11px]">
                                        {selectedExportBankIds.size} / {bankQuestions.length} Terpilih
                                    </span>
                                </h4>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                    {filteredExportQuestions.length} butir soal cocok dengan filter pencarian di bawah.
                                </p>
                            </div>

                            {/* Selection Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                {filteredExportQuestions.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSelectAllFilteredExport}
                                            className="px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-primary)] transition-colors"
                                        >
                                            + Pilih Semua Hasil Filter ({filteredExportQuestions.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAllFilteredExport}
                                            className="px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold border border-[var(--border-primary)] transition-colors"
                                        >
                                            - Batal Filter
                                        </button>
                                    </>
                                )}
                                {bankQuestions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedExportBankIds.size === bankQuestions.length) {
                                                setSelectedExportBankIds(new Set());
                                            } else {
                                                setSelectedExportBankIds(new Set(bankQuestions.map(bq => bq.bankId)));
                                            }
                                        }}
                                        className="text-xs text-[var(--text-accent)] font-semibold hover:underline px-1"
                                    >
                                        {selectedExportBankIds.size === bankQuestions.length ? 'Batal Semua Soal' : 'Pilih Semua Bank'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Filter Bar */}
                        <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="relative">
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
                                <input
                                    type="text"
                                    placeholder="Cari teks soal..."
                                    value={exportSearchTerm}
                                    onChange={e => setExportSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                />
                            </div>

                            <div>
                                <select
                                    value={exportSubjectFilter}
                                    onChange={e => setExportSubjectFilter(e.target.value)}
                                    className="w-full p-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                >
                                    <option value="">Semua Mapel ({uniqueExportSubjects.length})</option>
                                    {uniqueExportSubjects.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <select
                                    value={exportClassFilter}
                                    onChange={e => setExportClassFilter(e.target.value)}
                                    className="w-full p-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                >
                                    <option value="">Semua Kelas ({uniqueExportClasses.length})</option>
                                    {uniqueExportClasses.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-1.5">
                                <select
                                    value={exportTypeFilter}
                                    onChange={e => setExportTypeFilter(e.target.value)}
                                    className="flex-1 p-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                >
                                    <option value="">Semua Tipe Soal</option>
                                    {uniqueExportTypes.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>

                                {(exportSearchTerm || exportSubjectFilter || exportClassFilter || exportTypeFilter) && (
                                    <button
                                        type="button"
                                        onClick={handleResetExportFilters}
                                        title="Reset Filter"
                                        className="p-1.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-primary)]"
                                    >
                                        <CloseIcon className="text-xs" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List of Bank Questions */}
                        <div className="max-h-80 overflow-y-auto border border-[var(--border-primary)] rounded-[var(--radius-control)] divide-y divide-[var(--border-primary)] bg-[var(--bg-primary)] custom-scrollbar">
                            {bankQuestions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                                    <p className="font-semibold text-[var(--text-secondary)]">Bank Soal lokal Anda masih kosong.</p>
                                    <p className="text-[11px]">Simpan soal dari Editor Naskah Ujian atau impor paket dari Koleksi Komunitas terlebih dahulu.</p>
                                </div>
                            ) : filteredExportQuestions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                                    <p className="font-semibold text-[var(--text-secondary)]">Tidak ada butir soal yang cocok dengan filter.</p>
                                    <button
                                        type="button"
                                        onClick={handleResetExportFilters}
                                        className="text-xs text-[var(--text-accent)] font-semibold hover:underline"
                                    >
                                        Reset Filter Pencarian
                                    </button>
                                </div>
                            ) : (
                                filteredExportQuestions.map((bq) => {
                                    const isSelected = selectedExportBankIds.has(bq.bankId);
                                    return (
                                        <label
                                            key={bq.bankId}
                                            className={`flex items-start gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer text-xs transition-colors ${
                                                isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    setSelectedExportBankIds(prev => {
                                                        const next = new Set(prev);
                                                        next.has(bq.bankId) ? next.delete(bq.bankId) : next.add(bq.bankId);
                                                        return next;
                                                    });
                                                }}
                                                className="mt-0.5 h-4 w-4 rounded accent-[var(--bg-accent)] cursor-pointer"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                                                        {bq.question.type}
                                                    </span>
                                                    <span className="font-bold text-[var(--text-primary)]">{bq.subject || 'Umum'}</span>
                                                    <span className="text-[var(--text-muted)]">• {bq.class || 'Semua Kelas'}</span>
                                                </div>
                                                <p className="text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                                    {stripHtml(bq.question.text) || '(Soal Tanpa Teks / Gambar)'}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                            <strong>{selectedExportBankIds.size}</strong> butir soal siap dikemas ke dalam berkas <code>.sgpkg</code>.
                        </span>
                        <button
                            onClick={handleExportPackage}
                            disabled={selectedExportBankIds.size === 0}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all"
                        >
                            <CloudDownloadIcon className="text-sm" />
                            <span>Unduh Berkas Paket (.sgpkg)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: IMPORT PACKAGE */}
            {activeTab === 'import' && (
                <div className="app-surface p-4 sm:p-5 space-y-5">
                    {!importedPackage ? (
                        <div className="border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--border-secondary)] rounded-[var(--radius-card)] p-8 text-center bg-[var(--bg-primary)] transition-colors">
                            <div className="w-12 h-12 mx-auto rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] flex items-center justify-center mb-3">
                                <CloudDownloadIcon className="text-xl" />
                            </div>
                            <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1">
                                Unggah Berkas Paket Soal (.sgpkg atau .json)
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-4 leading-relaxed">
                                Terima berkas dari rekan MGMP melalui WhatsApp, Flashdisk, atau Google Drive? Unggah di sini untuk ditinjau dan dimasukkan ke Bank Soal lokal.
                            </p>
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-semibold cursor-pointer shadow-xs transition-all">
                                <span>Pilih Berkas (.sgpkg)</span>
                                <input
                                    type="file"
                                    accept=".sgpkg,.json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <span className="app-status-pill app-status-info">
                                        {importedPackage.subject || 'Umum'} • {importedPackage.grade || 'Semua'}
                                    </span>
                                    <h3 className="font-bold text-base text-[var(--text-primary)] mt-1.5">
                                        {importedPackage.title}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                        Penyusun: <strong>{importedPackage.author || 'Komunitas'}</strong> {importedPackage.institution ? `(${importedPackage.institution})` : ''} • Kurikulum: <strong>{importedPackage.curriculum || 'Kurikulum Merdeka'}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setImportedPackage(null)}
                                    className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                                >
                                    Ganti Berkas Lain
                                </button>
                            </div>

                            {/* Select Questions & Filter Toolbar */}
                            <div className="space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
                                        <span>Pilih Butir Soal untuk Diimpor</span>
                                        <span className="app-status-pill app-status-info text-[11px]">
                                            {selectedImportQuestionIds.size} / {importedPackage.questions.length} Terpilih
                                        </span>
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {filteredImportQuestions.length > 0 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllFilteredImport}
                                                    className="px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-primary)] transition-colors"
                                                >
                                                    + Pilih Semua Tampil ({filteredImportQuestions.length})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDeselectAllFilteredImport}
                                                    className="px-2.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold border border-[var(--border-primary)] transition-colors"
                                                >
                                                    - Batal Tampil
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (selectedImportQuestionIds.size === importedPackage.questions.length) {
                                                    setSelectedImportQuestionIds(new Set());
                                                } else {
                                                    setSelectedImportQuestionIds(new Set(importedPackage.questions.map(q => q.id)));
                                                }
                                            }}
                                            className="text-xs text-[var(--text-accent)] font-semibold hover:underline px-1"
                                        >
                                            {selectedImportQuestionIds.size === importedPackage.questions.length ? 'Batal Semua' : 'Pilih Semua Paket'}
                                        </button>
                                    </div>
                                </div>

                                {/* Filter inputs for Import */}
                                <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
                                        <input
                                            type="text"
                                            placeholder="Cari teks butir soal paket..."
                                            value={importSearchTerm}
                                            onChange={e => setImportSearchTerm(e.target.value)}
                                            className="w-full pl-8 pr-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={importTypeFilter}
                                            onChange={e => setImportTypeFilter(e.target.value)}
                                            className="w-full p-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)]"
                                        >
                                            <option value="">Semua Tipe Soal</option>
                                            {uniqueImportTypes.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto border border-[var(--border-primary)] rounded-[var(--radius-control)] divide-y divide-[var(--border-primary)] bg-[var(--bg-primary)] custom-scrollbar">
                                    {filteredImportQuestions.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                                            Tidak ada butir soal yang cocok dengan filter pencarian.
                                        </div>
                                    ) : (
                                        filteredImportQuestions.map((q, idx) => {
                                            const isSelected = selectedImportQuestionIds.has(q.id);
                                            return (
                                                <label
                                                    key={q.id || idx}
                                                    className={`flex items-start gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer text-xs transition-colors ${
                                                        isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setSelectedImportQuestionIds(prev => {
                                                                const next = new Set(prev);
                                                                next.has(q.id) ? next.delete(q.id) : next.add(q.id);
                                                                return next;
                                                            });
                                                        }}
                                                        className="mt-0.5 h-4 w-4 rounded accent-[var(--bg-accent)] cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-[var(--text-accent)]">#{idx + 1}</span>
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                                                                {q.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                                                            {stripHtml(q.text) || '(Stimulus / Soal Gambar)'}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-2">
                                <span className="text-xs text-[var(--text-secondary)]">
                                    <strong>{selectedImportQuestionIds.size}</strong> butir soal akan disimpan ke Bank Soal lokal.
                                </span>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => setImportedPackage(null)}
                                        className="px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors border border-[var(--border-primary)]"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleConfirmImportFile}
                                        disabled={selectedImportQuestionIds.size === 0 || isProcessing}
                                        className="px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all"
                                    >
                                        <CheckIcon className="text-sm" />
                                        <span>Impor ke Bank Soal</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PREVIEW MODAL */}
            {previewPackage && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
                    <div className="app-modal-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="app-modal-header p-4 flex justify-between items-start">
                            <div>
                                <span className="app-status-pill app-status-info">
                                    {previewPackage.subject} • {previewPackage.grade || 'Semua Kelas'}
                                </span>
                                <h3 className="font-bold text-base text-[var(--text-primary)] mt-1.5">
                                    {previewPackage.title}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    Penyusun: <strong>{previewPackage.author}</strong> ({previewPackage.institution}) • Kurikulum: <strong>{previewPackage.curriculum}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setPreviewPackage(null)} 
                                className="p-1.5 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                <CloseIcon className="text-lg" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-[var(--bg-secondary)]">
                            {previewPackage.questions.map((q, idx) => (
                                <div key={q.id || idx} className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-[var(--text-accent)]">
                                        <span>Butir #{idx + 1}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">{q.type}</span>
                                    </div>
                                    <div className="text-[var(--text-primary)] text-xs sm:text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(q.text) }} />
                                    {q.choices && q.choices.length > 0 && (
                                        <div className="ps-3 space-y-1 text-xs text-[var(--text-secondary)] border-s-2 border-[var(--border-primary)]">
                                            {q.choices.map((c, cIdx) => (
                                                <div key={c.id || cIdx} className="flex gap-2">
                                                    <span className="font-bold">{String.fromCharCode(65 + cIdx)}.</span>
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(c.text) }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="app-modal-footer p-3.5 flex justify-end gap-2">
                            <button
                                onClick={() => setPreviewPackage(null)}
                                className="px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-primary)] transition-colors"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => {
                                    handleImportPresetToBank(previewPackage);
                                    setPreviewPackage(null);
                                }}
                                className="px-4 py-2 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                                <PlusIcon className="text-xs" />
                                <span>Impor ke Bank Soal ({previewPackage.questions.length} Butir)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityView;
