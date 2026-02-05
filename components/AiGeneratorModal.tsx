import React, { useState, useEffect } from 'react';
import { QuestionType, Question } from '../types';
import { generateQuestions, getGeminiKey, GeneratedQuestion, AiProvider } from '../lib/gemini';
import { StarsIcon, CloseIcon, RobotIcon, SettingsIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface AiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuestionsGenerated: (questions: Question[]) => void;
}

const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onQuestionsGenerated }) => {
    const [provider, setProvider] = useState<AiProvider>('pollinations');
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState('Sedang');
    const [grade, setGrade] = useState('SMP Kelas 9');
    const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [hasGeminiKey, setHasGeminiKey] = useState(false);

    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            const savedKey = getGeminiKey();
            setHasGeminiKey(!!savedKey);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        const apiKey = getGeminiKey(); // Get fresh key

        if (provider === 'gemini' && !apiKey) {
            addToast('API Key Google Gemini belum diatur di Pengaturan.', 'error');
            return;
        }
        if (!topic) {
            addToast('Topik soal harus diisi.', 'error');
            return;
        }
        
        setIsLoading(true);
        setStatus(provider === 'pollinations' ? 'Menghubungi AI (Default)...' : 'Menghubungi Gemini...');

        try {
            const result: GeneratedQuestion[] = await generateQuestions(
                provider === 'gemini' ? apiKey : null,
                provider,
                {
                    topic,
                    questionCount: count,
                    gradeLevel: grade,
                    difficulty,
                    questionType: qType
                }
            );

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
                    
                    const correctChoice = choices.find(c => c.text.trim() === q.correctAnswer.trim()) 
                                        || choices.find(c => c.text.includes(q.correctAnswer));
                    
                    appQuestion.choices = choices;
                    appQuestion.answerKey = correctChoice ? correctChoice.id : '';
                } else if (qType === QuestionType.ESSAY || qType === QuestionType.SHORT_ANSWER) {
                    appQuestion.answerKey = q.correctAnswer;
                    if (qType === QuestionType.ESSAY) appQuestion.hasAnswerSpace = true;
                } else if (qType === QuestionType.TRUE_FALSE) {
                    const lowerAns = q.correctAnswer.toLowerCase();
                    appQuestion.answerKey = lowerAns.includes('benar') || lowerAns.includes('true') ? 'true' : 'false';
                }

                return appQuestion;
            });

            onQuestionsGenerated(newQuestions);
            addToast(`Berhasil membuat ${newQuestions.length} soal!`, 'success');
            onClose();

        } catch (error: any) {
            console.error(error);
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
                    
                    {/* Provider Toggle */}
                    <div className="flex p-1 bg-[var(--bg-muted)] rounded-lg">
                        <button 
                            onClick={() => setProvider('pollinations')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${provider === 'pollinations' ? 'bg-[var(--bg-secondary)] text-blue-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            Default (Gratis)
                        </button>
                        <button 
                            onClick={() => setProvider('gemini')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${provider === 'gemini' ? 'bg-[var(--bg-secondary)] text-purple-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            Advance (Gemini)
                        </button>
                    </div>

                    {/* API Key Warning */}
                    {provider === 'gemini' && !hasGeminiKey && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
                            <div className="text-yellow-600 mt-0.5"><SettingsIcon /></div>
                            <div>
                                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">API Key belum diatur</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    Silakan atur API Key Google Gemini Anda di menu Pengaturan sebelum menggunakan fitur ini.
                                </p>
                            </div>
                        </div>
                    )}

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
                                min="1" max={provider === 'pollinations' ? 5 : 10} 
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--bg-secondary)]"
                            />
                            {provider === 'pollinations' && count > 5 && <p className="text-[10px] text-orange-500 mt-1">Saran: Maksimal 5 soal untuk mode Default agar lebih cepat.</p>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Batal</button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || (provider === 'gemini' && !hasGeminiKey)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${isLoading || (provider === 'gemini' && !hasGeminiKey) ? 'bg-gray-400 cursor-not-allowed' : provider === 'gemini' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{status}</span>
                            </>
                        ) : (
                            <>
                                <StarsIcon />
                                <span>Buat Soal</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiGeneratorModal;