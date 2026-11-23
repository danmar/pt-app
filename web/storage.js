// All data sparas lokalt i webbläsaren på telefonen (localStorage).
const KEY = 'minpt-data-v1';

const defaults = () => ({
  sessions: [],  // { id, place, date, endDate, entries: [{ exId, sets: [{ reps, weight }] }] }
  walks: [],     // { id, date, minutes, km }
  swims: [],     // { id, date, minutes, meters, style }
  steps: {},     // { 'ÅÅÅÅ-MM-DD': antal }
  saved: [],     // sparade pass: { id, name, place, items, minutes }
  week: ['', '', '', '', '', '', ''], // veckoplan, måndag först: '', rest, gym, home, swim, walk eller saved:<id>
  weekFocus: [[], [], [], [], [], [], []], // föreslagna muskelgrupper per veckodag (från veckoförslaget)
  settings: { hasDumbbells: false, restSeconds: 90, stepGoal: 8000, kneeFriendly: true, physioAlways: true, seeded: [] },
  active: null,  // pågående pass, sparas så att det överlever om appen stängs
});

function normalize(raw) {
  const base = defaults();
  if (!raw || typeof raw !== 'object') return base;
  return {
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    walks: Array.isArray(raw.walks) ? raw.walks : [],
    swims: Array.isArray(raw.swims) ? raw.swims : [],
    steps: raw.steps && typeof raw.steps === 'object' && !Array.isArray(raw.steps) ? raw.steps : {},
    saved: Array.isArray(raw.saved) ? raw.saved : [],
    week: Array.isArray(raw.week) && raw.week.length === 7 ? raw.week.map((v) => (typeof v === 'string' ? v : '')) : base.week,
    weekFocus: Array.isArray(raw.weekFocus) && raw.weekFocus.length === 7 ? raw.weekFocus.map((v) => (Array.isArray(v) ? v : [])) : base.weekFocus,
    settings: { ...base.settings, ...(raw.settings || {}) },
    active: raw.active && (Array.isArray(raw.active.items) || Array.isArray(raw.active.steps)) ? raw.active : null,
  };
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
