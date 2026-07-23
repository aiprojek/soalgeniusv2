import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface MathModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (latex: string, displayMode: boolean) => void;
}

const TEMPLATES = [
    { label: 'Pecahan', latex: '\\frac{a}{b}' },
    { label: 'Akar', latex: '\\sqrt{x}' },
    { label: 'Akar-n', latex: '\\sqrt[n]{x}' },
    { label: 'Pangkat', latex: 'x^{2}' },
    { label: 'Bawah', latex: 'x_{i}' },
    { label: 'Sigma', latex: '\\sum_{i=1}^{n} x_i' },
    { label: 'Integral', latex: '\\int_{a}^{b} f(x)\\,dx' },
    { label: 'Limit', latex: '\\lim_{x \\to \\infty}' },
    { label: 'Matriks', latex: '\\begin{pmatrix} a & b \\\\\\\\ c & d \\end{pmatrix}' },
    { label: 'Vektor', latex: '\\vec{v}' },
    { label: 'Derajat', latex: '90^{\\circ}' },
    { label: 'Persen', latex: '75\\%' },
    { label: 'Pi', latex: '\\pi' },
    { label: 'Tak hingga', latex: '\\infty' },
    { label: 'α β γ', latex: '\\alpha, \\beta, \\gamma' },
];

const MathModal: React.FC<MathModalProps> = ({ isOpen, onClose, onInsert }) => {
    const [latex, setLatex] = useState('');
    const [displayMode, setDisplayMode] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLatex('');
            setDisplayMode(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleInsert = () => {
        if (!latex.trim()) return;
        onInsert(latex.trim(), displayMode);
        onClose();
    };

    const handleTemplate = (tmpl: string) => {
        setLatex(prev => prev ? prev + ' ' + tmpl : tmpl);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleInsert();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="app-modal-panel w-full max-w-lg overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="app-modal-header flex justify-between items-center p-3.5 sm:p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-lg">
                            <i className="bi bi-calculator-fill" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Sisipkan Rumus (LaTeX)</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Ketik rumus LaTeX atau pilih template di bawah.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-secondary)]">
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Template chips */}
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Template Cepat</p>
                        <div className="flex flex-wrap gap-1.5">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.label}
                                    onClick={() => handleTemplate(t.latex)}
                                    className="px-2.5 py-1 text-xs font-mono rounded-[var(--radius-control)] bg-[var(--bg-muted)] hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                                    title={t.latex}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LaTeX input */}
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block uppercase tracking-wider">Kode LaTeX</label>
                        <textarea
                            ref={inputRef}
                            value={latex}
                            onChange={e => setLatex(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Contoh: \frac{a}{b} atau x^2 + y^2 = r^2"
                            rows={3}
                            className="w-full p-3 border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-primary)] font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">Tip: Tekan <kbd className="px-1 py-0.5 bg-[var(--bg-muted)] rounded text-[10px] border border-[var(--border-secondary)]">Ctrl+Enter</kbd> untuk menyisipkan.</p>
                    </div>

                    {/* Display mode toggle */}
                    <div className="flex items-center gap-3 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-control)]">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={displayMode}
                                onChange={e => setDisplayMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[var(--border-secondary)] peer-checked:bg-blue-500 rounded-full peer transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Mode Blok (Display)</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {displayMode ? 'Rumus ditampilkan sebagai blok tersendiri ($$...$$)' : 'Rumus inline dalam teks ($...$)'}
                            </p>
                        </div>
                    </div>

                    {/* KaTeX docs link */}
                    <p className="text-xs text-[var(--text-muted)]">
                        Butuh referensi? Lihat{' '}
                        <a
                            href="https://katex.org/docs/supported.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            dokumentasi KaTeX
                        </a>.
                    </p>
                </div>

                {/* Footer */}
                <div className="app-modal-footer p-3.5 sm:p-4 flex justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-[var(--radius-control)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!latex.trim()}
                        className="px-4 py-2 rounded-[var(--radius-control)] text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        <i className="bi bi-plus-lg" />
                        Sisipkan Rumus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MathModal;
