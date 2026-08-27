import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    getBankQuestions, 
    saveQuestionToBank, 
    updateBankQuestion, 
    deleteQuestionFromBank, 
    deleteMultipleQuestionsFromBank 
} from '../lib/storage';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import type { 
    BankQuestion, 
    Question, 
    MultipleChoiceOption, 
    MatchingItem, 
    TableData, 
    TableRowData, 
    TableCellData 
} from '../types';
import { QuestionType } from '../types';
import { 
    TrashIcon, 
    PlusIcon, 
    GlobeIcon, 
    SparklesIcon, 
    CheckIcon, 
    EditIcon, 
    CopyIcon, 
    SearchIcon, 
    BookmarkPlusIcon,
    TagIcon,
    EyeIcon,
    UndoIcon
} from '../components/Icons';
import { sanitizeRichHtml, stripHtml } from '../lib/utils';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import MathModal from '../components/MathModal';
import AiImagePromptModal from '../components/AiImagePromptModal';

interface QuestionBankViewProps {
  isModalMode?: boolean;
  onAddQuestions?: (questions: Question[]) => void;
  onClose?: () => void;
  onNavigateToCommunity?: () => void;
}

const COMMON_SUBJECTS = [
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Matematika',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Agama Islam (PAI)',
    'Pendidikan Pancasila / PKn',
    'Informatika',
    'Pendidikan Jasmani (PJOK)',
    'Seni Budaya',
    'Prakarya & Kewirausahaan',
    'Fisika',
    'Biologi',
    'Kimia',
    'Ekonomi',
    'Geografi',
    'Sosiologi',
    'Sejarah',
    'Bahasa Arab',
    'Al-Qur\'an Hadis',
    'Akidah Akhlak',
    'Fikih',
    'SKI'
];

const COMMON_CLASSES = [
    'Kelas I (SD/MI)',
    'Kelas II (SD/MI)',
    'Kelas III (SD/MI)',
    'Kelas IV (SD/MI)',
    'Kelas V (SD/MI)',
    'Kelas VI (SD/MI)',
    'Kelas VII (SMP/MTs)',
    'Kelas VIII (SMP/MTs)',
    'Kelas IX (SMP/MTs)',
    'Kelas X (SMA/MA/SMK)',
    'Kelas XI (SMA/MA/SMK)',
    'Kelas XII (SMA/MA/SMK)',
    'Fase A (Kelas 1-2)',
    'Fase B (Kelas 3-4)',
    'Fase C (Kelas 5-6)',
    'Fase D (Kelas 7-9)',
    'Fase E (Kelas 10)',
    'Fase F (Kelas 11-12)',
    'Umum'
];

const MATH_SVG_ICON = `<svg viewBox="0 0 18 18" width="18" height="18"><path class="ql-stroke" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M2.5 10.5h2l2.5 5 3.5-12h5.5"/><path class="ql-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12.5 8l3 3m0-3l-3 3"/></svg>`;
const AI_IMAGE_SVG_ICON = `<svg viewBox="0 0 18 18" width="18" height="18"><rect class="ql-stroke" x="2" y="4.5" width="10" height="9.5" rx="1.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path class="ql-stroke" d="M2 11.5l3-3 2.5 2.5 2-2 2.5 2.5" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle class="ql-fill" cx="5" cy="7.5" r="1"/><path class="ql-fill" d="M14.5 1.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z"/><path class="ql-fill" d="M16 8l.3.9.9.3-.9.3-.3.9-.3-.9-.9-.3.9-.3.3-.9z"/></svg>`;

const icons = Quill.import('ui/icons') as any;
if (icons) {
    icons['math'] = MATH_SVG_ICON;
    icons['aiImage'] = AI_IMAGE_SVG_ICON;
    icons['aiimage'] = AI_IMAGE_SVG_ICON;
    icons['ai-image'] = AI_IMAGE_SVG_ICON;
}

const compressImage = (base64Str: string, maxWidth = 1280, maxHeight = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

const createInitialTableData = (rows = 3, cols = 3): TableData => {
    return {
        rows: Array.from({ length: rows }, () => ({
            id: crypto.randomUUID(),
            cells: Array.from({ length: cols }, () => ({
                id: crypto.randomUUID(),
                content: ''
            }))
        })),
        columnWidths: Array(cols).fill(undefined),
        rowHeights: Array(rows).fill(undefined)
    };
};

/** Rich Text Editor with Math & AI Image Support */
const BankRichTextEditor: React.FC<{ 
    value: string; 
    onChange: (newValue: string) => void; 
    placeholder?: string;
    isOption?: boolean;
    direction?: 'ltr' | 'rtl';
}> = ({ value, onChange, placeholder, isOption = false, direction = 'ltr' }) => {
    const quillRef = useRef<ReactQuill>(null);
    const { addToast } = useToast();
    const [isMathModalOpen, setIsMathModalOpen] = useState(false);
    const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);

    const aiImageHandler = useCallback(() => {
        setIsAiImageModalOpen(true);
    }, []);

    const handleAiImageInsert = useCallback((prompt: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            addToast('Membuat gambar dengan AI...', 'info');
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
            
            fetch(imageUrl)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        editor.insertEmbed(range.index, 'image', base64data);
                        addToast('Gambar AI berhasil disisipkan!', 'success');
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(err => {
                    console.error("Gagal mengambil gambar Pollinations", err);
                    editor.insertEmbed(range.index, 'image', imageUrl);
                    addToast('Gambar disisipkan (URL).', 'success');
                });
        }
    }, [addToast]);

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                if (file.size > 3 * 1024 * 1024) {
                    addToast('Ukuran gambar tidak boleh melebihi 3MB.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const editor = quillRef.current?.getEditor();
                    if (editor && e.target?.result) {
                        try {
                            addToast('Mengompres gambar...', 'info');
                            const originalBase64 = e.target.result as string;
                            const compressedBase64 = await compressImage(originalBase64);
                            const range = editor.getSelection(true);
                            editor.insertEmbed(range.index, 'image', compressedBase64);
                            addToast('Gambar berhasil disisipkan.', 'success');
                        } catch (error) {
                            console.error("Gagal kompresi gambar:", error);
                            const range = editor.getSelection(true);
                            editor.insertEmbed(range.index, 'image', e.target.result as string);
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }, [addToast]);

    const mathHandler = useCallback(() => {
        setIsMathModalOpen(true);
    }, []);

    const handleMathInsert = useCallback((latex: string, isDisplayMode: boolean) => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);
        const wrappedFormula = isDisplayMode ? `$$${latex}$$` : `$${latex}$`;
        editor.insertText(range.index, wrappedFormula, 'user');
        editor.setSelection(range.index + wrappedFormula.length, 0, 'user');
    }, []);
    
    const modules = useMemo(() => {
        const mainToolbar = [
            ['bold', 'italic', 'underline', 'strike'], 
            [{ 'script': 'sub'}, { 'script': 'super' }], 
            [{ 'color': [] }, { 'background': [] }], 
            [{ 'direction': 'rtl' }, { 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }], 
            ['image', 'math', 'aiImage'],
            ['clean']
        ];
        const optionToolbar = [
            ['bold', 'italic', 'underline'], 
            [{ 'script': 'sub'}, { 'script': 'super' }], 
            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }], 
            ['math'], 
            ['clean']
        ];
        const toolbarContainer = isOption ? optionToolbar : mainToolbar;
        return { 
            toolbar: { 
                container: toolbarContainer, 
                handlers: { 
                    image: imageHandler,
                    math: mathHandler,
                    aiImage: aiImageHandler
                } 
            }, 
            clipboard: { matchVisual: false } 
        };
    }, [imageHandler, mathHandler, aiImageHandler, isOption]);

    const handleChange = (content: string) => {
        const normalizedContent = (content === '<p><br></p>' || content === '<br>') ? '' : content;
        if (normalizedContent !== value) {
            onChange(normalizedContent);
        }
    };

    useEffect(() => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const root = editor.root;
        const updateEditorDirection = () => {
            const currentDir = root.getAttribute('dir') || 'ltr';
            if (currentDir !== direction) {
                root.setAttribute('dir', direction);
            }
        };

        updateEditorDirection();
        editor.on('text-change', updateEditorDirection);

        // Add tooltips and inject SVGs into toolbar buttons
        const toolbar = editor.getModule('toolbar') as any;
        if (toolbar?.container) {
            const mathBtn = toolbar.container.querySelector('.ql-math') as HTMLElement | null;
            if (mathBtn) {
                mathBtn.setAttribute('title', direction === 'rtl' ? 'إدراج معادلة رياضية (LaTeX / KaTeX)' : 'Sisipkan Rumus Matematika (LaTeX / KaTeX)');
                mathBtn.setAttribute('aria-label', 'KaTeX Math Formula');
                mathBtn.innerHTML = MATH_SVG_ICON;
            }
            const aiImgBtn = (toolbar.container.querySelector('.ql-aiImage') || toolbar.container.querySelector('.ql-aiimage') || toolbar.container.querySelector('.ql-ai-image')) as HTMLElement | null;
            if (aiImgBtn) {
                aiImgBtn.setAttribute('title', direction === 'rtl' ? 'إنشاء صورة بالذكاء الاصطناعي' : 'Generate Gambar dengan AI (Gemini)');
                aiImgBtn.setAttribute('aria-label', 'AI Image Generator');
                aiImgBtn.innerHTML = AI_IMAGE_SVG_ICON;
            }
            const imgBtn = toolbar.container.querySelector('.ql-image') as HTMLElement | null;
            if (imgBtn) {
                imgBtn.setAttribute('title', direction === 'rtl' ? 'إدراج صورة' : 'Sisipkan Gambar');
            }
        }

        return () => {
            editor.off('text-change', updateEditorDirection);
        };
    }, [direction, isOption]);

    return (
        <div className={`so-genius-quill-wrapper ${isOption ? "so-genius-quill-option-wrapper" : ""} ${direction === 'rtl' ? 'so-genius-quill-rtl' : 'so-genius-quill-ltr'} w-full`} dir={direction}>
            <ReactQuill 
                ref={quillRef} 
                theme="snow" 
                value={value || ''} 
                onChange={handleChange} 
                placeholder={placeholder} 
                modules={modules}
            />
            {isMathModalOpen && (
                <MathModal 
                    isOpen={isMathModalOpen} 
                    onClose={() => setIsMathModalOpen(false)} 
                    onInsert={handleMathInsert} 
                    direction={direction} 
                />
            )}
            {isAiImageModalOpen && (
                <AiImagePromptModal 
                    isOpen={isAiImageModalOpen} 
                    onClose={() => setIsAiImageModalOpen(false)} 
                    onSubmit={handleAiImageInsert} 
                    direction={direction} 
                />
            )}
        </div>
    );
};

