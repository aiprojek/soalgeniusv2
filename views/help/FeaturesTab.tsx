import React from 'react';

interface Feature {
    icon: string;
    title: string;
    description: string;
    tone: string;
    iconTone: string;
}

const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => (
    <div className="app-surface flex flex-col h-full p-4 rounded-[var(--radius-card)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)] hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group">
        <div className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-control)] mb-3 transition-transform duration-300 group-hover:scale-110 ${feature.tone}`}>
            <i className={`bi ${feature.icon} ${feature.iconTone} text-lg`}></i>
        </div>
        <h4 className="font-bold text-[var(--text-primary)] text-sm sm:text-base mb-1.5">{feature.title}</h4>
        <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed">{feature.description}</p>
    </div>
);

const FeatureCategory: React.FC<{ title: string; description: string; items: Feature[] }> = ({ title, description, items }) => (
    <div className="space-y-4">
        <div className="border-l-4 border-[var(--bg-accent)] pl-3.5 py-0.5">
            <h3 className="font-extrabold text-[var(--text-primary)] text-base sm:text-lg">{title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item, idx) => (
                <FeatureItem key={idx} feature={item} />
            ))}
        </div>
    </div>
);

const FeaturesTab: React.FC = () => {
    const editingFeatures: Feature[] = [
        {
            icon: "bi-pencil-square",
            title: "Editor Canggih (Rich-Text)",
            description: "Format teks tebal/miring, sisipkan gambar, buat tabel kompleks, dan render rumus matematika (KaTeX) dengan WYSIWYG editor.",
            tone: "bg-blue-100 dark:bg-blue-900/30",
            iconTone: "text-blue-600 dark:text-blue-300"
        },
        {
            icon: "bi-layout-split",
            title: "Layout Kolom Otomatis",
            description: "Atur dokumen dalam 1 kolom atau 2 kolom hemat kertas. Penomoran dan tata letak pilihan ganda akan menyesuaikan otomatis secara rapi.",
            tone: "bg-orange-100 dark:bg-orange-900/30",
            iconTone: "text-orange-600 dark:text-orange-300"
        },
        {
            icon: "bi-translate",
            title: "Dukungan RTL (Arab)",
            description: "Ketik soal bahasa Arab secara alami dari kanan-ke-kiri. Font khusus (Amiri, Areef Ruqaa) dan penomoran Arab didukung penuh.",
            tone: "bg-green-100 dark:bg-green-900/30",
            iconTone: "text-green-600 dark:text-green-300"
        }
    ];

    const aiFeatures: Feature[] = [
        {
            icon: "bi-lightning-charge-fill",
            title: "Smart Import Kilat",
            description: "Salin dan tempel teks mentah dari file Word/PDF. AI dan parser regex akan memformatnya menjadi draf soal ujian instan.",
            tone: "bg-amber-100 dark:bg-amber-900/30",
            iconTone: "text-amber-600 dark:text-amber-300"
        },
        {
            icon: "bi-stars",
            title: "Kecerdasan Buatan (Gemini AI)",
            description: "Buat bank soal baru secara otomatis berdasarkan topik spesifik, tingkat kesulitan, jenjang kelas, dan jumlah soal menggunakan Gemini AI.",
            tone: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
            iconTone: "text-fuchsia-600 dark:text-fuchsia-300"
        },
        {
            icon: "bi-collection-fill",
            title: "Generator Paket Soal",
            description: "Acak nomor soal sekaligus urutan opsi pilihan ganda untuk membuat hingga 5 paket naskah soal ujian berbeda (Paket A, B, C...) instan.",
            tone: "bg-purple-100 dark:bg-purple-900/30",
            iconTone: "text-purple-600 dark:text-purple-300"
        }
    ];

    const storageFeatures: Feature[] = [
        {
            icon: "bi-cloud-check-fill",
            title: "Dropbox Cloud Sync",
            description: "Cadangkan seluruh data ke awan dan sinkronkan naskah ujian antar laptop/PC secara nirkabel dengan integrasi Dropbox API.",
            tone: "bg-sky-100 dark:bg-sky-900/30",
            iconTone: "text-sky-600 dark:text-sky-300"
        },
        {
            icon: "bi-journal-richtext",
            title: "Bank Soal Personal",
            description: "Simpan butir soal pilihan Anda ke dalam Bank Soal lokal untuk disimpan, dikategorikan, dan diimpor kembali ke ujian di masa depan.",
            tone: "bg-pink-100 dark:bg-pink-900/30",
            iconTone: "text-pink-600 dark:text-pink-300"
        },
        {
            icon: "bi-folder-fill",
            title: "Manajemen Arsip & Folder",
            description: "Kelompokkan naskah ujian di dalam folder khusus dan berikan label warna agar arsip ujian tetap tertata rapi dan mudah dicari.",
            tone: "bg-yellow-100 dark:bg-yellow-900/30",
            iconTone: "text-yellow-600 dark:text-yellow-300"
        },
        {
            icon: "bi-file-earmark-word",
            title: "Multi Format Ekspor",
            description: "Ekspor ujian ke format Microsoft Word (.docx), file HTML mandiri, skema Moodle XML (untuk LMS), atau cetak langsung ke kertas/PDF.",
            tone: "bg-indigo-100 dark:bg-indigo-900/30",
            iconTone: "text-indigo-600 dark:text-indigo-300"
        }
    ];

    return (
        <div className="pb-8 animate-fade-in px-1 space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Fitur Unggulan</h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto mt-1.5">
                    SoalGenius dirancang dengan berbagai alat produktivitas untuk membantu guru menghemat waktu administratif.
                </p>
            </div>

            <div className="space-y-6">
                <FeatureCategory
                    title="Penyusunan & Format Ujian"
                    description="Alat penyuntingan canggih untuk mempermudah pengaturan estetika naskah soal."
                    items={editingFeatures}
                />

                <FeatureCategory
                    title="Kecerdasan Buatan & Otomasi"
                    description="Manfaatkan generator otomatis dan parser AI untuk memicu alur kerja super cepat."
                    items={aiFeatures}
                />

                <FeatureCategory
                    title="Penyimpanan & Portabilitas"
                    description="Jaga keamanan naskah ujian Anda dan bagikan ke berbagai media ekspor."
                    items={storageFeatures}
                />
            </div>
        </div>
    );
};

export default FeaturesTab;
