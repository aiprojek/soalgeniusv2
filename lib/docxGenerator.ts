import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun,
    AlignmentType,
    BorderStyle,
    VerticalAlign,
    VerticalMergeType,
    HeightRule,
    Footer,
    SectionType
} from "docx";
import { Exam, Settings, QuestionType, Choice, MatchingPair, TableData } from "../types";
import { sanitizeRichHtml } from "./utils";

// --- RTL & Arabic Numerals / Letters Helpers ---
const toArabicNumeral = (n: string | number): string => {
    const num = String(n);
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, d => arabicNumerals[parseInt(d, 10)]);
};

const toArabicLetter = (index: number): string => {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
    return letters[index] || String.fromCharCode(97 + index);
};

const translations = {
    ltr: {
        name: 'Nama Siswa',
        class: 'Kelas / Jenjang',
        subject: 'Mata Pelajaran',
        date: 'Hari / Tanggal',
        examTime: 'Waktu Ujian',
        score: 'Nilai',
        instructions: 'Petunjuk Pengerjaan:',
        trueFalsePrompt: 'Lingkari salah satu:',
        trueText: 'BENAR',
        falseText: 'SALAH',
        colA: 'Kolom A',
        colB: 'Kolom B',
        answerKeyTitle: 'KUNCI JAWABAN',
        noAnswer: 'Tidak ada jawaban',
        trueAnswer: 'Benar',
        falseAnswer: 'Salah',
        rowLabel: 'Baris',
    },
    rtl: {
        name: 'الاسم',
        class: 'الصف / المستوى',
        subject: 'المادة الدراسية',
        date: 'اليوم / التاريخ',
        examTime: 'وقت الاختبار',
        score: 'الدرجة',
        instructions: 'تعليمات الإجابة:',
        trueFalsePrompt: 'ضع دائرة حول إحدى الإجابتين:',
        trueText: 'صح',
        falseText: 'خطأ',
        colA: 'العمود أ',
        colB: 'العمود ب',
        answerKeyTitle: 'مفتاح الإجابة',
        noAnswer: 'لا توجد إجابة',
        trueAnswer: 'صح',
        falseAnswer: 'خطأ',
        rowLabel: 'السطر',
    },
};

const instructionTranslations: Record<string, string> = {
    'Berilah tanda silang (X) pada pilihan jawaban yang benar!': 'اختر الإجابة الصحيحة بوضع علامة (X)!',
    'Pilihlah jawaban yang benar dengan memberi tanda centang (✓). Jawaban benar bisa lebih dari satu.': 'اختر الإجابات الصحيحة بوضع علامة (✓). يمكن أن تكون هناك أكثر من إجابة صحيحة.',
    'Isilah titik-titik di bawah ini dengan jawaban yang benar dan tepat!': 'املأ الفراغات التالية بالإجابات الصحيحة!',
    'Jawablah pertanyaan di bawah ini dengan benar!': 'أجب عن الأسئلة التالية بشكل صحيح!',
    'Jodohkan pernyataan di kolom A dengan jawaban yang sesuai di kolom B!': 'طابق بين العبارات في العمود أ والإجابات المناسبة في العمود ب!',
    'Tentukan apakah pernyataan berikut Benar atau Salah!': 'حدد ما إذا كانت العبارات التالية صحيحة أم خاطئة!',
    'Pilihlah salah satu jawaban yang paling tepat!': 'اختر الإجابة الصحيحة بوضع علامة (X)!',
    'Jawablah pertanyaan berikut dengan singkat dan jelas!': 'أجب عن الأسئلة التالية بشكل صحيح!',
    'Lengkapilah tabel isian berikut dengan jawaban yang tepat!': 'املأ الجدول التالي بالإجابات الصحيحة!',
    'Lengkapilah tabel berikut dengan memilih jawaban yang paling tepat!': 'املأ الجدول التالي باختيار الإجابة الصحيحة!',
    'Lengkapilah tabel berikut. Jawaban benar bisa lebih dari satu untuk setiap baris.': 'املأ الجدول التالي. يمكن أن تكون هناك أكثر من إجابة صحيحة لكل سطر.',
};

