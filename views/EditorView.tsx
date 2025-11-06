import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exam, Question, Settings, Section, TableData, TableRowData, TableCellData } from '../types';
import { QuestionType } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { getExam, saveExam, getSettings, saveQuestionToBank } from '../lib/storage';
import { toRoman } from '../lib/utils';
import { generateHtmlContent } from '../lib/htmlGenerator';
import QuestionBankView from './QuestionBankView';
import { useHistoryState } from '../hooks/useHistoryState';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { 
    PlusIcon, TrashIcon, PrinterIcon, EditIcon, ChevronLeftIcon, SaveIcon, CheckIcon, BookmarkPlusIcon, CloseIcon,
    ZoomInIcon, ZoomOutIcon, BankIcon, UndoIcon, RedoIcon, CardTextIcon, LayoutSplitIcon
} from '../components/Icons';

// --- Start Custom Quill Icons ---
const icons = Quill.import('ui/icons');
icons['bold'] = '<i class="bi bi-type-bold" aria-hidden="true"></i>';
icons['italic'] = '<i class="bi bi-type-italic" aria-hidden="true"></i>';
icons['underline'] = '<i class="bi bi-type-underline" aria-hidden="true"></i>';
icons['strike'] = '<i class="bi bi-type-strikethrough" aria-hidden="true"></i>';
icons['color'] = '<i class="bi bi-palette-fill" aria-hidden="true"></i>';
icons['background'] = '<i class="bi bi-highlighter" aria-hidden="true"></i>';
icons['image'] = '<i class="bi bi-image-fill" aria-hidden="true"></i>';
icons['direction'] = '<i class="bi bi-text-right" aria-hidden="true"></i>';
icons['script'] = {
  'sub': '<i class="bi bi-subscript" aria-hidden="true"></i>',
  'super': '<i class="bi bi-superscript" aria-hidden="true"></i>'
};
icons['clean'] = '<i class="bi bi-eraser-fill" aria-hidden="true"></i>';
if (icons['align']) {
    icons['align'][''] = '<i class="bi bi-text-left" aria-hidden="true"></i>';
    icons['align']['center'] = '<i class="bi bi-text-center" aria-hidden="true"></i>';
    icons['align']['right'] = '<i class="bi bi-text-right" aria-hidden="true"></i>';
    icons['align']['justify'] = '<i class="bi bi-justify" aria-hidden="true"></i>';
}
// --- End Custom Quill Icons ---

// --- Start Image Compression Utility ---
const compressImage = (base64Str: string, maxWidth = 1280, maxHeight = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
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
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (error) => {
            console.error("Image loading error for compression:", error);
            reject(new Error("Failed to load image for compression."));
        };
    });
};
// --- End Image Compression Utility ---

