import React, { useState, useMemo } from 'react';
import {
    StarsIcon, GlobeIcon, PaletteIcon, SparklesIcon, BookIcon,
    ShieldCheckIcon, StackIcon, DropboxIcon, LayoutSplitIcon,
    WordIcon, FileSpreadsheetIcon, QrCodeIcon, MoonStarsIcon,
    SearchIcon, CheckIcon, ServerIcon, FileCodeIcon, ArchiveIcon,
    BankIcon, BoldIcon, EditIcon
} from '../../components/Icons';
import type { View } from '../../App';
import type { HelpTab } from '../HelpView';

interface FeaturesTabProps {
    searchQuery?: string;
    onClearSearch?: () => void;
    onNavigate?: (view: View) => void;
    onSwitchTab?: (tab: HelpTab, query?: string) => void;
}

type FeatureCategory = 'ALL' | 'EDITOR' | 'PRINT' | 'LMS' | 'MGMP' | 'STORAGE';

interface FeatureCard {
    id: string;
    category: FeatureCategory;
    title: string;
    badge: string;
    badgeColor: string;
    icon: React.ElementType;
    description: string;
    highlights: string[];
    actionLabel?: string;
    actionView?: View;
    keywords: string[];
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ searchQuery = '', onClearSearch, onNavigate }) => {
    const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>('ALL');

    const categories: { id: FeatureCategory; label: string; icon: string }[] = [
        { id: 'ALL', label: 'Semua Kapabilitas', icon: 'bi-grid-fill' },
        { id: 'EDITOR', label: 'Editor & Tipe Soal', icon: 'bi-pencil-square' },
        { id: 'PRINT', label: 'Preset & Cetak', icon: 'bi-printer-fill' },
        { id: 'LMS', label: 'Ekspor LMS', icon: 'bi-hdd-network-fill' },
        { id: 'MGMP', label: 'Pusat MGMP', icon: 'bi-globe-americas' },
        { id: 'STORAGE', label: 'Arsip, Cloud & Privasi', icon: 'bi-shield-check' },
    ];

    const features: FeatureCard[] = [
        {
            id: 'mgmp-sharing',
            category: 'MGMP',
            title: 'Pusat Berbagi Soal MGMP (.sgpkg)',
            badge: 'Kolaborasi Guru',
            badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
            icon: GlobeIcon,
            description: 'Ekosistem pertukaran paket bank soal mandiri antar-sekolah atau komunitas guru tanpa akun atau server perantara.',
            highlights: [
                'Format .sgpkg portabel ringan (bagikan via WA / flashdisk)',
                'Filter cepat & pemilihan butir soal massal',
                'Dukungan kurikulum kustom / tulis nama kurikulum sendiri',
                'Privasi penuh: data tetap tersimpan di perangkat guru'
            ],
            actionLabel: 'Buka Pusat MGMP',
            actionView: 'community',
            keywords: ['mgmp', 'kkg', 'sgpkg', 'paket', 'komunitas', 'ekspor', 'impor', 'kurikulum']
        },
        {
            id: 'visual-preset-engine',
            category: 'PRINT',
            title: 'Preset Gaya Visual 1-Klik',
            badge: 'Estetika Otomatis',
            badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
            icon: PaletteIcon,
            description: 'Ganti seluruh tata letak naskah ujian dalam sekejap tanpa repot mengatur tipografi, margin, dan garis secara manual.',
            highlights: [
                'Preset Madrasah / Kemenag (Amiri Serif, Basmalah, Hijaiyah)',
                'Preset Kurikulum Merdeka (Clean Modern, Callout Stimulus)',
                'Preset Cambridge Assessment (Candidate Box, Point Marks)',
                'Preset Eco-Compact (Hemat lembar fotokopi)'
            ],
            actionLabel: 'Buka Pengaturan Preset',
            actionView: 'settings',
            keywords: ['preset', 'madrasah', 'kemenag', 'cambridge', 'merdeka', 'basmalah', 'hijaiyah', 'kop']
        },
        {
            id: 'smart-fit-engine',
            category: 'PRINT',
            title: 'Smart Page Fit (Pas Halaman)',
            badge: 'Efisiensi Kertas',
            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            icon: SparklesIcon,
            description: 'Algoritma cerdas yang menghitung ukuran font, margin, dan spasi agar naskah pas tepat dengan target jumlah halaman.',
            highlights: [
                'Cegah lembar naskah lewat sedikit (2 halaman menjadi 3 lembar)',
                'Mode 2 Kolom Naskah & Opsi PG sejajar hemat 50% kertas',
                'Preset siap pakai: Ekstrem Hemat, Rapat Efisien, Standar',
                'Live preview instan saat menggeser slider pengaturan'
            ],
            keywords: ['smart fit', 'pas halaman', 'hemat kertas', 'fotokopi', 'margin', 'font', '2 kolom']
        },
        {
            id: 'ljk-scanner',
            category: 'PRINT',
            title: 'Cetak LJK & Koreksi Scan AI',
            badge: 'Penilaian Cepat',
            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            icon: QrCodeIcon,
            description: 'Cetak lembar jawaban komputer hemat kertas 2-in-1 A4 dan nilai lembar jawaban siswa instan via kamera laptop/HP.',
            highlights: [
                'Format 2 Lembar / A4 Split siap gunting (hemat 50% kertas)',
                'Deteksi bulatan pensil otomatis via kamera / foto unggahan',
                'Perhitungan nilai otomatis skala 0-100 & analisis butir',
                'Ekspor rekapitulasi nilai kelas ke format Excel (CSV)'
            ],
            keywords: ['ljk', 'koreksi', 'scan', 'kamera', 'webcam', 'rekap', 'nilai', 'analisis butir']
        },
        {
            id: 'rich-questions-katex',
            category: 'EDITOR',
            title: '8 Tipe Soal & Rumus KaTeX',
            badge: 'Format Fleksibel',
            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
            icon: BookIcon,
            description: 'Dukungan format soal komprehensif mulai dari pilihan ganda biasa, PG kompleks, menjodohkan, hingga rumus matematika KaTeX.',
            highlights: [
                '8 ragam soal: PG, PGK, Esai, Isian, Jodohkan, B/S, Tabel, Stimulus',
                'Mesin render rumus KaTeX (pecahan, akar, matriks, kimia)',
                'Dukungan teks Arab & penomoran hijaiyah otomatis',
                'Toolbar kalkulator pembantu rumus cepat'
            ],
            keywords: ['soal', 'tipe soal', 'katex', 'rumus', 'matematika', 'arab', 'stimulus', 'menjodohkan']
        },
        {
            id: 'rich-text-editor',
            category: 'EDITOR',
            title: 'Editor Rich Text (WYSIWYG)',
            badge: 'Format Visual',
            badgeColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
            icon: BoldIcon,
            description: 'Penyuntingan butir soal kaya visual dengan dukungan format teks lengkap, gambar ilustrasi, tabel dinamis, dan perataan.',
            highlights: [
                'Format tebal, miring, garis bawah, coret, dan warna teks',
                'Penyisipan gambar ilustrasi soal dan diagram beresolusi tinggi',
                'Pembuatan dan pengaturan kolom/baris tabel langsung di editor',
                'Format subskrip/superskrip untuk notasi kimia dan perpangkatan'
            ],
            keywords: ['rich text', 'wysiwyg', 'gambar', 'tabel', 'bold', 'italic', 'format', 'editor']
        },
        {
            id: 'rtl-arabic-support',
            category: 'EDITOR',
            title: 'Dukungan RTL & Bahasa Arab',
            badge: 'Pendidikan Islam & Bahasa',
            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            icon: MoonStarsIcon,
            description: 'Dukungan penuh penulisan naskah bahasa Arab dari kanan ke kiri (RTL) dengan tipografi otentik dan penomoran opsi Hijaiyah.',
            highlights: [
                'Arah teks kanan-ke-kiri (Right-To-Left) otomatis & rapi',
                'Font kaligrafi formal Amiri & Aref Ruqaa berkualitas tinggi',
                'Penomoran opsi dengan abjad Hijaiyah (أ, ب, ج, د, هـ)',
                'Konversi angka desimal ke digit angka Arab timur (١, ٢, ٣, ٤)'
            ],
            keywords: ['rtl', 'arab', 'arabic', 'hijaiyah', 'amiri', 'madrasah', 'kemenag', 'bahasa arab']
        },
        {
            id: 'packet-generator',
            category: 'EDITOR',
            title: 'Generator Paket Soal (Paket A, B, C, D)',
            badge: 'Anti Nyontek',
            badgeColor: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
            icon: StackIcon,
            description: 'Buat varian naskah ujian paralel dengan mengacak nomor butir soal dan opsi jawaban untuk mencegah kecurangan ujian.',
            highlights: [
                'Generator paket paralel instan (Paket A, B, C, D, dsb.)',
                'Opsi pengacakan urutan butir soal serta opsi pilihan ganda',
                'Penguncian stimulus/wacana agar soal terkait tetap berurutan',
                'Pembuatan lembar master kunci jawaban terpisah per varian paket'
            ],
            keywords: ['paket', 'varian', 'acak', 'shuffle', 'paket a', 'paket b', 'anti nyontek', 'kunci paket']
        },
        {
            id: 'audit-validation',
            category: 'EDITOR',
            title: 'Audit & Validasi Kualitas Soal',
            badge: 'Quality Control',
            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
            icon: ShieldCheckIcon,
            description: 'Pemeriksaan otomatis kelayakan naskah ujian sebelum dicetak untuk memastikan tidak ada kesalahan redaksional fatal.',
            highlights: [
                'Deteksi butir soal tanpa kunci jawaban yang belum ditentukan',
                'Peringatan otomatis opsi pilihan ganda yang masih kosong',
                'Pengecekan duplikasi butir soal atau opsi jawaban kembar',
                'Rekapitulasi total bobot skor dan distribusi tingkat kesukaran'
            ],
            keywords: ['audit', 'validasi', 'cek soal', 'kualitas', 'kunci kosong', 'duplikat', 'bobot']
        },
        {
            id: 'smart-import-ai',
            category: 'EDITOR',
            title: 'Smart Import & AI Generator',
            badge: 'Otomasi Input',
            badgeColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800',
            icon: StarsIcon,
            description: 'Salin puluhan teks mentah dari file Word lama atau minta bantuan AI Gemini untuk menghasilkan butir soal baru.',
            highlights: [
                'Salin-tempel langsung dari Word / PDF tanpa format manual',
                'Normalisasi otomatis digit Arab dan huruf abjad opsi',
                'Generator soal berbasis AI Gemini dengan topik spesifik',
                'Deteksi pemisah nomor soal dan kunci jawaban otomatis'
            ],
            keywords: ['import', 'word', 'pdf', 'copas', 'ai', 'gemini', 'smart import']
        },
        {
            id: 'lms-export',
            category: 'LMS',
            title: 'Ekspor Format LMS (Moodle, Blackboard, GIFT, Aiken, QTI)',
            badge: 'Integrasi E-Learning',
            badgeColor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
            icon: ServerIcon,
            description: 'Konversi naskah ujian cetak ke format digital standar untuk langsung diimpor ke aplikasi e-learning dan sistem CBT sekolah.',
            highlights: [
                'Ekspor format Moodle XML lengkap dengan kunci dan opsi',
                'Ekspor format standar GIFT dan Aiken (teks murni)',
                'Dukungan Blackboard dan standar IMS QTI',
                'Format siap salin untuk Google Forms / Quizizz / Canva Quiz'
            ],
            keywords: ['lms', 'moodle', 'gift', 'aiken', 'blackboard', 'qti', 'google forms', 'elearning']
        },
        {
            id: 'archive-management',
            category: 'STORAGE',
            title: 'Manajemen Arsip & Bank Soal',
            badge: 'Manajemen Data',
            badgeColor: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
            icon: ArchiveIcon,
            description: 'Kelola puluhan naskah ujian dan ribuan butir bank soal dengan struktur rapi, pelabelan status, serta pencarian instan.',
            highlights: [
                'Penyortiran berdasarkan mata pelajaran, jenjang kelas, dan tanggal',
                'Penandaan status naskah: Draft, Siap Cetak, atau Terarsip',
                'Penyimpanan Bank Soal mandiri untuk digunakan kembali pada ujian berikutnya',
                'Pencadangan massal (Bulk Backup) seluruh arsip ke file JSON'
            ],
            actionLabel: 'Buka Arsip Ujian',
            actionView: 'archive',
            keywords: ['arsip', 'bank soal', 'koleksi', 'manajemen', 'mapel', 'kelas', 'backup', 'draft']
        },
        {
            id: 'dropbox-sync',
            category: 'STORAGE',
            title: 'Sinkronisasi Dropbox & Cloud Backup',
            badge: 'Cloud Sync Aman',
            badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
            icon: DropboxIcon,
            description: 'Sinkronkan naskah ujian dan konfigurasi ke akun Dropbox pribadi Anda dengan pairing QR code instan antar-perangkat.',
            highlights: [
                'Pencadangan cloud aman langsung ke Dropbox pribadi Anda',
                'Pairing instan via QR Code & kode pairing antar laptop / HP',
                'Fitur auto-restore naskah ujian tanpa setting rumit',
                'Proteksi konflik berkas: naskah aman dan selalu terbarukan'
            ],
            actionLabel: 'Buka Pengaturan Cloud',
            actionView: 'settings',
            keywords: ['dropbox', 'cloud', 'sinkronisasi', 'sync', 'pairing', 'qr code', 'cadangan', 'backup']
        },
        {
            id: 'privacy-offline-first',
            category: 'STORAGE',
            title: '100% Offline-First & Privasi Guru',
            badge: 'Tanpa Server',
            badgeColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
            icon: ShieldCheckIcon,
            description: 'Seluruh naskah soal dan data siswa diproses secara lokal di peramban Anda menggunakan database IndexedDB tanpa risiko bocor.',
            highlights: [
                'Bekerja lancar tanpa koneksi internet (PWA)',
                'Data tersimpan aman di penyimpanan internal browser (Dexie.js)',
                'Bebas risiko kebocoran naskah ujian rahasia sekolah',
                'Dukungan ekspor & impor backup arsip lengkap'
            ],
            keywords: ['offline', 'privasi', 'indexeddb', 'dexie', 'pwa', 'keamanan', 'lokal']
        },
        {
            id: 'multi-export-formats',
            category: 'PRINT',
            title: 'Ekspor Multi-Format (PDF, Word, & HTML)',
            badge: 'Kompatibilitas',
            badgeColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
            icon: WordIcon,
            description: 'Cetak langsung ke PDF resolusi tinggi, ekspor dokumen Word (.docx), atau simpan berkas HTML mandiri untuk arsip web.',
            highlights: [
                'Cetak PDF resolusi tinggi dengan layout presisi milimeter',
                'Ekspor naskah dan kunci jawaban ke Microsoft Word (.docx)',
                'Ekspor berkas HTML mandiri untuk arsip web & pratinjau browser',
                'Ekspor lembar kunci jawaban dan rubrik penilaian terpisah'
            ],
            keywords: ['ekspor', 'word', 'docx', 'pdf', 'html', 'cetak', 'kunci jawaban', 'format', 'kop']
        }
    ];

    const filteredFeatures = useMemo(() => {
        return features.filter(f => {
            const matchesCat = selectedCategory === 'ALL' || f.category === selectedCategory;
            if (!searchQuery.trim()) return matchesCat;

            const q = searchQuery.toLowerCase().trim();
            const matchesQuery = 
                f.title.toLowerCase().includes(q) ||
                f.description.toLowerCase().includes(q) ||
                f.badge.toLowerCase().includes(q) ||
                f.highlights.some(h => h.toLowerCase().includes(q)) ||
                f.keywords.some(k => k.toLowerCase().includes(q));

            return matchesCat && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    return (
        <div className="space-y-5">
            {/* Category Filter Chips - Mobile Horizontally Scrollable */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 flex-nowrap">
                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border ${
                                isSelected
                                    ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] border-[var(--bg-accent)] shadow-xs'
                                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-primary)]'
                            }`}
                        >
                            <i className={`bi ${cat.icon} text-xs`}></i>
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                    Menampilkan <strong>{filteredFeatures.length}</strong> kapabilitas fitur
                    {searchQuery && <span> untuk kata kunci "<em>{searchQuery}</em>"</span>}
                </span>
                {searchQuery && onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="text-xs text-[var(--text-accent)] font-semibold hover:underline"
                    >
                        Reset Pencarian
                    </button>
                )}
            </div>

            {/* Bento Grid Layout */}
            {filteredFeatures.length === 0 ? (
                <div className="app-surface p-8 rounded-[var(--radius-card)] text-center space-y-3 border border-[var(--border-primary)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] flex items-center justify-center mx-auto text-xl">
                        <SearchIcon />
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">Fitur Tidak Ditemukan</h4>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                        Coba gunakan kata kunci umum seperti "lms", "cbt", "arab", "paket", "audit", "preset", atau "dropbox".
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.id}
                                className="app-surface rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] text-[var(--text-accent)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0">
                                            <Icon className="text-lg" />
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-control)] ${f.badgeColor}`}>
                                            {f.badge}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                                            {f.title}
                                        </h3>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                            {f.description}
                                        </p>
                                    </div>

                                    {/* Highlights List */}
                                    <div className="pt-2 border-t border-[var(--border-primary)]/70 space-y-1.5">
                                        {f.highlights.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                                <i className="bi bi-check2 text-[var(--text-accent)] font-bold text-xs mt-0.5 flex-shrink-0"></i>
                                                <span className="leading-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {f.actionLabel && f.actionView && onNavigate && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => onNavigate(f.actionView!)}
                                            className="w-full py-2 px-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-primary)] inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                        >
                                            <span>{f.actionLabel}</span>
                                            <i className="bi bi-arrow-right text-[10px]"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FeaturesTab;

