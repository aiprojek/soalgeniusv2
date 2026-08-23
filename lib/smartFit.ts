import { Exam, Settings, QuestionType } from '../types';

export interface FitPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  fontSize: number;
  lineSpacing: number;
  margins: { top: number; right: number; bottom: number; left: number };
  layoutColumns: 1 | 2;
  compactChoices?: boolean;
}

export const SMART_FIT_PRESETS: FitPreset[] = [
  {
    id: 'standard',
    name: 'Standar / Longgar',
    description: 'Ukuran font besar dan spasi lega, cocok untuk ujian SD atau naskah dengan sedikit soal.',
    badge: 'Lega',
    fontSize: 12,
    lineSpacing: 1.15,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    layoutColumns: 1,
    compactChoices: false
  },
  {
    id: 'balanced',
    name: 'Rapi & Seimbang',
    description: 'Format standar ujian SMP/SMA dengan keterbacaan tinggi dan proporsi kertas seimbang.',
    badge: 'Standar',
    fontSize: 11,
    lineSpacing: 1.1,
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    layoutColumns: 1,
    compactChoices: false
  },
  {
    id: 'compact_2page',
    name: 'Kompak Hemat Kertas',
    description: 'Mengoptimalkan margin dan spasi agar muat pas 2 halaman (1 lembar bolak-balik).',
    badge: 'Hemat',
    fontSize: 10.5,
    lineSpacing: 1.05,
    margins: { top: 12, right: 12, bottom: 12, left: 12 },
    layoutColumns: 1,
    compactChoices: true
  },
  {
    id: 'ultra_compact',
    name: 'Maksimal Hemat (2 Kolom)',
    description: 'Layout 2 kolom dengan spasi padat untuk naskah soal banyak (hemat hingga 50% lembar fotokopi).',
    badge: '2 Kolom',
    fontSize: 10,
    lineSpacing: 1.0,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    layoutColumns: 2,
    compactChoices: true
  }
];

export interface OptimizationResult {
  targetPages: number;
  fontSize: number;
  lineSpacing: number;
  margins: { top: number; right: number; bottom: number; left: number };
  layoutColumns: 1 | 2;
  compactChoices: boolean;
  strategySummary: string;
}

/**
 * Calculates optimal parameters to compress or expand exam formatting towards a target page count.
 */
export function calculateSmartPageFit(
  exam: Exam,
  currentSettings: Settings,
  currentPageCount: number,
  targetPageCount: number
): OptimizationResult {
  const diff = currentPageCount - targetPageCount;
  
  // Count questions & characteristics
  let totalQuestions = 0;
  let mcCount = 0;
  let hasLongQuestions = false;

  (exam.sections || []).forEach(sec => {
    (sec.questions || []).forEach(q => {
      totalQuestions++;
      if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) {
        mcCount++;
      }
      if (q.text && q.text.length > 250) {
        hasLongQuestions = true;
      }
    });
  });

  // Base starting point
  let targetFontSize = currentSettings.fontSize || 12;
  let targetLineSpacing = currentSettings.lineSpacing || 1.1;
  let targetMargin = currentSettings.margins?.top || 15;
  let targetLayoutColumns: 1 | 2 = exam.layoutColumns || 1;
  let targetCompactChoices = false;
  let strategy = '';

  if (diff > 0) {
    // We need to compress content to fit in fewer pages
    if (diff === 1) {
      // Minor compression: reduce margins, tight spacing, slight font decrease
      if (targetMargin > 12) targetMargin = 12;
      else targetMargin = 10;

      if (targetLineSpacing > 1.05) targetLineSpacing = 1.05;
      else targetLineSpacing = 1.0;

      if (targetFontSize > 11) targetFontSize = 11;
      else if (targetFontSize > 10) targetFontSize = 10;
      else targetFontSize = 9.5;

      targetCompactChoices = true;
      strategy = 'Menyusutkan margin menjadi 10-12mm, merapatkan spasi ke 1.05, dan menyesuaikan font ke ' + targetFontSize + 'pt.';
    } else if (diff === 2) {
      // Moderate compression: 2-columns layout if lots of MCQs or strong compression
      if (totalQuestions >= 15 && mcCount >= 10 && !hasLongQuestions) {
        targetLayoutColumns = 2;
        targetFontSize = 10;
        targetLineSpacing = 1.0;
        targetMargin = 10;
        targetCompactChoices = true;
        strategy = 'Mengaktifkan layout 2 Kolom, font 10pt, dan margin 10mm untuk kompresi maksimal.';
      } else {
        targetFontSize = 9.5;
        targetLineSpacing = 1.0;
        targetMargin = 10;
        targetCompactChoices = true;
        strategy = 'Merampingkan font ke 9.5pt, spasi 1.0, dan margin 10mm serta meratakan pilihan ganda.';
      }
    } else {
      // Extreme compression: 2-columns layout, tightest readable formatting
      targetLayoutColumns = 2;
      targetFontSize = 9.5;
      targetLineSpacing = 1.0;
      targetMargin = 9;
      targetCompactChoices = true;
      strategy = 'Menerapkan mode ultra-kompak 2 Kolom dengan font 9.5pt dan spasi 1.0.';
    }
  } else if (diff < 0) {
    // Content is sparse, expand to fill pages comfortably
    targetLayoutColumns = 1;
    targetFontSize = Math.min(13, targetFontSize + 1);
    targetLineSpacing = Math.min(1.25, targetLineSpacing + 0.1);
    targetMargin = Math.min(22, targetMargin + 3);
    targetCompactChoices = false;
    strategy = 'Memperbesar ukuran font dan memperluas spasi serta margin agar naskah lebih lega dan mudah dibaca.';
  } else {
    // Exact match: refine slightly for neat presentation
    strategy = 'Format saat ini sudah sesuai target. Pengaturan dioptimalkan untuk keterbacaan terbaik.';
  }

  return {
    targetPages: targetPageCount,
    fontSize: Math.round(targetFontSize * 10) / 10,
    lineSpacing: Math.round(targetLineSpacing * 100) / 100,
    margins: {
      top: targetMargin,
      right: targetMargin,
      bottom: targetMargin,
      left: targetMargin
    },
    layoutColumns: targetLayoutColumns,
    compactChoices: targetCompactChoices,
    strategySummary: strategy
  };
}
