export const DIST_DIR = "dist";

export const PUBLISH_FILES = Object.freeze([
  ".nojekyll",
  "index.html",
  "game.js",
  "style.css",
  "manifest.webmanifest",
  "sw.js",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "assets/audio/ambient/ambient-besednice.mp3",
  "assets/audio/ambient/ambient-chlum.mp3",
  "assets/audio/ambient/ambient-nesmen.mp3",
  "assets/audio/ambient/ambient-slavia.mp3",
  "assets/audio/effects/danger-besednice.mp3",
  "assets/audio/effects/danger-caught.mp3",
  "assets/audio/effects/danger-chlum.mp3",
  "assets/audio/effects/danger-nesmen.mp3",
  "assets/audio/effects/danger-pulse.mp3",
  "assets/audio/effects/danger-slavia.mp3",
  "assets/audio/effects/dig-hit.mp3",
  "assets/audio/effects/dig-impact-hard.mp3",
  "assets/audio/effects/dig-impact-stone.mp3",
  "assets/audio/effects/dig-impact-wet.mp3",
  "assets/audio/effects/dig-miss.mp3",
  "assets/audio/effects/dig-perfect.mp3",
  "assets/audio/effects/finding-a.mp3",
  "assets/audio/effects/finding-b.mp3",
  "assets/audio/effects/finding-c.mp3",
  "assets/audio/effects/finding-chime.mp3",
  "assets/audio/effects/ui-click.mp3",
  "assets/audio/effects/ui-result.mp3",
  "assets/ui/nzv-logo-purple.png"
]);

export const REQUIRED_RUNTIME_FILES = Object.freeze([
  "index.html",
  "game.js",
  "style.css",
  "manifest.webmanifest",
  "sw.js",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
]);

export const FORBIDDEN_PUBLISH_NAMES = Object.freeze([
  ".git",
  ".github",
  "tests",
  "tools",
  "node_modules",
  "playwright-report",
  "test-results",
  "AGENTS.md",
  "PRODUCTION_AUDIT.md",
  "BUILD_REPORT.txt",
  "AUDIO_RELEASE_CHECKLIST.md",
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "package-lock.json",
  "playwright.config.mjs"
]);
