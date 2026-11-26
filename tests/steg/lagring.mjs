// Steg för säkerhetskopian. storage.js läses in på nytt i varje scenario med en tom localStorage.
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

let fresh = 0;

Given('en tom app', async function () {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  this.storage = await import(`../../web/storage.js?scenario=${++fresh}`);
});

Given('att ett pass pågår', function () { this.storage.data.active = { items: [], startedAt: Date.now() }; });
Given('att jag har gått {int} minuter', function (minutes) {
  this.storage.data.walks.push({ id: 'w1', date: new Date().toISOString(), minutes, km: null });
});

When('jag exporterar en säkerhetskopia', function () { this.backup = this.storage.exportJSON(); });
When('raderar all data', function () { this.storage.resetAll(); });
When('importerar kopian igen', function () { this.storage.importJSON(this.backup); });
When('jag importerar en säkerhetskopia med innehållet:', function (text) { this.storage.importJSON(text); });

Then('ska kopian ha {string} satt till {string}', function (key, value) { assert.equal(JSON.parse(this.backup)[key], value); });
Then('kopian ska inte innehålla {string}', function (key) { assert.ok(!(key in JSON.parse(this.backup))); });
Then(/^(?:ska )?"([^"]+)" vara en tom lista$/, function (key) { assert.deepEqual(this.storage.data[key], []); });
Then('veckoplanen ska ha {int} tomma dagar', function (n) { assert.deepEqual(this.storage.data.week, Array(n).fill('')); });
Then('ska jag ha {int} promenad på {int} minuter', function (n, minutes) {
  assert.equal(this.storage.data.walks.length, n);
  assert.equal(this.storage.data.walks[0].minutes, minutes);
});
