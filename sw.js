const CACHE = "lovec-vltavinu-reborn-v5-4-1";
const CORE = [
  "./","./index.html","./style.css","./game.js","./manifest.webmanifest",
  "./icon-180.png","./icon-192.png","./icon-512.png",
  "./assets/audio/music/field.wav","./assets/audio/music/meadow.wav",
  "./assets/audio/music/forest.wav","./assets/audio/music/night.wav",
  "./assets/audio/music/city.wav",
  "./assets/ui/na-zelene-vlne.jpg"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); return r; }).catch(() => caches.match(e.request)));
});
