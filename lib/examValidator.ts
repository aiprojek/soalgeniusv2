import { Exam, Question, QuestionType } from "../types";
import { stripHtml } from "./utils";

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface ValidationIssue {
    id: string;
    sectionId?: string;
    questionId?: string;
    questionNumber?: string;
    questionIndex?: number;
    sectionTitle?: string;
    severity: IssueSeverity;
    title: string;
    description: string;
    suggestion?: string;
    field?: string;
}

export interface ExamStats {
    totalQuestions: number;
    mcCount: number;
    complexMcCount: number;
    tfCount: number;
    shortAnswerCount: number;
    essayCount: number;
    matchingCount: number;
    tableCount: number;
    stimulusCount: number;
    answeredKeysCount: number;
    unansweredKeysCount: number;
}

export interface ExamValidationResult {
    isValid: boolean;
    hasCriticalIssues: boolean;
    healthScore: number; // 0 - 100
    criticalIssues: ValidationIssue[];
    warningIssues: ValidationIssue[];
    infoIssues: ValidationIssue[];
    stats: ExamStats;
}

/**
 * Checks whether question text or choice text has real textual or visual content
 */
const hasContent = (htmlOrText?: string): boolean => {
    if (!htmlOrText) return false;
    const stripped = stripHtml(htmlOrText).trim();
    if (stripped.length > 0) return true;
    // Check for images or formulas in HTML
    if (/<img|<svg|<math|<span[^>]*ql-formula/i.test(htmlOrText)) return true;
    return false;
};

/**
 * Comprehensive pre-export audit and validation engine for Exam documents.
 */