// Helper to convert base64 string to Uint8Array for images
const base64ToUint8Array = (base64: string): Uint8Array => {
    try {
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
    top: { style: BorderStyle.SINGLE, size: 4, color: "475569" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "475569" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "475569" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "475569" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
};

const HEADER_CELL_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.DOUBLE, size: 12, color: "000000" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

// Helper to clean and format LaTeX formulas into human-readable Unicode mathematical expressions for Word
const cleanLatexToReadable = (latex: string): string => {
    let result = latex
        .replace(/\\times/g, ' × ')
        .replace(/\\cdot/g, ' · ')
        .replace(/\\div/g, ' ÷ ')
        .replace(/\\pm/g, ' ± ')
        .replace(/\\mp/g, ' ∓ ')
        .replace(/\\le(q)?/g, ' ≤ ')
        .replace(/\\ge(q)?/g, ' ≥ ')
        .replace(/\\neq/g, ' ≠ ')
        .replace(/\\approx/g, ' ≈ ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\pi/g, 'π')
        .replace(/\\theta/g, 'θ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\infty/g, '∞')
        .replace(/\\sum/g, '∑')
        .replace(/\\int/g, '∫')
        .replace(/\\partial/g, '∂')
        .replace(/\\sqrt\[(.*?)\]\{(.*?)\}/g, ' $1√($2) ')
        .replace(/\\sqrt\{(.*?)\}/g, ' √($1) ')
        .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, ' ($1)/($2) ')
        .replace(/\\vec\{(.*?)\}/g, '$1⃗')
        .replace(/\\circ/g, '°')
        .replace(/\\%/g, '%')
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')
        .replace(/\\,/g, ' ')
        .replace(/\\;/g, ' ')
        .replace(/\\quad/g, '   ')
        .replace(/\\text\{(.*?)\}/g, '$1')
        .replace(/\\mathbf\{(.*?)\}/g, '$1')
        .replace(/\\mathit\{(.*?)\}/g, '$1');

    return result.trim();
};

interface RunStyle {
    bold?: boolean;
    italics?: boolean;
    underline?: boolean;
    strike?: boolean;
    sub?: boolean;
    super?: boolean;
    color?: string;
    background?: string;
}

// Convert CSS color (hex / rgb) to DOCX hex color (without #)
const parseColorToHex = (colorStr: string | null): string | undefined => {
    if (!colorStr) return undefined;
    const clean = colorStr.trim();
    if (clean.startsWith('#')) {
        const hex = clean.substring(1);
        if (hex.length === 3) {
            return hex.split('').map(c => c + c).join('').toUpperCase();
        }
        if (hex.length === 6) return hex.toUpperCase();
    } else if (clean.startsWith('rgb')) {
        const matches = clean.match(/\d+/g);
        if (matches && matches.length >= 3) {
            const r = parseInt(matches[0], 10).toString(16).padStart(2, '0');
            const g = parseInt(matches[1], 10).toString(16).padStart(2, '0');
            const b = parseInt(matches[2], 10).toString(16).padStart(2, '0');
            return `${r}${g}${b}`.toUpperCase();
        }
    }
    return undefined;
};

// Helper to parse HTML rich text to docx TextRuns & ImageRuns with full fidelity
export const parseHtmlToRuns = (
    html: string,
    mainFont: string,
    fontSizeHalfPts = 24,
    isRTL = false,
    maxImageWidth = 320,
    maxImageHeight = 240
): (TextRun | ImageRun)[] => {
    const runs: (TextRun | ImageRun)[] = [];
    if (!html) return runs;

    const div = document.createElement('div');
    div.innerHTML = sanitizeRichHtml(html);

    const fontProp = isRTL ? { name: mainFont, cs: mainFont, ascii: mainFont, hAnsi: mainFont } : mainFont;

    const processTextWithFormulas = (text: string, style: RunStyle) => {
        if (!text) return;

        // Check for LaTeX formula patterns: $$formula$$ or $formula$
        const formulaRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = formulaRegex.exec(text)) !== null) {
            // Text before formula
            if (match.index > lastIndex) {
                const textBefore = text.substring(lastIndex, match.index);
                if (textBefore) {
                    runs.push(new TextRun({
                        text: textBefore,
                        bold: style.bold,
                        boldComplexScript: style.bold,
                        italics: style.italics,
                        italicsComplexScript: style.italics,
                        underline: style.underline ? {} : undefined,
                        strike: style.strike,
                        subScript: style.sub,
                        superScript: style.super,
                        color: style.color,
                        font: fontProp,
                        size: fontSizeHalfPts,
                        sizeComplexScript: fontSizeHalfPts,
                        rightToLeft: isRTL,
                    }));
                }
            }

            // Formula match
            const rawFormula = match[0];
            const isDisplay = rawFormula.startsWith('$$');
            const cleanedLatex = rawFormula.replace(/^\$\$|\$\$$|^\$|\$$/g, '');
            const readableFormula = cleanLatexToReadable(cleanedLatex);

            runs.push(new TextRun({
                text: isDisplay ? `  ${readableFormula}  ` : readableFormula,
                bold: style.bold,
                boldComplexScript: style.bold,
                italics: true,
                italicsComplexScript: true,
                font: 'Cambria Math',
                size: fontSizeHalfPts,
                sizeComplexScript: fontSizeHalfPts,
                color: style.color || '1E40AF', // slight navy/math color tint
                rightToLeft: false, // Math equations are LTR
            }));

            lastIndex = match.index + rawFormula.length;
        }

        // Remaining text after last formula
        if (lastIndex < text.length) {
            const remaining = text.substring(lastIndex);
            if (remaining) {
                runs.push(new TextRun({
                    text: remaining,
                    bold: style.bold,
                    boldComplexScript: style.bold,
                    italics: style.italics,
                    italicsComplexScript: style.italics,
                    underline: style.underline ? {} : undefined,
                    strike: style.strike,
                    subScript: style.sub,
                    superScript: style.super,
                    color: style.color,
                    font: fontProp,
                    size: fontSizeHalfPts,
                    sizeComplexScript: fontSizeHalfPts,
                    rightToLeft: isRTL,
                }));
            }
        }
    };

    const traverse = (node: Node, style: RunStyle = {}) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const content = node.textContent || '';
            processTextWithFormulas(content, style);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toUpperCase();

            if (tagName === 'IMG') {
                const src = el.getAttribute('src');
                if (src && src.startsWith('data:image')) {
                    try {
                        const imageBuffer = base64ToUint8Array(src);
                        // Read explicit image dimensions if present
                        let imgWidth = parseInt(el.getAttribute('width') || '', 10) || maxImageWidth;
                        let imgHeight = parseInt(el.getAttribute('height') || '', 10) || maxImageHeight;
                        if (imgWidth > maxImageWidth) {
                            const ratio = maxImageWidth / imgWidth;
                            imgWidth = maxImageWidth;
                            imgHeight = Math.round(imgHeight * ratio);
                        }
                        if (imgHeight > maxImageHeight) {
                            const ratio = maxImageHeight / imgHeight;
                            imgHeight = maxImageHeight;
                            imgWidth = Math.round(imgWidth * ratio);
                        }

                        runs.push(new ImageRun({
                            data: imageBuffer,
                            transformation: { width: Math.max(imgWidth, 50), height: Math.max(imgHeight, 50) },
                            type: getImageType(src),
                        }));
                    } catch (e) {
                        console.error("Failed to add image inside question", e);
                    }
                }
            } else if (tagName === 'BR') {
                runs.push(new TextRun({ text: "", break: 1, rightToLeft: isRTL }));
            } else {
                const newStyle: RunStyle = { ...style };
                if (['B', 'STRONG'].includes(tagName)) newStyle.bold = true;
                if (['I', 'EM'].includes(tagName)) newStyle.italics = true;
                if (tagName === 'U') newStyle.underline = true;
                if (['S', 'STRIKE', 'DEL'].includes(tagName)) newStyle.strike = true;
                if (tagName === 'SUB') newStyle.sub = true;
                if (tagName === 'SUP') newStyle.super = true;

                // Color extraction from style or font tag
                const colorAttr = el.getAttribute('color') || el.style.color;
                const parsedColor = parseColorToHex(colorAttr);
                if (parsedColor) newStyle.color = parsedColor;

                if (['P', 'DIV', 'LI', 'TR'].includes(tagName) && runs.length > 0) {
                    runs.push(new TextRun({ text: "", break: 1, rightToLeft: isRTL }));
                }

                el.childNodes.forEach(child => traverse(child, newStyle));
            }
        }
    };

    traverse(div);
    return runs;
};

