// Kroppskarta: vilka muskler en övning eller ett pass tränar, framifrån och bakifrån.
import { EXERCISES, BY_ID } from './exercises.js';

/** Musklerna på kartan. group = muskelgruppen i övningsbiblioteket. */
export const BODY = {
  chest:      { name: 'Bröst',               group: 'chest' },
  delts:      { name: 'Axlar',               group: 'shoulders' },
  traps:      { name: 'Kappmuskel',          group: 'back' },
  'upper-back': { name: 'Övre rygg',         group: 'back' },
  lats:       { name: 'Breda ryggmuskeln',   group: 'back' },
  'lower-back': { name: 'Nedre rygg',        group: 'back' },
  biceps:     { name: 'Biceps',              group: 'arms' },
  triceps:    { name: 'Triceps',             group: 'arms' },
  forearms:   { name: 'Underarmar',          group: 'arms' },
  abs:        { name: 'Magmuskler',          group: 'core' },
  obliques:   { name: 'Sneda magmuskler',    group: 'core' },
  glutes:     { name: 'Rumpa',               group: 'legs' },
  abductors:  { name: 'Utsida höft',         group: 'legs' },
  adductors:  { name: 'Insida lår',          group: 'legs' },
  quads:      { name: 'Framsida lår',        group: 'legs' },
  hamstrings: { name: 'Baksida lår',         group: 'legs' },
  calves:     { name: 'Vader',               group: 'legs' },
};
export const BODY_IDS = Object.keys(BODY);

