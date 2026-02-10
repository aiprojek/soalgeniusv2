// Nama cache baru untuk memicu pembaruan
const CACHE_NAME = 'soalgenius-cache-v7-services-added';

// Daftar URL statis aplikasi
const appShellFiles = [
  '/',
  './index.html',
  './manifest.json',
  './icon.svg',
  './index.tsx',
  './types.ts',
  './App.tsx',
  './components/Icons.tsx',
  './components/MainLayout.tsx',
  './components/AiGeneratorModal.tsx',
  './components/PacketGeneratorModal.tsx',
  './components/SmartImportModal.tsx',
  './contexts/ModalContext.tsx',
  './contexts/ToastContext.tsx',
  './contexts/ThemeContext.tsx',
  './hooks/useHistoryState.ts',
  './hooks/useDebounce.ts',
  './lib/db.ts',
  './lib/migration.ts',
  './lib/htmlGenerator.ts',
  './lib/docxGenerator.ts',
  './lib/lmsGenerator.ts',
  './lib/storage.ts',
  './lib/utils.ts',
  './lib/gemini.ts',
  './lib/dropbox.ts',
  './lib/smartImport.ts',
  './views/ArchiveView.tsx',
  './views/EditorView.tsx',
  './views/PreviewView.tsx',
  './views/QuestionBankView.tsx',
  './views/SettingsView.tsx',
  './views/HelpView.tsx',
  './views/help/AboutTab.tsx',
  './views/help/FeaturesTab.tsx',
  './views/help/GuideTab.tsx',
  './views/help/ServicesTab.tsx',
];

// Daftar CDN Eksternal yang harus di-cache agar aplikasi jalan offline
// NOTE: Untuk produksi skala besar, disarankan menggunakan Bundler (Vite/Webpack)
// agar tidak bergantung pada URL eksternal ini.
const externalCdnFiles = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2?8d200488724b4831353fea889319d65c',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Areef+Ruqaa:wght@400;700&family=Liberation+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Liberation+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap',
  'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css',
  // React Imports (Redirects will be handled by SW caching the result)
  'https://aistudiocdn.com/react@^18.2.0',
  'https://aistudiocdn.com/react-dom@^18.2.0/client',
  'https://aistudiocdn.com/react@^18.2.0/jsx-runtime',
  // Libraries
  'https://cdn.jsdelivr.net/npm/react-quill@2.0.0/+esm',
  'https://cdn.jsdelivr.net/npm/quill@2.0.2/+esm',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.7/+esm',
  'https://esm.sh/@google/genai@^1.35.0',
  'https://jspm.dev/docx'
];

const urlsToCache = [...appShellFiles, ...externalCdnFiles];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Membuka cache dan memulai caching aset...');
      
      // Kita menggunakan Promise.allSettled (atau map dengan catch) agar jika satu CDN gagal,
      // instalasi SW tidak gagal total.
      const cachePromises = urlsToCache.map(async (url) => {
        try {
          const response = await fetch(url, { mode: 'no-cors' }); // no-cors penting untuk CDN opaque
          if (!response.ok && response.type !== 'opaque') {
            throw new Error(`Status ${response.status}`);
          }
          return await cache.put(url, response);
        } catch (err) {
          console.warn(`SW: Gagal cache ${url}:`, err);
        }
      });

      return Promise.all(cachePromises);
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
            console.log('SW: Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani GET request
  if (event.request.method !== 'GET') return;

  // Strategi: Stale-While-Revalidate
  // 1. Ambil dari Cache dulu (cepat)
  // 2. Jika tidak ada, ambil dari Network
  // 3. Update Cache dengan data terbaru dari Network (untuk kunjungan berikutnya)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Validasi response sebelum disimpan
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika offline dan fetch gagal, tidak apa-apa jika sudah ada cachedResponse
            // Jika tidak ada cachedResponse, kita bisa return fallback page (opsional)
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});