import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Preinstalled Chromium in some sandboxed CI environments; fall back to
// Playwright's own managed browser (via `npx playwright install`) elsewhere.
const sandboxChromium = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npx http-server -p 4173 -c-1 .',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {},
  },
});
