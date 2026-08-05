import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, StarsIcon } from './Icons';

interface AiImagePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
}

const AiImagePromptModal: React.FC<AiImagePromptModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        onSubmit(prompt.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-primary)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[var(--border-primary)] flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="text-purple-600"><StarsIcon className="w-5 h-5" /></span>
                        AI Image Generator (Gemini AI)
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Deskripsi Gambar
                        </label>
                        <textarea
                            ref={inputRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="Contoh: Seekor kucing pintar memakai kacamata dan sedang membaca buku fisika..."
                            className="w-full p-3 border border-[var(--border-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[100px] resize-y"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!prompt.trim()}
                        className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        <StarsIcon className="w-4 h-4" /> Buat Gambar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiImagePromptModal;