// --- Start Translations ---
const ltrTranslations = {
  save: 'Simpan',
  backToArchive: 'Arsip',
  editTitle: 'Edit',
  statusDraft: 'Draf',
  statusPublished: 'Selesai',
  tabEditor: 'Editor',
  tabPreview: 'Pratinjau',
  tabAnswerKey: 'Kunci Jawaban',
  examInfo: 'Informasi Ujian',
  examTitle: 'Judul Ujian',
  subject: 'Mata Pelajaran',
  class: 'Kelas / Jenjang',
  date: 'Hari/Tanggal',
  examTime: 'Waktu Ujian',
  description: 'Keterangan',
  descriptionPlaceholder: 'Keterangan (misal: Kurikulum, Tujuan, dll.)',
  generalInstructions: 'Petunjuk Umum',
  generalInstructionsPlaceholder: 'Petunjuk Umum Pengerjaan...',
  directionLabel: 'Arah Tulis:',
  directionLtr: 'LTR (Latin)',
  directionRtl: 'RTL (Arab)',
  previewLayoutLabel: 'Tata Letak Pratinjau:',
  layout1Col: '1 Kolom',
  layout2Col: '2 Kolom',
  addSection: 'Tambah Bagian Soal',
  instructionPlaceholder: 'Instruksi untuk bagian ini...',
  sectionNumberAria: 'Nomor Bagian Soal',
  sectionInstructionAria: 'Teks Instruksi Bagian Soal',
  deleteSectionAria: 'Hapus Bagian Soal',
  addQuestion: 'Tambah Soal',
  getFromBank: 'Ambil dari Bank Soal',
  questionPlaceholder: 'Tulis pertanyaan di sini...',
  questionNumberAria: 'Nomor soal {number}',
  saveToBank: 'Simpan ke Bank Soal',
  deleteQuestion: 'Hapus Soal',
  deleteOptionAria: 'Hapus opsi {letter}',
  deleteMatchingPromptAria: 'Hapus pernyataan {index}',
  deleteMatchingAnswerAria: 'Hapus jawaban {letter}',
  addOption: 'Tambah Opsi',
  twoColumnLayout: 'Tampilkan opsi dalam 2 kolom untuk menghemat kertas',
  provideAnswerSpace: 'Sediakan tempat jawaban di lembar soal',
  matchingColumnA: 'Kolom A (Pernyataan)',
  matchingColumnB: 'Kolom B (Jawaban)',
  statementPlaceholder: 'Tulis pernyataan...',
  answerPlaceholder: 'Tulis jawaban...',
  addStatement: 'Tambah Pernyataan',
  addAnswer: 'Tambah Jawaban',
  answerKeyTitle: 'Kunci Jawaban',
  trueLabel: 'Benar',
  falseLabel: 'Salah',
  selectAnswerPlaceholder: '-- Pilih Jawaban --',
  answerKeyPlaceholder: 'Kunci Jawaban / Jawaban Model',
  optionPlaceholder: 'Opsi',
  emptyOptionPlaceholder: 'Opsi {letter}',
  tableCellContentLabel: 'Isi Sel {index}',
  tableEditorTitle: 'Editor Tabel',
  addRow: 'Tambah Baris',
  removeRow: 'Hapus Baris',
  addCol: 'Tambah Kolom',
  removeCol: 'Hapus Kolom',
  mergeCells: 'Gabung Sel',
  splitCell: 'Pisah Sel',
  selectionPrompt: 'Pilih sel untuk digabungkan atau dipisahkan.',
  tableDisplaySettings: 'Pengaturan Tampilan',
  columnWidthsLabel: 'Lebar Kolom (px)',
  rowHeightsLabel: 'Tinggi Baris (px)',
  verticalAlignLabel: 'Perataan Vertikal Sel',
  autoPlaceholder: 'Auto',
  cannotDeleteRowWarning: 'Tidak dapat menghapus baris yang merupakan bagian dari sel gabungan',
  cannotDeleteColWarning: 'Tidak dapat menghapus kolom yang merupakan bagian dari sel gabungan',
  tableSelectCellAria: 'Pilih sel baris {row} kolom {col}',
  alignTop: 'Rata Atas',
  alignMiddle: 'Rata Tengah',
  alignBottom: 'Rata Bawah',
  questionTypes: {
    [QuestionType.MULTIPLE_CHOICE]: 'Pilihan Ganda',
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 'Pilihan Ganda Kompleks',
    [QuestionType.TRUE_FALSE]: 'Benar-Salah',
    [QuestionType.SHORT_ANSWER]: 'Isian Singkat',
    [QuestionType.ESSAY]: 'Esai / Uraian',
    [QuestionType.MATCHING]: 'Menjodohkan',
    [QuestionType.TABLE]: 'Tabel Isian',
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 'Tabel Pilihan Ganda',
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 'Tabel Pilihan Ganda Kompleks',
  },
  instructionMap: {
    [QuestionType.MULTIPLE_CHOICE]: 'Berilah tanda silang (X) pada pilihan jawaban yang benar!',
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 'Pilihlah jawaban yang benar dengan memberi tanda centang (✓). Jawaban benar bisa lebih dari satu.',
    [QuestionType.SHORT_ANSWER]: 'Isilah titik-titik di bawah ini dengan jawaban yang benar dan tepat!',
    [QuestionType.ESSAY]: 'Jawablah pertanyaan di bawah ini dengan benar!',
    [QuestionType.MATCHING]: 'Jodohkan pernyataan di kolom A dengan jawaban yang sesuai di kolom B!',
    [QuestionType.TRUE_FALSE]: 'Tentukan apakah pernyataan berikut Benar atau Salah!',
    [QuestionType.TABLE]: 'Lengkapilah tabel isian berikut dengan jawaban yang tepat!',
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 'Lengkapilah tabel berikut dengan memilih jawaban yang paling tepat!',
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 'Lengkapilah tabel berikut. Jawaban benar bisa lebih dari satu untuk setiap baris.',
  },
};
const rtlTranslations: typeof ltrTranslations = {
  ...ltrTranslations,
  save: 'حفظ',
  statusDraft: 'مسودة',
  statusPublished: 'منشور',
  examInfo: 'معلومات الاختبار',
  examTitle: 'عنوان الاختبار',
  subject: 'المادة الدراسية',
  class: 'الصف / المستوى',
  date: 'اليوم / التاريخ',
  examTime: 'وقت الاختبار',
  description: 'الوصف',
  descriptionPlaceholder: 'وصف (مثال: المنهج، الأهداف، إلخ)',
  generalInstructions: 'التعليمات العامة',
  generalInstructionsPlaceholder: 'تعليمات عامة للإجابة...',
  directionLabel: 'اتجاه الكتابة:',
  directionLtr: 'LTR (لاتيني)',
  directionRtl: 'RTL (عربي)',
  previewLayoutLabel: 'تخطيط المعاينة:',
  layout1Col: 'عمود واحد',
  layout2Col: 'عمودان',
  addSection: 'إضافة قسم الأسئلة',
  instructionPlaceholder: 'تعليمات لهذا القسم...',
  sectionNumberAria: 'رقم قسم السؤال',
  sectionInstructionAria: 'نص تعليمات قسم السؤال',
  deleteSectionAria: 'حذف قسم السؤال',
  addQuestion: 'إضافة سؤال',
  getFromBank: 'جلب من بنك الأسئلة',
  questionPlaceholder: 'اكتب السؤال هنا...',
  questionNumberAria: 'رقم السؤال {number}',
  saveToBank: 'حفظ في بنك الأسئلة',
  deleteQuestion: 'حذف السؤال',
  deleteOptionAria: 'حذف الخيار {letter}',
  deleteMatchingPromptAria: 'حذف العبارة {index}',
  deleteMatchingAnswerAria: 'حذف الإجابة {letter}',
  addOption: 'إضافة خيار',
  twoColumnLayout: 'عرض الخيارات في عمودين لتوفير الورق',
  provideAnswerSpace: 'توفير مساحة للإجابة في ورقة الأسئلة',
  matchingColumnA: 'العمود أ (العبارات)',
  matchingColumnB: 'العمود ب (الإجابات)',
  statementPlaceholder: 'اكتب العبارة...',
  answerPlaceholder: 'اكتب الإجابة...',
  addStatement: 'إضافة عبارة',
  addAnswer: 'إضافة إجابة',
  answerKeyTitle: 'مفتاح الإجابة',
  trueLabel: 'صح',
  falseLabel: 'خطأ',
  selectAnswerPlaceholder: '-- اختر إجابة --',
  answerKeyPlaceholder: 'مفتاح الإجابة / الإجابة النموذجية',
  optionPlaceholder: 'خيار',
  emptyOptionPlaceholder: 'الخيار {letter}',
  tableCellContentLabel: 'محتوى الخلية {index}',
  tableEditorTitle: 'محرر الجدول',
  addRow: 'إضافة صف',
  removeRow: 'حذف صف',
  addCol: 'إضافة عمود',
  removeCol: 'حذف عمود',
  mergeCells: 'دمج الخلايا',
  splitCell: 'فصل الخلية',
  selectionPrompt: 'حدد خلايا للدمج أو الفصل.',
  tableDisplaySettings: 'إعدادات العرض',
  columnWidthsLabel: 'عرض الأعمدة (بكسل)',
  rowHeightsLabel: 'ارتفاع الصفوف (بكسل)',
  verticalAlignLabel: 'محاذاة الخلية العمودية',
  autoPlaceholder: 'تلقائي',
  cannotDeleteRowWarning: 'لا يمكن حذف الصف لأنه جزء من خلية مدمجة',
  cannotDeleteColWarning: 'لا يمكن حذف العمود لأنه جزء من خلية مدمجة',
  tableSelectCellAria: 'حدد الخلية صف {row} عمود {col}',
  alignTop: 'محاذاة للأعلى',
  alignMiddle: 'محاذاة للوسط',
  alignBottom: 'محاذاة للأسفل',
  questionTypes: {
    [QuestionType.MULTIPLE_CHOICE]: 'الاختيار من متعدد',
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 'الاختيار من متعدد المركب',
    [QuestionType.TRUE_FALSE]: 'صح / خطأ',
    [QuestionType.SHORT_ANSWER]: 'إجابة قصيرة',
    [QuestionType.ESSAY]: 'مقالي',
    [QuestionType.MATCHING]: 'المطابقة',
    [QuestionType.TABLE]: 'تعبئة الجدول',
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 'جدول الاختيار من متعدد',
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 'جدول الاختيار من متعدد المركب',
  },
  instructionMap: {
    [QuestionType.MULTIPLE_CHOICE]: 'اختر الإجابة الصحيحة بوضع علامة (X)!',
    [QuestionType.COMPLEX_MULTIPLE_CHOICE]: 'اختر الإجابات الصحيحة بوضع علامة (✓). يمكن أن تكون هناك أكثر من إجابة صحيحة.',
    [QuestionType.SHORT_ANSWER]: 'املأ الفراغات التالية بالإجابات الصحيحة!',
    [QuestionType.ESSAY]: 'أجب عن الأسئلة التالية بشكل صحيح!',
    [QuestionType.MATCHING]: 'طابق بين العبارات في العمود أ والإجابات المناسبة في العمود ب!',
    [QuestionType.TRUE_FALSE]: 'حدد ما إذا كانت العبارات التالية صحيحة أم خاطئة!',
    [QuestionType.TABLE]: 'املأ الجدول التالي بالإجابات الصحيحة!',
    [QuestionType.TABLE_MULTIPLE_CHOICE]: 'أكمل الجدول التالي باختيار الإجابة الأنسب!',
    [QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE]: 'أكمل الجدول التالي. يمكن أن تكون هناك أكثر من إجابة صحيحة لكل صف.',
  },
};
const translations = { ltr: ltrTranslations, rtl: rtlTranslations };
// --- End Translations ---

