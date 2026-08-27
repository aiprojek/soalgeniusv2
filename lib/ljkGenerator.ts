import type { Exam, Settings } from '../types';

export interface LjkConfig {
    layout: '1-page' | '2-page' | '4-page'; // 1 A4, 2 A5 split, 4 A6 split
    optionCount: 4 | 5; // A-D or A-E
    totalQuestions: number; // e.g. 20, 25, 30, 40, 50
    hasEssay: boolean;
    essayCount: number; // e.g. 5
    showStudentNis: boolean;
    showStudentName: boolean;
    showPacketCode: boolean;
    showScoreBox: boolean;
    showInstructions: boolean;
    customSchoolName?: string;
    customExamTitle?: string;
}

export interface LjkScanResult {
    id: string;
    studentName: string;
    studentNis: string;
    packetCode: string; // 'A' | 'B' | 'C' | 'D' | 'Default'
    answers: Record<number, string>; // question number -> 'A' | 'B' | 'C' | 'D' | 'E' | ''
    essayScores?: Record<number, number>; // essay number -> score
    manualEssayScore?: number;
    correctCount: number;
    incorrectCount: number;
    blankCount: number;
    totalScore: number; // Scale 0-100
    timestamp: string;
    imageUrl?: string;
    status: 'verified' | 'needs_review';
}

/**
 * Generate high-contrast, printer-friendly HTML for LJK sheets.
 */
