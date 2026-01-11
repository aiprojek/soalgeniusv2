import React, { useState, useEffect } from 'react';
import { QuestionType, Question } from '../types';
import { generateQuestions, getGeminiKey, saveGeminiKey, GeneratedQuestion } from '../lib/gemini.ts';
import { StarsIcon, CloseIcon, RobotIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface AiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuestionsGenerated: (questions: Question[]) => void;
}

const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onQuestionsGenerated }) => {
    const [apiKey, setApiKey] = useState('');
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState('Sedang');
    const [grade, setGrade] = useState('SMP Kelas 9');
    const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');

    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            const savedKey = getGeminiKey();
            if (savedKey) setApiKey(savedKey);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!apiKey) {
            addToast('Masukkan API Key Google Gemini terlebih dahulu.', 'error');
            return;
        }
        if (!topic) {
            addToast('Topik soal harus diisi.', 'error');
            return;
        }

        saveGeminiKey(apiKey);
        setIsLoading(true);
        setStatus('Menghubungi AI...');

        try {
            const result: GeneratedQuestion[] = await generateQuestions(apiKey, {
                topic,
                questionCount: count,
                gradeLevel: grade,
                difficulty,
                questionType: qType
            });

            setStatus('Memproses hasil...');

            // Convert GeneratedQuestion to App Question
            const newQuestions: Question[] = result.map((q, idx) => {
                const questionId = crypto.randomUUID();
                
                let appQuestion: Question = {
                    id: questionId,
                    number: '', // Will be re-indexed by parent
                    text: q.text,
                    type: qType,
                };

                if (qType === QuestionType.MULTIPLE_CHOICE) {
                    const choices = (q.options || []).map(opt => ({
                        id: crypto.randomUUID(),
                        text: opt
                    }));
                    
                    // Find correct answer ID
                    // Simple heuristic: match text exact or contains
                    const correctChoice = choices.find(c => c.text.trim() === q.correctAnswer.trim()) 
                                        || choices.find(c => c.text.includes(q.correctAnswer));
                    
                    appQuestion.choices = choices;
                    appQuestion.answerKey = correctChoice ? correctChoice.id : '';
                } else if (qType === QuestionType.ESSAY || qType === QuestionType.SHORT_ANSWER) {
                    appQuestion.answerKey = q.correctAnswer;
                    if (qType === QuestionType.ESSAY) appQuestion.hasAnswerSpace = true;
                } else if (qType === QuestionType.TRUE_FALSE) {
                    // AI usually returns "True" or "False", map to "true" or "false" string
                    const lowerAns = q.correctAnswer.toLowerCase();
                    appQuestion.answerKey = lowerAns.includes('benar') || lowerAns.includes('true') ? 'true' : 'false';
                }

                return appQuestion;
            });

            onQuestionsGenerated(newQuestions);
            addToast(`Berhasil membuat ${newQuestions.length} soal!`, 'success');
            onClose();

        } catch (error: any) {
            addToast('Gagal membuat soal: ' + (error.message || 'Error tidak diketahui'), 'error');
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-primary)] flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2">
                        <StarsIcon className="text-xl text-purple-500" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">AI Generator Soal</h2>
                    </div>
                    <button onClick={onClose} disabled={isLoading} className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] p-1 rounded-full"><CloseIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* API Key Section */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Google Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)} 
                            placeholder="Tempel API Key di sini..."
                            className="w-full p-2 text-sm border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[10px] mt-1 text-blue-600 dark:text-blue-400">
                            Belum punya? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Dapatkan Gratis di Google AI Studio</a>.
                        </p>
                    </div>

                    {/* Inputs */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Topik / Materi</label>
                        <textarea 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Contoh: Hukum Newton, Sejarah Kemerdekaan RI, Fotosintesis..."
                            className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)] focus:ring-2 focus:ring-[var(--border-focus)] outline-none min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenjang / Kelas</label>
                            <input 
                                type="text" 
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Kesulitan</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                                <option value="Mudah">Mudah</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Sukar">Sukar</option>
                                <option value="HOTS">HOTS (Berpikir Tingkat Tinggi)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jenis Soal</label>
                            <select value={qType} onChange={(e) => setQType(e.target.value as QuestionType)} className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]">
                                <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda</option>
                                <option value={QuestionType.ESSAY}>Esai</option>
                                <option value={QuestionType.SHORT_ANSWER}>Isian Singkat</option>
                                <option value={QuestionType.TRUE_FALSE}>Benar-Salah</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jumlah Soal</label>
                            <input 
                                type="number" 
                                min="1" max="10" 
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Batal</button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${isLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{status}</span>
                            </>
                        ) : (
                            <>
                                <StarsIcon />
                                <span>Buat Soal Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiGeneratorModal;