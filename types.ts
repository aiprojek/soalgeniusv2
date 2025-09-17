export enum QuestionType {
  MULTIPLE_CHOICE = 'Pilihan Ganda',
  COMPLEX_MULTIPLE_CHOICE = 'Pilihan Ganda Kompleks',
  ESSAY = 'Esai / Uraian',
  SHORT_ANSWER = 'Isian Singkat',
  MATCHING = 'Menjodohkan',
  TRUE_FALSE = 'Benar-Salah',
  TABLE = 'Tabel Isian',
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface MatchingItem {
  id: string;
  text: string;
}

export interface TableCellData {
  id: string;
  content: string;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  colspan?: number;
  rowspan?: number;
  isMerged?: boolean;
}

export interface TableRowData {
  id: string;
  cells: TableCellData[];
}

export interface TableData {
  rows: TableRowData[];
  rowHeights?: (number | null)[];
  columnWidths?: (number | null)[];
}

// A single unified Question interface
export interface Question {
  id: string;
  number: string; // Editable number
  type: QuestionType;
  text: string;
  // Options for different types
  choices?: MultipleChoiceOption[];      // For MC, Complex MC
  matchingPrompts?: MatchingItem[];    // For Matching
  matchingAnswers?: MatchingItem[];    // For Matching
  tableData?: TableData;                 // For Table
  // Settings
  hasAnswerSpace?: boolean;              // For Essay
  subQuestions?: Question[];             // For Essay, Short Answer
  isTwoColumns?: boolean;                // For MC, Complex MC
  // Answer Key
  answerKey?: string | string[];         // For MC (string of choice id), Complex MC (string[] of choice ids), Short Answer (string), Essay (string), True/False (string: 'true'/'false')
  matchingKey?: { promptId: string; answerId: string }[];
  tableAnswerKey?: Record<string, string>; // For Table, maps cell id to answer string
}

export interface Section {
  id: string;
  instructions: string;
  questions: Question[];
}

export interface Exam {
  id:string;
  title: string;
  subject: string;
  date: string;
  class: string;
  instructions: string; // General instructions
  waktuUjian: string;
  keterangan: string;
  sections: Section[]; // Replaces 'questions'
  status: 'draft' | 'published';
  direction: 'ltr' | 'rtl';
  layoutColumns: 1 | 2;
}

export interface Settings {
  examHeaderLines: { id: string; text: string }[];
  logos: [string | null, string | null]; // [leftLogo, rightLogo]
  paperSize: 'A4' | 'F4' | 'Legal' | 'Letter';
  margins: { top: number; right: number; bottom: number; left: number }; // in mm
  lineSpacing: number;
  fontFamily: 'Liberation Serif' | 'Liberation Sans' | 'Amiri' | 'Areef Ruqaa';
  fontSize: number;
}

export interface BankQuestion {
  bankId: string;
  question: Question;
  subject: string;
  class: string;
  createdAt: string;
}