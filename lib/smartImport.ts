import { Question, QuestionType, MultipleChoiceOption } from "../types";

interface ParsedRawQuestion {
    text: string;
    options: { letter: string; text: string }[];
    answerKeyRaw: string | null;
}

export const parseRawText = (text: string): Question[] => {
    const lines = text.split('\n');
    const rawQuestions: ParsedRawQuestion[] = [];
    
    let currentQuestion: ParsedRawQuestion | null = null;
    let currentContext: 'question' | 'option' = 'question';
    
    // Regex Patterns
    const questionStartRegex = /^(\d+)[\.\)\-\s]\s+(.*)/; // 1. Text, 1) Text, 1- Text
    const optionStartRegex = /^([a-eA-E])[\.\)\-\s]\s+(.*)/; // A. Text, a) Text, A- Text
    const answerKeyRegex = /^(?:Kunci|Jawab|Jawaban|Ans|Answer)(?:\s*:\s*|\s+)([a-eA-E])/i; // Kunci: A, Jawaban A

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return; // Skip empty lines

        const questionMatch = trimmedLine.match(questionStartRegex);
        const optionMatch = trimmedLine.match(optionStartRegex);
        const answerMatch = trimmedLine.match(answerKeyRegex);

        if (questionMatch) {
            // New Question Start
            currentQuestion = {
                text: questionMatch[2],
                options: [],
                answerKeyRaw: null
            };
            rawQuestions.push(currentQuestion);
            currentContext = 'question';
        } else if (optionMatch && currentQuestion) {
            // New Option Start
            currentQuestion.options.push({
                letter: optionMatch[1].toUpperCase(),
                text: optionMatch[2]
            });
            currentContext = 'option';
        } else if (answerMatch && currentQuestion) {
            // Answer Key Found
            currentQuestion.answerKeyRaw = answerMatch[1].toUpperCase();
        } else {
            // Continuation of previous line
            if (currentQuestion) {
                if (currentContext === 'question') {
                    currentQuestion.text += `<br>${trimmedLine}`;
                } else if (currentContext === 'option' && currentQuestion.options.length > 0) {
                    const lastOptionIdx = currentQuestion.options.length - 1;
                    currentQuestion.options[lastOptionIdx].text += ` ${trimmedLine}`;
                }
            }
        }
    });

    // Convert raw parsed data to App Question format
    return rawQuestions.map(raw => {
        const questionId = crypto.randomUUID();
        const choices: MultipleChoiceOption[] = raw.options.map(opt => ({
            id: crypto.randomUUID(),
            text: opt.text
        }));

        // Map answer key letter (A, B, C...) to UUID
        let answerKey = '';
        if (raw.answerKeyRaw) {
            const index = raw.answerKeyRaw.charCodeAt(0) - 65; // A=0, B=1...
            if (index >= 0 && index < choices.length) {
                answerKey = choices[index].id;
            }
        }

        // Determine type. If options exist -> Multiple Choice, otherwise Essay
        const type = choices.length > 0 ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY;

        // Clean up text (simple bolding/formatting could be added here if needed)
        
        return {
            id: questionId,
            number: '', // Parent will assign number
            type: type,
            text: raw.text,
            choices: type === QuestionType.MULTIPLE_CHOICE ? choices : undefined,
            answerKey: answerKey,
            // For Essay defaults
            hasAnswerSpace: type === QuestionType.ESSAY ? true : undefined
        };
    });
};