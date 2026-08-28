import React, { useState, useMemo } from 'react';
import {
    SearchIcon, PlusIcon, StackIcon, SettingsIcon, CloudDownloadIcon,
    DropboxIcon, StarsIcon, PrinterIcon, BookIcon, SparklesIcon,
    ShieldCheckIcon, LayoutSplitIcon, ServerIcon, PaletteIcon,
    MoonStarsIcon, MortarboardIcon, GlobeIcon, TreeIcon, BuildingIcon,
    CheckIcon, BookmarkPlusIcon, FolderIcon, TagIcon, CloseIcon,
    BankIcon, ArchiveIcon, ShuffleIcon, EyeIcon, EditIcon
} from '../../components/Icons';
import type { View } from '../../App';
import type { HelpTab } from '../HelpView';

interface GuideTabProps {
    searchQuery?: string;
    onClearSearch?: () => void;
    onNavigate?: (view: View) => void;
    onSwitchTab?: (tab: HelpTab, query?: string) => void;
}

type GuideCategory = 'ALL' | 'WORKFLOW' | 'PACKET' | 'PRESET' | 'LJK' | 'QUESTIONS' | 'BANK' | 'AI' | 'COMMUNITY' | 'CLOUD';

interface AccordionGuide {
    id: string;
    category: GuideCategory;
    title: string;
    icon: React.ElementType;
    badge: string;
    badgeColor: string;
    readTime: string;
    summary: string;
    keywords: string[];
    actionLabel?: string;
    actionView?: View;
    content: (onNavigate?: (view: View) => void) => React.ReactNode;
}