// Primära (p) och sekundära (s) muskler per övning.
const MAP = {
  squat:                   { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'lower-back', 'abs'] },
  'goblet-squat':          { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'abs', 'upper-back'] },
  'barbell-squat':         { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'lower-back', 'abs'] },
  lunge:                   { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'calves'] },
  'db-lunge':              { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'calves', 'forearms'] },
  'glute-bridge':          { p: ['glutes'], s: ['hamstrings', 'lower-back', 'abs'] },
  rdl:                     { p: ['hamstrings', 'glutes'], s: ['lower-back', 'upper-back', 'forearms'] },
  'straight-leg-raise':    { p: ['quads'], s: ['abs'] },
  'side-leg-raise':        { p: ['abductors'], s: ['glutes', 'obliques'] },
  'calf-raise':            { p: ['calves'], s: [] },
  'hip-thrust':            { p: ['glutes'], s: ['hamstrings', 'quads', 'abs'] },
  'leg-press':             { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'] },
  'leg-extension':         { p: ['quads'], s: [] },
  'leg-curl':              { p: ['hamstrings'], s: ['calves'] },
  'single-leg-extension':  { p: ['quads'], s: [] },
  'single-leg-curl':       { p: ['hamstrings'], s: ['calves'] },
  'single-leg-press':      { p: ['quads', 'glutes'], s: ['hamstrings', 'abductors'] },
  'single-leg-mini-squat': { p: ['quads', 'glutes'], s: ['abductors', 'calves'] },
  'wall-sit-high':         { p: ['quads'], s: ['glutes'] },
  deadlift:                { p: ['glutes', 'hamstrings', 'lower-back'], s: ['quads', 'traps', 'lats', 'upper-back', 'forearms'] },
  'db-row':                { p: ['lats', 'upper-back'], s: ['biceps', 'delts', 'forearms'] },
  'barbell-row':           { p: ['lats', 'upper-back'], s: ['biceps', 'delts', 'lower-back', 'forearms'] },
  'lat-pulldown':          { p: ['lats'], s: ['biceps', 'upper-back', 'delts', 'forearms'] },
  'seated-row':            { p: ['upper-back', 'lats'], s: ['biceps', 'delts', 'forearms'] },
  'chest-press-machine':   { p: ['chest'], s: ['triceps', 'delts'] },
  'triceps-pushdown':      { p: ['triceps'], s: [] },
  'pull-up':               { p: ['lats'], s: ['biceps', 'upper-back', 'forearms', 'abs'] },
  superman:                { p: ['lower-back'], s: ['glutes', 'upper-back'] },
  'bench-press':           { p: ['chest'], s: ['triceps', 'delts'] },
  'db-bench':              { p: ['chest'], s: ['triceps', 'delts'] },
  'push-up':               { p: ['chest'], s: ['triceps', 'delts', 'abs'] },
  'shoulder-press':        { p: ['delts'], s: ['triceps', 'traps'] },
  'barbell-press':         { p: ['delts'], s: ['triceps', 'traps', 'abs'] },
  'machine-shoulder-press': { p: ['delts'], s: ['triceps'] },
  'barbell-curl':          { p: ['biceps'], s: ['forearms'] },
  'bicep-curl':            { p: ['biceps'], s: ['forearms'] },
  'triceps-ext':           { p: ['triceps'], s: [] },
  plank:                   { p: ['abs'], s: ['obliques', 'delts', 'glutes'] },
  crunch:                  { p: ['abs'], s: ['obliques'] },
  'external-rotation':     { p: ['delts'], s: ['upper-back'] },
  'wall-angel':            { p: ['upper-back'], s: ['delts', 'traps'] },
  'bird-dog':              { p: ['lower-back', 'glutes'], s: ['abs', 'delts'] },
  'single-leg-stand':      { p: ['abductors', 'calves'], s: ['abs', 'obliques', 'quads'] },
  'tandem-stand':          { p: ['calves'], s: ['abductors', 'abs'] },
  'single-leg-rdl':        { p: ['hamstrings', 'glutes'], s: ['lower-back', 'abductors', 'calves'] },
  'leg-swing':             { p: ['abductors'], s: ['calves', 'abs', 'quads'] },
  'board-stand':           { p: ['calves', 'abductors'], s: ['abs', 'obliques', 'quads'] },
  'board-tilt':            { p: ['calves', 'abductors'], s: ['adductors', 'obliques', 'quads'] },
  'board-squat':           { p: ['quads', 'glutes'], s: ['calves', 'abductors', 'abs'] },
  'board-single-leg':      { p: ['abductors', 'calves'], s: ['quads', 'abs', 'obliques'] },
  'jumping-jack':          { p: [], s: ['calves', 'quads', 'delts'] },
  'mountain-climber':      { p: ['abs'], s: ['quads', 'delts'] },
  march:                   { p: [], s: ['quads', 'calves'] },
  'shadow-box':            { p: [], s: ['delts', 'abs', 'obliques'] },
  'battle-ropes':          { p: ['delts'], s: ['forearms', 'abs'] },
  'rowing-machine':        { p: ['quads', 'upper-back', 'lats'], s: ['glutes', 'hamstrings', 'biceps'] },
  bike:                    { p: ['quads'], s: ['glutes', 'hamstrings', 'calves'] },
};

// För egna övningar: musklerna i den valda muskelgruppen.
const FROM_GROUP = {
  legs: { p: ['quads', 'glutes', 'hamstrings'], s: ['calves'] },
  back: { p: ['lats', 'upper-back'], s: ['lower-back'] },
  chest: { p: ['chest'], s: ['triceps', 'delts'] },
  shoulders: { p: ['delts'], s: ['traps'] },
  arms: { p: ['biceps', 'triceps'], s: ['forearms'] },
  core: { p: ['abs'], s: ['obliques'] },
  cardio: { p: [], s: [] },
};

/** { p: [...], s: [...] } för en övning. */
export function musclesOf(ex) {
  if (!ex) return { p: [], s: [] };
  if (MAP[ex.id]) return MAP[ex.id];
  const p = new Set(); const s = new Set();
  ex.muscles.forEach((g, i) => (FROM_GROUP[g] ?? FROM_GROUP.cardio)[i === 0 ? 'p' : 's'].forEach((m) => (i === 0 ? p : s).add(m)));
  (FROM_GROUP[ex.muscles[0]]?.s ?? []).forEach((m) => s.add(m));
  return { p: [...p], s: [...s].filter((m) => !p.has(m)) };
}

