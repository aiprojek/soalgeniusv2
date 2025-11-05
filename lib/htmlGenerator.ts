import type { Exam, Settings } from '../types';
import { QuestionType } from '../types';

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
        'A4': { width: '210mm' },
        'F4': { width: '215mm' },
        'Legal': { width: '216mm' },
        'Letter': { width: '216mm' },
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
                    ${examHeaderLines.map(line => `<p>${line.text}</p>`).join('')}
                </div>
                <div class="logo-container logo-right ${!rightLogo ? 'is-empty' : ''}">${rightLogoContent}</div>
            </header>
        `;

        const sectionsHtml = exam.sections.map((section, sectionIndex) => {
            const questionsHtml = section.questions.map(q => {
                const questionNumber = isRTL ? toArabicNumeral(q.number) : q.number;
                const questionText = q.text;
                let choicesHtml = '';
                switch(q.type) {
                    case QuestionType.MULTIPLE_CHOICE:
                        const mcListClass = q.isTwoColumns ? 'choices-list choices-list-2-col' : 'choices-list';
                        choicesHtml = `<ol class="${mcListClass}">${(q.choices || []).map((c, idx) => `<li><span class="choice-marker"><bdi>${isRTL ? toArabicLetter(idx) : String.fromCharCode(97 + idx)}.</bdi></span><div class="choice-text">${c.text}</div></li>`).join('')}</ol>`;
                        break;
                    case QuestionType.COMPLEX_MULTIPLE_CHOICE:
                         const cmcGridClass = q.isTwoColumns ? 'choices-grid-complex choices-grid-complex-2-col' : 'choices-grid-complex';
                         choicesHtml = `
                            <div class="${cmcGridClass}">
                                ${(q.choices || []).map((choice, index) => `
                                    <div class="choice-item-complex">
                                        <span class="checkbox-box"></span>
                                        <span class="choice-letter">${isRTL ? toArabicLetter(index) : String.fromCharCode(97 + index)}.</span>
                                        <div class="choice-text">${choice.text}</div>
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
                            choicesHtml = '<div class="essay-space"></div><div class="essay-space"></div><div class="essay-space"></div>';
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
                                    <td class="prompt-text">${prompt?.text || ''}</td>
                                    <td class="answer-letter">${answer ? `<bdi>${isRTL ? toArabicLetter(i) : String.fromCharCode(65 + i)}.</bdi>` : ''}</td>
                                    <td class="answer-text">${answer?.text || ''}</td>
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
                                    tableRender += `<td ${colspan} ${rowspan} ${cellStyle}>${cell.content}</td>`;
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
                                                <div class="choice-text">${choice.text}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                             } else {
                                choiceRender = `<ol class="${listClass} choices-list-2-col">${(q.choices || []).map((c, idx) => `<li><span class="choice-marker"><bdi>${isRTL ? toArabicLetter(idx) : String.fromCharCode(97 + idx)}.</bdi></span><div class="choice-text">${c.text}</div></li>`).join('')}</ol>`;
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
                    instructionContent = `<span class="instruction-text">${translatedText}</span>`;
                } else {
                    const roman = instructionParts[1].trim();
                    const numberComponent = `<bdi>${roman}.</bdi>`;
                    instructionContent = `<span class="instruction-number">${numberComponent}</span><span class="instruction-text">${text}</span>`;
                }
            } else {
                instructionContent = `<span>${section.instructions}</span>`;
            }

            return `
                <section class="exam-section">
                    <h3 class="exam-section-instruction">${instructionContent}</h3>
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
                <div class="instructions-text">${exam.instructions.replace(/\n/g, '<br/>')}</div>
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
                 <h2>${exam.title}</h2>
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
                            <td class="value">${exam.class}</td>
                        </tr>
                        <tr>
                            <td>${T.subject}</td>
                            <td class="colon">:</td>
                            <td class="value">${exam.subject}</td>
                        </tr>
                        <tr>
                            <td>${T.date}</td>
                            <td class="colon">:</td>
                            <td class="value">${new Date(exam.date).toLocaleDateString(isRTL ? 'ar-SA-u-nu-arab' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td>${T.examTime}</td>
                            <td class="colon">:</td>
                            <td class="value">${exam.waktuUjian || ''}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="score-box">
                    <span>${T.score}</span>
                </div>
            </div>
            <div class="exam-body">
                ${examBodyHtml}
            </div>
        `;
    } else { // Answer Key Mode
        const sectionsHtml = exam.sections.map((section, sectionIndex) => {
            const questionsHtml = section.questions.map(q => {
                 let answerText = `<span class="no-answer">${T.noAnswer}</span>`;
                 switch(q.type) {
                    case QuestionType.MULTIPLE_CHOICE: {
                        const choice = (q.choices || []).find(c => c.id === q.answerKey);
                        if(choice) {
                            const choiceIndex = (q.choices || []).indexOf(choice);
                            answerText = `<span><bdi>${isRTL ? toArabicLetter(choiceIndex) : String.fromCharCode(65 + choiceIndex)}.</bdi> ${choice.text}</span>`;
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
                                    const content = cell.content; // Content is now HTML
                                    const vaStyle = cell.verticalAlign ? `vertical-align: ${cell.verticalAlign};` : '';
                                    const cellStyle = vaStyle ? `style="${vaStyle}"` : '';
                                    const colspan = cell.colspan ? `colspan="${cell.colspan}"` : '';
                                    const rowspan = cell.rowspan ? `rowspan="${cell.rowspan}"` : '';
                                    // Show original content and the answer
                                    const answerContent = answer ? `<span class="answer-value">${answer.replace(/\n/g, '<br/>')}</span>` : '';
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
                        if(q.answerKey) answerText = `<span>${q.answerKey as string}</span>`;
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
                    instructionContent = `<span class="instruction-text">${translatedText}</span>`;
                } else {
                    const roman = instructionParts[1].trim();
                    const numberComponent = `<bdi>${roman}.</bdi>`;
                    instructionContent = `<span class="instruction-number">${numberComponent}</span><span class="instruction-text">${text}</span>`;
                }
            } else {
                instructionContent = `<span>${section.instructions}</span>`;
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
                <h3>${exam.title}</h3>
                <div class="answer-key-meta">
                    <span>${T.subject}: <strong>${exam.subject || ''}</strong></span>
                    <span class="separator">|</span>
                    <span>${T.class}: <strong>${exam.class || ''}</strong></span>
                </div>
            </div>
            ${sectionsHtml}
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
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }
        body { 
            font-family: "${fontFamily}", ${fontFallback};
            line-height: ${lineSpacing};
            font-size: ${fontSize}pt;
        }
        .exam-sheet-container {
             display: flex;
             justify-content: center;
             padding: 2rem 0;
        }
        .exam-sheet {
            background-color: white;
            width: ${paperDimensions[paperSize].width};
            min-height: calc(${paperDimensions[paperSize].width} * 1.414); /* A4 aspect ratio approximation */
            padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }

        /* Print-specific Styles */
        @media print {
            html, body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                background-color: white !important;
            }
            .no-print { display: none !important; }
            .exam-sheet-container { padding: 0 !important; }
            .exam-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100%; min-height: auto; }
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
            /* This rule is essential for the script to measure the full text width */
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
        .general-instructions { margin-bottom: 1.5rem; }
        .general-instructions h4 { font-weight: bold; text-decoration: underline; margin-bottom: 0.5rem; }
        .general-instructions .instructions-text { font-size: 0.95em; white-space: pre-wrap; }

        .exam-section { margin-top: 1.5rem; }
        .exam-section-instruction {
            display: flex;
            gap: 0.5em;
            font-weight: bold;
            margin-bottom: 1rem;
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

        .questions-list { list-style: none; padding-inline-start: 0; }
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

        .essay-space { margin-top: 2rem; border-bottom: 1px solid #9ca3af; }
        
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

        ${columnarStyles}

        /* Answer Key Styles */
        .answer-key-title { text-align: center; margin-bottom: 2rem; }
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
      function debounce(func, wait) {
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
        const headerParagraphs = document.querySelectorAll('.exam-header .header-text p');
        if (!headerParagraphs.length) return;

        headerParagraphs.forEach(p => {
          // Reset inline styles to correctly recalculate on resize
          p.style.fontSize = ''; 
          p.style.lineHeight = '';
          
          const parentContainer = p.parentElement;
          if (!parentContainer) return;

          const containerWidth = parentContainer.clientWidth;
          const textWidth = p.scrollWidth;
          
          if (textWidth > containerWidth) {
            const currentFontSize = parseFloat(window.getComputedStyle(p).fontSize);
            const ratio = containerWidth / textWidth;
            // Use a safety margin (0.98) to avoid text touching the edges
            const newSize = currentFontSize * ratio * 0.98;
            // Set a minimum font size for readability
            const finalSize = Math.max(newSize, 8); // 8px minimum
            p.style.fontSize = finalSize + 'px';
            // Adjust line height to prevent overlap if font size changes significantly
            p.style.lineHeight = '1.2';
          }
        });
      }
      
      const debouncedAdjust = debounce(adjustHeaderTextSize, 150);

      // Run when the document is ready and fonts have been loaded
      document.addEventListener('DOMContentLoaded', () => {
        if (document.fonts) {
          document.fonts.ready.then(adjustHeaderTextSize);
        } else {
          // Fallback for older browsers
          setTimeout(adjustHeaderTextSize, 200);
        }
      });

      // Rerun on window resize
      window.addEventListener('resize', debouncedAdjust);
    </script>
    `;

    return `
<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'id'}" dir="${direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${exam.title || 'Ujian'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Areef+Ruqaa:wght@400;700&family=Liberation+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Liberation+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>${embeddedStyles}</style>
</head>
<body>
    ${printButtonHtml}
    <div class="exam-sheet-container">
        <main class="exam-sheet" style="box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            ${mainContentHtml}
        </main>
    </div>
    ${dynamicHeaderScript}
</body>
</html>`;
};