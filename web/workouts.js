// Passtyper: styrka (set och vila) samt cirkel, HIIT, kondition och balans som körs
// med intervalltimer. Här byggs stationerna och stegen för timern.
import { EXERCISES, BY_ID, isAvailable } from './exercises.js';
import { daysSinceTrained } from './planner.js';

export const TYPES = {
  strength: { name: 'Styrka', desc: 'Set med vila emellan. Du loggar vikt och reps.' },
  circuit: { name: 'Cirkel', desc: 'Stationer i följd där muskelgrupperna växlar, så att en muskel vilar medan nästa jobbar. Kör flera varv.' },
  hiit: { name: 'HIIT', desc: 'Korta intensiva intervaller med kort vila. Får upp pulsen snabbt.' },
  cardio: { name: 'Kondition', desc: 'Längre intervaller i jämnt tempo för hjärta och lungor.' },
  balance: { name: 'Balans', desc: 'Lugna övningar på ett ben och på smal bas som tränar balans och stabilitet. Ha en vägg eller stol nära.' },
};

export const LENGTH_OPTIONS = { gym: [20, 40, 60], home: [10, 15, 20] };

export const TIMING = {
  circuit: { work: 40, rest: 15, roundRest: 60 },
  hiit: { work: 30, rest: 20, roundRest: 60 },
  cardio: { work: 90, rest: 30, roundRest: 30 },
  balance: { work: 40, rest: 15, roundRest: 45 },
};

const PHYSIO_SET_SEC = 45; // uppskattad tid för ett fysioset räknat i reps
const PHYSIO_REST = 20;

const STATIONS = {
  circuit: { gym: { 20: 5, 40: 6, 60: 7 }, home: { 10: 4, 15: 5, 20: 5 } },
  hiit: { gym: { 20: 5, 40: 6, 60: 6 }, home: { 10: 4, 15: 5, 20: 6 } },
  cardio: { gym: { 20: 3, 40: 3, 60: 4 }, home: { 10: 3, 15: 3, 20: 3 } },
  balance: { gym: { 20: 5, 40: 6, 60: 6 }, home: { 10: 4, 15: 5, 20: 5 } },
};

// Övningar i balanspasset: de som är märkta som balans plus några som också utmanar balansen.
const BALANCE_EXTRA = ['bird-dog', 'calf-raise'];
const okForBalance = (ex) => ex.balance || BALANCE_EXTRA.includes(ex.id);

