import React from 'react';
import { 
    SearchIcon, PlusIcon, EditIcon, PrinterIcon, ShuffleIcon, CopyIcon, 
    MoveIcon, TagIcon, TrashIcon, FolderIcon, FolderOpenIcon, SaveIcon,
    ZoomInIcon, WordIcon, FileCodeIcon, ServerIcon, DropboxIcon, HddIcon,
    CardTextIcon, BankIcon, StarsIcon, CloudDownloadIcon, CheckIcon,
    CloudUploadIcon, SettingsIcon, RobotIcon, QrCodeIcon, ScanIcon, CloudCheckIcon
} from '../../components/Icons';

const InlineIcon = ({ icon: Icon, className }: { icon: React.ElementType, className?: string }) => (
    <span className={`inline-flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded px-1 mx-1 align-middle text-[var(--text-primary)] ${className || ''}`} style={{ width: '20px', height: '20px' }}>
        <Icon className="text-xs" />
    </span>
);

interface TimelineItemProps {
    number: number;
    title: string;
    children: React.ReactNode;
    isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ number, title, children, isLast = false }) => (
    <div className="flex gap-6 relative group">
        {/* Line */}
        {!isLast && (
            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-[var(--border-primary)] group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors"></div>
        )}
        
        {/* Circle Number */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold bg-white dark:bg-slate-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 z-10 shadow-sm group-hover:scale-110 transition-transform duration-300">
            {number}
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-10">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
            <div className="bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-sm text-[var(--text-secondary)] text-sm space-y-3 leading-relaxed">
                {children}
            </div>
        </div>
    </div>
);

const GuideTab: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto pb-10 animate-fade-in">
            <div className="mb-10 text-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Panduan Penggunaan</h2>
                <p className="text-[var(--text-secondary)]">Ikuti langkah-langkah berikut untuk menguasai SoalGenius.</p>
            </div>

            <div className="pl-2">
                <TimelineItem number={1} title="Manajemen Arsip & Organisasi">
                    <p>Mulai dari halaman <strong>Arsip</strong>, pusat pengelolaan data Anda.</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 marker:text-blue-500">
                        <li>
                            <strong>Pencarian:</strong> Ketik judul pada kolom <InlineIcon icon={SearchIcon}/>. Gunakan filter <strong>Folder</strong> <InlineIcon icon={FolderOpenIcon}/> atau <strong>Label</strong> <InlineIcon icon={TagIcon}/> untuk menyaring.
                        </li>
                        <li>
                            <strong>Buat Baru:</strong> Klik tombol <span className="bg-[var(--bg-accent)] text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">+ Buat Ujian</span>.
                        </li>
                        <li>
                            <strong>Folder & Label:</strong> Klik <InlineIcon icon={FolderIcon}/> untuk membuat/edit folder, dan <InlineIcon icon={TagIcon}/> untuk mengelola label global.
                        </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                        <p className="font-semibold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Aksi Cepat Kartu Ujian:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2"><InlineIcon icon={EditIcon}/> Edit Soal</div>
                            <div className="flex items-center gap-2"><InlineIcon icon={PrinterIcon}/> Pratinjau</div>
                            <div className="flex items-center gap-2"><InlineIcon icon={ShuffleIcon}/> Acak Soal</div>
                            <div className="flex items-center gap-2"><InlineIcon icon={CopyIcon}/> Duplikat</div>
                            <div className="flex items-center gap-2"><InlineIcon icon={MoveIcon}/> Pindah Folder</div>
                            <div className="flex items-center gap-2 text-red-500"><InlineIcon icon={TrashIcon}/> Hapus</div>
                        </div>
                    </div>
                </TimelineItem>

                <TimelineItem number={2} title="Membuat & Mengedit Soal">
                    <p>Masuk ke <strong>Editor</strong> untuk menyusun konten.</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 marker:text-blue-500">
                        <li>
                            <strong>Info Ujian:</strong> Isi Judul, Waktu, dan atur <strong>Tata Letak</strong> (1/2 Kolom) di panel atas.
                        </li>
                        <li>
                            <strong>Bagian (Section):</strong> Pisahkan jenis soal (misal: PG, Esai) dengan tombol <span className="border border-dashed px-1 rounded text-xs border-[var(--border-secondary)]">+ Tambah Bagian</span>.
                        </li>
                        <li>
                            <strong>Tambah Soal:</strong> Gunakan menu <strong>+ Tambah Soal</strong>. Pilih manual atau <InlineIcon icon={StarsIcon}/> <strong>Buat dengan AI</strong>.
                        </li>
                        <li>
                            <strong>Navigasi:</strong> Gunakan tombol halaman di bawah untuk berpindah antar halaman soal (per 10 soal) agar editor tetap ringan.
                        </li>
                    </ul>
                </TimelineItem>

                <TimelineItem number={3} title="Format Dokumen & Kop">
                    <p>Sesuaikan tampilan dokumen di menu <strong>Pengaturan <InlineIcon icon={SettingsIcon}/></strong>.</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 marker:text-blue-500">
                        <li>
                            <strong>Kertas <InlineIcon icon={PrinterIcon}/>:</strong> Atur ukuran (A4, F4, Legal), margin, jenis font (termasuk font Arab), dan ukuran huruf.
                        </li>
                        <li>
                            <strong>Kop Surat <InlineIcon icon={CardTextIcon}/>:</strong> Masukkan teks instansi (baris per baris) dan unggah logo (Kiri/Kanan).
                        </li>
                    </ul>
                </TimelineItem>

                <TimelineItem number={4} title="Asisten AI (Kecerdasan Buatan)">
                    <p>Gunakan AI untuk membuat soal secara otomatis.</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 marker:text-blue-500">
                        <li>
                            <strong>Setup <InlineIcon icon={RobotIcon}/>:</strong> Masuk ke <strong>Pengaturan {'>'} AI</strong>. Masukkan <strong>Google Gemini API Key</strong> agar AI lebih cerdas (Mode Advance). Tanpa kunci, AI berjalan dalam mode dasar.
                        </li>
                        <li>
                            <strong>Generate <InlineIcon icon={StarsIcon}/>:</strong> Di Editor, klik "+ Tambah Soal" lalu pilih "Buat dengan AI". Masukkan topik, jenjang, dan jumlah soal.
                        </li>
                    </ul>
                </TimelineItem>

                <TimelineItem number={5} title="Manajemen Data & Offline">
                    <p>Kelola penyimpanan data lokal Anda di menu <strong>Pengaturan <InlineIcon icon={HddIcon}/></strong>.</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 marker:text-blue-500">
                        <li>
                            <strong>Mode Offline:</strong> Klik tombol <strong>Unduh Aset Offline</strong> <InlineIcon icon={CloudDownloadIcon}/>. Setelah status berubah menjadi "Siap Offline" <InlineIcon icon={CheckIcon}/>, Anda bisa membuka aplikasi ini tanpa internet.
                        </li>
                        <li>
                            <strong>Backup Lokal:</strong> Klik "Backup Data (JSON)" untuk mengunduh semua data ujian ke komputer Anda sebagai arsip.
                        </li>
                        <li>
                            <strong>Restore Lokal:</strong> Gunakan "Restore Data" untuk memulihkan data dari file JSON backup.
                        </li>
                    </ul>
                </TimelineItem>

                <TimelineItem number={6} title="Sinkronisasi & Pairing Perangkat" isLast={true}>
                    <p>Hubungkan Dropbox agar data aman dan bisa diakses dari berbagai perangkat.</p>
                    
                    {/* Status Indicator Info */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 mb-4 text-xs">
                        <strong className="text-green-800 dark:text-green-300 flex items-center gap-1 mb-1">
                            <InlineIcon icon={CloudCheckIcon} /> Indikator Penyimpanan
                        </strong>
                        Saat terhubung, Anda dapat memantau sisa kapasitas penyimpanan Dropbox Anda langsung melalui indikator progress bar di menu Cloud.
                    </div>

                    <div className="space-y-4">
                        {/* Cara 1: Manual */}
                        <div className="border border-[var(--border-secondary)] rounded-lg p-3">
                            <h4 className="font-bold text-sm mb-2 text-blue-600 dark:text-blue-400">A. Setup Manual (Perangkat Pertama)</h4>
                            <ul className="list-disc list-inside ml-1 text-xs text-[var(--text-secondary)] space-y-1">
                                <li>Buat "App" di <a href="https://www.dropbox.com/developers/apps" target="_blank" className="underline font-bold">Dropbox Developers</a> (Pilih "Scoped Access" & "App Folder").</li>
                                <li>Masuk ke <strong>Pengaturan {'>'} Cloud <InlineIcon icon={DropboxIcon}/></strong>.</li>
                                <li>Salin <strong>App Key</strong> & <strong>App Secret</strong> dari Dropbox ke aplikasi.</li>
                                <li>Klik "Dapatkan Kode", izinkan akses, lalu tempel kode otorisasi.</li>
                            </ul>
                        </div>

                        {/* Cara 2: Pairing */}
                        <div className="border border-[var(--border-secondary)] rounded-lg p-3 bg-[var(--bg-tertiary)]">
                            <h4 className="font-bold text-sm mb-2 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                <QrCodeIcon /> B. Pairing Cepat (Perangkat Kedua)
                            </h4>
                            <p className="text-xs mb-2 text-[var(--text-secondary)]">Gunakan ini jika Anda sudah memiliki perangkat utama yang terhubung.</p>
                            <ol className="list-decimal list-inside ml-1 text-xs text-[var(--text-secondary)] space-y-1">
                                <li><strong>Di HP Utama:</strong> Buka menu Cloud, klik tombol <strong>"Bagikan Konfigurasi"</strong>. QR Code akan muncul.</li>
                                <li><strong>Di HP Baru:</strong> Buka menu Cloud, klik tombol <strong>"Scan QR Code"</strong> <InlineIcon icon={ScanIcon}/>.</li>
                                <li>Arahkan kamera ke layar HP utama.</li>
                                <li>Aplikasi akan otomatis menyalin kunci akses, menghubungkan akun, dan <strong>mengunduh data backup</strong> dari cloud.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]">
                        <span className="bg-blue-600 text-white p-1 rounded-full mt-0.5 text-xs font-bold w-5 h-5 flex items-center justify-center">!</span>
                        <div>
                            <strong className="block text-[var(--text-primary)] text-sm">Upload & Download</strong>
                            <p className="text-xs">Ingat untuk selalu klik <InlineIcon icon={CloudUploadIcon}/> <strong>Upload</strong> setelah selesai bekerja di satu perangkat, dan klik <InlineIcon icon={CloudDownloadIcon}/> <strong>Download</strong> saat berpindah ke perangkat lain.</p>
                        </div>
                    </div>
                </TimelineItem>
            </div>
        </div>
    );
};

export default GuideTab;