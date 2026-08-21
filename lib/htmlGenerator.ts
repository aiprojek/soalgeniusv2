
import type { Exam, Settings } from '../types';
import { QuestionType } from '../types';
import { escapeHtml, sanitizeRichHtml } from './utils';
import katexStyles from 'katex/dist/katex.min.css?inline';
import katexScriptSource from 'katex/dist/katex.min.js?raw';
import katexAutoRenderSource from 'katex/dist/contrib/auto-render.min.js?raw';

// Helper functions for RTL
const toArabicNumeral = (n: string | number): string => {
  const num = String(n);
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.replace(/[0-9]/g, d => arabicNumerals[parseInt(d)]);
};

const toArabicLetter = (index: number): string => {
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
  return letters[index] || String.fromCharCode(97 + index); // Fallback to latin
};

// Translations
const translations = {
  ltr: {
    name: 'Nama',
    class: 'Kelas / Jenjang',
    subject: 'Mata Pelajaran',
    date: 'Hari/Tanggal',
    examTime: 'Waktu Ujian',
    score: 'Nilai',
    instructions: 'Petunjuk Pengerjaan:',
    trueFalsePrompt: 'Lingkari salah satu:',
    trueText: 'BENAR',
    falseText: 'SALAH',
    colA: 'Kolom A',
    colB: 'Kolom B',
    answerKeyTitle: 'Kunci Jawaban',
    noAnswer: 'Tidak ada jawaban',
    trueAnswer: 'Benar',
    falseAnswer: 'Salah',
    printButton: 'Cetak / Simpan ke PDF',
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
    printButton: 'طباعة / حفظ بصيغة PDF',
  },
};

const instructionTranslations = {
  'Berilah tanda silang (X) pada pilihan jawaban yang benar!': 'اختر الإجابة الصحيحة بوضع علامة (X)!',
  'Pilihlah jawaban yang benar dengan memberi tanda centang (✓). Jawaban benar bisa lebih dari satu.': 'اختر الإجابات الصحيحة بوضع علامة (✓). يمكن أن تكون هناك أكثر من إجابة صحيحة.',
  'Isilah titik-titik di bawah ini dengan jawaban yang benar dan tepat!': 'املأ الفراغات التالية بالإجابات الصحيحة!',
  'Jawablah pertanyaan di bawah ini dengan benar!': 'أجب عن الأسئلة التالية بشكل صحيح!',
  'Jodohkan pernyataan di kolom A dengan jawaban yang sesuai di kolom B!': 'طابق بين العبارات في العمود أ والإجابات المناسبة في العمود ب!',
  'Tentukan apakah pernyataan berikut Benar atau Salah!': 'حدد ما إذا كانت العبارات التالية صحيحة أم خاطئة!',
  'Pilihlah salah satu jawaban yang paling tepat!': 'اختر الإجابة الصحيحة بوضع علامة (X)!', // Map to existing one
  'Jawablah pertanyaan berikut dengan singkat dan jelas!': 'أجب عن الأسئلة التالية بشكل صحيح!', // Map to existing one
};


