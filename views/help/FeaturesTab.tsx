import React from 'react';

const FeatureItem: React.FC<{ icon: string, title: string, description: string, color: string }> = ({ icon, title, description, color }) => (
    <div className="flex flex-col h-full p-5 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-200 border border-transparent hover:border-[var(--border-primary)] group">
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 ${color} bg-opacity-10 text-xl transition-transform group-hover:scale-110 duration-300`}>
            <i className={`bi ${icon} ${color.replace('bg-', 'text-')}`}></i>
        </div>
        <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
    </div>
);

const FeaturesTab: React.FC = () => {
    const features = [
        {
            icon: "bi-collection-fill",
            title: "Generator Paket (Anti Nyontek)",
            description: "Buat hingga 5 varian paket soal (Paket A, B, C...) secara otomatis. Urutan soal dan opsi jawaban diacak untuk meminimalisir kecurangan.",
            color: "bg-purple-600"
        },
        {
            icon: "bi-lightning-charge-fill",
            title: "Smart Import",
            description: "Migrasi kilat! Salin teks soal mentah dari Word/PDF, dan aplikasi akan memformatnya menjadi soal siap edit secara otomatis.",
            color: "bg-amber-500"
        },
        {
            icon: "bi-pencil-square",
            title: "Editor Canggih",
            description: "Format teks, gambar, tabel, dan rumus matematika dengan mudah. Mendukung navigasi halaman untuk performa optimal.",
            color: "bg-blue-500"
        },
        {
            icon: "bi-stars",
            title: "Kecerdasan Buatan (AI)",
            description: "Buntu ide? Gunakan AI Generator untuk membuat draf soal otomatis berdasarkan topik dan tingkat kesulitan.",
            color: "bg-purple-500"
        },
        {
            icon: "bi-cloud-check-fill",
            title: "Sinkronisasi Cloud",
            description: "Hubungkan Dropbox untuk mem-backup dan menyinkronkan data ujian antar perangkat dengan aman.",
            color: "bg-sky-500"
        },
        {
            icon: "bi-layout-split",
            title: "Layout Otomatis",
            description: "Pilih mode 1 kolom atau 2 kolom hemat kertas. Format soal dan opsi akan menyesuaikan secara otomatis.",
            color: "bg-orange-500"
        },
        {
            icon: "bi-translate",
            title: "Dukungan RTL (Arab)",
            description: "Dukungan penuh untuk penulisan Bahasa Arab dengan arah teks kanan-ke-kiri dan penomoran Arab.",
            color: "bg-green-500"
        },
        {
            icon: "bi-file-earmark-word",
            title: "Ekspor Dokumen",
            description: "Unduh hasil kerja Anda ke format Microsoft Word (.docx), HTML, Moodle XML, atau cetak langsung ke PDF.",
            color: "bg-indigo-500"
        },
        {
            icon: "bi-journal-richtext",
            title: "Bank Soal Personal",
            description: "Simpan butir soal favorit Anda ke bank soal lokal untuk digunakan kembali di ujian mendatang.",
            color: "bg-pink-500"
        },
        {
            icon: "bi-folder-fill",
            title: "Manajemen Arsip",
            description: "Kelompokkan ujian dalam folder dan label warna-warni agar arsip Anda tetap rapi dan mudah dicari.",
            color: "bg-yellow-500"
        }
    ];

    return (
        <div className="pb-10 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Fitur Lengkap</h2>
                <p className="text-[var(--text-secondary)]">Semua alat yang Anda butuhkan untuk membuat ujian berkualitas.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((f, i) => (
                    <FeatureItem key={i} icon={f.icon} title={f.title} description={f.description} color={f.color} />
                ))}
            </div>
        </div>
    );
};

export default FeaturesTab;