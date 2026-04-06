// Nama cache baru untuk memicu pembaruan
const CACHE_NAME = 'soalgenius-cache-v8-local-bundle';

// Daftar URL statis aplikasi
const appShellFiles = [
  '/',
  './index.html',
  './manifest.json',
  './icon.svg',
];

const urlsToCache = [...appShellFiles];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Membuka cache dan memulai caching aset...');
      
      const cachePromises = urlsToCache.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
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
  if (new URL(event.request.url).origin !== self.location.origin) return;

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
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate') {
              return cache.match('./index.html');
            }
            return Response.error();
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