export const generateDocx = async (exam: Exam, settings: Settings, mode: 'exam' | 'answer_key' = 'exam'): Promise<Blob> => {
    const isRTL = exam.direction === 'rtl';
    const mainFont = settings.fontFamily || (isRTL ? "Amiri" : "Times New Roman");
    const fontSizeHalfPts = (settings.fontSize || 12) * 2;
    const lineSpacingTwips = Math.round((settings.lineSpacing || 1.15) * 240);
    const T = translations[isRTL ? 'rtl' : 'ltr'];
    const isTwoColumnExam = (exam.layoutColumns || 1) === 2 && mode === 'exam';

    const fontProp = isRTL ? { name: mainFont, cs: mainFont, ascii: mainFont, hAnsi: mainFont } : mainFont;

    const createRun = (options: {
        text: string;
        bold?: boolean;
        italics?: boolean;
        underline?: boolean;
        strike?: boolean;
        subScript?: boolean;
        superScript?: boolean;
        color?: string;
        font?: any;
        size?: number;
        break?: number;
    }): TextRun => new TextRun({
        text: options.text,
        bold: options.bold,
        boldComplexScript: options.bold,
        italics: options.italics,
        italicsComplexScript: options.italics,
        underline: options.underline ? {} : undefined,
        strike: options.strike,
        subScript: options.subScript,
        superScript: options.superScript,
        color: options.color,
        font: options.font || fontProp,
        size: options.size || fontSizeHalfPts,
        sizeComplexScript: options.size || fontSizeHalfPts,
        rightToLeft: isRTL,
        break: options.break,
    });

    // Page margins in twips (1mm = 56.7 twips)
    const pageMargins = {
        top: Math.round((settings.margins?.top || 20) * 56.7),
        right: Math.round((settings.margins?.right || 20) * 56.7),
        bottom: Math.round((settings.margins?.bottom || 20) * 56.7),
        left: Math.round((settings.margins?.left || 20) * 56.7),
    };

    // Paper sizes in twips
    const paperSizeDimensions: Record<string, { width: number; height: number }> = {
        'A4': { width: 11906, height: 16838 },
        'F4': { width: 12189, height: 18709 },
        'Legal': { width: 12240, height: 20183 },
        'Letter': { width: 12240, height: 15818 },
    };
    const paperDim = paperSizeDimensions[settings.paperSize] || paperSizeDimensions['A4'];

    const watermarkFooter = new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: isRTL,
                children: [
                    createRun({
                        text: "Dibuat dengan SoalGenius by AI Projek | aiprojek01.my.id",
                        color: "64748B", // Slate-500 solid 100%
                        italics: true,
                        size: 16, // 8pt
                    }),
                ],
            }),
        ],
    });

    if (mode === 'answer_key') {
        // --- ANSWER KEY MODE ---
        const answerKeyChildren: any[] = [];

        // 1. Answer Key Title Banner
        answerKeyChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: isRTL,
            children: [
                createRun({
                    text: T.answerKeyTitle,
                    bold: true,
                    size: fontSizeHalfPts + 6,
                    color: "1E3A8A",
                }),
            ],
            spacing: { after: 120 },
        }));

        answerKeyChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: isRTL,
            children: [
                createRun({
                    text: exam.title,
                    bold: true,
                    size: fontSizeHalfPts + 2,
                }),
            ],
            spacing: { after: 120 },
        }));

        const metaText = `${T.subject}: ${exam.subject || '-'}   |   ${T.class}: ${exam.class || '-'}`;
        answerKeyChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: isRTL,
            children: [
                createRun({
                    text: metaText,
                    italics: true,
                    size: fontSizeHalfPts - 2,
                    color: "475569",
                }),
            ],
            spacing: { after: 300 },
        }));

        // Divider
        answerKeyChildren.push(new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT })],
                            borders: {
                                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                bottom: { style: BorderStyle.SINGLE, size: 8, color: "1E3A8A" },
                                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            },
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    ]
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: INVISIBLE_BORDER,
            visuallyRightToLeft: isRTL,
        }));
        answerKeyChildren.push(new Paragraph({ text: "", spacing: { after: 200 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));

        // 2. Sections & Question Answers
        for (const section of exam.sections) {
            let sectionInstruction = section.instructions;
            const instructionParts = sectionInstruction.match(/^([^.]+)\.(.*)/);
            if (instructionParts && instructionParts.length > 2) {
                const text = instructionParts[2].trim();
                if (isRTL) {
                    sectionInstruction = instructionTranslations[text] || text;
                }
            }

            answerKeyChildren.push(new Paragraph({
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                bidirectional: isRTL,
                children: [
                    createRun({
                        text: sectionInstruction,
                        bold: true,
                        size: fontSizeHalfPts,
                        color: "1E3A8A",
                    }),
                ],
                spacing: { before: 240, after: 140 },
            }));

            for (const q of section.questions) {
                if (q.type === QuestionType.STIMULUS) continue; // Skip standalone stimulus in answer key

                const qNumberDisplay = isRTL ? `${toArabicNumeral(q.number)}.` : `${q.number}.`;
                let answerRuns: (TextRun | ImageRun)[] = [];

                switch (q.type) {
                    case QuestionType.MULTIPLE_CHOICE: {
                        const choice = (q.choices || []).find(c => c.id === q.answerKey);
                        if (choice) {
                            const choiceIndex = (q.choices || []).indexOf(choice);
                            const choiceLetter = isRTL ? toArabicLetter(choiceIndex) : String.fromCharCode(65 + choiceIndex);
                            const choiceTextRuns = parseHtmlToRuns(choice.text, mainFont, fontSizeHalfPts, isRTL);
                            answerRuns = [
                                createRun({ text: `${choiceLetter}. `, bold: true, size: fontSizeHalfPts, color: "15803D" }),
                                ...choiceTextRuns
                            ];
                        } else {
                            answerRuns = [createRun({ text: T.noAnswer, italics: true, size: fontSizeHalfPts, color: "94A3B8" })];
                        }
                        break;
                    }
                    case QuestionType.COMPLEX_MULTIPLE_CHOICE: {
                        const correctIds = (q.answerKey as string[] || []);
                        const correctChoices = (q.choices || []).filter(c => correctIds.includes(c.id));
                        if (correctChoices.length > 0) {
                            const letters = correctChoices.map(c => {
                                const idx = (q.choices || []).indexOf(c);
                                return isRTL ? toArabicLetter(idx) : String.fromCharCode(65 + idx);
                            }).join(', ');
                            answerRuns = [createRun({ text: letters, bold: true, size: fontSizeHalfPts, color: "15803D" })];
                        } else {
                            answerRuns = [createRun({ text: T.noAnswer, italics: true, size: fontSizeHalfPts, color: "94A3B8" })];
                        }
                        break;
                    }
                    case QuestionType.TRUE_FALSE: {
                        const isTrue = q.answerKey === 'true';
                        const text = isTrue ? T.trueAnswer : T.falseAnswer;
                        answerRuns = [createRun({ text: text, bold: true, size: fontSizeHalfPts, color: "15803D" })];
                        break;
                    }
                    case QuestionType.MATCHING: {
                        const key = q.matchingKey || [];
                        if (key.length > 0) {
                            const pairsText = key.map(pair => {
                                const promptIndex = (q.matchingPrompts || []).findIndex(p => p.id === pair.promptId);
                                const answerIndex = (q.matchingAnswers || []).findIndex(a => a.id === pair.answerId);
                                if (promptIndex > -1 && answerIndex > -1) {
                                    const pNum = isRTL ? toArabicNumeral(promptIndex + 1) : String(promptIndex + 1);
                                    const aLet = isRTL ? toArabicLetter(answerIndex) : String.fromCharCode(65 + answerIndex);
                                    return isRTL ? `${pNum} ← ${aLet}` : `${pNum} → ${aLet}`;
                                }
                                return null;
                            }).filter(Boolean).join('   |   ');
                            answerRuns = [createRun({ text: pairsText || T.noAnswer, bold: true, size: fontSizeHalfPts, color: "15803D" })];
                        } else {
                            answerRuns = [createRun({ text: T.noAnswer, italics: true, size: fontSizeHalfPts, color: "94A3B8" })];
                        }
                        break;
                    }
                    case QuestionType.SHORT_ANSWER:
                    case QuestionType.ESSAY: {
                        if (q.answerKey && typeof q.answerKey === 'string') {
                            answerRuns = parseHtmlToRuns(q.answerKey, mainFont, fontSizeHalfPts, isRTL);
                        } else {
                            answerRuns = [createRun({ text: T.noAnswer, italics: true, size: fontSizeHalfPts, color: "94A3B8" })];
                        }
                        break;
                    }
                    case QuestionType.TABLE: {
                        if (q.tableData && q.tableAnswerKey) {
                            const tableRows = q.tableData.rows.map(row => {
                                const cells = row.cells.filter(cell => !cell.isMerged).map(cell => {
                                    const answer = (q.tableAnswerKey || {})[cell.id];
                                    const contentRuns = parseHtmlToRuns(cell.content, mainFont, fontSizeHalfPts - 2, isRTL);
                                    const cellChildren = [new Paragraph({ children: contentRuns, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT, bidirectional: isRTL })];
                                    if (answer) {
                                        cellChildren.push(new Paragraph({
                                            children: [createRun({ text: `[${answer}]`, bold: true, color: "15803D", size: fontSizeHalfPts - 2 })],
                                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                            bidirectional: isRTL,
                                        }));
                                    }
                                    return new TableCell({
                                        children: cellChildren,
                                        columnSpan: cell.colspan || 1,
                                        rowSpan: cell.rowspan || 1,
                                        borders: SOLID_BORDER,
                                        margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                        verticalAlign: cell.verticalAlign === 'top' ? VerticalAlign.TOP : cell.verticalAlign === 'bottom' ? VerticalAlign.BOTTOM : VerticalAlign.CENTER,
                                    });
                                });
                                return new TableRow({ children: cells });
                            });
                            answerKeyChildren.push(new Paragraph({
                                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                bidirectional: isRTL,
                                children: [createRun({ text: `${qNumberDisplay} `, bold: true, size: fontSizeHalfPts })],
                                spacing: { before: 100, after: 60 }
                            }));
                            answerKeyChildren.push(new Table({
                                rows: tableRows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: SOLID_BORDER,
                                visuallyRightToLeft: isRTL,
                            }));
                            answerKeyChildren.push(new Paragraph({ text: "", spacing: { after: 120 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
                            continue;
                        }
                        break;
                    }
                    case QuestionType.TABLE_MULTIPLE_CHOICE:
                    case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE: {
                        const key = q.tableChoiceAnswerKey || {};
                        const choices = q.choices || [];
                        const rowAnswers = (q.tableData?.rows || []).map((row, rIdx) => {
                            const rowAns = key[row.id];
                            const rNum = isRTL ? toArabicNumeral(rIdx + 1) : String(rIdx + 1);
                            const rLabel = `${T.rowLabel} ${rNum}`;
                            if (!rowAns || (Array.isArray(rowAns) && rowAns.length === 0)) {
                                return `${rLabel}: ${T.noAnswer}`;
                            }
                            const getChoiceLabel = (cId: string) => {
                                const c = choices.find(ch => ch.id === cId);
                                if (!c) return '?';
                                const cIdx = choices.indexOf(c);
                                return isRTL ? toArabicLetter(cIdx) : String.fromCharCode(65 + cIdx);
                            };
                            const ansText = Array.isArray(rowAns) ? rowAns.map(getChoiceLabel).join(', ') : getChoiceLabel(rowAns);
                            return `${rLabel}: ${ansText}`;
                        }).join('   |   ');

                        answerRuns = [createRun({ text: rowAnswers || T.noAnswer, bold: true, size: fontSizeHalfPts, color: "15803D" })];
                        break;
                    }
                    default:
                        answerRuns = [createRun({ text: T.noAnswer, italics: true, size: fontSizeHalfPts })];
                }

                answerKeyChildren.push(new Paragraph({
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    bidirectional: isRTL,
                    children: [
                        createRun({ text: `${qNumberDisplay}  `, bold: true, size: fontSizeHalfPts }),
                        ...answerRuns
                    ],
                    spacing: { after: 100 },
                    indent: isRTL ? undefined : { left: 400, hanging: 400 }
                }));
            }
        }

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: fontProp,
                            size: fontSizeHalfPts,
                            sizeComplexScript: fontSizeHalfPts,
                            color: "000000",
                            rightToLeft: isRTL,
                        },
                        paragraph: {
                            lineSpacing: lineSpacingTwips,
                            bidirectional: isRTL,
                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        },
                    },
                },
            },
            sections: [{
                properties: {
                    page: {
                        size: { width: paperDim.width, height: paperDim.height },
                        margin: pageMargins,
                    },
                },
                children: answerKeyChildren,
                footers: { default: watermarkFooter },
            }],
        });

        return await Packer.toBlob(doc);
    }

    // ==========================================
    // --- EXAM PAPER MODE ---
    // ==========================================
    const headerChildren: any[] = [];
    const questionsChildren: any[] = [];

    // --- 1. HEADER (KOP SURAT) ---
    const [leftLogoBase64, rightLogoBase64] = settings.logos || [];
    const headerCells: TableCell[] = [];

    const headerTextParas = (settings.examHeaderLines || []).map(line => new Paragraph({
        children: [createRun({
            text: line.text,
            bold: true,
            size: line.sizeMode === 'fixed' ? (line.sizePt ? line.sizePt * 2 : fontSizeHalfPts) : fontSizeHalfPts + 4,
        })],
        alignment: AlignmentType.CENTER,
        bidirectional: isRTL,
        spacing: { after: 40, line: 240 },
    }));

    const createLogoCell = (base64: string, widthPercent: number) => new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        children: [new Paragraph({
            children: [new ImageRun({
                data: base64ToUint8Array(base64),
                transformation: { width: 65, height: 65 },
                type: getImageType(base64),
            })],
            alignment: AlignmentType.CENTER,
            bidirectional: isRTL,
        })],
        borders: HEADER_CELL_BORDER,
        verticalAlign: VerticalAlign.CENTER
    });

    if (leftLogoBase64 && rightLogoBase64) {
        headerCells.push(createLogoCell(isRTL ? rightLogoBase64 : leftLogoBase64, 15));
        headerCells.push(new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER
        }));
        headerCells.push(createLogoCell(isRTL ? leftLogoBase64 : rightLogoBase64, 15));
    } else if (leftLogoBase64) {
        headerCells.push(createLogoCell(leftLogoBase64, 15));
        headerCells.push(new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER
        }));
    } else if (rightLogoBase64) {
        headerCells.push(new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER
        }));
        headerCells.push(createLogoCell(rightLogoBase64, 15));
    } else {
        headerCells.push(new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: headerTextParas,
            borders: HEADER_CELL_BORDER,
            verticalAlign: VerticalAlign.CENTER
        }));
    }

    const headerTable = new Table({
        rows: [new TableRow({ children: headerCells })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: INVISIBLE_BORDER,
        visuallyRightToLeft: isRTL,
    });

    headerChildren.push(headerTable);
    headerChildren.push(new Paragraph({ text: "", spacing: { after: 160 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));

    // Judul Ujian
    headerChildren.push(new Paragraph({
        children: [createRun({ text: exam.title.toUpperCase(), bold: true, size: fontSizeHalfPts + 2 })],
        alignment: AlignmentType.CENTER,
        bidirectional: isRTL,
        spacing: { after: 180 }
    }));

    // --- 2. INFORMASI UJIAN (Meta Info & Score Box) ---
    const dateFormatted = new Date(exam.date).toLocaleDateString(isRTL ? 'ar-SA-u-nu-arab' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dotsPlaceholder = "........................................................";

    const metaData = [
        { label: T.name, value: `: ${dotsPlaceholder}` },
        { label: T.class, value: `: ${exam.class || ''}` },
        { label: T.subject, value: `: ${exam.subject || ''}` },
        { label: T.date, value: `: ${dateFormatted}` },
        { label: T.examTime, value: `: ${exam.waktuUjian || ''}` },
    ];

    const metaTableRows = metaData.map((data, index) => {
        const scoreChildren = index === 0 ? [
            new Paragraph({
                children: [createRun({ text: T.score, bold: true, size: fontSizeHalfPts })],
                alignment: AlignmentType.CENTER,
                bidirectional: isRTL,
                spacing: { after: 80 }
            }),
            new Paragraph({ text: "", spacing: { after: 200 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT })
        ] : [];

        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [createRun({ text: data.label, bold: true, size: fontSizeHalfPts })],
                        spacing: { after: 50 },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        bidirectional: isRTL,
                    })],
                    borders: INVISIBLE_BORDER,
                    verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [createRun({ text: data.value, size: fontSizeHalfPts })],
                        spacing: { after: 50 },
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        bidirectional: isRTL,
                    })],
                    borders: INVISIBLE_BORDER,
                    verticalAlign: VerticalAlign.CENTER
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
        borders: INVISIBLE_BORDER,
        visuallyRightToLeft: isRTL,
    });

    headerChildren.push(metaTable);
    headerChildren.push(new Paragraph({ text: "", spacing: { after: 200 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));

    // --- 3. PETUNJUK PENGERJAAN UMUM ---
    if (exam.instructions && exam.instructions.trim()) {
        headerChildren.push(new Paragraph({
            children: [createRun({ text: T.instructions, bold: true, size: fontSizeHalfPts, italics: true })],
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: isRTL,
            spacing: { after: 60 }
        }));

        const instructionLines = exam.instructions.split('\n');
        instructionLines.forEach(line => {
            if (line.trim()) {
                headerChildren.push(new Paragraph({
                    children: [createRun({ text: line.trim(), size: fontSizeHalfPts })],
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    bidirectional: isRTL,
                    spacing: { after: 40 }
                }));
            }
        });
        headerChildren.push(new Paragraph({ text: "", spacing: { after: 160 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
    }

    // --- 4. ISI SOAL (SECTIONS & QUESTIONS) ---
    for (const section of exam.sections) {
        // Section Instruction
        let instructionText = section.instructions;
        const instructionParts = instructionText.match(/^([^.]+)\.(.*)/);
        if (instructionParts && instructionParts.length > 2) {
            const rawBody = instructionParts[2].trim();
            if (isRTL) {
                const translated = instructionTranslations[rawBody] || rawBody;
                instructionText = translated;
            }
        }

        questionsChildren.push(new Paragraph({
            children: [createRun({ text: instructionText, bold: true, size: fontSizeHalfPts })],
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: isRTL,
            spacing: { before: 200, after: 120 }
        }));

        // Section-level stimulus (wacana)
        if (section.stimulus && section.stimulus.trim()) {
            questionsChildren.push(new Paragraph({
                children: parseHtmlToRuns(section.stimulus, mainFont, fontSizeHalfPts, isRTL),
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                bidirectional: isRTL,
                spacing: { after: 160 }
            }));
        }

        // Section Questions
        for (const question of section.questions) {
            // If it is a stimulus type, render distinct block without numbering
            if (question.type === QuestionType.STIMULUS) {
                questionsChildren.push(new Paragraph({
                    children: parseHtmlToRuns(question.text, mainFont, fontSizeHalfPts, isRTL),
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    bidirectional: isRTL,
                    spacing: { before: 100, after: 160 }
                }));
                continue;
            }

            const qNumberDisplay = isRTL ? `${toArabicNumeral(question.number)}.` : `${question.number}.`;
            const qRuns = parseHtmlToRuns(question.text, mainFont, fontSizeHalfPts, isRTL);

            // Question Prompt Line
            questionsChildren.push(new Paragraph({
                children: [
                    createRun({ text: `${qNumberDisplay} `, bold: true, size: fontSizeHalfPts }),
                    ...qRuns
                ],
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                bidirectional: isRTL,
                spacing: { after: 100 },
                indent: isRTL ? undefined : { left: 400, hanging: 400 }
            }));

            // --- Multiple Choice Options ---
            if (question.type === QuestionType.MULTIPLE_CHOICE) {
                if (question.choices && question.choices.length > 0) {
                    if (question.isTwoColumns && !isTwoColumnExam && question.choices.length >= 2) {
                        // Render choices in a 2-column borderless table
                        const choiceRows: TableRow[] = [];
                        for (let i = 0; i < question.choices.length; i += 2) {
                            const c1 = question.choices[i];
                            const c2 = question.choices[i + 1];

                            const c1Letter = isRTL ? toArabicLetter(i) : String.fromCharCode(65 + i);
                            const c1Runs = parseHtmlToRuns(c1.text, mainFont, fontSizeHalfPts, isRTL);
                            const c1Cell = new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({
                                    children: [createRun({ text: `${c1Letter}. `, bold: true, size: fontSizeHalfPts }), ...c1Runs],
                                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                    bidirectional: isRTL,
                                    spacing: { after: 40 }
                                })],
                                borders: INVISIBLE_BORDER,
                            });

                            let c2Cell: TableCell;
                            if (c2) {
                                const c2Letter = isRTL ? toArabicLetter(i + 1) : String.fromCharCode(65 + i + 1);
                                const c2Runs = parseHtmlToRuns(c2.text, mainFont, fontSizeHalfPts, isRTL);
                                c2Cell = new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({
                                        children: [createRun({ text: `${c2Letter}. `, bold: true, size: fontSizeHalfPts }), ...c2Runs],
                                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                        bidirectional: isRTL,
                                        spacing: { after: 40 }
                                    })],
                                    borders: INVISIBLE_BORDER,
                                });
                            } else {
                                c2Cell = new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT })],
                                    borders: INVISIBLE_BORDER,
                                });
                            }

                            choiceRows.push(new TableRow({
                                children: [c1Cell, c2Cell]
                            }));
                        }

                        questionsChildren.push(new Table({
                            rows: choiceRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: INVISIBLE_BORDER,
                            visuallyRightToLeft: isRTL,
                        }));
                    } else {
                        // Standard 1-column list of choices
                        question.choices.forEach((choice, idx) => {
                            const letter = isRTL ? toArabicLetter(idx) : String.fromCharCode(65 + idx);
                            const choiceRuns = parseHtmlToRuns(choice.text, mainFont, fontSizeHalfPts, isRTL);
                            questionsChildren.push(new Paragraph({
                                children: [
                                    createRun({ text: `${letter}.  `, bold: true, size: fontSizeHalfPts }),
                                    ...choiceRuns
                                ],
                                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                bidirectional: isRTL,
                                indent: isRTL ? { right: 360 } : { left: 720, hanging: 320 },
                                spacing: { after: 50 }
                            }));
                        });
                    }
                }
            }

            // --- Complex Multiple Choice (Pilihan Ganda Kompleks) ---
            else if (question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                if (question.choices && question.choices.length > 0) {
                    question.choices.forEach((choice, idx) => {
                        const letter = isRTL ? toArabicLetter(idx) : String.fromCharCode(65 + idx);
                        const choiceRuns = parseHtmlToRuns(choice.text, mainFont, fontSizeHalfPts, isRTL);
                        questionsChildren.push(new Paragraph({
                            children: [
                                createRun({ text: `[   ] ${letter}.  `, bold: true, size: fontSizeHalfPts }),
                                ...choiceRuns
                            ],
                            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                            bidirectional: isRTL,
                            indent: isRTL ? { right: 360 } : { left: 720, hanging: 450 },
                            spacing: { after: 50 }
                        }));
                    });
                }
            }

            // --- Benar / Salah (True / False) ---
            else if (question.type === QuestionType.TRUE_FALSE) {
                const tfText = `[   ] ${T.trueText}        [   ] ${T.falseText}`;

                questionsChildren.push(new Paragraph({
                    children: [createRun({ text: tfText, bold: true, size: fontSizeHalfPts })],
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    bidirectional: isRTL,
                    indent: isRTL ? { right: 360 } : { left: 720 },
                    spacing: { after: 120 }
                }));
            }

            // --- Esai / Isian (Garis Jawaban) ---
            else if ((question.type === QuestionType.ESSAY || question.type === QuestionType.SHORT_ANSWER) && question.hasAnswerSpace) {
                const lineCount = question.type === QuestionType.ESSAY ? 3 : 2;
                const answerRows = Array.from({ length: lineCount }).map(() => new TableRow({
                    height: { value: 340, rule: HeightRule.ATLEAST }, // ~0.6cm
                    children: [
                        new TableCell({
                            children: [new Paragraph({ bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT })],
                            borders: {
                                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                bottom: { style: BorderStyle.DOTTED, size: 4, color: "64748B" },
                                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            },
                            width: { size: 100, type: WidthType.PERCENTAGE }
                        })
                    ]
                }));

                questionsChildren.push(new Table({
                    rows: answerRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: INVISIBLE_BORDER,
                    visuallyRightToLeft: isRTL,
                }));
                questionsChildren.push(new Paragraph({ text: "", spacing: { after: 60 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
            }

            // --- Menjodohkan (Matching Table) ---
            else if (question.type === QuestionType.MATCHING) {
                const prompts = question.matchingPrompts || [];
                const answers = question.matchingAnswers || [];
                const rowCount = Math.max(prompts.length, answers.length);
                const tableRows: TableRow[] = [];

                // Header row
                const headerColA = new TableCell({
                    children: [new Paragraph({
                        children: [createRun({ text: T.colA, bold: true, size: fontSizeHalfPts })],
                        alignment: AlignmentType.CENTER,
                        bidirectional: isRTL,
                    })],
                    borders: SOLID_BORDER,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "F1F5F9" },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                });

                const headerColB = new TableCell({
                    children: [new Paragraph({
                        children: [createRun({ text: T.colB, bold: true, size: fontSizeHalfPts })],
                        alignment: AlignmentType.CENTER,
                        bidirectional: isRTL,
                    })],
                    borders: SOLID_BORDER,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "F1F5F9" },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                });

                tableRows.push(new TableRow({
                    children: [headerColA, headerColB]
                }));

                // Data rows
                for (let i = 0; i < rowCount; i++) {
                    const prompt = prompts[i];
                    const answer = answers[i];

                    const promptNum = isRTL ? toArabicNumeral(i + 1) : String(i + 1);
                    const promptRuns = prompt ? parseHtmlToRuns(prompt.text, mainFont, fontSizeHalfPts - 2, isRTL) : [];
                    const promptCell = new TableCell({
                        children: [
                            new Paragraph({
                                children: prompt ? [createRun({ text: `${promptNum}. `, bold: true, size: fontSizeHalfPts - 2 }), ...promptRuns] : [],
                                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                bidirectional: isRTL,
                                spacing: { after: 60 }
                            })
                        ],
                        borders: SOLID_BORDER,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { left: 100, right: 100, top: 80, bottom: 80 },
                        verticalAlign: VerticalAlign.CENTER
                    });

                    const answerLet = isRTL ? toArabicLetter(i) : String.fromCharCode(65 + i);
                    const answerRuns = answer ? parseHtmlToRuns(answer.text, mainFont, fontSizeHalfPts - 2, isRTL) : [];
                    const answerCell = new TableCell({
                        children: [
                            new Paragraph({
                                children: answer ? [createRun({ text: `${answerLet}. `, bold: true, size: fontSizeHalfPts - 2 }), ...answerRuns] : [],
                                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                bidirectional: isRTL,
                                spacing: { after: 60 }
                            })
                        ],
                        borders: SOLID_BORDER,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { left: 100, right: 100, top: 80, bottom: 80 },
                        verticalAlign: VerticalAlign.CENTER
                    });

                    tableRows.push(new TableRow({
                        children: [promptCell, answerCell]
                    }));
                }

                questionsChildren.push(new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: SOLID_BORDER,
                    visuallyRightToLeft: isRTL,
                }));
                questionsChildren.push(new Paragraph({ text: "", spacing: { after: 100 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
            }

            // --- Table-based Questions (TABLE, TABLE_MULTIPLE_CHOICE, TABLE_COMPLEX_MULTIPLE_CHOICE) ---
            else if (question.type === QuestionType.TABLE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                if (question.tableData && question.tableData.rows.length > 0) {
                    const tableRows = question.tableData.rows.map(row => {
                        const cells = row.cells.filter(cell => !cell.isMerged).map(cell => {
                            const cellRuns = parseHtmlToRuns(cell.content, mainFont, fontSizeHalfPts - 2, isRTL);
                            return new TableCell({
                                children: [new Paragraph({
                                    children: cellRuns,
                                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                    bidirectional: isRTL,
                                })],
                                columnSpan: cell.colspan || 1,
                                rowSpan: cell.rowspan || 1,
                                borders: SOLID_BORDER,
                                margins: { left: 100, right: 100, top: 80, bottom: 80 },
                                verticalAlign: cell.verticalAlign === 'top' ? VerticalAlign.TOP : cell.verticalAlign === 'bottom' ? VerticalAlign.BOTTOM : VerticalAlign.CENTER
                            });
                        });
                        return new TableRow({ children: cells });
                    });

                    questionsChildren.push(new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: SOLID_BORDER,
                        visuallyRightToLeft: isRTL,
                    }));
                    questionsChildren.push(new Paragraph({ text: "", spacing: { after: 100 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
                }

                // Append choices for TABLE_MULTIPLE_CHOICE or TABLE_COMPLEX_MULTIPLE_CHOICE
                if (question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                    if (question.choices && question.choices.length > 0) {
                        const isComplex = question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE;
                        question.choices.forEach((choice, idx) => {
                            const letter = isRTL ? toArabicLetter(idx) : String.fromCharCode(65 + idx);
                            const choiceRuns = parseHtmlToRuns(choice.text, mainFont, fontSizeHalfPts, isRTL);
                            const prefix = isComplex ? `[   ] ${letter}.  ` : `${letter}.  `;
                            questionsChildren.push(new Paragraph({
                                children: [
                                    createRun({ text: prefix, bold: true, size: fontSizeHalfPts }),
                                    ...choiceRuns
                                ],
                                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                                bidirectional: isRTL,
                                indent: isRTL ? { right: 360 } : { left: 720, hanging: 360 },
                                spacing: { after: 50 }
                            }));
                        });
                    }
                }
            }

            // Spacer antar soal
            questionsChildren.push(new Paragraph({ text: "", spacing: { after: 120 }, bidirectional: isRTL, alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT }));
        }
    }

    // Build document sections:
    // If Two-Column Exam is enabled:
    // - Section 1: Header + Title + Meta + Instructions (1 Column)
    // - Section 2: Questions (2 Columns, CONTINUOUS)
    // If One-Column Exam:
    // - Single Section containing everything
    let docSections: any[] = [];

    if (isTwoColumnExam) {
        docSections = [
            {
                properties: {
                    page: {
                        size: { width: paperDim.width, height: paperDim.height },
                        margin: pageMargins,
                    },
                    column: { count: 1 },
                },
                children: headerChildren,
                footers: { default: watermarkFooter },
            },
            {
                properties: {
                    type: SectionType.CONTINUOUS,
                    page: {
                        size: { width: paperDim.width, height: paperDim.height },
                        margin: pageMargins,
                    },
                    column: { count: 2, space: 680 }, // ~12mm gap
                },
                children: questionsChildren,
                footers: { default: watermarkFooter },
            }
        ];
    } else {
        docSections = [
            {
                properties: {
                    page: {
                        size: { width: paperDim.width, height: paperDim.height },
                        margin: pageMargins,
                    },
                    column: { count: 1 },
                },
                children: [...headerChildren, ...questionsChildren],
                footers: { default: watermarkFooter },
            }
        ];
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: fontProp,
                        size: fontSizeHalfPts,
                        sizeComplexScript: fontSizeHalfPts,
                        color: "000000",
                        rightToLeft: isRTL,
                    },
                    paragraph: {
                        lineSpacing: lineSpacingTwips,
                        bidirectional: isRTL,
                        alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    },
                },
            },
        },
        sections: docSections,
    });

    return await Packer.toBlob(doc);
};
