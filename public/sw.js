// Nama cache — naikkan versi jika ada pembaruan besar pada aset aplikasi
const CACHE_NAME = 'soalgenius-cache-v11-offline-first';

// Daftar URL statis aplikasi dasar (App Shell)
const appShellFiles = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Perintah dari UI untuk skip waiting (update SW langsung aktif)
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Perintah dari UI untuk pre-cache daftar URL (Unduh library untuk offline)
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
              const timer = setTimeout(() => controller.abort(), 10000);
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
            console.log('SW: Menghapus cache versi lama:', cacheName);
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

  // Lewati request ke API eksternal dinamis (Dropbox, AI, Saweria)
  if (
    url.hostname.includes('dropbox') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('pollinations.ai') ||
    url.hostname.includes('saweria.co') ||
    url.hostname.includes('lynk.id')
  ) {
    return;
  }

  // Khusus Navigation Request (Membuka / Merefresh Halaman SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Saat online, coba fetch halaman segar dan update cache
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone()).catch(() => {});
            cache.put('./index.html', networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (err) {
          // Saat offline, sajikan index.html dari cache
          const cache = await caches.open(CACHE_NAME);
          const cachedMatch =
            (await cache.match(event.request, { ignoreSearch: true })) ||
            (await cache.match('./index.html')) ||
            (await cache.match('/index.html')) ||
            (await cache.match('./')) ||
            (await cache.match('/'));

          if (cachedMatch) {
            return cachedMatch;
          }

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline - SoalGenius</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Sedang Offline</h2><p>Aplikasi belum memiliki cache offline. Buka aplikasi satu kali saat terhubung ke internet untuk menyimpan modul offline.</p></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }
      })()
    );
    return;
  }

  // Untuk resource statis (JS chunks, CSS, Fonts, Icons, SVG):
  // Strategi Cache-First with background revalidation
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request, { ignoreSearch: true });

      // Jika file sudah tersimpan di cache, langsung kembalikan (kecepatan maksimal & 100% offline)
      if (cachedResponse) {
        // Lakukan background update jika online
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Jika belum ada di cache, ambil dari network dan otomatis simpan ke cache
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          cache.put(event.request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      } catch (err) {
        // Gagal network & tidak ada di cache
        return new Response('Offline — Resource not cached', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});
