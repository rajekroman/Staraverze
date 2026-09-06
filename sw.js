const CACHE = "lovec-vltavinu-slavia-v6-2-release-2";

// Keep installation small and deterministic. Level assets are cached lazily after a
// successful request, so a single missing scene asset cannot block the app shell.
const PRECACHE = [
  "./", "./index.html", "./style.css", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./vendor/three.module.min.js", "./vendor/three.core.min.js", "./src/bootstrap.js", "./src/audio/AudioEngine.js", "./src/audio/AudioRegistry.js",
  "./src/core/EventBus.js", "./src/core/GameEvents.js", "./src/core/GameApp.js", "./src/core/GameLoop.js", "./src/core/SceneManager.js", "./src/core/InputManager.js", "./src/core/AssetLoader.js",
  "./src/ecs/World.js", "./src/systems/CollisionSystem.js", "./src/systems/AnimationSystem.js",
  "./src/data/levels.js", "./src/data/chlum.js", "./src/data/nesmen.js", "./src/data/besednice.js", "./src/data/slavia.js", "./src/data/dialogues.js",
  "./src/gameplay/GameSession.js", "./src/gameplay/Objectives.js", "./src/gameplay/InteractionSystem.js", "./src/gameplay/DigSystem.js", "./src/gameplay/DangerSystem.js", "./src/gameplay/ObjectiveSystem.js", "./src/gameplay/BossSystem.js", "./src/gameplay/SlaviaEvaluation.js", "./src/gameplay/SlaviaObjectiveFlow.js",
  "./src/render/HybridRenderer.js", "./src/render/ThreeRenderer.js", "./src/render/CameraBounds.js", "./src/render/GltfAssetLoader.js", "./src/render/AssetDisposal.js", "./src/render/ModelFactory.js",
  "./vendor/three/addons/loaders/GLTFLoader.js", "./vendor/three/addons/utils/BufferGeometryUtils.js", "./vendor/three/addons/utils/SkeletonUtils.js",
  "./src/input/DomInputAdapter.js", "./src/ui/ScreenController.js", "./src/ui/HudController.js", "./src/scenes/TitleScene.js", "./src/scenes/ChlumScene.js", "./src/scenes/ChlumNesmenBridgeScene.js", "./src/scenes/NesmenScene.js", "./src/scenes/NesmenRestorationScene.js", "./src/scenes/NesmenBesedniceBridgeScene.js", "./src/scenes/BesedniceScene.js", "./src/scenes/SlaviaScene.js",
  "./assets/manifests/assets.json"
];

// This explicit allowlist is intentionally not pre-cached. It mirrors the production
// asset manifest for validation and bounds lazy runtime caching to known game assets.
const RUNTIME_ASSETS = [
  "./assets/sprites/player/hunter-walk-sheet.png", "./assets/sprites/npcs/farmer-vaclav-v2.png", "./assets/sprites/npcs/rival-karel-v2.png", "./assets/sprites/npcs/forester-jan-v2.png", "./assets/sprites/npcs/expert-eva-v2.png", "./assets/sprites/npcs/thief-franta-v2.png",
  "./assets/sprites/findings/vltavin-common.png", "./assets/sprites/findings/vltavin-rare.png", "./assets/sprites/findings/vltavin-standard.png", "./assets/sprites/findings/vltavin-nesmen.png", "./assets/sprites/findings/vltavin-besednice-hedgehog.png",
  "./assets/textures/terrain/chlum-field.png", "./assets/textures/terrain/chlum-furrows.png", "./assets/textures/terrain/nesmen-forest-floor.png", "./assets/textures/terrain/nesmen-sand-profile.png", "./assets/textures/terrain/nesmen-excavated-sand-v1.png", "./assets/textures/terrain/besednice-quarry.png", "./assets/textures/terrain/besednice-clay-quarry-v1.png", "./assets/textures/terrain/slavia-malse-exterior-v1.png",
  "./assets/models/chlum/tractor-no-driver.glb", "./assets/models/chlum/hay-bale.glb", "./assets/models/chlum/field-marker.glb", "./assets/models/chlum/field-fence-segment.glb",
  "./assets/models/nesmen/profile-marker.glb", "./assets/models/nesmen/tree-stump.glb", "./assets/models/besednice/trace-marker.glb", "./assets/models/besednice/hedgehog-marker.glb", "./assets/models/besednice/quarry-rock.glb", "./assets/models/slavia/kd-slavia.glb", "./assets/models/slavia/document-folder.glb",
  "./assets/audio/journey-loop.mp3", "./assets/audio/dig-hit.mp3", "./assets/audio/finding-chime.mp3", "./assets/audio/danger-pulse.mp3", "./assets/audio/LICENSE.md"
];

const CACHEABLE_PATHS = new Set(
  [...PRECACHE, ...RUNTIME_ASSETS].map(path => new URL(path, self.registration.scope).pathname)
);

const requestUrl = request => new URL(request.url);
const isSameOrigin = request => requestUrl(request).origin === self.location.origin;
const isKnownRuntimeRequest = request => request.mode === "navigate" || CACHEABLE_PATHS.has(requestUrl(request).pathname);
const isSuccessfulSameOriginResponse = (request, response) => {
  const finalUrl = response.url ? new URL(response.url, request.url) : requestUrl(request);
  return response.ok && isSameOrigin(request) && finalUrl.origin === self.location.origin;
};

const fetchAndCache = async request => {
  const response = await fetch(request);
  if (isKnownRuntimeRequest(request) && isSuccessfulSameOriginResponse(request, response)) {
    try {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    } catch (error) {
      console.warn("Service worker cache write failed:", error);
    }
  }
  return response;
};

const cachedFallback = async request => {
  const cache = await caches.open(CACHE);
  return cache.match(request.mode === "navigate" ? "./index.html" : request);
};

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !isSameOrigin(event.request)) return;

  event.respondWith((async () => {
    try {
      return await fetchAndCache(event.request);
    } catch (error) {
      const cached = await cachedFallback(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});
