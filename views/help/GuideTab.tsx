import React from 'react';
import {
    SearchIcon, PlusIcon, StackIcon, SettingsIcon, CloudDownloadIcon,
    DropboxIcon, StarsIcon, PrinterIcon
} from '../../components/Icons';

const GuideCard: React.FC<{
    step: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}> = ({ step, title, icon: Icon, children }) => (
    <div className="app-surface rounded-[var(--radius-card)] p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-accent)]">
                <Icon className="text-base" />
            </div>
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{step}</p>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
            </div>
        </div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
            {children}
        </div>
    </div>
);

const GuideTab: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto pb-8 animate-fade-in space-y-4">
            <div className="text-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Panduan Ringkas</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Alur paling cepat untuk mulai memakai SoalGenius tanpa harus membaca terlalu banyak.
                </p>
            </div>

            <GuideCard step="Langkah 1" title="Buat dan rapikan ujian" icon={PlusIcon}>
                <p>Mulai dari halaman Arsip untuk membuat ujian baru, mencari ujian lama, dan mengelompokkan arsip dengan folder atau label.</p>
                <ul className="list-disc list-inside space-y-1 marker:text-[var(--text-accent)]">
                    <li>Gunakan pencarian untuk menemukan judul dengan cepat <SearchIcon className="inline text-sm ml-1" /></li>
                    <li>Klik <strong>Buat Ujian</strong> untuk membuat naskah baru.</li>
                    <li>Pakai folder dan label agar arsip tetap rapi.</li>
                </ul>
            </GuideCard>

            <GuideCard step="Langkah 2" title="Susun isi soal di editor" icon={StarsIcon}>
                <p>Masuk ke Editor untuk mengisi informasi ujian, menambah bagian soal, lalu menyusun butir soal satu per satu.</p>
                <ul className="list-disc list-inside space-y-1 marker:text-[var(--text-accent)]">
                    <li>Tambahkan bagian untuk memisahkan PG, esai, atau tipe lain.</li>
                    <li>Gunakan <strong>Smart Import</strong> jika ingin menempel teks dari Word atau PDF.</li>
                    <li>Gunakan <strong>AI Generator</strong> untuk membuat draft soal lebih cepat.</li>
                </ul>
            </GuideCard>

            <GuideCard step="Langkah 3" title="Atur format dan hasil cetak" icon={PrinterIcon}>
                <p>Masuk ke Pengaturan untuk menyesuaikan tampilan dokumen sesuai kebutuhan sekolah atau madrasah.</p>
                <ul className="list-disc list-inside space-y-1 marker:text-[var(--text-accent)]">
                    <li>Atur ukuran kertas, font, spasi, dan margin <SettingsIcon className="inline text-sm ml-1" /></li>
                    <li>Tambahkan kop surat dan logo instansi.</li>
                    <li>Gunakan Preview untuk memeriksa hasil sebelum dicetak atau diekspor.</li>
                </ul>
            </GuideCard>

            <GuideCard step="Langkah 4" title="Backup, offline, dan sinkronisasi" icon={DropboxIcon}>
                <p>Setelah ujian siap, amankan data agar bisa dipakai lagi di perangkat lain atau tanpa internet.</p>
                <ul className="list-disc list-inside space-y-1 marker:text-[var(--text-accent)]">
                    <li>Pastikan status offline sudah siap jika aplikasi ingin dipakai tanpa internet <CloudDownloadIcon className="inline text-sm ml-1" /></li>
                    <li>Lakukan backup lokal JSON secara berkala.</li>
                    <li>Hubungkan Dropbox di perangkat utama, lalu gunakan pairing cepat untuk perangkat kedua jika perlu.</li>
                    <li>Gunakan generator paket <StackIcon className="inline text-sm ml-1" /> jika ingin membuat beberapa varian soal.</li>
                </ul>
            </GuideCard>
        </div>
    );
};

export default GuideTab;
