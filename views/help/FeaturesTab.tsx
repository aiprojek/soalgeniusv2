import React from 'react';

const FeatureItem: React.FC<{ icon: string, title: string, description: string, tone: string, iconTone: string }> = ({ icon, title, description, tone, iconTone }) => (
    <div className="app-surface flex flex-col h-full p-4 rounded-[var(--radius-card)] hover:bg-[var(--bg-tertiary)] transition-colors duration-200 group">
        <div className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-control)] mb-3 ${tone}`}>
            <i className={`bi ${icon} ${iconTone} text-lg`}></i>
        </div>
        <h3 className="font-bold text-[var(--text-primary)] text-base mb-1.5">{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
    </div>
);

const FeaturesTab: React.FC = () => {
    const features = [
        {
            icon: "bi-collection-fill",
            title: "Generator Paket (Anti Nyontek)",
            description: "Buat hingga 5 varian paket soal (Paket A, B, C...) secara otomatis. Urutan soal dan opsi jawaban diacak untuk meminimalisir kecurangan.",
            tone: "bg-purple-100 dark:bg-purple-900/30",
            iconTone: "text-purple-600 dark:text-purple-300"
        },
        {
            icon: "bi-lightning-charge-fill",
            title: "Smart Import",
            description: "Migrasi kilat! Salin teks soal mentah dari Word/PDF, dan aplikasi akan memformatnya menjadi soal siap edit secara otomatis.",
            tone: "bg-amber-100 dark:bg-amber-900/30",
            iconTone: "text-amber-600 dark:text-amber-300"
        },
        {
            icon: "bi-pencil-square",
            title: "Editor Canggih",
            description: "Format teks, gambar, tabel, dan rumus matematika dengan mudah. Mendukung navigasi halaman untuk performa optimal.",
            tone: "bg-blue-100 dark:bg-blue-900/30",
            iconTone: "text-blue-600 dark:text-blue-300"
        },
        {
            icon: "bi-stars",
            title: "Kecerdasan Buatan (AI)",
            description: "Buntu ide? Gunakan AI Generator untuk membuat draf soal otomatis berdasarkan topik dan tingkat kesulitan.",
            tone: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
            iconTone: "text-fuchsia-600 dark:text-fuchsia-300"
        },
        {
            icon: "bi-cloud-check-fill",
            title: "Sinkronisasi Cloud",
            description: "Hubungkan Dropbox untuk mem-backup dan menyinkronkan data ujian antar perangkat dengan aman.",
            tone: "bg-sky-100 dark:bg-sky-900/30",
            iconTone: "text-sky-600 dark:text-sky-300"
        },
        {
            icon: "bi-layout-split",
            title: "Layout Otomatis",
            description: "Pilih mode 1 kolom atau 2 kolom hemat kertas. Format soal dan opsi akan menyesuaikan secara otomatis.",
            tone: "bg-orange-100 dark:bg-orange-900/30",
            iconTone: "text-orange-600 dark:text-orange-300"
        },
        {
            icon: "bi-translate",
            title: "Dukungan RTL (Arab)",
            description: "Dukungan penuh untuk penulisan Bahasa Arab dengan arah teks kanan-ke-kiri dan penomoran Arab.",
            tone: "bg-green-100 dark:bg-green-900/30",
            iconTone: "text-green-600 dark:text-green-300"
        },
        {
            icon: "bi-file-earmark-word",
            title: "Ekspor Dokumen",
            description: "Unduh hasil kerja Anda ke format Microsoft Word (.docx), HTML, Moodle XML, atau cetak langsung ke PDF.",
            tone: "bg-indigo-100 dark:bg-indigo-900/30",
            iconTone: "text-indigo-600 dark:text-indigo-300"
        },
        {
            icon: "bi-journal-richtext",
            title: "Bank Soal Personal",
            description: "Simpan butir soal favorit Anda ke bank soal lokal untuk digunakan kembali di ujian mendatang.",
            tone: "bg-pink-100 dark:bg-pink-900/30",
            iconTone: "text-pink-600 dark:text-pink-300"
        },
        {
            icon: "bi-folder-fill",
            title: "Manajemen Arsip",
            description: "Kelompokkan ujian dalam folder dan label warna-warni agar arsip Anda tetap rapi dan mudah dicari.",
            tone: "bg-yellow-100 dark:bg-yellow-900/30",
            iconTone: "text-yellow-600 dark:text-yellow-300"
        }
    ];

    return (
        <div className="pb-8 animate-fade-in">
            <div className="text-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Fitur Utama</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto">Ringkasan fitur paling penting yang membuat alur kerja SoalGenius cepat dan rapi.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((f, i) => (
                    <FeatureItem key={i} icon={f.icon} title={f.title} description={f.description} tone={f.tone} iconTone={f.iconTone} />
                ))}
            </div>
        </div>
    );
};

export default FeaturesTab;
