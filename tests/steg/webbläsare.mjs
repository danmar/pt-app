// Steg som kör appen i Chromium (scenarier taggade @ui).
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const KEY = 'minpt-data-v1';
const exact = (s) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
const readData = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);

Given('att layoutfilen för startsidan visar {string}', function (s) {
  this.layoutStart = { visa: s.split(',').map((x) => x.trim()), dolda: [] };
});

Given('att jag öppnar appen med tom data', async function () { await openApp(this); });

// Ett pågående gympass med en övning, med samma set som appen själv skapar (enbensövningar får H och V växelvis).
Given('att jag kör övningen {string} med {int} set om {int} reps på {int} kg', async function (exId, n, reps, kg) {
  const uni = exId.startsWith('single-leg-');
  const sets = [...Array(uni ? n * 2 : n)].map((_, i) => ({ reps, weight: kg, done: false, ...(uni ? { side: i % 2 ? 'V' : 'H' } : {}) }));
  const active = { place: 'gym', start: Date.now(), index: 0, restEnd: null, restBeeped: false, avail: [], gear: [], groups: [],
    stype: 'strength', busy: {}, picking: false, items: [{ exId, warmup: false, sets }] };
  await openApp(this, { active });
});

Given('att jag har startat ett gympass med kroppsvikt för bröstet', async function () {
  const active = { place: 'gym', start: Date.now(), index: 0, restEnd: null, restBeeped: false, avail: ['body'], gear: ['body'], groups: ['chest'],
    stype: 'strength', busy: {}, picking: true, skipWarm: true, items: [] };
  await openApp(this, { active });
});

async function openApp(world, seed) {
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
  if (seed) {
    // Bara första laddningen får datan, så att den inte skrivs över om sidan laddas om.
    await page.addInitScript(([k, d]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, d); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(seed)]);
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

// ---- Set, reps och vikt i en styrkeövning --------------------------------
const activeSets = async (page) => (await readData(page)).active.items[0].sets;
const sideOf = (ben) => ({ '': '', höger: 'H', vänster: 'V' })[ben];

When(/^(?:jag )?trycker på "([^"]+)" för (höger|vänster) ben$/, async function (name, ben) {
  await this.page.getByRole('button', { name: `${name}, ${ben} ben`, exact: true }).click();
});

When(/^skriver vikten "([^"]+)"(?: för (höger|vänster) ben)?$/, async function (value, ben) {
  await this.page.getByLabel(ben ? `Vikt, ${ben} ben` : 'Vikt', { exact: true }).fill(value);
});

Then(/^ska övningen ha (\d+) set om (\d+) reps på ([\d,]+) kg(?: för (höger|vänster) ben)?$/, async function (n, reps, kg, ben) {
  const list = (await activeSets(this.page)).filter((x) => (x.side ?? '') === sideOf(ben ?? ''));
  assert.deepEqual(list.map((x) => [x.reps, x.weight]), [...Array(Number(n))].map(() => [Number(reps), Number(kg.replace(',', '.'))]));
});

Then('ska {int} set vara klara för varje ben', async function (n) {
  const sets = await activeSets(this.page);
  for (const side of ['H', 'V']) assert.equal(sets.filter((x) => x.side === side && x.done).length, n, side);
});

Then('ska {int} set vara klara', async function (n) {
  assert.equal((await activeSets(this.page)).filter((x) => x.done).length, n);
});

Then('ska fälten för set och reps finnas en gång', async function () {
  assert.equal(await this.page.locator('#workout .set-form').count(), 1);
  assert.equal(await this.page.locator('#workout .set').count(), 0);
});

Then('ska seten ligga höger, vänster växelvis', async function () {
  const sides = (await activeSets(this.page)).map((x) => x.side).join('');
  assert.match(sides, /^(HV)+$/);
});

// ---- Lägga till en övning under passet -----------------------------------
When('väljer övningen {string}', async function (name) {
  await this.page.locator('#workout .ex-main:visible').filter({ has: this.page.locator('strong', { hasText: exact(name) }) }).first().click();
});

Then('ska jag inte se valen för set och reps', async function () {
  await this.page.locator('#workout .wk-name').waitFor();
  assert.equal(await this.page.locator('#workout .set-form, #workout .set, #workout .stepper').count(), 0);
});

Then('ska jag inte se knappen {string}', async function (text) {
  assert.equal(await this.page.locator('button:visible').filter({ hasText: exact(text) }).count(), 0);
});

Then('ska {string} ligga i kön utan klara set', async function (exId) {
  await this.page.locator('#workout .picker').waitFor();
  const items = (await readData(this.page)).active.items.filter((it) => it.exId === exId);
  assert.equal(items.length, 1);
  assert.ok(!items[0].sets.some((x) => x.done) && !items[0].preview && !items[0].fresh);
});
