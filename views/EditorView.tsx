import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Question, Settings, Section, TableData, TableRowData, TableCellData } from '../types';
import { QuestionType } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { getExam, saveExam, getSettings, saveQuestionToBank } from '../lib/storage';
import { sanitizeRichHtml, toRoman } from '../lib/utils';
import { generateHtmlContent } from '../lib/htmlGenerator';
import QuestionBankView from './QuestionBankView';
import AiGeneratorModal from '../components/AiGeneratorModal';
import SmartImportModal from '../components/SmartImportModal';
import MathModal from '../components/MathModal';
import AiImagePromptModal from '../components/AiImagePromptModal';
import { useHistoryState } from '../hooks/useHistoryState';
import { getTranslations, translations, type Translations } from '../lib/translations';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { validateExam } from '../lib/examValidator';
import ExamValidationModal from '../components/ExamValidationModal';
import { 
    PlusIcon, TrashIcon, PrinterIcon, EditIcon, ChevronLeftIcon, SaveIcon, CheckIcon, BookmarkPlusIcon, CloseIcon,
    ZoomInIcon, ZoomOutIcon, BankIcon, UndoIcon, RedoIcon, CardTextIcon, LayoutSplitIcon, StarsIcon,
    CardTextIcon as StimulusIcon, LightningIcon, ShieldCheckIcon, EyeIcon
} from '../components/Icons';

// --- Start Custom Quill Icons ---
const MATH_SVG_ICON = `<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="1.8" d="M2.5 10.5h2l2.5 5 3.5-12h5.5"/><path stroke-width="1.6" d="M12.5 8l3 3m0-3l-3 3"/></svg>`;

const AI_IMAGE_SVG_ICON = `<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor"><rect x="2" y="4.5" width="10" height="9.5" rx="1.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11.5l3-3 2.5 2.5 2-2 2.5 2.5" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="7.5" r="1" fill="currentColor" stroke="none"/><path d="M14.5 1.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z" fill="currentColor" stroke="none"/><path d="M16 8l.3.9.9.3-.9.3-.3.9-.3-.9-.9-.3.9-.3.3-.9z" fill="currentColor" stroke="none"/></svg>`;

const icons = Quill.import('ui/icons') as any;
if (icons) {
    icons['math'] = MATH_SVG_ICON;
    icons['aiImage'] = AI_IMAGE_SVG_ICON;
}
// --- End Custom Quill Icons ---

// --- Start Image Compression Utility ---
const compressImage = (base64Str: string, maxWidth = 1280, maxHeight = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.crossOrigin = "Anonymous"; // Try to handle CORS if external url
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
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            try {
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            } catch (e) {
                // If canvas tainted (CORS), resolve original or empty
                console.warn("Canvas tainted, using original source if valid base64");
                resolve(base64Str);
            }
        };
        img.onerror = (error) => {
            console.error("Image loading error for compression:", error);
            // If it fails (e.g. Pollinations URL loading), just return the original URL string
            // Quill can handle URLs.
            resolve(base64Str); 
        };
    });
};
// --- End Image Compression Utility ---

