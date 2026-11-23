// Omdöme efter passet, som en PT: lyfter fram det som gick bra och ger ett tips till nästa gång.
import { BY_ID, MUSCLES } from './exercises.js';
import { patternOf } from './planner.js';
import { AREAS, REHAB } from './physio.js';

const DAY = 86_400_000;
const fmt = (n) => Number(n).toLocaleString('sv-SE', { maximumFractionDigits: 1 });
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const best = (sets, key) => Math.max(0, ...sets.map((s) => (key === 'weight' ? (s.reps > 0 ? s.weight || 0 : 0) : s.reps || 0)));
const volume = (sets) => sets.reduce((n, s) => n + (s.reps || 0) * (s.weight || 1), 0);
const PUSH = new Set(['push-h', 'push-v']);
const PULL = new Set(['pull-h', 'pull-v']);

/**
 * session: passet som just sparats. before: alla pass före det. Övrigt: simpass, promenader, mål, ont.
 * Returnerar { title, highlights: [{ icon, text }], tip }.
 */
export function workoutFeedback({ session, before, swims = [], walks = [], goals = [], pain = {}, goalLabel }) {
  const hl = [];
  const prs = [];
  const firsts = [];
  const more = [];

  for (const e of session.entries) {
    const ex = BY_ID[e.exId];
    if (!ex) continue;
    const history = before.flatMap((s) => s.entries.filter((x) => x.exId === e.exId).map((x) => ({ date: s.date, sets: x.sets })));
    if (!history.length) { firsts.push(ex); continue; }
    const weighted = e.sets.some((s) => s.weight > 0);
    const key = weighted ? 'weight' : 'reps';
    const prev = Math.max(...history.map((h) => best(h.sets, key)));
    const now = best(e.sets, key);
    if (now > prev && prev > 0) {
      prs.push(weighted ? `${fmt(now)} kg i ${lc(ex.name)}` : ex.timed ? `${fmt(now)} s ${lc(ex.name)}` : `${fmt(now)} ${lc(ex.name)} i ett set`);
      continue;
    }
    const last = history.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const v0 = volume(last.sets);
    const v1 = volume(e.sets);
    if (v0 > 0 && v1 > v0 * 1.04) more.push({ ex, pct: Math.round((v1 / v0 - 1) * 100) });
  }

  if (prs.length) hl.push({ icon: '🏅', text: `Nytt personbästa: ${prs.slice(0, 2).join(' och ')}!` });
  for (const m of more.slice(0, prs.length ? 1 : 2)) hl.push({ icon: '📈', text: `Mer jobb i ${lc(m.ex.name)} än förra gången (+${m.pct} %). Så blir man starkare.` });
  if (firsts.length && hl.length < 3) hl.push({ icon: '✨', text: `Första gången du körde ${lc(firsts[0].name)}. Kul att du testar nytt!` });

  // Mål
  for (const g of goals) {
    if (hl.length >= 4) break;
    const e = session.entries.find((x) => x.exId === g.exId);
    if (!e) continue;
    const now = best(e.sets, g.metric === 'weight' ? 'weight' : 'reps');
    if (g.achieved && new Date(g.achieved) >= new Date(session.date)) hl.push({ icon: '🏆', text: `Mål klart: ${goalLabel(g)}!` });
    else if (now > 0 && now < g.target) hl.push({ icon: '🎯', text: `${Math.round((now / g.target) * 100)} % av vägen mot ${goalLabel(g)}.` });
  }

  // Balans och fysio
  const patterns = new Set(session.entries.map((e) => BY_ID[e.exId] && patternOf(BY_ID[e.exId])));
  if (hl.length < 4 && [...patterns].some((p) => PUSH.has(p)) && [...patterns].some((p) => PULL.has(p))) {
    hl.push({ icon: '⚖️', text: 'Bra balans: du körde både press och drag. Det är bra för axlarna och hållningen.' });
  }
  const rehabDone = Object.entries(REHAB).filter(([area]) => (pain[area] || 0) > 0)
    .filter(([, ids]) => session.entries.some((e) => ids.includes(e.exId))).map(([a]) => a);
  const physioDone = session.entries.some((e) => BY_ID[e.exId]?.physio);
  if (hl.length < 4 && (rehabDone.length || physioDone)) {
    const where = rehabDone.length ? rehabDone.map((a) => AREAS[a].the).join(' och ') : 'kroppen';
    hl.push({ icon: '🩺', text: `Du gjorde dina fysioövningar. Det är så ${where} blir starkare, steg för steg.` });
  } else if (hl.length < 4 && Object.values(pain).some((v) => v > 0)) {
    const areas = Object.keys(pain).filter((a) => pain[a] > 0 && AREAS[a]);
    const loaded = session.entries.some((e) => areas.some((a) => (BY_ID[e.exId]?.load?.[a] || 0) >= 2));
    if (!loaded) hl.push({ icon: '🧠', text: `Smart träning: du tränade runt ${areas.map((a) => AREAS[a].the).join(' och ')} utan att belasta dem tungt.` });
  }

  // Kontinuitet
  const start = new Date(session.date);
  const inWeek = (d) => (start - new Date(d)) / DAY < 7 && new Date(d) <= start;
  const weekCount = 1 + before.filter((s) => inWeek(s.date)).length + swims.filter((s) => inWeek(s.date)).length;
  if (hl.length < 4 && weekCount >= 2) hl.push({ icon: '🔥', text: `Ditt ${weekCount}:e pass på sju dagar. Det är kontinuiteten som ger resultat.` });

  // Mängd
  const sets = session.entries.reduce((n, e) => n + e.sets.length, 0);
  const groups = [...new Set(session.entries.map((e) => BY_ID[e.exId]?.muscles[0]).filter((m) => m && MUSCLES[m]))];
  if (hl.length < 2 && sets) {
    hl.push({ icon: '💪', text: `${sets} set${groups.length ? ` för ${groups.map((m) => MUSCLES[m].name.toLowerCase()).join(', ')}` : ''}. Gediget jobbat!` });
  }
  if (!hl.length) hl.push({ icon: '👏', text: 'Du dök upp och gjorde jobbet. Det är det viktigaste av allt.' });

  const title = prs.length ? 'Starkt pass!' : hl.length >= 3 ? 'Riktigt bra jobbat!' : 'Bra jobbat!';
  return { title, highlights: hl.slice(0, 4), tip: nextTip(session, before, pain) };
}

