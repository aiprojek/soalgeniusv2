import React, { useState } from 'react';
import {
    SearchIcon, PlusIcon, StackIcon, SettingsIcon, CloudDownloadIcon,
    DropboxIcon, StarsIcon, PrinterIcon, BookIcon
} from '../../components/Icons';

interface AccordionGuide {
    title: string;
    icon: React.ElementType;
    badge: string;
    badgeColor: string;
    content: React.ReactNode;
}

const GuideTab: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const guides: AccordionGuide[] = [
        {
            title: "Panduan Smart Import (Sintaks Copy-Paste)",
            icon: BookIcon,
            badge: "Format Teks",
            badgeColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300",
            content: (
                <div className="space-y-4">
                    <p>
                        Fitur <strong>Smart Import</strong> memungkinkan Anda memindahkan puluhan soal sekaligus dari file Word (.docx), PDF, atau Notepad dengan cara menyalin (copy) teks mentahnya lalu menempelkannya (paste) ke kotak import.
                    </p>
                    
                    <div className="space-y-2">
                        <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">Aturan Sintaks Penulisan Soal:</p>
                        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-xs font-mono text-[var(--text-primary)] overflow-x-auto space-y-3 leading-relaxed">
                            <div>
                                <span className="text-gray-400"># Contoh Soal Pilihan Ganda (Latin):</span><br />
                                1. Apa nama planet terbesar di tata surya kita?<br />
                                A. Bumi<br />
                                B. Mars<br />
                                C. Jupiter<br />
                                D. Saturnus<br />
                                Kunci: C
                            </div>
                            <hr className="border-[var(--border-primary)]" />
                            <div>
                                <span className="text-gray-400"># Contoh Soal Esai atau Isian:</span><br />
                                2. Jelaskan proses terjadinya siklus air secara singkat!<br />
                                Jawab: Air menguap (evaporasi), membentuk awan (kondensasi), lalu turun hujan (presipitasi).
                            </div>
                            <hr className="border-[var(--border-primary)]" />
                            <div>
                                <span className="text-gray-400"># Contoh Soal Bahasa Arab (Mendukung Penomoran & Abjad Arab):</span><br />
                                ١. مَا هُوَ اسْمُ هَذَا الْكِتَابِ؟<br />
                                أ. الْقُرْآنُ الْكَرِيمُ<br />
                                ب. الدَّفْتَرُ<br />
                                ج. الْقَلَمُ<br />
                                د. الْكُرْسِيُّ<br />
                                الجواب: أ
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-muted)]/50 p-4 border border-[var(--border-primary)]/50 text-xs sm:text-sm space-y-2">
                        <p className="font-bold text-[var(--text-primary)]">💡 Fitur Pintar & Normalisasi:</p>
                        <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                            <li><strong>Deteksi Tipe Soal Otomatis</strong>: Jika teks soal memiliki pilihan opsi (A, B, C, dst), ia akan diimpor sebagai <strong>Pilihan Ganda</strong>. Jika tidak memiliki opsi, ia otomatis menjadi soal <strong>Esai/Uraian</strong>.</li>
                            <li><strong>Normalisasi Digit Arab</strong>: Angka Arab/Persia (<code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">١</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">٢</code>) diubah menjadi angka Latin (<code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">1</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">2</code>) agar penomoran tidak rusak.</li>
                            <li><strong>Konversi Huruf Opsi Arab</strong>: Opsi Abjad Arab (<code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">أ</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">ب</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">ج</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">د</code>) akan otomatis dipetakan ke huruf Latin (<code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">A</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">B</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">C</code>, <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded">D</code>) untuk mempermudah deteksi kunci jawaban di sistem.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: "Panduan AI Generator (Membuat Soal dengan Gemini AI)",
            icon: StarsIcon,
            badge: "Kecerdasan Buatan",
            badgeColor: "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300",
            content: (
                <div className="space-y-4">
                    <p>
                        Tidak. SoalGenius berstatus <strong>100% gratis dan Open Source</strong> di bawah lisensi GNU GPL v3. Siapa pun (guru maupun sekolah) dapat memanfaatkannya secara gratis tanpa batasan fitur.
                    </p>
                    
                    <div className="space-y-2.5">
                        <p className="font-bold text-[var(--text-primary)] text-sm">Langkah 1: Setup Kunci API Gemini (Sekali Saja)</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <li>Dapatkan API Key Gemini secara gratis dengan mengunjungi <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Google AI Studio</a>.</li>
                            <li>Masuk menggunakan akun Google Anda dan klik <strong>Create API Key</strong>.</li>
                            <li>Salin API Key tersebut.</li>
                            <li>Buka SoalGenius, masuk ke halaman <strong>Pengaturan</strong> (pojok kiri bawah menu) lalu klik tab <strong>Umum & Kunci API</strong>.</li>
                            <li>Tempel API Key Anda pada kolom *Kunci API Gemini* lalu klik **Simpan Pengaturan**.</li>
                        </ol>
                    </div>

                    <div className="space-y-2.5">
                        <p className="font-bold text-[var(--text-primary)] text-sm">Langkah 2: Menghasilkan Soal di Editor</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <li>Buka naskah ujian yang sedang Anda edit, atau buat ujian baru.</li>
                            <li>Di pojok kanan atas area penyuntingan soal, klik tombol <span className="bg-[var(--bg-muted)] px-2 py-0.5 rounded text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1"><StarsIcon className="text-[10px]" /> Generator AI</span>.</li>
                            <li>Pilih provider <strong>Gemini</strong> (atau gunakan *Pollinations* jika Anda belum memasukkan API Key).</li>
                            <li>Tentukan Parameter: Topik Soal (misal: *Fotosintesis tumbuhan*), Jumlah Soal, Jenjang Kelas, Tingkat Kesulitan, dan Tipe Soal (Pilihan Ganda atau Esai).</li>
                            <li>Klik tombol <strong>Buat Soal</strong>. Tunggu beberapa detik, lalu pratinjau soal yang dihasilkan.</li>
                            <li>Pilih soal yang disukai, lalu klik <strong>Tambahkan ke Ujian</strong>.</li>
                        </ol>
                    </div>
                </div>
            )
        },
        {
            title: "Panduan Membuat Varian Paket Ujian (Acak Soal & Opsi)",
            icon: StackIcon,
            badge: "Acak Soal",
            badgeColor: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300",
            content: (
                <div className="space-y-3">
                    <p>
                        Untuk meminimalisir kecurangan atau aksi menyontek antar siswa saat ujian berlangsung, Anda dapat membuat versi paket soal yang diacak (seperti Paket A, Paket B, dst) dari satu master naskah ujian yang sama.
                    </p>
                    <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">Cara Menggunakan Generator Paket:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                        <li>Selesaikan penulisan dan penyusunan naskah soal master Anda di menu Editor.</li>
                        <li>Di pojok kanan bawah layar Editor, klik tombol <strong>Acak & Varian</strong>.</li>
                        <li>Tentukan jumlah variasi paket yang ingin dihasilkan (maksimal 5 paket: Paket A sampai Paket E).</li>
                        <li>Klik <strong>Hasilkan Paket Ujian</strong>.</li>
                        <li>Aplikasi secara cerdas akan mengacak urutan butir soal di setiap bagian, sekaligus mengacak pilihan opsi jawaban (A, B, C, D, E) untuk soal Pilihan Ganda.</li>
                        <li>Dua dokumen baru dengan judul diakhiri <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">Varian A</code> dan <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">Varian B</code> akan dibuat otomatis dan dapat Anda temukan di menu Arsip.</li>
                    </ol>
                </div>
            )
        },
        {
            title: "Panduan Sinkronisasi Awan & Dropbox",
            icon: DropboxIcon,
            badge: "Cloud Sync",
            badgeColor: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300",
            content: (
                <div className="space-y-4">
                    <p>
                        <strong>SoalGenius</strong> hadir sebagai solusi mandiri berbasis peramban (browser) yang menangani seluruh tata letak dokumen secara otomatis. Semua naskah soal tersimpan dengan aman di penyimpanan lokal komputer Anda. Anda dapat mengaktifkan **Sinkronisasi Awan Dropbox**.
                    </p>

                    <div className="space-y-2">
                        <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">Cara Menghubungkan Dropbox:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <li>Buka menu <strong>Pengaturan</strong> lalu pilih tab <strong>Penyimpanan Cloud (Dropbox)</strong>.</li>
                            <li>Buka tautan konsol developer Dropbox yang tertera di sana untuk mendaftarkan aplikasi Anda secara pribadi (gratis).</li>
                            <li>Dapatkan <strong>App Key</strong> dan <strong>App Secret</strong> dari Dropbox console, lalu tempel di kolom yang tersedia di SoalGenius.</li>
                            <li>Klik tombol **Hubungkan ke Dropbox**. Anda akan dialihkan ke halaman otorisasi Dropbox.</li>
                            <li>Salin Kode Otorisasi yang muncul, tempel kembali di aplikasi SoalGenius, lalu klik **Verifikasi Kode**.</li>
                        </ol>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-muted)]/50 p-4 border border-[var(--border-primary)]/50 text-xs sm:text-sm space-y-2">
                        <p className="font-bold text-[var(--text-primary)]">⚠️ Deteksi Tabrakan Data (Conflict Resolution):</p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            Saat aplikasi pertama kali dibuka dan Dropbox dalam keadaan terhubung, sistem akan mengecek file backup di cloud. Jika terdeteksi ada file backup yang memiliki stempel waktu (*timestamp*) lebih baru daripada penyimpanan lokal komputer saat ini (misalnya karena Anda habis mengedit di komputer sekolah), SoalGenius akan menampilkan modal peringatan. Anda akan diminta memilih apakah ingin **mengunduh perubahan dari cloud** (menimpa database lokal) untuk menyinkronkan data terbaru.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Panduan Bank Soal Personal",
            icon: BookIcon,
            badge: "Bank Soal",
            badgeColor: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300",
            content: (
                <div className="space-y-4">
                    <p>
                        Pernahkah Anda menulis soal yang sangat bagus dan ingin menggunakannya lagi di ujian semester berikutnya? Fitur **Bank Soal** adalah tempat penyimpanan butir soal favorit Anda secara terpisah dari naskah ujian utama.
                    </p>

                    <div className="space-y-2">
                        <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">Cara Menyimpan Soal ke Bank Soal:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <li>Di dalam Editor Ujian, carilah butir soal yang ingin Anda simpan.</li>
                            <li>Di sudut kanan bawah kotak soal tersebut, klik tombol berlambang disket/kotak arsip (<strong>Simpan ke Bank Soal</strong>).</li>
                            <li>Ubah kategori mata pelajaran atau kelas jika diperlukan, lalu klik konfirmasi simpan. Soal tersebut kini aman tersimpan di bank soal lokal.</li>
                        </ol>
                    </div>

                    <div className="space-y-2">
                        <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">Cara Mengimpor Soal dari Bank Soal:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                            <li>Saat mengedit naskah ujian baru, klik tombol <strong>Impor Bank Soal</strong> di bagian header atau opsi penambahan soal.</li>
                            <li>Modal Bank Soal akan muncul. Anda dapat memfilter berdasarkan mata pelajaran, jenjang kelas, atau mengetik kata kunci isi teks soal di bilah pencarian.</li>
                            <li>Beri tanda centang pada satu atau beberapa soal yang ingin dimasukkan kembali.</li>
                            <li>Klik tombol **Tambah Soal Terpilih**. Soal akan langsung masuk ke naskah ujian aktif Anda.</li>
                        </ol>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto pb-8 animate-fade-in px-1 space-y-5">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Pusat Bantuan & Panduan</h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto mt-1.5">
                    Pelajari langkah-langkah detail penggunaan fitur untuk memaksimalkan seluruh kemampuan aplikasi SoalGenius.
                </p>
            </div>

            {/* Quick Flow Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="app-surface p-4 rounded-[var(--radius-card)] text-left flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex-shrink-0 border border-blue-100 dark:border-blue-800">
                        <PlusIcon className="text-base" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Langkah 1</h4>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5">Buat Arsip & Folder</p>
                    </div>
                </div>
                <div className="app-surface p-4 rounded-[var(--radius-card)] text-left flex items-start gap-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex-shrink-0 border border-purple-100 dark:border-purple-800">
                        <StarsIcon className="text-base" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Langkah 2</h4>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5">Tulis / Import di Editor</p>
                    </div>
                </div>
                <div className="app-surface p-4 rounded-[var(--radius-card)] text-left flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex-shrink-0 border border-emerald-100 dark:border-emerald-800">
                        <PrinterIcon className="text-base" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Langkah 3</h4>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5">Preview & Ekspor Word/PDF</p>
                    </div>
                </div>
            </div>

            {/* In-depth collapsible guides */}
            <div className="space-y-3.5 pt-2">
                <div className="border-l-4 border-[var(--bg-accent)] pl-3.5 py-0.5">
                    <h3 className="font-extrabold text-[var(--text-primary)] text-base sm:text-lg">Daftar Panduan Lengkap</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Klik salah satu topik di bawah untuk melihat instruksi penggunaan yang mendalam.</p>
                </div>

                <div className="space-y-2.5">
                    {guides.map((guide, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className="border border-[var(--border-primary)] rounded-[20px] bg-[var(--bg-secondary)] overflow-hidden transition-all duration-300 shadow-sm hover:border-[var(--border-secondary)]">
                                <button 
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-[var(--bg-tertiary)]/50 transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-accent)] border border-[var(--border-primary)]/50 flex-shrink-0">
                                            <guide.icon className="text-base" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">{guide.title}</h4>
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${guide.badgeColor}`}>{guide.badge}</span>
                                        </div>
                                    </div>
                                    <i className={`bi bi-chevron-down text-sm text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] border-t border-[var(--border-primary)]' : 'max-h-0'} overflow-hidden`}>
                                    <div className="p-5 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/20">
                                        {guide.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GuideTab;
