// All data sparas lokalt i webbläsaren på telefonen (localStorage).
const KEY = 'minpt-data-v1';

const defaults = () => ({
  sessions: [],  // { id, place, type?, date, endDate (bara intervallpass), entries: [{ exId, sets: [{ reps, weight }] }] }
  walks: [],     // { id, date, minutes, km }
  swims: [],     // { id, date, minutes, meters, style }
  cardio: [],    // löpning, cykling m.m.: { id, date, kind: 'run' | 'bike' | 'ski' | 'other', minutes, km, name }
  steps: {},     // { 'ÅÅÅÅ-MM-DD': antal }
  favorites: { gym: [...DEFAULT_FAVORITES.gym], home: [...DEFAULT_FAVORITES.home] }, // favoritövningar per plats, i den ordning de markerades
  customExercises: [], // egna övningar: { id, name, muscles: [grupp], gear, timed }
  settings: { hasDumbbells: false, restSeconds: 90, stepGoal: 8000, kneeFriendly: true },
  active: null,  // pågående pass, sparas så att det överlever om appen stängs
});

// Fysioövningarna är favoriter från början (SPEC.md F6.4).
const DEFAULT_FAVORITES = {
  gym: ['single-leg-extension', 'single-leg-curl', 'single-leg-press'],
  home: ['single-leg-mini-squat', 'wall-sit-high'],
};
// Fält och inställningar från planeringen, som inte finns längre.
const OLD_SETTINGS = ['physioAlways', 'seeded', 'priority', 'weekDays', 'weekKinds'];
const OLD_PHYSIO = { gym: 'fysio-gym', home: 'fysio-hemma' };

/** Favoriter: sparade, annars övningarna i de gamla fysiopassen, annars standard (SPEC.md D1). */
function favoritesOf(raw) {
  const fav = raw.favorites;
  const out = {};
  for (const place of ['gym', 'home']) {
    if (fav && Array.isArray(fav[place])) { out[place] = fav[place].filter((id) => typeof id === 'string'); continue; }
    const old = Array.isArray(raw.saved) ? raw.saved.find((x) => x && x.id === OLD_PHYSIO[place]) : null;
    out[place] = old && Array.isArray(old.items) ? [...new Set(old.items.map((it) => it?.exId).filter((id) => typeof id === 'string'))]
      : [...DEFAULT_FAVORITES[place]];
  }
  return out;
}

function normalize(raw) {
  const base = defaults();
  if (!raw || typeof raw !== 'object') return base;
  return {
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    walks: Array.isArray(raw.walks) ? raw.walks : [],
    swims: Array.isArray(raw.swims) ? raw.swims : [],
    cardio: Array.isArray(raw.cardio) ? raw.cardio.filter((c) => c && c.kind && c.date) : [],
    steps: raw.steps && typeof raw.steps === 'object' && !Array.isArray(raw.steps) ? raw.steps : {},
    favorites: favoritesOf(raw),
    customExercises: Array.isArray(raw.customExercises) ? raw.customExercises.filter((c) => c && c.id && c.name) : [],
    settings: withoutOld(withBoard({ ...base.settings, ...(raw.settings || {}) })),
    active: raw.active && (Array.isArray(raw.active.items) || Array.isArray(raw.active.steps)) ? raw.active : null,
  };
}

function withoutOld(settings) {
  const out = { ...settings };
  for (const k of OLD_SETTINGS) delete out[k];
  return out;
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
