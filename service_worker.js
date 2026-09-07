const CACHE_NAME = 'klixpdf-cache-v4'; // Versi dinaikkan agar browser memaksa update

// Daftar file yang WAJIB disimpan untuk offline (Termasuk halaman & library baru)
const URLS_TO_CACHE = [
    './',
    './index.html',
    './pdf-to-img.html', // Halaman baru didaftarkan
    
    // Library untuk Foto ke PDF
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    
    // Library untuk PDF ke Foto
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Saat aplikasi dibuka pertama kali
self.addEventListener('install', event => {
    self.skipWaiting(); // Langsung aktifkan penjaga (Service Worker)
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Menyimpan file ke cache agar bisa offline...');
            // Simpan satu-satu dengan Promise.allSettled
            // Agar kalau 1 CDN sedang error, yang lain tetap berhasil tersimpan
            return Promise.allSettled(URLS_TO_CACHE.map(url => {
                return fetch(url).then(response => {
                    if (response.ok) return cache.put(url, response);
                }).catch(err => console.log('Gagal simpan ke cache:', url));
            }));
        })
    );
});

// Bersihkan file lama jika ada update versi Cache (dari v3 ke v4)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
});

// Ketika browser minta file (HTML, CSS, JS, Ikon)
self.addEventListener('fetch', event => {
    // Hanya tangkap permintaan ambil data (GET)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 1. Jika file ADA di memori HP/Laptop, langsung berikan! (Offline jalan)
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Jika file tidak ada di memori, coba ambil dari internet
            return fetch(event.request).then(response => {
                // Simpan file baru ini ke memori agar besok bisa dipakai offline juga
                if (response && response.status === 200 && event.request.url.startsWith('http')) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                }
                return response;
            }).catch(() => {
                console.log('Kamu sedang offline dan file ini tidak ada di memori:', event.request.url);
            });
        })
    );
});