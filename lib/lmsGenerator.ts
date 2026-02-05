import { Exam, Question, QuestionType, Section } from "../types";
import { escapeHtml } from "./utils";

const cdata = (content: string) => `<![CDATA[${content}]]>`;

const getMoodleType = (type: QuestionType): string => {
    switch (type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.COMPLEX_MULTIPLE_CHOICE: return 'multichoice';
        case QuestionType.TRUE_FALSE: return 'truefalse';
        case QuestionType.SHORT_ANSWER: return 'shortanswer';
        case QuestionType.MATCHING: return 'matching';
        case QuestionType.ESSAY: return 'essay';
        case QuestionType.STIMULUS: return 'description'; // New mapping for Stimulus
        default: return 'description'; // Fallback for unsupported types like TABLE
    }
};

const formatQuestion = (q: Question, category: string): string => {
    const type = getMoodleType(q.type);
    let xml = `  <question type="${type}">\n`;
    
    // For Stimulus, name doesn't have a number since q.number is empty
    const qNameText = q.type === QuestionType.STIMULUS 
        ? `Stimulus: ${q.text.substring(0, 50)}...`
        : `${q.number}. ${q.text.substring(0, 50)}...`;

    xml += `    <name><text>${cdata(qNameText)}</text></name>\n`;
    xml += `    <questiontext format="html"><text>${cdata(q.text)}</text></questiontext>\n`;
    
    // Default grade is only relevant for actual questions
    if (q.type !== QuestionType.STIMULUS) {
        xml += `    <defaultgrade>1</defaultgrade>\n`;
    }

    // Handle Specific Types
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
        xml += `    <single>true</single>\n    <shuffleanswers>true</shuffleanswers>\n    <answernumbering>abc</answernumbering>\n`;
        q.choices?.forEach(choice => {
            const isCorrect = q.answerKey === choice.id;
            xml += `    <answer fraction="${isCorrect ? '100' : '0'}" format="html">\n`;
            xml += `      <text>${cdata(choice.text)}</text>\n`;
            xml += `    </answer>\n`;
        });
    } 
    else if (q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
        xml += `    <single>false</single>\n    <shuffleanswers>true</shuffleanswers>\n    <answernumbering>abc</answernumbering>\n`;
        const correctIds = Array.isArray(q.answerKey) ? q.answerKey : [];
        const correctCount = correctIds.length || 1;
        const fraction = 100 / correctCount;
        
        q.choices?.forEach(choice => {
            const isCorrect = correctIds.includes(choice.id);
            // Moodle penalty logic for wrong answers in multi-select is usually negative, but let's keep it simple: 0 for wrong.
            // Note: Moodle strictly requires sum of positive fractions to be 100.
            xml += `    <answer fraction="${isCorrect ? fraction.toFixed(5) : '0'}" format="html">\n`;
            xml += `      <text>${cdata(choice.text)}</text>\n`;
            xml += `    </answer>\n`;
        });
    }
    else if (q.type === QuestionType.TRUE_FALSE) {
        const isTrue = q.answerKey === 'true';
        // Moodle: answer fraction 100 is the correct one.
        xml += `    <answer fraction="${isTrue ? '100' : '0'}"><text>true</text></answer>\n`;
        xml += `    <answer fraction="${!isTrue ? '100' : '0'}"><text>false</text></answer>\n`;
    }
    else if (q.type === QuestionType.SHORT_ANSWER) {
        xml += `    <answer fraction="100" format="html"><text>${cdata(q.answerKey as string || '')}</text></answer>\n`;
    }
    else if (q.type === QuestionType.MATCHING) {
        xml += `    <shuffleanswers>true</shuffleanswers>\n`;
        q.matchingKey?.forEach(pair => {
            const prompt = q.matchingPrompts?.find(p => p.id === pair.promptId)?.text || '';
            const answer = q.matchingAnswers?.find(a => a.id === pair.answerId)?.text || '';
            xml += `    <subquestion format="html">\n`;
            xml += `      <text>${cdata(prompt)}</text>\n`;
            xml += `      <answer><text>${answer}</text></answer>\n`;
            xml += `    </subquestion>\n`;
        });
    }
    // TABLE types are treated as Description because Moodle XML doesn't support complex table inputs natively in standard core.
    // ESSAY is simple default.
    // STIMULUS is mapped to 'description' which has no answers.

    xml += `  </question>\n`;
    return xml;
};

const formatDescription = (title: string, text: string): string => {
    let xml = `  <question type="description">\n`;
    xml += `    <name><text>${cdata(title)}</text></name>\n`;
    xml += `    <questiontext format="html"><text>${cdata(text)}</text></questiontext>\n`;
    xml += `  </question>\n`;
    return xml;
};

const formatCategory = (categoryName: string): string => {
    return `  <question type="category">\n    <category>\n      <text>${cdata(categoryName)}</text>\n    </category>\n  </question>\n`;
};

export const generateMoodleXML = (exam: Exam): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;
    
    // Set Top Category
    xml += formatCategory(`$course$/top/SoalGenius/${exam.title}`);

    exam.sections.forEach((section, idx) => {
        // Add Section Category (Optional, but keeps things organized)
        const sectionTitle = section.instructions.split('.')[0] || `Section ${idx + 1}`;
        xml += formatCategory(`$course$/top/SoalGenius/${exam.title}/${sectionTitle}`);

        // If there is a stimulus (legacy), add it as a Description question at the start of the section
        if (section.stimulus && section.stimulus.trim() !== '') {
            xml += formatDescription(`Stimulus ${sectionTitle}`, section.stimulus);
        }

        // Questions (including new STIMULUS types)
        section.questions.forEach(q => {
            xml += formatQuestion(q, sectionTitle);
        });
    });

    xml += `</quiz>`;
    return xml;
};