// Nama cache — naikkan versi jika ada perubahan besar pada aset
const CACHE_NAME = 'soalgenius-cache-v10-offline-first';

// Daftar URL statis aplikasi dasar
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
        await Promise.allSettled(
          urls.map(async (url) => {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 8000);
              const response = await fetch(url, { 
                cache: 'reload',
                signal: controller.signal 
              });
              clearTimeout(timer);
              if (response.ok || response.type === 'opaque') {
                await cache.put(url, response);
                cached++;
              }
            } catch (err) {
              failed++;
              console.warn(`SW: Gagal cache ${url}:`, err);
            }
          })
        );
        console.log(`SW: CACHE_URLS selesai. Berhasil: ${cached}, Gagal: ${failed}`);

        // Beritahu client bahwa proses selesai
        try {
          const clients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({ type: 'CACHE_URLS_DONE', cached, failed });
          }
        } catch (e) {
          // Abaikan jika client tidak dapat dijangkau
        }
      })
    );
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('SW: Install — pre-caching app shell...');
      await Promise.allSettled(
        appShellFiles.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok || response.type === 'opaque') {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`SW: Gagal pre-cache ${url}:`, err);
          }
        })
      );
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

  // Lewati request ke API eksternal dinamis
  if (
    url.hostname.includes('dropbox') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('pollinations.ai') ||
    url.hostname.includes('saweria.co') ||
    url.hostname.includes('lynk.id')
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Coba ambil dari cache terlebih dahulu (cache-first)
      const cachedResponse = await cache.match(event.request);

      // Mulai network request di background untuk update cache (stale-while-revalidate)
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            cache.put(event.request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // Network gagal (offline) — kembalikan dari cache jika ada
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika ini adalah navigation request (halaman baru), sajikan index.html
          if (event.request.mode === 'navigate') {
            return cache.match('./index.html') || cache.match('/') || cache.match('./');
          }
          // Untuk aset lain yang tidak di-cache
          return new Response('Offline — Resource not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });

      return cachedResponse || networkFetch;
    })
  );
});