/** Nivå per muskel för en övning: 2 = huvudmuskel, 1 = hjälper till. */
export function exerciseLevels(ex) {
  const { p, s } = musclesOf(ex);
  const out = {};
  for (const m of s) out[m] = 1;
  for (const m of p) out[m] = 2;
  return out;
}

/** Hur mycket varje muskel tränats: set som huvudmuskel räknas helt, som hjälpmuskel till hälften. Uppvärmning räknas inte. */
export function sessionLoad(entries) {
  const load = {};
  for (const e of entries) {
    if (e.warmup) continue;
    const n = e.sets ?? 0;
    if (!n) continue;
    const { p, s } = musclesOf(BY_ID[e.exId]);
    for (const m of p) load[m] = (load[m] || 0) + n;
    for (const m of s) load[m] = (load[m] || 0) + n / 2;
  }
  return load;
}

/** Gör om set till nivå 1–3 för färgen på kartan. */
export function loadLevels(load) {
  const out = {};
  for (const [m, v] of Object.entries(load)) out[m] = v >= 6 ? 3 : v >= 3 ? 2 : v > 0 ? 1 : 0;
  return out;
}

/** Övningar som tränar muskeln, huvudmuskel först. filter(ex) bestämmer vilka som får vara med. */
export function exercisesFor(muscle, filter = () => true) {
  const list = EXERCISES.filter(filter).map((ex) => {
    const { p, s } = musclesOf(ex);
    return { ex, primary: p.includes(muscle), hit: p.includes(muscle) || s.includes(muscle) };
  }).filter((x) => x.hit);
  return [...list.filter((x) => x.primary), ...list.filter((x) => !x.primary)];
}

// ---------------------------------------------------------------------------
// Ritning. Vänstra halvan ritas och speglas kring x = 50. Koordinater 0–100 × 0–220.
const SILHOUETTE = [
  'M50,33 L44,33 C42,36 38,37 33,38 C31,42 31,49 32,56 C33,72 35,88 36,100 C34,106 33,110 33,114 L50,117 Z',
  'M33,38 C26,38 21,44 21,54 C20,64 20,74 20,84 C18,96 16,108 15,120 C14,126 15,131 18,133 C21,134 23,131 23,127 L24,120 C26,108 28,96 29,86 C30,76 31,66 32,56 Z',
  'M33,114 C32,128 34,144 36,160 C36,176 37,190 38,204 C37,208 36,211 38,213 L46,213 C47,210 47,207 47,204 C47,190 48,176 48,162 C48,148 49,132 50,117 Z',
];
const HEAD = '<ellipse cx="50" cy="16" rx="9" ry="11"/><rect x="45" y="25" width="10" height="9" rx="2"/>';

