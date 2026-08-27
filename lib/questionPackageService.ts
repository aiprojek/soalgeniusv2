import type { Question, QuestionPackage, BankQuestion } from '../types';
import { QuestionType } from '../types';

export const STARTER_COMMUNITY_PACKAGES: QuestionPackage[] = [
    {
        id: 'pkg-literasi-smp-2024',
        title: 'Paket Asesmen Literasi & Numerasi SMP (Kurikulum Merdeka)',
        description: 'Koleksi stimulus literasi sains, numerasi grafis, dan penalaran kritis untuk siswa Fase D (Kelas 7-9).',
        subject: 'Literasi & Numerasi',
        grade: 'Fase D (Kelas 7-9)',
        curriculum: 'Kurikulum Merdeka',
        author: 'Komunitas Guru Penggerak',
        institution: 'MGMP Kabupaten / Kota',
        tags: ['Literasi', 'Numerasi', 'Fase D', 'HOTS'],
        version: '1.2.0',
        createdAt: '2024-11-15T08:00:00.000Z',
        questions: [
            {
                id: 'demo-lit-1',
                number: '1',
                type: QuestionType.STIMULUS,
                text: '<p><strong>WACANA 1: KETAHANAN PANGAN LOKAL DAN PERUBAHAN IKLIM</strong></p><p>Perubahan iklim global memicu anomali cuaca berkepanjangan di berbagai belahan dunia. Diversifikasi pangan berbasis komoditas lokal seperti singkong, ubi jalar, sorgum, dan sagu menjadi langkah strategis guna mengurangi ketergantungan pada gandum impor. Selain kaya serat, tanaman pangan lokal memiliki ketahanan yang lebih baik terhadap kekeringan.</p>',
            },
            {
                id: 'demo-lit-2',
                number: '2',
                type: QuestionType.COMPLEX_MULTIPLE_CHOICE,
                text: '<p>Berdasarkan Wacana 1, manakah pernyataan berikut yang <strong>BENAR</strong> mengenai manfaat diversifikasi pangan lokal? <em>(Pilihan boleh lebih dari satu)</em></p>',
                choices: [
                    { id: 'c1', text: '<p>Mengurangi beban impor gandum nasional.</p>' },
                    { id: 'c2', text: '<p>Tanaman lokal lebih rentan terhadap kekeringan dibanding gandum.</p>' },
                    { id: 'c3', text: '<p>Memperkuat ketahanan pangan masyarakat di tengah anomali cuaca.</p>' },
                    { id: 'c4', text: '<p>Menggantikan seluruh kebutuhan energi tanpa perlu karbohidrat.</p>' },
                ],
                answerKey: ['c1', 'c3']
            },
            {
                id: 'demo-lit-3',
                number: '3',
                type: QuestionType.TRUE_FALSE,
                text: '<p>Pengembangan sorgum dan ubi jalar efektif dilakukan karena tanaman tersebut memiliki adaptasi tinggi terhadap kondisi lahan kering.</p>',
                answerKey: 'true'
            },
            {
                id: 'demo-lit-4',
                number: '4',
                type: QuestionType.ESSAY,
                text: '<p>Jelaskan langkah konkret yang dapat dilakukan oleh generasi muda di lingkungan sekolah untuk mengampanyekan konsumsi pangan lokal yang bernilai gizi tinggi!</p>',
                hasAnswerSpace: true
            }
        ]
    },
    {
        id: 'pkg-ipas-sd-fase-b',
        title: 'Paket Soal IPAS Fase B Kelas 4 SD (Siklus Hidup & Energi)',
        description: 'Paket latihan soal Ilmu Pengetahuan Alam dan Sosial (IPAS) topik metamorfosis, gaya, dan transformasi energi.',
        subject: 'IPAS (Sains & Sosial)',
        grade: 'Fase B (Kelas 4 SD)',
        curriculum: 'Kurikulum Merdeka',
        author: 'Tim Guru KKG SD Inovatif',
        institution: 'KKG Gugus Sekolah Dasar',
        tags: ['IPAS', 'Kelas 4', 'Sains', 'Siklus Hidup'],
        version: '1.0.0',
        createdAt: '2024-10-20T09:30:00.000Z',
        questions: [
            {
                id: 'demo-ipas-1',
                number: '1',
                type: QuestionType.MULTIPLE_CHOICE,
                text: '<p>Tahapan metamorfosis kupu-kupu yang sering kali merugikan petani karena memakan dedaunan tanaman dengan sangat rakus adalah fase ...</p>',
                choices: [
                    { id: 'a1', text: '<p>Telur</p>' },
                    { id: 'a2', text: '<p>Ulat (Larva)</p>' },
                    { id: 'a3', text: '<p>Kepompong (Pupa)</p>' },
                    { id: 'a4', text: '<p>Kupu-kupu dewasa (Imago)</p>' },
                ],
                answerKey: 'a2'
            },
            {
                id: 'demo-ipas-2',
                number: '2',
                type: QuestionType.MATCHING,
                text: '<p>Pasangkan contoh benda dengan bentuk perubahan energi yang terjadi saat benda tersebut digunakan:</p>',
                matchingPrompts: [
                    { id: 'p1', text: 'Setrika Listrik' },
                    { id: 'p2', text: 'Kipas Angin' },
                    { id: 'p3', text: 'Panel Surya' }
                ],
                matchingAnswers: [
                    { id: 'ans1', text: 'Energi Listrik menjadi Energi Panas' },
                    { id: 'ans2', text: 'Energi Listrik menjadi Energi Gerak' },
                    { id: 'ans3', text: 'Energi Cahaya Matahari menjadi Energi Listrik' },
                    { id: 'ans4', text: 'Energi Kimia menjadi Energi Bunyi' }
                ],
                matchingKey: [
                    { promptId: 'p1', answerId: 'ans1' },
                    { promptId: 'p2', answerId: 'ans2' },
                    { promptId: 'p3', answerId: 'ans3' }
                ]
            }
        ]
    },
    {
        id: 'pkg-pai-madrasah-kemenag',
        title: 'Paket Asesmen PAI & Bahasa Arab (Standar Kemenag / Madrasah)',
        description: 'Kumpulan soal Pendidikan Agama Islam dan Bahasa Arab dengan kaligrafi, harakat, dan opsi penomoran Hijaiyah.',
        subject: 'PAI & Bahasa Arab',
        grade: 'Madrasah Tsanawiyah (MTs)',
        curriculum: 'Kemenag / Madrasah',
        author: 'MGMP PAI & Bahasa Arab',
        institution: 'Kelompok Kerja Madrasah (KKM)',
        tags: ['PAI', 'Bahasa Arab', 'Madrasah', 'Kemenag'],
        version: '2.0.0',
        createdAt: '2024-12-01T10:00:00.000Z',
        questions: [
            {
                id: 'demo-pai-1',
                number: '1',
                type: QuestionType.MULTIPLE_CHOICE,
                text: '<p>Perhatikan potongan ayat berikut:</p><p style="text-align: right; font-family: Amiri, serif; font-size: 1.25rem;">يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ</p><p>Hukum bacaan mad yang terdapat pada lafal <span style="font-family: Amiri, serif; font-weight: bold;">يَا أَيُّهَا</span> adalah ...</p>',
                choices: [
                    { id: 'h1', text: '<p>Mad Thabi\'i</p>' },
                    { id: 'h2', text: '<p>Mad Jaiz Munfashil</p>' },
                    { id: 'h3', text: '<p>Mad Wajib Muttashil</p>' },
                    { id: 'h4', text: '<p>Mad Iwadh</p>' },
                ],
                answerKey: 'h2'
            },
            {
                id: 'demo-pai-2',
                number: '2',
                type: QuestionType.SHORT_ANSWER,
                text: '<p>Sebutkan arti dari kata mufradat <span style="font-family: Amiri, serif; font-weight: bold;">المَدْرَسَةُ</span> dalam Bahasa Indonesia!</p>',
                answerKey: 'Sekolah'
            }
        ]
    }
];

