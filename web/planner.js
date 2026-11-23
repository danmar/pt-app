// Föreslår pass. Prioriterar muskelgrupper du vilat längst, så att du får
// en jämn fördelning över veckan utan att köra samma muskler två dagar i rad.
import { EXERCISES, BY_ID, MUSCLES, MUSCLE_IDS, isAvailable } from './exercises.js';

export const LENGTHS = [
  { minutes: 20, count: 4 },
  { minutes: 40, count: 6 },
  { minutes: 60, count: 8 },
];

/** Antal övningar i ett styrkepass per passlängd. */
export const COUNT = { 10: 3, 15: 4, 20: 4, 40: 6, 60: 8 };

const DAY = 86_400_000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const primary = (ex) => ex.muscles[0];

/** { muskel: dagar sedan senast tränad }. Saknas = aldrig. */
export function daysSinceTrained(sessions, now = new Date()) {
  const result = {};
  for (const session of sessions) {
    const days = daysBetween(session.date, now);
    for (const entry of session.entries) {
      const ex = BY_ID[entry.exId];
      if (!ex || !entry.sets.length) continue;
      for (const m of ex.muscles) result[m] = Math.min(result[m] ?? Infinity, days);
    }
  }
  return result;
}

/**
 * skip: muskelgrupper som inte ska väljas (t.ex. ben när ett fysiopass redan tränar dem).
 * count: antal övningar (annars efter passlängd).
 */
export function suggest({ place, minutes, focus, sessions, hasDumbbells, kneeFriendly, skip = [], count: wanted }) {
  const count = wanted ?? COUNT[minutes] ?? 6;
  const candidates = EXERCISES.filter((e) => !e.physio && !e.noAuto && !skip.includes(primary(e)) && isAvailable(e, place, { hasDumbbells, kneeFriendly }));
  const rest = daysSinceTrained(sessions);
  const chosen = [];

  // Hemma: börja med något pulshöjande som uppvärmning.
  if (place === 'home' && !skip.length && (!focus || focus === 'cardio')) {
    const cardio = candidates.filter((e) => primary(e) === 'cardio');
    if (cardio.length) chosen.push(pick(cardio));
  }

  const ranked = candidates
    .filter((e) => !chosen.includes(e))
    .map((ex) => {
      let score = Math.min(rest[primary(ex)] ?? 7, 7); // 0–7 dagars vila
      if (focus) score += ex.muscles.includes(focus) ? 10 : -10;
      if (place === 'gym' && ex.equipment === 'gym') score += 1.5;
      if (place === 'gym' && primary(ex) === 'cardio') score -= 4;
      score += Math.random() * 2.5; // lite variation
      return { ex, score };
    })
    .sort((a, b) => b.score - a.score);

  const perGroup = {};
  for (const ex of chosen) perGroup[primary(ex)] = (perGroup[primary(ex)] ?? 0) + 1;
  for (const { ex } of ranked) {
    if (chosen.length >= count) break;
    const limit = primary(ex) === focus ? 3 : primary(ex) === 'cardio' || skip.length ? 1 : 2;
    if ((perGroup[primary(ex)] ?? 0) < limit) {
      chosen.push(ex);
      perGroup[primary(ex)] = (perGroup[primary(ex)] ?? 0) + 1;
    }
  }

  return chosen
    .sort((a, b) => MUSCLES[primary(a)].order - MUSCLES[primary(b)].order)
    .map((ex) => ({ exId: ex.id, sets: ex.sets }));
}

/** En annan övning för samma muskelgrupp som inte redan finns i passet. */
export function replacement(exId, planIds, place, opts) {
  const ex = BY_ID[exId];
  const pool = EXERCISES.filter((e) => !e.physio && !e.noAuto && isAvailable(e, place, opts) && !planIds.includes(e.id));
  const same = pool.filter((e) => primary(e) === primary(ex));
  if (same.length) return pick(same);
  const overlap = pool.filter((e) => e.muscles.some((m) => ex.muscles.includes(m)));
  return overlap.length ? pick(overlap) : null;
}