const FRONT = {
  delts: 'M33,39 C27,39 22.5,44 22.5,52 L30.5,56 C31,49 33,44 37,41 Z',
  chest: 'M37.5,41.5 C42,40 47,40.5 49,42 L49,59 C44,62.5 37.5,62 33.5,57.5 C32.5,51 34,45 37.5,41.5 Z',
  biceps: 'M22.5,55 L30.5,58 C30.5,66 29.5,74 28.5,82 L21,82 C20.5,72 21,62 22.5,55 Z',
  forearms: 'M20.8,86 L28.3,86 C27,98 25,108 23.4,118 L16.6,118 C17.3,106 18.8,96 20.8,86 Z',
  abs: 'M42,64 L49,64 L49,108 L42.5,106 C41.5,92 41,78 42,64 Z',
  obliques: 'M33.8,61 C36.5,63 38.5,64 40.5,65 C39.6,79 40,93 41,105.5 L36.3,103 C35.5,90 34.5,75 33.8,61 Z',
  abductors: 'M33.4,115 C34.6,114 35.6,115 36.2,117 C35.6,127 35.7,137 36.6,147 C34.6,141 33.2,128 33.4,115 Z',
  quads: 'M37,116.5 C40.5,116 43.5,117 45,118.5 C45,131 46.5,146 47.5,156 C45,159 40.5,159.5 38.5,156.5 C37,143 36.5,129 37,116.5 Z',
  adductors: 'M46,119 L49.6,119.5 C49.2,128 48.8,136 48.4,143 C47,136 46.2,127 46,119 Z',
  calves: 'M37.2,165 C39.5,166 41,172 41.5,182 C41.5,188 41,193 40.2,197 L38.6,197 C37.4,186 36.8,175 37.2,165 Z',
};
const BACK = {
  traps: 'M44,31 L49.5,30 L49.5,62 C46.5,54 42,47 35,40 C39,38.5 42.5,35.5 44,31 Z',
  delts: FRONT.delts,
  'upper-back': 'M37,42.5 C41,46 45,52 48,60.5 L42,63 C38.8,58 35.8,52.5 33.6,47 C34.2,45.3 35.4,43.6 37,42.5 Z',
  lats: 'M33.3,50 C35.8,57 39.5,63 47,66 L46.5,83 C43,88.5 39.6,92.5 36.4,96.5 C34.8,81 33.6,65 33.3,50 Z',
  'lower-back': 'M41.5,87 L49.5,84.5 L49.5,107 L42.5,107.5 C41.6,100 41.2,93 41.5,87 Z',
  triceps: FRONT.biceps,
  forearms: FRONT.forearms,
  glutes: 'M35,108.5 C40,106.5 46,108 49.5,112 L49.5,133 C44.5,137.5 38.5,136 35.3,130 C33.6,122 33.6,114 35,108.5 Z',
  hamstrings: 'M35.6,137 C39.5,139 45.5,139 49,137 L48.2,157 C45.5,160.5 40.5,160.5 37.4,157.5 C36,150 35.5,143 35.6,137 Z',
  calves: 'M37.8,166 C42,163.5 46.2,164.5 47.8,168 C47.8,180 46.2,190 44.4,198 L41,198 C38.6,190 37.4,178 37.8,166 Z',
};

const mirror = 'transform="translate(100,0) scale(-1,1)"';

function half(regions, levels, interactive) {
  return Object.entries(regions).map(([m, d]) => {
    const lvl = levels[m] || 0;
    const attrs = interactive ? ` data-action="body-muscle" data-muscle="${m}"` : '';
    return `<path d="${d}" class="bm-m bm-l${lvl}"${attrs}><title>${BODY[m].name}</title></path>`;
  }).join('');
}

function figure(regions, levels, interactive, dx, label) {
  const muscles = half(regions, levels, interactive);
  const base = SILHOUETTE.map((d) => `<path d="${d}"/>`).join('');
  return `<g transform="translate(${dx},0)">
    <g class="bm-base">${HEAD}${base}<g ${mirror}>${base}</g></g>
    <g>${muscles}</g><g ${mirror}>${muscles}</g>
    <text x="50" y="228" class="bm-label">${label}</text></g>`;
}

/**
 * Kroppen framifrån och bakifrån som SVG-sträng.
 * levels: { muskel: 0–3 }. interactive: musklerna går att trycka på (data-action="body-muscle").
 */
export function bodyMap(levels = {}, { interactive = false, label = 'Muskler som tränas' } = {}) {
  return `<svg class="body-map${interactive ? ' interactive' : ''}" viewBox="-2 0 214 234" role="img" aria-label="${label}">
    ${figure(FRONT, levels, interactive, 0, 'Framifrån')}${figure(BACK, levels, interactive, 110, 'Bakifrån')}
  </svg>`;
}
