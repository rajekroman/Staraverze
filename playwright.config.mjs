import { defineConfig, devices } from "@playwright/test";

const OFFLINE_TEST = /offline-smoke\.spec\.mjs/;
const VISUAL_TEST = /visual-regression\.spec\.mjs/;
const MOTION_TEST = /motion-evidence\.spec\.mjs/;
const EXCAVATOR_MOTION_TEST = /excavator-motion-evidence\.spec\.mjs/;
const NON_STANDARD_TESTS = [OFFLINE_TEST, VISUAL_TEST, MOTION_TEST, EXCAVATOR_MOTION_TEST];
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
const webRoot = process.env.PLAYWRIGHT_ROOT || ".";
const webRootArg = JSON.stringify(webRoot);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } }
    },
    {
      name: "iphone-portrait",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }
    },
    {
      name: "iphone-landscape",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } }
    },
    {
      name: "desktop-webkit",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 720 } }
    },
    {
      name: "iphone-portrait-webkit",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["iPhone 13"], browserName: "webkit", viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }
    },
    {
      name: "iphone-landscape-webkit",
      testIgnore: NON_STANDARD_TESTS,
      use: { ...devices["iPhone 13"], browserName: "webkit", viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } }
    },
    {
      name: "visual-desktop",
      testMatch: VISUAL_TEST,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } }
    },
    {
      name: "visual-iphone-portrait",
      testMatch: VISUAL_TEST,
      use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }
    },
    {
      name: "visual-iphone-landscape",
      testMatch: VISUAL_TEST,
      use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } }
    },
    {
      name: "motion-desktop",
      testMatch: MOTION_TEST,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 }, video: "on", trace: "off", screenshot: "off" }
    },
    {
      name: "motion-excavator",
      testMatch: EXCAVATOR_MOTION_TEST,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 }, video: "on", trace: "off", screenshot: "off" }
    },
    {
      name: "offline-chromium",
      testMatch: OFFLINE_TEST,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        serviceWorkers: "allow"
      }
    }
  ],
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory ${webRootArg}`,
    url: `${baseURL}/index.html`,
    reuseExistingServer: false,
    timeout: 15_000
  }
});