export function createPackageBlob(pkg: QuestionPackage): Blob {
    const jsonString = JSON.stringify(pkg, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}

export function downloadPackageFile(pkg: QuestionPackage, filename?: string): void {
    const safeTitle = (pkg.title || 'paket_bank_soal').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalFilename = filename || `${safeTitle}.sgpkg`;
    const blob = createPackageBlob(pkg);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function parsePackageFile(file: File): Promise<QuestionPackage> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    // Validate basic structure
    if (!parsed || (!parsed.questions && !Array.isArray(parsed))) {
        throw new Error('Format berkas paket tidak valid. Berkas harus memuat data soal.');
    }

    if (Array.isArray(parsed)) {
        return {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            subject: 'Umum',
            createdAt: new Date().toISOString(),
            questions: parsed
        };
    }

    return {
        id: parsed.id || crypto.randomUUID(),
        title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
        description: parsed.description || '',
        subject: parsed.subject || 'Umum',
        grade: parsed.grade || '',
        curriculum: parsed.curriculum || '',
        author: parsed.author || '',
        institution: parsed.institution || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        version: parsed.version || '1.0.0',
        createdAt: parsed.createdAt || new Date().toISOString(),
        updatedAt: parsed.updatedAt,
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        metadata: parsed.metadata
    };
}
