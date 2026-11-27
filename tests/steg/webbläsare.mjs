// Steg som kör appen i Chromium (scenarier taggade @ui).
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

export const KEY = 'minpt-data-v1';
export const exact = (s) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
export const readData = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);

Given('att layoutfilen för startsidan visar {string}', function (s) {
  this.layoutStart = { visa: s.split(',').map((x) => x.trim()), dolda: [] };
});

Given('att jag öppnar appen med tom data', async function () { await openApp(this); });

async function openApp(world) {
  const page = await world.context.newPage();
  world.page = page;
  page.on('console', (m) => {
    if (m.type() === 'error') world.consoleErrors.push(m.text());
    if (m.type() === 'warning') world.consoleWarnings.push(m.text());
  });
  page.on('pageerror', (e) => world.consoleErrors.push(String(e)));
  if (world.layoutStart) {
    await page.route('**/layout/start.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(world.layoutStart) }));
  }
  await page.goto(world.baseUrl);
  try {
    await page.waitForFunction(() => document.querySelector('#view')?.children.length > 0, null, { timeout: 5000 });
  } catch {
    assert.fail(`Appen ritade ingenting. Fel i konsolen:\n${world.consoleErrors.join('\n') || '(inga)'}`);
  }
}

When('jag trycker på fliken {string}', async function (name) {
  await this.page.locator('.tabbar button').filter({ hasText: exact(name) }).click();
});

When(/^(?:jag )?trycker på "([^"]+)"$/, async function (name) {
  // Knappen hittas på sin text, eller på sin etikett om den bara visar ett tecken (+ och −).
  await this.page.locator('button:visible').filter({ hasText: exact(name) })
    .or(this.page.getByRole('button', { name, exact: true })).first().click();
});

When('jag väljer {string} på startsidan', async function (name) {
  await this.page.locator('.choices button').filter({ hasText: name }).click();
});

When('skriver {string} i fältet {string}', async function (value, label) {
  await this.page.getByLabel(label).fill(value);
});

Then('ska jag se rubriken {string}', async function (text) {
  await this.page.locator('#view h1').filter({ hasText: exact(text) }).waitFor();
});

Then('ska jag se texten {string}', async function (text) {
  // Svenska tal skrivs med hårt mellanslag (9 500), så alla blanksteg jämförs som vanliga mellanslag.
  await this.page.waitForFunction((t) => document.body.innerText.replace(/\s+/g, ' ').includes(t), text, { timeout: 5000 });
});

Then('ska jag se knappen {string}', async function (text) {
  await this.page.locator('button:visible').filter({ hasText: text }).first().waitFor();
});

Then('konsolen ska inte ha några fel', function () {
  assert.deepEqual(this.consoleErrors, []);
});

Then('konsolen ska ha en varning om {string}', function (text) {
  assert.ok(this.consoleWarnings.some((w) => w.includes(text)), this.consoleWarnings.join('\n'));
});

Then('ska stegkortet komma före rubriken', async function () {
  const before = await this.page.evaluate(() => {
    const steps = document.querySelector('#view .steps-card');
    const head = document.querySelector('#view .page-head');
    return !!(steps && head && steps.compareDocumentPosition(head) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.ok(before);
});

Then('knapparna för Gym och Hemma ska inte synas', async function () {
  assert.equal(await this.page.locator('#view .choices').count(), 0);
});

Then('datan ska ha {int} steg idag', async function (n) {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal((await readData(this.page)).steps?.[key], n);
});

Then('ska sidan vara i mörkt läge', async function () {
  assert.equal(await this.page.evaluate(() => document.documentElement.dataset.mode), 'dark');
});

Then('mörkt läge ska vara sparat', async function () {
  assert.equal((await readData(this.page)).settings?.themeMode, 'dark');
});
