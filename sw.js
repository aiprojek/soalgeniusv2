// Nama cache — naikkan versi jika ada perubahan besar pada aset
const CACHE_NAME = 'soalgenius-cache-v10-offline-first';

// Daftar URL statis aplikasi yang pasti ada
const appShellFiles = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Perintah dari UI untuk skip waiting (update SW)
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Perintah dari UI untuk pre-cache daftar URL (unduh library untuk offline)
  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        let cached = 0;
        let failed = 0;
        for (const url of urls) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok || response.type === 'opaque') {
              await cache.put(url, response);
              cached++;
            }
          } catch (err) {
            failed++;
            console.warn(`SW: Gagal cache ${url}:`, err);
          }
        }
        console.log(`SW: CACHE_URLS selesai. Berhasil: ${cached}, Gagal: ${failed}`);

        // Beritahu client bahwa proses selesai
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: 'CACHE_URLS_DONE', cached, failed });
        }
      })
    );
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('SW: Install — pre-caching app shell...');
      // Pre-cache setiap file satu per satu agar kegagalan satu tidak membatalkan yang lain
      for (const url of appShellFiles) {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok || response.type === 'opaque') {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn(`SW: Gagal pre-cache ${url}:`, err);
        }
      }
      console.log('SW: Pre-caching selesai.');
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
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

  const url = new URL(event.request.url);

  // Lewati request ke API eksternal (Dropbox, Gemini, Pollinations, Google Fonts API)
  // Google Fonts CSS bisa dilewati — font file-nya tetap di-cache lewat CACHE_URLS
  if (url.hostname !== self.location.hostname) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Coba ambil dari cache terlebih dahulu (cache-first)
      const cachedResponse = await cache.match(event.request);

      // Mulai network request di background untuk update cache (stale-while-revalidate)
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // Hanya cache response yang valid (status 200 atau opaque cross-origin)
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Network gagal (offline) — kembalikan dari cache jika ada
          if (cachedResponse) {
            console.log('SW: Offline, melayani dari cache:', event.request.url);
            return cachedResponse;
          }
          // Jika ini adalah navigation request (halaman baru), sajikan index.html
          if (event.request.mode === 'navigate') {
            return cache.match('./index.html') || cache.match('/');
          }
          // Untuk aset lain yang tidak di-cache, return error response
          return new Response('Offline — Resource not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });

      // Jika ada di cache, sajikan sekarang dan update di background
      // Jika tidak ada di cache, tunggu network
      return cachedResponse || networkFetch;
    })
  );
});
