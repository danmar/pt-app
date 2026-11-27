// Steg som kör appen i Chromium (scenarier taggade @ui).
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

export const KEY = 'minpt-data-v1';
export const exact = (s) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
export const readData = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);

Given('att jag öppnar appen med tom data', async function () { await openApp(this); });

async function openApp(world) {
  const page = await world.context.newPage();
  world.page = page;
  page.on('console', (m) => {
    if (m.type() === 'error') world.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => world.consoleErrors.push(String(e)));
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

Then('ska flikraden ha flikarna {string}', async function (names) {
  const tabs = await this.page.locator('.tabbar button').allInnerTexts();
  assert.deepEqual(tabs.map((t) => t.trim()), names.split(',').map((x) => x.trim()));
});

Then('ska jag inte se texten {string}', async function (text) {
  assert.ok(!(await this.page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).includes(text), text);
});

Then('ska jag se knappen {string}', async function (text) {
  await this.page.locator('button:visible').filter({ hasText: text }).first().waitFor();
});

Then('konsolen ska inte ha några fel', function () {
  assert.deepEqual(this.consoleErrors, []);
});

Then('ska rubriken komma före valen och valen före stegkortet', async function () {
  const order = await this.page.evaluate(() => {
    const all = [...document.querySelectorAll('#view *')];
    return ['.page-head', '.choices', '.steps-card'].map((sel) => all.indexOf(document.querySelector(`#view ${sel}`)));
  });
  assert.ok(order[0] >= 0 && order[0] < order[1] && order[1] < order[2], String(order));
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
