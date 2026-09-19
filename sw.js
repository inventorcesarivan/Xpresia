// Xpresia PWA - pass-through worker, igual enfoque estable de Ajetrez.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
