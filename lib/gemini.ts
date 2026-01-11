import { GoogleGenAI, Schema, Type } from "@google/genai";
import { QuestionType } from "../types";

export interface GeneratedQuestion {
    text: string;
    options?: string[]; // For Multiple Choice
    correctAnswer: string; // The text of the correct answer
    explanation?: string;
}

const GEMINI_API_KEY_STORAGE = 'soalgenius_gemini_key';

export const saveGeminiKey = (key: string) => localStorage.setItem(GEMINI_API_KEY_STORAGE, key);
export const getGeminiKey = () => localStorage.getItem(GEMINI_API_KEY_STORAGE);

export const generateQuestions = async (
    apiKey: string,
    params: {
        topic: string;
        questionCount: number;
        questionType: QuestionType;
        gradeLevel: string;
        difficulty: string;
    }
): Promise<GeneratedQuestion[]> => {
    
    const ai = new GoogleGenAI({ apiKey });

    // Define strict schema for the output based on question type
    let responseSchema: Schema;

    if (params.questionType === QuestionType.MULTIPLE_CHOICE) {
        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "The question text." },
                    options: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "A list of 4 or 5 possible answer choices." 
                    },
                    correctAnswer: { type: Type.STRING, description: "The correct answer text (must match one of the options)." },
                    explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct." }
                },
                required: ["text", "options", "correctAnswer"]
            }
        };
    } else {
        // Essay / Short Answer / True False (simplified for now)
        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "The question text." },
                    correctAnswer: { type: Type.STRING, description: "The model answer or correct key." },
                    explanation: { type: Type.STRING, description: "Brief explanation." }
                },
                required: ["text", "correctAnswer"]
            }
        };
    }

    const prompt = `
        You are an expert teacher. Create ${params.questionCount} exam questions.
        
        Topic: ${params.topic}
        Grade Level: ${params.gradeLevel}
        Difficulty: ${params.difficulty}
        Question Type: ${params.questionType}
        Language: Indonesian (Bahasa Indonesia).
        
        Ensure the questions are high quality, accurate, and suitable for the grade level.
        For Multiple Choice, provide 4 or 5 distinct options.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Updated to follow guidelines for Basic Text Tasks
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7, // Balance creativity and accuracy
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from AI");
        
        const data = JSON.parse(jsonText);
        // data is the array directly because responseSchema root is ARRAY
        return data as GeneratedQuestion[];

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};