// --- Start Editor Components ---
const RichTextEditor: React.FC<{ 
    value: string; 
    onChange: (newValue: string) => void; 
    placeholder?: string;
    isOption?: boolean;
}> = ({ value, onChange, placeholder, isOption = false }) => {
    const quillRef = useRef<ReactQuill>(null);
    const { addToast } = useToast();

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
    
    const modules = useMemo(() => {
        const mainToolbar = [['bold', 'italic', 'underline', 'strike'], [{ 'script': 'sub'}, { 'script': 'super' }], [{ 'color': [] }, { 'background': [] }], [{ 'direction': 'rtl' }, { 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }], ['image'], ['clean']];
        const optionToolbar = [['bold', 'italic', 'underline'], [{ 'script': 'sub'}, { 'script': 'super' }], [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }], ['clean']];
        const toolbarContainer = isOption ? optionToolbar : mainToolbar;
        return { toolbar: { container: toolbarContainer, handlers: { image: imageHandler } }, clipboard: { matchVisual: false } };
    }, [imageHandler, isOption]);

    const handleChange = (content: string) => {
        const normalizedContent = (content === '<p><br></p>' || content === '<br>') ? '' : content;
        if (normalizedContent !== value) {
            onChange(normalizedContent);
        }
    };
    
    return (
        <div className={`so-genius-quill-wrapper ${isOption ? 'so-genius-quill-option-wrapper' : ''}`}>
            <ReactQuill ref={quillRef} value={value} onChange={handleChange} placeholder={placeholder} theme="snow" modules={modules} />
        </div>
    );
};