/** Senaste vikt per övning, för att fylla i automatiskt. */
export function lastWeights(sessions) {
  const result = {};
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const session of sorted) {
    for (const entry of session.entries) {
      if (result[entry.exId] !== undefined) continue;
      const w = Math.max(0, ...entry.sets.map((s) => s.weight || 0));
      if (w > 0) result[entry.exId] = w;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Fri träning: förslag på nästa övning utifrån det du redan kört idag.

/** Rörelsemönster per övning, för att få variation och motvikt (press ↔ drag). */
const PATTERN = {
  squat: 'squat', 'goblet-squat': 'squat', 'barbell-squat': 'squat', 'leg-press': 'squat',
  lunge: 'lunge', 'db-lunge': 'lunge',
  'glute-bridge': 'hip', 'hip-thrust': 'hip', 'side-leg-raise': 'hip-abd',
  rdl: 'hinge', deadlift: 'hinge',
  'straight-leg-raise': 'knee-ext', 'leg-extension': 'knee-ext', 'leg-curl': 'knee-flex', 'calf-raise': 'calf',
  'db-row': 'pull-h', 'barbell-row': 'pull-h', 'seated-row': 'pull-h',
  'lat-pulldown': 'pull-v', 'pull-up': 'pull-v', superman: 'back-ext',
  'bench-press': 'push-h', 'db-bench': 'push-h', 'push-up': 'push-h', 'chest-press-machine': 'push-h',
  'shoulder-press': 'push-v', 'barbell-press': 'push-v', 'machine-shoulder-press': 'push-v',
  'bicep-curl': 'curl', 'barbell-curl': 'curl', 'triceps-ext': 'tri', 'triceps-pushdown': 'tri',
  plank: 'core-static', crunch: 'core-flex',
};
const COMPOUND = new Set(['squat', 'lunge', 'hinge', 'hip', 'pull-h', 'pull-v', 'push-h', 'push-v']);
const OPPOSITE = {
  'push-h': 'pull-h', 'pull-h': 'push-h', 'push-v': 'pull-v', 'pull-v': 'push-v',
  curl: 'tri', tri: 'curl', 'knee-ext': 'knee-flex', 'knee-flex': 'knee-ext',
  squat: 'hinge', hinge: 'squat', 'core-flex': 'back-ext', 'back-ext': 'core-flex',
};
export const patternOf = (ex) => PATTERN[ex.id] ?? (primary(ex) === 'cardio' ? 'cardio' : ex.id);

/** Set per muskelgrupp. Primär muskel räknas fullt, övriga till hälften. */
export function volumeByGroup(done) {
  const vol = {};
  for (const { exId, sets } of done) {
    const ex = BY_ID[exId];
    if (!ex) continue;
    ex.muscles.forEach((m, i) => { vol[m] = (vol[m] ?? 0) + sets * (i === 0 ? 1 : 0.5); });
  }
  return vol;
}

/**
 * done: [{ exId, sets }] i den ordning de kördes idag (antal klara set).
 * groups: valda muskelgrupper (tom = alla utom kondition). gear: vald utrustning.
 * exclude: övningar som redan ligger i kön. busy: { exId: true } för upptagna maskiner.
 * Returnerar [{ ex, reason, busy }], bästa först. Upptagna hamnar sist.
 */
export function suggestNext({ done, groups = [], gear, kneeFriendly, exclude = [], busy = {}, sessions = [], limit = 5 }) {
  const targets = groups.length ? groups : MUSCLE_IDS.filter((m) => m !== 'cardio');
  const doneIds = new Set(done.map((d) => d.exId));
  const vol = volumeByGroup(done);
  const maxVol = Math.max(0, ...targets.map((m) => vol[m] ?? 0));
  const patternsDone = new Set(done.map((d) => BY_ID[d.exId] && patternOf(BY_ID[d.exId])));
  const lastEx = done.length ? BY_ID[done[done.length - 1].exId] : null;
  const lastPattern = lastEx ? patternOf(lastEx) : null;
  const rest = groups.length ? {} : daysSinceTrained(sessions.filter((s) => daysBetween(s.date, new Date()) > 0));
  const count = done.length;

  const scored = EXERCISES
    .filter((e) => !e.physio && !e.noAuto && gear.includes(e.gear) && !(kneeFriendly && e.kneeHeavy))
    .filter((e) => !doneIds.has(e.id) && !exclude.includes(e.id) && targets.includes(primary(e)))
    .map((ex) => {
      const g = primary(ex);
      const pattern = patternOf(ex);
      const v = vol[g] ?? 0;
      let score = (maxVol - v) * 0.6;
      const reasons = [];
      if (v === 0) { score += 3; reasons.push([3, `${MUSCLES[g].name} har du inte kört idag`]); }
      for (const m of ex.muscles.slice(1)) if (targets.includes(m) && !(vol[m] > 0)) score += 0.5;
      if (patternsDone.has(pattern)) score -= 2.5;
      else if (v > 0) reasons.push([1, `Ny vinkel för ${MUSCLES[g].name.toLowerCase()}`]);
      if (lastPattern && OPPOSITE[lastPattern] === pattern) { score += 2; reasons.push([4, `Motvikt till ${lastEx.name.toLowerCase()}`]); }
      if (lastEx && primary(lastEx) === g && targets.length > 1) score -= 1.5;
      if (COMPOUND.has(pattern) && count < 2 && !patternsDone.has(pattern)) { score += 1.5; reasons.push([2, 'Basövning, bra tidigt i passet']); }
      if (!COMPOUND.has(pattern) && count >= 3) { score += 1; reasons.push([2, 'Isolering, passar mot slutet']); }
      if (!groups.length) score += Math.min(rest[g] ?? 7, 7) * 0.2;
      reasons.sort((a, b) => b[0] - a[0]);
      return { ex, score, busy: !!busy[ex.id], reason: reasons[0]?.[1] ?? `Komplement för ${MUSCLES[g].name.toLowerCase()}` };
    })
    .sort((a, b) => (a.busy - b.busy) || (b.score - a.score));

  // Sprid förslagen: högst två per muskelgrupp bland de första.
  const picked = [];
  const perGroup = {};
  for (const s of scored) {
    if (picked.length >= limit || s.busy) break;
    const g = primary(s.ex);
    if ((perGroup[g] ?? 0) >= 2 && targets.length > 1) continue;
    perGroup[g] = (perGroup[g] ?? 0) + 1;
    picked.push(s);
  }
  for (const s of scored) if (picked.length < limit && !s.busy && !picked.includes(s)) picked.push(s);
  return [...picked, ...scored.filter((s) => s.busy)];
}
