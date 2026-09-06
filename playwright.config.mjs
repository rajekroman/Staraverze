import { defineConfig, devices } from "@playwright/test";

const iphone13 = devices["iPhone 13"];

const PLAYWRIGHT_SPEC_ASSIGNMENTS = Object.freeze({
  "desktop-chromium": Object.freeze([
    "slavia-smoke.spec.mjs",
    "asset-runtime-smoke.spec.mjs"
  ]),
  "audio-lifecycle-chromium": Object.freeze([
    "audio-lifecycle.spec.mjs"
  ]),
  "iphone-portrait": Object.freeze([
    "slavia-smoke.spec.mjs",
    "mobile-smoke.spec.mjs",
    "mobile-animation-smoke.spec.mjs",
    "mobile-ui-smoke.spec.mjs"
  ]),
  "iphone-landscape": Object.freeze([
    "slavia-smoke.spec.mjs"
  ])
});

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const projectSpecs = projectName => PLAYWRIGHT_SPEC_ASSIGNMENTS[projectName]
  .map(fileName => new RegExp(`${escapeRegExp(fileName)}$`));

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  // Each full-flow project runs on its own CI runner. Keep every individual
  // WebGL project deterministic and avoid resource contention inside a runner.
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "block",
    actionTimeout: 6_000,
    navigationTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      testMatch: projectSpecs("desktop-chromium"),
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: "audio-lifecycle-chromium",
      testMatch: projectSpecs("audio-lifecycle-chromium"),
      metadata: { inputMode: "desktop", orientation: "landscape" },
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: "iphone-portrait",
      testMatch: projectSpecs("iphone-portrait"),
      metadata: { inputMode: "touch", orientation: "portrait" },
      use: {
        ...iphone13,
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 }
      }
    },
    {
      name: "iphone-landscape",
      testMatch: projectSpecs("iphone-landscape"),
      metadata: { inputMode: "touch", orientation: "landscape" },
      use: {
        ...iphone13,
        browserName: "chromium",
        viewport: { width: 844, height: 390 },
        screen: { width: 844, height: 390 }
      }
    }
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
