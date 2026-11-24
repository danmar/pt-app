// Föreslår aktiviteter för de kommande sju dagarna.
// Styrkedagar sprids ut så att musklerna hinner vila, simning och promenader fyller på,
// och förslaget väger in vad du har gjort de senaste två veckorna och om du har ont.
import { MUSCLES, MUSCLE_IDS } from './exercises.js';
import { daysSinceTrained } from './planner.js';

export const PRIORITIES = {
  balanced: { name: 'Allround', desc: 'Lika mycket styrka och kondition' },
  strength: { name: 'Styrka', desc: 'Fler styrkepass och tunga basövningar' },
  cardio: { name: 'Kondition', desc: 'Mer simning, löpning och cykling, färre styrkepass' },
  weightloss: { name: 'Viktnedgång', desc: 'Mycket vardagsrörelse plus styrka. Kosten betyder mest för vikten' },
};

export const WEEK_KINDS = { gym: 'Gym', home: 'Hemma', swim: 'Simma', run: 'Löpning', bike: 'Cykling', walk: 'Promenad' };
const CARDIO_KINDS = ['swim', 'run', 'bike'];

const DAY = 86_400_000;

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Det du redan har gjort idag: styrka går före kondition, som går före promenad. */
function doneToday({ sessions, swims, walks, cardio, start }) {
  const today = (x) => sameDay(new Date(x.date), start);
  const s = sessions.find(today);
  if (s) return { slot: 'S', kind: s.place === 'home' ? 'home' : 'gym' };
  const c = [...swims.map((x) => ({ kind: 'swim', ...x })), ...cardio.filter((x) => x.kind === 'run' || x.kind === 'bike')].find(today);
  if (c) return { slot: 'swim', kind: c.kind === 'swim' || !c.kind ? 'swim' : c.kind };
  if (walks.some(today)) return { slot: 'walk', kind: 'walk' };
  return null;
}

// Vilken plats i veckan en aktivitet tar: styrka, kondition, promenad eller vila.
const slotOf = (kind) => (kind === 'gym' || kind === 'home' ? 'S' : kind === 'walk' ? 'walk' : kind === 'rest' ? 'rest' : 'swim');

/**
 * Veckan från idag och sju dagar framåt. pinned[d] är det du själv har bestämt för dag d
 * (gym, home, swim, run, bike, ski, walk eller rest), annars null. Dagarna du har bestämt
 * ligger fast och resten av veckan anpassas efter dem.
 */
