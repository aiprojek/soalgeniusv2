import { GoogleGenAI, Schema, Type } from "@google/genai";
import { QuestionType } from "../types";

export interface GeneratedQuestion {
    text: string;
    options?: string[]; // For Multiple Choice
    correctAnswer: string; // The text of the correct answer
    explanation?: string;
}

export type AiProvider = 'pollinations' | 'gemini';

const GEMINI_API_KEY_STORAGE = 'soalgenius_gemini_key';

export const saveGeminiKey = (key: string) => localStorage.setItem(GEMINI_API_KEY_STORAGE, key);
export const getGeminiKey = () => localStorage.getItem(GEMINI_API_KEY_STORAGE);

// Helper to clean raw text response into JSON
const extractJson = (text: string): any => {
    try {
        // Try parsing directly
        return JSON.parse(text);
    } catch (e) {
        // Try removing markdown code blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON block", e2);
            }
        }
        // Try finding the first [ and last ]
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
             try {
                return JSON.parse(text.substring(firstBracket, lastBracket + 1));
            } catch (e3) {
                console.error("Failed to parse array substring", e3);
            }
        }
        throw new Error("Gagal menguraikan respons AI menjadi format soal yang valid.");
    }
};

const generatePrompt = (params: any) => {
    return `
        You are an expert teacher. Create ${params.questionCount} exam questions.
        
        Topic: ${params.topic}
        Grade Level: ${params.gradeLevel}
        Difficulty: ${params.difficulty}
        Question Type: ${params.questionType}
        Language: Indonesian (Bahasa Indonesia).
        
        Ensure the questions are high quality, accurate, and suitable for the grade level.
        For Multiple Choice, provide 4 or 5 distinct options.
        
        OUTPUT FORMAT:
        You MUST output strict JSON array. No introduction text, no markdown formatting outside the JSON.
        Structure:
        [
          {
            "text": "Question text here...",
            "options": ["Option A", "Option B", "Option C", "Option D"], (Only for Multiple Choice)
            "correctAnswer": "The text of the correct answer",
            "explanation": "Brief explanation"
          }
        ]
    `;
};

const generatePollinations = async (params: any): Promise<GeneratedQuestion[]> => {
    const prompt = generatePollinationsSystemPrompt(params);
    
    // Pollinations Text API usually works via POST to OpenAI-compatible endpoint or simple GET
    // Using their text generation endpoint
    const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: 'You are a helpful assistant that outputs strictly JSON arrays of exam questions.' },
                { role: 'user', content: prompt }
            ],
            model: 'openai', // Pollinations directs this to available models
            seed: Math.floor(Math.random() * 1000)
        })
    });

    if (!response.ok) {
        throw new Error("Gagal menghubungi layanan Pollinations AI.");
    }

    const text = await response.text();
    return extractJson(text) as GeneratedQuestion[];
};

const generatePollinationsSystemPrompt = (params: any) => {
     let formatExample = "";
     if (params.questionType === QuestionType.MULTIPLE_CHOICE) {
         formatExample = `[{"text": "Ibukota Indonesia?", "options": ["Jakarta", "Bandung", "Surabaya", "Medan"], "correctAnswer": "Jakarta", "explanation": "Jakarta adalah ibukota."}]`;
     } else {
         formatExample = `[{"text": "Jelaskan tentang X", "correctAnswer": "X adalah...", "explanation": "..."}]`;
     }

     return `
        Buat ${params.questionCount} soal ujian Bahasa Indonesia.
        Topik: ${params.topic}
        Jenjang: ${params.gradeLevel}
        Tingkat: ${params.difficulty}
        Tipe: ${params.questionType}
        
        PENTING: Output HANYA JSON Valid. Jangan ada teks pembuka/penutup.
        Format Array JSON: ${formatExample}
     `;
};

const generateGemini = async (apiKey: string, params: any): Promise<GeneratedQuestion[]> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Define strict schema for Gemini
    let responseSchema: Schema;
    if (params.questionType === QuestionType.MULTIPLE_CHOICE) {
        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["text", "options", "correctAnswer"]
            }
        };
    } else {
        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["text", "correctAnswer"]
            }
        };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: generatePrompt(params),
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
        }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    return JSON.parse(jsonText) as GeneratedQuestion[];
};

export const generateQuestions = async (
    apiKey: string | null, // Nullable for Pollinations
    provider: AiProvider,
    params: {
        topic: string;
        questionCount: number;
        questionType: QuestionType;
        gradeLevel: string;
        difficulty: string;
    }
): Promise<GeneratedQuestion[]> => {
    try {
        if (provider === 'gemini') {
            if (!apiKey) throw new Error("API Key diperlukan untuk Gemini.");
            return await generateGemini(apiKey, params);
        } else {
            return await generatePollinations(params);
        }
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};