const TableBuilder: React.FC<{
    tableData: TableData;
    onTableChange: (newTableData: TableData) => void;
    T: typeof translations.ltr;
}> = ({ tableData, onTableChange, T }) => {
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
                         <div className="text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: choice.text || `<span class="italic text-[var(--text-muted)]">${T.emptyOptionPlaceholder.replace('{letter}', String.fromCharCode(65 + (question.choices || []).indexOf(choice)))}</span>` }}></div>
                     </label>
                ));
            case QuestionType.COMPLEX_MULTIPLE_CHOICE:
                 return (question.choices || []).map(choice => (
                     <label key={choice.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-[var(--bg-hover)]">
                        <input type="checkbox" value={choice.id} checked={(question.answerKey as string[] || []).includes(choice.id)} onChange={(e) => { const currentAnswers = (question.answerKey as string[] || []); const newAnswers = e.target.checked ? [...currentAnswers, choice.id] : currentAnswers.filter(id => id !== choice.id); handleAnswerKeyChange(newAnswers); }} className="form-checkbox text-blue-600 bg-transparent border-[var(--border-secondary)] rounded focus:ring-blue-500" />
                        <div className="text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: choice.text || `<span class="italic text-[var(--text-muted)]">${T.emptyOptionPlaceholder.replace('{letter}', String.fromCharCode(65 + (question.choices || []).indexOf(choice)))}</span>` }}></div>
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
                                    <div className="text-[var(--text-primary)] text-sm" dangerouslySetInnerHTML={{ __html: choice.text || `Opsi ${String.fromCharCode(65 + choiceIndex)}`}}></div>
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
                                     <div className="text-[var(--text-primary)] text-sm" dangerouslySetInnerHTML={{ __html: choice.text || `Opsi ${String.fromCharCode(65 + choiceIndex)}`}}></div>
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
    
    return (
        <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
            <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center">
                    <input type="text" value={question.number} onChange={(e) => updateField('number', e.target.value)} className="bg-slate-700 dark:bg-slate-600 text-white rounded-full h-8 w-12 text-center font-bold me-3 outline-none focus:ring-2 focus:ring-blue-500" aria-label={T.questionNumberAria.replace('{number}', question.number)} />
                    <span className="font-semibold text-[var(--text-secondary)]">{T.questionTypes[question.type]}</span>
                </div>
                 <div className="flex items-center space-x-1">
                    <button onClick={() => onSaveToBank(question)} title={T.saveToBank} aria-label={T.saveToBank} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><BookmarkPlusIcon className="text-xl" /></button>
                    <button onClick={() => onQuestionDelete(sectionId, question.id)} title={T.deleteQuestion} aria-label={T.deleteQuestion} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon className="text-xl" /></button>
                </div>
            </div>
            <RichTextEditor value={question.text} onChange={(newText) => updateField('text', newText)} placeholder={T.questionPlaceholder} />
            {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && (
                <div className="mt-4 space-y-3 ps-4 border-s-2 border-[var(--border-primary)]">
                    {(question.choices || []).map((choice, choiceIndex) => (
                        <div key={choice.id} className="flex items-start space-x-2">
                            <span className="font-mono mt-2">{String.fromCharCode(97 + choiceIndex)}.</span>
                             <div className="flex-grow min-w-0"><RichTextEditor isOption={true} value={choice.text} onChange={(newText) => handleChoiceChange(choice.id, newText)} placeholder={`${T.optionPlaceholder} ${String.fromCharCode(65 + choiceIndex)}`} /></div>
                            <button onClick={() => deleteChoice(choice.id)} aria-label={T.deleteOptionAria.replace('{letter}', String.fromCharCode(65 + choiceIndex))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.choices || []).length <= 1}><TrashIcon className="text-base" /></button>
                        </div>
                    ))}
                    <button onClick={addChoice} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon className="text-base" /> <span>{T.addOption}</span></button>
                    {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) && (
                        <div className="pt-2"><label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={!!question.isTwoColumns} onChange={e => updateField('isTwoColumns', e.target.checked)} className="form-checkbox rounded text-blue-600 bg-transparent border-[var(--border-secondary)] focus:ring-blue-500" /><span>{T.twoColumnLayout}</span></label></div>
                    )}
                </div>
            )}
            {question.type === QuestionType.ESSAY && (<div className="mt-3"><label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={!!question.hasAnswerSpace} onChange={e => updateField('hasAnswerSpace', e.target.checked)} className="form-checkbox text-blue-600 bg-transparent border-[var(--border-secondary)]" /><span>{T.provideAnswerSpace}</span></label></div>)}
            {question.type === QuestionType.MATCHING && (
                <div className="mt-4 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-2">
                        <h4 className="font-semibold text-[var(--text-secondary)]">{T.matchingColumnA}</h4>
                        {(question.matchingPrompts || []).map((prompt, index) => (<div key={prompt.id} className="flex items-start space-x-2"><span className="font-mono mt-2">{index + 1}.</span><div className="w-full min-w-0"><RichTextEditor isOption={true} value={prompt.text} onChange={newText => updateMatchingList('matchingPrompts', prompt.id, newText)} placeholder={T.statementPlaceholder} /></div><button onClick={() => deleteMatchingItem('matchingPrompts', prompt.id)} aria-label={T.deleteMatchingPromptAria.replace('{index}', String(index + 1))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.matchingPrompts || []).length <= 1}><TrashIcon /></button></div>))}
                        <button onClick={() => addMatchingItem('matchingPrompts')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon /><span>{T.addStatement}</span></button>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                        <h4 className="font-semibold text-[var(--text-secondary)]">{T.matchingColumnB}</h4>
                        {(question.matchingAnswers || []).map((answer, index) => (<div key={answer.id} className="flex items-start space-x-2"><span className="font-mono mt-2">{String.fromCharCode(65 + index)}.</span><div className="w-full min-w-0"><RichTextEditor isOption={true} value={answer.text} onChange={newText => updateMatchingList('matchingAnswers', answer.id, newText)} placeholder={T.answerPlaceholder} /></div><button onClick={() => deleteMatchingItem('matchingAnswers', answer.id)} aria-label={T.deleteMatchingAnswerAria.replace('{letter}', String.fromCharCode(65 + index))} className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 p-1 mt-1" disabled={(question.matchingAnswers || []).length <= 1}><TrashIcon /></button></div>))}
                         <button onClick={() => addMatchingItem('matchingAnswers')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 pt-2"><PlusIcon /><span>{T.addAnswer}</span></button>
                    </div>
                </div>
            )}
            {(question.type === QuestionType.TABLE || question.type === QuestionType.TABLE_MULTIPLE_CHOICE || question.type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) && question.tableData && (<TableBuilder tableData={question.tableData} onTableChange={(newTable) => updateField('tableData', newTable)} T={T} />)}
            <div className="mt-4 pt-3 border-t border-[var(--border-primary)]"><h4 className="font-semibold text-[var(--text-secondary)] text-sm mb-2">{T.answerKeyTitle}</h4><div className="space-y-2">{renderAnswerKeyInput()}</div></div>
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
}> = ({ section, T, onSectionUpdate, onSectionDelete, onAddQuestionsFromBank, ...questionCallbacks }) => {
    const [isAddQuestionOpen, setAddQuestionOpen] = useState(false);
    const addQuestionRef = useRef<HTMLDivElement>(null);
    
    const addQuestionAndClose = (type: QuestionType) => {
        questionCallbacks.onQuestionAdd(section.id, type);
        setAddQuestionOpen(false);
    };

    const addFromBankAndClose = () => {
        onAddQuestionsFromBank(section.id);
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
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-primary)] pb-3 gap-4">
                <div className="flex items-center gap-2 flex-grow">
                     <input type="text" value={title} onChange={(e) => handleInstructionChange(e.target.value, instructionText)} aria-label={T.sectionNumberAria} className="text-lg font-bold text-[var(--text-primary)] p-1 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] focus:ring-2 focus:ring-[var(--border-focus)] outline-none w-16 text-center transition-colors" />
                     <input type="text" value={instructionText} onChange={(e) => handleInstructionChange(title, e.target.value)} placeholder={T.instructionPlaceholder} aria-label={T.sectionInstructionAria} className="text-lg font-bold text-[var(--text-primary)] w-full p-1 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] focus:ring-2 focus:ring-[var(--border-focus)] outline-none transition-colors" />
                </div>
                <button onClick={() => onSectionDelete(section.id)} aria-label={T.deleteSectionAria} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"><TrashIcon className="text-xl" /></button>
            </div>
            {section.questions.map((q) => <QuestionEditor key={q.id} sectionId={section.id} question={q} T={T} {...questionCallbacks} />)}
            <div ref={addQuestionRef} className="relative inline-block text-center pt-4">
                 <button onClick={() => setAddQuestionOpen(p => !p)} aria-haspopup="true" aria-expanded={isAddQuestionOpen} className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200"><PlusIcon /><span>{T.addQuestion}</span></button>
                {isAddQuestionOpen && (
                    <div className="absolute start-0 mt-2 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg z-10 border border-[var(--border-secondary)] text-start">
                        <ul className="py-1">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); addFromBankAndClose(); }} className="flex items-center space-x-2 block px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:bg-[var(--bg-hover)]"><BankIcon /> <span>{T.getFromBank}</span></a></li>
                            <li className="border-t border-[var(--border-primary)] my-1"></li>
                            {Object.entries(T.questionTypes).map(([type, label]) => (<li key={type}><a href="#" onClick={(e) => { e.preventDefault(); addQuestionAndClose(type as QuestionType); }} className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">{label}</a></li>))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

interface EditorPaneProps {
    exam: Exam;
    T: typeof translations.ltr;
    onExamChange: (field: keyof Exam, value: any) => void;
    onSectionAdd: () => void;
    onSectionUpdate: (sectionId: string, field: keyof Section, value: any) => void;
    onSectionDelete: (sectionId: string) => void;
    onQuestionAdd: (sectionId: string, type: QuestionType) => void;
    onQuestionUpdate: (sectionId: string, questionId: string, field: keyof Question, value: any) => void;
    onQuestionDelete: (sectionId: string, questionId: string) => void;
    onSaveToBank: (question: Question) => void;
    onAddQuestionsFromBank: (sectionId: string) => void;
}

const EditorPane: React.FC<EditorPaneProps> = ({ exam, T, onExamChange, onSectionAdd, ...sectionCallbacks }) => {
    return (
        <div className="space-y-6 p-4 md:p-8" dir={exam.direction}>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-md">
                <div className="mb-4 border-b border-[var(--border-primary)] pb-2"><h2 className="text-xl font-bold text-[var(--text-primary)]">{T.examInfo}</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2"><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.examTitle}</label><input type="text" name="title" value={exam.title} onChange={(e) => onExamChange('title', e.target.value)} placeholder={T.examTitle} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.subject}</label><input type="text" name="subject" value={exam.subject} onChange={(e) => onExamChange('subject', e.target.value)} placeholder={T.subject} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.class}</label><input type="text" name="class" value={exam.class} onChange={(e) => onExamChange('class', e.target.value)} placeholder={T.class} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.date}</label><input type="date" name="date" value={exam.date} onChange={(e) => onExamChange('date', e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.examTime}</label><input type="text" name="waktuUjian" value={exam.waktuUjian || ''} onChange={(e) => onExamChange('waktuUjian', e.target.value)} placeholder="e.g., 90 Menit" className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                </div>
                <div className="mt-4"><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.description}</label><textarea name="keterangan" value={exam.keterangan || ''} onChange={(e) => onExamChange('keterangan', e.target.value)} placeholder={T.descriptionPlaceholder} rows={2} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                <div className="mt-4"><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.generalInstructions}</label><textarea name="instructions" value={exam.instructions} onChange={(e) => onExamChange('instructions', e.target.value)} placeholder={T.generalInstructionsPlaceholder} rows={4} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div>
                <div className="mt-6 pt-4 border-t border-[var(--border-primary)]">
                    <div className="hidden md:flex justify-between items-center">
                        <div><span className="text-sm font-medium text-[var(--text-secondary)] mr-3">{T.directionLabel}</span><div className="inline-flex items-center rounded-lg bg-[var(--bg-muted)] p-0.5"><button onClick={() => onExamChange('direction', 'ltr')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${exam.direction === 'ltr' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}>LTR</button><button onClick={() => onExamChange('direction', 'rtl')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${exam.direction === 'rtl' ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}>RTL</button></div></div>
                        <div><span className="text-sm font-medium text-[var(--text-secondary)] mr-3">{T.previewLayoutLabel}</span><div className="inline-flex items-center rounded-lg bg-[var(--bg-muted)] p-0.5"><button onClick={() => onExamChange('layoutColumns', 1)} title={T.layout1Col} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${(exam.layoutColumns === 1 || !exam.layoutColumns) ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}><CardTextIcon className="text-lg" /></button><button onClick={() => onExamChange('layoutColumns', 2)} title={T.layout2Col} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${exam.layoutColumns === 2 ? 'bg-[var(--bg-secondary)] text-blue-600 dark:text-slate-100 shadow-sm' : 'text-[var(--text-secondary)]'}`}><LayoutSplitIcon className="text-lg" /></button></div></div>
                    </div>
                    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.directionLabel}</label><select value={exam.direction} onChange={(e) => onExamChange('direction', e.target.value)} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]"><option value="ltr">{T.directionLtr}</option><option value="rtl">{T.directionRtl}</option></select></div>
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{T.previewLayoutLabel}</label><select value={exam.layoutColumns || 1} onChange={(e) => onExamChange('layoutColumns', Number(e.target.value))} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]"><option value={1}>{T.layout1Col}</option><option value={2}>{T.layout2Col}</option></select></div>
                    </div>
                </div>
            </div>
            {exam.sections.map((section) => <SectionEditor key={section.id} section={section} T={T} {...sectionCallbacks} />)}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-md flex items-center justify-center"><button onClick={onSectionAdd} className="flex items-center space-x-2 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg transition-all duration-200"><PlusIcon /><span>{T.addSection}</span></button></div>
        </div>
    );
};

interface StatusButtonProps { status: 'draft' | 'published'; isOpen: boolean; setIsOpen: (isOpen: boolean) => void; onStatusChange: (newStatus: 'draft' | 'published') => void; dropdownRef: React.RefObject<HTMLDivElement>; T: typeof translations.ltr; }
const StatusButton: React.FC<StatusButtonProps> = ({ status, isOpen, setIsOpen, onStatusChange, dropdownRef, T }) => {
    const isPublished = status === 'published';
    const bgColor = isPublished ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900' : 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900';
    const textColor = isPublished ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300';
    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} aria-haspopup="true" aria-expanded={isOpen} className={`flex items-center space-x-2 ${bgColor} ${textColor} font-semibold py-2 px-4 rounded-lg transition-all duration-200 h-full`}>
                {isPublished ? <CheckIcon /> : <EditIcon />}
                <span className="hidden sm:inline">{isPublished ? T.statusPublished : T.statusDraft}</span>
                <i className="bi bi-chevron-down text-xs"></i>
            </button>
            {isOpen && (<div className="absolute end-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-md shadow-lg z-10 border border-[var(--border-secondary)]"><ul className="py-1"><li><a href="#" onClick={(e) => { e.preventDefault(); onStatusChange('draft'); }} className="flex items-center space-x-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><EditIcon className="text-yellow-600 dark:text-yellow-400" /> <span>{T.statusDraft}</span></a></li><li><a href="#" onClick={(e) => { e.preventDefault(); onStatusChange('published'); }} className="flex items-center space-x-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"><CheckIcon className="text-green-600 dark:text-green-400" /> <span>{T.statusPublished}</span></a></li></ul></div>)}
        </div>
    );
};

interface PreviewContentProps { htmlContent: string; title: string; settings: Settings; zoom: number; iframeRef: React.RefObject<HTMLIFrameElement>; }
const PreviewContent: React.FC<PreviewContentProps> = ({ htmlContent, title, settings, zoom, iframeRef }) => (
    <div className="my-8 origin-top transition-transform duration-200 ease-in-out flex-shrink-0" style={{ transform: `scale(${zoom})`, width: settings.paperSize === 'A4' ? '210mm' : settings.paperSize === 'F4' ? '215mm' : '216mm' }}>
        <iframe ref={iframeRef} srcDoc={htmlContent} title={title} className="w-full shadow-2xl" style={{ height: settings.paperSize === 'A4' ? '297mm' : settings.paperSize === 'F4' ? '330mm' : settings.paperSize === 'Legal' ? '356mm' : '279mm' }} />
    </div>
);

const SaveStatusIndicator: React.FC<{ status: 'saved' | 'saving' | 'unsaved' }> = ({ status }) => {
    if (status === 'unsaved') return <div className="w-8 h-8" />;
    const statusMap = { saving: { icon: (<div className="flex items-center justify-center w-full h-full"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" /></div>), message: 'Menyimpan...' }, saved: { icon: <CheckIcon className="text-lg text-green-500" />, message: 'Semua perubahan disimpan' } };
    const { icon, message } = statusMap[status];
    return (<div className="relative group flex items-center justify-center w-8 h-8" title={message}>{icon}<div className="absolute bottom-full mb-2 w-max bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg border border-[var(--border-primary)]">{message}</div></div>);
};

const EditorView: React.FC<{ examId: string; onBack: () => void }> = ({ examId, onBack }) => {
    const [exam, setExam, undo, redo, canUndo, canRedo] = useHistoryState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'key'>('editor');
    const [isStatusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [isBankSelectorOpen, setBankSelectorOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const bankSubjectRef = useRef<HTMLInputElement>(null);
    const bankClassRef = useRef<HTMLInputElement>(null);
    const [zoom, setZoom] = useState(1);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const { showConfirm } = useModal();
    const { addToast } = useToast();
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const isInitialMount = useRef(true);
    
    const T_UI = translations.ltr;
    const T_Editor = exam ? translations[exam.direction] : translations.ltr;

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [loadedExam, loadedSettings] = await Promise.all([getExam(examId), getSettings()]);
                if (loadedExam) {
                    setExam(loadedExam);
                    setSettings(loadedSettings);
                } else {
                    addToast("Ujian tidak ditemukan.", "error");
                    onBack();
                }
            } catch (error) {
                console.error("Gagal memuat data editor:", error);
                addToast("Gagal memuat data ujian.", "error");
                onBack();
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [examId, onBack, setExam, addToast]);

    useEffect(() => {
        if (isInitialMount.current || !exam || isLoading) {
            isInitialMount.current = false;
            return;
        }
        setSaveStatus('unsaved');
        const handler = setTimeout(async () => {
            if (exam) {
                setSaveStatus('saving');
                try {
                    await saveExam(exam);
                    setTimeout(() => setSaveStatus('saved'), 500);
                } catch (error) {
                    console.error("Gagal menyimpan otomatis:", error);
                    addToast("Gagal menyimpan perubahan.", "error");
                    setSaveStatus('unsaved');
                }
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [exam, isLoading, addToast]);


    useEffect(() => {
        if ((activeTab !== 'preview' && activeTab !== 'key') || !settings || !previewContainerRef.current) return;
        const calculateZoom = () => {
            if (!previewContainerRef.current || !settings) return;
            const paperWidthMap = { 'A4': 210, 'F4': 215, 'Legal': 216, 'Letter': 216 };
            const containerStyles = window.getComputedStyle(previewContainerRef.current);
            const paddingX = parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight);
            const containerWidth = previewContainerRef.current.clientWidth - paddingX;
            const paperWidthPx = paperWidthMap[settings.paperSize] * 3.78;
            setZoom(containerWidth < paperWidthPx ? containerWidth / paperWidthPx : 1);
        };
        const timer = setTimeout(calculateZoom, 100);
        window.addEventListener('resize', calculateZoom);
        return () => { clearTimeout(timer); window.removeEventListener('resize', calculateZoom); };
    }, [settings, activeTab]);

    const examHtml = useMemo(() => exam && settings ? generateHtmlContent(exam, settings, 'exam', false) : '', [exam, settings]);
    const answerKeyHtml = useMemo(() => exam && settings ? generateHtmlContent(exam, settings, 'answer_key', false) : '', [exam, settings]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setStatusDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExamChange = useCallback((field: keyof Exam, value: any) => setExam(p => p ? { ...p, [field]: value } : null), [setExam]);
    const handleStatusChange = useCallback((newStatus: 'draft' | 'published') => { handleExamChange('status', newStatus); setStatusDropdownOpen(false); }, [handleExamChange]);
    const updateSection = useCallback((sectionId: string, field: keyof Section, value: any) => setExam(p => p ? { ...p, sections: p.sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s) } : null), [setExam]);
    const addSection = useCallback(() => setExam(p => p ? { ...p, sections: [...p.sections, { id: crypto.randomUUID(), instructions: `${toRoman(p.sections.length + 1)}. (Instruksi...)`, questions: [] }] } : null), [setExam]);

    const deleteSection = useCallback((sectionId: string) => {
        showConfirm({ title: 'Hapus Bagian Soal', content: 'Yakin hapus bagian ini dan semua soal di dalamnya?', confirmVariant: 'danger', confirmLabel: 'Hapus', onConfirm: () => setExam(p => p ? { ...p, sections: p.sections.filter(s => s.id !== sectionId) } : null) });
    }, [showConfirm, setExam]);

    const addQuestion = useCallback((sectionId: string, type: QuestionType) => {
        setExam(prev => {
            if (!prev) return null;
            const totalQuestionsBefore = prev.sections.slice(0, prev.sections.findIndex(s => s.id === sectionId)).reduce((acc, curr) => acc + curr.questions.length, 0);
            const sectionQuestionCount = prev.sections.find(s => s.id === sectionId)?.questions.length || 0;
            const newQuestion: Question = { id: crypto.randomUUID(), number: String(totalQuestionsBefore + sectionQuestionCount + 1), type, text: '' };
            // Initialize fields based on type
            if (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.COMPLEX_MULTIPLE_CHOICE) { newQuestion.choices = [{ id: crypto.randomUUID(), text: '' }]; newQuestion.answerKey = type === QuestionType.MULTIPLE_CHOICE ? '' : []; }
            else if (type === QuestionType.TRUE_FALSE) { newQuestion.answerKey = 'true'; }
            else if (type === QuestionType.ESSAY) { newQuestion.hasAnswerSpace = true; }
            else if (type === QuestionType.MATCHING) { newQuestion.matchingPrompts = [{id: crypto.randomUUID(), text: ''}]; newQuestion.matchingAnswers = [{id: crypto.randomUUID(), text: ''}]; newQuestion.matchingKey = []; }
            else if (type === QuestionType.TABLE || type === QuestionType.TABLE_MULTIPLE_CHOICE || type === QuestionType.TABLE_COMPLEX_MULTIPLE_CHOICE) {
                 const rows = [{ id: crypto.randomUUID(), cells: [{ id: crypto.randomUUID(), content: '' }, { id: crypto.randomUUID(), content: '' }] }, { id: crypto.randomUUID(), cells: [{ id: crypto.randomUUID(), content: '' }, { id: crypto.randomUUID(), content: '' }] }];
                 newQuestion.tableData = { rows, rowHeights: [null, null], columnWidths: [null, null] };
                 if (type.includes('Pilihan Ganda')) { newQuestion.choices = [{ id: crypto.randomUUID(), text: '' }]; newQuestion.tableChoiceAnswerKey = {}; } else { newQuestion.tableAnswerKey = {}; }
            }
            let updatedSections = prev.sections.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s);
            const targetSection = updatedSections.find(s => s.id === sectionId);
            if (targetSection?.questions.length === 1) {
                const autoInstruction = translations[prev.direction].instructionMap[type];
                if (autoInstruction) {
                    const romanPart = targetSection.instructions.split('.')[0];
                    updatedSections = updatedSections.map(s => s.id === sectionId ? {...s, instructions: `${romanPart}. ${autoInstruction}`} : s);
                }
            }
            return { ...prev, sections: updatedSections };
        });
    }, [setExam]);
    
    const updateQuestion = useCallback((sectionId: string, qId: string, field: keyof Question, val: any) => setExam(p => p ? { ...p, sections: p.sections.map(s => s.id === sectionId ? { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, [field]: val } : q) } : s) } : null), [setExam]);
    const deleteQuestion = useCallback((sectionId: string, qId: string) => setExam(p => p ? { ...p, sections: p.sections.map(s => s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== qId) } : s) } : null), [setExam]);
    const handleAddQuestionsFromBank = useCallback((sectionId: string) => { setTargetSectionId(sectionId); setBankSelectorOpen(true); }, []);
    
    const handleSaveToBank = useCallback(async (question: Question) => {
        if (!exam) return;
        showConfirm({
            title: "Simpan ke Bank Soal",
            content: (<div className="space-y-4 text-left"><p className="text-sm text-[var(--text-secondary)]">Lengkapi info berikut.</p><div><label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Mata Pelajaran</label><input ref={bankSubjectRef} defaultValue={exam.subject} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div><div><label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Kelas</label><input ref={bankClassRef} defaultValue={exam.class} className="p-2 border border-[var(--border-secondary)] rounded-md w-full bg-[var(--bg-secondary)]" /></div></div>),
            confirmLabel: "Simpan",
            onConfirm: async () => {
                const subject = bankSubjectRef.current?.value || exam.subject || '';
                const classVal = bankClassRef.current?.value || exam.class || '';
                try {
                    await saveQuestionToBank(question, { subject, class: classVal });
                    addToast('Soal berhasil disimpan ke Bank Soal.', 'success');
                } catch (error) {
                    addToast('Gagal menyimpan soal ke bank.', 'error');
                }
            }
        });
    }, [exam, addToast, showConfirm]);

    const addClonedQuestionsToSection = (questions: Question[]) => {
        if (!targetSectionId) return;
        const clonedQuestions = questions.map(q => ({...JSON.parse(JSON.stringify(q)), id: crypto.randomUUID() }));
        setExam(prev => {
            if (!prev) return null;
            let questionCounter = 0;
            const newSections = prev.sections.map(s => {
                let sectionWithNewQuestions = s.id === targetSectionId ? { ...s, questions: [...s.questions, ...clonedQuestions] } : { ...s };
                sectionWithNewQuestions.questions = sectionWithNewQuestions.questions.map(q => ({ ...q, number: String(++questionCounter) }));
                return sectionWithNewQuestions;
            });
            return { ...prev, sections: newSections };
        });
        setBankSelectorOpen(false);
        setTargetSectionId(null);
    };
    
    const handleManualSave = async () => {
        if (exam) {
            try {
                await saveExam(exam);
                setSaveStatus('saved');
                addToast('Ujian berhasil disimpan.', 'success');
            } catch (error) {
                addToast('Gagal menyimpan ujian.', 'error');
            }
        }
    };
    
    const handleBack = () => {
        if (saveStatus !== 'saved' && exam) {
            saveExam(exam); // Fire and forget
            addToast('Perubahan terakhir disimpan.', 'info');
        }
        onBack();
    };

    if (isLoading || !exam || !settings) {
        return <div className="flex h-screen items-center justify-center">Memuat Editor...</div>;
    }
    
    const editorCallbacks = { onSectionUpdate: updateSection, onSectionDelete: deleteSection, onQuestionAdd: addQuestion, onQuestionUpdate: updateQuestion, onQuestionDelete: deleteQuestion, onSaveToBank: handleSaveToBank, onAddQuestionsFromBank: handleAddQuestionsFromBank };

    return (
    <div>
        {isBankSelectorOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]"><h2 className="text-xl font-bold text-[var(--text-primary)]">Pilih Soal dari Bank</h2><button onClick={() => setBankSelectorOpen(false)} aria-label="Tutup pemilih bank soal" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"><CloseIcon /></button></div>
                    <div className="flex-grow overflow-y-auto"><QuestionBankView isModalMode={true} onAddQuestions={addClonedQuestionsToSection} onClose={() => setBankSelectorOpen(false)} /></div>
                </div>
            </div>
        )}
        <div className="sticky top-0 z-20 print:hidden">
            <header className="bg-[var(--bg-secondary)] shadow-lg border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex-1 flex justify-start items-center gap-1"><button onClick={handleBack} className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] font-semibold py-2 px-3 rounded-lg transition-all duration-200"><ChevronLeftIcon className="text-xl" /><span className="hidden sm:inline">{T_UI.backToArchive}</span></button><div className="sm:hidden flex items-center"><button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full disabled:opacity-30 disabled:cursor-not-allowed"><UndoIcon className="text-xl"/></button><button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full disabled:opacity-30 disabled:cursor-not-allowed"><RedoIcon className="text-xl"/></button></div></div>
                    <div className="flex-shrink-0"><div className="sm:hidden"><SaveStatusIndicator status={saveStatus} /></div><div className="hidden sm:flex items-center gap-2"><button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full disabled:opacity-30 disabled:cursor-not-allowed"><UndoIcon className="text-xl"/></button><button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full disabled:opacity-30 disabled:cursor-not-allowed"><RedoIcon className="text-xl"/></button></div></div>
                    <div className="flex-1 flex justify-end"><div className="flex items-center space-x-2"><div className="hidden sm:block"><SaveStatusIndicator status={saveStatus} /></div><StatusButton status={exam.status} isOpen={isStatusDropdownOpen} setIsOpen={setStatusDropdownOpen} onStatusChange={handleStatusChange} dropdownRef={statusDropdownRef} T={T_UI} /><button onClick={handleManualSave} className="flex items-center space-x-2 bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 h-full"><SaveIcon className="text-lg" /><span className="hidden sm:inline">{T_UI.save}</span></button></div></div>
                </div>
            </header>
            <div className="bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)] shadow-sm">
                <div className="container mx-auto"><ul className="flex justify-center -mb-px text-sm font-medium text-center">{[{ id: 'editor', label: T_UI.tabEditor, icon: EditIcon }, { id: 'preview', label: T_UI.tabPreview, icon: PrinterIcon }, { id: 'key', label: T_UI.tabAnswerKey, icon: CheckIcon }].map(tab => (<li className="mx-2" key={tab.id}><button onClick={() => setActiveTab(tab.id as any)} className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${activeTab === tab.id ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300 dark:hover:border-gray-600'}`}><tab.icon className={`me-2 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} /><span className="hidden md:inline">{tab.label}</span></button></li>))}</ul></div>
            </div>
        </div>
        <main>
            <div className={activeTab === 'editor' ? 'block' : 'hidden'}><div className="container mx-auto"><EditorPane exam={exam} T={T_Editor} onExamChange={handleExamChange} onSectionAdd={addSection} {...editorCallbacks} /></div></div>
            <div ref={previewContainerRef} className={`bg-slate-200 dark:bg-slate-950 overflow-auto p-4 sm:p-8 flex justify-center ${(activeTab === 'preview' || activeTab === 'key') ? 'block' : 'hidden'}`}>
                {activeTab === 'preview' && <PreviewContent htmlContent={examHtml} title="Pratinjau Soal" settings={settings} zoom={zoom} iframeRef={iframeRef} />}
                {activeTab === 'key' && <PreviewContent htmlContent={answerKeyHtml} title="Pratinjau Kunci Jawaban" settings={settings} zoom={zoom} iframeRef={iframeRef} />}
            </div>
        </main>
        {(activeTab === 'preview' || activeTab === 'key') && (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-full p-1 space-x-2"><button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} aria-label="Perkecil" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"><ZoomOutIcon className="text-xl" /></button><span className="text-[var(--text-primary)] font-semibold w-12 text-center text-sm">{(zoom * 100).toFixed(0)}%</span><button onClick={() => setZoom(z => Math.min(2, z + 0.1))} aria-label="Perbesar" className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full"><ZoomInIcon className="text-xl" /></button></div>)}
    </div>
    );
};

export default EditorView;