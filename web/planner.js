// Föreslår pass. Prioriterar muskelgrupper du vilat längst, så att du får
// en jämn fördelning över veckan utan att köra samma muskler två dagar i rad.
import { EXERCISES, BY_ID, MUSCLES, isAvailable } from './exercises.js';

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
