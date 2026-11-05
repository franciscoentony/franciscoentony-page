import { defineConfig, devices } from "@playwright/test";
import {
  BASE_URL,
  IS_LOCAL,
  OUT_DIR,
  VIEWPORTS,
  SERVER_COMMAND,
  LOCAL_URL,
} from "./qa.config.mjs";

// Usa o Chrome instalado na máquina (channel "chrome"). Para usar o Chromium do
// Playwright: QA_BROWSER=chromium (e rode `bunx playwright install chromium`).
const channel = process.env.QA_BROWSER === "chromium" ? undefined : "chrome";

export default defineConfig({
  testDir: "./tests",
  outputDir: `${OUT_DIR}/test-results`,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: `${OUT_DIR}/html`, open: "never" }],
    ["json", { outputFile: `${OUT_DIR}/results.json` }],
  ],
  use: {
    baseURL: BASE_URL,
    channel,
    locale: "pt-BR",
    colorScheme: "dark",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    ...VIEWPORTS.map((vp) => ({
      name: `w${vp.name}`,
      // perf.spec roda só nos projetos perf-* (lentos, com throttling)
      testIgnore: /perf\.spec\.ts/,
      use: {
        ...(vp.mobile ? devices["Pixel 7"] : devices["Desktop Chrome"]),
        viewport: { width: vp.width, height: vp.height },
        // Pixel 7 traz defaultBrowserType chromium; mantemos o channel escolhido.
        channel,
        isMobile: vp.mobile && vp.width < 768,
        hasTouch: vp.mobile,
        deviceScaleFactor: vp.mobile ? 2 : 1,
      },
    })),
    // Orçamento de desempenho (PERF-PLAN §2). Só entram com QA_PERF=1 (`bun run test:perf`).
    ...(process.env.QA_PERF
      ? [
          {
            name: "perf-mobile",
            testMatch: /perf\.spec\.ts/,
            // CPU 6× via CDP (Emulation.setCPUThrottlingRate), aplicado no próprio teste
            metadata: { cpuThrottle: Number(process.env.QA_PERF_CPU ?? 6) },
            use: {
              ...devices["Pixel 7"],
              channel,
              viewport: { width: 412, height: 915 },
              deviceScaleFactor: 2.75,
              isMobile: true,
              hasTouch: true,
            },
          },
          {
            name: "perf-desktop",
            testMatch: /perf\.spec\.ts/,
            metadata: { cpuThrottle: 1 },
            use: {
              ...devices["Desktop Chrome"],
              channel,
              viewport: { width: 1440, height: 900 },
              deviceScaleFactor: 1,
            },
          },
        ]
      : []),
  ],
  webServer: IS_LOCAL
    ? {
        command: SERVER_COMMAND,
        cwd: "..",
        url: LOCAL_URL,
        reuseExistingServer: true,
        timeout: 240_000,
      }
    : undefined,
});
