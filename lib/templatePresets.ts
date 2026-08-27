import type { Exam, Settings } from '../types';

export interface TemplatePresetMeta {
  id: 'standard' | 'madrasah' | 'kemendikbud' | 'cambridge' | 'minimal';
  name: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  icon: string;
  description: string;
  highlights: string[];
  settings: Partial<Settings>;
  sampleHeaderLines?: string[];
}

export const TEMPLATE_PRESETS: TemplatePresetMeta[] = [
  {
    id: 'kemendikbud',
    name: 'Kurikulum Merdeka',
    subtitle: 'Kemendikbudristek / Asesmen Sumatif',
    tag: 'Rekomendasi Umum',
    tagColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    icon: 'bi-mortarboard-fill',
    description: 'Format penilaian modern dengan tipografi sans-serif bersih, kotak stimulus literasi/numerasi berbingkai modern (callout card), dan label asesmen sumatif.',
    highlights: [
      'Font modern & tajam (Liberation Sans)',
      'Kotak stimulus literasi/numerasi bergaya card',
      'Pemisah garis modern dengan aksen elegan',
      'Cocok untuk SD, SMP, SMA/SMK Negeri & Swasta'
    ],
    settings: {
      templatePreset: 'kemendikbud',
      fontFamily: 'Liberation Sans',
      fontSize: 11,
      lineSpacing: 1.15,
      headerStyle: 'kemendikbud',
      stimulusStyle: 'modern_card',
      dividerStyle: 'modern',
      showBasmalah: false,
      showHamdalah: false,
      arabicOptionStyle: 'latin',
      showPointsBadge: false,
      margins: { top: 18, right: 18, bottom: 18, left: 18 },
    },
    sampleHeaderLines: [
      'PEMERINTAH PROVINSI / KABUPATEN',
      'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      'ASESMEN SUMATIF AKHIR SEMESTER (ASAS) / ASAT',
      'KURIKULUM MERDEKA'
    ]
  },
  {
    id: 'madrasah',
    name: 'Kemenag & Madrasah',
    subtitle: 'MI / MTs / MA / Pondok Pesantren',
    tag: 'Islami & Arab Ready',
    tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    icon: 'bi-moon-stars-fill',
    description: 'Format naskah resmi Kemenag lengkap dengan teks Basmalah kaligrafi di atas nomor 1, Hamdalah penutup di akhir, opsi pilihan ganda Hijaiyah (أ, ب, ج, د, هـ), dan font Arab proporsional.',
    highlights: [
      'Teks Basmalah & Hamdalah otomatis',
      'Opsi Pilihan Ganda Hijaiyah (أ, ب, ج, د, هـ) atau Latin',
      'Font bersanad Amiri / Scheherazade dengan spasi harakat lega',
      'Kop khas Madrasah & Kementerian Agama'
    ],
    settings: {
      templatePreset: 'madrasah',
      fontFamily: 'Amiri',
      fontSize: 12,
      lineSpacing: 1.25,
      headerStyle: 'madrasah',
      stimulusStyle: 'bordered',
      dividerStyle: 'double',
      showBasmalah: true,
      showHamdalah: true,
      arabicOptionStyle: 'hijaiyah',
      showPointsBadge: false,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    sampleHeaderLines: [
      'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
      'KANTOR KEMENTERIAN AGAMA KABUPATEN/KOTA',
      'MADRASAH TSANAWIYAH / ALIYAH NEGERI',
      'PENILAIAN AKHIR TAHUN / ASESMEN MADRASAH'
    ]
  },
  {
    id: 'cambridge',
    name: 'Cambridge & Internasional',
    subtitle: 'IGCSE / Checkpoint / Bilingual School',
    tag: 'Standar Global',
    tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    icon: 'bi-globe-americas',
    description: 'Tata letak ujian formal berstandar internasional dengan kotak isian *Candidate Name, Centre Number, Candidate Number*, garis pembatas tegas, dan alokasi skor [marks] per butir soal.',
    highlights: [
      'Kotak isian Candidate Name & Number resmi',
      'Alokasi poin/marks di setiap butir soal',
      'Tipografi serif klasik berwibawa (Liberation Serif)',
      'Cocok untuk Sekolah SPK, Bilingual, & Ujian Sertifikasi'
    ],
    settings: {
      templatePreset: 'cambridge',
      fontFamily: 'Liberation Serif',
      fontSize: 11,
      lineSpacing: 1.15,
      headerStyle: 'cambridge',
      stimulusStyle: 'bordered',
      dividerStyle: 'solid',
      showBasmalah: false,
      showHamdalah: false,
      arabicOptionStyle: 'latin',
      showPointsBadge: true,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    sampleHeaderLines: [
      'INTERNATIONAL BILINGUAL ASSESSMENT',
      'CAMBRIDGE CURRICULUM EXAMINATION',
      'PAPER 1: THEORY & OBJECTIVE QUESTIONS',
      'SESSION EXAMINATION'
    ]
  },
  {
    id: 'standard',
    name: 'Klasik Dinas & Ujian Nasional',
    subtitle: 'Format Formal Tradisional Indonesia',
    tag: 'Klasik Resmi',
    tagColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    icon: 'bi-building-fill',
    description: 'Format kop dinas tradisional 2 logo dengan garis pembatas ganda tebal-tipis, tabel identitas siswa terstruktur dengan kotak nilai guru di sisi kanan.',
    highlights: [
      'Garis ganda (double-rule) kop dinas tradisional',
      'Tabel identitas siswa lengkap dengan kotak paraf/nilai',
      'Struktur naskah baku terbukti sesuai regulasi ujian dinas',
      'Format standar paling umum dan familiar'
    ],
    settings: {
      templatePreset: 'standard',
      fontFamily: 'Liberation Serif',
      fontSize: 12,
      lineSpacing: 1.1,
      headerStyle: 'standard',
      stimulusStyle: 'bordered',
      dividerStyle: 'double',
      showBasmalah: false,
      showHamdalah: false,
      arabicOptionStyle: 'latin',
      showPointsBadge: false,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    sampleHeaderLines: [
      'PEMERINTAH KABUPATEN / KOTA',
      'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      'SEKOLAH MENENGAH PERTAMA / ATAS',
      'PENILAIAN AKHIR SEMESTER (PAS)'
    ]
  },
  {
    id: 'minimal',
    name: 'Eco-Compact (Hemat Kertas)',
    subtitle: 'Ultra-Efisien / Ulangan Harian & Kuis',
    tag: 'Hemat Fotokopi',
    tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    icon: 'bi-tree-fill',
    description: 'Tata letak ultra-ramping dengan margin minimalis, header 1 baris, dan spasi padat untuk memaksimalkan jumlah soal dan menghemat biaya kertas fotokopi sekolah.',
    highlights: [
      'Margin ramping (12mm) & spasi efisien',
      'Header terpadu 1 baris hemat ruang vertikal',
      'Mereduksi kebutuhan lembar kertas hingga 30-40%',
      'Sangat ideal untuk ulangan harian, kuis singkat & tryout'
    ],
    settings: {
      templatePreset: 'minimal',
      fontFamily: 'Liberation Sans',
      fontSize: 10.5,
      lineSpacing: 1.05,
      headerStyle: 'minimal',
      stimulusStyle: 'minimal',
      dividerStyle: 'solid',
      showBasmalah: false,
      showHamdalah: false,
      arabicOptionStyle: 'latin',
      showPointsBadge: false,
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
    }
  }
];

export function getPresetById(presetId?: string): TemplatePresetMeta {
  return TEMPLATE_PRESETS.find(p => p.id === presetId) || TEMPLATE_PRESETS[0];
}

export function applyPresetToSettings(
  currentSettings: Settings,
  presetId: 'standard' | 'madrasah' | 'kemendikbud' | 'cambridge' | 'minimal',
  options?: { updateHeaderLines?: boolean }
): Settings {
  const preset = getPresetById(presetId);
  
  const updated: Settings = {
    ...currentSettings,
    ...preset.settings,
  };

  if (options?.updateHeaderLines && preset.sampleHeaderLines && preset.sampleHeaderLines.length > 0) {
    updated.examHeaderLines = preset.sampleHeaderLines.map(text => ({
      id: crypto.randomUUID(),
      text,
      sizeMode: 'auto',
      sizePt: 12,
    }));
  }

  return updated;
}
