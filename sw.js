// Nama cache baru untuk memicu pembaruan
const CACHE_NAME = 'soalgenius-cache-v3';
const urlsToCache = [
  '/',
  './index.html',
  './manifest.json',
  // TS/TSX Files (pastikan semua file terdaftar)
  './index.tsx',
  './types.ts',
  './App.tsx',
  './components/Icons.tsx',
  './components/MainLayout.tsx',
  './contexts/ModalContext.tsx',
  './contexts/ToastContext.tsx',
  './contexts/ThemeContext.tsx',
  './hooks/useHistoryState.ts',
  './lib/htmlGenerator.ts',
  './lib/storage.ts',
  './lib/utils.ts',
  './views/ArchiveView.tsx',
  './views/EditorView.tsx',
  './views/PreviewView.tsx',
  './views/QuestionBankView.tsx',
  './views/SettingsView.tsx',
  './views/HelpView.tsx', // File yang ditambahkan
  // External CDN Assets
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2?8d200488724b4831353fea889319d65c',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Areef+Ruqaa:wght@400;700&family=Liberation+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Liberation+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap',
  'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css',
  // Import-map Assets
  'https://aistudiocdn.com/react@^18.2.0',
  'https://aistudiocdn.com/react-dom@^18.2.0/client',
  'https://aistudiocdn.com/react@^18.2.0/jsx-runtime',
  'https://esm.sh/react-quill@2.0.0',
  'https://esm.sh/quill@2.0.2',
  // PWA Icons
  './icon.svg',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- Logika instalasi yang diperbarui dan lebih tangguh ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Membuka cache dan memulai caching aset...');
      const cachePromises = urlsToCache.map((urlToCache) => {
        // Menggunakan cache.add untuk setiap URL secara individual
        // dan menangkap error agar tidak menghentikan seluruh proses
        return cache.add(urlToCache).catch((err) => {
          console.warn(`Gagal menyimpan ke cache: ${urlToCache}`, err);
        });
      });
      // Menunggu semua proses penambahan cache selesai
      return Promise.all(cachePromises).then(() => {
        console.log('Semua aset yang tersedia berhasil disimpan ke cache.');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // 1. Coba cari di cache terlebih dahulu (Cache-First Strategy)
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Jika ada di cache, langsung kembalikan
        }
        
        // 2. Jika tidak ada di cache, ambil dari jaringan
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
          // Jika gagal mengambil dari jaringan, kembalikan response error
          if (!response || response.status !== 200) {
            return response;
          }

          // 3. Jika berhasil, simpan salinannya ke cache untuk penggunaan offline berikutnya
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