export function suggestWeek({ days, kinds, sessions, swims, walks, cardio = [], pain = {}, priority = 'balanced', pinned = [], start = new Date() }) {
  const n = Math.max(1, Math.min(6, days));
  const recent = (list, test = () => true) => list.filter((x) => (start - new Date(x.date)) / DAY < 14 && test(x)).length;
  const hist = {
    gym: recent(sessions, (s) => s.place === 'gym'),
    home: recent(sessions, (s) => s.place === 'home'),
    swim: recent(swims),
    run: recent(cardio, (c) => c.kind === 'run'),
    bike: recent(cardio, (c) => c.kind === 'bike'),
    walk: recent(walks),
  };
  const strengthKinds = ['gym', 'home'].filter((k) => kinds.includes(k));
  const sore = ['knees', 'back'].filter((a) => (pain[a] || 0) >= 2);
  // Konditionsaktiviteter: löpning bort om knäna gör ont och det finns andra att välja.
  let cardioKinds = CARDIO_KINDS.filter((k) => kinds.includes(k));
  if (sore.includes('knees') && cardioKinds.length > 1) cardioKinds = cardioKinds.filter((k) => k !== 'run');
  const canSwim = cardioKinds.length > 0;
  const canWalk = kinds.includes('walk');

  // Antal styrkedagar: hälften om det finns simning, annars alla. Färre om knän eller rygg gör ont.
  const other = canSwim || canWalk;
  const share = { strength: 2 / 3, cardio: 1 / 3, weightloss: 1 / 2, balanced: 1 / 2 }[priority] ?? 1 / 2;
  let nStrength = !strengthKinds.length ? 0 : other ? Math.max(1, Math.round(n * share)) : n;
  if (sore.length && (canSwim || canWalk) && nStrength > 1) nStrength--;
  if (canSwim && !cardioKinds.some((k) => hist[k]) && nStrength === n && n > 1) nStrength--;

  // Det du redan har gjort idag och det du själv har lagt in ligger fast.
  const done = doneToday({ sessions, swims, walks, cardio, start });
  const fixed = [...Array(7)].map((_, d) => (d === 0 && done ? done.kind : pinned[d] || null));
  const plan = fixed.map((k) => (k ? slotOf(k) : null));
  const isTrain = (k) => k === 'S' || k === 'swim';

  // Fler träningsdagar på de lediga dagarna, så långt från andra träningsdagar som möjligt.
  // Avståndet räknas runt veckan, eftersom nästa vecka börjar där den här slutar.
  const added = [];
  let missing = n - plan.filter(isTrain).length;
  while (missing-- > 0) {
    const free = plan.map((k, d) => (k ? null : d)).filter((d) => d !== null);
    if (!free.length) break;
    const trainDays = plan.map((k, d) => (isTrain(k) || added.includes(d) ? d : null)).filter((d) => d !== null);
    const dist = (d) => (trainDays.length ? Math.min(...trainDays.map((t) => Math.min(Math.abs(d - t), 7 - Math.abs(d - t)))) : 99);
    const best = free.reduce((a, d) => (dist(d) > dist(a) ? d : a), free[0]);
    added.push(best);
    plan[best] = 'new';
  }

  // Styrka på de nya dagarna så att den inte hamnar dag efter dag, om det går.
  let needStrength = nStrength - plan.filter((k) => k === 'S').length;
  added.sort((a, b) => a - b);
  for (const pass of [true, false]) {
    for (const d of added) {
      if (needStrength <= 0) break;
      if (plan[d] !== 'new') continue;
      if (pass && (plan[d - 1] === 'S' || plan[d + 1] === 'S')) continue;
      plan[d] = 'S';
      needStrength--;
    }
  }
  for (const d of added) if (plan[d] === 'new') plan[d] = canSwim ? 'swim' : canWalk ? 'walk' : strengthKinds.length ? 'S' : 'walk';

  // Promenader på några lediga dagar, men minst en vilodag.
  const free = plan.map((k, d) => (k ? null : d)).filter((d) => d !== null);
  const keepRest = Math.max(0, (priority === 'weightloss' ? 0 : 1) - plan.filter((k) => k === 'rest').length);
  free.forEach((d, i) => { plan[d] = canWalk && i < free.length - keepRest ? 'walk' : 'rest'; });

  // Muskelfokus för styrkedagarna: de grupper du vilat längst först.
  const rest = daysSinceTrained(sessions, start);
  const groups = MUSCLE_IDS.filter((m) => m !== 'cardio').sort((a, b) => (rest[b] ?? 99) - (rest[a] ?? 99));
  const strengthDays = plan.map((k, d) => (k === 'S' && !(done && d === 0) ? d : null)).filter((d) => d !== null);
  const focusOf = (d) => groups.filter((_, j) => j % strengthDays.length === strengthDays.indexOf(d));

  // Styrka och kondition turas om: det du gjort minst av, inräknat det du har lagt in, först.
  const count = { ...hist };
  for (const k of fixed) if (k) count[k] = (count[k] ?? 0) + 1;
  const pick = (list) => {
    const k = list.reduce((a, b) => ((count[b] ?? 0) < (count[a] ?? 0) ? b : a), list[0]);
    count[k] = (count[k] ?? 0) + 1;
    return k;
  };
  const swimIndex = plan.findIndex((k, d) => k === 'swim' && !fixed[d]);
  const list = plan.map((k, d) => {
    const date = new Date(start.getTime() + d * DAY);
    if (done && d === 0) return { date, kind: done.kind, done: true, reason: `Redan gjort idag. ${done.slot === 'walk' ? 'Bra rörelse' : 'Bra jobbat'}!` };
    const mine = fixed[d];
    if (k === 'S') {
      const kind = mine || pick(strengthKinds);
      const f = focusOf(d);
      const yesterday = plan[d - 1] === 'S';
      const groupsText = f.map((m) => MUSCLES[m].name.toLowerCase()).join(', ');
      const label = mine ? 'Fokus' : priority === 'weightloss' ? 'Styrka (bygger muskler som förbränner) med fokus' : 'Styrka med fokus';
      return { date, kind, pinned: !!mine, focus: f, reason: `${label} på ${groupsText}${yesterday ? '. Andra muskler än igår' : ''}` };
    }
    if (mine) return { date, kind: mine, pinned: true, reason: k === 'rest' ? 'Vila. Det är då musklerna bygger upp sig' : '' };
    if (k === 'swim') {
      const kind = pick(cardioKinds);
      const never = { swim: 'Du har inte simmat på två veckor', run: 'Du har inte sprungit på två veckor', bike: 'Du har inte cyklat på två veckor' };
      const gentle = kind === 'run' ? 'Löpning bygger kondition och starka ben' : 'Kondition som är skonsam för lederna';
      const why = d === swimIndex && !hist[kind] ? never[kind]
        : priority === 'cardio' ? 'Kondition, ditt fokus just nu'
        : priority === 'weightloss' ? (kind === 'run' ? 'Förbränner mycket på kort tid' : 'Förbränner mycket och är skonsamt')
        : sore.length && kind !== 'run' ? `Skonsam kondition för ${sore.map((a) => (a === 'knees' ? 'knäna' : 'ryggen')).join(' och ')}`
        : gentle;
      return { date, kind, reason: why };
    }
    if (k === 'walk') {
      return { date, kind: 'walk', reason: pain.back ? 'Promenader är bra för ryggen'
        : priority === 'weightloss' ? 'Varje promenad räknas. Rör dig mycket varje dag'
        : priority === 'cardio' && added.includes(d) ? 'Rask promenad för konditionen' : 'Lätt rörelse som hjälper återhämtningen' };
    }
    return { date, kind: 'rest', reason: 'Vila. Det är då musklerna bygger upp sig' };
  });
  return { days: list, hist };
}