export function generateLjkHtml(
    exam: Exam,
    settings: Settings,
    config: LjkConfig,
    forDownload = false
): string {
    const schoolName = config.customSchoolName || settings.examHeaderLines?.[0]?.text || 'SEKOLAH / MADRASAH';
    const examTitle = config.customExamTitle || exam.title || 'PENILAIAN AKHIR SEMESTER';
    const subject = exam.subject || 'Mata Pelajaran';
    const gradeClass = exam.class || 'Semua Kelas';
    const examDate = exam.date || new Date().toISOString().split('T')[0];

    const options = config.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    // Generate single LJK sheet block
    const renderSingleLjkSheet = (sheetIndex: number, isCompact: boolean, isMicro: boolean) => {
        // Group questions into columns (e.g. 2 or 3 or 4 columns depending on question count)
        const qCount = config.totalQuestions;
        let colCount = 2;
        if (qCount <= 20) colCount = isMicro ? 2 : (isCompact ? 2 : 2);
        else if (qCount <= 30) colCount = isMicro ? 3 : 2;
        else if (qCount <= 40) colCount = isCompact ? 3 : 2;
        else colCount = isCompact ? 4 : 3;

        const itemsPerCol = Math.ceil(qCount / colCount);

        const columns: number[][] = [];
        for (let c = 0; c < colCount; c++) {
            const colItems: number[] = [];
            for (let i = 1; i <= itemsPerCol; i++) {
                const qNum = c * itemsPerCol + i;
                if (qNum <= qCount) {
                    colItems.push(qNum);
                }
            }
            if (colItems.length > 0) columns.push(colItems);
        }

        return `
        <div class="ljk-card ${isCompact ? 'compact' : ''} ${isMicro ? 'micro' : ''}" data-sheet="${sheetIndex}">
            <!-- 4 Corner Fiducial Markers for Optical/Camera Alignment -->
            <div class="fiducial-marker top-left"></div>
            <div class="fiducial-marker top-right"></div>
            <div class="fiducial-marker bottom-left"></div>
            <div class="fiducial-marker bottom-right"></div>

            <!-- Header Kop & Identity -->
            <div class="ljk-header">
                <div class="header-main">
                    <div class="header-titles">
                        <div class="school-name">${escapeHtml(schoolName)}</div>
                        <div class="exam-title">LEMBAR JAWAB KOMPUTER / KAMERA (LJK)</div>
                        <div class="exam-subtitle">${escapeHtml(examTitle)} • ${escapeHtml(subject)} (${escapeHtml(gradeClass)})</div>
                    </div>
                    <div class="header-qr">
                        <div class="qr-box">
                            <span class="qr-label">KODE:</span>
                            <span class="qr-code-text">${escapeHtml(exam.id.slice(0, 8).toUpperCase())}</span>
                        </div>
                    </div>
                </div>

                <!-- Petunjuk Singkat -->
                ${config.showInstructions && !isMicro ? `
                <div class="ljk-instructions">
                    <span><strong>Petunjuk:</strong> Hitamkan/silang (● atau ✖) bulatan jawaban yang benar. Gunakan pensil 2B atau pulpen hitam.</span>
                    <div class="sample-bubbles">
                        <span>Benar: <span class="bubble filled">●</span></span>
                        <span>Salah: <span class="bubble">○</span> <span class="bubble">✓</span></span>
                    </div>
                </div>` : ''}

                <!-- Form Identitas Siswa -->
                <div class="student-meta-grid">
                    <div class="meta-row">
                        <div class="meta-field flex-2">
                            <span class="meta-label">Nama Siswa:</span>
                            <div class="meta-line"></div>
                        </div>
                        ${config.showStudentNis ? `
                        <div class="meta-field flex-1">
                            <span class="meta-label">No. Peserta / NISN:</span>
                            <div class="meta-line"></div>
                        </div>` : ''}
                    </div>
                    <div class="meta-row">
                        <div class="meta-field">
                            <span class="meta-label">Kelas / Ruang:</span>
                            <div class="meta-line meta-short"></div>
                        </div>
                        <div class="meta-field">
                            <span class="meta-label">Tanggal:</span>
                            <div class="meta-line meta-short">${escapeHtml(examDate)}</div>
                        </div>
                        ${config.showPacketCode ? `
                        <div class="meta-field packet-field">
                            <span class="meta-label font-bold">Paket Soal:</span>
                            <div class="packet-bubbles">
                                <span class="p-bubble">A</span>
                                <span class="p-bubble">B</span>
                                <span class="p-bubble">C</span>
                                <span class="p-bubble">D</span>
                            </div>
                        </div>` : ''}
                        <div class="meta-field">
                            <span class="meta-label">Tanda Tangan:</span>
                            <div class="meta-line meta-sign"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bagian Jawaban Pilihan Ganda (OMR Grid) -->
            <div class="omr-grid-container" data-qcount="${qCount}" data-options="${options.join('')}">
                <div class="omr-grid-header">
                    <span>LEMBAR JAWABAN PILIHAN GANDA (JUMLAH: ${qCount} BUTIR)</span>
                </div>
                <div class="omr-columns" style="grid-template-columns: repeat(${columns.length}, 1fr);">
                    ${columns.map((colQuestions) => `
                        <div class="omr-column">
                            ${colQuestions.map(qNum => `
                                <div class="omr-row" data-q="${qNum}">
                                    <span class="q-num">${qNum < 10 ? '0' + qNum : qNum}.</span>
                                    <div class="q-bubbles">
                                        ${options.map(opt => `
                                            <span class="omr-bubble" data-opt="${opt}">
                                                <span class="opt-text">${opt}</span>
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Optional Essay / Uraian Space -->
            ${config.hasEssay ? `
            <div class="essay-box-section">
                <div class="essay-header">
                    <span>KOLOM JAWABAN SINGKAT / CATATAN URAIAN (1-${config.essayCount})</span>
                </div>
                <div class="essay-lines-grid">
                    ${Array.from({ length: config.essayCount }).map((_, eIdx) => `
                        <div class="essay-line-item">
                            <span class="essay-num">${eIdx + 1}.</span>
                            <div class="essay-dots"></div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- Footer: Kotak Nilai Guru -->
            ${config.showScoreBox ? `
            <div class="score-footer-box">
                <div class="score-box-item">
                    <span class="sb-label">Benar (PG)</span>
                    <span class="sb-val"></span>
                </div>
                <div class="score-box-item">
                    <span class="sb-label">Salah (PG)</span>
                    <span class="sb-val"></span>
                </div>
                ${config.hasEssay ? `
                <div class="score-box-item">
                    <span class="sb-label">Skor Uraian</span>
                    <span class="sb-val"></span>
                </div>` : ''}
                <div class="score-box-item highlight">
                    <span class="sb-label font-bold">NILAI AKHIR</span>
                    <span class="sb-val"></span>
                </div>
                <div class="score-box-item">
                    <span class="sb-label">Paraf Guru</span>
                    <span class="sb-val"></span>
                </div>
            </div>` : ''}
        </div>
        `;
    };

    let contentHtml = '';
    const isCompact = config.layout === '2-page';
    const isMicro = config.layout === '4-page';

    if (config.layout === '1-page') {
        contentHtml = `
            <div class="a4-page full-layout">
                ${renderSingleLjkSheet(1, false, false)}
            </div>
        `;
    } else if (config.layout === '2-page') {
        contentHtml = `
            <div class="a4-page split-2-layout">
                <div class="split-half top-half">
                    ${renderSingleLjkSheet(1, true, false)}
                </div>
                <div class="cut-guide horizontal">
                    <span>--- ✂ --- POTONG DI SINI (1 LEMBAR A4 DIBAGI 2 LJK HEMAT KERTAS) --- ✂ ---</span>
                </div>
                <div class="split-half bottom-half">
                    ${renderSingleLjkSheet(2, true, false)}
                </div>
            </div>
        `;
    } else {
        // 4-page mini
        contentHtml = `
            <div class="a4-page split-4-layout">
                <div class="quad-item">${renderSingleLjkSheet(1, true, true)}</div>
                <div class="quad-item">${renderSingleLjkSheet(2, true, true)}</div>
                <div class="quad-item">${renderSingleLjkSheet(3, true, true)}</div>
                <div class="quad-item">${renderSingleLjkSheet(4, true, true)}</div>
            </div>
        `;
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LJK - ${escapeHtml(examTitle)} - SoalGenius</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #000;
            background-color: #f1f5f9;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        @page {
            size: A4 portrait;
            margin: 6mm;
        }

        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 10px auto;
            padding: 8mm;
            background: #fff;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
        }

        .split-2-layout {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 285mm;
            padding: 6mm;
        }

        .split-half {
            height: 134mm;
            position: relative;
        }

        .cut-guide {
            text-align: center;
            font-size: 8pt;
            color: #64748b;
            font-style: italic;
            border-top: 1.5px dashed #94a3b8;
            margin: 3mm 0;
            padding-top: 1mm;
            letter-spacing: 0.5px;
        }

        .split-4-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 4mm;
            height: 285mm;
            padding: 5mm;
        }

        .quad-item {
            border: 1px dashed #cbd5e1;
            padding: 2mm;
            border-radius: 4px;
            position: relative;
        }

        /* LJK Card Container */
        .ljk-card {
            border: 2px solid #000;
            padding: 4mm 5mm;
            position: relative;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 2.5mm;
            border-radius: 2px;
            height: 100%;
        }

        .ljk-card.compact {
            padding: 2.5mm 3.5mm;
            gap: 1.8mm;
        }

        .ljk-card.micro {
            padding: 2mm;
            gap: 1.2mm;
        }

        /* Fiducial Markers on 4 Corners */
        .fiducial-marker {
            position: absolute;
            width: 5.5mm;
            height: 5.5mm;
            background-color: #000;
        }
        .fiducial-marker.top-left { top: 1.5mm; left: 1.5mm; }
        .fiducial-marker.top-right { top: 1.5mm; right: 1.5mm; }
        .fiducial-marker.bottom-left { bottom: 1.5mm; left: 1.5mm; }
        .fiducial-marker.bottom-right { bottom: 1.5mm; right: 1.5mm; }

        /* Header Section */
        .ljk-header {
            border-bottom: 1.5px solid #000;
            padding-bottom: 2mm;
        }

        .header-main {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
            margin-bottom: 1.5mm;
        }

        .header-titles {
            text-align: center;
            flex-grow: 1;
        }

        .school-name {
            font-size: 9.5pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .exam-title {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #000;
        }

        .compact .exam-title { font-size: 9.5pt; }
        .micro .exam-title { font-size: 8pt; }

        .exam-subtitle {
            font-size: 8.5pt;
            font-weight: 600;
            color: #1e293b;
        }

        .compact .exam-subtitle { font-size: 7.5pt; }
        .micro .exam-subtitle { font-size: 6.5pt; }

        .header-qr .qr-box {
            border: 1.5px solid #000;
            padding: 1mm 2mm;
            text-align: center;
            font-family: monospace;
            font-size: 7.5pt;
            background: #f8fafc;
        }

        .qr-label { font-weight: 700; margin-right: 2px; }
        .qr-code-text { font-weight: 900; }

        /* Instructions */
        .ljk-instructions {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 1mm 2mm;
            font-size: 7pt;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5mm;
        }

        .sample-bubbles {
            display: flex;
            gap: 3mm;
            font-weight: bold;
        }

        .bubble {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid #000;
            border-radius: 50%;
            text-align: center;
            line-height: 9px;
            font-size: 6.5pt;
        }
        .bubble.filled { background: #000; color: #fff; }

        /* Student Identity Fields */
        .student-meta-grid {
            display: flex;
            flex-direction: column;
            gap: 1.2mm;
            font-size: 8pt;
        }

        .compact .student-meta-grid { font-size: 7pt; gap: 1mm; }
        .micro .student-meta-grid { font-size: 6pt; gap: 0.8mm; }

        .meta-row {
            display: flex;
            align-items: center;
            gap: 3mm;
        }

        .meta-field {
            display: flex;
            align-items: flex-end;
            gap: 1.5mm;
            white-space: nowrap;
        }
        .meta-field.flex-1 { flex: 1; }
        .meta-field.flex-2 { flex: 2; }

        .meta-label { font-weight: 600; }
        .meta-line {
            flex-grow: 1;
            border-bottom: 1px dotted #000;
            min-width: 15mm;
            height: 3.5mm;
        }
        .meta-line.meta-short { min-width: 12mm; }
        .meta-line.meta-sign { min-width: 18mm; }

        .packet-field {
            display: flex;
            align-items: center;
            gap: 1.5mm;
            border: 1px solid #000;
            padding: 0.5mm 1.5mm;
            background: #f8fafc;
            border-radius: 2px;
        }

        .packet-bubbles {
            display: flex;
            gap: 1.5mm;
        }

        .p-bubble {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 12px;
            height: 12px;
            border: 1.2px solid #000;
            border-radius: 50%;
            font-size: 6.5pt;
            font-weight: 800;
        }

        /* OMR Question Grid */
        .omr-grid-container {
            border: 1.5px solid #000;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .omr-grid-header {
            background-color: #000;
            color: #fff;
            text-align: center;
            font-weight: 800;
            font-size: 7.5pt;
            padding: 0.8mm 0;
            letter-spacing: 0.5px;
        }

        .compact .omr-grid-header { font-size: 6.5pt; padding: 0.5mm 0; }
        .micro .omr-grid-header { font-size: 5.5pt; }

        .omr-columns {
            display: grid;
            gap: 2mm;
            padding: 1.5mm 2mm;
            flex-grow: 1;
            align-items: start;
        }

        .compact .omr-columns { padding: 1mm 1.5mm; gap: 1.5mm; }

        .omr-column {
            display: flex;
            flex-direction: column;
            gap: 1.2mm;
            border-right: 1px dotted #cbd5e1;
            padding-right: 1.5mm;
        }
        .omr-column:last-child { border-right: none; padding-right: 0; }

        .compact .omr-column { gap: 0.9mm; }
        .micro .omr-column { gap: 0.6mm; }

        .omr-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5mm 1mm;
            border-radius: 2px;
            background: #ffffff;
        }
        .omr-row:nth-child(5n) {
            border-bottom: 1px solid #94a3b8;
            padding-bottom: 1mm;
            margin-bottom: 0.5mm;
        }

        .q-num {
            font-family: monospace;
            font-size: 7.5pt;
            font-weight: 800;
            color: #000;
            width: 4.5mm;
            text-align: right;
            margin-right: 1mm;
        }
        .compact .q-num { font-size: 6.5pt; width: 4mm; }
        .micro .q-num { font-size: 5.5pt; width: 3mm; }

        .q-bubbles {
            display: flex;
            align-items: center;
            gap: 1.8mm;
        }
        .compact .q-bubbles { gap: 1.2mm; }
        .micro .q-bubbles { gap: 0.8mm; }

        .omr-bubble {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1.5px solid #000;
            border-radius: 50%;
            font-weight: 800;
            font-size: 7pt;
            background-color: #fff;
            cursor: pointer;
            transition: all 0.1s;
        }

        .compact .omr-bubble {
            width: 11.5px;
            height: 11.5px;
            border-width: 1.2px;
            font-size: 6pt;
        }

        .micro .omr-bubble {
            width: 9.5px;
            height: 9.5px;
            border-width: 1px;
            font-size: 5pt;
        }

        .omr-bubble.active-choice {
            background-color: #000;
            color: #fff;
        }

        /* Essay Box Section */
        .essay-box-section {
            border: 1px solid #000;
            padding: 1.2mm 2mm;
            background: #fafafa;
        }
        .essay-header {
            font-size: 7pt;
            font-weight: 800;
            margin-bottom: 1mm;
            text-transform: uppercase;
        }
        .essay-lines-grid {
            display: flex;
            flex-direction: column;
            gap: 1.5mm;
        }
        .essay-line-item {
            display: flex;
            align-items: center;
            gap: 1.5mm;
        }
        .essay-num { font-size: 6.5pt; font-weight: 700; width: 3mm; }
        .essay-dots { flex-grow: 1; border-bottom: 1px dotted #64748b; height: 3mm; }

        /* Teacher Score Box */
        .score-footer-box {
            display: flex;
            border: 1.5px solid #000;
            background: #fff;
            align-items: stretch;
        }
        .score-box-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
            padding: 0.8mm 1mm;
            min-height: 8mm;
        }
        .score-box-item:last-child { border-right: none; }
        .score-box-item.highlight { flex: 1.3; background-color: #f1f5f9; }
        .sb-label { font-size: 6.5pt; font-weight: 600; text-transform: uppercase; }
        .sb-val { font-size: 9pt; font-weight: 800; min-height: 4mm; }

        @media print {
            body { background: #fff !important; }
            .a4-page {
                box-shadow: none !important;
                margin: 0 auto !important;
                width: 100% !important;
                min-height: auto !important;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    ${contentHtml}
</body>
</html>`;
}

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
