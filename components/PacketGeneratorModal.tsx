import React, { useState } from 'react';
import { StackIcon, CloseIcon, ShuffleIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { createExamPackets } from '../lib/storage';

interface PacketGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: string | null;
    examTitle: string;
    onSuccess: () => void;
}

const PacketGeneratorModal: React.FC<PacketGeneratorModalProps> = ({ isOpen, onClose, examId, examTitle, onSuccess }) => {
    const [packetCount, setPacketCount] = useState(2);
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    const handleGenerate = async () => {
        if (!examId) return;
        setIsGenerating(true);
        try {
            await createExamPackets(examId, packetCount);
            addToast(`Berhasil membuat ${packetCount} paket soal (Paket A - ${String.fromCharCode(64 + packetCount)})`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Gagal membuat paket soal.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-primary)] overflow-hidden animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2">
                        <StackIcon className="text-xl text-purple-600" />
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">Generator Paket Soal</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--bg-hover)] rounded-full"><CloseIcon/></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm text-[var(--text-secondary)] border border-purple-100 dark:border-purple-800">
                        Fitur ini akan membuat salinan ujian <strong>"{examTitle}"</strong> menjadi beberapa paket berbeda.
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-1 text-xs">
                            <li>Setiap paket memiliki urutan soal yang diacak.</li>
                            <li>Urutan opsi jawaban (A, B, C, D) juga diacak.</li>
                            <li>Kunci jawaban menyesuaikan otomatis.</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Jumlah Paket (Varian)</label>
                        <select 
                            value={packetCount} 
                            onChange={(e) => setPacketCount(Number(e.target.value))}
                            className="w-full p-2 border border-[var(--border-secondary)] rounded-lg bg-[var(--bg-primary)] focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        >
                            <option value={2}>2 Paket (A & B)</option>
                            <option value={3}>3 Paket (A, B, C)</option>
                            <option value={4}>4 Paket (A, B, C, D)</option>
                            <option value={5}>5 Paket (A, B, C, D, E)</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-primary)] flex justify-end gap-3 bg-[var(--bg-tertiary)]">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Batal</button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <ShuffleIcon className="text-white" />
                                <span>Buat Paket</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PacketGeneratorModal;