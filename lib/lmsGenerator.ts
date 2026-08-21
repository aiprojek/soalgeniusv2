import { Exam, Question, QuestionType, Section, Settings, TableData } from "../types";
import { sanitizeRichHtml, stripHtml, escapeHtml } from "./utils";
import { rtlTranslations, ltrTranslations } from "./translations";

const cdata = (content: string): string => {
    if (!content) return '<![CDATA[]]>';
    // Escape CDATA closing tag if it exists inside content
    const safeContent = content.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${safeContent}]]>`;
};

const escapeCloze = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/~/g, '\\~')
        .replace(/=/g, '\\=')
        .replace(/#/g, '\\#')
        .replace(/:/g, '\\:');
};

const escapeGift = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/~/g, '\\~')
        .replace(/=/g, '\\=')
        .replace(/#/g, '\\#')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/:/g, '\\:');
};

const toArabicNumeral = (n: string | number): string => {
    const num = String(n);
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, d => arabicNumerals[parseInt(d, 10)]);
};

const toArabicLetter = (index: number): string => {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
    return letters[index] || String.fromCharCode(97 + index);
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

/**
 * Pre-processes HTML to ensure full compatibility with Moodle & LMS:
 * 1. KaTeX/LaTeX math formula conversion: transforms <span class="ql-formula" data-value="..."> to \( ... \) and preserves MathJax delimiters.
 * 2. Responsive images (inline base64 or URLs).
 * 3. RTL styling wrappers and typography when exam direction is 'rtl'.
 */
export const processHtmlForMoodle = (html: string, isRTL: boolean = false): string => {
    if (!html) return '';
    let processed = html;

    // 1. Extract formula from data-value in Quill formula spans
    processed = processed.replace(/<span[^>]*class="[^"]*ql-formula[^"]*"[^>]*data-value="([^"]+)"[^>]*>.*?<\/span>/gi, (_match, formula) => {
        const decoded = formula
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        return ` \\( ${decoded} \\) `;
    });

    // 2. Extract formula from KaTeX annotation if present
    processed = processed.replace(/<span[^>]*class="[^"]*katex[^"]*"[^>]*>.*?<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>.*?<\/span>/gi, (_match, formula) => {
        return ` \\( ${formula.trim()} \\) `;
    });

    // 3. Convert single $...$ to \( ... \) for standard Moodle MathJax
    processed = processed.replace(/(^|[^\$])\$([^\$\n\r]+)\$(?!\$)/g, '$1\\($2\\)');

    // 4. Sanitize rich HTML structure
    processed = sanitizeRichHtml(processed);

    // 5. Ensure images are responsive and centered/aligned cleanly in Moodle
    processed = processed.replace(/<img([^>]+)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
            return `<img${attrs} style="max-width: 100%; height: auto; display: inline-block; margin: 8px 0; border-radius: 4px;" />`;
        }
        return match;
    });

    // 6. If RTL, wrap in dir="rtl" container with Arabic typography
    if (isRTL) {
        processed = `<div dir="rtl" style="text-align: right; font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', serif; line-height: 1.8;">${processed}</div>`;
    }

    return processed;
};

/**
 * Builds HTML table for Moodle XML, with support for embedded Cloze inputs (shortanswer or multichoice).
 */
const renderTableHtmlForMoodle = (
    tableData: TableData,
    isRTL: boolean,
    tableAnswerKey?: Record<string, string>,
    choices?: { id: string; text: string }[],
    tableChoiceAnswerKey?: { [rowId: string]: string | string[] },
    questionType?: QuestionType
): string => {
    let html = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #94a3b8; font-size: 14px; text-align: ${isRTL ? 'right' : 'left'};" border="1" cellpadding="6" cellspacing="0">`;
    html += '<tbody>';

    tableData.rows.forEach((row, rowIndex) => {
        const isHeaderRow = rowIndex === 0;
        const bgStyle = isHeaderRow ? 'background-color: #f1f5f9; font-weight: bold;' : '';
        html += `<tr style="${bgStyle}">`;

        row.cells.forEach((cell, cellIndex) => {
            if (cell.isMerged) return;

            const colspan = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
            const rowspan = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
            const vAlign = cell.verticalAlign ? `vertical-align: ${cell.verticalAlign};` : 'vertical-align: middle;';
            const cellStyle = `border: 1px solid #94a3b8; padding: 8px 10px; ${vAlign}`;

            let cellContent = sanitizeRichHtml(cell.content);

            // If it's a fillable cell in Table Fill question
            if (questionType === QuestionType.TABLE && !isHeaderRow) {
                const answer = tableAnswerKey?.[cell.id];
                if (answer && answer.trim()) {
                    const cleanAnswer = escapeCloze(stripHtml(answer).trim());
                    cellContent = `${cellContent ? `${cellContent} ` : ''}{1:SHORTANSWER:=${cleanAnswer}}`;
                }
            }

            // If it's Table Multiple Choice and this is the last column (choice column) on non-header rows
            if ((questionType === QuestionType.TABLE_MULTIPLE_CHOICE || questionType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && !isHeaderRow && cellIndex === row.cells.length - 1 && choices && choices.length > 0) {
                const rowKey = tableChoiceAnswerKey?.[row.id];
                if (questionType === QuestionType.TABLE_MULTIPLE_CHOICE) {
                    const selectedChoiceId = typeof rowKey === 'string' ? rowKey : (Array.isArray(rowKey) ? rowKey[0] : '');
                    const clozeOptions = choices.map((c, idx) => {
                        const isCorrect = c.id === selectedChoiceId;
                        const label = isRTL ? `${toArabicLetter(idx)}. ${stripHtml(c.text)}` : `${String.fromCharCode(65 + idx)}. ${stripHtml(c.text)}`;
                        const cleanLabel = escapeCloze(label);
                        return isCorrect ? `=${cleanLabel}` : cleanLabel;
                    }).join('~');

                    cellContent = `${cellContent ? `${cellContent} ` : ''}{1:MULTICHOICE:${clozeOptions}}`;
                } else {
                    // Complex Multiple Choice in table row
                    const selectedChoiceIds = Array.isArray(rowKey) ? rowKey : (rowKey ? [rowKey] : []);
                    const clozeOptions = choices.map((c, idx) => {
                        const isCorrect = selectedChoiceIds.includes(c.id);
                        const label = isRTL ? `${toArabicLetter(idx)}. ${stripHtml(c.text)}` : `${String.fromCharCode(65 + idx)}. ${stripHtml(c.text)}`;
                        const cleanLabel = escapeCloze(label);
                        return isCorrect ? `=${cleanLabel}` : cleanLabel;
                    }).join('~');

                    cellContent = `${cellContent ? `${cellContent} ` : ''}{1:MULTICHOICE:${clozeOptions}}`;
                }
            }

            html += `<td${colspan}${rowspan} style="${cellStyle}">${cellContent}</td>`;
        });

        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
};

/**
 * Format a single Question into compliant Moodle XML format.
 */
const formatQuestion = (q: Question, isRTL: boolean): string => {
    const rawNumber = q.number ? q.number.trim() : '';
    const formattedNumber = isRTL && rawNumber ? toArabicNumeral(rawNumber) : rawNumber;
    const plainText = stripHtml(q.text).replace(/\s+/g, ' ').trim();
    const shortName = plainText.length > 60 ? plainText.substring(0, 57) + '...' : (plainText || `Soal ${q.number || 'Baru'}`);

    const qNameText = q.type === QuestionType.STIMULUS
        ? (isRTL ? `معلومات: ${shortName}` : `Stimulus: ${shortName}`)
        : (formattedNumber ? `${formattedNumber}. ${shortName}` : shortName);

    let processedQuestionText = processHtmlForMoodle(q.text, isRTL);

    // Append subquestions if any
    if (q.subQuestions && q.subQuestions.length > 0) {
        const subqList = q.subQuestions.map((sq, sIdx) => {
            const sqNum = isRTL ? toArabicLetter(sIdx) : String.fromCharCode(97 + sIdx);
            return `<li style="margin-bottom: 6px;"><strong>${sqNum}.</strong> ${processHtmlForMoodle(sq.text, isRTL)}</li>`;
        }).join('');
        processedQuestionText += `<ol style="margin-top: 10px; padding-${isRTL ? 'right' : 'left'}: 20px; list-style-type: none;">${subqList}</ol>`;
    }

    // Append answer space hint if essay has answer space
    if (q.type === QuestionType.ESSAY && q.hasAnswerSpace) {
        const answerSpaceHint = isRTL
            ? '<p style="margin-top: 12px; color: #64748b; font-style: italic;">[مساحة مخصصة للإجابة]</p>'
            : '<p style="margin-top: 12px; color: #64748b; font-style: italic;">[Lembar Ruang Jawaban]</p>';
        processedQuestionText += answerSpaceHint;
    }

    let xml = '';

    switch (q.type) {
        case QuestionType.MULTIPLE_CHOICE: {
            xml += `  <question type="multichoice">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>0.3333333</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <single>true</single>\n`;
            xml += `    <shuffleanswers>true</shuffleanswers>\n`;
            xml += `    <answernumbering>${isRTL ? 'none' : 'abc'}</answernumbering>\n`;

            (q.choices || []).forEach((choice, idx) => {
                const isCorrect = q.answerKey === choice.id;
                let choiceHtml = processHtmlForMoodle(choice.text, isRTL);
                if (isRTL) {
                    choiceHtml = `<span style="font-weight: bold; margin-left: 6px;">${toArabicLetter(idx)}.</span> ${choiceHtml}`;
                }

                xml += `    <answer fraction="${isCorrect ? '100' : '0'}" format="html">\n`;
                xml += `      <text>${cdata(choiceHtml)}</text>\n`;
                xml += `      <feedback format="html"><text></text></feedback>\n`;
                xml += `    </answer>\n`;
            });

            xml += `  </question>\n`;
            break;
        }

        case QuestionType.COMPLEX_MULTIPLE_CHOICE: {
            xml += `  <question type="multichoice">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>0.3333333</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <single>false</single>\n`;
            xml += `    <shuffleanswers>true</shuffleanswers>\n`;
            xml += `    <answernumbering>${isRTL ? 'none' : 'abc'}</answernumbering>\n`;

            const correctIds = Array.isArray(q.answerKey) ? q.answerKey : (q.answerKey ? [q.answerKey] : []);
            const totalCount = q.choices?.length || 1;
            const correctCount = correctIds.length || 1;
            const incorrectCount = Math.max(1, totalCount - correctCount);

            const posFraction = (100 / correctCount).toFixed(5);
            // In Moodle multi-select, incorrect choices carry negative fraction so selecting all options doesn't give 100%
            const negFraction = (-100 / incorrectCount).toFixed(5);

            (q.choices || []).forEach((choice, idx) => {
                const isCorrect = correctIds.includes(choice.id);
                let choiceHtml = processHtmlForMoodle(choice.text, isRTL);
                if (isRTL) {
                    choiceHtml = `<span style="font-weight: bold; margin-left: 6px;">${toArabicLetter(idx)}.</span> ${choiceHtml}`;
                }

                xml += `    <answer fraction="${isCorrect ? posFraction : negFraction}" format="html">\n`;
                xml += `      <text>${cdata(choiceHtml)}</text>\n`;
                xml += `      <feedback format="html"><text></text></feedback>\n`;
                xml += `    </answer>\n`;
            });

            xml += `  </question>\n`;
            break;
        }

        case QuestionType.TRUE_FALSE: {
            const isTrue = q.answerKey === 'true' || q.answerKey === 'Benar' || q.answerKey === 'صح' || q.answerKey === '1';

            xml += `  <question type="truefalse">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>1</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <answer fraction="${isTrue ? '100' : '0'}" format="moodle_auto_format">\n`;
            xml += `      <text>true</text>\n`;
            xml += `      <feedback format="html"><text>${cdata(isRTL ? 'صح' : 'Benar')}</text></feedback>\n`;
            xml += `    </answer>\n`;
            xml += `    <answer fraction="${!isTrue ? '100' : '0'}" format="moodle_auto_format">\n`;
            xml += `      <text>false</text>\n`;
            xml += `      <feedback format="html"><text>${cdata(isRTL ? 'خطأ' : 'Salah')}</text></feedback>\n`;
            xml += `    </answer>\n`;
            xml += `  </question>\n`;
            break;
        }

        case QuestionType.SHORT_ANSWER: {
            xml += `  <question type="shortanswer">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>0.3333333</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <usecase>0</usecase>\n`;

            const rawKey = typeof q.answerKey === 'string' ? q.answerKey : '';
            // Support multiple acceptable answers if separated by comma, semicolon, or slash
            const answerVariants = rawKey.split(/[,;/|]+/).map(s => s.trim()).filter(Boolean);

            if (answerVariants.length > 0) {
                answerVariants.forEach(variant => {
                    xml += `    <answer fraction="100" format="moodle_auto_format">\n`;
                    xml += `      <text>${cdata(variant)}</text>\n`;
                    xml += `      <feedback format="html"><text></text></feedback>\n`;
                    xml += `    </answer>\n`;
                });
            } else {
                xml += `    <answer fraction="100" format="moodle_auto_format">\n`;
                xml += `      <text>${cdata(rawKey)}</text>\n`;
                xml += `      <feedback format="html"><text></text></feedback>\n`;
                xml += `    </answer>\n`;
            }

            xml += `  </question>\n`;
            break;
        }

        case QuestionType.MATCHING: {
            xml += `  <question type="matching">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>0.3333333</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <shuffleanswers>true</shuffleanswers>\n`;

            const prompts = q.matchingPrompts || [];
            const answers = q.matchingAnswers || [];
            const matchingKeys = q.matchingKey || [];

            // Add matched subquestions
            const pairedAnswerIds = new Set<string>();

            prompts.forEach((prompt, idx) => {
                const pair = matchingKeys.find(k => k.promptId === prompt.id);
                let matchedAnswer = pair ? answers.find(a => a.id === pair.answerId) : answers[idx];

                if (matchedAnswer) {
                    pairedAnswerIds.add(matchedAnswer.id);
                }

                const promptHtml = processHtmlForMoodle(prompt.text, isRTL);
                // Moodle matching answers in subquestion dropdown must be plain text
                const answerPlainText = matchedAnswer ? stripHtml(matchedAnswer.text).trim() : '';

                xml += `    <subquestion format="html">\n`;
                xml += `      <text>${cdata(promptHtml)}</text>\n`;
                xml += `      <answer><text>${cdata(answerPlainText)}</text></answer>\n`;
                xml += `    </subquestion>\n`;
            });

            // Extra unmatched answers act as distractors in Moodle Matching questions
            answers.forEach(ans => {
                if (!pairedAnswerIds.has(ans.id)) {
                    const distractorText = stripHtml(ans.text).trim();
                    if (distractorText) {
                        xml += `    <subquestion format="html">\n`;
                        xml += `      <text></text>\n`;
                        xml += `      <answer><text>${cdata(distractorText)}</text></answer>\n`;
                        xml += `    </subquestion>\n`;
                    }
                }
            });

            xml += `  </question>\n`;
            break;
        }

        case QuestionType.ESSAY: {
            const graderInfoText = typeof q.answerKey === 'string' && q.answerKey.trim()
                ? processHtmlForMoodle(q.answerKey, isRTL)
                : '';

            xml += `  <question type="essay">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>1</defaultgrade>\n`;
            xml += `    <penalty>0</penalty>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `    <responseformat>editor</responseformat>\n`;
            xml += `    <responserequired>1</responserequired>\n`;
            xml += `    <responsefieldlines>15</responsefieldlines>\n`;
            xml += `    <attachments>0</attachments>\n`;
            xml += `    <attachmentsrequired>0</attachmentsrequired>\n`;
            if (graderInfoText) {
                xml += `    <graderinfo format="html"><text>${cdata(graderInfoText)}</text></graderinfo>\n`;
            }
            xml += `    <responsetemplate format="html"><text></text></responsetemplate>\n`;
            xml += `  </question>\n`;
            break;
        }

        case QuestionType.TABLE:
        case QuestionType.TABLE_MULTIPLE_CHOICE:
        case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE: {
            if (q.tableData) {
                // If table has specific answers configured, generate as Moodle Cloze (multianswer)
                const hasFillAnswers = q.type === QuestionType.TABLE && q.tableAnswerKey && Object.keys(q.tableAnswerKey).some(k => Boolean(q.tableAnswerKey![k]?.trim()));
                const hasChoiceAnswers = (q.type === QuestionType.TABLE_MULTIPLE_CHOICE || q.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && q.choices && q.choices.length > 0;

                const tableHtml = renderTableHtmlForMoodle(
                    q.tableData,
                    isRTL,
                    q.tableAnswerKey,
                    q.choices,
                    q.tableChoiceAnswerKey,
                    q.type
                );

                const fullContent = `${processedQuestionText}<br/>${tableHtml}`;

                if (hasFillAnswers || hasChoiceAnswers) {
                    xml += `  <question type="cloze">\n`;
                    xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
                    xml += `    <questiontext format="html"><text>${cdata(fullContent)}</text></questiontext>\n`;
                    xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
                    xml += `    <defaultgrade>1</defaultgrade>\n`;
                    xml += `    <penalty>0.3333333</penalty>\n`;
                    xml += `    <hidden>0</hidden>\n`;
                    xml += `  </question>\n`;
                } else {
                    // Fallback to Essay with rendered table
                    xml += `  <question type="essay">\n`;
                    xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
                    xml += `    <questiontext format="html"><text>${cdata(fullContent)}</text></questiontext>\n`;
                    xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
                    xml += `    <defaultgrade>1</defaultgrade>\n`;
                    xml += `    <responseformat>editor</responseformat>\n`;
                    xml += `    <responserequired>1</responserequired>\n`;
                    xml += `    <responsefieldlines>15</responsefieldlines>\n`;
                    xml += `    <attachments>0</attachments>\n`;
                    xml += `  </question>\n`;
                }
            } else {
                // Fallback to Essay if tableData is missing
                xml += `  <question type="essay">\n`;
                xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
                xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
                xml += `    <defaultgrade>1</defaultgrade>\n`;
                xml += `  </question>\n`;
            }
            break;
        }

        case QuestionType.STIMULUS:
        default: {
            xml += `  <question type="description">\n`;
            xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
            xml += `    <questiontext format="html"><text>${cdata(processedQuestionText)}</text></questiontext>\n`;
            xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
            xml += `    <defaultgrade>0</defaultgrade>\n`;
            xml += `    <hidden>0</hidden>\n`;
            xml += `  </question>\n`;
            break;
        }
    }

    return xml;
};

const formatDescription = (title: string, htmlContent: string, isRTL: boolean): string => {
    let xml = `  <question type="description">\n`;
    xml += `    <name><text>${cdata(title)}</text></name>\n`;
    xml += `    <questiontext format="html"><text>${cdata(processHtmlForMoodle(htmlContent, isRTL))}</text></questiontext>\n`;
    xml += `    <generalfeedback format="html"><text></text></generalfeedback>\n`;
    xml += `    <defaultgrade>0</defaultgrade>\n`;
    xml += `    <hidden>0</hidden>\n`;
    xml += `  </question>\n`;
    return xml;
};

const formatCategory = (categoryPath: string, infoHtml?: string): string => {
    let xml = `  <question type="category">\n`;
    xml += `    <category>\n      <text>${cdata(categoryPath)}</text>\n    </category>\n`;
    if (infoHtml) {
        xml += `    <info format="html">\n      <text>${cdata(infoHtml)}</text>\n    </info>\n`;
    }
    xml += `  </question>\n`;
    return xml;
};

/**
 * Generates high-fidelity Moodle XML with full feature parity with HTML & DOCX generators.
 */
export const generateMoodleXML = (exam: Exam, settings?: Settings): string => {
    const isRTL = exam.direction === 'rtl';
    const T = isRTL ? rtlTranslations : ltrTranslations;
    const safeExamTitle = (exam.title || 'Ujian').replace(/[/\\:*?"<>|]/g, '_').trim();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n\n`;

    // 1. Set Top Exam Category
    xml += formatCategory(`$course$/top/${safeExamTitle}`);

    // 2. Exam Overview & Metadata Description
    const examMetaRows: string[] = [];
    if (exam.subject) examMetaRows.push(`<tr><td style="font-weight: bold; width: 140px; padding: 4px 8px;">${T.subject}</td><td style="padding: 4px 8px;">: ${escapeHtml(exam.subject)}</td></tr>`);
    if (exam.class) examMetaRows.push(`<tr><td style="font-weight: bold; width: 140px; padding: 4px 8px;">${T.class}</td><td style="padding: 4px 8px;">: ${escapeHtml(exam.class)}</td></tr>`);
    if (exam.date) examMetaRows.push(`<tr><td style="font-weight: bold; width: 140px; padding: 4px 8px;">${T.date}</td><td style="padding: 4px 8px;">: ${escapeHtml(exam.date)}</td></tr>`);
    if (exam.waktuUjian) examMetaRows.push(`<tr><td style="font-weight: bold; width: 140px; padding: 4px 8px;">${T.examTime}</td><td style="padding: 4px 8px;">: ${escapeHtml(exam.waktuUjian)}</td></tr>`);
    if (exam.keterangan) examMetaRows.push(`<tr><td style="font-weight: bold; width: 140px; padding: 4px 8px;">${T.description}</td><td style="padding: 4px 8px;">: ${escapeHtml(exam.keterangan)}</td></tr>`);

    let examOverviewHtml = `
        <div style="font-family: ${isRTL ? "'Amiri', 'Traditional Arabic', serif" : "Arial, sans-serif"}; font-size: 14px; line-height: 1.6; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; background-color: #f8fafc;">
            <h2 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">${escapeHtml(exam.title)}</h2>
            ${examMetaRows.length > 0 ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;"><tbody>${examMetaRows.join('')}</tbody></table>` : ''}
            ${exam.instructions ? `
                <div style="margin-top: 12px; padding: 10px 14px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <strong style="color: #1d4ed8;">${T.generalInstructions}:</strong>
                    <div style="margin-top: 4px;">${escapeHtml(exam.instructions).replace(/\n/g, '<br/>')}</div>
                </div>
            ` : ''}
        </div>
    `;

    xml += formatDescription(isRTL ? `معلومات الاختبار: ${exam.title}` : `Informasi Ujian: ${exam.title}`, examOverviewHtml, isRTL);
    xml += '\n';

    // 3. Sections & Questions
    exam.sections.forEach((section, sIdx) => {
        const rawInstruction = section.instructions ? section.instructions.trim() : `Bagian ${sIdx + 1}`;
        const instructionParts = rawInstruction.match(/^([^.]+)\.(.*)/);
        let sectionTitle = rawInstruction;

        if (instructionParts && instructionParts.length > 2) {
            const rawBody = instructionParts[2].trim();
            if (isRTL) {
                sectionTitle = instructionTranslations[rawBody] || rawBody;
            }
        } else if (isRTL && instructionTranslations[rawInstruction]) {
            sectionTitle = instructionTranslations[rawInstruction];
        }

        const safeSectionTitle = sectionTitle.replace(/[/\\:*?"<>|]/g, '_').substring(0, 50).trim();
        xml += formatCategory(`$course$/top/${safeExamTitle}/${safeSectionTitle}`);

        // If section has an instruction or stimulus, add it as a Description question at the start of the section
        if (section.instructions && section.instructions.trim()) {
            const sectionInstructionHtml = `
                <div style="padding: 10px 14px; background-color: #f1f5f9; border-left: 4px solid #64748b; font-size: 14px; font-weight: 500; border-radius: 4px; margin-bottom: 10px;">
                    ${escapeHtml(sectionTitle)}
                </div>
            `;
            xml += formatDescription(isRTL ? `تعليمات القسم ${toArabicNumeral(sIdx + 1)}` : `Petunjuk Bagian ${sIdx + 1}`, sectionInstructionHtml, isRTL);
        }

        // Legacy section stimulus if present
        if (section.stimulus && section.stimulus.trim()) {
            xml += formatDescription(isRTL ? `نص المعلومات: ${safeSectionTitle}` : `Stimulus: ${safeSectionTitle}`, section.stimulus, isRTL);
        }

        // Output all questions in this section
        section.questions.forEach(q => {
            xml += formatQuestion(q, isRTL);
        });

        xml += '\n';
    });

    xml += `</quiz>\n`;
    return xml;
};

/**
 * Generates Moodle/Canvas GIFT Format (.gift)
 */
export const generateGIFTFormat = (exam: Exam): string => {
    const isRTL = exam.direction === 'rtl';
    let output = `// ==========================================\n`;
    output += `// Naskah Soal GIFT Format: ${exam.title}\n`;
    output += `// Mata Pelajaran: ${exam.subject || '-'} | Kelas: ${exam.class || '-'}\n`;
    output += `// Dibuat dengan SoalGenius\n`;
    output += `// ==========================================\n\n`;

    exam.sections?.forEach((section, sIdx) => {
        output += `// --- Bagian ${sIdx + 1}: ${stripHtml(section.instructions || '')} ---\n\n`;

        section.questions?.forEach((q, qIdx) => {
            const qTitle = `Q${sIdx + 1}_${q.number || qIdx + 1}`;
            const cleanText = escapeGift(stripHtml(q.text).trim());
            if (!cleanText) return;

            switch (q.type) {
                case QuestionType.MULTIPLE_CHOICE: {
                    const choicesGift = (q.choices || []).map(c => {
                        const isCorrect = q.answerKey === c.id;
                        const cText = escapeGift(stripHtml(c.text).trim());
                        return isCorrect ? `=${cText}` : `~${cText}`;
                    }).join(' ');
                    output += `::${qTitle}:: ${cleanText} {\n  ${choicesGift}\n}\n\n`;
                    break;
                }

                case QuestionType.COMPLEX_MULTIPLE_CHOICE: {
                    const correctIds = Array.isArray(q.answerKey) ? q.answerKey : (q.answerKey ? [q.answerKey] : []);
                    const totalCount = q.choices?.length || 1;
                    const correctCount = Math.max(1, correctIds.length);
                    const incorrectCount = Math.max(1, totalCount - correctCount);
                    const posPct = Math.round(100 / correctCount);
                    const negPct = Math.round(100 / incorrectCount);

                    const choicesGift = (q.choices || []).map(c => {
                        const isCorrect = correctIds.includes(c.id);
                        const cText = escapeGift(stripHtml(c.text).trim());
                        return isCorrect ? `~%${posPct}%${cText}` : `~%-${negPct}%${cText}`;
                    }).join('\n  ');
                    output += `::${qTitle}:: ${cleanText} {\n  ${choicesGift}\n}\n\n`;
                    break;
                }

                case QuestionType.TRUE_FALSE: {
                    const isTrue = q.answerKey === 'true' || q.answerKey === 'Benar' || q.answerKey === '1';
                    output += `::${qTitle}:: ${cleanText} {${isTrue ? 'TRUE' : 'FALSE'}}\n\n`;
                    break;
                }

                case QuestionType.SHORT_ANSWER: {
                    const rawKey = typeof q.answerKey === 'string' ? q.answerKey : '';
                    const variants = rawKey.split(/[,;/|]+/).map(s => escapeGift(s.trim())).filter(Boolean);
                    const answersGift = variants.length > 0
                        ? variants.map(v => `=${v}`).join(' ')
                        : `=${escapeGift(rawKey)}`;
                    output += `::${qTitle}:: ${cleanText} { ${answersGift} }\n\n`;
                    break;
                }

                case QuestionType.MATCHING: {
                    const prompts = q.matchingPrompts || [];
                    const answers = q.matchingAnswers || [];
                    const keys = q.matchingKey || [];

                    const pairsGift = prompts.map((p, idx) => {
                        const pair = keys.find(k => k.promptId === p.id);
                        const matchedAns = pair ? answers.find(a => a.id === pair.answerId) : answers[idx];
                        const pText = escapeGift(stripHtml(p.text).trim());
                        const aText = escapeGift(stripHtml(matchedAns?.text || '').trim());
                        return `=${pText} -> ${aText}`;
                    }).join('\n  ');

                    output += `::${qTitle}:: ${cleanText} {\n  ${pairsGift}\n}\n\n`;
                    break;
                }

                case QuestionType.ESSAY: {
                    output += `::${qTitle}:: ${cleanText} {}\n\n`;
                    break;
                }

                default: {
                    output += `// [Info/Stimulus]\n::${qTitle}:: ${cleanText} {}\n\n`;
                    break;
                }
            }
        });
    });

    return output;
};

/**
 * Generates Aiken Format (.txt) for standard multiple choice imports.
 */
export const generateAikenFormat = (exam: Exam): string => {
    let output = '';

    exam.sections?.forEach((section) => {
        section.questions?.forEach((q) => {
            if (q.type === QuestionType.MULTIPLE_CHOICE && q.choices && q.choices.length > 0) {
                const questionText = stripHtml(q.text).replace(/\s+/g, ' ').trim();
                if (!questionText) return;

                output += `${questionText}\n`;
                let correctLetter = 'A';

                q.choices.forEach((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const choiceText = stripHtml(choice.text).replace(/\s+/g, ' ').trim();
                    output += `${letter}. ${choiceText}\n`;
                    if (q.answerKey === choice.id) {
                        correctLetter = letter;
                    }
                });

                output += `ANSWER: ${correctLetter}\n\n`;
            }
        });
    });

    return output;
};

/**
 * Generates QTI 2.1 / Canvas / Blackboard XML format.
 */
export const generateQTI21XML = (exam: Exam): string => {
    const isRTL = exam.direction === 'rtl';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    xml += `  <assessment ident="assessment_${Date.now()}" title="${escapeHtml(exam.title)}">\n`;
    xml += `    <qtimetadata>\n`;
    xml += `      <qtimetadatafield>\n`;
    xml += `        <fieldlabel>qmd_assessmenttype</fieldlabel>\n`;
    xml += `        <fieldentry>Examination</fieldentry>\n`;
    xml += `      </qtimetadatafield>\n`;
    xml += `    </qtimetadata>\n`;
    xml += `    <section ident="root_section">\n`;

    let itemIndex = 0;
    exam.sections?.forEach((section, sIdx) => {
        section.questions?.forEach((q) => {
            itemIndex++;
            const itemId = `item_${itemIndex}_${q.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const cleanText = processHtmlForMoodle(q.text, isRTL);

            xml += `      <item ident="${itemId}" title="Soal ${q.number || itemIndex}">\n`;
            xml += `        <presentation>\n`;
            xml += `          <material>\n`;
            xml += `            <mattext texttype="text/html">${cdata(cleanText)}</mattext>\n`;
            xml += `          </material>\n`;

            if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                const isSingle = q.type === QuestionType.MULTIPLE_CHOICE;
                xml += `          <response_lid ident="response_${itemId}" rcardinality="${isSingle ? 'Single' : 'Multiple'}">\n`;
                xml += `            <render_choice>\n`;

                (q.choices || []).forEach((c, idx) => {
                    const choiceId = `choice_${idx + 1}_${c.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    xml += `              <response_label ident="${choiceId}">\n`;
                    xml += `                <material>\n`;
                    xml += `                  <mattext texttype="text/html">${cdata(processHtmlForMoodle(c.text, isRTL))}</mattext>\n`;
                    xml += `                </material>\n`;
                    xml += `              </response_label>\n`;
                });

                xml += `            </render_choice>\n`;
                xml += `          </response_lid>\n`;
            } else if (q.type === QuestionType.TRUE_FALSE) {
                xml += `          <response_lid ident="response_${itemId}" rcardinality="Single">\n`;
                xml += `            <render_choice>\n`;
                xml += `              <response_label ident="true"><material><mattext>Benar</mattext></material></response_label>\n`;
                xml += `              <response_label ident="false"><material><mattext>Salah</mattext></material></response_label>\n`;
                xml += `            </render_choice>\n`;
                xml += `          </response_lid>\n`;
            } else if (q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.ESSAY) {
                xml += `          <response_str ident="response_${itemId}" rcardinality="Single">\n`;
                xml += `            <render_fib rows="${q.type === QuestionType.ESSAY ? 10 : 1}"></render_fib>\n`;
                xml += `          </response_str>\n`;
            }

            xml += `        </presentation>\n`;
            xml += `        <resprocessing>\n`;
            xml += `          <outcomes>\n`;
            xml += `            <decvar varname="SCORE" vartype="Decimal" defaultval="0" minvalue="0" maxvalue="1" />\n`;
            xml += `          </outcomes>\n`;
            xml += `        </resprocessing>\n`;
            xml += `      </item>\n`;
        });
    });

    xml += `    </section>\n`;
    xml += `  </assessment>\n`;
    xml += `</questestinterop>\n`;
    return xml;
};

/**
 * Generates Structured CSV for Google Forms & Quizizz Import
 */
export const generateQuizCSV = (exam: Exam): string => {
    const rows: string[][] = [
        ['No', 'Question Text', 'Question Type', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Correct Answer', 'Time (Seconds)']
    ];

    let count = 0;
    exam.sections?.forEach((section) => {
        section.questions?.forEach((q) => {
            count++;
            const cleanText = stripHtml(q.text).replace(/\s+/g, ' ').trim();
            let qTypeStr = 'Multiple Choice';
            const optList: string[] = ['', '', '', '', ''];
            let correctAnsStr = '';

            if (q.type === QuestionType.MULTIPLE_CHOICE) {
                qTypeStr = 'Multiple Choice';
                (q.choices || []).slice(0, 5).forEach((c, idx) => {
                    optList[idx] = stripHtml(c.text).trim();
                    if (q.answerKey === c.id) {
                        correctAnsStr = String(idx + 1); // 1-based index or letter
                    }
                });
            } else if (q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
                qTypeStr = 'Checkbox';
                const correctIds = Array.isArray(q.answerKey) ? q.answerKey : (q.answerKey ? [q.answerKey] : []);
                const correctIndices: number[] = [];
                (q.choices || []).slice(0, 5).forEach((c, idx) => {
                    optList[idx] = stripHtml(c.text).trim();
                    if (correctIds.includes(c.id)) {
                        correctIndices.push(idx + 1);
                    }
                });
                correctAnsStr = correctIndices.join(',');
            } else if (q.type === QuestionType.TRUE_FALSE) {
                qTypeStr = 'True/False';
                optList[0] = 'Benar';
                optList[1] = 'Salah';
                const isTrue = q.answerKey === 'true' || q.answerKey === 'Benar' || q.answerKey === '1';
                correctAnsStr = isTrue ? '1' : '2';
            } else if (q.type === QuestionType.SHORT_ANSWER) {
                qTypeStr = 'Open-Ended';
                correctAnsStr = typeof q.answerKey === 'string' ? q.answerKey : '';
            } else if (q.type === QuestionType.ESSAY) {
                qTypeStr = 'Essay';
                correctAnsStr = typeof q.answerKey === 'string' ? stripHtml(q.answerKey) : '';
            }

            rows.push([
                String(q.number || count),
                cleanText,
                qTypeStr,
                optList[0],
                optList[1],
                optList[2],
                optList[3],
                optList[4],
                correctAnsStr,
                '60'
            ]);
        });
    });

    const csvContent = rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    return '\uFEFF' + csvContent;
};

/**
 * Generates Rekap Kisi-Kisi & Kunci Jawaban (Excel UTF-8 CSV with BOM)
 */
export const generateGridAndKeyCSV = (exam: Exam): string => {
    const rows: string[][] = [
        ['REKAP KISI-KISI & KUNCI JAWABAN SOALGENIUS'],
        ['Judul Ujian', exam.title || ''],
        ['Mata Pelajaran', exam.subject || ''],
        ['Kelas / Tingkat', exam.class || ''],
        ['Tanggal', exam.date || ''],
        ['Alokasi Waktu', exam.waktuUjian || ''],
        [''],
        ['No', 'Bagian / Indikator', 'Bentuk Soal', 'Teks Butir Soal', 'Kunci Jawaban / Pedoman Penskoran', 'Pilihan Jawaban (Jika Ada)']
    ];

    let no = 0;
    exam.sections?.forEach((section, sIdx) => {
        const secName = stripHtml(section.instructions || `Bagian ${sIdx + 1}`);

        section.questions?.forEach((q) => {
            no++;
            const qNum = q.number || String(no);
            const qText = stripHtml(q.text).replace(/\s+/g, ' ').trim();
            let typeLabel = 'Pilihan Ganda';
            let keyLabel = '';
            let choicesSummary = '';

            switch (q.type) {
                case QuestionType.MULTIPLE_CHOICE: {
                    typeLabel = 'Pilihan Ganda';
                    const choices = q.choices || [];
                    choicesSummary = choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${stripHtml(c.text)}`).join(' | ');
                    const correctIdx = choices.findIndex(c => c.id === q.answerKey);
                    keyLabel = correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : '-';
                    break;
                }
                case QuestionType.COMPLEX_MULTIPLE_CHOICE: {
                    typeLabel = 'PG Kompleks';
                    const choices = q.choices || [];
                    choicesSummary = choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${stripHtml(c.text)}`).join(' | ');
                    const correctIds = Array.isArray(q.answerKey) ? q.answerKey : (q.answerKey ? [q.answerKey] : []);
                    keyLabel = choices
                        .filter(c => correctIds.includes(c.id))
                        .map(c => String.fromCharCode(65 + choices.indexOf(c)))
                        .join(', ');
                    break;
                }
                case QuestionType.TRUE_FALSE: {
                    typeLabel = 'Benar / Salah';
                    keyLabel = (q.answerKey === 'true' || q.answerKey === 'Benar' || q.answerKey === '1') ? 'Benar' : 'Salah';
                    break;
                }
                case QuestionType.SHORT_ANSWER: {
                    typeLabel = 'Isian Singkat';
                    keyLabel = typeof q.answerKey === 'string' ? q.answerKey : '';
                    break;
                }
                case QuestionType.ESSAY: {
                    typeLabel = 'Uraian / Esai';
                    keyLabel = typeof q.answerKey === 'string' ? stripHtml(q.answerKey) : '';
                    break;
                }
                case QuestionType.MATCHING: {
                    typeLabel = 'Menjodohkan';
                    const prompts = q.matchingPrompts || [];
                    const answers = q.matchingAnswers || [];
                    const keys = q.matchingKey || [];
                    keyLabel = prompts.map((p, idx) => {
                        const pair = keys.find(k => k.promptId === p.id);
                        const matchedAns = pair ? answers.find(a => a.id === pair.answerId) : answers[idx];
                        return `[${stripHtml(p.text)}] -> [${stripHtml(matchedAns?.text || '')}]`;
                    }).join('; ');
                    break;
                }
                case QuestionType.TABLE:
                case QuestionType.TABLE_MULTIPLE_CHOICE:
                case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE: {
                    typeLabel = 'Soal Tabel';
                    keyLabel = 'Kunci Jawaban terlampir pada sel tabel';
                    break;
                }
                case QuestionType.STIMULUS: {
                    typeLabel = 'Wacana / Stimulus';
                    keyLabel = '-';
                    break;
                }
            }

            rows.push([
                qNum,
                secName,
                typeLabel,
                qText,
                keyLabel,
                choicesSummary
            ]);
        });
    });

    const csvContent = rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    return '\uFEFF' + csvContent;
};
