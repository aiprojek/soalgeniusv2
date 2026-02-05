import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType, BorderStyle, VerticalAlign, VerticalMergeType, HeightRule } from "docx";
import { Exam, Settings, QuestionType } from "../types";

// Helper to convert base64 string to Uint8Array for images
const base64ToUint8Array = (base64: string): Uint8Array => {
    try {
        // Handle cases with or without data URI prefix
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Error converting base64", e);
        return new Uint8Array(0);
    }
};

// Helper to determine image type from base64 string
const getImageType = (base64: string): "png" | "jpg" | "gif" | "bmp" => {
    const lower = base64.toLowerCase();
    if (lower.includes('image/jpeg') || lower.includes('image/jpg')) return "jpg";
    if (lower.includes('image/gif')) return "gif";
    if (lower.includes('image/bmp')) return "bmp";
    return "png";
};

// Border Styles
const INVISIBLE_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

const SOLID_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
};

// Header Border (Double line at bottom, invisible elsewhere)
const HEADER_CELL_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.DOUBLE, size: 12, color: "000000" }, // Double line, 1.5pt approx
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

// Helper to parse HTML rich text to docx TextRuns (Bold, Italic, Underline, Sub/Sup)
const parseHtmlToRuns = (html: string, mainFont: string): (TextRun | ImageRun)[] => {
    const runs: (TextRun | ImageRun)[] = [];
    const div = document.createElement('div');
    div.innerHTML = html;

    const traverse = (node: Node, style: { bold?: boolean, italics?: boolean, underline?: boolean, sub?: boolean, super?: boolean } = {}) => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent) {
                // Collapse multiple spaces but keep single spaces
                const text = node.textContent; 
                if (text) {
                    runs.push(new TextRun({
                        text: text,
                        bold: style.bold,
                        italics: style.italics,
                        underline: style.underline ? {} : undefined,
                        subScript: style.sub,
                        superScript: style.super,
                        size: 24, // 12pt
                        font: mainFont
                    }));
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'IMG') {
                const src = el.getAttribute('src');
                if (src && src.startsWith('data:image')) {
                    try {
                        const imageBuffer = base64ToUint8Array(src);
                        runs.push(new ImageRun({
                            data: imageBuffer,
                            transformation: { width: 100, height: 100 }, // Batasi ukuran gambar dalam soal
                            type: getImageType(src),
                        }));
                    } catch (e) {
                        console.error("Failed to add image inside question", e);
                    }
                }
            } else if (el.tagName === 'BR') {
                runs.push(new TextRun({ text: "", break: 1 }));
            } else if (el.tagName === 'P' || el.tagName === 'DIV') {
                 if(runs.length > 0) runs.push(new TextRun({ text: "", break: 1 }));
                 el.childNodes.forEach(child => traverse(child, style));
            } else {
                const newStyle = { ...style };
                if (['B', 'STRONG'].includes(el.tagName)) newStyle.bold = true;
                if (['I', 'EM'].includes(el.tagName)) newStyle.italics = true;
                if (['U'].includes(el.tagName)) newStyle.underline = true;
                if (el.tagName === 'SUB') newStyle.sub = true;
                if (el.tagName === 'SUP') newStyle.super = true;
                
                el.childNodes.forEach(child => traverse(child, newStyle));
            }
        }
    };

    traverse(div);
    return runs;
};