export const validateExam = (exam: Exam): ExamValidationResult => {
    const criticalIssues: ValidationIssue[] = [];
    const warningIssues: ValidationIssue[] = [];
    const infoIssues: ValidationIssue[] = [];

    const stats: ExamStats = {
        totalQuestions: 0,
        mcCount: 0,
        complexMcCount: 0,
        tfCount: 0,
        shortAnswerCount: 0,
        essayCount: 0,
        matchingCount: 0,
        tableCount: 0,
        stimulusCount: 0,
        answeredKeysCount: 0,
        unansweredKeysCount: 0,
    };

    // 1. Audit Exam Metadata
    if (!exam.title || !exam.title.trim()) {
        criticalIssues.push({
            id: 'meta-no-title',
            severity: 'critical',
            title: 'Judul Ujian Belum Diisi',
            description: 'Judul naskah ujian masih kosong. Judul diperlukan untuk identifikasi file dan kop soal.',
            suggestion: 'Buka Informasi Ujian dan masukkan judul ujian (misal: Penilaian Akhir Semester 1).',
            field: 'title',
        });
    }

    if (!exam.subject || !exam.subject.trim()) {
        warningIssues.push({
            id: 'meta-no-subject',
            severity: 'warning',
            title: 'Mata Pelajaran Kosong',
            description: 'Mata pelajaran belum ditentukan.',
            suggestion: 'Isi mata pelajaran pada panel informasi ujian agar kop ujian lengkap.',
            field: 'subject',
        });
    }

    if (!exam.class || !exam.class.trim()) {
        warningIssues.push({
            id: 'meta-no-class',
            severity: 'warning',
            title: 'Kelas / Tingkat Belum Diisi',
            description: 'Target kelas belum dicantumkan di informasi ujian.',
            suggestion: 'Isi informasi kelas (misal: VII, X MIPA, dsb).',
            field: 'class',
        });
    }

    if (!exam.sections || exam.sections.length === 0) {
        criticalIssues.push({
            id: 'exam-no-sections',
            severity: 'critical',
            title: 'Tidak Ada Bagian Soal',
            description: 'Naskah ujian harus memiliki minimal satu bagian (Section) soal.',
            suggestion: 'Klik tombol "+ Tambah Bagian Soal" di editor.',
        });
    }

    let globalQuestionIndex = 0;

    // 2. Audit Sections & Questions
    exam.sections?.forEach((section, sIdx) => {
        const sNum = sIdx + 1;
        const sectionTitle = section.instructions?.trim() || `Bagian ${sNum}`;

        if (!section.questions || section.questions.length === 0) {
            warningIssues.push({
                id: `sec-empty-${section.id}`,
                sectionId: section.id,
                sectionTitle,
                severity: 'warning',
                title: `Bagian ${sNum} Masih Kosong`,
                description: `Bagian "${sectionTitle}" tidak memiliki butir soal di dalamnya.`,
                suggestion: 'Tambahkan soal atau hapus bagian ini jika tidak digunakan.',
            });
            return;
        }

        section.questions.forEach((q, qIdx) => {
            globalQuestionIndex++;
            stats.totalQuestions++;
            const qNumberStr = q.number ? String(q.number).trim() : String(globalQuestionIndex);

            // Tally stats
            switch (q.type) {
                case QuestionType.MULTIPLE_CHOICE:
                    stats.mcCount++;
                    break;
                case QuestionType.COMPLEX_MULTIPLE_CHOICE:
                    stats.complexMcCount++;
                    break;
                case QuestionType.TRUE_FALSE:
                    stats.tfCount++;
                    break;
                case QuestionType.SHORT_ANSWER:
                    stats.shortAnswerCount++;
                    break;
                case QuestionType.ESSAY:
                    stats.essayCount++;
                    break;
                case QuestionType.MATCHING:
                    stats.matchingCount++;
                    break;
                case QuestionType.TABLE:
                case QuestionType.TABLE_MULTIPLE_CHOICE:
                case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE:
                    stats.tableCount++;
                    break;
                case QuestionType.STIMULUS:
                    stats.stimulusCount++;
                    break;
            }

            // Check Question Text Content
            if (q.type !== QuestionType.STIMULUS && !hasContent(q.text)) {
                criticalIssues.push({
                    id: `q-empty-text-${q.id}`,
                    sectionId: section.id,
                    questionId: q.id,
                    questionNumber: qNumberStr,
                    questionIndex: globalQuestionIndex,
                    sectionTitle,
                    severity: 'critical',
                    title: `Soal No. ${qNumberStr}: Teks Soal Kosong`,
                    description: 'Pertanyaan tidak memiliki teks soal maupun gambar/rumus.',
                    suggestion: 'Tuliskan isi pertanyaan pada editor soal.',
                });
            }

            // Detailed Type Checks
            if (q.type === QuestionType.MULTIPLE_CHOICE) {
                const choices = q.choices || [];
                if (choices.length < 2) {
                    criticalIssues.push({
                        id: `q-mc-too-few-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Pilihan Jawaban Kurang`,
                        description: `Pilihan ganda memerlukan minimal 2 opsi (saat ini ${choices.length}).`,
                        suggestion: 'Tambahkan opsi pilihan jawaban (misal: A, B, C, D, E).',
                    });
                } else if (choices.length < 4) {
                    warningIssues.push({
                        id: `q-mc-standard-opt-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'warning',
                        title: `Soal No. ${qNumberStr}: Hanya Memiliki ${choices.length} Opsi`,
                        description: 'Standar pilihan ganda sekolah umumnya memiliki 4 opsi (SMP) atau 5 opsi (SMA).',
                        suggestion: 'Pertimbangkan menambahkan pilihan jawaban hingga 4 atau 5 opsi.',
                    });
                }

                // Empty choices check
                choices.forEach((c, cIdx) => {
                    if (!hasContent(c.text)) {
                        criticalIssues.push({
                            id: `q-mc-empty-opt-${q.id}-${c.id}`,
                            sectionId: section.id,
                            questionId: q.id,
                            questionNumber: qNumberStr,
                            questionIndex: globalQuestionIndex,
                            sectionTitle,
                            severity: 'critical',
                            title: `Soal No. ${qNumberStr}: Opsi ${String.fromCharCode(65 + cIdx)} Kosong`,
                            description: `Teks untuk pilihan ${String.fromCharCode(65 + cIdx)} masih kosong.`,
                            suggestion: 'Isi teks opsi jawaban atau hapus baris opsi ini.',
                        });
                    }
                });

                // Answer key check
                if (!q.answerKey || !choices.some(c => c.id === q.answerKey)) {
                    stats.unansweredKeysCount++;
                    criticalIssues.push({
                        id: `q-mc-no-key-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Kunci Jawaban Belum Dipilih`,
                        description: 'Pilihan ganda belum memiliki kunci jawaban yang valid.',
                        suggestion: 'Tandai salah satu radio button opsi jawaban sebagai kunci yang benar.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                const choices = q.choices || [];
                const correctKeys = Array.isArray(q.answerKey) ? q.answerKey : (q.answerKey ? [q.answerKey] : []);

                if (choices.length < 2) {
                    criticalIssues.push({
                        id: `q-cmc-too-few-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Pilihan Jawaban Kurang`,
                        description: 'Soal PG Kompleks harus memiliki minimal 2 opsi pilihan.',
                    });
                }

                if (correctKeys.length === 0) {
                    stats.unansweredKeysCount++;
                    criticalIssues.push({
                        id: `q-cmc-no-key-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Kunci Jawaban Kosong`,
                        description: 'Belum ada opsi jawaban benar yang dicentang.',
                        suggestion: 'Centang minimal satu atau lebih jawaban yang benar pada kunci jawaban.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.TRUE_FALSE) {
                if (q.answerKey !== 'true' && q.answerKey !== 'false' && q.answerKey !== 'Benar' && q.answerKey !== 'Salah') {
                    stats.unansweredKeysCount++;
                    warningIssues.push({
                        id: `q-tf-no-key-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'warning',
                        title: `Soal No. ${qNumberStr}: Kunci Benar/Salah Belum Dipilih`,
                        description: 'Kunci jawaban pernyataan Benar/Salah belum ditentukan.',
                        suggestion: 'Pilih "Benar" atau "Salah" pada panel kunci jawaban.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.SHORT_ANSWER) {
                if (!q.answerKey || !String(q.answerKey).trim()) {
                    stats.unansweredKeysCount++;
                    warningIssues.push({
                        id: `q-sa-no-key-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'warning',
                        title: `Soal No. ${qNumberStr}: Kunci Isian Singkat Kosong`,
                        description: 'Belum ada referensi kata kunci jawaban untuk soal isian singkat.',
                        suggestion: 'Tuliskan jawaban yang diharapkan pada kolom kunci jawaban.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.ESSAY) {
                if (!q.answerKey || !hasContent(String(q.answerKey))) {
                    stats.unansweredKeysCount++;
                    infoIssues.push({
                        id: `q-essay-no-rubric-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'info',
                        title: `Soal No. ${qNumberStr}: Rubrik / Kunci Esai Belum Diisi`,
                        description: 'Disarankan menyertakan pedoman jawaban/penskoran untuk lembar kunci jawaban.',
                        suggestion: 'Tuliskan pedoman jawaban atau poin-poin rubrik penilaian.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.MATCHING) {
                const prompts = q.matchingPrompts || [];
                const answers = q.matchingAnswers || [];
                const keys = q.matchingKey || [];

                if (prompts.length === 0 || answers.length === 0) {
                    criticalIssues.push({
                        id: `q-mat-no-pairs-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Data Menjodohkan Tidak Lengkap`,
                        description: 'Daftar pernyataan (Kolom A) atau pilihan jawaban (Kolom B) masih kosong.',
                        suggestion: 'Tambahkan pasangan pernyataan dan jawaban untuk soal menjodohkan.',
                    });
                }

                if (keys.length < prompts.length && prompts.length > 0) {
                    stats.unansweredKeysCount++;
                    warningIssues.push({
                        id: `q-mat-incomplete-keys-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'warning',
                        title: `Soal No. ${qNumberStr}: Pasangan Kunci Belum Lengkap`,
                        description: `Baru ${keys.length} dari ${prompts.length} pernyataan yang dipasangkan ke kunci jawaban.`,
                        suggestion: 'Lengkapi pasangan jodoh untuk setiap pernyataan di kolom A.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            } else if (q.type === QuestionType.TABLE || q.type === QuestionType.TABLE_MULTIPLE_CHOICE || q.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                if (!q.tableData || !q.tableData.rows || q.tableData.rows.length === 0) {
                    criticalIssues.push({
                        id: `q-tbl-empty-${q.id}`,
                        sectionId: section.id,
                        questionId: q.id,
                        questionNumber: qNumberStr,
                        questionIndex: globalQuestionIndex,
                        sectionTitle,
                        severity: 'critical',
                        title: `Soal No. ${qNumberStr}: Tabel Kosong`,
                        description: 'Struktur tabel pada soal tabel belum memiliki baris atau kolom.',
                    });
                } else {
                    stats.answeredKeysCount++;
                }
            }
        });
    });

    // 3. Compute Health Score (0 - 100)
    let score = 100;
    // Critical issues deduct 25 points each
    score -= criticalIssues.length * 25;
    // Warning issues deduct 5 points each
    score -= warningIssues.length * 5;
    // Info issues deduct 1 point each
    score -= infoIssues.length * 1;
    if (stats.totalQuestions === 0) score = 0;
    const healthScore = Math.max(0, Math.min(100, score));

    const hasCriticalIssues = criticalIssues.length > 0;
    const isValid = !hasCriticalIssues && stats.totalQuestions > 0;

    return {
        isValid,
        hasCriticalIssues,
        healthScore,
        criticalIssues,
        warningIssues,
        infoIssues,
        stats,
    };
};