/** Ett konkret tips till nästa gång (stegvis ökning), eller ett återhämtningsråd. */
function nextTip(session, before, pain) {
  for (const e of session.entries) {
    const ex = BY_ID[e.exId];
    if (!ex || ex.physio || ex.timed) continue;
    const w = Math.max(0, ...e.sets.map((s) => s.weight || 0));
    const allReps = e.sets.length >= 2 && e.sets.every((s) => s.reps >= ex.defaultReps);
    if (w > 0 && allReps && !Object.keys(ex.load || {}).some((a) => (pain[a] || 0) > 0)) {
      const step = ex.gear === 'dumbbells' || ex.muscles[0] === 'arms' || ex.muscles[0] === 'shoulders' ? 1 : 2.5;
      return `Du klarade alla set i ${lc(ex.name)} med ${fmt(w)} kg. Prova ${fmt(w + step)} kg nästa gång.`;
    }
    if (!w && ex.equipment === 'none' && allReps) return `Alla set i ${lc(ex.name)} satt. Sikta på 1–2 reps till per set nästa gång.`;
  }
  if (Object.values(pain).some((v) => v > 0)) return 'Känn efter i morgon. Är det som vanligt eller bättre kan du fortsätta så här.';
  return 'Ge musklerna du körde idag ett par dagars vila innan du kör dem tungt igen. Ät och sov gott!';
}

/** Kortare omdöme för intervallpass och simning. */
export function cardioFeedback({ minutes, kind, before = [], swims = [] }) {
  const start = Date.now();
  const weekCount = 1 + [...before, ...swims].filter((s) => (start - new Date(s.date)) / DAY < 7).length;
  const hl = [{ icon: '❤️', text: `${minutes} minuter ${kind}. Hjärtat och lungorna tackar dig.` }];
  if (weekCount >= 2) hl.push({ icon: '🔥', text: `Ditt ${weekCount}:e pass på sju dagar. Fin kontinuitet!` });
  return { title: 'Bra jobbat!', highlights: hl, tip: 'Drick vatten och ta det lugnt en stund. Pulsen ska gå ner innan du duschar varmt.' };
}
