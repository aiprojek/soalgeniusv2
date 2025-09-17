const CACHE_NAME = 'soalgenius-cache-v2';
const urlsToCache = [
  '/',
  './index.html',
  './manifest.json',
  // TS/TSX Files (assuming a dev environment that serves them directly)
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching assets');
        return cache.addAll(urlsToCache);
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
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Return from cache
        }
        
        // Not in cache, fetch from network and cache it
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

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