export const generateDocx = async (exam: Exam, settings: Settings): Promise<Blob> => {
    const mainFont = settings.fontFamily || "Times New Roman";
    const docChildren: any[] = [];
    
    // --- 1. HEADER (KOP SURAT) ---
    const [leftLogoBase64, rightLogoBase64] = settings.logos;
    const headerCells: TableCell[] = [];

    // Persiapkan konten teks header
    const headerTextParas = settings.examHeaderLines.map(line => new Paragraph({
        children: [new TextRun({ text: line.text, bold: true, size: 28, font: mainFont })], // 14pt
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: 240 }, // Single spacing
    }));

    // Helper untuk membuat cell gambar
    const createLogoCell = (base64: string) => new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ 
            children: [new ImageRun({ 
                data: base64ToUint8Array(base64), 
                transformation: { width: 65, height: 65 },
                type: getImageType(base64),
            })], 
            alignment: AlignmentType.CENTER 
        })],
        borders: HEADER_CELL_BORDER, verticalAlign: VerticalAlign.CENTER
    });

    if (leftLogoBase64 && rightLogoBase64) {
        headerCells.push(createLogoCell(leftLogoBase64));
        headerCells.push(new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER, verticalAlign: VerticalAlign.CENTER
        }));
        headerCells.push(createLogoCell(rightLogoBase64));
    } else if (leftLogoBase64) {
        headerCells.push(createLogoCell(leftLogoBase64));
        headerCells.push(new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER, verticalAlign: VerticalAlign.CENTER
        }));
    } else if (rightLogoBase64) {
        headerCells.push(new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER, verticalAlign: VerticalAlign.CENTER
        }));
        headerCells.push(createLogoCell(rightLogoBase64));
    } else {
        headerCells.push(new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER, verticalAlign: VerticalAlign.CENTER
        }));
    }

    const headerTable = new Table({
        rows: [new TableRow({ children: headerCells })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        // Border tabel dikosongkan karena sudah ditangani oleh border cell
        borders: INVISIBLE_BORDER
    });

    docChildren.push(headerTable);
    docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spasi

    // Judul Ujian
    docChildren.push(new Paragraph({ 
        children: [new TextRun({ text: exam.title.toUpperCase(), bold: true, size: 24, font: mainFont })], 
        alignment: AlignmentType.CENTER, 
        spacing: { after: 200 } 
    }));

    // --- 2. INFORMASI UJIAN (Meta Info & Score Box) ---
    // Layout: Label (25%), Value (55%), Score Box (20% - Merged Vertical)
    
    const dotsLong = ": ................................";
    const dateStr = new Date(exam.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const metaData = [
        { label: "Nama Siswa", value: dotsLong }, // Placeholder
        { label: "Mata Pelajaran", value: `: ${exam.subject}` },
        { label: "Kelas / Jenjang", value: `: ${exam.class}` },
        { label: "Hari / Tanggal", value: `: ${dateStr}` },
        { label: "Waktu", value: `: ${exam.waktuUjian || ''}` },
    ];

    const metaTableRows = metaData.map((data, index) => {
        // Kolom 3 (Nilai) Logic
        const scoreChildren = index === 0 ? [
            new Paragraph({ children: [new TextRun({ text: "Nilai", bold: true, size: 24, font: mainFont })], alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "" })
        ] : []; 

        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: data.label, bold: true, size: 24, font: mainFont })], spacing: { after: 60 } })],
                    borders: INVISIBLE_BORDER, verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: data.value, size: 24, font: mainFont })], spacing: { after: 60 } })],
                    borders: INVISIBLE_BORDER, verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: scoreChildren,
                    verticalMerge: index === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
                    borders: SOLID_BORDER,
                    verticalAlign: VerticalAlign.TOP
                })
            ]
        });
    });

    const metaTable = new Table({
        rows: metaTableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: INVISIBLE_BORDER
    });

    docChildren.push(metaTable);
    docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));

    // --- 3. PETUNJUK PENGERJAAN ---
    if(exam.instructions) {
        docChildren.push(new Paragraph({ 
            children: [new TextRun({ text: "Petunjuk Pengerjaan:", bold: true, font: mainFont, size: 24, italics: true })],
            spacing: { after: 60 }
        }));
        
        const instructionLines = exam.instructions.split('\n');
        instructionLines.forEach(line => {
            if (line.trim()) {
                docChildren.push(new Paragraph({ 
                    children: [new TextRun({ text: line.trim(), font: mainFont, size: 24 })],
                    spacing: { after: 40 } 
                }));
            }
        });
        docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // --- 4. ISI SOAL ---
    for(const section of exam.sections) {
        // Instruksi Bagian
        docChildren.push(new Paragraph({ 
            children: parseHtmlToRuns(section.instructions, mainFont),
            spacing: { before: 200, after: 120 }
        }));

        // Stimulus (Wacana)
        if (section.stimulus) {
            docChildren.push(new Paragraph({
                children: parseHtmlToRuns(section.stimulus, mainFont),
                spacing: { after: 200 },
                alignment: AlignmentType.JUSTIFIED
            }));
        }

        for(const question of section.questions) {
            // Teks Soal
            const qRuns = parseHtmlToRuns(question.text, mainFont);
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${question.number}. `, bold: true, font: mainFont, size: 24 }),
                    ...qRuns
                ],
                spacing: { after: 120 },
                indent: { hanging: 360, left: 360 }
            }));

            // Pilihan Ganda
            if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                if (question.choices) {
                    question.choices.forEach((choice, idx) => {
                        const letter = String.fromCharCode(65 + idx) + "."; 
                        const choiceRuns = parseHtmlToRuns(choice.text, mainFont);
                        docChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: `${letter}\t`, font: mainFont, size: 24 }),
                                ...choiceRuns
                            ],
                            indent: { left: 720, hanging: 360 },
                            spacing: { after: 60 }
                        }));
                    });
                }
            } 
            // Benar / Salah
            else if (question.type === QuestionType.TRUE_FALSE) {
                 docChildren.push(new Paragraph({ 
                     children: [new TextRun({ text: "      [   ] BENAR     [   ] SALAH", font: mainFont, size: 24 })],
                     indent: { left: 720 },
                     spacing: { after: 120 }
                 }));
            } 
            // Esai / Isian (Garis Jawaban dengan Tabel)
            else if ((question.type === QuestionType.ESSAY || question.type === QuestionType.SHORT_ANSWER) && question.hasAnswerSpace) {
                const answerRows = [1, 2, 3].map(() => new TableRow({
                    height: { value: 320, rule: HeightRule.ATLEAST }, // ~0.56cm
                    children: [
                        new TableCell({
                            children: [new Paragraph({})], // Empty paragraph
                            borders: {
                                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            },
                            width: { size: 100, type: WidthType.PERCENTAGE }
                        })
                    ]
                }));

                docChildren.push(new Table({
                    rows: answerRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: INVISIBLE_BORDER
                }));
                docChildren.push(new Paragraph({ text: "", spacing: { after: 100 } }));
            }
            
            // Spacer antar soal
            docChildren.push(new Paragraph({ text: "", spacing: { after: 100 } }));
        }
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: mainFont,
                        size: 24, // 12pt default
                        color: "000000",
                    },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: settings.margins.top * 56.7, // mm to twips
                        right: settings.margins.right * 56.7,
                        bottom: settings.margins.bottom * 56.7,
                        left: settings.margins.left * 56.7,
                    }
                }
            },
            children: docChildren,
        }],
    });

    return await Packer.toBlob(doc);
};