/** Interactive Table Editor Component for Question Bank */
const BankTableEditor: React.FC<{
    tableData: TableData;
    onTableChange: (newTableData: TableData) => void;
}> = ({ tableData, onTableChange }) => {
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

    const addRow = () => {
        const colCount = tableData.rows[0]?.cells.length || 3;
        const newRow: TableRowData = {
            id: crypto.randomUUID(),
            cells: Array.from({ length: colCount }, () => ({
                id: crypto.randomUUID(),
                content: ''
            }))
        };
        const newRowHeights = [...(tableData.rowHeights || []), undefined];
        onTableChange({ ...tableData, rows: [...tableData.rows, newRow], rowHeights: newRowHeights });
    };

    const removeRow = () => {
        if (tableData.rows.length <= 1) return;
        const newRows = tableData.rows.slice(0, -1);
        const newRowHeights = (tableData.rowHeights || []).slice(0, -1);
        onTableChange({ ...tableData, rows: newRows, rowHeights: newRowHeights });
    };

    const addColumn = () => {
        const newRows = tableData.rows.map(row => ({
            ...row,
            cells: [...row.cells, { id: crypto.randomUUID(), content: '' }]
        }));
        const newColWidths = [...(tableData.columnWidths || []), undefined];
        onTableChange({ ...tableData, rows: newRows, columnWidths: newColWidths });
    };

    const removeColumn = () => {
        const colCount = tableData.rows[0]?.cells.length || 0;
        if (colCount <= 1) return;
        const newRows = tableData.rows.map(row => ({
            ...row,
            cells: row.cells.slice(0, -1)
        }));
        const newColWidths = (tableData.columnWidths || []).slice(0, -1);
        onTableChange({ ...tableData, rows: newRows, columnWidths: newColWidths });
    };

    const handleCellChange = (rowIndex: number, colIndex: number, newContent: string) => {
        const newTableData = JSON.parse(JSON.stringify(tableData)) as TableData;
        if (newTableData.rows[rowIndex]?.cells[colIndex]) {
            newTableData.rows[rowIndex].cells[colIndex].content = newContent;
            onTableChange(newTableData);
        }
    };

    const handleCellSelection = (cellId: string) => {
        setSelectedCells(prev => {
            const newSelection = new Set(prev);
            newSelection.has(cellId) ? newSelection.delete(cellId) : newSelection.add(cellId);
            return newSelection;
        });
    };

    const { canMerge, canSplit } = useMemo(() => {
        const selectionSize = selectedCells.size;
        if (selectionSize === 0) return { canMerge: false, canSplit: false };

        const positions: { row: number, col: number, cell: TableCellData }[] = [];
        tableData.rows.forEach((row, rowIndex) => {
            row.cells.forEach((cell, colIndex) => {
                if (selectedCells.has(cell.id)) {
                    positions.push({ row: rowIndex, col: colIndex, cell });
                }
            });
        });

        if (selectionSize === 1) {
            const singleCell = positions[0].cell;
            const isSplittable = (singleCell.colspan && singleCell.colspan > 1) || (singleCell.rowspan && singleCell.rowspan > 1);
            return { canMerge: false, canSplit: !!isSplittable };
        }

        if (selectionSize > 1) {
            const minRow = Math.min(...positions.map(p => p.row));
            const maxRow = Math.max(...positions.map(p => p.row));
            const minCol = Math.min(...positions.map(p => p.col));
            const maxCol = Math.max(...positions.map(p => p.col));
            const isRectangle = selectionSize === (maxCol - minCol + 1) * (maxRow - minRow + 1);
            const noMergedCellsInSelection = positions.every(p => !p.cell.colspan && !p.cell.rowspan && !p.cell.isMerged);
            if (isRectangle && noMergedCellsInSelection) {
                return { canMerge: true, canSplit: false };
            }
        }
        return { canMerge: false, canSplit: false };
    }, [selectedCells, tableData]);

    const handleMerge = () => {
        if (!canMerge) return;
        const newTableData = JSON.parse(JSON.stringify(tableData)) as TableData;
        const positions: { row: number, col: number, cell: TableCellData }[] = [];
        newTableData.rows.forEach((row, rowIndex) => {
            row.cells.forEach((cell, colIndex) => {
                if (selectedCells.has(cell.id)) positions.push({ row: rowIndex, col: colIndex, cell });
            });
        });

        const minRow = Math.min(...positions.map(p => p.row));
        const maxRow = Math.max(...positions.map(p => p.row));
        const minCol = Math.min(...positions.map(p => p.col));
        const masterCell = newTableData.rows[minRow].cells[minCol];
        masterCell.rowspan = maxRow - minRow + 1;
        masterCell.colspan = Math.max(...positions.map(p => p.col)) - minCol + 1;
        masterCell.content = positions.map(p => p.cell.content).filter(Boolean).join(' ');
        
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c < minCol + masterCell.colspan; c++) {
                if (r === minRow && c === minCol) continue;
                newTableData.rows[r].cells[c].isMerged = true;
                newTableData.rows[r].cells[c].content = '';
            }
        }
        onTableChange(newTableData);
        setSelectedCells(new Set());
    };

    const handleSplit = () => {
        if (!canSplit) return;
        const newTableData = JSON.parse(JSON.stringify(tableData)) as TableData;
        const cellIdToSplit = Array.from(selectedCells)[0];
        let masterRow = -1, masterCol = -1;
        
        newTableData.rows.forEach((row, rIdx) => row.cells.forEach((cell, cIdx) => {
            if (cell.id === cellIdToSplit) { masterRow = rIdx; masterCol = cIdx; }
        }));

        if (masterRow === -1) return;

        const masterCell = newTableData.rows[masterRow].cells[masterCol];
        const { rowspan = 1, colspan = 1 } = masterCell;
        
        for (let r = masterRow; r < masterRow + rowspan; r++) {
            for (let c = masterCol; c < masterCol + colspan; c++) {
                 if (r === masterRow && c === masterCol) continue;
                 if (newTableData.rows[r]?.cells[c]) delete newTableData.rows[r].cells[c].isMerged;
            }
        }
        delete masterCell.rowspan;
        delete masterCell.colspan;
        onTableChange(newTableData);
        setSelectedCells(new Set());
    };

    const isRemoveRowDisabled = useMemo(() => {
        if (tableData.rows.length <= 1) return true;
        const lastRowIndex = tableData.rows.length - 1;
        return tableData.rows.some((row, rowIndex) => row.cells.some(cell => (cell.rowspan || 1) > 1 && (rowIndex + (cell.rowspan || 1) - 1) >= lastRowIndex));
    }, [tableData]);

    const isRemoveColDisabled = useMemo(() => {
        const colCount = tableData.rows[0]?.cells.length || 0;
        if (colCount <= 1) return true;
        const lastColIndex = colCount - 1;
        return tableData.rows.some(row => row.cells.some((cell, colIndex) => (cell.colspan || 1) > 1 && (colIndex + (cell.colspan || 1) - 1) >= lastColIndex));
    }, [tableData]);

    return (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-primary)] p-3.5 sm:p-4 bg-[var(--bg-tertiary)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-primary)]">
                <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <i className="bi bi-table text-[var(--text-accent)]"></i>
                    Editor Matriks / Struktur Tabel
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button 
                        type="button" 
                        onClick={addRow} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold"
                    >
                        + Baris
                    </button>
                    <button 
                        type="button" 
                        onClick={removeRow} 
                        disabled={isRemoveRowDisabled} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        - Baris
                    </button>
                    <button 
                        type="button" 
                        onClick={addColumn} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold"
                    >
                        + Kolom
                    </button>
                    <button 
                        type="button" 
                        onClick={removeColumn} 
                        disabled={isRemoveColDisabled} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        - Kolom
                    </button>
                    <button 
                        type="button" 
                        onClick={handleMerge} 
                        disabled={!canMerge} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Gabung Sel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSplit} 
                        disabled={!canSplit} 
                        className="px-2.5 py-1 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Pecah Sel
                    </button>
                </div>
            </div>

            {/* Editable Table Grid */}
            <div className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
                <table className="w-full text-xs border-collapse">
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={row.id}>
                                {row.cells.map((cell, colIndex) => !cell.isMerged && (
                                    <td 
                                        key={cell.id} 
                                        colSpan={cell.colspan || 1} 
                                        rowSpan={cell.rowspan || 1} 
                                        className={`border border-[var(--border-primary)] p-1.5 align-top transition-colors ${
                                            selectedCells.has(cell.id) ? 'bg-blue-100/70 dark:bg-blue-900/40 ring-1 ring-blue-500' : ''
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                                                <span>B{rowIndex + 1}, K{colIndex + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCellSelection(cell.id)}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                        selectedCells.has(cell.id) 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                                                    }`}
                                                >
                                                    {selectedCells.has(cell.id) ? 'Terpilih' : 'Pilih'}
                                                </button>
                                            </div>
                                            <BankRichTextEditor 
                                                isOption={true} 
                                                value={cell.content} 
                                                onChange={(newContent) => handleCellChange(rowIndex, colIndex, newContent)} 
                                                placeholder={`Teks sel B${rowIndex+1}, K${colIndex+1}...`} 
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const QuestionPreview: React.FC<{ question: Question }> = ({ question }) => {
    return (
        <div className="space-y-3">
            <div 
                className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-primary)] leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(question.text || '<em class="text-[var(--text-muted)]">Belum ada teks pertanyaan</em>') }} 
            />

            {/* Table Rendering for Table Question Types */}
            {(question.type === QuestionType.TABLE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && question.tableData && (
                <div className="overflow-x-auto my-2 rounded-[var(--radius-control)] border border-[var(--border-secondary)]">
                    <table className="w-full text-xs border-collapse bg-[var(--bg-secondary)]">
                        <tbody>
                            {question.tableData.rows.map((row, rIdx) => (
                                <tr key={row.id || rIdx}>
                                    {row.cells.map((cell, cIdx) => !cell.isMerged && (
                                        <td 
                                            key={cell.id || cIdx}
                                            colSpan={cell.colspan || 1}
                                            rowSpan={cell.rowspan || 1}
                                            className="border border-[var(--border-primary)] p-2 align-top text-[var(--text-primary)]"
                                        >
                                            <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(cell.content || '-') }} />
                                            {/* Cell Answer Key for Table Fill-in */}
                                            {question.type === QuestionType.TABLE && question.tableAnswerKey && question.tableAnswerKey[cell.id] && (
                                                <div className="mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                                                    Kunci: {question.tableAnswerKey[cell.id]}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Multiple Choice & Table Multiple Choice Options Preview */}
            {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && question.choices && question.choices.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {question.choices.map((choice, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isCorrect = Array.isArray(question.answerKey)
                            ? question.answerKey.includes(choice.id)
                            : question.answerKey === choice.id;

                        return (
                            <div 
                                key={choice.id} 
                                className={`flex items-start gap-2.5 p-2 rounded-[var(--radius-control)] border text-xs transition-colors ${
                                    isCorrect 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-medium' 
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                    isCorrect 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                }`}>
                                    {letter}
                                </span>
                                <div className="flex-grow min-w-0" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(choice.text || '-') }} />
                                {isCorrect && <CheckIcon className="text-emerald-600 dark:text-emerald-400 text-sm flex-shrink-0 mt-0.5" />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* True / False Preview */}
            {question.type === QuestionType.TRUE_FALSE && (
                <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">Kunci Jawaban:</span>
                    <span className={`px-2.5 py-0.5 rounded-[var(--radius-control)] text-xs font-bold ${
                        question.answerKey === 'true'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : question.answerKey === 'false'
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                        {question.answerKey === 'true' ? 'BENAR (True)' : question.answerKey === 'false' ? 'SALAH (False)' : 'Belum Ditentukan'}
                    </span>
                </div>
            )}

            {/* Essay / Short Answer Preview */}
            {(question.type === QuestionType.ESSAY || question.type === QuestionType.SHORT_ANSWER) && question.answerKey && (
                <div className="pt-1">
                    <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)] block mb-1">Pedoman / Kunci Jawaban:</span>
                        <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(String(question.answerKey)) }} />
                    </div>
                </div>
            )}

            {/* Matching Preview */}
            {question.type === QuestionType.MATCHING && question.matchingPrompts && question.matchingPrompts.length > 0 && (
                <div className="pt-1 space-y-1.5">
                    <span className="text-xs font-bold text-[var(--text-secondary)] block">Pasangan Menjodohkan:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {question.matchingPrompts.map((prompt, idx) => {
                            const pair = (question.matchingKey || []).find(k => k.promptId === prompt.id);
                            const answer = (question.matchingAnswers || []).find(a => a.id === pair?.answerId);
                            return (
                                <div key={prompt.id} className="p-2 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-between gap-2">
                                    <div className="min-w-0" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(prompt.text || '-') }} />
                                    <span className="text-[var(--text-accent)] font-bold">➔</span>
                                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 min-w-0" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(answer?.text || '-') }} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
    isModalMode = false,
    onAddQuestions,
    onClose,
    onNavigateToCommunity
}) => {
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    // Active View Tab: 'list' | 'create'
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

    // Bank list data
    const [bank, setBank] = useState<BankQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [subjectFilter, setSubjectFilter] = useState<string>('');
    const [classFilter, setClassFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    // Form State (For Direct Creation or Editing)
    const [editingBankQuestion, setEditingBankQuestion] = useState<BankQuestion | null>(null);
    const [formSubject, setFormSubject] = useState<string>('Matematika');
    const [formClass, setFormClass] = useState<string>('Kelas VII (SMP/MTs)');
    const [formType, setFormType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
    const [formText, setFormText] = useState<string>('');
    const [formChoices, setFormChoices] = useState<MultipleChoiceOption[]>([
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
    ]);
    const [formAnswerKey, setFormAnswerKey] = useState<any>('');
    const [formMatchingPrompts, setFormMatchingPrompts] = useState<MatchingItem[]>([]);
    const [formMatchingAnswers, setFormMatchingAnswers] = useState<MatchingItem[]>([]);
    const [formMatchingKey, setFormMatchingKey] = useState<{ promptId: string; answerId: string }[]>([]);
    const [formTableData, setFormTableData] = useState<TableData>(createInitialTableData(3, 3));
    const [formTableAnswerKey, setFormTableAnswerKey] = useState<{ [cellId: string]: string }>({});
    const [formTableChoiceAnswerKey, setFormTableChoiceAnswerKey] = useState<{ [rowId: string]: any }>({});
    const [isSavingForm, setIsSavingForm] = useState<boolean>(false);

    const loadBank = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBankQuestions();
            setBank(data);
        } catch (error) {
            console.error('Gagal memuat bank soal:', error);
            addToast('Gagal memuat bank soal.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadBank();
    }, [loadBank]);

    const resetForm = useCallback(() => {
        setEditingBankQuestion(null);
        setFormSubject('Matematika');
        setFormClass('Kelas VII (SMP/MTs)');
        setFormType(QuestionType.MULTIPLE_CHOICE);
        setFormText('');
        const opt1 = crypto.randomUUID();
        const opt2 = crypto.randomUUID();
        const opt3 = crypto.randomUUID();
        const opt4 = crypto.randomUUID();
        setFormChoices([
            { id: opt1, text: '' },
            { id: opt2, text: '' },
            { id: opt3, text: '' },
            { id: opt4, text: '' },
        ]);
        setFormAnswerKey(opt1);
        const p1 = crypto.randomUUID();
        const p2 = crypto.randomUUID();
        const a1 = crypto.randomUUID();
        const a2 = crypto.randomUUID();
        setFormMatchingPrompts([{ id: p1, text: '' }, { id: p2, text: '' }]);
        setFormMatchingAnswers([{ id: a1, text: '' }, { id: a2, text: '' }]);
        setFormMatchingKey([{ promptId: p1, answerId: a1 }, { promptId: p2, answerId: a2 }]);
        setFormTableData(createInitialTableData(3, 3));
        setFormTableAnswerKey({});
        setFormTableChoiceAnswerKey({});
    }, []);

    const handleStartCreate = () => {
        resetForm();
        setActiveTab('create');
    };

    const handleStartEdit = (bq: BankQuestion) => {
        setEditingBankQuestion(bq);
        setFormSubject(bq.subject || 'Umum');
        setFormClass(bq.class || 'Semua Kelas');
        setFormType(bq.question.type || QuestionType.MULTIPLE_CHOICE);
        setFormText(bq.question.text || '');
        if (bq.question.choices && bq.question.choices.length > 0) {
            setFormChoices(JSON.parse(JSON.stringify(bq.question.choices)));
        } else {
            setFormChoices([
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
            ]);
        }
        setFormAnswerKey(bq.question.answerKey || '');
        if (bq.question.matchingPrompts && bq.question.matchingPrompts.length > 0) {
            setFormMatchingPrompts(JSON.parse(JSON.stringify(bq.question.matchingPrompts)));
        }
        if (bq.question.matchingAnswers && bq.question.matchingAnswers.length > 0) {
            setFormMatchingAnswers(JSON.parse(JSON.stringify(bq.question.matchingAnswers)));
        }
        if (bq.question.matchingKey && bq.question.matchingKey.length > 0) {
            setFormMatchingKey(JSON.parse(JSON.stringify(bq.question.matchingKey)));
        }
        if (bq.question.tableData) {
            setFormTableData(JSON.parse(JSON.stringify(bq.question.tableData)));
        } else {
            setFormTableData(createInitialTableData(3, 3));
        }
        if (bq.question.tableAnswerKey) {
            setFormTableAnswerKey(JSON.parse(JSON.stringify(bq.question.tableAnswerKey)));
        }
        if (bq.question.tableChoiceAnswerKey) {
            setFormTableChoiceAnswerKey(JSON.parse(JSON.stringify(bq.question.tableChoiceAnswerKey)));
        }
        setActiveTab('create');
    };

    const handleSaveForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formText.trim() && formType !== QuestionType.TABLE) {
            addToast('Teks pertanyaan tidak boleh kosong.', 'error');
            return;
        }

        setIsSavingForm(true);
        try {
            const questionData: Question = {
                id: editingBankQuestion ? editingBankQuestion.question.id : crypto.randomUUID(),
                number: editingBankQuestion ? editingBankQuestion.question.number : '1',
                type: formType,
                text: formText,
                choices: (formType === QuestionType.MULTIPLE_CHOICE || 
                          formType === QuestionType.COMPLEX_MULTIPLE_CHOICE ||
                          formType === QuestionType.TABLE_MULTIPLE_CHOICE ||
                          formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE)
                    ? formChoices.filter(c => c.text.trim() !== '')
                    : undefined,
                answerKey: formAnswerKey,
                matchingPrompts: formType === QuestionType.MATCHING ? formMatchingPrompts.filter(p => p.text.trim() !== '') : undefined,
                matchingAnswers: formType === QuestionType.MATCHING ? formMatchingAnswers.filter(a => a.text.trim() !== '') : undefined,
                matchingKey: formType === QuestionType.MATCHING ? formMatchingKey : undefined,
                tableData: (formType === QuestionType.TABLE || 
                            formType === QuestionType.TABLE_MULTIPLE_CHOICE || 
                            formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) ? formTableData : undefined,
                tableAnswerKey: formType === QuestionType.TABLE ? formTableAnswerKey : undefined,
                tableChoiceAnswerKey: (formType === QuestionType.TABLE_MULTIPLE_CHOICE || 
                                       formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) ? formTableChoiceAnswerKey : undefined,
                hasAnswerSpace: formType === QuestionType.ESSAY
            };

            if (editingBankQuestion) {
                const updatedItem: BankQuestion = {
                    ...editingBankQuestion,
                    subject: formSubject.trim() || 'Umum',
                    class: formClass.trim() || 'Semua Kelas',
                    question: questionData
                };
                await updateBankQuestion(updatedItem);
                addToast('Butir soal berhasil diperbarui di Bank Soal.', 'success');
            } else {
                await saveQuestionToBank(questionData, {
                    subject: formSubject.trim() || 'Umum',
                    class: formClass.trim() || 'Semua Kelas'
                });
                addToast('Butir soal baru berhasil ditambahkan ke Bank Soal.', 'success');
            }

            resetForm();
            setActiveTab('list');
            loadBank();
        } catch (error) {
            console.error('Gagal menyimpan soal:', error);
            addToast('Gagal menyimpan soal ke Bank Soal.', 'error');
        } finally {
            setIsSavingForm(false);
        }
    };

    const handleDelete = (bankId: string) => {
        showConfirm({
            title: 'Hapus Soal dari Bank',
            content: 'Apakah Anda yakin ingin menghapus soal ini dari bank soal? Tindakan ini tidak dapat dibatalkan.',
            confirmVariant: 'danger',
            confirmLabel: 'Hapus',
            onConfirm: async () => {
                try {
                    await deleteQuestionFromBank(bankId);
                    addToast('Soal berhasil dihapus dari bank.', 'success');
                    setSelectedQuestionIds(prev => {
                        const next = new Set(prev);
                        next.delete(bankId);
                        return next;
                    });
                    loadBank();
                } catch (error) {
                    addToast('Gagal menghapus soal dari bank.', 'error');
                }
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedQuestionIds.size === 0) return;
        showConfirm({
            title: `Hapus ${selectedQuestionIds.size} Soal Terpilih`,
            content: `Apakah Anda yakin ingin menghapus ${selectedQuestionIds.size} butir soal yang dipilih dari Bank Soal?`,
            confirmVariant: 'danger',
            confirmLabel: 'Hapus Semua Terpilih',
            onConfirm: async () => {
                try {
                    await deleteMultipleQuestionsFromBank(Array.from(selectedQuestionIds));
                    addToast(`${selectedQuestionIds.size} butir soal berhasil dihapus.`, 'success');
                    setSelectedQuestionIds(new Set());
                    loadBank();
                } catch (error) {
                    addToast('Gagal menghapus beberapa butir soal.', 'error');
                }
            }
        });
    };

    const handleSelectQuestion = (bankId: string) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            newSet.has(bankId) ? newSet.delete(bankId) : newSet.add(bankId);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedQuestionIds.size === filteredBank.length) {
            setSelectedQuestionIds(new Set());
        } else {
            setSelectedQuestionIds(new Set(filteredBank.map(b => b.bankId)));
        }
    };

    const handleAddSelected = () => {
        const selectedQuestions = bank
            .filter(bq => selectedQuestionIds.has(bq.bankId))
            .map(bq => bq.question);
        onAddQuestions?.(selectedQuestions);
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(stripHtml(text));
        addToast('Teks soal berhasil disalin ke clipboard.', 'info');
    };

    const { uniqueSubjects, uniqueClasses, uniqueTypes } = useMemo(() => {
        const subjects = new Set<string>();
        const classes = new Set<string>();
        const types = new Set<string>();
        bank.forEach(bq => {
            if (bq.subject) subjects.add(bq.subject);
            if (bq.class) classes.add(bq.class);
            if (bq.question?.type) types.add(bq.question.type);
        });
        return { 
            uniqueSubjects: Array.from(subjects).sort(),
            uniqueClasses: Array.from(classes).sort(),
            uniqueTypes: Array.from(types).sort()
        };
    }, [bank]);

    const filteredBank = useMemo(() => {
        return bank.filter(bq => {
            const searchMatch = !searchTerm || 
                (bq.question.text && bq.question.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (bq.subject && bq.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (bq.class && bq.class.toLowerCase().includes(searchTerm.toLowerCase()));
            const subjectMatch = !subjectFilter || bq.subject === subjectFilter;
            const classMatch = !classFilter || bq.class === classFilter;
            const typeMatch = !typeFilter || bq.question.type === typeFilter;
            return searchMatch && subjectMatch && classMatch && typeMatch;
        });
    }, [bank, searchTerm, subjectFilter, classFilter, typeFilter]);

    return (
        <div className={isModalMode ? 'flex flex-col h-full space-y-4' : 'mx-auto w-full max-w-5xl flex flex-col space-y-5 pb-10 px-2 sm:px-4 md:px-6 animate-fade-in'}>
            
            {/* Header Card with Clean Responsive Action Buttons */}
            <div className="app-surface p-4 sm:p-5 md:p-6 rounded-[var(--radius-card)] space-y-4 shadow-sm border border-[var(--border-primary)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-accent)]">
                            <i className="bi bi-journal-richtext text-xs"></i>
                            <span>Koleksi Bank Soal Terstandar</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            {isModalMode ? 'Pilih Butir dari Bank Soal' : 'Bank Soal Mandiri'}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                            {isModalMode 
                                ? 'Pilih butir soal yang ingin dimasukkan langsung ke dalam naskah ujian aktif.'
                                : 'Kelola, buat langsung butir soal lengkap dengan teks kaya & rumus KaTeX, serta bagikan paket soal siap pakai.'}
                        </p>
                    </div>

                    {/* Action Buttons - Polished for Mobile & Tablet */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
                        {!isModalMode && onNavigateToCommunity && (
                            <button
                                onClick={onNavigateToCommunity}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-[var(--radius-control)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all shadow-xs min-h-[40px]"
                                title="Buka Pusat Berbagi Soal Antar-Guru / MGMP"
                            >
                                <GlobeIcon className="text-sm text-[var(--text-accent)]" />
                                <span className="whitespace-nowrap">Pusat Berbagi MGMP</span>
                            </button>
                        )}
                        <button
                            onClick={activeTab === 'create' ? () => setActiveTab('list') : handleStartCreate}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] transition-all shadow-xs min-h-[40px]"
                        >
                            {activeTab === 'create' ? (
                                <>
                                    <UndoIcon className="text-xs" />
                                    <span className="whitespace-nowrap">Kembali ke Daftar</span>
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="text-xs" />
                                    <span className="whitespace-nowrap">Buat Soal Langsung</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="app-tab-shell p-1 w-full">
                    <div className="grid grid-cols-2 gap-1 w-full">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`app-tab-button flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold transition-all min-h-[38px] ${
                                activeTab === 'list' ? 'app-tab-button-active' : ''
                            }`}
                        >
                            <BookmarkPlusIcon className={`text-sm ${activeTab === 'list' ? 'text-white' : 'text-current'}`} />
                            <span>Koleksi Soal</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                                activeTab === 'list' 
                                    ? 'bg-white/25 text-white' 
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
                            }`}>
                                {bank.length}
                            </span>
                        </button>

                        <button
                            onClick={handleStartCreate}
                            className={`app-tab-button flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold transition-all min-h-[38px] ${
                                activeTab === 'create' ? 'app-tab-button-active' : ''
                            }`}
                        >
                            <EditIcon className={`text-sm ${activeTab === 'create' ? 'text-white' : 'text-current'}`} />
                            <span className="truncate">{editingBankQuestion ? 'Edit Butir Soal' : 'Buat Soal Baru'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: LIST / BROWSE QUESTIONS */}
            {activeTab === 'list' && (
                <div className="space-y-4">
                    {/* Search & Filter Toolbar */}
                    <div className="app-surface p-3.5 sm:p-4 rounded-[var(--radius-card)] space-y-3 border border-[var(--border-primary)]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {/* Search Input */}
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
                                <input 
                                    type="text" 
                                    placeholder="Cari teks soal / materi..." 
                                    aria-label="Cari teks soal" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full pl-8 pr-3 py-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--bg-accent)]" 
                                />
                            </div>

                            {/* Subject Filter */}
                            <select 
                                aria-label="Filter berdasarkan mata pelajaran" 
                                value={subjectFilter} 
                                onChange={e => setSubjectFilter(e.target.value)} 
                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-medium"
                            >
                                <option value="">Semua Mata Pelajaran</option>
                                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {/* Class Filter */}
                            <select 
                                aria-label="Filter berdasarkan kelas" 
                                value={classFilter} 
                                onChange={e => setClassFilter(e.target.value)} 
                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-medium"
                            >
                                <option value="">Semua Jenjang / Kelas</option>
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {/* Type Filter */}
                            <select 
                                aria-label="Filter berdasarkan tipe soal" 
                                value={typeFilter} 
                                onChange={e => setTypeFilter(e.target.value)} 
                                className="w-full p-2 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-medium"
                            >
                                <option value="">Semua Tipe Soal</option>
                                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Bulk Action Controls */}
                        {filteredBank.length > 0 && (
                            <div className="pt-2 border-t border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedQuestionIds.size > 0 && selectedQuestionIds.size === filteredBank.length}
                                            onChange={handleSelectAll}
                                            className="rounded text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                        />
                                        <span>Pilih Semua ({filteredBank.length} Butir)</span>
                                    </label>

                                    {selectedQuestionIds.size > 0 && (
                                        <span className="text-[var(--text-accent)] font-bold">
                                            {selectedQuestionIds.size} soal dipilih
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedQuestionIds.size > 0 && !isModalMode && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-semibold"
                                        >
                                            <TrashIcon className="text-xs" />
                                            <span>Hapus Terpilih</span>
                                        </button>
                                    )}
                                    {(searchTerm || subjectFilter || classFilter || typeFilter) && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSubjectFilter('');
                                                setClassFilter('');
                                                setTypeFilter('');
                                            }}
                                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question List Cards */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="app-surface p-12 text-center rounded-[var(--radius-card)] space-y-3">
                                <div className="w-6 h-6 border-2 border-[var(--bg-accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-xs font-semibold text-[var(--text-secondary)]">Memuat daftar bank soal...</p>
                            </div>
                        ) : filteredBank.length > 0 ? (
                            filteredBank.map((bq, index) => {
                                const isSelected = selectedQuestionIds.has(bq.bankId);
                                return (
                                    <div 
                                        key={bq.bankId} 
                                        className={`app-surface p-4 sm:p-5 rounded-[var(--radius-card)] border transition-all space-y-3 ${
                                            isSelected 
                                                ? 'border-[var(--bg-accent)] ring-1 ring-[var(--bg-accent)]/30 shadow-xs' 
                                                : 'hover:border-[var(--border-secondary)]'
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[var(--border-primary)]">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <input 
                                                    type="checkbox" 
                                                    aria-label={`Pilih soal nomor ${index + 1}`} 
                                                    className="h-4 w-4 rounded text-[var(--bg-accent)] bg-transparent border-[var(--border-secondary)] focus:ring-[var(--bg-accent)]" 
                                                    checked={isSelected} 
                                                    onChange={() => handleSelectQuestion(bq.bankId)} 
                                                />
                                                <span className="font-extrabold text-xs text-[var(--text-secondary)]">
                                                    #{index + 1}
                                                </span>
                                                <span className="app-status-pill app-status-info text-[10px] font-bold">
                                                    {bq.question.type}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[11px] font-semibold text-[var(--text-primary)]">
                                                    <TagIcon className="text-[10px] text-[var(--text-accent)]" />
                                                    {bq.subject}
                                                </span>
                                                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                                                    {bq.class}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleCopyText(bq.question.text)}
                                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-control)] transition-colors"
                                                    title="Salin Teks Soal"
                                                >
                                                    <CopyIcon className="text-xs" />
                                                </button>
                                                {!isModalMode && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStartEdit(bq)}
                                                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-[var(--radius-control)] transition-colors"
                                                            title="Edit Butir Soal Ini"
                                                        >
                                                            <EditIcon className="text-xs" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(bq.bankId)} 
                                                            aria-label="Hapus soal dari bank" 
                                                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-[var(--radius-control)] transition-colors"
                                                            title="Hapus Soal"
                                                        >
                                                            <TrashIcon className="text-xs" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="pt-1">
                                            <QuestionPreview question={bq.question} />
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-primary)]">
                                            <span>Ditambahkan: {new Date(bq.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            {isModalMode && (
                                                <button
                                                    onClick={() => {
                                                        onAddQuestions?.([bq.question]);
                                                        addToast('Soal ditambahkan ke ujian.', 'success');
                                                    }}
                                                    className="text-xs text-[var(--text-accent)] font-bold hover:underline"
                                                >
                                                    + Masukkan Soal Ini
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="app-surface p-10 sm:p-12 rounded-[var(--radius-card)] text-center flex flex-col items-center justify-center space-y-3 border border-[var(--border-primary)]">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] shadow-xs">
                                    <BookmarkPlusIcon className="text-2xl text-[var(--text-accent)]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                                        {searchTerm || subjectFilter || classFilter || typeFilter 
                                            ? 'Tidak Ada Soal yang Cocok' 
                                            : 'Bank Soal Masih Kosong'}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1 leading-relaxed">
                                        {searchTerm || subjectFilter || classFilter || typeFilter
                                            ? 'Coba atur ulang kata kunci atau filter pencarian Anda.'
                                            : 'Anda dapat membuat butir soal baru secara langsung di sini, menyimpannya dari Editor Naskah Ujian, atau mengimpor paket soal dari Pusat Berbagi Komunitas MGMP.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                                    <button
                                        onClick={handleStartCreate}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] shadow-xs transition-all"
                                    >
                                        <PlusIcon className="text-xs" />
                                        <span>Buat Soal Sekarang</span>
                                    </button>
                                    {!isModalMode && onNavigateToCommunity && (
                                        <button
                                            onClick={onNavigateToCommunity}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-xs transition-colors"
                                        >
                                            <SparklesIcon className="text-xs text-[var(--text-accent)]" />
                                            <span>Jelajahi Paket MGMP</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: CREATE / EDIT QUESTION FORM WITH FULL TEXT TOOLS & ALL QUESTION TYPES */}
            {activeTab === 'create' && (
                <form onSubmit={handleSaveForm} className="app-surface p-4 sm:p-6 md:p-7 rounded-[var(--radius-card)] space-y-6 border border-[var(--border-primary)]">
                    <div className="border-s-4 border-[var(--bg-accent)] ps-3.5 py-0.5">
                        <h3 className="font-extrabold text-[var(--text-primary)] text-base sm:text-lg">
                            {editingBankQuestion ? 'Edit Butir Soal Bank' : 'Formulir Pembuatan Butir Soal Langsung'}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Susun teks soal dengan text tools lengkap (LaTeX KaTeX, Gambar AI, format teks) dan kunci penskoran.
                        </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Mata Pelajaran <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                list="subject-suggestions"
                                value={formSubject}
                                onChange={e => setFormSubject(e.target.value)}
                                placeholder="Contoh: Matematika"
                                required
                                className="w-full p-2.5 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-semibold"
                            />
                            <datalist id="subject-suggestions">
                                {COMMON_SUBJECTS.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>

                        {/* Class */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Jenjang / Kelas <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                list="class-suggestions"
                                value={formClass}
                                onChange={e => setFormClass(e.target.value)}
                                placeholder="Contoh: Kelas VII (SMP/MTs)"
                                required
                                className="w-full p-2.5 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-semibold"
                            />
                            <datalist id="class-suggestions">
                                {COMMON_CLASSES.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>

                        {/* Complete Question Type Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Tipe Bentuk Soal <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={formType}
                                onChange={e => {
                                    const newType = e.target.value as QuestionType;
                                    setFormType(newType);
                                    if (newType === QuestionType.TRUE_FALSE) {
                                        setFormAnswerKey('true');
                                    } else if (newType === QuestionType.MULTIPLE_CHOICE || newType === QuestionType.TABLE_MULTIPLE_CHOICE) {
                                        setFormAnswerKey(formChoices[0]?.id || '');
                                    } else if (newType === QuestionType.COMPLEX_MULTIPLE_CHOICE || newType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                                        setFormAnswerKey([formChoices[0]?.id || '']);
                                    } else {
                                        setFormAnswerKey('');
                                    }
                                }}
                                className="w-full p-2.5 text-xs border border-[var(--border-secondary)] rounded-[var(--radius-control)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-accent)] font-bold text-[var(--text-accent)]"
                            >
                                <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda (Tunggal)</option>
                                <option value={QuestionType.COMPLEX_MULTIPLE_CHOICE}>Pilihan Ganda Kompleks</option>
                                <option value={QuestionType.ESSAY}>Esai / Uraian</option>
                                <option value={QuestionType.SHORT_ANSWER}>Isian Singkat</option>
                                <option value={QuestionType.TRUE_FALSE}>Benar / Salah</option>
                                <option value={QuestionType.MATCHING}>Menjodohkan</option>
                                <option value={QuestionType.TABLE}>Tabel Isian (Matriks)</option>
                                <option value={QuestionType.TABLE_MULTIPLE_CHOICE}>Tabel Pilihan Ganda</option>
                                <option value={QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE}>Tabel Pilihan Ganda Kompleks</option>
                                <option value={QuestionType.STIMULUS}>Informasi / Stimulus Wacana</option>
                            </select>
                        </div>
                    </div>

                    {/* Question Content / Stem with Full Rich Text Editor & Text Tools */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Teks Pertanyaan / Stimulus Soal <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                Dilengkapi Text Tools: Bold, Italic, LaTeX Rumus, Gambar AI & Format.
                            </span>
                        </div>
                        <BankRichTextEditor 
                            value={formText} 
                            onChange={setFormText} 
                            placeholder="Tuliskan pertanyaan, instruksi, atau wacana stimulus di sini..." 
                        />
                    </div>

                    {/* TYPE SPECIFIC EDITORS */}

                    {/* 1. TABLE BUILDER for TABLE, TABLE_MULTIPLE_CHOICE, and TABLE_COMPLEX_MULTIPLE_CHOICE */}
                    {(formType === QuestionType.TABLE || formType === QuestionType.TABLE_MULTIPLE_CHOICE || formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && (
                        <div className="space-y-3 pt-3 border-t border-[var(--border-primary)]">
                            <BankTableEditor 
                                tableData={formTableData} 
                                onTableChange={setFormTableData} 
                            />

                            {/* Table Answer Key for TABLE (Fill-in) */}
                            {formType === QuestionType.TABLE && (
                                <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2.5">
                                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                                        Kunci Jawaban Isian Sel Tabel
                                    </label>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Tuliskan jawaban yang diharapkan untuk setiap sel tabel yang aktif:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {(formTableData?.rows || []).flatMap((row, rIdx) => 
                                            row.cells.filter(cell => !cell.isMerged).map((cell, cIdx) => (
                                                <div key={cell.id} className="p-2 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] space-y-1">
                                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] block truncate">
                                                        B{rIdx + 1}, K{cIdx + 1}: {cell.content ? stripHtml(cell.content).slice(0, 20) : 'Sel'}
                                                    </span>
                                                    <input 
                                                        type="text" 
                                                        value={formTableAnswerKey[cell.id] || ''} 
                                                        onChange={e => setFormTableAnswerKey(prev => ({ ...prev, [cell.id]: e.target.value }))}
                                                        placeholder="Jawaban kunci..."
                                                        className="w-full p-1.5 text-xs border border-[var(--border-secondary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Multiple Choice Options (for MULTIPLE_CHOICE, COMPLEX_MULTIPLE_CHOICE, TABLE_MULTIPLE_CHOICE, TABLE_COMPLEX_MULTIPLE_CHOICE) */}
                    {(formType === QuestionType.MULTIPLE_CHOICE || 
                      formType === QuestionType.COMPLEX_MULTIPLE_CHOICE || 
                      formType === QuestionType.TABLE_MULTIPLE_CHOICE || 
                      formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && (
                        <div className="space-y-3 pt-3 border-t border-[var(--border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                                        Pilihan Opsi Jawaban & Kunci Jawaban
                                    </label>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {(formType === QuestionType.MULTIPLE_CHOICE || formType === QuestionType.TABLE_MULTIPLE_CHOICE)
                                            ? 'Pilih satu opsi radio sebagai kunci jawaban benar.'
                                            : 'Centang satu atau beberapa kotak sebagai kunci jawaban benar.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormChoices(prev => [...prev, { id: crypto.randomUUID(), text: '' }]);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-bold border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
                                >
                                    <PlusIcon className="text-[10px]" />
                                    <span>Tambah Opsi</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formChoices.map((choice, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const isChecked = (formType === QuestionType.COMPLEX_MULTIPLE_CHOICE || formType === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE)
                                        ? Array.isArray(formAnswerKey) && formAnswerKey.includes(choice.id)
                                        : formAnswerKey === choice.id;

                                    return (
                                        <div key={choice.id} className="flex items-start gap-2.5 p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                            {/* Key Selector */}
                                            <div className="flex-shrink-0 pt-2 flex items-center justify-center">
                                                {(formType === QuestionType.MULTIPLE_CHOICE || formType === QuestionType.TABLE_MULTIPLE_CHOICE) ? (
                                                    <input
                                                        type="radio"
                                                        name="mc-key"
                                                        checked={isChecked}
                                                        onChange={() => setFormAnswerKey(choice.id)}
                                                        className="h-4 w-4 text-[var(--bg-accent)] focus:ring-[var(--bg-accent)] cursor-pointer"
                                                        title={`Tandai Opsi ${letter} sebagai Kunci Jawaban`}
                                                    />
                                                ) : (
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={e => {
                                                            const currentKeys = Array.isArray(formAnswerKey) ? [...formAnswerKey] : [];
                                                            if (e.target.checked) {
                                                                setFormAnswerKey([...currentKeys, choice.id]);
                                                            } else {
                                                                setFormAnswerKey(currentKeys.filter(k => k !== choice.id));
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded text-[var(--bg-accent)] focus:ring-[var(--bg-accent)] cursor-pointer"
                                                        title={`Tandai Opsi ${letter} sebagai Kunci Jawaban`}
                                                    />
                                                )}
                                            </div>

                                            {/* Letter Badge */}
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 ${
                                                isChecked
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
                                            }`}>
                                                {letter}
                                            </span>

                                            {/* Choice Rich Text Input */}
                                            <div className="flex-grow min-w-0">
                                                <BankRichTextEditor 
                                                    isOption={true}
                                                    value={choice.text}
                                                    onChange={val => {
                                                        setFormChoices(prev => prev.map(c => c.id === choice.id ? { ...c, text: val } : c));
                                                    }}
                                                    placeholder={`Teks pilihan opsi ${letter}...`}
                                                />
                                            </div>

                                            {/* Delete Choice Button */}
                                            {formChoices.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormChoices(prev => prev.filter(c => c.id !== choice.id));
                                                        if (formAnswerKey === choice.id) {
                                                            setFormAnswerKey(formChoices[0]?.id || '');
                                                        }
                                                    }}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors mt-1"
                                                    title="Hapus Opsi Ini"
                                                >
                                                    <TrashIcon className="text-xs" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. True / False Key */}
                    {formType === QuestionType.TRUE_FALSE && (
                        <div className="space-y-2 pt-3 border-t border-[var(--border-primary)]">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Kunci Jawaban Benar / Salah
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer text-xs font-semibold hover:border-emerald-500 transition-colors">
                                    <input
                                        type="radio"
                                        name="tf-key"
                                        value="true"
                                        checked={formAnswerKey === 'true'}
                                        onChange={() => setFormAnswerKey('true')}
                                        className="text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                    />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">BENAR (True)</span>
                                </label>

                                <label className="inline-flex items-center gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer text-xs font-semibold hover:border-rose-500 transition-colors">
                                    <input
                                        type="radio"
                                        name="tf-key"
                                        value="false"
                                        checked={formAnswerKey === 'false'}
                                        onChange={() => setFormAnswerKey('false')}
                                        className="text-[var(--bg-accent)] focus:ring-[var(--bg-accent)]"
                                    />
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">SALAH (False)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 4. Essay / Short Answer Key */}
                    {(formType === QuestionType.ESSAY || formType === QuestionType.SHORT_ANSWER) && (
                        <div className="space-y-2 pt-3 border-t border-[var(--border-primary)]">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Pedoman Penskoran / Kunci Jawaban Singkat
                            </label>
                            <BankRichTextEditor 
                                value={String(formAnswerKey || '')} 
                                onChange={setFormAnswerKey} 
                                placeholder="Tuliskan kunci jawaban atau rubrik kriteria penskoran..." 
                            />
                        </div>
                    )}

                    {/* 5. Matching Pairs */}
                    {formType === QuestionType.MATCHING && (
                        <div className="space-y-3 pt-3 border-t border-[var(--border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                                        Pasangan Menjodohkan (Premis Kolom A ➔ Jawaban Kolom B)
                                    </label>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Tuliskan butir premis dan jawaban pasangannya.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newPId = crypto.randomUUID();
                                        const newAId = crypto.randomUUID();
                                        setFormMatchingPrompts(prev => [...prev, { id: newPId, text: '' }]);
                                        setFormMatchingAnswers(prev => [...prev, { id: newAId, text: '' }]);
                                        setFormMatchingKey(prev => [...prev, { promptId: newPId, answerId: newAId }]);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-bold border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
                                >
                                    <PlusIcon className="text-[10px]" />
                                    <span>Tambah Pasangan</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formMatchingPrompts.map((prompt, idx) => {
                                    const answer = formMatchingAnswers[idx] || { id: crypto.randomUUID(), text: '' };
                                    return (
                                        <div key={prompt.id} className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                                                    Pernyataan {idx + 1} (Kolom A):
                                                </span>
                                                <BankRichTextEditor 
                                                    isOption={true}
                                                    value={prompt.text}
                                                    onChange={val => {
                                                        setFormMatchingPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, text: val } : p));
                                                    }}
                                                    placeholder={`Pernyataan / Premis ${idx + 1}...`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                                        ➔ Pasangan Jawaban {String.fromCharCode(65 + idx)} (Kolom B):
                                                    </span>
                                                    {formMatchingPrompts.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormMatchingPrompts(prev => prev.filter(p => p.id !== prompt.id));
                                                                setFormMatchingAnswers(prev => prev.filter((_, i) => i !== idx));
                                                                setFormMatchingKey(prev => prev.filter(k => k.promptId !== prompt.id));
                                                            }}
                                                            className="text-rose-500 hover:text-rose-700 text-xs"
                                                            title="Hapus Pasangan Ini"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                                <BankRichTextEditor 
                                                    isOption={true}
                                                    value={answer.text}
                                                    onChange={val => {
                                                        setFormMatchingAnswers(prev => prev.map((a, i) => i === idx ? { ...a, text: val } : a));
                                                    }}
                                                    placeholder={`Pasangan Jawaban ${String.fromCharCode(65 + idx)}...`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Form Action Buttons */}
                    <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-end gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setActiveTab('list');
                            }}
                            className="px-4 py-2.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold transition-colors min-h-[40px]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingForm}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-bold shadow-xs transition-all disabled:opacity-60 min-h-[40px]"
                        >
                            {isSavingForm ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan ke Bank...</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="text-xs" />
                                    <span>{editingBankQuestion ? 'Perbarui Soal di Bank' : 'Simpan ke Bank Soal'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Modal Mode Action Footer */}
            {isModalMode && activeTab === 'list' && (
                <div className="pt-3 border-t border-[var(--border-primary)] flex justify-between items-center gap-3">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                        {selectedQuestionIds.size} butir soal dipilih
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClose} 
                            className="px-3.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold"
                        >
                            Tutup
                        </button>
                        <button 
                            onClick={handleAddSelected} 
                            disabled={selectedQuestionIds.size === 0} 
                            className="px-4 py-1.5 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                        >
                            <PlusIcon className="text-xs" />
                            <span>Masukkan ({selectedQuestionIds.size}) ke Naskah</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBankView;