/** Annan balansövning att byta till, eller null. */
export function balanceSwap(current, used, place, opts) {
  const options = EXERCISES.filter((e) => okForBalance(e) && isAvailable(e, place, opts) && !used.includes(e.id));
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

// Ordning för muskelgrupper i en cirkel: överkropp, bål och ben växlar.
const CIRCUIT_ORDER = ['legs', 'chest', 'back', 'core', 'shoulders', 'cardio', 'arms'];
const HIIT_ORDER = ['cardio', 'chest', 'cardio', 'core', 'cardio', 'legs', 'back'];

const primary = (ex) => ex.muscles[0];
const okForCircuit = (ex) => !ex.physio && !ex.noAuto && !ex.props?.includes('barbell') && ex.id !== 'bike' && ex.id !== 'rowing-machine';
const okForHiit = (ex) => okForCircuit(ex) && (!['dumbbells', 'kettlebell'].includes(ex.equipment) || ex.id === 'kb-swing') && !['pull-up', 'db-bench', 'side-leg-raise', 'straight-leg-raise', 'calf-raise'].includes(ex.id);

function pickFor(group, pool, used, rest) {
  const options = pool.filter((e) => primary(e) === group && !used.has(e.id));
  if (!options.length) return null;
  const scored = options.map((e) => ({ e, s: Math.min(rest[group] ?? 7, 7) + Math.random() * 3 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].e;
}

/** Sprid ut fysioövningarna jämnt bland de andra stationerna. */
function interleave(others, physio) {
  if (!physio.length) return others;
  const out = [...others];
  const step = (others.length + physio.length) / physio.length;
  physio.forEach((p, i) => out.splice(Math.min(out.length, Math.round(i * step)), 0, p));
  return out;
}

/**
 * Bygger ett intervallpass.
 * @returns {{ type, stations: {exId, physio?}[], physio: {exId, sets}[], rounds, bikeSec }}
 */
export function buildInterval({ type, place, minutes, sessions, opts, physio = [], stations: given }) {
  const rest = daysSinceTrained(sessions);
  const ok = { hiit: okForHiit, balance: okForBalance }[type] ?? okForCircuit;
  const pool = EXERCISES.filter((e) => isAvailable(e, place, opts) && ok(e));
  const count = STATIONS[type][place][minutes] ?? 5;
  const used = new Set();
  let stations = given ? clone(given) : [];
  let bikeSec = 0;

  if (!given) {
    if (type === 'circuit') {
      const order = CIRCUIT_ORDER.filter((g) => !(physio.length && g === 'legs'));
      const want = Math.max(2, count - physio.length);
      for (let i = 0; stations.length < want && i < order.length * 2; i++) {
        const ex = pickFor(order[i % order.length], pool, used, rest);
        if (ex) { used.add(ex.id); stations.push({ exId: ex.id }); }
      }
      stations = interleave(stations, physio.map((p) => ({ exId: p.exId, physio: true, sets: p.sets })));
    } else if (type === 'hiit') {
      for (let i = 0; stations.length < count && i < HIIT_ORDER.length * 2; i++) {
        const ex = pickFor(HIIT_ORDER[i % HIIT_ORDER.length], pool, used, rest);
        if (ex) { used.add(ex.id); stations.push({ exId: ex.id }); }
      }
    } else if (type === 'balance') {
      // Balansövningarna först, sedan de andra.
      const shuffled = [...pool].sort(() => Math.random() - 0.5).sort((a, b) => !!b.balance - !!a.balance);
      stations = shuffled.slice(0, count).map((e) => ({ exId: e.id }));
    } else {
      const cardio = pool.filter((e) => primary(e) === 'cardio').sort(() => Math.random() - 0.5);
      stations = cardio.slice(0, count).map((e) => ({ exId: e.id }));
    }
  }

  // Gym + kondition: börja med cykel om den finns
  if (type === 'cardio' && place === 'gym' && isAvailable(BY_ID.bike, place, opts)) bikeSec = Math.round(minutes * 0.4) * 60;

  // Uppvärmning före cirkel och HIIT. Konditionspass börjar lugnt och behöver ingen egen uppvärmning.
  let warmup = null;
  if (type !== 'cardio') {
    const useBike = place === 'gym' && isAvailable(BY_ID.bike, place, opts);
    warmup = { exId: useBike ? 'bike' : 'march', sec: place === 'gym' ? 180 : minutes <= 10 ? 90 : 120 };
  }
  // Fysio först bara i HIIT. Cirkeln har fysio som stationer, kondition och balans hoppar över fysio.
  const plan = { type, stations, physio: type === 'hiit' ? physio : [], rounds: 1, bikeSec, warmup };
  const fit = () => {
    // Flest varv som ryms i passlängden (lite marginal).
    plan.rounds = plan.stations.length ? 1 : 0;
    for (let r = 2; plan.stations.length && r <= 8; r++) {
      if (estimateSec(expandSteps({ ...plan, rounds: r })) > minutes * 60 + 60) break;
      plan.rounds = r;
    }
  };
  fit();
  // Cirkel med fysio: hellre färre vanliga stationer än för få fysioset.
  const physioSets = Math.max(0, ...plan.stations.filter((x) => x.physio).map((x) => x.sets ?? 3));
  while (!given && plan.rounds < physioSets && plan.stations.filter((x) => !x.physio).length > 2) {
    const last = plan.stations.map((x) => !x.physio).lastIndexOf(true);
    plan.stations.splice(last, 1);
    fit();
  }
  return plan;
}

/** Arbetstid för en station. Vissa övningar orkar man inte lika länge. */
export function workFor(type, exId) {
  const ex = BY_ID[exId];
  const base = TIMING[type].work;
  if (type === 'cardio' && ['mountain-climber', 'battle-ropes', 'jumping-jack'].includes(exId)) return 45;
  if (ex.timed && ex.id === 'plank') return Math.min(base, 40);
  return base;
}

/** Gör om passet till en lista med steg för timern. */
export function expandSteps(plan) {
  const t = TIMING[plan.type];
  const steps = [];
  const work = (exId, extra) => {
    const ex = BY_ID[exId];
    const reps = extra.physio && !ex.timed;
    steps.push({ kind: 'work', exId, mode: reps ? 'reps' : 'time', sec: reps ? 0 : extra.sec ?? workFor(plan.type, exId), repsText: ex.reps, ...extra });
  };
  const pause = (sec, label) => { if (sec > 0) steps.push({ kind: 'rest', sec, label }); };

  if (plan.warmup) {
    work(plan.warmup.exId, { label: 'Uppvärmning i lugnt tempo', sec: plan.warmup.sec, warmup: true });
    pause(15, 'Gör dig redo');
  }

  // Fysio först (HIIT och kondition): set för set, övningarna växlar.
  const maxSets = Math.max(0, ...plan.physio.map((p) => p.sets));
  for (let s = 1; s <= maxSets; s++) {
    for (const p of plan.physio) {
      if (s > p.sets) continue;
      const ex = BY_ID[p.exId];
      work(p.exId, { physio: true, label: `Fysio · set ${s} av ${p.sets}`, sec: ex.timed ? ex.defaultReps : undefined });
      pause(PHYSIO_REST, 'Vila');
    }
  }
  if (plan.physio.length) { steps.pop(); pause(45, 'Vila innan intervallerna'); }

  if (plan.bikeSec) {
    work('bike', { label: 'Jämnt tempo på cykeln', sec: plan.bikeSec });
    pause(60, 'Vila');
  }

  for (let r = 1; r <= plan.rounds; r++) {
    // Fysioövningar bara så många varv som antalet set (t.ex. 3 × 8).
    const these = plan.stations.filter((s) => !s.physio || r <= (s.sets ?? 3));
    these.forEach((s, i) => {
      const sides = plan.type === 'balance' && BY_ID[s.exId].bothSides ? ' · byt sida halvvägs' : '';
      work(s.exId, { physio: !!s.physio, label: `Varv ${r} av ${plan.rounds}${sides}`, round: r });
      if (i < these.length - 1) pause(t.rest, plan.type === 'circuit' ? 'Byt station' : 'Vila');
    });
    if (r < plan.rounds) pause(t.roundRest, `Vila innan varv ${r + 1}`);
  }
  while (steps.length && steps[steps.length - 1].kind === 'rest') steps.pop();
  return steps;
}

/** Uppskattad längd i minuter. */
const estimateSec = (steps) => steps.reduce((n, s) => n + (s.mode === 'reps' ? PHYSIO_SET_SEC : s.sec), 0);
export function estimateMinutes(steps) {
  return Math.max(1, Math.round(estimateSec(steps) / 60));
}

function clone(x) { return JSON.parse(JSON.stringify(x)); }
