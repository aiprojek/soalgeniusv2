import React, { useState, useMemo } from 'react';
import { Exam } from '../types';
import { validateExam, ValidationIssue, IssueSeverity } from '../lib/examValidator';
import { 
    ShieldCheckIcon, ExclamationTriangleIcon, CheckIcon, CloseIcon,
    CopyIcon, EditIcon, DownloadIcon
} from './Icons';

interface ExamValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: Exam;
    onProceedExport?: () => void;
    onJumpToQuestion?: (sectionId?: string, questionId?: string) => void;
    exportActionName?: string;
}

export const ExamValidationModal: React.FC<ExamValidationModalProps> = ({
    isOpen,
    onClose,
    exam,
    onProceedExport,
    onJumpToQuestion,
    exportActionName
}) => {
    const [selectedTab, setSelectedTab] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const [copied, setCopied] = useState(false);

    const validation = useMemo(() => validateExam(exam), [exam]);

    const issuesToDisplay = useMemo(() => {
        if (selectedTab === 'critical') return validation.criticalIssues;
        if (selectedTab === 'warning') return validation.warningIssues;
        if (selectedTab === 'info') return validation.infoIssues;
        return [...validation.criticalIssues, ...validation.warningIssues, ...validation.infoIssues];
    }, [validation, selectedTab]);

    if (!isOpen) return null;

    const handleCopyReport = () => {
        let text = `=== LAPORAN AUDIT NASKAH SOAL: ${exam.title || 'Tanpa Judul'} ===\n`;
        text += `Skor Kesiapan: ${validation.healthScore} / 100\n`;
        text += `Status: ${validation.isValid ? 'SIAP EKSPOR' : 'PERLU PERBAIKAN'}\n`;
        text += `Total Soal: ${validation.stats.totalQuestions} (Kunci Terisi: ${validation.stats.answeredKeysCount}/${validation.stats.totalQuestions})\n\n`;

        if (validation.criticalIssues.length > 0) {
            text += `--- ISU KRITIS (${validation.criticalIssues.length}) ---\n`;
            validation.criticalIssues.forEach((iss, i) => {
                text += `${i + 1}. [KRITIS] ${iss.title}\n   ${iss.description}\n   Saran: ${iss.suggestion || '-'}\n\n`;
            });
        }

        if (validation.warningIssues.length > 0) {
            text += `--- PERINGATAN (${validation.warningIssues.length}) ---\n`;
            validation.warningIssues.forEach((iss, i) => {
                text += `${i + 1}. [PERINGATAN] ${iss.title}\n   ${iss.description}\n   Saran: ${iss.suggestion || '-'}\n\n`;
            });
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreBadge = (score: number) => {
        if (score >= 90) {
            return {
                bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                label: 'Naskah Sangat Baik & Siap Ekspor',
                icon: ShieldCheckIcon,
            };
        }
        if (score >= 70) {
            return {
                bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
                label: 'Siap dengan Beberapa Catatan',
                icon: ExclamationTriangleIcon,
            };
        }
        return {
            bg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
            label: 'Perlu Perbaikan Sebelum Ekspor',
            icon: ExclamationTriangleIcon,
        };
    };

    const scoreBadge = getScoreBadge(validation.healthScore);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[var(--bg-secondary)] w-full max-w-5xl max-h-[94vh] rounded-[24px] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                            <ShieldCheckIcon />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">Audit & Validasi Naskah Soal</h3>
                            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">Pemeriksaan kelengkapan kunci jawaban, struktur butir, dan saran penyusunan</p>
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

                {/* Score & Summary Banner (Streamlined & Compact) */}
                <div className="p-3.5 sm:p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex-shrink-0 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border bg-[var(--bg-tertiary)] border-[var(--border-primary)]">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-3 border-blue-500/20 bg-[var(--bg-secondary)] shadow-inner flex-shrink-0">
                                <span className={`text-base sm:text-lg font-black ${validation.healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : validation.healthScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {validation.healthScore}%
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${scoreBadge.bg}`}>
                                    <scoreBadge.icon className="text-xs" />
                                    <span>{scoreBadge.label}</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Total <strong>{validation.stats.totalQuestions}</strong> butir soal ({validation.stats.answeredKeysCount} kunci terisi, {validation.stats.unansweredKeysCount} belum)
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCopyReport}
                            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
                        >
                            {copied ? <CheckIcon className="text-emerald-500" /> : <CopyIcon />}
                            <span>{copied ? 'Tersalin!' : 'Salin Laporan'}</span>
                        </button>
                    </div>

                    {/* Stats Distribution Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                            <div className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-medium">Pilihan Ganda</div>
                            <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">{validation.stats.mcCount + validation.stats.complexMcCount} Soal</div>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                            <div className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-medium">Isian & Esai</div>
                            <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">{validation.stats.shortAnswerCount + validation.stats.essayCount} Soal</div>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                            <div className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-medium">Jodohkan & Tabel</div>
                            <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">{validation.stats.matchingCount + validation.stats.tableCount} Soal</div>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                            <div className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-medium">Kelengkapan Kunci</div>
                            <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">
                                {validation.stats.totalQuestions > 0 
                                    ? `${Math.round((validation.stats.answeredKeysCount / validation.stats.totalQuestions) * 100)}%` 
                                    : '0%'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs - Horizontal Scrollable on Small Screens */}
                <div className="px-4 sm:px-6 pt-2 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex gap-2 overflow-x-auto whitespace-nowrap scroll-smooth flex-shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <button 
                        onClick={() => setSelectedTab('all')} 
                        className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex-shrink-0 ${selectedTab === 'all' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Semua Catatan ({validation.criticalIssues.length + validation.warningIssues.length + validation.infoIssues.length})
                    </button>
                    <button 
                        onClick={() => setSelectedTab('critical')} 
                        className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex-shrink-0 ${selectedTab === 'critical' ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Kritis ({validation.criticalIssues.length})
                    </button>
                    <button 
                        onClick={() => setSelectedTab('warning')} 
                        className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex-shrink-0 ${selectedTab === 'warning' ? 'border-amber-600 text-amber-600 dark:text-amber-400' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Peringatan ({validation.warningIssues.length})
                    </button>
                    <button 
                        onClick={() => setSelectedTab('info')} 
                        className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex-shrink-0 ${selectedTab === 'info' ? 'border-blue-500 text-blue-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Saran ({validation.infoIssues.length})
                    </button>
                </div>

                {/* Issues List Body - Generous Height and Spacious Detail Cards */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-4" style={{ minHeight: '300px', maxHeight: 'calc(94vh - 270px)' }}>
                    {issuesToDisplay.length === 0 ? (
                        <div className="py-20 text-center text-[var(--text-secondary)] space-y-3">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-sm">
                                <CheckIcon />
                            </div>
                            <p className="text-base font-bold text-[var(--text-primary)]">Tidak Ada Isu Ditemukan</p>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                                Semua butir soal telah memenuhi standar kelengkapan konten dan kunci jawaban. Naskah siap untuk diekspor atau dicetak.
                            </p>
                        </div>
                    ) : (
                        issuesToDisplay.map((issue) => {
                            const isCritical = issue.severity === 'critical';
                            const isWarning = issue.severity === 'warning';

                            return (
                                <div 
                                    key={issue.id}
                                    className={`p-4 sm:p-5 sm:px-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                                        isCritical 
                                            ? 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60 shadow-xs' 
                                            : isWarning 
                                                ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 shadow-xs' 
                                                : 'bg-blue-50/80 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900/60 shadow-xs'
                                    }`}
                                >
                                    <div className="space-y-2.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                isCritical 
                                                    ? 'bg-rose-600 text-white shadow-xs' 
                                                    : isWarning 
                                                        ? 'bg-amber-500 text-white shadow-xs' 
                                                        : 'bg-blue-600 text-white shadow-xs'
                                            }`}>
                                                {isCritical ? 'Kritis' : isWarning ? 'Peringatan' : 'Saran'}
                                            </span>
                                            <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-snug">{issue.title}</h4>
                                        </div>
                                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">{issue.description}</p>
                                        {issue.suggestion && (
                                            <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-secondary)] flex items-start gap-2.5">
                                                <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">💡</span>
                                                <div className="leading-relaxed">
                                                    <strong className="text-[var(--text-primary)]">Saran Perbaikan:</strong> {issue.suggestion}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {onJumpToQuestion && issue.questionId && (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                onJumpToQuestion(issue.sectionId, issue.questionId);
                                            }}
                                            className="self-end md:self-start flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-[var(--bg-secondary)] text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-xs transition-colors whitespace-nowrap"
                                        >
                                            <EditIcon className="text-sm" />
                                            <span>Perbaiki Soal</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        Tutup
                    </button>

                    {onProceedExport && (
                        <button
                            onClick={() => {
                                onClose();
                                onProceedExport();
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
                        >
                            <DownloadIcon />
                            <span>{exportActionName ? `Lanjutkan ${exportActionName}` : 'Tetap Ekspor Dokumen'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamValidationModal;
