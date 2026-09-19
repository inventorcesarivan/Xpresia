// Xpresia PWA v43 - pass-through worker
self.addEventListener('install', e => {
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});
// Pass-through: no interceptamos recursos. Esto mantiene intactos
// cámara, micrófono, karaoke, música y recursos externos de Xpresia.
self.addEventListener('fetch', () => {});
