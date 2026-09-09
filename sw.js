const CACHE = "lovec-vltavinu-reborn-v5-4-2-runtime-29";
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
  "./assets/audio/effects/ui-click.mp3","./assets/audio/effects/ui-result.mp3",
  "./assets/ui/nzv-logo-purple.png"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => k.startsWith("lovec-vltavinu-reborn-") && k !== CACHE)
    .map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const core = CORE.some(path => new URL(path, self.location.href).href === url.href);
  const navigation = e.request.mode === "navigate";
  if (!navigation && !core) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fallback = await cache.match(navigation ? "./index.html" : e.request);
    if (!navigation && fallback) return fallback;
    try {
      const response = await fetch(e.request);
      if (response.status === 200 && core) {
        await cache.put(e.request, response.clone());
      }
      return response.ok ? response : (fallback || response);
    } catch {
      return fallback || Response.error();
    }
  })());
});