const GuideTab: React.FC<GuideTabProps> = ({ searchQuery = '', onClearSearch, onNavigate, onSwitchTab }) => {
    const [selectedCategory, setSelectedCategory] = useState<GuideCategory>('ALL');
    const [openGuideId, setOpenGuideId] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(id);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const categories: { id: GuideCategory; label: string; icon: string }[] = [
        { id: 'ALL', label: 'Semua Panduan', icon: 'bi-grid-fill' },
        { id: 'PACKET', label: 'Paket Soal (A/B/C/D)', icon: 'bi-collection-fill' },
        { id: 'QUESTIONS', label: '8 Ragam Jenis Soal', icon: 'bi-card-text' },
        { id: 'BANK', label: 'Bank Soal & Koleksi', icon: 'bi-journal-richtext' },
        { id: 'COMMUNITY', label: 'Pusat MGMP (.sgpkg)', icon: 'bi-globe-americas' },
        { id: 'PRESET', label: 'Preset Gaya & Cetak', icon: 'bi-palette-fill' },
        { id: 'LJK', label: 'LJK & Koreksi Scan', icon: 'bi-qr-code' },
        { id: 'AI', label: 'AI & Smart Import', icon: 'bi-stars' },
        { id: 'CLOUD', label: 'Penyimpanan & Cloud', icon: 'bi-cloud-fill' },
    ];

    const guides: AccordionGuide[] = [
        {
            id: 'packet-generator-guide',
            category: 'PACKET',
            title: 'Panduan Generator Paket Soal (Paket A, B, C, D Paralel)',
            icon: StackIcon,
            badge: 'Anti Nyontek',
            badgeColor: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
            readTime: '3 mnt baca',
            summary: 'Langkah membuat varian naskah ujian paralel dengan pengacakan butir soal, opsi PG, serta pembuatan master kunci jawaban per paket.',
            keywords: ['paket', 'generator', 'acak', 'shuffle', 'paket a', 'paket b', 'paket c', 'anti nyontek', 'kunci paket', 'stimulus'],
            actionLabel: 'Buka Editor Naskah',
            actionView: 'editor',
            content: (navigate) => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Generator Paket Soal</strong> membantu Anda membuat beberapa paket naskah ujian sekaligus (misalnya Paket A, Paket B, Paket C, dan Paket D) dari satu naskah master untuk meminimalkan potensi kecurangan saat ujian berlangsung.
                    </p>

                    <div className="space-y-3">
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">1</span>
                                <span>Langkah Membuat Paket Ujian Paralel:</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                                <li>Buka naskah ujian di menu <strong>Editor</strong> atau <strong>Pratinjau (Preview)</strong>.</li>
                                <li>Klik tombol <strong>Generator Paket Soal</strong> (ikon tumpukan bertingkat) pada toolbar.</li>
                                <li>Tentukan jumlah paket yang ingin dihasilkan (misalnya 2 paket untuk A & B, atau 4 paket untuk A, B, C, D).</li>
                                <li>
                                    Pilih opsi pengacakan:
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                                        <li><strong>Acak Urutan Butir Soal:</strong> Menukar susunan nomor soal antar paket.</li>
                                        <li><strong>Acak Opsi Pilihan Ganda:</strong> Mengacak posisi pilihan jawaban (A, B, C, D, E).</li>
                                        <li><strong>Pertahankan Kelompok Stimulus:</strong> Memastikan butir soal yang merujuk pada wacana/cerita yang sama tetap tersusun berdampingan.</li>
                                    </ul>
                                </li>
                                <li>Klik <strong>Hasilkan Paket Soal</strong>. Sistem akan menyusun naskah dan kunci jawaban masing-masing paket secara otomatis.</li>
                            </ol>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">2</span>
                                <span>Mencetak & Lembar Kunci Jawaban Terpisah:</span>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed pl-7">
                                Setiap varian paket yang dihasilkan dilengkapi dengan tanda kode paket pada kop surat (misalnya <em>[PAKET A]</em>, <em>[PAKET B]</em>). Anda dapat mencetak naskah ujian per paket serta mengekspor <strong>Tabel Rekapitulasi Kunci Jawaban Master</strong> untuk memudahkan tim pengawas dan pemeriksa nilai.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'question-types-guide',
            category: 'QUESTIONS',
            title: 'Panduan 8 Ragam Jenis Soal & Penilaian Terpadu',
            icon: BookIcon,
            badge: 'Format Komprehensif',
            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
            readTime: '3 mnt baca',
            summary: 'Ketahui cara membuat 8 format butir soal: Pilihan Ganda biasa, PG Kompleks, Esai/Uraian, Isian Singkat, Menjodohkan, Benar/Salah, Tabel, & Stimulus.',
            keywords: ['jenis soal', 'ragam soal', 'pg', 'pgk', 'esai', 'isian', 'menjodohkan', 'benar salah', 'stimulus', 'tabel'],
            content: () => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        SoalGenius mendukung <strong>8 format butir soal standar kurikulum nasional dan internasional</strong>. Setiap jenis soal dirancang dengan tata letak otomatis dan kunci jawaban yang terstruktur rapi.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-ui-radios text-[var(--text-accent)]"></i> 1. Pilihan Ganda (PG Tunggal)
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Butir soal dengan opsi A, B, C, D, atau E dengan 1 jawaban benar. Tata letak opsi mendukung model 1 kolom menurun, 2 kolom sejajar (hemat kertas), maupun horizontal.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-ui-checks text-[var(--text-accent)]"></i> 2. Pilihan Ganda Kompleks (PGK)
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Format asesmen Kurikulum Merdeka (AKM) dengan instruksi <em>"Pilihlah lebih dari satu jawaban yang benar"</em> dengan kotak centang checkbox otomatis.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-arrow-left-right text-[var(--text-accent)]"></i> 3. Menjodohkan (Matching)
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Menghubungkan dua kolom premis dan respon. Saat dicetak, disajikan dalam format tabel dua kolom atau garis penghubung yang rapi.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-check-square-fill text-[var(--text-accent)]"></i> 4. Benar / Salah (B - S)
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Tabel evaluasi pernyataan apakah bernilai Benar atau Salah, atau format Sesuai / Tidak Sesuai berdasarkan teks stimulus.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-input-cursor-text text-[var(--text-accent)]"></i> 5. Isian Singkat
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Pertanyaan dengan titik-titik jawaban ringkas (angka, istilah ilmiah, atau satu kata kunci penting).
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-file-earmark-text-fill text-[var(--text-accent)]"></i> 6. Uraian / Esai Panjang
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Pertanyaan analisis mendalam dengan rubrik pedoman penskoran serta garis kosong bergaris untuk lembar jawaban siswa.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-quote text-[var(--text-accent)]"></i> 7. Wacana Stimulus (Induk Soal)
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Kotak stimulus literasi/numerasi berupa kutipan cerita, infografis, atau data percobaan yang menjadi acuan beberapa nomor soal berikutnya.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <i className="bi bi-table text-[var(--text-accent)]"></i> 8. Tabel Data & Klasifikasi
                            </span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Format tabel kustom untuk soal klasifikasi sains, data numerik akuntansi, atau matriks perbandingan.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'bank-soal-guide',
            category: 'BANK',
            title: 'Panduan Bank Soal, Edit Massal & Generator Ujian Otomatis',
            icon: BankIcon,
            badge: 'Pustaka Guru & Otomasi',
            badgeColor: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
            readTime: '4 mnt baca',
            summary: 'Simpan butir soal berkualitas, edit massal mapel/kelas/tag materi, buat naskah ujian baru otomatis, dan kelola koleksi mandiri.',
            keywords: ['bank soal', 'koleksi', 'pustaka', 'arsip', 'reusable', 'import', 'bookmark', 'bulk edit', 'edit massal', 'buat ujian', 'tags', 'label'],
            actionLabel: 'Buka Bank Soal',
            actionView: 'bank',
            content: (navigate) => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        <strong>Bank Soal</strong> adalah brankas penyimpanan mandiri Anda untuk butir-butir soal berkualitas tinggi. Butir soal yang disimpan di Bank Soal bersifat permanen dan tidak akan terhapus meskipun naskah ujian terkait telah dihapus atau direset.
                    </p>

                    <div className="space-y-3">
                        {/* Step 1: Simpan ke Bank */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">1</span>
                                <span>Menyimpan Butir Soal ke Bank Soal:</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                                <li>Saat sedang menyunting naskah di <strong>Editor</strong>, klik ikon <strong>Bookmark (+ Bank Soal)</strong> di sudut kartu butir soal.</li>
                                <li>Pilih atau ketik label mata pelajaran, kelas, dan topik kompetensi dasar/tag materi.</li>
                                <li>Butir soal langsung tersimpan secara permanen di database lokal browser (IndexedDB) Anda.</li>
                            </ol>
                        </div>

                        {/* Step 2: Edit Massal (Bulk Edit) */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                                <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] flex items-center justify-center font-extrabold">2</span>
                                <span>Edit Massal (Bulk Edit) Mapel, Kelas & Tag Materi:</span>
                            </div>
                            <p className="text-blue-900/80 dark:text-blue-200/80 leading-relaxed pl-7">
                                Anda dapat memperbarui metadata puluhan butir soal sekaligus dalam satu langkah efisien:
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 text-blue-950 dark:text-blue-100 pl-7 leading-relaxed">
                                <li>Buka menu <strong>Bank Soal</strong>, centang butir-butir soal yang ingin diperbarui (atau gunakan tombol <em>Pilih Semua</em>).</li>
                                <li>Klik tombol <strong>Edit Massal ({'{'}jumlah{'}'})</strong> pada bilah aksi seleksi.</li>
                                <li>
                                    Centang atribut yang ingin diubah (pola pembaruan selektif):
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-blue-900/90 dark:text-blue-200/90">
                                        <li><strong>Mata Pelajaran:</strong> Pilih dari daftar cepat atau ketik mapel kustom.</li>
                                        <li><strong>Jenjang / Kelas:</strong> Pilih dari kelas VII–XII, Fase A–F, atau ketik jenjang spesifik.</li>
                                        <li><strong>Label / Tag Materi:</strong> Tambahkan tag baru (misal: <code>#HOTS</code>, <code>#Sumatif</code>, <code>#Bab 1</code>) atau ganti seluruh tag lama.</li>
                                    </ul>
                                </li>
                                <li>Klik <strong>Simpan Perubahan Massal</strong>. Butir soal yang tidak dicentang atributnya akan tetap mempertahankan data aslinya.</li>
                            </ol>
                        </div>

                        {/* Step 3: Buat Naskah Ujian Baru Otomatis dari Bank */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300">
                                <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-500 text-white text-[11px] flex items-center justify-center font-extrabold">3</span>
                                <span>Membuat Naskah Ujian Baru Otomatis dari Soal Terpilih:</span>
                            </div>
                            <p className="text-purple-900/80 dark:text-purple-200/80 leading-relaxed pl-7">
                                Menggabungkan bank butir soal menjadi naskah ujian semester baru tanpa perlu mengetik ulang dari awal:
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 text-purple-950 dark:text-purple-100 pl-7 leading-relaxed">
                                <li>Di Bank Soal, gunakan filter pencarian lalu tandai butir-butir soal yang akan diujikan.</li>
                                <li>Klik tombol <strong>Buat Ujian ({'{'}jumlah{'}'})</strong> di bilah aksi bawah.</li>
                                <li>
                                    Sistem membuka dialog konfigurasi ujian otomatis:
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-purple-900/90 dark:text-purple-200/90">
                                        <li><strong>Pengelompokan Otomatis:</strong> Soal otomatis dikelompokkan berdasarkan jenis (Pilihan Ganda, PG Kompleks, Menjodohkan, Esai, dll.) dengan nomor berurutan.</li>
                                        <li><strong>Distribusi Bobot:</strong> Sistem menghitung total skor estimasi (default 100) serta proporsi poin per butir.</li>
                                        <li><strong>Informasi Naskah:</strong> Tentukan Judul Ujian, Mata Pelajaran, Kelas, Alokasi Waktu, dan Petunjuk Ujian.</li>
                                    </ul>
                                </li>
                                <li>Pilih apakah ingin <em>Menimpa Editor Saat Ini</em> atau <em>Simpan Langsung ke Arsip Ujian</em>, lalu klik <strong>Buat Naskah Ujian Sekarang</strong>.</li>
                            </ol>
                        </div>

                        {/* Step 4: Mengambil Soal dari Editor */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">4</span>
                                <span>Menyisipkan Soal dari Bank ke Naskah Aktif:</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                                <li>Buka naskah ujian yang sedang disusun di menu <strong>Editor</strong>.</li>
                                <li>Klik tombol <strong>+ Ambil dari Bank Soal</strong> pada toolbar atas editor.</li>
                                <li>Gunakan filter mata pelajaran, kelas, tipe soal, atau kotak pencarian kata kunci.</li>
                                <li>Centang butir soal yang diinginkan lalu klik <strong>Sisipkan ke Naskah</strong>. Nomor soal dan kunci jawaban akan disesuaikan secara otomatis.</li>
                            </ol>
                        </div>

                        {/* Step 5: Ekspor & Impor Paket Komunitas */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">5</span>
                                <span>Berbagi & Impor Koleksi MGMP (.sgpkg):</span>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed pl-7">
                                Bank soal Anda dapat diekspor menjadi berkas paket portabel <code>.sgpkg</code> melalui menu <strong>Pusat Berbagi MGMP</strong> untuk dibagikan ke rekan guru atau diimpor dari koleksi MGMP tanpa membutuhkan akun internet.
                            </p>
                        </div>
                    </div>

                    {navigate && (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-primary)]">
                            <span className="text-xs text-[var(--text-muted)]">
                                Tersedia kontrol seleksi responsif di smartphone dan tampilan adaptif layar lebar.
                            </span>
                            <button
                                onClick={() => navigate('bank')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-semibold shadow-xs transition-colors"
                            >
                                <BankIcon className="text-sm" />
                                <span>Buka Bank Soal Saya</span>
                            </button>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'mgmp-package',
            category: 'COMMUNITY',
            title: 'Pusat Berbagi Soal Antar-Guru / MGMP & Berkas .sgpkg',
            icon: GlobeIcon,
            badge: 'Kolaborasi Portabel',
            badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
            readTime: '3 mnt baca',
            summary: 'Cara bertukar paket bank soal portabel (.sgpkg) antar-sekolah atau komunitas guru tanpa ketergantungan server.',
            keywords: ['mgmp', 'kkg', 'sgpkg', 'paket', 'komunitas', 'ekspor', 'impor', 'kurikulum', 'merdeka', 'madrasah'],
            actionLabel: 'Buka Pusat Berbagi MGMP',
            actionView: 'community',
            content: (navigate) => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Pusat Berbagi Soal MGMP</strong> memungkinkan pertukaran dan distribusi paket butir soal berkualitas antar-guru, pengurus MGMP, KKG, maupun lintas sekolah secara mandiri tanpa bergantung pada server internet atau akun daring khusus.
                    </p>

                    {/* Step 1 */}
                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                            <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">1</span>
                            <span>Mengenal Berkas Paket Soal (.sgpkg):</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed pl-7">
                            <strong>.sgpkg (SoalGenius Package)</strong> adalah format file pertukaran bank soal terenkapsulasi ringan yang menyimpan teks soal lengkap, opsi pilihan ganda, kunci jawaban, wacana stimulus, pasangan menjodohkan, rumus KaTeX, serta metadata identitas MGMP penyusun.
                        </p>
                        <p className="text-[var(--text-secondary)] leading-relaxed pl-7">
                            Berkas <code>.sgpkg</code> dapat dibagikan dengan sangat mudah melalui <strong>WhatsApp, Flashdisk, Email, Telegram, Google Drive,</strong> atau <strong>Dropbox</strong>.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                            <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">2</span>
                            <span>Cara Mengekspor Paket Soal dari Bank Anda:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                            <li>Buka menu <strong>Pusat Berbagi MGMP</strong> dari navigasi utama, lalu pilih tab <strong>Ekspor Paket Soal (.sgpkg)</strong>.</li>
                            <li>Lengkapi data paket: <em>Judul Paket, Mata Pelajaran, Jenjang/Kelas/Fase,</em> serta <em>Nama Penyusun / Asal MGMP</em>.</li>
                            <li>
                                <strong>Pilih Kurikulum:</strong> Pilih daftar standar (Kurikulum Merdeka, Kemenag/Madrasah, K13, Cambridge) atau pilih <strong>"Lainnya (Kustom / Tulis Sendiri...)"</strong> untuk mengetik nama kurikulum spesifik sekolah Anda.
                            </li>
                            <li>Gunakan <strong>Filter Pencarian Cepat</strong> (kata kunci, mapel, kelas, tipe soal) dan klik <em>"+ Pilih Semua Hasil Filter"</em> untuk mencentang butir soal secara efisien.</li>
                            <li>Klik tombol <strong>Unduh Berkas Paket (.sgpkg)</strong>. File siap dibagikan ke rekan guru!</li>
                        </ol>
                    </div>

                    {/* Step 3 */}
                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                            <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">3</span>
                            <span>Cara Mengimpor Berkas .sgpkg:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                            <li>Masuk ke menu <strong>Pusat Berbagi MGMP</strong>, pilih tab <strong>Impor Berkas Paket (.sgpkg / .json)</strong>.</li>
                            <li>Unggah berkas <code>.sgpkg</code> yang Anda terima dari WhatsApp atau flashdisk.</li>
                            <li>Tinjau butir soal menggunakan filter tipe soal dan bilah pencarian teks.</li>
                            <li>Klik <strong>Simpan Butir Terpilih ke Bank Soal</strong> untuk memasukkannya ke penyimpanan lokal Anda.</li>
                        </ol>
                    </div>

                    {navigate && (
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => navigate('community')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-control)] bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)] text-xs font-semibold shadow-xs transition-colors"
                            >
                                <GlobeIcon className="text-sm" />
                                <span>Buka Pusat Berbagi MGMP Sekarang</span>
                            </button>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'visual-presets',
            category: 'PRESET',
            title: 'Preset Tata Letak & Gaya Visual Ujian (1-Klik)',
            icon: PaletteIcon,
            badge: 'Estetika & Standar',
            badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
            readTime: '2 mnt baca',
            summary: 'Ganti seketika format visual naskah: Madrasah (Basmalah/Hijaiyah), Kurikulum Merdeka, Cambridge, dan Eco-Compact.',
            keywords: ['preset', 'gaya', 'visual', 'madrasah', 'kemenag', 'cambridge', 'kurikulum merdeka', 'basmalah', 'hijaiyah', 'kop', 'garis'],
            actionLabel: 'Atur Preset di Pengaturan',
            actionView: 'settings',
            content: (navigate) => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Preset Tata Letak & Gaya Visual</strong> memungkinkan Anda mengubah keseluruhan estetika, tipografi, format kop, dan ornamen naskah ujian hanya dalam 1-klik tanpa perlu mengatur font, margin, spasi, dan batas kop secara manual.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                                <MoonStarsIcon className="text-base text-emerald-600" />
                                <span>Madrasah / Kemenag</span>
                            </div>
                            <p className="text-emerald-900/80 dark:text-emerald-200/80 text-xs leading-relaxed">
                                Font formal <strong>Amiri Serif</strong>, kaligrafi <strong>Basmalah & Hamdalah</strong>, opsi penomoran Hijaiyah (أ, ب, ج, د, هـ), dan garis pembatas kop ganda resmi.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                                <MortarboardIcon className="text-base text-blue-600" />
                                <span>Kurikulum Merdeka</span>
                            </div>
                            <p className="text-blue-900/80 dark:text-blue-200/80 text-xs leading-relaxed">
                                Tipografi bersih sans-serif (<strong>Liberation Sans</strong>), kotak stimulus literasi berformat <strong>Modern Callout Card</strong> dengan garis aksen elegan.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300">
                                <GlobeIcon className="text-base text-purple-600" />
                                <span>Cambridge Style (Internasional)</span>
                            </div>
                            <p className="text-purple-900/80 dark:text-purple-200/80 text-xs leading-relaxed">
                                Tipografi klasik <strong>Liberation Serif</strong>, kotak identitas kandidat resmi (Centre Number & Candidate Number), serta lencana bobot poin <code className="bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 rounded font-bold text-purple-700 dark:text-purple-300">[1 mark]</code>.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                                <TreeIcon className="text-base text-slate-600" />
                                <span>Klasik Kedinasan & Eco-Compact</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                Garis pembatas tebal-tipis ganda khas dinas pendidikan, serta opsi hemat kertas (margin 10mm, font kompak) untuk menekan biaya fotokopi.
                            </p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <span className="font-bold text-[var(--text-primary)]">Cara Menerapkan Preset:</span>
                        <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed">
                            <li><strong>Dari Layar Pratinjau (Preview):</strong> Klik tombol <strong>Gaya Visual</strong> pada toolbar atas, pilih preset, dan klik <em>Terapkan</em>.</li>
                            <li><strong>Dari Menu Pengaturan:</strong> Buka <strong>Pengaturan → Preset Gaya</strong> untuk menerapkan gaya default dan mengatur opsi halus (toggle Basmalah, gaya garis kop, dan opsi Arab).</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'smart-page-fit',
            category: 'PRESET',
            title: 'Pas Halaman (Smart Page Fit) & Penghemat Kertas',
            icon: SparklesIcon,
            badge: 'Hemat Kertas',
            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            readTime: '2 mnt baca',
            summary: 'Hitung otomatis ukuran font, spasi baris, margin, dan 2 kolom agar naskah ujian pas tepat dengan target jumlah halaman.',
            keywords: ['smart fit', 'pas halaman', 'hemat kertas', 'fotokopi', 'margin', 'font size', '2 kolom', 'sejajar'],
            content: () => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Smart Page Fit (Pas Halaman)</strong> menyelesaikan masalah klasik guru: naskah soal yang "menggantung" ke halaman berikutnya (misalnya 2 halaman lewat sedikit sehingga menjadi 3 lembar). Anda dapat mengompres atau memperluas tata letak secara cerdas agar pas dengan target lembar fotokopi yang diinginkan.
                    </p>

                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <span className="font-bold text-[var(--text-primary)]">Langkah Menggunakan Smart Page Fit:</span>
                        <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] leading-relaxed">
                            <li>Buka naskah ujian dan masuk ke halaman <strong>Pratinjau (Preview)</strong>.</li>
                            <li>Pada toolbar atas, klik tombol <strong>Pas Halaman (Smart Fit)</strong> (ikon bintang berkilau).</li>
                            <li>Pilih salah satu metode:
                                <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                                    <li><strong>Pas Otomatis (Smart Fit):</strong> Sistem menganalisis volume naskah dan otomatis merekomendasikan parameter optimal sesuai target halaman.</li>
                                    <li><strong>Preset Cepat:</strong> Pilih <em>Hemat Kertas Ekstrem (10pt, 2 Kolom)</em>, <em>Rapat & Efisien (11pt)</em>, atau <em>Standar Ujian (12pt)</em>.</li>
                                    <li><strong>Kustom Manual:</strong> Atur slider font (9–16 pt), spasi baris (1.0–1.8), margin kertas (5–25 mm), dan 2 kolom secara interaktif.</li>
                                </ul>
                            </li>
                            <li>Klik tombol <strong>Terapkan Tata Letak</strong> untuk menyimpan perubahan.</li>
                        </ol>
                    </div>

                    <div className="p-3.5 rounded-[var(--radius-card)] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                            <i className="bi bi-lightbulb-fill text-amber-500"></i> Tips Efisiensi Kertas Fotokopi:
                        </span>
                        <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                            Untuk soal pilihan ganda dengan 25–40 butir, aktifkan opsi <strong>2 Kolom Lembar</strong> dan centang <strong>Opsi Pilihan Ganda 2 Kolom (A & B sejajar)</strong>. Ini dapat memangkas kebutuhan kertas fotokopi hingga 40-50% tanpa mengorbankan keterbacaan siswa.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'ljk-correction',
            category: 'LJK',
            title: 'Cetak LJK Hemat Kertas & Koreksi Scan Kamera (Termasuk Multi-Paket)',
            icon: SparklesIcon,
            badge: 'Penilaian Cepat & Akurat',
            badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            readTime: '4 mnt baca',
            summary: 'Cetak template LJK hemat kertas (2-in-1 A4), panduan scan kamera/unggah foto, serta alur koreksi ujian multi-paket (Paket A & B).',
            keywords: ['ljk', 'koreksi', 'scan', 'kamera', 'webcam', 'rekap nilai', 'analisis butir', 'lembar jawab', 'multi paket', 'paket a', 'paket b'],
            content: () => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Lembar Jawab Komputer (LJK) & Pemeriksa Cerdas</strong> memungkinkan guru mencetak lembar jawaban standar dengan tata letak hemat kertas, lalu menilai hasil jawaban siswa secara instan menggunakan kamera HP, webcam laptop, atau unggahan berkas foto/scan.
                    </p>

                    <div className="space-y-3">
                        {/* Section 1: Cetak Template LJK */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">1</span>
                                <span>Mencetak Template Lembar Jawaban (LJK):</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] pl-7 leading-relaxed">
                                <li>Buka naskah ujian di <strong>Editor</strong> atau <strong>Pratinjau Cetak</strong> → Klik tombol <strong>Lembar Jawab (LJK)</strong>.</li>
                                <li>Pilih model tata letak: <strong>2 Lembar / A4 Split</strong> (Rekomendasi hemat 50% kertas), <strong>1 Lembar Penuh</strong>, atau <strong>4 Lembar Mini</strong>.</li>
                                <li>Tentukan kapasitas soal (25, 30, 40, 50 butir) dan pilihan opsi jawaban (A–D atau A–E).</li>
                                <li>Klik <strong>Cetak LJK / Simpan PDF</strong> untuk menggandakan lembar bagi siswa.</li>
                            </ul>
                        </div>

                        {/* Section 2: Koreksi Scan Kamera */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                                <span className="w-5 h-5 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-[11px] flex items-center justify-center font-extrabold">2</span>
                                <span>Alur Penilaian Otomatis (Scan Kamera / Foto):</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] pl-7 leading-relaxed">
                                <li>Buka naskah ujian terkait, lalu klik menu <strong>Koreksi LJK (Scan Nilai)</strong>.</li>
                                <li>Pilih metode pemindaian: <strong>Kamera Langsung</strong> (arahkan 4 jangkar sudut LJK ke bingkai kamera) atau <strong>Unggah Foto Lembar Siswa</strong>.</li>
                                <li>Sistem mendeteksi bulatan jawaban siswa, membandingkannya dengan kunci jawaban master, dan menghitung jumlah Benar, Salah, serta Nilai Akhir (0–100).</li>
                                <li>Gunakan panel review untuk memeriksa jika ada bulatan siswa yang terlalu tipis atau salah hapus, lalu klik <strong>Simpan Nilai Siswa</strong>.</li>
                            </ol>
                        </div>

                        {/* Section 3: Prosedur Koreksi Multi-Paket (Paket A & Paket B) */}
                        <div className="p-3.5 rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                                <span className="w-5 h-5 rounded-full bg-amber-600 dark:bg-amber-500 text-white text-[11px] flex items-center justify-center font-extrabold">3</span>
                                <span>Prosedur Koreksi Ujian Multi-Paket (Paket A, Paket B, dst.):</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-2 text-amber-950 dark:text-amber-100 pl-7 leading-relaxed">
                                <li>
                                    <strong>Kelompokkan Berkas LJK Siswa:</strong> Pisahkan tumpukan lembar jawaban siswa berdasarkan paket soal yang mereka kerjakan (tumpukan Paket A dan tumpukan Paket B).
                                </li>
                                <li>
                                    <strong>Koreksi Naskah Paket A:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                                        <li>Buka naskah <em>Ujian Paket A</em> di aplikasi &rarr; Buka <strong>Koreksi LJK</strong>.</li>
                                        <li>Scan seluruh tumpukan lembar jawaban siswa Paket A. Nilai otomatis dicocokkan dengan kunci Paket A.</li>
                                        <li>Unduh rekapan nilai Excel/CSV untuk kelompok Paket A.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Koreksi Naskah Paket B:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                                        <li>Kembali ke <strong>Arsip Ujian</strong> &rarr; Buka naskah <em>Ujian Paket B</em> &rarr; Buka <strong>Koreksi LJK</strong>.</li>
                                        <li>Scan seluruh tumpukan lembar jawaban siswa Paket B. Nilai otomatis dicocokkan dengan kunci Paket B.</li>
                                        <li>Unduh rekapan nilai Excel/CSV untuk kelompok Paket B.</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'katex-formula',
            category: 'QUESTIONS',
            title: 'Penulisan Rumus Matematika, Fisika, Kimia (KaTeX)',
            icon: BookIcon,
            badge: 'Rumus Presisi',
            badgeColor: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
            readTime: '2 mnt baca',
            summary: 'Gunakan sintaks KaTeX cepat untuk rumus pecahan, akar, eksponen, matriks, dan simbol sains.',
            keywords: ['katex', 'rumus', 'matematika', 'fisika', 'kimia', 'pecahan', 'akar', 'pangkat', 'simbol', 'latex'],
            content: () => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        SoalGenius terintegrasi dengan <strong>KaTeX</strong> untuk merender rumus matematika secara instan, tajam, dan siap cetak resolusi tinggi. Anda bisa mengeklik ikon Kalkulator (Matematika) di toolbar editor atau mengetik sintaks langsung.
                    </p>

                    <div className="space-y-2">
                        <span className="font-bold text-[var(--text-primary)]">Contoh Sintaks Populer:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                                    <span>PECAHAN & AKAR</span>
                                    <button
                                        onClick={() => handleCopy('\\frac{a}{b} + \\sqrt{x^2 + y^2}', 'katex-1')}
                                        className="text-[var(--text-accent)] hover:underline flex items-center gap-1"
                                    >
                                        {copiedIndex === 'katex-1' ? <CheckIcon className="text-emerald-500" /> : <i className="bi bi-clipboard"></i>}
                                        <span>{copiedIndex === 'katex-1' ? 'Tersalin' : 'Salin'}</span>
                                    </button>
                                </div>
                                <code className="block p-2 rounded bg-[var(--bg-primary)] font-mono text-[11px] text-[var(--text-primary)] overflow-x-auto">
                                    {"\\frac{a}{b} + \\sqrt{x^2 + y^2}"}
                                </code>
                            </div>

                            <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                                    <span>INTEGRAL & LIMIT</span>
                                    <button
                                        onClick={() => handleCopy('\\int_{0}^{\\infty} f(x)dx \\quad \\lim_{x \\to 0}', 'katex-2')}
                                        className="text-[var(--text-accent)] hover:underline flex items-center gap-1"
                                    >
                                        {copiedIndex === 'katex-2' ? <CheckIcon className="text-emerald-500" /> : <i className="bi bi-clipboard"></i>}
                                        <span>{copiedIndex === 'katex-2' ? 'Tersalin' : 'Salin'}</span>
                                    </button>
                                </div>
                                <code className="block p-2 rounded bg-[var(--bg-primary)] font-mono text-[11px] text-[var(--text-primary)] overflow-x-auto">
                                    {"\\int_{0}^{\\infty} f(x)dx \\quad \\lim_{x \\to 0}"}
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-[var(--radius-control)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] space-y-1">
                        <span className="font-bold text-[var(--text-primary)]">Mode Inline vs Blok:</span>
                        <p>Ketik <code>$x^2$</code> untuk menyatukan rumus di dalam baris kalimat, atau <code>$$x^2$$</code> untuk menempatkan rumus besar di tengah baris baru.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'smart-import',
            category: 'AI',
            title: 'Smart Import (Salin-Tempel dari Word & PDF)',
            icon: BookIcon,
            badge: 'Parser Otomatis',
            badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
            readTime: '2 mnt baca',
            summary: 'Salin puluhan teks mentah dari file Word/PDF lama dan ubah menjadi butir soal terstruktur dalam hitungan detik.',
            keywords: ['import', 'word', 'pdf', 'copas', 'paste', 'parser', 'kunci', 'nomor', 'arab'],
            content: () => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Fitur <strong>Smart Import</strong> memungkinkan Anda memindahkan puluhan soal sekaligus dari file Word (.docx), PDF, atau Notepad dengan cara menyalin (copy) teks mentahnya lalu menempelkannya (paste) ke kotak import.
                    </p>

                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <span className="font-bold text-[var(--text-primary)]">Format Penulisan yang Didukung Otomatis:</span>
                        <div className="p-3 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)] font-mono text-[11px] text-[var(--text-primary)] space-y-2">
                            <div>
                                <span className="text-[var(--text-muted)]"># Soal Pilihan Ganda:</span><br />
                                1. Apa ibu kota negara Indonesia?<br />
                                A. Bandung<br />
                                B. Jakarta<br />
                                C. Surabaya<br />
                                D. Medan<br />
                                Kunci: B
                            </div>
                            <hr className="border-[var(--border-primary)]" />
                            <div>
                                <span className="text-[var(--text-muted)]"># Soal Uraian / Esai:</span><br />
                                2. Sebutkan 3 hukum Newton tentang gerak!<br />
                                Jawab: Hukum I Newton (Kelembaman), Hukum II (F=m.a), Hukum III (Aksi-Reaksi).
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-[var(--radius-control)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] space-y-1">
                        <span className="font-bold text-[var(--text-primary)]">Fitur Deteksi Cerdas:</span>
                        <p>Sistem otomatis mengenali pilihan ABCD, mengonversi angka Arab (<code className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded">١, ٢</code>) menjadi angka standar, dan menormalkan opsi abjad Arab (<code className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded">أ, ب, ج, د</code>) secara otomatis.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'dropbox-cloud',
            category: 'CLOUD',
            title: 'Sinkronisasi Awan & Cadangan Dropbox',
            icon: DropboxIcon,
            badge: 'Backup Nirkabel',
            badgeColor: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
            readTime: '2 mnt baca',
            summary: 'Hubungkan akun Dropbox pribadi untuk mencadangkan seluruh naskah ujian dan menyinkronkannya antar laptop/PC.',
            keywords: ['dropbox', 'cloud', 'backup', 'cadangan', 'sinkron', 'sync', 'restore', 'tabrakan', 'conflict'],
            actionLabel: 'Buka Pengaturan Dropbox',
            actionView: 'settings',
            content: (navigate) => (
                <div className="space-y-4 text-xs sm:text-sm">
                    <p className="leading-relaxed">
                        Data naskah Anda tersimpan 100% aman di komputer lokal. Untuk kenyamanan bekerja bergantian antara laptop rumah dan komputer sekolah, Anda dapat mengaktifkan <strong>Sinkronisasi Dropbox</strong>.
                    </p>

                    <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
                        <span className="font-bold text-[var(--text-primary)]">Cara Menghubungkan:</span>
                        <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)] leading-relaxed">
                            <li>Buka menu <strong>Pengaturan</strong> lalu pilih tab <strong>Penyimpanan Cloud (Dropbox)</strong>.</li>
                            <li>Ikuti petunjuk untuk memasukkan App Key dan hubungkan akun Dropbox Anda (gratis).</li>
                            <li>Setelah terhubung, naskah ujian akan otomatis dicadangkan saat Anda menyimpan dokumen.</li>
                        </ol>
                    </div>

                    <div className="p-3 rounded-[var(--radius-control)] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1 text-xs">
                        <span className="font-bold flex items-center gap-1.5">
                            <i className="bi bi-shield-exclamation text-amber-600"></i> Perlindungan Konflik Data (Conflict Resolution):
                        </span>
                        <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                            Jika terdeteksi ada naskah yang lebih baru di cloud (misalnya setelah mengedit di laptop sekolah), aplikasi akan menampilkan peringatan untuk mengunduh versi terbaru agar tidak ada data yang tertimpa secara tidak sengaja.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    // Filter guides based on selected category and search query
    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const matchesCategory = selectedCategory === 'ALL' || guide.category === selectedCategory;
            
            if (!searchQuery.trim()) return matchesCategory;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = 
                guide.title.toLowerCase().includes(q) ||
                guide.summary.toLowerCase().includes(q) ||
                guide.badge.toLowerCase().includes(q) ||
                guide.keywords.some(k => k.toLowerCase().includes(q));

            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const toggleGuide = (id: string) => {
        setOpenGuideId(openGuideId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Quick 3-Step Flow Banner */}
            {!searchQuery && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                            <i className="bi bi-signpost-split-fill text-[var(--text-accent)]"></i>
                            <span>Alur Cepat Menyusun Naskah Ujian</span>
                        </h3>
                        <span className="text-[11px] text-[var(--text-muted)]">3 Langkah Mudah</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="app-surface p-4 rounded-[var(--radius-card)] flex items-start gap-3 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all">
                            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                                1
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Buat Ujian & Atur Kop</h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                    Buka menu <strong>Arsip</strong>. Buat naskah baru, masukkan mata pelajaran, tanggal, dan sesuaikan teks kop surat instansi.
                                </p>
                            </div>
                        </div>

                        <div className="app-surface p-4 rounded-[var(--radius-card)] flex items-start gap-3 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all">
                            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-purple-200 dark:border-purple-800">
                                2
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Tulis / Impor Soal</h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                    Ketik butir soal, gunakan <strong>Smart Import</strong> untuk salin-tempel dari Word/PDF, atau ambil dari <strong>Pusat Berbagi MGMP</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="app-surface p-4 rounded-[var(--radius-card)] flex items-start gap-3 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all">
                            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                                3
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Preset Gaya & Cetak</h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                    Pilih <strong>Gaya Visual 1-Klik</strong> (Madrasah / Kurikulum Merdeka), sesuaikan <strong>Smart Fit</strong> agar pas halaman, lalu cetak/ekspor.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Guides List / Search Results */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                        Menampilkan <strong>{filteredGuides.length}</strong> panduan interaktif
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

                {filteredGuides.length === 0 ? (
                    <div className="app-surface p-8 rounded-[var(--radius-card)] text-center space-y-3 border border-[var(--border-primary)]">
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] flex items-center justify-center mx-auto text-xl">
                            <SearchIcon />
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">Tidak Ada Panduan yang Cocok</h4>
                        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                            Coba ubah kata kunci pencarian atau ganti kategori filter untuk menemukan petunjuk yang Anda butuhkan.
                        </p>
                        {onClearSearch && (
                            <button
                                onClick={onClearSearch}
                                className="px-4 py-2 rounded-[var(--radius-control)] bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                            >
                                <span>Lihat Semua Panduan</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredGuides.map((guide) => {
                            const isOpen = openGuideId === guide.id || (Boolean(searchQuery) && filteredGuides.length <= 3);
                            const Icon = guide.icon;

                            return (
                                <div
                                    key={guide.id}
                                    className="app-surface rounded-[var(--radius-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] overflow-hidden transition-all shadow-xs"
                                >
                                    <button
                                        onClick={() => toggleGuide(guide.id)}
                                        className="w-full flex items-start sm:items-center justify-between gap-3 p-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] text-[var(--text-accent)] border border-[var(--border-primary)] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                                                <Icon className="text-base" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-control)] ${guide.badgeColor}`}>
                                                        {guide.badge}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        • {guide.readTime}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                                                    {guide.title}
                                                </h4>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                                                    {guide.summary}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] flex-shrink-0 mt-1 sm:mt-0">
                                            <i className={`bi bi-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''}`}></i>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="p-4 sm:p-5 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/40 space-y-4 animate-fade-in">
                                            {guide.content(onNavigate)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuideTab;

