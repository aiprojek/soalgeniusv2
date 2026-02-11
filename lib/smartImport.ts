import { Question, QuestionType, MultipleChoiceOption } from "../types";

interface ParsedRawQuestion {
    text: string;
    options: { letter: string; text: string }[];
    answerKeyRaw: string | null;
}

export const parseRawText = (text: string): Question[] => {
    // 1. Pre-process text: Normalize newlines
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n');
    
    const rawQuestions: ParsedRawQuestion[] = [];
    let currentQuestion: ParsedRawQuestion | null = null;
    
    // State to track what we are currently building
    let context: 'NONE' | 'QUESTION_TEXT' | 'OPTION_TEXT' = 'NONE';
    let currentOptionIndex = -1; // To track active option being filled

    // Regex Patterns (Enhanced)
    // Matches: "1.", "1)", "1-", "01." at start of line
    const questionStartRegex = /^(\d+)(?:[\.\)\-]|\s\.)\s+(.*)/; 
    
    // Matches: "A.", "a.", "A)", "(A)", "A -", at start of line
    const optionStartRegex = /^(\(?\s*[a-eA-E]\s*[\.\)\-]?\)?)\s+(.*)/; 
    
    // Matches: "Kunci: A", "Jawaban: A", "Ans: A"
    const answerKeyRegex = /^(?:Kunci|Jawab|Jawaban|Ans|Answer|Key)\s*:?\s*([a-eA-E])(?:\s|$)/i;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const questionMatch = line.match(questionStartRegex);
        const optionMatch = line.match(optionStartRegex);
        const answerMatch = line.match(answerKeyRegex);

        // PRIORITY 1: Check for Answer Key
        if (answerMatch) {
            if (currentQuestion) {
                currentQuestion.answerKeyRaw = answerMatch[1].toUpperCase();
            }
            continue; 
        }

        // PRIORITY 2: Check for New Question Start
        // Logic: It's a new question if it matches the regex AND
        // (we are not currently parsing options OR the number seems sequential/valid)
        if (questionMatch) {
            // Determine if this is a false positive (e.g., "1. " inside a question text)
            // If we are currently inside QUESTION_TEXT and the indentation looks deep, ignore? 
            // For now, simpler logic: If it starts the line, assume it's a new question structure.
            // This fixes the "Question 6 became text of Option E" bug.
            
            const qText = questionMatch[2];
            
            // Finalize previous question if needed (formatting cleanup)
            if (currentQuestion) {
               // Optional: Trim trailing breaks
            }

            currentQuestion = {
                text: qText,
                options: [],
                answerKeyRaw: null
            };
            rawQuestions.push(currentQuestion);
            context = 'QUESTION_TEXT';
            currentOptionIndex = -1;
            continue;
        }

        // PRIORITY 3: Check for Option Start
        if (optionMatch && currentQuestion) {
            // Clean the letter part (remove brackets, dots) to get just A, B, C...
            const rawLetter = optionMatch[1].replace(/[\(\)\.\-\s]/g, '').toUpperCase();
            const optText = optionMatch[2];

            // Heuristic: Is this really an option?
            // If we just started a question, and see "A.", it's an option.
            // If we have options, and this letter follows the sequence (A->B), it's an option.
            // If the letter resets (we have C, now see A), it might be a sub-point in text, 
            // BUT for smart import, we assume structure > content. Resetting usually means mistake in previous parsing or new group.
            
            currentQuestion.options.push({
                letter: rawLetter,
                text: optText
            });
            
            context = 'OPTION_TEXT';
            currentOptionIndex = currentQuestion.options.length - 1;
            continue;
        }

        // PRIORITY 4: Text Continuation (The "Halu" Fix)
        // If we reach here, the line didn't match a Question Start, Option Start, or Key.
        // So it MUST be a continuation of the current context.
        if (currentQuestion) {
            if (context === 'QUESTION_TEXT') {
                // If appending to question, add a break tag for visual spacing
                // unless the previous line ended with a hyphen (word wrap)
                currentQuestion.text += `<br>${line}`;
            } else if (context === 'OPTION_TEXT' && currentOptionIndex >= 0) {
                // Continuation of an option text
                currentQuestion.options[currentOptionIndex].text += ` ${line}`;
            }
        }
    }

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
            // Normalize key input 'A' -> index 0
            const index = raw.answerKeyRaw.charCodeAt(0) - 65; 
            if (index >= 0 && index < choices.length) {
                answerKey = choices[index].id;
            }
        }

        // Determine type. If options exist -> Multiple Choice, otherwise Essay
        const type = choices.length > 0 ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY;

        return {
            id: questionId,
            number: '', // Parent will assign number based on index
            type: type,
            text: raw.text, // Keep HTML breaks
            choices: type === QuestionType.MULTIPLE_CHOICE ? choices : undefined,
            answerKey: answerKey,
            // For Essay defaults
            hasAnswerSpace: type === QuestionType.ESSAY ? true : undefined
        };
    });
};