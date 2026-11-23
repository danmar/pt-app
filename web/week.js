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

// Vilka av de sju dagarna (0 = idag) som blir träningsdagar.
const PATTERNS = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 3, 4, 6], 6: [0, 1, 2, 4, 5, 6] };
const DAY = 86_400_000;

export function suggestWeek({ days, kinds, sessions, swims, walks, cardio = [], pain = {}, priority = 'balanced', start = new Date() }) {
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

  // Lägg styrkedagarna så att de inte ligger dag efter dag, om det går.
  const train = PATTERNS[n];
  const plan = Array(7).fill(null);
  for (const pass of [true, false]) {
    for (const d of train) {
      if (plan.filter((k) => k === 'S').length >= nStrength) break;
      if (plan[d]) continue;
      if (pass && (plan[d - 1] === 'S' || plan[d + 1] === 'S')) continue;
      plan[d] = 'S';
    }
  }
  for (const d of train) if (!plan[d]) plan[d] = canSwim ? 'swim' : canWalk ? 'walk' : strengthKinds.length ? 'S' : 'walk';

  // Promenader på några lediga dagar, men minst en vilodag.
  const free = plan.map((k, d) => (k ? null : d)).filter((d) => d !== null);
  const keepRest = priority === 'weightloss' ? 0 : 1; // promenader är lätta nog för varje dag
  free.forEach((d, i) => { plan[d] = canWalk && i < free.length - keepRest ? 'walk' : 'rest'; });

  // Muskelfokus för styrkedagarna: de grupper du vilat längst först.
  const rest = daysSinceTrained(sessions, start);
  const groups = MUSCLE_IDS.filter((m) => m !== 'cardio').sort((a, b) => (rest[b] ?? 99) - (rest[a] ?? 99));
  const strengthDays = plan.map((k, d) => (k === 'S' ? d : null)).filter((d) => d !== null);
  const focus = strengthDays.map((_, i) => groups.filter((__, j) => j % strengthDays.length === i));

  // Konditionsdagarna turas om, det du gjort minst av på sistone först.
  const order = [...cardioKinds].sort((a, b) => hist[a] - hist[b]);
  let c = 0;
  let s = 0;
  const swimIndex = plan.indexOf('swim');
  const list = plan.map((k, d) => {
    const date = new Date(start.getTime() + d * DAY);
    if (k === 'S') {
      const kind = strengthKinds[s % strengthKinds.length];
      const f = focus[s];
      const yesterday = plan[d - 1] === 'S';
      s++;
      const groupsText = f.map((m) => MUSCLES[m].name.toLowerCase()).join(', ');
      const label = priority === 'weightloss' ? 'Styrka (bygger muskler som förbränner)' : 'Styrka';
      return { date, kind, focus: f, reason: `${label} med fokus på ${groupsText}${yesterday ? '. Andra muskler än igår' : ''}` };
    }
    if (k === 'swim') {
      const kind = order[c++ % order.length];
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
        : priority === 'cardio' && train.includes(d) ? 'Rask promenad för konditionen' : 'Lätt rörelse som hjälper återhämtningen' };
    }
    return { date, kind: 'rest', reason: 'Vila. Det är då musklerna bygger upp sig' };
  });
  return { days: list, hist };
}
