// Steg för gympass.feature: ett pågående gympass i Chromium.
import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { exact, readData } from './webbläsare.mjs';
import { BY_ID } from '../../web/exercises.js';

const active = async (page) => (await readData(page)).active;
/** Seten för övningen som är öppen just nu. */
const openSets = async (page) => { const w = await active(page); return w.items[w.index].sets; };
const sideOf = (ben) => ({ höger: 'H', vänster: 'V' })[ben] ?? '';
const exercise = (page, name) => page.locator('strong', { hasText: exact(name) });

Then('ska ett nytt gympass vara igång', async function () {
  await this.page.locator('#workout .picker').waitFor();
  const w = await active(this.page);
  assert.equal(w.place, 'gym');
  assert.equal(w.items.filter((it) => it.sets.some((x) => x.done)).length, 0);
});

When('jag lägger till {string} från listan', async function (name) {
  const page = this.page;
  await page.locator('button:visible').filter({ hasText: exact('Lägg till övning') }).click();
  await page.locator('button:visible').filter({ hasText: exact('Välj övningar från listan') }).click();
  await page.getByLabel('Sök övning').fill(name);
  await page.locator('#sheet [data-action="pick-toggle"]').filter({ has: exercise(page, name) }).click();
  await page.locator('#pick-done').click();
  await page.locator('#workout .picker').waitFor();
});

When(/^(?:jag )?kör "([^"]+)" från kön$/, async function (name) {
  await this.page.locator('#workout [data-action="q-go"]').filter({ has: exercise(this.page, name) }).first().click();
  await this.page.locator('#workout .wk-name').filter({ hasText: exact(name) }).waitFor();
});

When('väljer det första förslaget', async function () {
  const first = this.page.locator('#workout [data-action="s-go"]').first();
  this.chosen = await first.getAttribute('data-id');
  await first.click();
});

When(/^(?:jag )?trycker på "([^"]+)" för (höger|vänster) ben$/, async function (name, ben) {
  await this.page.getByRole('button', { name: `${name}, ${ben} ben`, exact: true }).click();
});

When(/^skriver vikten "([^"]+)"(?: för (höger|vänster) ben)?$/, async function (value, ben) {
  await this.page.getByLabel(ben ? `Vikt, ${ben} ben` : 'Vikt', { exact: true }).fill(value);
});

Then('ska jag inte se valen för set och reps', async function () {
  await this.page.locator('#workout .wk-bottom').waitFor();
  assert.equal(await this.page.locator('#workout .set-form, #workout .set, #workout .stepper').count(), 0);
});

Then('ska jag inte se knappen {string}', async function (text) {
  assert.equal(await this.page.locator('button:visible').filter({ hasText: exact(text) }).count(), 0);
});

Then('ska förslaget ligga i kön utan klara set', async function () {
  await this.page.locator('#workout .picker').waitFor();
  const items = (await active(this.page)).items.filter((it) => it.exId === this.chosen);
  assert.equal(items.length, 1, this.chosen);
  assert.ok(!items[0].sets.some((x) => x.done) && !items[0].preview && !items[0].fresh);
});

Then('ska fälten för set och reps finnas en gång', async function () {
  assert.equal(await this.page.locator('#workout .set-form').count(), 1);
  assert.equal(await this.page.locator('#workout .set').count(), 0);
});

Then(/^ska övningen ha (\d+) set om (\d+) reps på ([\d,]+) kg(?: för (höger|vänster) ben)?$/, async function (n, reps, kg, ben) {
  const list = (await openSets(this.page)).filter((x) => (x.side ?? '') === sideOf(ben));
  assert.deepEqual(list.map((x) => [x.reps, x.weight]), [...Array(Number(n))].map(() => [Number(reps), Number(kg.replace(',', '.'))]));
});

Then('ska {int} set vara klara', async function (n) {
  assert.equal((await openSets(this.page)).filter((x) => x.done).length, n);
});

Then('ska {int} set vara klara för varje ben', async function (n) {
  const sets = await openSets(this.page);
  for (const side of ['H', 'V']) assert.equal(sets.filter((x) => x.side === side && x.done).length, n, side);
});

When('jag väljer uppvärmningen {string}', async function (name) {
  await this.page.locator('#workout [data-action="w-go"]').filter({ has: exercise(this.page, name) }).click();
  await this.page.locator('#workout .wk-name').filter({ hasText: exact(name) }).waitFor();
});

Then('ska övningsvyn visa namn, loggning, figur och muskler i den ordningen', async function () {
  const order = await this.page.locator('#wk-body').evaluate((body) => {
    const parts = { namn: '.wk-name', loggning: '.set-form', figur: '.fig', muskler: '.body-map' };
    const all = [...body.querySelectorAll('*')];
    return Object.entries(parts).map(([k, sel]) => [k, all.indexOf(body.querySelector(sel))]);
  });
  for (const [k, i] of order) assert.ok(i >= 0, `${k} saknas`);
  assert.deepEqual([...order].sort((a, b) => a[1] - b[1]).map(([k]) => k), order.map(([k]) => k));
});

Then('ska kroppskartan vara hälften så stor', async function () {
  const { map, fig } = await this.page.locator('#wk-body').evaluate((body) => ({
    map: body.querySelector('.body-map').getBoundingClientRect().width,
    fig: body.querySelector('.fig').getBoundingClientRect().width,
  }));
  assert.ok(map <= fig / 2 + 1, `kroppskartan är ${map}px, figuren ${fig}px`);
});

Then('ska det inte gå att trycka på musklerna', async function () {
  assert.equal(await this.page.locator('#wk-body .body-map [data-action="body-muscle"]').count(), 0);
});

Then('ska övningens namn stå överst utan tid', async function () {
  await this.page.locator('#workout .wk-bottom').waitFor();
  const title = this.page.locator('#workout .wk-title');
  assert.equal((await title.innerText()).trim(), BY_ID[this.chosen].name);
  assert.equal(await title.locator('#elapsed').count(), 0);
  assert.equal(await this.page.locator('#wk-body .wk-name').count(), 0);
});

Then('ska övningsvyn bara visa figuren och musklerna', async function () {
  const kids = await this.page.locator('#wk-body').evaluate((b) => [...b.children].map((c) => c.className));
  assert.deepEqual(kids, ['fig big', 'card body-card']);
});
