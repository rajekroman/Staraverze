const CACHE = "lovec-vltavinu-reborn-v5-4-2-audio-1";
const CORE = [
  "./","./index.html","./style.css","./game.js","./manifest.webmanifest",
  "./icon-180.png","./icon-192.png","./icon-512.png",
  "./assets/audio/ambient/ambient-besednice.mp3","./assets/audio/ambient/ambient-chlum.mp3",
  "./assets/audio/ambient/ambient-nesmen.mp3","./assets/audio/ambient/ambient-slavia.mp3",
  "./assets/audio/effects/danger-besednice.mp3","./assets/audio/effects/danger-caught.mp3",
  "./assets/audio/effects/danger-chlum.mp3","./assets/audio/effects/danger-nesmen.mp3",
  "./assets/audio/effects/danger-pulse.mp3","./assets/audio/effects/danger-slavia.mp3",
  "./assets/audio/effects/dig-hit.mp3","./assets/audio/effects/dig-impact-hard.mp3",
  "./assets/audio/effects/dig-impact-stone.mp3","./assets/audio/effects/dig-impact-wet.mp3",
  "./assets/audio/effects/dig-miss.mp3","./assets/audio/effects/dig-perfect.mp3",
  "./assets/audio/effects/finding-a.mp3","./assets/audio/effects/finding-b.mp3",
  "./assets/audio/effects/finding-c.mp3","./assets/audio/effects/finding-chime.mp3",
  "./assets/audio/effects/journey-loop.mp3","./assets/audio/effects/ui-click.mp3",
  "./assets/audio/effects/ui-close.mp3","./assets/audio/effects/ui-open.mp3",
  "./assets/audio/effects/ui-result.mp3",
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
