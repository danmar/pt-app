// Gemensamt tillstånd för varje scenario, och start/stopp av webbläsaren för @ui-scenarier.
import { setWorldConstructor, Before, After, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { existsSync } from 'node:fs';
import { startServer } from './server.mjs';

setDefaultTimeout(20_000);

class Värld {
  constructor() {
    this.pain = {};
    this.gear = [];
    this.groups = [];
    this.done = [];
    this.exclude = [];
    this.place = 'gym';
    this.opts = {};
    this.today = { date: new Date().toISOString(), entries: [] };
    this.before = [];
    this.consoleErrors = [];
  }
}
setWorldConstructor(Värld);

// ---- Webbläsare för @ui --------------------------------------------------
let browser = null;
let server = null;

// playwright-core laddar inte ner någon webbläsare, så systemets Chromium används.
// Sätt CHROMIUM_PATH om den ligger någon annanstans.
const CANDIDATES = ['/snap/bin/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];

async function chromium() {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.CHROMIUM_PATH ?? CANDIDATES.find((p) => existsSync(p));
  return chromium.launch({ executablePath, args: ['--no-sandbox'] });
}

Before({ tags: '@ui' }, async function () {
  server ??= await startServer();
  browser ??= await chromium();
  this.baseUrl = server.url;
  this.context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'sv-SE',
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
});

After({ tags: '@ui' }, async function () {
  await this.context?.close();
});

AfterAll(async function () {
  await browser?.close();
  await server?.close();
});
