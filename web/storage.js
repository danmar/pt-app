// All data sparas lokalt i webbläsaren på telefonen (localStorage).
const KEY = 'minpt-data-v1';

const defaults = () => ({
  sessions: [],  // { id, place, type?, date, endDate (bara intervallpass), entries: [{ exId, sets: [{ reps, weight }] }] }
  walks: [],     // { id, date, minutes, km }
  swims: [],     // { id, date, minutes, meters, style }
  cardio: [],    // löpning, cykling m.m.: { id, date, kind: 'run' | 'bike' | 'ski' | 'other', minutes, km, name }
  steps: {},     // { 'ÅÅÅÅ-MM-DD': antal }
  saved: [],     // sparade pass: { id, name, place, items, minutes }
  week: ['', '', '', '', '', '', ''], // dagar du själv lagt in, måndag först: '' (appen föreslår), rest, gym, home, swim, walk eller saved:<id>
  customExercises: [], // egna övningar: { id, name, muscles: [grupp], gear, timed }
  goals: [],     // { id, exId, metric: 'reps' | 'weight' | 'sec', target, created, achieved }
  settings: { hasDumbbells: false, restSeconds: 90, stepGoal: 8000, kneeFriendly: true, physioAlways: true, seeded: [] },
  active: null,  // pågående pass, sparas så att det överlever om appen stängs
});

// Förr lades hela veckoförslaget in i veckoplanen. Nu föreslås dagarna direkt, så en sådan
// vecka töms en gång så att förslagen syns och kan anpassas efter det du lägger in själv.
const oldProposal = (raw) => Array.isArray(raw.weekFocus) && raw.weekFocus.some((v) => Array.isArray(v) && v.length);

function normalize(raw) {
  const base = defaults();
  if (!raw || typeof raw !== 'object') return base;
  return {
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    walks: Array.isArray(raw.walks) ? raw.walks : [],
    swims: Array.isArray(raw.swims) ? raw.swims : [],
    cardio: Array.isArray(raw.cardio) ? raw.cardio.filter((c) => c && c.kind && c.date) : [],
    steps: raw.steps && typeof raw.steps === 'object' && !Array.isArray(raw.steps) ? raw.steps : {},
    saved: Array.isArray(raw.saved) ? raw.saved : [],
    week: oldProposal(raw) ? base.week : Array.isArray(raw.week) && raw.week.length === 7 ? raw.week.map((v) => (typeof v === 'string' ? v : '')) : base.week,
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    customExercises: Array.isArray(raw.customExercises) ? raw.customExercises.filter((c) => c && c.id && c.name) : [],
    settings: withBoard({ ...base.settings, ...(raw.settings || {}) }),
    active: raw.active && (Array.isArray(raw.active.items) || Array.isArray(raw.active.steps)) ? raw.active : null,
  };
}

// Utrustning som kom till senare: lägg till den en gång i ett redan sparat utrustningsval för gymmet.
const LATER_GEAR = [['boardAdded', 'board'], ['ballBandAdded', 'ball'], ['ballBandAdded', 'band']];
function withBoard(settings) {
  const out = { ...settings };
  for (const [flag, g] of LATER_GEAR) {
    if (settings[flag]) continue;
    const gym = out.gear?.gym;
    if (Array.isArray(gym) && !gym.includes(g)) out.gear = { ...out.gear, gym: [...gym, g] };
  }
  for (const [flag] of LATER_GEAR) out[flag] = true;
  return out;
}

function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaults();
  }
}

export const data = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* privat läge eller fullt – appen fungerar ändå under sessionen */
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportJSON() {
  const { active, ...rest } = data;
  return JSON.stringify({ app: 'minpt', version: 1, exportedAt: new Date().toISOString(), ...rest }, null, 2);
}

export function importJSON(text) {
  const parsed = normalize(JSON.parse(text));
  const { active, ...rest } = parsed;
  Object.assign(data, rest);
  save();
}

export function resetAll() {
  Object.assign(data, defaults());
  save();
}

// Be webbläsaren att inte rensa datan automatiskt.
navigator.storage?.persist?.().catch(() => {});