// --- Start Editor Components ---
const RichTextEditor: React.FC<{ 
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

    // Handler for "AI Image" button
    const aiImageHandler = useCallback(() => {
        setIsAiImageModalOpen(true);
    }, []);

    const handleAiImageInsert = useCallback((prompt: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            addToast('Membuat gambar dengan AI...', 'info');
            
            // Construct Pollinations URL
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
            
            // For better compatibility (offline saving), try to fetch and convert to base64
            // Note: Pollinations allows CORS, so we can fetch
            fetch(imageUrl)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        editor.insertEmbed(range.index, 'image', base64data);
                        addToast('Gambar berhasil dibuat!', 'success');
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(err => {
                    console.error("Failed to fetch Pollinations image for base64 conversion", err);
                    // Fallback: Just insert the URL
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
            if (input.files) {
                const file = input.files[0];
                if (file.size > 2 * 1024 * 1024) {
                    addToast('Ukuran gambar asli tidak boleh melebihi 2MB.', 'error');
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
                        } catch (error) {
                            console.error("Image compression failed:", error);
                            addToast('Gagal mengompres gambar. Gambar asli disisipkan.', 'error');
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
        const optionToolbar = [['bold', 'italic', 'underline'], [{ 'script': 'sub'}, { 'script': 'super' }], [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }], ['math'], ['clean']];
        const toolbarContainer = isOption ? optionToolbar : mainToolbar;
        return { 
            toolbar: { 
                container: toolbarContainer, 
                handlers: { 
                    image: imageHandler,
                    math: mathHandler,
                    aiImage: aiImageHandler // Register handler
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
        root.setAttribute('dir', direction);
        root.style.direction = direction;
        root.style.textAlign = direction === 'rtl' ? 'right' : 'left';

        // Add tooltips and inject SVGs into toolbar buttons
        const toolbar = editor.getModule('toolbar') as any;
        if (toolbar?.container) {
            const mathBtn = toolbar.container.querySelector('.ql-math') as HTMLElement | null;
            if (mathBtn) {
                mathBtn.setAttribute('title', direction === 'rtl' ? 'إدراج معادلة رياضية (LaTeX / KaTeX)' : 'Sisipkan Rumus Matematika (LaTeX / KaTeX)');
                mathBtn.setAttribute('aria-label', 'KaTeX Math Formula');
                if (!mathBtn.querySelector('svg')) {
                    mathBtn.innerHTML = MATH_SVG_ICON;
                }
            }
            const aiImgBtn = toolbar.container.querySelector('.ql-aiImage') as HTMLElement | null;
            if (aiImgBtn) {
                aiImgBtn.setAttribute('title', direction === 'rtl' ? 'إنشاء صورة بالذكاء الاصطناعي' : 'Generate Gambar dengan AI (Gemini)');
                aiImgBtn.setAttribute('aria-label', 'AI Image Generator');
                if (!aiImgBtn.querySelector('svg')) {
                    aiImgBtn.innerHTML = AI_IMAGE_SVG_ICON;
                }
            }
            const imgBtn = toolbar.container.querySelector('.ql-image') as HTMLElement | null;
            if (imgBtn) {
                imgBtn.setAttribute('title', direction === 'rtl' ? 'إدراج صورة' : 'Sisipkan Gambar');
            }
        }
    }, [direction, isOption]);
    
    return (
        <>
            <div
                className={`so-genius-quill-wrapper ${isOption ? 'so-genius-quill-option-wrapper' : ''} ${direction === 'rtl' ? 'so-genius-quill-rtl' : 'so-genius-quill-ltr'}`}
                dir={direction}
            >
                <ReactQuillComponent
                    ref={quillRef}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    theme="snow"
                    modules={modules}
                />
            </div>
            <MathModal
                isOpen={isMathModalOpen}
                onClose={() => setIsMathModalOpen(false)}
                onInsert={handleMathInsert}
                direction={direction}
            />
            <AiImagePromptModal
                isOpen={isAiImageModalOpen}
                onClose={() => setIsAiImageModalOpen(false)}
                onSubmit={handleAiImageInsert}
                direction={direction}
            />
        </>
    );
};

const TableBuilder: React.FC<{
    tableData: TableData;
    onTableChange: (newTableData: TableData) => void;
    T: typeof translations.ltr;
}> = ({ tableData, onTableChange, T }) => {
    // ... logic same as previous ...
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

    const handleCellChange = (rowIndex: number, cellIndex: number, newContent: string) => {
        const newRows = [...tableData.rows];
        newRows[rowIndex].cells[cellIndex].content = newContent;
        onTableChange({ ...tableData, rows: newRows });
    };

    const addRow = () => {
        const colCount = tableData.rows[0]?.cells.length || 1;
        const newRow: TableRowData = { id: crypto.randomUUID(), cells: Array.from({ length: colCount }, () => ({ id: crypto.randomUUID(), content: '' })) };
        const newRowHeights = [...(tableData.rowHeights || []), null];
        onTableChange({ ...tableData, rows: [...tableData.rows, newRow], rowHeights: newRowHeights });
    };

    const removeRow = () => {
        if (tableData.rows.length <= 1) return;
        const newRows = tableData.rows.slice(0, -1);
        const newRowHeights = (tableData.rowHeights || []).slice(0, -1);
        onTableChange({ ...tableData, rows: newRows, rowHeights: newRowHeights });
        setSelectedCells(new Set());
    };

    const addColumn = () => {
        const newRows = tableData.rows.map(row => ({ ...row, cells: [...row.cells, { id: crypto.randomUUID(), content: '' }] }));
        const newColumnWidths = [...(tableData.columnWidths || []), null];
        onTableChange({ ...tableData, rows: newRows, columnWidths: newColumnWidths });
    };

    const removeColumn = () => {
        const colCount = tableData.rows[0]?.cells.length || 0;
        if (colCount <= 1) return;
        const newRows = tableData.rows.map(row => ({ ...row, cells: row.cells.slice(0, -1) }));
        const newColumnWidths = (tableData.columnWidths || []).slice(0, -1);
        onTableChange({ ...tableData, rows: newRows, columnWidths: newColumnWidths });
        setSelectedCells(new Set());
    };

    const handleRowHeightChange = (rowIndex: number, value: string) => {
        const newHeights = [...(tableData.rowHeights || Array(tableData.rows.length).fill(null))];
        const numValue = parseInt(value, 10);
        newHeights[rowIndex] = !isNaN(numValue) && numValue > 0 ? numValue : null;
        onTableChange({ ...tableData, rowHeights: newHeights });
    };

    const handleColumnWidthChange = (colIndex: number, value: string) => {
        const colCount = tableData.rows[0]?.cells.length || 0;
        const newWidths = [...(tableData.columnWidths || Array(colCount).fill(null))];
        const numValue = parseInt(value, 10);
        newWidths[colIndex] = !isNaN(numValue) && numValue > 0 ? numValue : null;
        onTableChange({ ...tableData, columnWidths: newWidths });
    };

    const handleVerticalAlignChange = (rowIndex: number, cellIndex: number, align: 'top' | 'middle' | 'bottom') => {
        const newRows = [...tableData.rows];
        const currentCell = newRows[rowIndex].cells[cellIndex];
        currentCell.verticalAlign = currentCell.verticalAlign === align ? undefined : align;
        onTableChange({ ...tableData, rows: newRows });
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
            return { canMerge: false, canSplit: isSplittable };
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
    
    const colCount = tableData.rows[0]?.cells.length || 0;

    return (
        <div className="mt-4 border border-[var(--border-primary)] rounded-lg p-3 bg-[var(--bg-tertiary)]">
            <h4 className="font-semibold text-[var(--text-secondary)] text-sm mb-2">{T.tableEditorTitle}</h4>
            <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-[var(--border-primary)]">
                <button onClick={addRow} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] flex-shrink-0">{T.addRow}</button>
                <button onClick={removeRow} disabled={isRemoveRowDisabled} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" title={isRemoveRowDisabled ? T.cannotDeleteRowWarning : ""}>{T.removeRow}</button>
                <button onClick={addColumn} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] flex-shrink-0">{T.addCol}</button>
                <button onClick={removeColumn} disabled={isRemoveColDisabled} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" title={isRemoveColDisabled ? T.cannotDeleteColWarning : ""}>{T.removeCol}</button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
                 <button onClick={handleMerge} disabled={!canMerge} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">{T.mergeCells}</button>
                 <button onClick={handleSplit} disabled={!canSplit} className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md px-3 py-1 hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">{T.splitCell}</button>
                 <span className="text-xs text-[var(--text-muted)] italic">{T.selectionPrompt}</span>
            </div>

            <div className="border-t border-[var(--border-primary)] pt-3 mt-3">
                 <h5 className="font-semibold text-[var(--text-secondary)] text-sm mb-2">{T.tableDisplaySettings}</h5>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{T.columnWidthsLabel}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Array.from({ length: colCount }).map((_, colIndex) => (
                                <div key={`col-width-${colIndex}`} className="relative">
                                    <input type="number" value={tableData.columnWidths?.[colIndex] || ''} onChange={(e) => handleColumnWidthChange(colIndex, e.target.value)} placeholder={`${T.autoPlaceholder} (K${colIndex + 1})`} className="w-full p-1 border border-[var(--border-secondary)] rounded-md text-sm bg-[var(--bg-secondary)]" min="10" />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{T.rowHeightsLabel}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                             {tableData.rows.map((row, rowIndex) => (
                                <div key={`row-height-${row.id}`} className="relative">
                                    <input type="number" value={tableData.rowHeights?.[rowIndex] || ''} onChange={(e) => handleRowHeightChange(rowIndex, e.target.value)} placeholder={`${T.autoPlaceholder} (B${rowIndex + 1})`} className="w-full p-1 border border-[var(--border-secondary)] rounded-md text-sm bg-[var(--bg-secondary)]" min="10" />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{T.verticalAlignLabel}</label>
                        <div className="p-2 bg-[var(--bg-muted)] rounded-md space-y-1">
                            {tableData.rows.map((row, rowIndex) => (
                                <div key={row.id} className="flex items-center gap-1">
                                    {row.cells.map((cell, cellIndex) => cell.isMerged ? <div key={cell.id} className="flex-1"></div> : (
                                        <div key={cell.id} className="flex-1 flex justify-center items-center bg-[var(--bg-secondary)] p-0.5 rounded-md space-x-0.5">
                                            <button onClick={() => handleVerticalAlignChange(rowIndex, cellIndex, 'top')} title={T.alignTop} className={`p-1 rounded ${cell.verticalAlign === 'top' ? 'bg-blue-500 text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}><i className="bi bi-align-top"></i></button>
                                            <button onClick={() => handleVerticalAlignChange(rowIndex, cellIndex, 'middle')} title={T.alignMiddle} className={`p-1 rounded ${cell.verticalAlign === 'middle' ? 'bg-blue-500 text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}><i className="bi bi-align-middle"></i></button>
                                            <button onClick={() => handleVerticalAlignChange(rowIndex, cellIndex, 'bottom')} title={T.alignBottom} className={`p-1 rounded ${cell.verticalAlign === 'bottom' ? 'bg-blue-500 text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}><i className="bi bi-align-bottom"></i></button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            </div>

            <div className="overflow-x-auto mt-4">
                <table className="min-w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        {tableData.columnWidths?.map((width, index) => <col key={index} style={{ width: width ? `${width}px` : undefined }} />)}
                    </colgroup>
                    <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                            <tr key={row.id} style={{ height: tableData.rowHeights?.[rowIndex] ? `${tableData.rowHeights[rowIndex]}px` : undefined }}>
                                {row.cells.map((cell, cellIndex) => !cell.isMerged && (
                                    <td key={cell.id} className={`border border-[var(--border-primary)] p-0 relative ${selectedCells.has(cell.id) ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`} style={{ verticalAlign: cell.verticalAlign || 'top' }} colSpan={cell.colspan} rowSpan={cell.rowspan}>
                                        <div className={`relative cursor-pointer ${selectedCells.has(cell.id) ? 'outline outline-2 outline-blue-500' : ''}`} onClick={() => handleCellSelection(cell.id)} role="button" aria-pressed={selectedCells.has(cell.id)} aria-label={T.tableSelectCellAria.replace('{row}', String(rowIndex + 1)).replace('{col}', String(cellIndex + 1))}>
                                            <RichTextEditor isOption={true} value={cell.content} onChange={(newContent) => handleCellChange(rowIndex, cellIndex, newContent)} placeholder={`B${rowIndex+1}, K${cellIndex+1}`} />
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

const QuestionEditor: React.FC<{
    sectionId: string;
    question: Question;
    T: typeof translations.ltr;
    onQuestionUpdate: (sectionId: string, questionId: string, field: keyof Question, value: any) => void;
    onQuestionDelete: (sectionId: string, questionId: string) => void;
    onSaveToBank: (question: Question) => void;
}> = ({ sectionId, question, T, onQuestionUpdate, onQuestionDelete, onSaveToBank }) => {
    
    const updateField = (field: keyof Question, value: any) => onQuestionUpdate(sectionId, question.id, field, value);
    const choiceCount = question.choices?.length || 0;
    const matchingCount = question.matchingPrompts?.length || 0;

    const updateMatchingList = (listType: 'matchingPrompts' | 'matchingAnswers', itemId: string, newText: string) => {
        const oldList = question[listType] || [];
        const newList = oldList.map(item => item.id === itemId ? {...item, text: newText} : item);
        updateField(listType, newList);
    };
    
    const addMatchingItem = (listType: 'matchingPrompts' | 'matchingAnswers') => {
        const oldList = question[listType] || [];
        const newList = [...oldList, {id: crypto.randomUUID(), text: ''}];
        updateField(listType, newList);
    };

    const deleteMatchingItem = (listType: 'matchingPrompts' | 'matchingAnswers', itemId: string) => {
        const oldList = question[listType] || [];
        const newList = oldList.filter(item => item.id !== itemId);
        updateField(listType, newList);
        if (listType === 'matchingPrompts') {
            const newKey = (question.matchingKey || []).filter(key => key.promptId !== itemId);
            updateField('matchingKey', newKey);
        } else if (listType === 'matchingAnswers') {
            const newKey = (question.matchingKey || []).filter(key => key.answerId !== itemId);
            updateField('matchingKey', newKey);
        }
    };
    
    const handleMatchingKeyChange = (promptId: string, newAnswerId: string) => {
        const oldKey = question.matchingKey || [];
        const existingIndex = oldKey.findIndex(k => k.promptId === promptId);
        let newKey;
        if (existingIndex > -1) {
            newKey = [...oldKey];
            newAnswerId === "" ? newKey.splice(existingIndex, 1) : newKey[existingIndex] = { promptId, answerId: newAnswerId };
        } else if (newAnswerId !== "") {
            newKey = [...oldKey, { promptId, answerId: newAnswerId }];
        } else {
            newKey = oldKey;
        }
        updateField('matchingKey', newKey);
    };

    const handleChoiceChange = (choiceId: string, newText: string) => {
        const newChoices = (question.choices || []).map(c => c.id === choiceId ? { ...c, text: newText } : c);
        updateField('choices', newChoices);
    };

    const addChoice = () => {
        const newChoices = [...(question.choices || []), { id: crypto.randomUUID(), text: '' }];
        updateField('choices', newChoices);
    };

    const deleteChoice = (choiceId: string) => {
        const newChoices = (question.choices || []).filter(c => c.id !== choiceId);
        updateField('choices', newChoices);
    };

    const handleAnswerKeyChange = (value: any) => updateField('answerKey', value);

    const renderAnswerKeyInput = () => {
        switch (question.type) {
            case QuestionType.MULTIPLE_CHOICE:
                return (question.choices || []).map(choice => (
                     <label key={choice.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-[var(--bg-hover)]">
                        <input type="radio" name={`answer-${question.id}`} value={choice.id} checked={question.answerKey === choice.id} onChange={(e) => handleAnswerKeyChange(e.target.value)} className="form-radio text-blue-600 bg-transparent border-[var(--border-secondary)] focus:ring-blue-500" />
                         <div className="text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(choice.text || `<span class="italic text-[var(--text-muted)]">${T.emptyOptionPlaceholder.replace('{letter}', String.fromCharCode(65 + (question.choices || []).indexOf(choice)))}</span>`) }}></div>
                     </label>
                ));
            case QuestionType.COMPLEX_MULTIPLE_CHOICE:
                 return (question.choices || []).map(choice => (
                     <label key={choice.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-[var(--bg-hover)]">
                        <input type="checkbox" value={choice.id} checked={(question.answerKey as string[] || []).includes(choice.id)} onChange={(e) => { const currentAnswers = (question.answerKey as string[] || []); const newAnswers = e.target.checked ? [...currentAnswers, choice.id] : currentAnswers.filter(id => id !== choice.id); handleAnswerKeyChange(newAnswers); }} className="form-checkbox text-blue-600 bg-transparent border-[var(--border-secondary)] rounded focus:ring-blue-500" />
                        <div className="text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(choice.text || `<span class="italic text-[var(--text-muted)]">${T.emptyOptionPlaceholder.replace('{letter}', String.fromCharCode(65 + (question.choices || []).indexOf(choice)))}</span>`) }}></div>
                     </label>
                ));
            case QuestionType.TRUE_FALSE:
                return (<div className="flex space-x-4"><label className="flex items-center space-x-2"><input type="radio" value="true" checked={question.answerKey === 'true'} onChange={e => handleAnswerKeyChange(e.target.value)} className="form-radio text-blue-600 bg-transparent border-[var(--border-secondary)]" /><span>{T.trueLabel}</span></label><label className="flex items-center space-x-2"><input type="radio" value="false" checked={question.answerKey === 'false'} onChange={e => handleAnswerKeyChange(e.target.value)} className="form-radio text-blue-600 bg-transparent border-[var(--border-secondary)]" /><span>{T.falseLabel}</span></label></div>);
            case QuestionType.MATCHING:
                return (question.matchingPrompts || []).map((prompt, index) => (
                    <div key={prompt.id} className="flex items-center space-x-3">
                        <span className="font-semibold w-24 truncate">({index + 1})</span>
                        <i className="bi bi-arrow-right"></i>
                        <select value={(question.matchingKey || []).find(k => k.promptId === prompt.id)?.answerId || ''} onChange={e => handleMatchingKeyChange(prompt.id, e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]">
                            <option value="">{T.selectAnswerPlaceholder}</option>
                            {(question.matchingAnswers || []).map((answer, answerIndex) => <option key={answer.id} value={answer.id}>({String.fromCharCode(65 + answerIndex)})</option>)}
                        </select>
                    </div>
                ));
            case QuestionType.TABLE:
                 return (
                    <div className="space-y-2">
                        {(question.tableData?.rows || []).flat().flatMap(row => row.cells).filter(cell => !cell.isMerged).map((cell, index) => (
                            <div key={cell.id} className="flex items-center gap-2">
                                <label className="flex-shrink-0 text-sm text-[var(--text-muted)] w-28 truncate" title={cell.content || `Sel ${index + 1}`}>{T.tableCellContentLabel.replace('{index}', String(index + 1))}</label>
                                <input type="text" value={(question.tableAnswerKey || {})[cell.id] || ''} onChange={(e) => { const newKey = { ...(question.tableAnswerKey || {}), [cell.id]: e.target.value }; updateField('tableAnswerKey', newKey); }} className="p-1 border border-[var(--border-secondary)] rounded-md w-full text-sm bg-[var(--bg-secondary)]" />
                            </div>
                        ))}
                    </div>
                );
            case QuestionType.TABLE_MULTIPLE_CHOICE:
                return (question.tableData?.rows || []).map((row, rowIndex) => (
                    <div key={row.id} className="p-2 rounded-md hover:bg-[var(--bg-hover)] border-b border-[var(--border-primary)] last:border-b-0">
                        <div className="font-semibold mb-2">Baris {rowIndex + 1}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {(question.choices || []).map((choice, choiceIndex) => (
                                <label key={choice.id} className="flex items-center space-x-2">
                                    <input type="radio" name={`answer-${question.id}-${row.id}`} value={choice.id} checked={(question.tableChoiceAnswerKey || {})[row.id] === choice.id} onChange={(e) => { const newKey = { ...(question.tableChoiceAnswerKey || {}), [row.id]: e.target.value }; updateField('tableChoiceAnswerKey', newKey); }} className="form-radio text-blue-600 bg-transparent border-[var(--border-secondary)]" />
                                    <div className="text-[var(--text-primary)] text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(choice.text || `Opsi ${String.fromCharCode(65 + choiceIndex)}`)}}></div>
                                </label>
                            ))}
                        </div>
                    </div>
                ));
            case QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE:
                 return (question.tableData?.rows || []).map((row, rowIndex) => (
                    <div key={row.id} className="p-2 rounded-md hover:bg-[var(--bg-hover)] border-b border-[var(--border-primary)] last:border-b-0">
                        <div className="font-semibold mb-2">Baris {rowIndex + 1}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {(question.choices || []).map((choice, choiceIndex) => (
                                <label key={choice.id} className="flex items-center space-x-2">
                                    <input type="checkbox" value={choice.id} checked={((question.tableChoiceAnswerKey || {})[row.id] as string[] || []).includes(choice.id)} onChange={(e) => { const currentAnswers = ((question.tableChoiceAnswerKey || {})[row.id] as string[] || []); const newAnswers = e.target.checked ? [...currentAnswers, choice.id] : currentAnswers.filter(id => id !== choice.id); const newKey = { ...(question.tableChoiceAnswerKey || {}), [row.id]: newAnswers }; updateField('tableChoiceAnswerKey', newKey); }} className="form-checkbox text-blue-600 bg-transparent border-[var(--border-secondary)] rounded" />
                                     <div className="text-[var(--text-primary)] text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(choice.text || `Opsi ${String.fromCharCode(65 + choiceIndex)}`)}}></div>
                                </label>
                            ))}
                        </div>
                    </div>
                ));
            case QuestionType.SHORT_ANSWER:
            case QuestionType.ESSAY:
                return <input type="text" value={question.answerKey as string || ''} onChange={e => handleAnswerKeyChange(e.target.value)} placeholder={T.answerKeyPlaceholder} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" />;
            default: return null;
        }
    }
    
    // Determine card background color: lighter for stimulus to differentiate
    const cardBgClass = question.type === QuestionType.STIMULUS 
        ? "bg-blue-50/80 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
        : "bg-[var(--bg-secondary)] border-[var(--border-primary)]";

    return (
        <div id={`question-${question.id}`} className={`${cardBgClass} rounded-[22px] border shadow-[var(--shadow-soft)] overflow-hidden transition-all duration-300`}>
            <div className="border-b border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-tertiary)_72%,transparent)] px-4 py-3 sm:px-5">
            <div className="flex justify-between items-start gap-3">
                 <div className="min-w-0 flex items-center">
                    {/* Hide number input for STIMULUS type */}
                    {question.type !== QuestionType.STIMULUS && (
                        <input 
                            type="text" 
                            value={question.number} 
                            onChange={(e) => updateField('number', e.target.value)}
                            className="me-3 h-9 w-12 rounded-full border border-slate-600 bg-slate-700 text-center font-bold text-white outline-none transition-colors focus:ring-2 focus:ring-blue-500" 
                            aria-label={T.questionNumberAria.replace('{number}', question.number)} 
                            title="Nomor soal"
                        />
                    )}
                    <div className="min-w-0">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${question.type === QuestionType.STIMULUS ? 'border-blue-200 bg-blue-100/80 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                            {question.type === QuestionType.STIMULUS ? <StimulusIcon/> : null}
                            {T.questionTypes[question.type]}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                            {choiceCount > 0 && <span>{choiceCount} opsi</span>}
                            {matchingCount > 0 && <span>{matchingCount} pasangan</span>}
                            {(question.type === QuestionType.TABLE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && <span>Mode tabel</span>}
                        </div>
                    </div>
                </div>
                 <div className="flex items-center space-x-1">
                    {question.type !== QuestionType.STIMULUS && (
                        <button onClick={() => onSaveToBank(question)} title={T.saveToBank} aria-label={T.saveToBank} className="rounded-full p-2 text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-300"><BookmarkPlusIcon className="text-xl" /></button>
                    )}
                    <button onClick={() => onQuestionDelete(sectionId, question.id)} title={T.deleteQuestion} aria-label={T.deleteQuestion} className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"><TrashIcon className="text-xl" /></button>
                </div>
            </div>
            </div>
            <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <RichTextEditor 
                value={question.text} 
                onChange={(newText) => updateField('text', newText)} 
                placeholder={question.type === QuestionType.STIMULUS ? T.stimulusTextPlaceholder : T.questionPlaceholder} 
                direction={T === translations.rtl ? 'rtl' : 'ltr'}
            />
            
            {/* Options Render Block */}
            {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && (
                <div className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Opsi Jawaban</h4>
                    <span className="text-xs text-[var(--text-muted)]">{choiceCount} opsi</span>
                </div>
                <div className="space-y-3 ps-3 border-s-2 border-[var(--border-primary)]">
                    {(question.choices || []).map((choice, choiceIndex) => (
                        <div key={choice.id} className="flex items-start space-x-2">
                            <span className="font-mono mt-2">{String.fromCharCode(97 + choiceIndex)}.</span>
                             <div className="flex-grow min-w-0"><RichTextEditor isOption={true} value={choice.text} onChange={(newText) => handleChoiceChange(choice.id, newText)} placeholder={`${T.optionPlaceholder} ${String.fromCharCode(65 + choiceIndex)}`} direction={T === translations.rtl ? 'rtl' : 'ltr'} /></div>
                            <button onClick={() => deleteChoice(choice.id)} aria-label={T.deleteOptionAria.replace('{letter}', String.fromCharCode(65 + choiceIndex))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.choices || []).length <= 1}><TrashIcon className="text-base" /></button>
                        </div>
                    ))}
                    <button onClick={addChoice} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon className="text-base" /> <span>{T.addOption}</span></button>
                    {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) && (
                        <div className="pt-2"><label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={!!question.isTwoColumns} onChange={e => updateField('isTwoColumns', e.target.checked)} className="form-checkbox rounded text-blue-600 bg-transparent border-[var(--border-secondary)] focus:ring-blue-500" /><span>{T.twoColumnLayout}</span></label></div>
                    )}
                </div>
                </div>
            )}
            {question.type === QuestionType.ESSAY && (<div className="mt-3"><label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={!!question.hasAnswerSpace} onChange={e => updateField('hasAnswerSpace', e.target.checked)} className="form-checkbox text-blue-600 bg-transparent border-[var(--border-secondary)]" /><span>{T.provideAnswerSpace}</span></label></div>)}
            {question.type === QuestionType.MATCHING && (
                <div className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Pasangan Jawaban</h4>
                    <span className="text-xs text-[var(--text-muted)]">{matchingCount} pernyataan</span>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-2">
                        <h4 className="font-semibold text-[var(--text-secondary)]">{T.matchingColumnA}</h4>
                        {(question.matchingPrompts || []).map((prompt, index) => (<div key={prompt.id} className="flex items-start space-x-2"><span className="font-mono mt-2">{index + 1}.</span><div className="w-full min-w-0"><RichTextEditor isOption={true} value={prompt.text} onChange={newText => updateMatchingList('matchingPrompts', prompt.id, newText)} placeholder={T.statementPlaceholder} direction={T === translations.rtl ? 'rtl' : 'ltr'} /></div><button onClick={() => deleteMatchingItem('matchingPrompts', prompt.id)} aria-label={T.deleteMatchingPromptAria.replace('{index}', String(index + 1))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.matchingPrompts || []).length <= 1}><TrashIcon /></button></div>))}
                        <button onClick={() => addMatchingItem('matchingPrompts')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon /><span>{T.addStatement}</span></button>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                        <h4 className="font-semibold text-[var(--text-secondary)]">{T.matchingColumnB}</h4>
                        {(question.matchingAnswers || []).map((answer, index) => (<div key={answer.id} className="flex items-start space-x-2"><span className="font-mono mt-2">{String.fromCharCode(65 + index)}.</span><div className="w-full min-w-0"><RichTextEditor isOption={true} value={answer.text} onChange={newText => updateMatchingList('matchingAnswers', answer.id, newText)} placeholder={T.answerPlaceholder} direction={T === translations.rtl ? 'rtl' : 'ltr'} /></div><button onClick={() => deleteMatchingItem('matchingAnswers', answer.id)} aria-label={T.deleteMatchingAnswerAria.replace('{letter}', String.fromCharCode(65 + index))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.matchingAnswers || []).length <= 1}><TrashIcon /></button></div>))}
                         <button onClick={() => addMatchingItem('matchingAnswers')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon /><span>{T.addAnswer}</span></button>
                    </div>
                </div>
                </div>
            )}
            {(question.type === QuestionType.TABLE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && question.tableData && (<TableBuilder tableData={question.tableData} onTableChange={(newTable) => updateField('tableData', newTable)} T={T} />)}
            
            {/* Answer Key Block: Hidden for Stimulus */}
            {question.type !== QuestionType.STIMULUS && (
                <div className="rounded-[18px] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 sm:p-4">
                    <h4 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">{T.answerKeyTitle}</h4>
                    <div className="space-y-2">{renderAnswerKeyInput()}</div>
                </div>
            )}
            </div>
        </div>
    );
};

const SectionEditor: React.FC<{
    section: Section;
    T: typeof translations.ltr;
    onSectionUpdate: (sectionId: string, field: keyof Section, value: any) => void;
    onSectionDelete: (sectionId: string) => void;
    onQuestionAdd: (sectionId: string, type: QuestionType) => void;
    onQuestionUpdate: (sectionId: string, questionId: string, field: keyof Question, value: any) => void;
    onQuestionDelete: (sectionId: string, questionId: string) => void;
    onSaveToBank: (question: Question) => void;
    onAddQuestionsFromBank: (sectionId: string) => void;
    onOpenAiModal: (sectionId: string) => void;
    onOpenSmartImport: (sectionId: string) => void;
}> = ({ section, T, onSectionUpdate, onSectionDelete, onAddQuestionsFromBank, onOpenAiModal, onOpenSmartImport, ...questionCallbacks }) => {
    const [isAddQuestionOpen, setAddQuestionOpen] = useState(false);
    // Deprecated: old stimulus state removed
    const addQuestionRef = useRef<HTMLDivElement>(null);
    
    const addQuestionAndClose = (type: QuestionType) => {
        questionCallbacks.onQuestionAdd(section.id, type);
        setAddQuestionOpen(false);
    };

    const addFromBankAndClose = () => {
        onAddQuestionsFromBank(section.id);
        setAddQuestionOpen(false);
    };

    const openAiAndClose = () => {
        onOpenAiModal(section.id);
        setAddQuestionOpen(false);
    };

    const openSmartImportAndClose = () => {
        onOpenSmartImport(section.id);
        setAddQuestionOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addQuestionRef.current && !addQuestionRef.current.contains(event.target as Node)) {
                setAddQuestionOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [addQuestionRef]);
    
    const [title, instructionText] = useMemo(() => {
        const parts = section.instructions.split('.');
        return [parts[0]?.trim() || '', parts.slice(1).join('.').trim()];
    }, [section.instructions]);

    const handleInstructionChange = (newTitle: string, newInstruction: string) => {
        onSectionUpdate(section.id, 'instructions', `${newTitle}. ${newInstruction}`);
    };

    return (
        <div className="app-surface rounded-[28px] p-4 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="border-b border-[var(--border-primary)] pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 items-start gap-3">
                     <input type="text" value={title} onChange={(e) => handleInstructionChange(e.target.value, instructionText)} aria-label={T.sectionNumberAria} className="mt-0.5 w-16 rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-2 text-center text-base font-bold text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] focus:ring-2 focus:ring-[var(--border-focus)]" />
                     <div className="min-w-0 flex-1 space-y-3">
                        <input type="text" value={instructionText} onChange={(e) => handleInstructionChange(title, e.target.value)} placeholder={T.instructionPlaceholder} aria-label={T.sectionInstructionAria} className="w-full rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] px-3 py-2 text-base font-bold text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] focus:ring-2 focus:ring-[var(--border-focus)] sm:text-lg" />
                        <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
                            <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-[var(--text-secondary)]">{section.questions.length} soal di bagian ini</span>
                        </div>
                     </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onSectionDelete(section.id)} aria-label={T.deleteSectionAria} className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300 flex-shrink-0"><TrashIcon className="text-xl" /></button>
                </div>
                </div>
            </div>
            
            <div className="space-y-4 pt-4">
            {section.questions.map((q) => <QuestionEditor key={q.id} sectionId={section.id} question={q} T={T} {...questionCallbacks} />)}
            </div>

            <div className="pt-5">
            <div ref={addQuestionRef} className="relative inline-block text-center">
                 <button onClick={() => setAddQuestionOpen(p => !p)} aria-haspopup="true" aria-expanded={isAddQuestionOpen} className="flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2.5 font-semibold text-blue-800 transition-all duration-200 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"><PlusIcon /><span>{T.addQuestion}</span></button>
                {isAddQuestionOpen && (
                    <div className="absolute start-0 z-20 mt-2 w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-[20px] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-start shadow-lg">
                        <ul className="py-1">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); addFromBankAndClose(); }} className="flex items-center space-x-2 block px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:bg-[var(--bg-hover)]"><BankIcon /> <span>{T.getFromBank}</span></a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); openSmartImportAndClose(); }} className="flex items-center space-x-2 block px-4 py-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400 hover:bg-[var(--bg-hover)]"><LightningIcon /> <span>{T.smartImport}</span></a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); openAiAndClose(); }} className="flex items-center space-x-2 block px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-300 hover:bg-[var(--bg-hover)]"><StarsIcon /> <span>{T.createWithAi}</span></a></li>
                            <li className="border-t border-[var(--border-primary)] my-1"></li>
                            {Object.entries(T.questionTypes).map(([type, label]) => (<li key={type}><a href="#" onClick={(e) => { e.preventDefault(); addQuestionAndClose(type as QuestionType); }} className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">{label}</a></li>))}
                        </ul>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

const EditorView: React.FC<{ examId: string; onBack: () => void; onPreview?: () => void }> = ({ examId, onBack, onPreview }) => {
    const [exam, setExam, undo, redo, canUndo, canRedo] = useHistoryState<Exam | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [isBankModalOpen, setBankModalOpen] = useState(false);
    const [isSmartImportOpen, setSmartImportOpen] = useState(false);
    const [isValidationModalOpen, setValidationModalOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false); // State for auto-save indicator
    const [isFirstLoad, setIsFirstLoad] = useState(true); // Prevent auto-save on initial load
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false); // Status dropdown state
    const statusMenuRef = useRef<HTMLDivElement>(null);
    const [isExamInfoOpen, setExamInfoOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= 768;
    });

    const { addToast } = useToast();
    const { showConfirm } = useModal();

    const validation = useMemo(() => exam ? validateExam(exam) : null, [exam]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const loadedExam = await getExam(examId);
                const loadedSettings = await getSettings();
                if (loadedExam) {
                    setExam(loadedExam); // Initial state for history
                    setLastSaved(new Date());
                } else {
                    addToast("Ujian tidak ditemukan", "error");
                    onBack();
                }
                setSettings(loadedSettings);
            } catch (e) {
                console.error(e);
                addToast("Gagal memuat ujian", "error");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [examId, onBack, addToast, setExam]);

    // Handle click outside status menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setStatusMenuOpen(false);
            }
        };
        if (isStatusMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isStatusMenuOpen]);

    // Internal Save Function (Quiet, no toasts)
    const saveInternal = async (examToSave: Exam) => {
        try {
            await saveExam(examToSave);
            setLastSaved(new Date());
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    // Auto-Save Effect
    useEffect(() => {
        if (!exam) return;
        if (isFirstLoad) {
            setIsFirstLoad(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSaving(true);
            await saveInternal(exam);
            setIsSaving(false);
        }, 1500); // Debounce for 1.5 seconds

        return () => clearTimeout(timer);
    }, [exam]);

    const handleManualSave = async () => {
        if (!exam) return;
        setIsSaving(true);
        try {
            await saveInternal(exam);
            addToast("Ujian berhasil disimpan", "success");
        } catch (e) {
            addToast("Gagal menyimpan ujian", "error");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Fix: use exam.direction instead of settings.direction as direction is a property of Exam, not Settings.
    // Also using optional chaining for exam as it might be null during initial load, defaulting to LTR.
    const T = getTranslations(exam?.direction);

    const handleUpdateExam = (field: keyof Exam, value: any) => {
        setExam((prev) => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleAddSection = () => {
        setExam((prev) => {
            if (!prev) return null;
            const nextIndex = prev.sections.length + 1;
            const roman = toRoman(nextIndex);
            const newSection: Section = {
                id: crypto.randomUUID(),
                instructions: `${roman}. Instruksi bagian baru...`,
                questions: []
            };
            return { ...prev, sections: [...prev.sections, newSection] };
        });
    };

    const handleDeleteSection = (sectionId: string) => {
        showConfirm({
            title: "Hapus Bagian",
            content: "Apakah Anda yakin ingin menghapus bagian ini beserta seluruh soal di dalamnya?",
            confirmVariant: "danger",
            onConfirm: () => {
                 setExam((prev) => {
                    if (!prev) return null;
                    return { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) };
                });
            }
        });
    };

    const handleUpdateSection = (sectionId: string, field: keyof Section, value: any) => {
         setExam((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
            };
        });
    };

    const handleAddQuestion = (sectionId: string, type: QuestionType) => {
        setExam((prev) => {
            if (!prev) return null;
            
            // Calculate next sequential number
            let totalQuestions = 0;
            prev.sections.forEach(s => s.questions.forEach(q => { if(q.type !== QuestionType.STIMULUS) totalQuestions++; }));
            const nextNumber = String(totalQuestions + 1);

            const newQuestion: Question = {
                id: crypto.randomUUID(),
                number: type === QuestionType.STIMULUS ? '' : nextNumber,
                type,
                text: '',
                choices: (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.COMPLEX_MULTIPLE_CHOICE || type === QuestionType.TABLE_MULTIPLE_CHOICE || type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) 
                    ? [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
                    : undefined,
                tableData: (type === QuestionType.TABLE || type === QuestionType.TABLE_MULTIPLE_CHOICE || type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) 
                    ? { rows: [{ id: crypto.randomUUID(), cells: [{ id: crypto.randomUUID(), content: '' }, { id: crypto.randomUUID(), content: '' }] }] }
                    : undefined
            };
            
            return {
                ...prev,
                sections: prev.sections.map(s => {
                    if (s.id === sectionId) {
                        let newInstructions = s.instructions;
                        // Automatically update section instructions if it's the first question and instruction text is available
                        if (s.questions.length === 0 && T.instructionMap[type]) {
                             const parts = s.instructions.split('.');
                             // If we have a dot (e.g. "I."), keep the prefix
                             if (parts.length > 1) {
                                 const prefix = parts[0].trim();
                                 newInstructions = `${prefix}. ${T.instructionMap[type]}`;
                             } else {
                                 // Fallback: append if no clear prefix structure
                                 newInstructions = `${s.instructions}. ${T.instructionMap[type]}`;
                             }
                        }
                        
                        return { ...s, instructions: newInstructions, questions: [...s.questions, newQuestion] };
                    }
                    return s;
                })
            };
        });
    };

    const handleUpdateQuestion = (sectionId: string, questionId: string, field: keyof Question, value: any) => {
        setExam((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === sectionId ? {
                    ...s,
                    questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
                } : s)
            };
        });
    };

    const handleDeleteQuestion = (sectionId: string, questionId: string) => {
         setExam((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === sectionId ? {
                    ...s,
                    questions: s.questions.filter(q => q.id !== questionId)
                } : s)
            };
        });
    };

    const handleSaveToBank = async (question: Question) => {
        if (!exam) return;
        try {
            await saveQuestionToBank(question, { subject: exam.subject, class: exam.class });
            addToast("Soal berhasil disimpan ke Bank Soal", "success");
        } catch (e) {
            addToast("Gagal menyimpan ke Bank Soal", "error");
        }
    };

    const handleOpenBank = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setBankModalOpen(true);
    };

    const handleOpenAi = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setAiModalOpen(true);
    };

    const handleOpenSmartImport = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setSmartImportOpen(true);
    };

    const handleAddFromBank = (questions: Question[]) => {
        if (!activeSectionId) return;
        setExam((prev) => {
            if (!prev) return null;
            
            // Calculate starting number
            let totalQuestions = 0;
            prev.sections.forEach(s => s.questions.forEach(q => { if(q.type !== QuestionType.STIMULUS) totalQuestions++; }));
            
            const newQuestions = questions.map((q, idx) => ({
                ...q,
                id: crypto.randomUUID(),
                number: q.type === QuestionType.STIMULUS ? '' : String(totalQuestions + idx + 1)
            }));
            
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === activeSectionId ? {
                    ...s,
                    questions: [...s.questions, ...newQuestions]
                } : s)
            };
        });
        setBankModalOpen(false);
        setActiveSectionId(null);
        addToast(`${questions.length} soal ditambahkan`, "success");
    };

    const handleAiQuestions = (questions: Question[]) => {
        if (!activeSectionId) return;
         setExam((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === activeSectionId ? {
                    ...s,
                    questions: [...s.questions, ...questions]
                } : s)
            };
        });
    };

    const handleImportQuestions = (questions: Question[]) => {
        if (!activeSectionId) return;
        setExam((prev) => {
            if (!prev) return null;
            
            // Calculate starting number
            let totalQuestions = 0;
            prev.sections.forEach(s => s.questions.forEach(q => { if(q.type !== QuestionType.STIMULUS) totalQuestions++; }));
            
            const newQuestions = questions.map((q, idx) => ({
                ...q,
                id: crypto.randomUUID(),
                number: q.type === QuestionType.STIMULUS ? '' : String(totalQuestions + idx + 1)
            }));
            
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === activeSectionId ? {
                    ...s,
                    questions: [...s.questions, ...newQuestions]
                } : s)
            };
        });
        setActiveSectionId(null);
    };

    const handleToolbarOpenBank = () => {
        const targetSectionId = activeSectionId || exam?.sections[0]?.id || null;
        if (targetSectionId) setActiveSectionId(targetSectionId);
        setBankModalOpen(true);
    };

    const handleToolbarOpenAi = () => {
        const targetSectionId = activeSectionId || exam?.sections[0]?.id || null;
        if (targetSectionId) setActiveSectionId(targetSectionId);
        setAiModalOpen(true);
    };

    const handleToolbarOpenSmartImport = () => {
        const targetSectionId = activeSectionId || exam?.sections[0]?.id || null;
        if (targetSectionId) setActiveSectionId(targetSectionId);
        setSmartImportOpen(true);
    };

    const totalQuestions = useMemo(() => {
        if (!exam) return 0;
        return exam.sections.reduce((total, section) => total + section.questions.length, 0);
    }, [exam]);
    if (isLoading || !exam || !settings) return <div className="app-loading-state h-screen">Memuat...</div>;

    const examInfoSummary = [
        exam.subject?.trim() || 'Mata pelajaran belum diisi',
        exam.class?.trim() || 'Kelas belum diisi',
        `${exam.sections.length} bagian`,
        `${totalQuestions} item`,
    ];
    const examInfoFieldClass = "w-full rounded-[18px] border-2 border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_80%,white)] px-3.5 py-3 text-[var(--text-primary)] shadow-sm outline-none transition-all placeholder:text-[var(--text-muted)] hover:border-[var(--border-secondary)] focus:border-blue-500 focus:bg-[var(--bg-secondary)] focus:ring-4 focus:ring-blue-100/70 dark:focus:ring-blue-900/20";
    const examInfoLabelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]";

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
            {/* Sticky Header & Toolbar Container */}
            <div className="sticky top-0 z-20 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] shadow-xs">
                {/* Row 1: Primary Identity & Navigation Bar */}
                <div className="px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
                        <button 
                            onClick={onBack} 
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors sm:h-10 sm:w-10"
                            title={T.back}
                            aria-label={T.back}
                        >
                            <ChevronLeftIcon className="text-base sm:text-lg" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)] truncate" title={exam.title}>
                                {exam.title || 'Naskah Ujian'}
                            </h1>
                            <div className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[var(--text-muted)] truncate">
                                <span className="font-medium text-[var(--text-secondary)] truncate">{exam.subject?.trim() || 'Tanpa Mapel'}</span>
                                <span>•</span>
                                <span className="truncate">{exam.class?.trim() || 'Semua Kelas'}</span>
                                <span>•</span>
                                <span className="font-semibold text-[var(--text-primary)]">{totalQuestions} Butir Soal</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Autosave Status, Status Dropdown, Preview & Save Buttons */}
                    <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5">
                        {/* Auto-save Indicator */}
                        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono mr-1">
                            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            <span>{isSaving ? T.saving : lastSaved ? `${T.savedAt} ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                        </div>

                        {/* Status Dropdown Button (In main header without overflow clipping) */}
                        <div className="relative" ref={statusMenuRef}>
                            <button
                                onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-bold text-[11px] sm:text-xs uppercase transition-all shadow-2xs ${
                                    exam.status === 'published'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                                }`}
                                aria-haspopup="true"
                                aria-expanded={isStatusMenuOpen}
                                title="Ubah Status Naskah (Draft / Terbit)"
                            >
                                {exam.status === 'published' ? <CheckIcon className="text-sm" /> : <EditIcon className="text-sm" />}
                                <span className="hidden min-[420px]:inline">{exam.status === 'published' ? T.statusPublished : T.statusDraft}</span>
                                <i className={`bi bi-chevron-down text-[9px] transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`}></i>
                            </button>

                            {isStatusMenuOpen && (
                                <div className="absolute top-full right-0 mt-1.5 w-48 bg-[var(--bg-secondary)] rounded-xl shadow-xl border border-[var(--border-primary)] z-50 overflow-hidden animate-scale-in origin-top-right">
                                    <button
                                        onClick={() => { handleUpdateExam('status', 'draft'); setStatusMenuOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2.5 hover:bg-[var(--bg-hover)] flex items-center gap-2.5 transition-colors ${exam.status === 'draft' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold' : 'text-[var(--text-secondary)]'}`}
                                    >
                                        <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"><EditIcon className="text-xs" /></div>
                                        <span className="text-xs">{T.statusDraft}</span>
                                    </button>
                                    <button
                                        onClick={() => { handleUpdateExam('status', 'published'); setStatusMenuOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2.5 hover:bg-[var(--bg-hover)] flex items-center gap-2.5 transition-colors ${exam.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-[var(--text-secondary)]'}`}
                                    >
                                        <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"><CheckIcon className="text-xs" /></div>
                                        <span className="text-xs">{T.statusPublished}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {onPreview && (
                            <button
                                onClick={onPreview}
                                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-2.5 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm transition-colors shadow-2xs"
                                title="Pratinjau & Cetak Dokumen"
                            >
                                <EyeIcon className="text-sm text-blue-600 dark:text-blue-400" />
                                <span className="hidden sm:inline">Pratinjau</span>
                            </button>
                        )}

                        <button 
                            onClick={handleManualSave} 
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 font-bold text-xs sm:text-sm text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 sm:px-4 sm:py-2" 
                            title={T.save} 
                            aria-label={T.save}
                        >
                            <SaveIcon className="text-sm" />
                            <span>{T.save}</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Secondary Scrollable Action Toolbar */}
                <div className="border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/75 px-3 py-1.5 sm:px-5 sm:py-2 flex items-center justify-between gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                    {/* Left: History & Audit Health */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Undo / Redo */}
                        <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-0.5 shadow-2xs">
                            <button 
                                onClick={undo} 
                                disabled={!canUndo} 
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
                                title="Undo (Urungkan Perubahan)"
                                aria-label="Undo"
                            >
                                <UndoIcon className="text-xs sm:text-sm" />
                            </button>
                            <div className="w-[1px] h-3.5 bg-[var(--border-primary)] mx-0.5"></div>
                            <button 
                                onClick={redo} 
                                disabled={!canRedo} 
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
                                title="Redo (Ulangi Perubahan)"
                                aria-label="Redo"
                            >
                                <RedoIcon className="text-xs sm:text-sm" />
                            </button>
                        </div>

                        {/* Audit / Health Check Button */}
                        {validation && (
                            <button
                                onClick={() => setValidationModalOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all shadow-2xs flex-shrink-0 ${
                                    validation.healthScore >= 90
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                                        : validation.healthScore >= 70
                                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                                }`}
                                title="Audit & Validasi Kelengkapan Soal"
                            >
                                <ShieldCheckIcon className="text-sm" />
                                <span>Kesiapan: {validation.healthScore}%</span>
                                {validation.criticalIssues.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] shadow-2xs">
                                        {validation.criticalIssues.length} Isu
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Right: Quick Tools Shortcuts */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {/* Info Ujian Toggle */}
                        <button
                            onClick={() => setExamInfoOpen(!isExamInfoOpen)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-colors ${
                                isExamInfoOpen
                                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'
                            }`}
                            title="Pengaturan Kop & Identitas Ujian"
                        >
                            <i className="bi bi-sliders text-xs"></i>
                            <span>Info Ujian</span>
                        </button>

                        {/* Bank Soal */}
                        <button
                            onClick={handleToolbarOpenBank}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] sm:text-xs font-semibold transition-colors"
                            title="Ambil Soal dari Bank Soal"
                        >
                            <BankIcon className="text-xs text-amber-500" />
                            <span>Bank Soal</span>
                        </button>

                        {/* Smart Import */}
                        <button
                            onClick={handleToolbarOpenSmartImport}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] sm:text-xs font-semibold transition-colors"
                            title="Smart Import dari Naskah Word/Teks"
                        >
                            <LightningIcon className="text-xs text-indigo-500" />
                            <span>Smart Import</span>
                        </button>

                        {/* AI Generator */}
                        <button
                            onClick={handleToolbarOpenAi}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-[11px] sm:text-xs font-semibold transition-colors"
                            title="AI Generator Soal Otomatis"
                        >
                            <StarsIcon className="text-xs text-purple-600 dark:text-purple-400" />
                            <span>AI Generator</span>
                        </button>
                    </div>
                </div>
            </div>

            <div dir={exam.direction} className="flex-grow overflow-y-auto px-2.5 py-3 sm:p-4 md:p-8 space-y-5 sm:space-y-6 max-w-6xl mx-auto w-full pb-28 md:pb-24">
                {/* Exam Info Card */}
                <div className="app-surface overflow-hidden rounded-[var(--radius-card)]">
                     <button
                        type="button"
                        onClick={() => setExamInfoOpen(open => !open)}
                        className="flex w-full items-start justify-between gap-4 px-3.5 py-3.5 text-left sm:px-5 sm:py-4"
                     >
                        <div className="min-w-0 space-y-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{T.examInfo}</h3>
                                <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
                                    Judul, mapel, dan pengaturan dasar ujian.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {examInfoSummary.map((item, index) => (
                                    <span
                                        key={`${item}-${index}`}
                                        className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] sm:text-xs"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                            <i className={`bi ${isExamInfoOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </span>
                     </button>

                     {isExamInfoOpen && (
                     <div className="space-y-4 border-t border-[var(--border-primary)] px-3.5 py-3.5 sm:px-5 sm:py-4.5">
                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                         <div className="md:col-span-2">
                             <label className={examInfoLabelClass}>{T.examTitle}</label>
                             <input type="text" value={exam.title} onChange={e => handleUpdateExam('title', e.target.value)} className={`${examInfoFieldClass} text-base font-semibold sm:text-lg`} />
                         </div>
                         <div className="md:col-span-1">
                             <label className={examInfoLabelClass}>{T.subject}</label>
                             <input type="text" value={exam.subject} onChange={e => handleUpdateExam('subject', e.target.value)} className={`${examInfoFieldClass} font-medium`} />
                         </div>
                         <div className="md:col-span-1">
                             <label className={examInfoLabelClass}>{T.class}</label>
                             <input type="text" value={exam.class} onChange={e => handleUpdateExam('class', e.target.value)} className={`${examInfoFieldClass} font-medium`} />
                         </div>
                         <div className="md:col-span-1">
                             <label className={examInfoLabelClass}>{T.date}</label>
                             <input type="date" value={exam.date} onChange={e => handleUpdateExam('date', e.target.value)} className={examInfoFieldClass} />
                         </div>
                         <div className="md:col-span-1">
                             <label className={examInfoLabelClass}>{T.examTime}</label>
                             <input type="text" value={exam.waktuUjian} onChange={e => handleUpdateExam('waktuUjian', e.target.value)} className={examInfoFieldClass} />
                         </div>
                         <div className="md:col-span-2">
                            <label className={examInfoLabelClass}>{T.directionLabel}</label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className={`flex items-center gap-3 rounded-[18px] border-2 px-3.5 py-3 transition-all cursor-pointer ${exam.direction === 'ltr' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_80%,white)] text-[var(--text-secondary)]'}`}>
                                    <input type="radio" name="examDirection" value="ltr" checked={exam.direction === 'ltr'} onChange={() => handleUpdateExam('direction', 'ltr')} className="form-radio" />
                                    <span className="font-medium">{T.directionLtr}</span>
                                </label>
                                <label className={`flex items-center gap-3 rounded-[18px] border-2 px-3.5 py-3 transition-all cursor-pointer ${exam.direction === 'rtl' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-[var(--border-primary)] bg-[color:color-mix(in_srgb,var(--bg-secondary)_80%,white)] text-[var(--text-secondary)]'}`}>
                                    <input type="radio" name="examDirection" value="rtl" checked={exam.direction === 'rtl'} onChange={() => handleUpdateExam('direction', 'rtl')} className="form-radio" />
                                    <span className="font-medium">{T.directionRtl}</span>
                                </label>
                            </div>
                        </div>
                     </div>
                     <div>
                        <label className={examInfoLabelClass}>{T.previewLayoutLabel}</label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <label className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 cursor-pointer">
                                <input type="radio" name="layoutColumns" checked={exam.layoutColumns !== 2} onChange={() => handleUpdateExam('layoutColumns', 1)} className="form-radio" />
                                <span className="flex items-center gap-1"><CardTextIcon /> {T.layout1Col}</span>
                            </label>
                            <label className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 cursor-pointer">
                                <input type="radio" name="layoutColumns" checked={exam.layoutColumns === 2} onChange={() => handleUpdateExam('layoutColumns', 2)} className="form-radio" />
                                <span className="flex items-center gap-1"><LayoutSplitIcon /> {T.layout2Col}</span>
                            </label>
                        </div>
                     </div>
                     <div>
                         <label className={examInfoLabelClass}>{T.description}</label>
                         <textarea value={exam.keterangan} onChange={e => handleUpdateExam('keterangan', e.target.value)} placeholder={T.descriptionPlaceholder} className={`${examInfoFieldClass} h-24 resize-y`} />
                     </div>
                     <div>
                         <label className={examInfoLabelClass}>{T.generalInstructions}</label>
                         <textarea value={exam.instructions} onChange={e => handleUpdateExam('instructions', e.target.value)} placeholder={T.generalInstructionsPlaceholder} className={`${examInfoFieldClass} h-28 resize-y font-mono text-sm`} />
                     </div>
                     </div>
                     )}
                </div>

                {/* Sections with Pagination Injection */}
                {exam.sections.map((section) => (
                    <SectionEditor
                        key={section.id}
                        section={section}
                        T={T}
                        onSectionUpdate={handleUpdateSection}
                        onSectionDelete={handleDeleteSection}
                        onQuestionAdd={handleAddQuestion}
                        onQuestionUpdate={handleUpdateQuestion}
                        onQuestionDelete={handleDeleteQuestion}
                        onSaveToBank={handleSaveToBank}
                        onAddQuestionsFromBank={handleOpenBank}
                        onOpenAiModal={handleOpenAi}
                        onOpenSmartImport={handleOpenSmartImport}
                    />
                ))}

                <button onClick={handleAddSection} className="w-full py-4 border-2 border-dashed border-[var(--border-secondary)] rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold flex items-center justify-center gap-2">
                    <PlusIcon className="text-xl" />
                    <span>{T.addSection}</span>
                </button>
            </div>

            {/* Modals */}
            {isBankModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                         <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{T.getFromBank}</h3>
                            <button onClick={() => setBankModalOpen(false)} className="text-[var(--text-secondary)]"><CloseIcon /></button>
                        </div>
                        <div className="flex-grow overflow-hidden p-4">
                            <QuestionBankView isModalMode={true} onAddQuestions={handleAddFromBank} onClose={() => setBankModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
            
            <AiGeneratorModal 
                isOpen={isAiModalOpen} 
                onClose={() => setAiModalOpen(false)} 
                onQuestionsGenerated={handleAiQuestions}
            />

            <SmartImportModal 
                isOpen={isSmartImportOpen} 
                onClose={() => setSmartImportOpen(false)} 
                onImport={handleImportQuestions}
            />

            {exam && (
                <ExamValidationModal
                    isOpen={isValidationModalOpen}
                    onClose={() => setValidationModalOpen(false)}
                    exam={exam}
                    onJumpToQuestion={(_sectionId, questionId) => {
                        if (questionId) {
                            setTimeout(() => {
                                const el = document.getElementById(`question-${questionId}`);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.classList.add('ring-4', 'ring-blue-500', 'shadow-2xl');
                                    setTimeout(() => {
                                        el.classList.remove('ring-4', 'ring-blue-500', 'shadow-2xl');
                                    }, 2500);
                                }
                            }, 100);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default EditorView;
const ReactQuillComponent = ReactQuill as any;
