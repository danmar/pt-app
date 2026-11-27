// Steg för logiken i appen: övningsurval, förslag, simpass och omdöme.
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { EXERCISES, BY_ID, painOk, isAvailable } from '../../web/exercises.js';
import { suggestNext } from '../../web/planner.js';
import { suggestSwim } from '../../web/swim.js';
import { workoutFeedback } from '../../web/feedback.js';

const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const ex = (id) => { assert.ok(BY_ID[id], `Övningen "${id}" finns inte`); return BY_ID[id]; };
const DAY = 86_400_000;

// ---- Ont och tillgänglighet ------------------------------------------------
Given('att jag har ont i {string} på nivå {int}', function (area, level) {
  this.pain[area] = level;
});

Then(/^(?:ska )?övningen "([^"]+)" vara (tillåten|bortvald)$/, function (id, want) {
  assert.equal(painOk(ex(id), this.pain), want === 'tillåten', `${id} med ont ${JSON.stringify(this.pain)}`);
});

Then('ska alla fysioövningar vara tillåtna', function () {
  const physio = EXERCISES.filter((e) => e.physio);
  assert.ok(physio.length > 0, 'Det finns inga fysioövningar');
  for (const e of physio) assert.ok(painOk(e, this.pain), `${e.id} togs bort`);
});

Given('att jag tränar hemma', function () { this.place = 'home'; });
Given('att jag inte har hantlar', function () { this.opts.gear = ['body', 'kettlebell', 'board', 'ball', 'band']; });

Then('ska ingen tillgänglig övning kräva hantlar', function () {
  const bad = EXERCISES.filter((e) => isAvailable(e, this.place, this.opts) && e.equipment === 'dumbbells');
  assert.deepEqual(bad.map((e) => e.id), []);
});

Then(/^(?:ska )?övningen "([^"]+)" vara tillgänglig$/, function (id) {
  assert.ok(isAvailable(ex(id), this.place, this.opts));
});

// ---- Nästa övning ----------------------------------------------------------
Given('att jag har utrustningen {string}', function (s) { this.gear = list(s); });
Given('att jag har kört {string} med {int} set idag', function (id, sets) { ex(id); this.done.push({ exId: id, sets }); });
Given('att {string} ligger i kön', function (id) { ex(id); this.exclude.push(id); });
Given('att jag har valt muskelgrupperna {string}', function (s) { this.groups = list(s); });

When('jag ber om förslag på nästa övning', function () {
  this.suggestions = suggestNext({
    done: this.done, groups: this.groups, gear: this.gear, pain: this.pain,
    exclude: this.exclude,
  });
});

const ids = (w) => w.suggestions.map((s) => s.ex.id);

Then('ska jag få {int} förslag', function (n) { assert.equal(this.suggestions.length, n); });
Then('förslagen ska täcka minst {int} muskelgrupper', function (n) {
  const groups = new Set(this.suggestions.map((s) => s.ex.muscles[0]));
  assert.ok(groups.size >= n, `Bara ${[...groups].join(', ')}`);
});
Then('ska {string} inte finnas bland förslagen', function (id) { assert.ok(!ids(this).includes(id), ids(this).join(', ')); });
Then(/^(?:ska )?något förslag ha skälet "([^"]+)"$/, function (reason) {
  assert.ok(this.suggestions.some((s) => s.reason === reason), this.suggestions.map((s) => `${s.ex.id}: ${s.reason}`).join('\n'));
});
Then('ska alla förslag ha huvudmuskeln {string}', function (m) {
  assert.ok(this.suggestions.length > 0);
  for (const s of this.suggestions) assert.equal(s.ex.muscles[0], m, s.ex.id);
});
Then('ska alla förslag använda utrustningen {string}', function (g) {
  assert.ok(this.suggestions.length > 0);
  for (const s of this.suggestions) assert.equal(s.ex.gear, g, s.ex.id);
});
Then('ska inget förslag belasta {string}', function (area) {
  assert.ok(this.suggestions.length > 0);
  for (const s of this.suggestions) assert.ok(!(s.ex.load?.[area] >= 2), `${s.ex.id} belastar ${area}`);
});
Then('ska {string} vara första förslaget', function (id) { assert.equal(ids(this)[0], id, ids(this).join(', ')); });
Then('första förslaget ska ha skälet {string}', function (reason) { assert.equal(this.suggestions[0].reason, reason); });

// ---- Simpass ---------------------------------------------------------------
When('jag ber om ett simpass på {int} minuter i {string} med fokus {string}', function (minutes, style, focus) {
  this.swim = suggestSwim({ minutes, style, focus });
});
Then('ska passet börja med {string} och sluta med {string}', function (first, last) {
  assert.equal(this.swim[0].title, first);
  assert.equal(this.swim.at(-1).title, last);
});
Then('passet ska vara ungefär {int} meter', function (m) {
  const total = this.swim.reduce((s, b) => s + b.meters, 0);
  assert.ok(Math.abs(total - m) <= m * 0.15, `${total} m, väntade ungefär ${m} m`);
});
Then('nedvarvningen ska vara {int} meter', function (m) { assert.equal(this.swim.at(-1).meters, m); });
Then('ingen del ska vara avbockad', function () { assert.ok(this.swim.every((b) => b.done === false)); });
Then('ska passet innehålla delen {string}', function (t) { assert.ok(this.swim.some((b) => b.title === t), this.swim.map((b) => b.title).join(', ')); });

// ---- Omdöme ----------------------------------------------------------------
const entry = (id, sets, reps, weight) => ({ exId: ex(id).id, sets: Array.from({ length: sets }, () => ({ reps, weight })) });

Given('ett tidigare pass för {int} dagar sedan med {string} {int} set om {int} reps på {float} kg', function (days, id, sets, reps, kg) {
  this.before.push({ id: `p${this.before.length}`, place: 'gym', date: new Date(Date.now() - days * DAY).toISOString(), entries: [entry(id, sets, reps, kg)] });
});
Given('dagens pass med {string} {int} set om {int} reps på {float} kg', function (id, sets, reps, kg) {
  this.today.entries.push(entry(id, sets, reps, kg));
});

When('jag får omdömet', function () {
  this.feedback = workoutFeedback({ session: { id: 'idag', place: 'gym', ...this.today }, before: this.before, goalLabel: (g) => g.label });
});

Then('ska rubriken vara {string}', function (t) { assert.equal(this.feedback.title, t); });
Then(/^(?:ska )?omdömet (?:ska )?nämna "([^"]+)"$/, function (text) {
  const all = this.feedback.highlights.map((h) => h.text);
  assert.ok(all.some((t) => t.includes(text)), all.join('\n'));
});
Then('ska tipset vara {string}', function (t) { assert.equal(this.feedback.tip, t); });