export const generateHtmlContent = (exam: Exam, settings: Settings, mode: 'exam' | 'answer_key' = 'exam', includePrintButton: boolean = true): string => {
    const { paperSize, margins, lineSpacing, logos, examHeaderLines, fontFamily, fontSize } = settings;
    const { direction, layoutColumns } = exam;
    const T = translations[direction];
    const isRTL = direction === 'rtl';

    const paperDimensions = {
        'A4': { width: '210mm', height: '297mm' },
        'F4': { width: '215mm', height: '330mm' },
        'Legal': { width: '216mm', height: '356mm' },
        'Letter': { width: '216mm', height: '279mm' },
    };
    
    // --- Start Main Content Generation ---
    let mainContentHtml = '';

    if (mode === 'exam') {
        const [leftLogo, rightLogo] = logos;
        const leftLogoContent = leftLogo ? `<img src="${leftLogo}" alt="Logo Kiri" class="logo" />` : '';
        const rightLogoContent = rightLogo ? `<img src="${rightLogo}" alt="Logo Kanan" class="logo" />` : '';
        const headerHtml = `
            <header class="exam-header">
                <div class="logo-container logo-left ${!leftLogo ? 'is-empty' : ''}">${leftLogoContent}</div>
                <div class="header-text">
                    ${examHeaderLines.map(line => {
                        if (line.sizeMode === 'fixed') {
                            return `<p data-size-mode="fixed" style="font-size: ${line.sizePt || 12}pt; white-space: normal;">${escapeHtml(line.text)}</p>`;
                        }
                        return `<p data-size-mode="auto">${escapeHtml(line.text)}</p>`;
                    }).join('')}
                </div>
                <div class="logo-container logo-right ${!rightLogo ? 'is-empty' : ''}">${rightLogoContent}</div>
            </header>
        `;

        const sectionsHtml = exam.sections.map((section, sectionIndex) => {
            const questionsHtml = section.questions.map(q => {
                // If it is a stimulus type, render distinct block without numbering
                if (q.type === QuestionType.STIMULUS) {
                    return `<li class="question-item stimulus-block"><div class="question-body">${sanitizeRichHtml(q.text)}</div></li>`;
                }

                const questionNumber = isRTL ? toArabicNumeral(q.number) : q.number;
                const questionText = sanitizeRichHtml(q.text);
                let choicesHtml = '';
                switch(q.type) {
                    case QuestionType.MULTIPLE_CHOICE:
                        const mcListClass = q.isTwoColumns ? 'choices-list choices-list-2-col' : 'choices-list';
                        choicesHtml = `<ol class="${mcListClass}">${(q.choices || []).map((c, idx) => `<li><span class="choice-marker"><bdi>${isRTL ? toArabicLetter(idx) : String.fromCharCode(97 + idx)}.</bdi></span><div class="choice-text">${sanitizeRichHtml(c.text)}</div></li>`).join('')}</ol>`;
                        break;
                    case QuestionType.COMPLEX_MULTIPLE_CHOICE:
                         const cmcGridClass = q.isTwoColumns ? 'choices-grid-complex choices-grid-complex-2-col' : 'choices-grid-complex';
                         choicesHtml = `
                            <div class="${cmcGridClass}">
                                ${(q.choices || []).map((choice, index) => `
                                    <div class="choice-item-complex">
                                        <span class="checkbox-box"></span>
                                        <span class="choice-letter">${isRTL ? toArabicLetter(index) : String.fromCharCode(97 + index)}.</span>
                                        <div class="choice-text">${sanitizeRichHtml(choice.text)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                        break;
                    case QuestionType.TRUE_FALSE:
                        choicesHtml = `
                            <div class="true-false-container">
                                <span>${T.trueFalsePrompt}</span>
                                <span class="true-false-option">${T.trueText}</span>
                                <span class="true-false-option">${T.falseText}</span>
                            </div>
                        `;
                        break;
                    case QuestionType.ESSAY:
                        if(q.hasAnswerSpace) {
                            choicesHtml = `
                                <table class="essay-answer-table">
                                    <tbody>
                                        <tr><td>&nbsp;</td></tr>
                                        <tr><td>&nbsp;</td></tr>
                                        <tr><td>&nbsp;</td></tr>
                                    </tbody>
                                </table>
                            `;
                        }
                        break;
                    case QuestionType.MATCHING: {
                        const prompts = q.matchingPrompts || [];
                        const answers = q.matchingAnswers || [];
                        const rowCount = Math.max(prompts.length, answers.length);
                        let tableRows = '';
                        for (let i = 0; i < rowCount; i++) {
                            const prompt = prompts[i];
                            const answer = answers[i];
                            tableRows += `
                                <tr>
                                    <td class="prompt-number">${prompt ? `<bdi>${isRTL ? `&rlm;${toArabicNumeral(i + 1)}.` : `${i + 1}.`}</bdi>` : ''}</td>
                                    <td class="prompt-text">${sanitizeRichHtml(prompt?.text || '')}</td>
                                    <td class="answer-letter">${answer ? `<bdi>${isRTL ? toArabicLetter(i) : String.fromCharCode(65 + i)}.</bdi>` : ''}</td>
                                    <td class="answer-text">${sanitizeRichHtml(answer?.text || '')}</td>
                                </tr>
                            `;
                        }
                        choicesHtml = `
                            <table class="matching-table">
                               <thead>
                                   <tr>
                                       <th colspan="2">${T.colA}</th>
                                       <th colspan="2">${T.colB}</th>
                                   </tr>
                               </thead>
                               <tbody>${tableRows}</tbody>
                            </table>
                        `;
                        break;
                    }
                    case QuestionType.TABLE:
                    case QuestionType.TABLE_MULTIPLE_CHOICE:
                    case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE:
                        if (q.tableData) {
                            let colgroupHtml = '';
                            if (q.tableData.columnWidths && q.tableData.columnWidths.some(w => w !== null)) {
                                colgroupHtml = '<colgroup>';
                                q.tableData.columnWidths.forEach(width => {
                                    const style = width ? `style="width: ${width}px;"` : '';
                                    colgroupHtml += `<col ${style}>`;
                                });
                                colgroupHtml += '</colgroup>';
                            }
                            let tableRender = `<table class="question-fill-table">${colgroupHtml}<tbody>`;
                            q.tableData.rows.forEach((row, rowIndex) => {
                                const rowHeight = q.tableData.rowHeights?.[rowIndex];
                                const rowStyle = rowHeight ? `style="height: ${rowHeight}px;"` : '';
                                tableRender += `<tr ${rowStyle}>`;
                                row.cells.forEach(cell => {
                                    if (cell.isMerged) return;
                                    const vaStyle = cell.verticalAlign ? `vertical-align: ${cell.verticalAlign};` : '';
                                    const cellStyle = vaStyle ? `style="${vaStyle}"` : '';
                                    const colspan = cell.colspan ? `colspan="${cell.colspan}"` : '';
                                    const rowspan = cell.rowspan ? `rowspan="${cell.rowspan}"` : '';
                                    tableRender += `<td ${colspan} ${rowspan} ${cellStyle}>${sanitizeRichHtml(cell.content)}</td>`;
                                });
                                tableRender += '</tr>';
                            });
                            tableRender += '</tbody></table>';
                            choicesHtml = tableRender;
                        }

                        // Add choices for table multiple choice variants
                        if (q.type === QuestionType.TABLE_MULTIPLE_CHOICE || q.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                             const listClass = q.type === QuestionType.TABLE_MULTIPLE_CHOICE ? 'choices-list' : 'choices-grid-complex';
                             const isGrid = listClass === 'choices-grid-complex';
                             let choiceRender = '';
                             if (isGrid) {
                                choiceRender = `
                                    <div class="${listClass} choices-list-2-col">
                                        ${(q.choices || []).map((choice, index) => `
                                            <div class="choice-item-complex">
                                                <span class="checkbox-box"></span>
                                                <span class="choice-letter">${isRTL ? toArabicLetter(index) : String.fromCharCode(97 + index)}.</span>
                                                <div class="choice-text">${sanitizeRichHtml(choice.text)}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                             } else {
                                choiceRender = `<ol class="${listClass} choices-list-2-col">${(q.choices || []).map((c, idx) => `<li><span class="choice-marker"><bdi>${isRTL ? toArabicLetter(idx) : String.fromCharCode(97 + idx)}.</bdi></span><div class="choice-text">${sanitizeRichHtml(c.text)}</div></li>`).join('')}</ol>`;
                             }
                             choicesHtml += choiceRender;
                        }
                        break;
                }
                const questionNumberDisplay = isRTL ? `&rlm;${questionNumber}.` : `${questionNumber}.`;
                return `<li class="question-item"><div class="question-number"><bdi>${questionNumberDisplay}</bdi></div><div class="question-body">${questionText}${choicesHtml}</div></li>`;
            }).join('');
            
            const instructionParts = section.instructions.match(/^([^.]+)\.(.*)/);
            let instructionContent;
            if (instructionParts && instructionParts.length > 2) {
                let text = instructionParts[2].trim();
                if (isRTL) {
                    const translatedText = instructionTranslations[text as keyof typeof instructionTranslations] || text;
                    // For RTL, as requested, we remove the number to avoid formatting issues.
                    instructionContent = `<span class="instruction-text">${escapeHtml(translatedText)}</span>`;
                } else {
                    const roman = instructionParts[1].trim();
                    const numberComponent = `<bdi>${roman}.</bdi>`;
                    instructionContent = `<span class="instruction-number">${numberComponent}</span><span class="instruction-text">${escapeHtml(text)}</span>`;
                }
            } else {
                instructionContent = `<span>${escapeHtml(section.instructions)}</span>`;
            }

            // Legacy stimulus support (if old exams still have it)
            const stimulusContent = section.stimulus ? `<div class="section-stimulus">${sanitizeRichHtml(section.stimulus)}</div>` : '';

            return `
                <section class="exam-section">
                    <h3 class="exam-section-instruction">${instructionContent}</h3>
                    ${stimulusContent}
                    <ol class="questions-list">
                        ${questionsHtml}
                    </ol>
                </section>
            `;
        }).join('');

        const generalInstructionsHtml = exam.instructions?.trim()
            ? `
            <section class="general-instructions">
                <h4>${T.instructions}</h4>
                <div class="instructions-text">${escapeHtml(exam.instructions).replace(/\n/g, '<br/>')}</div>
            </section>
            `
            : '';
        
        const examBodyHtml = `
            ${generalInstructionsHtml}
            ${sectionsHtml}
        `;

        mainContentHtml = `
            ${headerHtml}
            <div class="header-divider"></div>
            <div class="exam-title-container">
                 <h2>${escapeHtml(exam.title)}</h2>
            </div>
            <div class="meta-container">
                <table class="student-info">
                    <tbody>
                        <tr>
                            <td>${T.name}</td>
                            <td class="colon">:</td>
                            <td class="value dots">................................................................</td>
                        </tr>
                        <tr>
                            <td>${T.class}</td>
                            <td class="colon">:</td>
                            <td class="value">${escapeHtml(exam.class)}</td>
                        </tr>
                        <tr>
                            <td>${T.subject}</td>
                            <td class="colon">:</td>
                            <td class="value">${escapeHtml(exam.subject)}</td>
                        </tr>
                        <tr>
                            <td>${T.date}</td>
                            <td class="colon">:</td>
                            <td class="value">${new Date(exam.date).toLocaleDateString(isRTL ? 'ar-SA-u-nu-arab' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td>${T.examTime}</td>
                            <td class="colon">:</td>
                            <td class="value">${escapeHtml(exam.waktuUjian || '')}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="score-box">
                    <span>${T.score}</span>
                </div>
            </div>
            <div class="exam-body" data-paginate-root="exam-body">
                ${examBodyHtml}
            </div>
        `;
    } else { // Answer Key Mode
        const sectionsHtml = exam.sections.map((section, sectionIndex) => {
            const questionsHtml = section.questions.map(q => {
                 // Skip rendering Stimulus in Answer Key mode completely
                 if (q.type === QuestionType.STIMULUS) return '';

                 let answerText = `<span class="no-answer">${T.noAnswer}</span>`;
                 switch(q.type) {
                    case QuestionType.MULTIPLE_CHOICE: {
                        const choice = (q.choices || []).find(c => c.id === q.answerKey);
                        if(choice) {
                            const choiceIndex = (q.choices || []).indexOf(choice);
                            answerText = `<span><bdi>${isRTL ? toArabicLetter(choiceIndex) : String.fromCharCode(65 + choiceIndex)}.</bdi> ${sanitizeRichHtml(choice.text)}</span>`;
                        }
                        break;
                    }
                    case QuestionType.COMPLEX_MULTIPLE_CHOICE: {
                        const correctChoices = (q.choices || []).filter(c => (q.answerKey as string[] || []).includes(c.id));
                        if(correctChoices.length > 0) {
                            answerText = `<span>${correctChoices.map(c => isRTL ? toArabicLetter((q.choices || []).indexOf(c)) : String.fromCharCode(65 + (q.choices || []).indexOf(c))).join(', ')}</span>`
                        }
                        break;
                    }
                    case QuestionType.TRUE_FALSE:
                        answerText = `<span>${q.answerKey === 'true' ? T.trueAnswer : T.falseAnswer}</span>`;
                        break;
                    case QuestionType.MATCHING: {
                        const key = q.matchingKey || [];
                        if (key.length > 0) {
                            answerText = key.map(pair => {
                                const promptIndex = (q.matchingPrompts || []).findIndex(p => p.id === pair.promptId);
                                const answerIndex = (q.matchingAnswers || []).findIndex(a => a.id === pair.answerId);
                                if (promptIndex > -1 && answerIndex > -1) {
                                    const pNum = isRTL ? toArabicNumeral(promptIndex + 1) : promptIndex + 1;
                                    const aLet = isRTL ? toArabicLetter(answerIndex) : String.fromCharCode(65 + answerIndex);
                                    return `<div>${pNum} &rarr; ${aLet}</div>`;
                                }
                                return '';
                            }).join('');
                        }
                        break;
                    }
                    case QuestionType.TABLE:
                        if (q.tableData && q.tableAnswerKey) {
                            let colgroupHtml = '';
                            if (q.tableData.columnWidths && q.tableData.columnWidths.some(w => w !== null)) {
                                colgroupHtml = '<colgroup>';
                                q.tableData.columnWidths.forEach(width => {
                                    const style = width ? `style="width: ${width}px;"` : '';
                                    colgroupHtml += `<col ${style}>`;
                                });
                                colgroupHtml += '</colgroup>';
                            }
                            let tableHtml = `<table class="question-fill-table answer-key-table">${colgroupHtml}<tbody>`;
                            q.tableData.rows.forEach((row, rowIndex) => {
                                const rowHeight = q.tableData.rowHeights?.[rowIndex];
                                const rowStyle = rowHeight ? `style="height: ${rowHeight}px;"` : '';
                                tableHtml += `<tr ${rowStyle}>`;
                                row.cells.forEach(cell => {
                                    if (cell.isMerged) return;
                                    const answer = (q.tableAnswerKey || {})[cell.id];
                                    const content = sanitizeRichHtml(cell.content);
                                    const vaStyle = cell.verticalAlign ? `vertical-align: ${cell.verticalAlign};` : '';
                                    const cellStyle = vaStyle ? `style="${vaStyle}"` : '';
                                    const colspan = cell.colspan ? `colspan="${cell.colspan}"` : '';
                                    const rowspan = cell.rowspan ? `rowspan="${cell.rowspan}"` : '';
                                    // Show original content and the answer
                                    const answerContent = answer ? `<span class="answer-value">${escapeHtml(answer).replace(/\n/g, '<br/>')}</span>` : '';
                                    tableHtml += `<td ${colspan} ${rowspan} ${cellStyle}><div class="original-content">${content}</div>${answerContent}</td>`;
                                });
                                tableHtml += '</tr>';
                            });
                            tableHtml += '</tbody></table>';
                            answerText = tableHtml;
                        }
                        break;
                    case QuestionType.TABLE_MULTIPLE_CHOICE:
                    case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE: {
                        const key = q.tableChoiceAnswerKey || {};
                        const choices = q.choices || [];
                        if (Object.keys(key).length > 0) {
                            answerText = (q.tableData?.rows || []).map((row, rowIndex) => {
                                const rowAnswer = key[row.id];
                                const rowLabel = `Baris ${isRTL ? toArabicNumeral(rowIndex + 1) : rowIndex + 1}`;

                                if (!rowAnswer || (Array.isArray(rowAnswer) && rowAnswer.length === 0)) {
                                    return `<div><bdi>${rowLabel}:</bdi> <span class="no-answer">${T.noAnswer}</span></div>`;
                                }

                                const getChoiceLabel = (choiceId: string) => {
                                    const choice = choices.find(c => c.id === choiceId);
                                    if (!choice) return '?';
                                    const choiceIndex = choices.indexOf(choice);
                                    return isRTL ? toArabicLetter(choiceIndex) : String.fromCharCode(65 + choiceIndex);
                                };

                                let answerDisplay: string;
                                if (Array.isArray(rowAnswer)) {
                                    answerDisplay = rowAnswer.map(getChoiceLabel).join(', ');
                                } else {
                                    answerDisplay = getChoiceLabel(rowAnswer as string);
                                }
                                
                                return `<div><bdi>${rowLabel}:</bdi> ${answerDisplay}</div>`;
                            }).join('');
                        }
                        break;
                    }
                    case QuestionType.SHORT_ANSWER:
                    case QuestionType.ESSAY:
                        if(q.answerKey) answerText = `<span>${escapeHtml(q.answerKey as string)}</span>`;
                        break;
                 }

                const questionNumberDisplay = isRTL ? `&rlm;${toArabicNumeral(q.number)}.` : `${q.number}.`;
                return `
                    <div class="answer-item">
                        <div class="answer-number"><bdi>${questionNumberDisplay}</bdi></div>
                        <div class="answer-text">${answerText}</div>
                    </div>
                `;
            }).join('');
        
            const instructionParts = section.instructions.match(/^([^.]+)\.(.*)/);
            let instructionContent;
            if (instructionParts && instructionParts.length > 2) {
                let text = instructionParts[2].trim();
                if (isRTL) {
                    const translatedText = instructionTranslations[text as keyof typeof instructionTranslations] || text;
                    // For RTL, as requested, we remove the number to avoid formatting issues.
                    instructionContent = `<span class="instruction-text">${escapeHtml(translatedText)}</span>`;
                } else {
                    const roman = instructionParts[1].trim();
                    const numberComponent = `<bdi>${roman}.</bdi>`;
                    instructionContent = `<span class="instruction-number">${numberComponent}</span><span class="instruction-text">${escapeHtml(text)}</span>`;
                }
            } else {
                instructionContent = `<span>${escapeHtml(section.instructions)}</span>`;
            }

            return `
                <section class="exam-section">
                    <h3 class="exam-section-instruction">${instructionContent}</h3>
                    <div class="answers-list">${questionsHtml}</div>
                </section>
            `;
        }).join('');

         mainContentHtml = `
            <div class="answer-key-title">
                <h2>${T.answerKeyTitle}</h2>
                <h3>${escapeHtml(exam.title)}</h3>
                <div class="answer-key-meta">
                    <span>${T.subject}: <strong>${escapeHtml(exam.subject || '')}</strong></span>
                    <span class="separator">|</span>
                    <span>${T.class}: <strong>${escapeHtml(exam.class || '')}</strong></span>
                </div>
            </div>
            <div class="answer-key-body" data-paginate-root="answer-key-body">
                ${sectionsHtml}
            </div>
        `;
    }
    // --- End Main Content Generation ---
    const fontFallback = ['Liberation Serif', 'Amiri', 'Areef Ruqaa'].includes(fontFamily) ? 'serif' : 'sans-serif';

    const columnarStyles = ((layoutColumns || 1) === 2 && mode === 'exam') ? `
        .exam-body {
            column-count: 2;
            column-gap: 12mm;
        }
        .exam-section {
           break-inside: avoid;
        }
    ` : '';

    const embeddedStyles = `
        ${katexStyles}

        /* Basic Reset & Document Setup */
        *, *::before, *::after { box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }
        body { margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }
        p, h2, h3, h4, ol, ul, li, table, section, header { margin: 0; padding: 0; font-size: 1em; font-weight: normal; }
        ol, ul { list-style-position: outside; }
        table { border-collapse: collapse; width: 100%; }
        
        /* Font & Page Layout Settings */
        @page {
            size: ${paperSize};
            margin: 0;
        }
        body { 
            font-family: "${fontFamily}", ${fontFallback};
            line-height: ${lineSpacing};
            font-size: ${fontSize}pt;
        }
        .exam-sheet-container {
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 1.5rem;
             padding: 2rem 0;
             min-height: 100vh;
             box-sizing: border-box;
        }
        .exam-sheet {
            background-color: white;
            width: ${paperDimensions[paperSize].width};
            min-height: ${paperDimensions[paperSize].height};
            height: ${paperDimensions[paperSize].height};
            max-height: ${paperDimensions[paperSize].height};
            padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            transform-origin: top;
            transition: transform 0.2s ease-in-out;
            position: relative; /* For footer positioning context if needed */
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }
        .exam-sheet-inner {
            flex: 1 1 auto;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        /* Print-specific Styles */
        @media print {
            html, body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                background-color: white !important;
            }
            .no-print { display: none !important; }
            .exam-sheet-container { display: block !important; padding: 0 !important; }
            .exam-sheet {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                margin-bottom: 0 !important;
                width: ${paperDimensions[paperSize].width};
                min-height: ${paperDimensions[paperSize].height};
                height: ${paperDimensions[paperSize].height};
                max-height: ${paperDimensions[paperSize].height};
                transform: none !important;
                page-break-after: always;
                break-after: page;
                overflow: hidden !important;
            }
            .exam-sheet:last-child {
                page-break-after: auto;
                break-after: auto;
            }
            
            /* Watermark Footer for Print */
            .watermark-footer {
                display: block !important;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 8pt;
                color: #64748b; /* Slate-500 solid 100% */
                opacity: 1;
                font-style: italic;
                padding-bottom: 5mm;
                pointer-events: none;
            }
        }
        
        /* Screen View Styles for Watermark */
        .watermark-footer {
            display: block;
            margin-top: auto;
            text-align: center;
            font-size: 8pt;
            color: #64748b;
            opacity: 1;
            font-style: italic;
            border-top: 1px dashed #cbd5e1;
            padding-top: 0.4rem;
            padding-bottom: 0.1rem;
            flex-shrink: 0;
            box-sizing: border-box;
        }
            border-top: 1px dashed #cbd5e1;
            padding-top: 0.5rem;
        }

        /* --- Semantic Component Styles: HEADER --- */
        .exam-header { 
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }
        .exam-header .logo-container {
            flex-basis: 5rem;
            flex-shrink: 0;
            text-align: center;
        }
        /* Use a reliable class to hide empty logo containers */
        .exam-header .logo-container.is-empty {
            display: none;
        }
        .exam-header .logo-container.logo-left { text-align: left; }
        .exam-header .logo-container.logo-right { text-align: right; }
        .exam-header .logo { 
            max-height: 5rem;
            width: auto;
            object-fit: contain; 
        }
        .exam-header .header-text { 
            flex-grow: 1;
            flex-shrink: 1;
            min-width: 0; /* Critical for allowing flex item to shrink */
            text-align: center;
        }
        .exam-header .header-text p { 
            font-weight: bold; 
            font-size: 1.1em;
            line-height: 1.2; 
            margin: 0; 
            text-transform: uppercase;
            /* Default for auto mode. Fixed mode will override this inline */
            white-space: nowrap;
        }
        
        .header-divider { border: 0; border-top: 2px solid black; margin: 0; }
        .header-divider::after { content: ''; display: block; border-top: 1px solid black; margin-top: 1px; }

        .exam-title-container { text-align: center; margin: 1rem 0; }
        .exam-title-container h2 { font-size: 1.25em; font-weight: bold; text-transform: uppercase; }

        .meta-container { display: flex; justify-content: space-between; align-items: flex-start; margin: 1.5rem 0; }
        
        .student-info { width: 66%; font-size: 0.95em; }
        .student-info td { padding-block: 0.1rem; vertical-align: top; }
        .student-info td:first-child { font-weight: 600; white-space: nowrap; }
        .student-info .colon { padding-inline: 0.5rem; }
        .student-info .value { width: 100%; }
        .student-info .dots {
            overflow: hidden;
            white-space: nowrap;
            letter-spacing: 1.5px;
        }
        [dir="ltr"] .student-info td:first-child { width: 140px; }
        [dir="rtl"] .student-info { text-align: right; }
        [dir="rtl"] .student-info .colon { padding-inline: 0.2rem 0.8rem; }

        .score-box { width: 25%; border: 2px solid black; height: 6rem; position: relative; padding: 0.5rem; }
        .score-box span { position: absolute; top: 0.25rem; font-weight: bold; font-size: 0.9em; }
        [dir="ltr"] .score-box span { left: 0.5rem; }
        [dir="rtl"] .score-box span { right: 0.5rem; }
        
        /* --- Semantic Component Styles: BODY --- */
        .exam-body { margin-top: 1rem; }
        .general-instructions { margin-bottom: 1.5rem; break-inside: avoid; }
        .general-instructions h4 { font-weight: bold; text-decoration: underline; margin-bottom: 0.5rem; }
        .general-instructions .instructions-text { font-size: 0.95em; white-space: pre-wrap; }

        .exam-section { margin-top: 1.5rem; }
        .exam-section-instruction {
            display: flex;
            gap: 0.5em;
            font-weight: bold;
            margin-bottom: 1rem;
            break-after: avoid;
        }
        [dir="rtl"] .exam-section-instruction {
            flex-direction: row-reverse;
            justify-content: flex-end;
        }
        .instruction-number {
            white-space: nowrap;
        }
        .instruction-text {
            flex: 1;
        }
        [dir="rtl"] .instruction-text {
            flex: none;
        }
        
        /* Stimulus Styles */
        .section-stimulus {
            margin-bottom: 1rem;
            text-align: justify;
        }
        .section-stimulus img {
            max-width: 100%;
            height: auto;
            margin: 0.5rem auto;
            display: block;
        }
        
        /* New Question Type: Stimulus Block */
        .question-item.stimulus-block {
            display: block; /* Overrides default flex */
            margin-bottom: 1rem;
            width: 100%;
        }
        .question-item.stimulus-block .question-body {
            text-align: justify;
        }

        .questions-list, .answers-list { list-style: none; padding-inline-start: 0; }
        .question-item { display: flex; align-items: flex-start; gap: 0.5em; break-inside: avoid; margin-bottom: 1rem; }
        .question-number { font-weight: bold; }
        .question-body { flex: 1; }
        
        .choices-list { list-style-type: none; padding-inline-start: 0; margin-top: 0.5rem; }
        .choices-list li { display: flex; gap: 0.5em; margin-bottom: 0.25rem; break-inside: avoid; }
        
        .choices-grid-complex { margin-top: 0.5rem; padding-inline-start: 1.5rem; }
        .choice-item-complex { display: flex; align-items: flex-start; margin-bottom: 0.25rem; break-inside: avoid; }
        .checkbox-box { display: inline-block; width: 0.9em; height: 0.9em; border: 1px solid black; margin-inline-end: 0.5em; margin-top: 0.2em; flex-shrink: 0; }
        .choice-letter { margin-inline-end: 0.25em; }
        .choice-text { flex-grow: 1; }

        .choices-list-2-col, .choices-grid-complex-2-col {
            column-count: 2;
            column-gap: 2rem;
        }

        .true-false-container { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; padding-inline-start: 1.5rem; font-size: 0.95em; }
        .true-false-option { display: inline-block; padding: 0.15rem 0.75rem; border: 1px solid black; border-radius: 0.25rem; font-weight: bold; }

        .essay-answer-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
        .essay-answer-table td { border-bottom: 1px solid black; height: 0.6cm; }
        
        .matching-table { margin-top: 1rem; text-align: start; font-size: 1em; }
        .matching-table th { font-weight: bold; text-align: center; border: 1px solid black; padding: 0.5rem; }
        .matching-table td { vertical-align: top; padding: 0.25rem 0.5rem; border: 1px solid black; }
        .matching-table .prompt-number, .matching-table .answer-letter { padding-inline-end: 0.5rem; }
        .matching-table .prompt-text { width: 50%; }
        .matching-table .answer-text { width: 50%; }

        .question-fill-table { margin-top: 1rem; table-layout: fixed; width: 100%; }
        .question-fill-table td { padding: 0.5rem; border: 1px solid black; word-wrap: break-word; }
        .question-fill-table td p { margin: 0; } /* Reset default paragraph margin from Quill */

        /* Responsive Image Styles */
        .question-item img, .choices-list img, .choice-text img, .answer-text img, .question-fill-table td img {
            max-width: 100%;
            height: auto;
            border-radius: 0.25rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            display: block;
        }
        
        /* Quill-generated Content Styles */
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
        
        /* Math Formula (KaTeX) Styles */
        .ql-formula {
            font-size: 1.2em;
        }
        .katex {
            font-size: 1em;
        }
        .question-body .katex-display,
        .choice-text .katex-display,
        .answer-text .katex-display,
        .section-stimulus .katex-display {
            margin: 0.75rem 0;
            overflow-x: auto;
            overflow-y: hidden;
        }

        ${columnarStyles}

        /* Answer Key Styles */
        .answer-key-title { text-align: center; margin-bottom: 2rem; break-inside: avoid; }
        .answer-key-title h2 { font-size: 1.5em; font-weight: bold; }
        .answer-key-title h3 { font-size: 1.2em; margin-top: 0.25rem; }
        .answer-key-meta { margin-top: 0.75rem; font-size: 0.9em; color: #475569; }
        .answer-key-meta .separator { margin: 0 0.5rem; }
        .answer-key-meta strong { color: #1e293b; font-weight: 600; }
        .answers-list { margin-top: 1rem; }
        .answer-item { display: flex; margin-bottom: 0.5rem; }
        .answer-number { width: 3rem; font-weight: bold; flex-shrink: 0; }
        .answer-text { flex-grow: 1; }
        .answer-text .no-answer { color: #dc2626; font-style: italic; }
        .answer-key-table .original-content { font-size: 0.8em; color: #64748b; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.25rem; margin-bottom: 0.25rem; }
        .answer-key-table .answer-value { font-weight: bold; }
    `;

    const printButtonHtml = includePrintButton ? `
    <div class="no-print" style="position: fixed; top: 1rem; left: 1rem; z-index: 10;">
        <button onClick="window.print()" style="background-color: #2563eb; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            ${T.printButton}
        </button>
    </div>
    ` : '';

    const dynamicHeaderScript = `
    <script>
      function sgDebounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }

      function adjustHeaderTextSize() {
        const headerParagraphs = document.querySelectorAll('.exam-header .header-text p[data-size-mode="auto"]');
        if (!headerParagraphs.length) return;

        headerParagraphs.forEach(p => {
          p.style.fontSize = ''; 
          p.style.lineHeight = '';
          p.style.whiteSpace = 'nowrap';
          
          const parentContainer = p.parentElement;
          if (!parentContainer) return;

          const containerWidth = parentContainer.clientWidth;
          const textWidth = p.scrollWidth;
          
          if (textWidth > containerWidth) {
            const currentFontSize = parseFloat(window.getComputedStyle(p).fontSize);
            const ratio = containerWidth / textWidth;
            const newSize = currentFontSize * ratio * 0.98;
            const minSizePx = 13.333;
            
            if (newSize >= minSizePx) {
              p.style.fontSize = newSize + 'px';
              p.style.whiteSpace = 'nowrap';
            } else {
              p.style.fontSize = minSizePx + 'px';
              p.style.whiteSpace = 'normal';
            }
            p.style.lineHeight = '1.2';
          } else {
            p.style.whiteSpace = 'nowrap';
          }
        });
      }
      
      const debouncedAdjust = sgDebounce(adjustHeaderTextSize, 150);
      window.addEventListener('resize', debouncedAdjust);
    </script>
    `;

    const mathRenderScript = `
    <script>
      ${katexScriptSource}
      ${katexAutoRenderSource}

      function renderSoalGeniusMath() {
        if (typeof renderMathInElement !== 'function') return;
        try {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (err) {
          console.warn("KaTeX render error:", err);
        }
      }
    </script>
    `;
    
    const previewPaginationScript = `
    <script>
      function sgPageFits(sheet) {
        if (!sheet) return true;
        const inner = sheet.querySelector('.exam-sheet-inner');
        
        // 1. Check if sheet scrollHeight exceeds its clientHeight
        // Note: 2px tolerance for subpixel rounding
        if (sheet.scrollHeight > (sheet.clientHeight + 2)) {
          return false;
        }

        // 2. Check if inner scrollHeight exceeds inner clientHeight
        if (inner && inner.scrollHeight > (inner.clientHeight + 2)) {
          return false;
        }

        return true;
      }

      function sgCreatePage(templateSheet) {
        const page = templateSheet.cloneNode(false);
        const inner = document.createElement('div');
        inner.className = 'exam-sheet-inner';
        page.appendChild(inner);

        const footer = document.createElement('div');
        footer.className = 'watermark-footer';
        footer.textContent = 'Dibuat dengan SoalGenius by AI Projek | aiprojek01.my.id';
        page.appendChild(footer);

        return { sheet: page, inner };
      }

      function sgCloneChildren(nodes) {
        return nodes.map(node => node.cloneNode(true));
      }

      function paginatePreviewPages() {
        const container = document.querySelector('.exam-sheet-container');
        if (!container) return;

        // Ensure we capture the pristine, unpaginated initial sheet once
        if (!window.__sgPristineSourceSheet) {
          const initialSheet = container.querySelector('.exam-sheet');
          if (!initialSheet) return;
          window.__sgPristineSourceSheet = initialSheet.cloneNode(true);
        }

        const sourceSheet = window.__sgPristineSourceSheet.cloneNode(true);
        const sourceInner = sourceSheet.querySelector('.exam-sheet-inner');
        if (!sourceInner) return;

        const examBody = sourceInner.querySelector('[data-paginate-root="exam-body"]');
        const answerKeyBody = sourceInner.querySelector('[data-paginate-root="answer-key-body"]');
        const paginateRoot = examBody || answerKeyBody;
        if (!paginateRoot) return;

        const firstPageFixedNodes = Array.from(sourceInner.children).filter(child => child !== paginateRoot);
        const topLevelBlocks = Array.from(paginateRoot.children);
        const listSelector = examBody ? '.questions-list' : '.answers-list';

        // Clear container before populating pages
        container.innerHTML = '';

        const pages = [];
        const createNewPage = () => {
          const page = sgCreatePage(window.__sgPristineSourceSheet);
          const wrapper = paginateRoot.cloneNode(false);
          page.inner.appendChild(wrapper);
          page.wrapper = wrapper;
          container.appendChild(page.sheet);
          pages.push(page);
          return page;
        };

        let currentPage = createNewPage();
        sgCloneChildren(firstPageFixedNodes).forEach(node => {
          currentPage.inner.insertBefore(node, currentPage.wrapper);
        });

        const appendBlockToCurrent = (block) => {
          currentPage.wrapper.appendChild(block);
          if (sgPageFits(currentPage.sheet)) return true;
          currentPage.wrapper.removeChild(block);
          return false;
        };

        const paginateSection = (section) => {
          const list = section.querySelector(listSelector);
          const items = list ? Array.from(list.children) : [];
          if (!list || items.length === 0) {
            if (!appendBlockToCurrent(section.cloneNode(true))) {
              currentPage = createNewPage();
              currentPage.wrapper.appendChild(section.cloneNode(true));
            }
            return;
          }

          let itemIndex = 0;
          let isSectionStart = true;

          while (itemIndex < items.length) {
            const chunk = section.cloneNode(false);
            if (isSectionStart) {
              const staticChildren = Array.from(section.children).filter(child => child !== list);
              staticChildren.forEach(child => chunk.appendChild(child.cloneNode(true)));
            }
            const listClone = list.cloneNode(false);
            chunk.appendChild(listClone);

            currentPage.wrapper.appendChild(chunk);

            // If the section header itself doesn't fit on the current page, move to a new page
            if (!sgPageFits(currentPage.sheet)) {
              currentPage.wrapper.removeChild(chunk);
              const hasPriorContent = (currentPage.wrapper.children.length > 0) || (currentPage === pages[0] && firstPageFixedNodes.length > 0);
              if (hasPriorContent) {
                currentPage = createNewPage();
                currentPage.wrapper.appendChild(chunk);
              } else {
                currentPage.wrapper.appendChild(chunk);
              }
            }

            let itemsAddedInThisChunk = 0;
            while (itemIndex < items.length) {
              const itemClone = items[itemIndex].cloneNode(true);
              listClone.appendChild(itemClone);

              if (!sgPageFits(currentPage.sheet)) {
                listClone.removeChild(itemClone);
                if (itemsAddedInThisChunk === 0) {
                  const hasPriorContent = (currentPage.wrapper.children.length > 1) || (currentPage === pages[0] && firstPageFixedNodes.length > 0);
                  if (hasPriorContent) {
                    currentPage.wrapper.removeChild(chunk);
                    currentPage = createNewPage();
                    break;
                  } else {
                    // Force item on empty page to make progress
                    listClone.appendChild(itemClone);
                    itemIndex++;
                    itemsAddedInThisChunk++;
                    if (itemIndex < items.length) {
                      currentPage = createNewPage();
                    }
                    break;
                  }
                } else {
                  currentPage = createNewPage();
                  break;
                }
              }

              itemsAddedInThisChunk++;
              itemIndex++;
            }

            isSectionStart = false;
          }
        };

        topLevelBlocks.forEach(block => {
          if (block.classList.contains('exam-section')) {
            paginateSection(block);
          } else {
            const blockClone = block.cloneNode(true);
            if (!appendBlockToCurrent(blockClone)) {
              currentPage = createNewPage();
              currentPage.wrapper.appendChild(block.cloneNode(true));
            }
          }
        });

        window.__soalGeniusPreviewPageCount = pages.length;
        document.documentElement.style.setProperty('--sg-preview-pages', String(pages.length));
        try {
          window.dispatchEvent(new CustomEvent('soalgenius-preview-paginated', { detail: { pageCount: pages.length } }));
        } catch (e) {}
      }

      const debouncedPaginatePreview = sgDebounce(paginatePreviewPages, 120);
      window.addEventListener('resize', debouncedPaginatePreview);
    </script>
`;

    const autoZoomScript = `
    <script>
      function autoZoomOnMobile() {
        const sheets = document.querySelectorAll('.exam-sheet');
        if (!sheets.length) return;
        
        const isStandalone = ${includePrintButton ? 'true' : 'false'};
        if (!isStandalone) return;

        const viewportWidth = document.documentElement.clientWidth;
        sheets.forEach(sheet => {
          const sheetWidth = sheet.offsetWidth;
          const targetWidth = viewportWidth - 16;

          if (viewportWidth < 850 && sheetWidth > targetWidth) {
              const scale = targetWidth / sheetWidth;
              sheet.style.transform = \`scale(\${scale})\`;
              const scaledHeight = sheet.offsetHeight * scale;
              const marginOffset = sheet.offsetHeight - scaledHeight;
              sheet.style.marginBottom = \`-\${marginOffset}px\`;
          } else {
               sheet.style.transform = 'scale(1)';
               sheet.style.marginBottom = '0';
          }
        });
      }

      const debouncedAutoZoom = sgDebounce(autoZoomOnMobile, 150);
      window.addEventListener('resize', debouncedAutoZoom);
    </script>
`;

    const masterInitScript = `
    <script>
      function runMasterInit() {
        try { adjustHeaderTextSize(); } catch (e) { console.error(e); }
        try { renderSoalGeniusMath(); } catch (e) { console.error(e); }
        try { paginatePreviewPages(); } catch (e) { console.error(e); }
        try { autoZoomOnMobile(); } catch (e) { console.error(e); }
        try {
          window.dispatchEvent(new Event('soalgenius-preview-paginated'));
        } catch (e) {}
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runMasterInit);
      } else {
        runMasterInit();
      }

      window.addEventListener('load', runMasterInit);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          setTimeout(runMasterInit, 30);
        });
      }
    </script>
    `;

    return `
<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'id'}" dir="${direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(exam.title || 'Ujian')}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Areef+Ruqaa:wght@400;700&family=Liberation+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Liberation+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>${embeddedStyles}</style>
</head>
<body>
    ${printButtonHtml}
    <div class="exam-sheet-container">
        <main class="exam-sheet">
            <div class="exam-sheet-inner">
                ${mainContentHtml}
            </div>
            <div class="watermark-footer">Dibuat dengan SoalGenius by AI Projek | aiprojek01.my.id</div>
        </main>
    </div>
    ${dynamicHeaderScript}
    ${mathRenderScript}
    ${previewPaginationScript}
    ${autoZoomScript}
    ${masterInitScript}
</body>
</html>`;
};
