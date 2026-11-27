import { EXERCISES, BY_ID, MUSCLES, MUSCLE_IDS, EQUIPMENT, GEAR, GEAR_IDS, isAvailable, painOk, addCustomExercise, matchesQuery } from './exercises.js';
import { mountFigures } from './figure.js';
import { LENGTHS, replacement, lastWeights, daysBetween, suggestNext, volumeByGroup } from './planner.js';
import { TYPES, LENGTH_OPTIONS, TIMING, buildInterval, expandSteps, estimateMinutes, workFor, balanceSwap, buildStretch, stretchSteps, PICK_TYPES, pickFilter, suggestStretch } from './workouts.js';
import { data, save, uid, exportJSON, importJSON, resetAll } from './storage.js';
import { SWIM_STYLES, SWIM_FOCUS, suggestSwim } from './swim.js';
import { GUIDE, QUICK_TIPS } from './safety.js';
import { workoutFeedback, cardioFeedback, balanceFeedback } from './feedback.js';
import { columns, hbars, line, table } from './charts.js';
import { AREAS, AREA_IDS, LEVELS, REHAB, ADVICE, painAreasFor } from './physio.js';
import { ACTS, CARDIO_IDS, CARDIO_FOCUS, suggestCardio, cardioAdvice } from './cardio.js';
import { BODY, bodyMap, exerciseLevels, sessionLoad, loadLevels, exercisesFor, musclesOf } from './body.js';

// ---------------------------------------------------------------------------
// Tillstånd för gränssnittet (sparas inte)
const ui = {
  tab: 'start',
  back: 'start', // vart tillbaka-knappen i Gym/Hemma/Simma leder
  plans: { gym: null, home: null, swim: null },
  minutes: { gym: 40, home: 15, swim: 40 },
  type: { gym: 'strength', home: 'strength' }, // passtyp per plats
  iplans: { gym: null, home: null }, // cirkel-, HIIT-, konditions- och balanspass
  focus: { gym: '', home: '', swim: 'endurance' },
  swimStyle: 'mixed',
  swimStart: null,
  actBack: 'start', // vart tillbaka-knappen på Kondition leder
  cardio: { kind: 'run', minutes: 30, focus: 'easy', plan: null, start: null }, // löpning, cykling m.m.
};

// Vyer man når från startsidan eller Planera (har en tillbaka-knapp).
const SUB = new Set(['gym', 'home', 'swim', 'physio', 'activity', 'cardio']);

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtNum = (n, max = 1) => Number(n).toLocaleString('sv-SE', { maximumFractionDigits: max });
const muscleNames = (ex) => ex.muscles.map((m) => MUSCLES[m].name).join(' · ');
const byOrder = (a, b) => MUSCLES[a].order - MUSCLES[b].order;

/** Lokalt datum som 'ÅÅÅÅ-MM-DD' (toISOString ger UTC och blir fel runt midnatt). */
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const lastDays = (n) => [...Array(n)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d; });
const shortDay = (d) => d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '');
const weekIndex = (d = new Date()) => (d.getDay() + 6) % 7; // måndag = 0
const PLACE_NAME = { gym: 'Gym', home: 'Hemma', swim: 'Simma' };
const parseDate = (key) => (key === dayKey(new Date()) ? new Date() : new Date(`${key}T12:00:00`));

const ICON = {
  swap: '<svg viewBox="0 0 24 24"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>',
  remove: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chevronL: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  chevronR: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg>',
  play: '<svg viewBox="0 0 24 24" class="fill"><path d="M8 5v14l11-7z"/></svg>',
  walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M12 15l-1-5 4 1 2 3M11 10l-3 2-1 3"/></svg>',
  gym: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>',
  swim: '<svg viewBox="0 0 24 24"><circle cx="16.5" cy="6" r="2"/><path d="M4.5 12.5l5-3.5 3.5 2.5 2.5-1.5M2 16.5c1.7 0 2.3-1.3 4-1.3s2.3 1.3 4 1.3 2.3-1.3 4-1.3 2.3 1.3 4 1.3 2.3-1.3 4-1.3M2 20.5c1.7 0 2.3-1.3 4-1.3s2.3 1.3 4 1.3 2.3-1.3 4-1.3 2.3 1.3 4 1.3 2.3-1.3 4-1.3"/></svg>',
  steps: '<svg viewBox="0 0 24 24"><path d="M8 3c1.6 0 2.5 2 2.5 4.5S9.6 12 8 12 5.5 10 5.5 7.5 6.4 3 8 3zM6 14.5h4V17a2 2 0 0 1-4 0zM16 7c1.6 0 2.5 2 2.5 4.5S17.6 16 16 16s-2.5-2-2.5-4.5S14.4 7 16 7zM14 18.5h4V20a2 2 0 0 1-4 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  pulse: '<svg viewBox="0 0 24 24"><path d="M3 12.5h4l2.2-5.5 4.3 11 2.3-5.5H21"/></svg>',
  run: '<svg viewBox="0 0 24 24"><circle cx="15" cy="4.5" r="1.9"/><path d="M6 20.5l3.5-4.5 3 2 1 3.5M9.5 16l2-6.5 4 2.5 3 1M11.5 9.5l-3.5 1-2 3"/></svg>',
  bike: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16l4-7.5h6l3 7.5M9.5 8.5l3.5 7.5H5.5M13.5 5.5h3"/></svg>',
  ski: '<svg viewBox="0 0 24 24"><circle cx="14" cy="4.5" r="1.9"/><path d="M2.5 19.5l19-4M8 17.5l2.5-5.5 3 1.5 1.5 3M10.5 12l2-4.5 3.5 2.5M6.5 13l3-3.5M17 10l-1 6"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>',
};
const PLACE_ICON = { gym: ICON.gym, home: ICON.home, swim: ICON.swim, walk: ICON.walk, run: ICON.run, bike: ICON.bike, ski: ICON.ski, other: ICON.star };

// ---------------------------------------------------------------------------
// Rendering
function render() {
  applyTheme(); // även efter import eller radering av data
  const view = $('#view');
  const views = { start: startView, log: logView, stats: statsView, settings: settingsView, swim: swimView, physio: physioView, activity: activityView, cardio: cardioView };
  view.innerHTML = views[ui.tab] ? views[ui.tab]() : planView(ui.tab);
  const current = !SUB.has(ui.tab) ? ui.tab : ui.tab === 'activity' || ui.back === 'activity' ? ui.actBack : ui.back;
  for (const b of document.querySelectorAll('.tabbar button')) {
    b.classList.toggle('active', b.dataset.tab === current);
    b.setAttribute('aria-current', b.dataset.tab === current ? 'page' : 'false');
  }
  mountFigures(view);
}

// Varje sida består av block som ritas i den ordning de står (se SPEC.md 3.1).
/** list: { blocknamn: () => html } */
const blocks = (list) => Object.values(list).map((f) => f()).join('');

const BACK_NAME = { start: 'Idag', log: 'Logg', settings: 'Inställningar', activity: 'Kondition' };
const backButton = () => `<button class="back" data-action="tab" data-tab="${ui.back}">${ICON.chevronL}${BACK_NAME[ui.back] ?? 'Idag'}</button>`;

/** Platsens favoritövningar, i den ordning de markerades (SPEC.md 5.6). */
const favoritesFor = (place) => (data.favorites[place] ?? []).filter((id) => BY_ID[id]).map((exId) => ({ exId, sets: BY_ID[exId].sets }));
const isFavorite = (place, exId) => (data.favorites[place] ?? []).includes(exId);
const FAV_TEXT = { gym: 'Favorit på gym', home: 'Favorit hemma' };
/** Stjärna för platsen, eller en för varje plats utanför Gym, Hemma och passet. */
const favoriteButtons = (ex, place) => `<div class="fav-row">${(place ? [place] : ['gym', 'home']).map((pl) =>
  `<button class="toggle small fav-toggle" data-action="fav" data-place="${pl}" data-id="${ex.id}" aria-pressed="${isFavorite(pl, ex.id)}">${ICON.star} ${FAV_TEXT[pl]}</button>`).join('')}</div>`;

function regenerate(place) {
  if (place !== 'swim' && ui.type[place] !== 'strength') {
    ui.iplans[place] = buildInterval({
      type: ui.type[place], place, minutes: ui.minutes[place], sessions: data.sessions, opts: exOpts(place), physio: favoritesFor(place),
    });
    return;
  }
  if (place === 'swim') {
    ui.plans.swim = suggestSwim({ minutes: ui.minutes.swim, style: ui.swimStyle, focus: ui.focus.swim });
    ui.swimStart = null;
    return;
  }
  // Styrka: inget färdigt program. Favoriterna läggs först i kön, resten föreslås under passet.
  ui.plans[place] = favoritesFor(place);
}

// ---- Idag (startsida) -----------------------------------------------------
function startView() {
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 10 ? 'God morgon' : hour < 18 ? 'Hej' : 'God kväll';
  return blocks({
    rubrik: () => `
    <header class="page-head">
      <p class="eyebrow">${fmtDate(now)}</p>
      <h1>${hello}!</h1>
      <p class="sub">Vad vill du göra idag?</p>
    </header>`,
    val: () => `
    <div class="choices">
      ${choice('gym', 'Gym', 'Passförslag med maskiner och vikter', ICON.gym)}
      ${choice('home', 'Hemma', 'Korta cirkelpass och intervaller', ICON.home)}
      ${choice('activity', 'Kondition', 'Simma, spring, cykla, gå', ICON.pulse)}
    </div>`,
    steg: stepsCard,
    fysio: physioCard,
  });
}

const choice = (tab, title, text, icon) => `
  <button class="choice ${tab}" data-action="tab" data-tab="${tab}">
    <span class="choice-icon">${icon}</span><b>${title}</b><small>${text}</small>
  </button>`;

function stepsCard() {
  const goal = data.settings.stepGoal;
  const days = lastDays(7).map((d) => ({ d, key: dayKey(d), n: data.steps[dayKey(d)] ?? null }));
  const today = days[6].n;
  const logged = days.filter((x) => x.n != null);
  const total = logged.reduce((s, x) => s + x.n, 0);
  const max = Math.max(goal * 1.15, ...days.map((x) => x.n || 0));
  const pct = today ? Math.min(100, Math.round((today / goal) * 100)) : 0;
  return `
    <section class="card steps-card">
      <div class="steps-head">
        <span class="steps-icon">${ICON.steps}</span>
        <span class="steps-now"><small>Steg idag</small><b>${today != null ? fmtNum(today, 0) : '–'}</b></span>
        <button class="btn primary small" data-action="steps-new" data-date="${days[6].key}">${today != null ? 'Ändra' : 'Lägg in'}</button>
      </div>
      <div class="meter" role="progressbar" aria-label="Dagens steg av målet" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
      <p class="steps-goal">${today != null ? `${pct} % av målet på ${fmtNum(goal, 0)} steg${today >= goal ? ' 🎉' : ''}` : `Ditt mål är ${fmtNum(goal, 0)} steg om dagen`}</p>
      <div class="mini-bars">
        ${days.map((x) => `
          <button class="mini-col ${x.n >= goal ? 'hit' : ''}" data-action="steps-new" data-date="${x.key}" aria-label="${fmtDate(x.d)}: ${x.n != null ? `${x.n} steg` : 'inga steg inlagda'}">
            <span class="mini-bar"><i style="height:${x.n ? Math.max(4, (x.n / max) * 100) : 0}%"></i><em style="bottom:${(goal / max) * 100}%"></em></span>
            <small>${shortDay(x.d)}</small>
          </button>`).join('')}
      </div>
      <div class="steps-foot"><span>Senaste 7 dagarna</span>
        <b>${logged.length ? `${fmtNum(total, 0)} steg · snitt ${fmtNum(Math.round(total / logged.length), 0)}/dag` : 'Inga steg inlagda än'}</b></div>
    </section>`;
}

// ---- Simma ----------------------------------------------------------------
function swimView() {
  if (!ui.plans.swim) regenerate('swim');
  const plan = ui.plans.swim;
  const total = plan.reduce((s, b) => s + b.meters, 0);
  return `
    ${backButton()}
    <header class="page-head">
      <h1>Simma</h1>
      <p class="sub">Ett pass för 25-metersbassäng</p>
    </header>

    <section class="card controls">
      <div class="segmented" role="radiogroup" aria-label="Passets längd">
        ${LENGTHS.map((l) => `<button role="radio" aria-checked="${ui.minutes.swim === l.minutes}" data-action="minutes" data-value="${l.minutes}">${l.minutes} min</button>`).join('')}
      </div>
      <label class="select-row"><span>Fokus</span>
        <select data-change="swim-focus">${Object.entries(SWIM_FOCUS).map(([k, v]) => `<option value="${k}" ${ui.focus.swim === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      </label>
      <label class="select-row"><span>Simsätt</span>
        <select data-change="swim-style">${Object.entries(SWIM_STYLES).map(([k, v]) => `<option value="${k}" ${ui.swimStyle === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      </label>
    </section>

    ${data.settings.kneeFriendly && ui.swimStyle === 'breast' ? '<p class="note warn">Bentagen i bröstsim kan belasta knäna. Crawl och ryggsim är oftast skonsammare, eller kör bröstsim med crawlbentag.</p>' : ''}
    <h2 class="section-title">Dagens simpass <span class="title-note">${fmtNum(total, 0)} m</span></h2>
    <p class="hint">Bocka av delarna medan du simmar.</p>
    <ul class="ex-list">
      ${plan.map((b, i) => `
        <li class="ex-item swim-item ${b.done ? 'done' : ''}">
          <span class="swim-badge">${ICON.swim}</span>
          <div class="ex-text"><strong>${esc(b.title)}</strong><span class="wrap">${esc(b.text)}</span><small>${fmtNum(b.meters, 0)} m</small></div>
          <button class="check" data-action="swim-toggle" data-index="${i}" aria-pressed="${b.done}" aria-label="${esc(b.title)} klar">${ICON.check}</button>
        </li>`).join('')}
    </ul>

    <div class="stack">
      <button class="btn primary big" data-action="swim-save">${ICON.check} Spara simpasset</button>
      <button class="btn secondary" data-action="regenerate">${ICON.refresh} Nytt förslag</button>
    </div>`;
}

// ---- Kondition: välj aktivitet ----------------------------------------------
const actName = (c) => (c.kind === 'other' && c.name ? c.name : ACTS[c.kind]?.name ?? 'Aktivitet');
const cardioMinutes = (from, to) => [...data.swims, ...data.cardio].filter((x) => new Date(x.date) >= from && new Date(x.date) < to)
  .reduce((n, x) => n + (Number(x.minutes) || 0), 0);

function activityView() {
  const knees = data.settings.pain?.knees || 0;
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const week = cardioMinutes(weekAgo, new Date(Date.now() + 60000)) + data.walks.filter((w) => new Date(w.date) >= weekAgo).reduce((n, w) => n + (Number(w.minutes) || 0), 0);
  const last = (kind) => {
    const list = kind === 'swim' ? data.swims : kind === 'walk' ? data.walks : data.cardio.filter((c) => c.kind === kind);
    const d = list.reduce((m, x) => (!m || new Date(x.date) > new Date(m) ? x.date : m), null);
    if (!d) return '';
    const n = daysBetween(d, new Date());
    return n === 0 ? 'Idag' : n === 1 ? 'Igår' : `${n} dagar sedan`;
  };
  return `
    <button class="back" data-action="tab" data-tab="${ui.actBack}">${ICON.chevronL}${BACK_NAME[ui.actBack] ?? 'Idag'}</button>
    <header class="page-head"><h1>Kondition</h1><p class="sub">Välj aktivitet</p></header>
    <p class="hint">Senaste 7 dagarna: ${week} minuter kondition och promenader. Sikta på minst 150 minuter i veckan.</p>
    ${knees ? `<p class="note">${knees >= 2 ? 'Knäna gör ont:' : 'Lite ont i knäna:'} cykling och simning är skonsammast. ${knees >= 2 ? 'Vänta med löpningen tills det känns bättre.' : 'Spring på mjukt underlag om du springer.'}</p>` : ''}
    <ul class="ex-list act-list">
      ${Object.entries(ACTS).map(([k, a]) => `
        <li><button class="act-item k-${k}" data-action="act" data-kind="${k}">
          <span class="act-icon">${PLACE_ICON[k]}</span>
          <span class="act-text"><b>${a.name}</b><small>${a.desc}${last(k) ? ` · senast ${last(k).toLowerCase()}` : ''}</small></span>
          ${knees >= 2 && a.knees >= 2 ? '<em class="pill warn-pill">Knän</em>' : ''}
          <span class="chev">${ICON.chevronR}</span>
        </button></li>`).join('')}
    </ul>`;
}

function regenerateCardio() {
  const c = ui.cardio;
  c.plan = suggestCardio({ kind: c.kind, minutes: c.minutes, focus: c.focus, pain: data.settings.pain });
  c.start = null;
}

function cardioView() {
  const c = ui.cardio;
  if (!c.plan) regenerateCardio();
  const a = ACTS[c.kind];
  const advice = cardioAdvice(c.kind, data.settings.pain);
  return `
    ${backButton()}
    <header class="page-head"><h1>${a.name}</h1><p class="sub">Ett pass på ${c.minutes} minuter</p></header>
    <section class="card controls">
      <div class="segmented four" role="radiogroup" aria-label="Passets längd">
        ${[20, 30, 45, 60].map((m) => `<button role="radio" aria-checked="${c.minutes === m}" data-action="c-min" data-value="${m}">${m} min</button>`).join('')}
      </div>
      <label class="select-row"><span>Fokus</span>
        <select data-change="c-focus">${Object.entries(CARDIO_FOCUS).map(([k, v]) => `<option value="${k}" ${c.focus === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      </label>
    </section>
    ${advice ? `<p class="note warn">${esc(advice)}</p>` : ''}
    <h2 class="section-title">Dagens pass</h2>
    <p class="hint">Bocka av delarna medan du kör.</p>
    <ul class="ex-list">
      ${c.plan.map((b, i) => `
        <li class="ex-item swim-item k-${c.kind} ${b.done ? 'done' : ''}">
          <span class="swim-badge">${PLACE_ICON[c.kind]}</span>
          <div class="ex-text"><strong>${esc(b.title)}</strong><span class="wrap">${esc(b.text)}</span><small>${b.minutes} min</small></div>
          <button class="check" data-action="c-toggle" data-index="${i}" aria-pressed="${b.done}" aria-label="${esc(b.title)} klar">${ICON.check}</button>
        </li>`).join('')}
    </ul>
    <div class="stack">
      <button class="btn primary big" data-action="c-save">${ICON.check} Spara passet</button>
      <button class="btn secondary" data-action="c-new">${ICON.refresh} Nytt förslag</button>
    </div>`;
}

/** Logga löpning, cykling m.m. kind = null ger ett val av aktivitet. */
function cardioSheet(kind, fromPlan) {
  const today = dayKey(new Date());
  const c = ui.cardio;
  const elapsed = fromPlan && c.start ? Math.round((Date.now() - c.start) / 60000) : 0;
  const minutes = elapsed >= 5 ? elapsed : fromPlan ? c.minutes : 30;
  return `
    <div class="sheet-head"><h2>${kind ? `Logga ${ACTS[kind].name.toLowerCase()}` : 'Logga aktivitet'}</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="cardio-form" class="form">
      <input type="hidden" name="fromPlan" value="${fromPlan ? 1 : ''}">
      ${kind ? `<input type="hidden" name="kind" value="${kind}">` : `
        <label>Aktivitet<select name="kind" data-change="c-kind-pick">${CARDIO_IDS.map((k) => `<option value="${k}">${ACTS[k].name}</option>`).join('')}</select></label>`}
      <label class="${!kind || kind === 'other' ? '' : 'hidden'}" id="c-name-row">Vad gjorde du? (valfritt)<input type="text" name="name" maxlength="30" autocomplete="off" placeholder="t.ex. padel, dans, vandring"></label>
      <label>Datum<input type="date" name="date" value="${today}" max="${today}" required></label>
      <label>Minuter<input type="number" name="minutes" inputmode="numeric" min="1" max="600" value="${minutes}" required></label>
      <label class="${!kind || ACTS[kind].km ? '' : 'hidden'}" id="c-km-row">Kilometer (valfritt)<input type="text" name="km" inputmode="decimal" autocomplete="off" placeholder="t.ex. 5"></label>
      <button class="btn primary big" type="submit">Spara</button>
    </form>`;
}

function cardioDetailSheet(c) {
  const pace = c.km && c.minutes && c.kind !== 'bike' ? (() => { const sec = Math.round((c.minutes * 60) / c.km); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min/km`; })()
    : c.km && c.minutes ? `${fmtNum(c.km / (c.minutes / 60))} km/h` : '';
  return `
    <div class="sheet-head"><h2>${esc(actName(c))}</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <div class="card list">
      <div class="list-row"><span>Datum</span><b>${fmtDate(c.date)}</b></div>
      <div class="list-row"><span>Tid</span><b>${fmtNum(c.minutes, 0)} min</b></div>
      ${c.km ? `<div class="list-row"><span>Distans</span><b>${fmtNum(c.km)} km</b></div>` : ''}
      ${pace ? `<div class="list-row"><span>Tempo</span><b>${pace}</b></div>` : ''}
    </div>
    <button class="btn danger-outline" data-action="delete-cardio" data-id="${esc(c.id)}">Radera passet</button>`;
}

function cardioRow(c) {
  return `
    <li><button class="log-item" data-action="cardio" data-id="${esc(c.id)}">
      <span class="log-icon k-${c.kind}">${PLACE_ICON[c.kind] ?? ICON.pulse}</span>
      <span class="log-text"><strong>${fmtDate(c.date)}</strong>
        <small>${esc(actName(c))} · ${fmtNum(c.minutes, 0)} min${c.km ? ` · ${fmtNum(c.km)} km` : ''}</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button></li>`;
}

// ---- Gym / Hemma ----------------------------------------------------------
// Utrustning som bara visas i balanspasset.
const BALANCE_GEAR = ['board'];
// Utrustning i balanspasset.
const BALANCE_PASS_GEAR = ['body', 'board', 'ball'];
const exOpts = (place) => ({ pain: data.settings.pain, ...(place ? { gear: gearFor(place) } : {}) });
const painNames = (areas) => areas.map((a) => AREAS[a].the).join(' och ');
const painWarn = (ex) => {
  const areas = painAreasFor(ex, data.settings.pain);
  return areas.length ? `<em class="knee-warn">Belastar ${painNames(areas)}</em>` : '';
};

function resetPlans() {
  ui.plans = { gym: null, home: null, swim: null };
  ui.iplans = { gym: null, home: null };
}

function placeHeader(place) {
  return `
    ${backButton()}
    <header class="page-head">
      <h1>${place === 'gym' ? 'Gym' : 'Hemma'}</h1>
      <p class="sub">${place === 'gym' ? 'Ett pass för gymmet' : 'Korta pass hemma'}</p>
    </header>
    <section class="card controls">
      ${ui.type[place] === 'strength' ? '' : `
      <div class="field"><span class="field-label">Utrustning</span>
        ${chipToggles('gear', Object.entries(GEAR).filter(([k]) => (ui.type[place] === 'balance' ? BALANCE_PASS_GEAR.includes(k) : !BALANCE_GEAR.includes(k))), gearFor(place))}</div>
      <div class="segmented" role="radiogroup" aria-label="Passets längd">
        ${LENGTH_OPTIONS[place].map((m) => `<button role="radio" aria-checked="${ui.minutes[place] === m}" data-action="minutes" data-value="${m}">${m} min</button>`).join('')}
      </div>`}
    </section>
    <p class="hint">${ui.type[place] === 'strength' ? `När du trycker på Börja träna föreslår appen uppvärmning och sedan övning för övning, efter det du redan kört idag. Utrustning och muskelgrupper väljer du under passet.${place === 'gym' ? ' Passet avslutas med stretch.' : ''}` : TYPES[ui.type[place]].desc}</p>`;
}

function intervalView(place) {
  if (!ui.iplans[place]) regenerate(place);
  const plan = ui.iplans[place];
  const t = TIMING[plan.type];
  const steps = expandSteps(plan);
  const hasPhysio = plan.physio.length || plan.stations.some((s) => s.physio);
  const startLabel = { circuit: 'Starta cirkeln', hiit: 'Starta HIIT', cardio: 'Starta konditionspasset', balance: 'Starta balanspasset' }[plan.type];
  const item = (exId, text, actions = '') => {
    const ex = BY_ID[exId];
    return `
      <li class="ex-item" data-group="${ex.muscles[0]}">
        <button class="ex-main" data-action="detail" data-id="${ex.id}">
          <div class="fig thumb" data-ex="${ex.id}"></div>
          <div class="ex-text"><strong>${esc(ex.name)}</strong><span>${text}</span>
            <small>${ex.physio ? 'Fysio · ' : ''}${muscleNames(ex)}</small>
            ${painWarn(ex)}</div>
        </button>
        ${actions}
      </li>`;
  };
  return `
    ${placeHeader(place)}
    <section class="card summary">
      <b>${plan.stations.length ? `${plan.rounds} varv × ${plan.stations.length} ${plan.type === 'circuit' ? 'stationer' : 'övningar'}` : 'Inga övningar'}</b>
      <span>${t.work} s jobb · ${t.rest} s ${plan.type === 'circuit' ? 'byte' : 'vila'} · ${t.roundRest} s vila mellan varven</span>
      <span class="est">Ungefär ${estimateMinutes(steps)} minuter totalt</span>
    </section>
    ${hasPhysio ? `<p class="note">${ICON.star} Dina favoritövningar ingår i passet.</p>` : ''}
    <p class="hint">${plan.warmup ? `Passet börjar med ${Math.round(plan.warmup.sec / 60) || 1} min uppvärmning ${plan.warmup.exId === 'bike' ? 'på cykel' : 'på stället'}.` : 'Konditionspass behöver ingen separat uppvärmning. Börja lugnt och öka tempot.'}${plan.stretch?.length ? ' Passet avslutas med stretch.' : ''}</p>
    <details class="card station-details"><summary>Visa övningarna i passet</summary>
    ${plan.physio.length ? `<h3 class="group-title">Favoriter först</h3>
      <ul class="ex-list">${plan.physio.map((p) => item(p.exId, `${p.sets} set × ${BY_ID[p.exId].reps}`)).join('')}</ul>` : ''}
    ${plan.bikeSec ? `<h3 class="group-title">Först</h3><ul class="ex-list">${item('bike', `${Math.round(plan.bikeSec / 60)} min i jämnt tempo`)}</ul>` : ''}
    <h3 class="group-title">${plan.type === 'circuit' ? 'Stationer' : plan.type === 'balance' ? 'Övningar' : 'Intervaller'} <span class="title-note">varje varv</span></h3>
    <ol class="ex-list stations">
      ${plan.stations.map((st, i) => {
        const ex = BY_ID[st.exId];
        const text = st.physio && !ex.timed ? ex.reps : `${workFor(plan.type, st.exId)} s`;
        return item(st.exId, text, `<div class="ex-actions">
          ${st.physio ? '' : `<button class="icon-btn" data-action="iswap" data-index="${i}" aria-label="Byt ${esc(ex.name)}">${ICON.swap}</button>`}
          <button class="icon-btn" data-action="iremove" data-index="${i}" aria-label="Ta bort ${esc(ex.name)}">${ICON.remove}</button></div>`);
      }).join('')}
    </ol>
    ${plan.stretch?.length ? `<h3 class="group-title">Stretch <span class="title-note">sist</span></h3>
      <ul class="ex-list">${plan.stretch.map((id) => item(id, BY_ID[id].reps)).join('')}</ul>` : ''}
    </details>
    <div class="stack">
      <button class="btn primary big" data-action="start" ${plan.stations.length ? '' : 'disabled'}>${ICON.play} ${startLabel}</button>
      <div class="row">
        <button class="btn secondary" data-action="regenerate">${ICON.refresh} Nytt förslag</button>
        <button class="btn secondary" data-action="library">Alla övningar</button>
      </div>
    </div>`;
}

// ---- Fysio (inbyggd fysioterapeut) -------------------------------------------
const painAreas = () => AREA_IDS.filter((a) => (data.settings.pain[a] || 0) > 0);
const painSummary = () => painAreas().map((a) => `${AREAS[a].name} (${LEVELS[data.settings.pain[a]].name.toLowerCase()})`).join(', ');

function ensurePain() {
  if (data.settings.pain) return;
  data.settings.pain = { shoulders: 0, back: 0, knees: data.settings.kneeFriendly ? 1 : 0 };
  save();
}

/** Fysioövningar per kroppsdel där du har ont: [[område, [övningar]]]. */
function rehabSuggestions(place, exclude = [], per = 2) {
  const used = new Set(exclude);
  return painAreas().map((a) => {
    const list = REHAB[a].map((id) => BY_ID[id])
      .filter((ex) => ex && !used.has(ex.id) && painOk(ex, data.settings.pain) && (place === 'gym' || ex.equipment !== 'gym'))
      .slice(0, per);
    list.forEach((ex) => used.add(ex.id));
    return [a, list];
  }).filter(([, list]) => list.length);
}

function painSelector(areas = AREA_IDS) {
  const pain = data.settings.pain;
  return `<div class="pain-box" data-areas="${areas.join(',')}">${areas.map((a) => `
    <div class="pain-row"><b>${AREAS[a].name}</b>
      <div class="segmented" role="radiogroup" aria-label="Ont i ${AREAS[a].the}">
        ${LEVELS.map((l, i) => `<button role="radio" aria-checked="${(pain[a] || 0) === i}" data-action="pain" data-area="${a}" data-level="${i}">${l.name}</button>`).join('')}
      </div></div>`).join('')}
    <p class="hint">Lite ont: ${LEVELS[1].desc.toLowerCase()}. Ont: ${LEVELS[2].desc.toLowerCase()}.</p></div>`;
}

function painNote() {
  const sum = painSummary();
  return sum ? `<p class="note">${ICON.shield} <b>Fysio:</b> förslagen tar hänsyn till ${esc(sum.toLowerCase())}. <button class="inline-link" data-action="tab" data-tab="physio">Ändra</button></p>` : '';
}

function physioCard() {
  const sum = painSummary();
  const days = data.settings.painUpdated ? daysBetween(data.settings.painUpdated, new Date()) : null;
  const text = !sum ? 'Har du ont någonstans? Då anpassar jag träningen.'
    : `${sum}${days >= 7 ? ' · Hur känns det nu?' : ''}`;
  return `
    <button class="card guide-card physio-card" data-action="tab" data-tab="physio">
      <span class="today-icon">🩺</span>
      <span class="today-text"><b>Fysioterapeuten</b><small>${esc(text)}</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button>`;
}

function physioView() {
  const pain = data.settings.pain;
  const areas = painAreas();
  const exItem = (ex) => `
    <li class="ex-item" data-group="${ex.muscles[0]}"><button class="ex-main" data-action="detail" data-id="${ex.id}">
      <div class="fig thumb" data-ex="${ex.id}"></div>
      <div class="ex-text"><strong>${esc(ex.name)}</strong><span>${ex.sets} set × ${ex.reps}</span><small>${ex.equipment === 'gym' ? 'På gymmet' : 'Hemma eller på gymmet'}</small></div>
    </button></li>`;
  return `
    ${backButton()}
    <header class="page-head"><h1>Fysio</h1><p class="sub">Din inbyggda fysioterapeut</p></header>
    <section class="card">
      <h3 class="card-title">Har du ont någonstans?</h3>
      ${painSelector()}
    </section>
    ${areas.length ? '' : '<p class="note">Skönt! Säg till här om något börjar göra ont, så anpassar jag förslagen i gymmet och hemma.</p>'}
    ${areas.map((a) => {
      const adv = ADVICE[a];
      const rehab = REHAB[a].map((id) => BY_ID[id]).filter((ex) => ex && painOk(ex, pain));
      return `
      <h2 class="section-title">${AREAS[a].name} · ${LEVELS[pain[a]].name.toLowerCase()}</h2>
      <section class="card prose">
        <b>Det här hoppar jag över i förslagen</b>
        <ul>${adv.skips.slice(0, pain[a]).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <b>Råd</b>
        <ul>${adv.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </section>
      <h3 class="group-title">Övningar som brukar hjälpa</h3>
      <ul class="ex-list">${rehab.map(exItem).join('')}</ul>
      <section class="note warn"><b>Sök vård om:</b><ul>${adv.care.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
    }).join('')}
    ${areas.length ? `<div class="stack"><button class="btn primary big" data-action="rehab-start">${ICON.play} Kör ett kort fysiopass</button></div>` : ''}
    <p class="hint">Jag ger allmänna råd och anpassar förslagen, men ställer inga diagnoser och ersätter inte en riktig fysioterapeut eller läkare. Har du haft ont i mer än 2–3 veckor, eller blir det värre? Ring 1177 eller boka tid hos en fysioterapeut.</p>`;
}

function painSheet(ex) {
  const areas = painAreasFor(ex, Object.fromEntries(AREA_IDS.map((a) => [a, 1])));
  const order = [...areas, ...AREA_IDS.filter((a) => !areas.includes(a))];
  return `
    <div class="sheet-head"><h2>Gör det ont?</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <p class="note warn">Stoppa övningen om det gör mer ont än 3 av 10, eller om det blir värre för varje repetition. Skarp eller plötslig smärta: sluta direkt.</p>
    <p>Var gör det ont? Jag byter ut övningar som belastar det stället, nu och framöver.</p>
    ${painSelector(order)}
    <button class="btn primary big" data-action="pain-swap">Välj en annan övning</button>
    <button class="btn-text guide-link" data-action="close-sheet">Det går bra, fortsätt</button>`;
}

// ---- Fri styrketräning ------------------------------------------------------
const defaultGear = (place) => (place === 'gym' ? [...GEAR_IDS] : ['body']);
const gearFor = (place) => data.settings.gear?.[place] ?? defaultGear(place);
const groupsFor = (place) => data.settings.groups?.[place] ?? [];
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const isToday = (d) => dayKey(d) === dayKey(new Date());
const doneSets = (it) => it.sets.filter((x) => x.done).length;

function chipToggles(action, entries, selected) {
  return `<div class="toggles">${entries.map(([k, label]) =>
    `<button class="toggle" data-action="${action}" data-value="${k}" aria-pressed="${selected.includes(k)}">${label}</button>`).join('')}</div>`;
}
/** Val i passet: typ, muskelgrupper och utrustning (bland det som valts som tillgängligt). */
function pickControls(w) {
  const type = w.stype ?? 'strength';
  const avail = w.avail ?? GEAR_IDS;
  return `
      <div class="field"><span class="field-label">Typ</span>
        <div class="toggles">${Object.entries(PICK_TYPES).map(([k, name]) => `<button class="toggle" data-action="wtype" data-value="${k}" aria-pressed="${type === k}">${name}</button>`).join('')}</div></div>
      ${type === 'cardio' ? '' : `<div class="field"><span class="field-label">Muskelgrupper <small>${w.groups.length ? '' : 'inget valt = alla'}</small></span>
        ${chipToggles('wgroup', MUSCLE_IDS.filter((m) => m !== 'cardio').map((m) => [m, MUSCLES[m].name]), w.groups)}</div>`}
      ${type === 'stretch' ? '' : `<div class="field"><span class="field-label">Utrustning</span>
        ${chipToggles('wgear', avail.filter((k) => GEAR[k]).map((k) => [k, GEAR[k]]), w.gear)}</div>`}`;
}

/** 3–6 förslag efter vald typ, muskelgrupper och utrustning. Kompletterar det du redan kört idag. */
function pickSuggestions(w, done, exclude) {
  const type = w.stype ?? 'strength';
  const groups = w.groups.filter((m) => m !== 'cardio');
  if (type === 'stretch') return suggestStretch({ done, groups, pain: data.settings.pain, exclude, limit: 5 });
  if (!w.gear.length) return [];
  return suggestNext({ done, groups: type === 'cardio' ? ['cardio'] : groups, gear: w.gear, pain: data.settings.pain,
    exclude, sessions: data.sessions, limit: 5, filter: pickFilter(type) });
}

/** Det du kört idag: tidigare sparade pass + klara set i pågående pass, i tidsordning. */
function exercisesToday() {
  const done = [];
  // Uppvärmningen räknas inte som träning av muskelgrupperna.
  for (const s of data.sessions) if (isToday(s.date)) for (const e of s.entries) if (!e.warmup && !BY_ID[e.exId]?.stretch) done.push({ exId: e.exId, sets: e.sets.length });
  if (data.active?.items) for (const it of data.active.items) if (doneSets(it) && !it.warmup && !BY_ID[it.exId]?.stretch) done.push({ exId: it.exId, sets: doneSets(it) });
  return done;
}
function todaySummary(done) {
  const vol = volumeByGroup(done);
  const groups = MUSCLE_IDS.filter((m) => vol[m] >= 1);
  if (!groups.length) return '';
  return `<div class="chips left">${groups.map((m) => `<span class="chip g-${m}">${MUSCLES[m].name} ${fmtNum(vol[m], 0)} set</span>`).join('')}</div>`;
}

function planView(place) {
  if (ui.type[place] !== 'strength') return intervalView(place);
  if (!ui.plans[place]) regenerate(place);
  const queue = ui.plans[place];
  const gear = gearFor(place);
  return `
    ${backButton()}
    <header class="page-head"><h1>${PLACE_NAME[place]}</h1></header>
    <section class="card controls">
      <div class="field"><span class="field-label">Tillgänglig utrustning</span>
        ${chipToggles('gear', Object.entries(GEAR), gear)}</div>
    </section>
    ${gear.length ? '' : '<p class="note warn">Välj minst en typ av utrustning.</p>'}
    <div class="stack">
      <button class="btn primary big" data-action="start" ${gear.length ? '' : 'disabled'}>${ICON.play} Börja träna</button>
    </div>`;
}

function suggestionItem({ ex, reason }, actions, main = `data-action="detail" data-id="${ex.id}"`) {
  return `
    <li class="ex-item" data-group="${ex.muscles[0]}">
      <button class="ex-main" ${main}>
        <div class="fig thumb" data-ex="${ex.id}"></div>
        <div class="ex-text">
          <strong>${esc(ex.name)}</strong>
          <span>${esc(reason)}</span>
          <small>${GEAR[ex.gear]} · ${muscleNames(ex)}</small>
          ${painWarn(ex)}
        </div>
      </button>
      ${actions}
    </li>`;
}

function planItem(p, i) {
  const ex = BY_ID[p.exId];
  return `
    <li class="ex-item" data-group="${ex.muscles[0]}">
      <button class="ex-main" data-action="detail" data-id="${ex.id}">
        <div class="fig thumb" data-ex="${ex.id}"></div>
        <div class="ex-text">
          <strong>${esc(ex.name)}</strong>
          <span>${p.sets} set × ${ex.reps}</span>
          <small>${ex.physio ? 'Fysio · ' : ''}${muscleNames(ex)}</small>
          ${painWarn(ex)}
        </div>
      </button>
      <div class="ex-actions">
        <button class="icon-btn" data-action="remove" data-index="${i}" aria-label="Ta bort ${esc(ex.name)}">${ICON.remove}</button>
      </div>
    </li>`;
}

// ---- Grafer -----------------------------------------------------------------
const SERIES = [
  { key: 'train', name: 'Träning', cls: 's-train' },
  { key: 'swim', name: 'Kondition', cls: 's-swim' },
  { key: 'walk', name: 'Promenad', cls: 's-walk' },
];
const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - weekIndex(x)); return x; };
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  return Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
}
const chartCard = (title, sub, legend, body, tbl) => `
  <section class="card chart-card">
    <h3>${title}</h3>${sub ? `<p class="chart-sub">${sub}</p>` : ''}
    ${legend}
    <p class="readout" aria-live="polite">Tryck på diagrammet för att se värden</p>
    ${body}
    ${tbl}
  </section>`;
const legendHtml = () => `<div class="legend">${SERIES.map((x) => `<span><i class="sw ${x.cls}"></i>${x.name}</span>`).join('')}</div>`;

/** Bästa resultat per pass för en övning: vikt om övningen körs med vikt, annars reps eller sekunder. */
function exerciseSeries(exId) {
  const rows = data.sessions.filter((s) => s.entries.some((e) => e.exId === exId)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const weighted = rows.some((s) => s.entries.some((e) => e.exId === exId && e.sets.some((x) => x.weight > 0)));
  const distance = !weighted && rows.some((s) => s.entries.some((e) => e.exId === exId && e.sets.some((x) => x.dist > 0)));
  const ex = BY_ID[exId];
  const minutes = !weighted && !distance && ex && inMinutes(ex);
  const key = weighted ? 'weight' : distance ? 'dist' : 'reps';
  const points = rows.map((s) => {
    const sets = s.entries.filter((e) => e.exId === exId).flatMap((e) => e.sets);
    const y = Math.max(0, ...sets.map((x) => x[key] || 0));
    return { x: new Date(s.date), y: minutes ? y / 60 : y };
  }).filter((p) => p.y > 0);
  const unit = weighted ? ' kg' : distance ? ' m' : minutes ? ' min' : ex?.timed ? ' s' : ' st';
  const sub = weighted ? 'Tyngsta vikt per pass' : distance ? 'Längsta distans per pass' : ex?.timed ? 'Längsta tid per pass' : 'Flest reps per pass';
  return { points: points.map((p) => ({ ...p, tip: `${p.x.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}: ${fmtNum(p.y)}${unit}` })), unit, weighted, sub };
}

function statsView() {
  const now = new Date();
  const minutesIn = (from, to) => {
    const inR = (d) => new Date(d) >= from && new Date(d) < to;
    return {
      train: data.sessions.filter((s) => inR(s.date)).reduce((n, s) => n + minutesOf(s), 0),
      swim: [...data.swims, ...data.cardio].filter((x) => inR(x.date)).reduce((n, x) => n + (Number(x.minutes) || 0), 0),
      walk: data.walks.filter((x) => inR(x.date)).reduce((n, x) => n + (Number(x.minutes) || 0), 0),
    };
  };
  // 12 veckor, måndag–söndag
  const thisMonday = mondayOf(now);
  const weeks = [...Array(12)].map((_, i) => {
    const from = new Date(thisMonday); from.setDate(from.getDate() - 7 * (11 - i));
    const to = new Date(from); to.setDate(to.getDate() + 7);
    const v = minutesIn(from, to);
    const total = v.train + v.swim + v.walk;
    return { label: `v${isoWeek(from)}`, values: v, total, tip: `Vecka ${isoWeek(from)}: ${total} min (träning ${v.train}, kondition ${v.swim}, promenad ${v.walk})` };
  });
  const sum = (v) => v.train + v.swim + v.walk;
  const thisWeek = sum(weeks[11].values);
  const lastWeek = sum(weeks[10].values);
  const delta = thisWeek - lastWeek;

  // Pass och personbästa senaste 30 dagarna
  const since30 = new Date(now.getTime() - 30 * 86400000);
  const passes30 = [...data.sessions, ...data.swims, ...data.cardio].filter((s) => new Date(s.date) >= since30).length;
  const bestSoFar = {};
  let prs30 = 0;
  for (const s of [...data.sessions].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    for (const e of s.entries) {
      const v = Math.max(0, ...e.sets.map((x) => (x.weight > 0 ? x.weight * 1000 : x.dist || x.reps || 0)));
      if (bestSoFar[e.exId] !== undefined && v > bestSoFar[e.exId] && new Date(s.date) >= since30) prs30++;
      bestSoFar[e.exId] = Math.max(bestSoFar[e.exId] ?? 0, v);
    }
  }

  // Set per muskelgrupp, 4 veckor
  const since28 = new Date(now.getTime() - 28 * 86400000);
  const setsBy = {};
  for (const s of data.sessions) if (new Date(s.date) >= since28) for (const e of s.entries) {
    if (e.warmup) continue;
    const g = BY_ID[e.exId]?.muscles[0];
    if (g && g !== 'cardio') setsBy[g] = (setsBy[g] ?? 0) + e.sets.length;
  }
  const groupRows = MUSCLE_IDS.filter((m) => m !== 'cardio').map((m) => ({ label: MUSCLES[m].name, value: setsBy[m] ?? 0, tip: `${MUSCLES[m].name}: ${setsBy[m] ?? 0} set på fyra veckor` }));

  // Övningsutveckling
  const freq = {};
  for (const s of data.sessions) for (const e of s.entries) freq[e.exId] = (freq[e.exId] ?? 0) + 1;
  const exIds = Object.keys(freq).filter((id) => BY_ID[id]).sort((a, b) => freq[b] - freq[a]);
  if (!exIds.includes(ui.statsEx)) ui.statsEx = exIds[0];
  const series = ui.statsEx ? exerciseSeries(ui.statsEx) : { points: [] };

  // Steg, 30 dagar
  const stepDays = lastDays(30).map((d) => {
    const n = data.steps[dayKey(d)] ?? 0;
    return { label: String(d.getDate()), values: { steps: n }, tip: `${d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}: ${fmtNum(n, 0)} steg` };
  });
  const hasSteps = stepDays.some((d) => d.values.steps > 0);

  return blocks({
    rubrik: () => '<header class="page-head"><h1>Grafer</h1><p class="sub">Din utveckling</p></header>',
    siffror: () => `
    <div class="tiles three">
      <div class="tile"><span>Pass 30 dagar</span><b>${passes30}</b></div>
      <div class="tile"><span>Aktiva min i veckan</span><b>${thisWeek}</b>
        ${lastWeek || thisWeek ? `<small class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} mot förra</small>` : ''}</div>
      <div class="tile"><span>Personbästa 30 d</span><b>${prs30}</b></div>
    </div>`,
    'minuter-per-vecka': () => chartCard('Aktiva minuter per vecka', 'Senaste 12 veckorna', legendHtml(),
      columns({ cols: weeks, series: SERIES, unit: 'minuter' }),
      table(['Vecka', 'Träning', 'Kondition', 'Promenad'], weeks.map((w) => [w.label, w.values.train, w.values.swim, w.values.walk]))),
    'set-per-muskelgrupp': () => chartCard('Set per muskelgrupp', 'Senaste fyra veckorna', '',
      hbars({ rows: groupRows, cls: 's-train' }),
      table(['Muskelgrupp', 'Set'], groupRows.map((r) => [r.label, r.value]))),
    'övningar': () => `
    <section class="card chart-card">
      <h3>Utveckling per övning</h3>
      ${exIds.length ? `
        <label class="select-row"><span class="chart-sub">${series.sub}</span>
          <select data-change="stats-ex">${exIds.map((id) => `<option value="${id}" ${id === ui.statsEx ? 'selected' : ''}>${esc(BY_ID[id].name)}</option>`).join('')}</select></label>
        <p class="readout" aria-live="polite">Tryck på en punkt för att se värdet</p>
        ${series.points.length ? line({ points: series.points, unit: series.unit, cls: 's-train' }) : '<p class="empty">Inga värden för övningen än.</p>'}
        ${table(['Datum', 'Bästa'], series.points.map((p) => [p.x.toLocaleDateString('sv-SE'), `${fmtNum(p.y)}${series.unit}`]))}`
        : '<p class="empty">Kör eller logga några pass, så ser du hur du blir starkare här.</p>'}
    </section>`,
    steg: () => chartCard('Steg per dag', `Senaste 30 dagarna · linjen visar ditt mål på ${fmtNum(data.settings.stepGoal, 0)} steg`, '',
      hasSteps ? columns({ cols: stepDays, series: [{ key: 'steps', name: 'Steg', cls: 's-walk' }], unit: 'steg', goal: { value: data.settings.stepGoal, label: 'Mål' } })
        : '<p class="empty">Inga steg inlagda än. Skriv in dina steg på startsidan.</p>',
      hasSteps ? table(['Dag', 'Steg'], stepDays.filter((d) => d.values.steps).map((d) => [d.tip.split(':')[0], d.values.steps])) : ''),
  });
}

// ---- Logg -----------------------------------------------------------------
function logView() {
  const now = new Date();
  const week = (d) => daysBetween(d, now) < 7;
  const weekSessions = data.sessions.filter((s) => week(s.date));
  const weekWalks = data.walks.filter((w) => week(w.date));
  const weekSwims = data.swims.filter((w) => week(w.date));
  const weekCardio = data.cardio.filter((w) => week(w.date));
  const sets = weekSessions.reduce((n, s) => n + s.entries.reduce((m, e) => m + e.sets.length, 0), 0);
  const walkMin = weekWalks.reduce((n, w) => n + (Number(w.minutes) || 0), 0);
  const cardioMin = [...weekSwims, ...weekCardio].reduce((n, w) => n + (Number(w.minutes) || 0), 0);
  const mins = (list, d) => list.filter((x) => daysBetween(x.date, d) === 0).reduce((n, x) => n + (Number(x.minutes) || 0), 0);

  // Aktiva minuter per dag, senaste 7 dagarna
  const days = lastDays(7).map((d) => ({
    d,
    train: data.sessions.filter((s) => daysBetween(s.date, d) === 0).reduce((n, s) => n + minutesOf(s), 0),
    swim: mins(data.swims, d) + mins(data.cardio, d),
    walk: mins(data.walks, d),
  }));
  const maxMin = Math.max(30, ...days.map((x) => x.train + x.swim + x.walk));

  const items = [
    ...data.sessions.map((s) => ({ date: s.date, html: () => sessionRow(s) })),
    ...data.walks.map((w) => ({ date: w.date, html: () => walkRow(w) })),
    ...data.swims.map((w) => ({ date: w.date, html: () => swimRow(w) })),
    ...data.cardio.map((c) => ({ date: c.date, html: () => cardioRow(c) })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return blocks({
    rubrik: () => '<header class="page-head"><h1>Logg</h1><p class="sub">Senaste 7 dagarna</p></header>',
    siffror: () => `
    <div class="tiles">
      <div class="tile"><span>Pass</span><b>${weekSessions.length + weekSwims.length + weekCardio.length}</b></div>
      <div class="tile"><span>Set</span><b>${sets}</b></div>
      <div class="tile"><span>Kondition</span><b>${cardioMin} min</b></div>
      <div class="tile"><span>Promenad</span><b>${walkMin} min</b></div>
    </div>`,
    diagram: () => `
    <section class="card chart" aria-label="Aktiva minuter per dag">
      <div class="chart-head">
        <h3>Aktiva minuter</h3>
        <div class="legend"><i class="sw train"></i>Träning <i class="sw swim"></i>Kondition <i class="sw walk"></i>Promenad</div>
      </div>
      <div class="bars">
        ${days.map(({ d, train, swim, walk }) => `
          <div class="bar-col" title="${train + swim + walk} min">
            <div class="bar">
              <div class="seg walk" style="height:${(walk / maxMin) * 100}%"></div>
              <div class="seg swim" style="height:${(swim / maxMin) * 100}%"></div>
              <div class="seg train" style="height:${(train / maxMin) * 100}%"></div>
            </div>
            <span>${shortDay(d)}</span>
          </div>`).join('')}
      </div>
    </section>`,
    logga: () => `
    <button class="btn primary" data-action="manual-new">${ICON.gym} Logga övningar</button>
    <div class="row three">
      <button class="btn primary" data-action="walk-new">${ICON.walk} Promenad</button>
      <button class="btn primary swim-btn" data-action="swim-log">${ICON.swim} Simning</button>
      <button class="btn primary swim-btn" data-action="cardio-log">${ICON.pulse} Annat</button>
    </div>`,
    historik: () => `
    <h2 class="section-title">Historik</h2>
    ${items.length === 0 ? '<p class="empty">Inget loggat än. Kör ett pass eller logga en promenad, simning, löpning eller cykling.</p>' : ''}
    <ul class="log-list">
      ${items.map((it) => it.html()).join('')}
    </ul>`,
  });
}

const pace = (w) => {
  if (!w.meters || !w.minutes) return '';
  const sec = Math.round((w.minutes * 60) / (w.meters / 100));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min/100 m`;
};

function swimRow(w) {
  return `
    <li><button class="log-item" data-action="swim" data-id="${esc(w.id)}">
      <span class="log-icon swim">${ICON.swim}</span>
      <span class="log-text"><strong>${fmtDate(w.date)}</strong>
        <small>Simning · ${fmtNum(w.minutes, 0)} min${w.meters ? ` · ${fmtNum(w.meters, 0)} m` : ''}${w.style ? ` · ${SWIM_STYLES[w.style] ?? ''}` : ''}</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button></li>`;
}

// Styrkepass loggas utan tid. Bara intervallpass (cirkel, HIIT, kondition, balans) har minuter.
const isStrength = (s) => !s.type || s.type === 'strength';
const minutesOf = (s) => (isStrength(s) || !s.endDate ? 0 : Math.max(1, Math.round((new Date(s.endDate) - new Date(s.date)) / 60000)));
const minLabel = (s) => (isStrength(s) ? '' : ` · ${minutesOf(s)} min`);
const fmtDate = (d) => new Date(d).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

function sessionRow(s) {
  const sets = s.entries.reduce((n, e) => n + e.sets.length, 0);
  return `
    <li><button class="log-item" data-action="session" data-id="${esc(s.id)}">
      <span class="log-icon">${s.place === 'gym' ? ICON.gym : ICON.home}</span>
      <span class="log-text"><strong>${fmtDate(s.date)}</strong>
        <small>${s.place === 'gym' ? 'Gym' : 'Hemma'}${s.type && s.type !== 'strength' ? ` · ${TYPES[s.type].name}` : ''} · ${s.entries.length} övningar${minLabel(s)}</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button></li>`;
}

function walkRow(w) {
  return `
    <li><button class="log-item" data-action="walk" data-id="${esc(w.id)}">
      <span class="log-icon walk">${ICON.walk}</span>
      <span class="log-text"><strong>${fmtDate(w.date)}</strong>
        <small>Promenad · ${fmtNum(w.minutes, 0)} min${w.km ? ` · ${fmtNum(w.km)} km` : ''}</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button></li>`;
}

// ---- Inställningar -----------------------------------------------------------
const THEME_MODES = { auto: 'Som telefonen', light: 'Ljust', dark: 'Mörkt' };
const THEME_ACCENTS = { purple: ['Lila', '#6d4aff'], blue: ['Blå', '#2563eb'], green: ['Grön', '#0f8a5a'], pink: ['Rosa', '#d6336c'], orange: ['Orange', '#c9530c'] };
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

/** Sätter ljust/mörkt läge och färg på sidan. */
function applyTheme() {
  const s = data.settings;
  const root = document.documentElement;
  const mode = s.themeMode ?? 'auto';
  root.dataset.mode = mode === 'dark' || (mode === 'auto' && darkQuery.matches) ? 'dark' : 'light';
  if (s.themeAccent && s.themeAccent !== 'purple') root.dataset.accent = s.themeAccent;
  else delete root.dataset.accent;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg-top').trim());
}
darkQuery.addEventListener?.('change', applyTheme);

function themeSection() {
  const s = data.settings;
  const mode = s.themeMode ?? 'auto';
  const accent = s.themeAccent ?? 'purple';
  return `
    <h2 class="section-title">Färgtema</h2>
    <section class="card list">
      <div class="list-row theme-row">
        <span>Läge</span>
        <div class="segmented" role="radiogroup" aria-label="Ljust eller mörkt läge">
          ${Object.entries(THEME_MODES).map(([k, name]) => `<button role="radio" aria-checked="${mode === k}" data-action="theme-mode" data-value="${k}">${name}</button>`).join('')}
        </div>
      </div>
      <div class="list-row theme-row">
        <span>Färg</span>
        <div class="theme-swatches" role="radiogroup" aria-label="Färg">
          ${Object.entries(THEME_ACCENTS).map(([k, [name, color]]) => `<button class="swatch" role="radio" aria-checked="${accent === k}" aria-label="${name}" title="${name}" style="background:${color}" data-action="theme-accent" data-value="${k}"></button>`).join('')}
        </div>
      </div>
    </section>`;
}

function settingsView() {
  const s = data.settings;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return blocks({
    rubrik: () => '<header class="page-head"><h1>Inställningar</h1></header>',
    'inställningar': () => `
    <section class="card list">
      <button class="list-row action" data-action="tab" data-tab="physio">
        <span class="row-text">Ont i axlar, rygg eller knän<small>${painSummary() || 'Inget just nu'}</small></span>
        <span class="chev">${ICON.chevronR}</span>
      </button>
      <div class="list-row">
        <span>Vila mellan set</span>
        <div class="stepper">
          <button data-action="rest-step" data-d="-15" aria-label="Kortare vila">−</button>
          <b>${s.restSeconds} s</b>
          <button data-action="rest-step" data-d="15" aria-label="Längre vila">+</button>
        </div>
      </div>
      <div class="list-row">
        <span>Stegmål per dag</span>
        <div class="stepper">
          <button data-action="goal-step" data-d="-1000" aria-label="Lägre mål">−</button>
          <b>${fmtNum(s.stepGoal, 0)}</b>
          <button data-action="goal-step" data-d="1000" aria-label="Högre mål">+</button>
        </div>
      </div>
    </section>`,
    'färgtema': themeSection,
    installera: () => (standalone ? '' : `
    <h2 class="section-title">Installera på iPhone</h2>
    <section class="card prose">
      <ol>
        <li>Öppna sidan i <b>Safari</b>.</li>
        <li>Tryck på <b>Dela</b>-knappen (fyrkanten med pil uppåt).</li>
        <li>Välj <b>Lägg till på hemskärmen</b>.</li>
      </ol>
      <p class="muted">Då öppnas Min PT i helskärm som en vanlig app och fungerar även utan internet.</p>
    </section>`),
    data: () => `
    <h2 class="section-title">Din data</h2>
    <section class="card list">
      <button class="list-row action" data-action="export">Exportera säkerhetskopia</button>
      <label class="list-row action">Importera säkerhetskopia
        <input type="file" accept="application/json,.json" data-change="import" hidden>
      </label>
      <button class="list-row action danger" data-action="reset">Radera all data</button>
    </section>
    <p class="hint">Allt sparas bara på den här telefonen. Exportera då och då om du vill vara säker på att inte tappa din historik.</p>`,
  });
}

// ---------------------------------------------------------------------------
// Bottenark (detaljer, bibliotek, formulär)
function openSheet(html) {
  const sheet = $('#sheet');
  $('.sheet-body', sheet).innerHTML = html;
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
  mountFigures(sheet);
  $('.sheet-body', sheet).scrollTop = 0;
}

function closeSheet() {
  const sheet = $('#sheet');
  sheet.classList.remove('open');
  setTimeout(() => { if (!sheet.classList.contains('open')) { sheet.hidden = true; $('.sheet-body', sheet).innerHTML = ''; } }, 250);
}

const safetyList = (ex) => `<ul class="safety">${ex.safety.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const safetyBlock = (ex) => (ex.safety.length ? `<h3 class="safety-title">${ICON.shield} Tänk på</h3>${safetyList(ex)}` : '');

function guideSheet() {
  return `
    <div class="sheet-head"><h2>Träna säkert</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <p class="muted">Råden är allmänna. Det din fysioterapeut säger gäller alltid först.</p>
    ${GUIDE.map((g) => `
      <section class="card guide ${g.danger ? 'danger' : ''}">
        <h3>${esc(g.title)}</h3>
        <ul class="safety">${g.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${g.after ? `<p class="guide-after">${esc(g.after)}</p>` : ''}
      </section>`).join('')}`;
}

function detailSheet(ex) {
  return `
    <div class="sheet-head"><h2>${esc(ex.name)}</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <div class="fig big" data-ex="${ex.id}" data-play="1"></div>
    <div class="chips">${ex.physio ? '<span class="chip physio">Fysio</span>' : ''}${ex.muscles.map((m) => `<span class="chip">${MUSCLES[m].name}</span>`).join('')}</div>
    ${exerciseBody(ex)}
    ${painAreasFor(ex, data.settings.pain).length ? `<p class="note warn">Den här övningen belastar ${painNames(painAreasFor(ex, data.settings.pain))}, där du har ont. Kör den bara om det känns bra, högst 3 av 10.</p>` : ''}
    ${ex.physio ? '<p class="note">Övningen kommer från ditt fysioprogram. Följ fysioterapeutens instruktioner om de skiljer sig från tipsen här.</p>' : ''}
    <div class="card list">
      <div class="list-row"><span>Utrustning</span><b>${EQUIPMENT[ex.equipment]}</b></div>
      <div class="list-row"><span>Rekommenderat</span><b>${ex.sets} set × ${ex.reps}</b></div>
    </div>
    ${ex.tips.length ? `<h3>Så gör du</h3>
    <ol class="tips">${ex.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ex.custom ? '<p class="muted">Egen övning.</p>' : ''}
    ${safetyBlock(ex)}
    ${favoriteButtons(ex, data.active?.place ?? (FAV_TEXT[ui.tab] ? ui.tab : null))}
    <button class="btn-text guide-link" data-action="guide">${ICON.shield} Läs mer om att träna säkert</button>`;
}

function librarySheet(place) {
  return `
    <div class="sheet-head"><h2>Övningar – ${place === 'gym' ? 'gym' : 'hemma'}</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <input type="search" class="search" placeholder="Sök övning" data-input="search" aria-label="Sök övning">
    <div id="lib-list">${libraryList(place, '')}</div>`;
}

function libraryList(place, query) {
  const q = query.trim().toLowerCase();
  const list = EXERCISES.filter((e) => (e.physio || isAvailable(e, place, exOpts(place === 'gym' ? null : place))) && matchesQuery(e, q));
  return MUSCLE_IDS.map((m) => {
    const items = list.filter((e) => e.muscles[0] === m);
    if (!items.length) return '';
    return `<h3 class="group-title">${MUSCLES[m].name}</h3>
      <ul class="ex-list">${items.map((ex) => `
        <li class="ex-item" data-group="${ex.muscles[0]}"><button class="ex-main" data-action="detail" data-id="${ex.id}">
          <div class="fig thumb" data-ex="${ex.id}"></div>
          <div class="ex-text"><strong>${esc(ex.name)}</strong><span>${ex.sets} set × ${ex.reps}</span><small>${ex.physio ? 'Fysio · ' : ''}${EQUIPMENT[ex.equipment]}</small></div>
        </button></li>`).join('')}</ul>`;
  }).join('') || '<p class="empty">Ingen övning matchar.</p>';
}

function stepsSheet(key) {
  const today = dayKey(new Date());
  const v = data.steps[key];
  return `
    <div class="sheet-head"><h2>Steg</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="steps-form" class="form">
      <label>Datum<input type="date" name="date" value="${key}" max="${today}" required data-change="steps-date"></label>
      <label>Antal steg<input type="text" name="steps" inputmode="numeric" autocomplete="off" placeholder="t.ex. 7500" value="${v ?? ''}"></label>
      <p class="hint">Du hittar dina steg i appen Hälsa på iPhone, under Sammanfattning.</p>
      <button class="btn primary big" type="submit">Spara</button>
      ${v != null ? `<button class="btn danger-outline" type="button" data-action="steps-delete" data-date="${key}">Ta bort</button>` : ''}
    </form>`;
}

function swimSheet(fromPlan) {
  const today = dayKey(new Date());
  const plan = fromPlan ? ui.plans.swim || [] : [];
  const doneM = plan.filter((b) => b.done).reduce((s, b) => s + b.meters, 0);
  const meters = doneM || plan.reduce((s, b) => s + b.meters, 0);
  const elapsed = fromPlan && ui.swimStart ? Math.round((Date.now() - ui.swimStart) / 60000) : 0;
  const minutes = elapsed >= 5 ? elapsed : fromPlan ? ui.minutes.swim : 30;
  const style = fromPlan ? ui.swimStyle : 'mixed';
  return `
    <div class="sheet-head"><h2>${fromPlan ? 'Spara simpass' : 'Logga simpass'}</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="swim-form" class="form">
      <input type="hidden" name="fromPlan" value="${fromPlan ? 1 : ''}">
      <label>Datum<input type="date" name="date" value="${today}" max="${today}" required></label>
      <label>Minuter<input type="number" name="minutes" inputmode="numeric" min="1" max="600" value="${minutes}" required></label>
      <label>Meter (valfritt)<input type="text" name="meters" inputmode="numeric" autocomplete="off" placeholder="t.ex. 1000" value="${meters || ''}"></label>
      <label>Simsätt<select name="style">${Object.entries(SWIM_STYLES).map(([k, v]) => `<option value="${k}" ${k === style ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      ${fromPlan && doneM ? '<p class="hint">Metern är summan av delarna du bockat av.</p>' : ''}
      <button class="btn primary big" type="submit">Spara</button>
    </form>`;
}

function swimDetailSheet(w) {
  return `
    <div class="sheet-head"><h2>Simning</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <div class="card list">
      <div class="list-row"><span>Datum</span><b>${fmtDate(w.date)}</b></div>
      <div class="list-row"><span>Tid</span><b>${fmtNum(w.minutes, 0)} min</b></div>
      ${w.meters ? `<div class="list-row"><span>Distans</span><b>${fmtNum(w.meters, 0)} m</b></div>` : ''}
      ${w.meters ? `<div class="list-row"><span>Tempo</span><b>${pace(w)}</b></div>` : ''}
      ${w.style ? `<div class="list-row"><span>Simsätt</span><b>${SWIM_STYLES[w.style] ?? ''}</b></div>` : ''}
    </div>
    <button class="btn danger-outline" data-action="delete-swim" data-id="${esc(w.id)}">Radera simpasset</button>`;
}

// ---- Logga övningar i efterhand och välja valfri övning -------------------------
// ui.manual = { date, place, items: [{ exId, sets: [{ reps, weight }] }], picking, creating, query }
function sheetBody(html) {
  const body = $('#sheet .sheet-body');
  body.innerHTML = html;
  mountFigures(body);
}

function manualMain() {
  const m = ui.manual;
  const today = dayKey(new Date());
  return `
    <div class="sheet-head"><h2>${m.editId ? 'Ändra pass' : 'Logga övningar'}</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <div class="form">
      <label>Datum<input type="date" value="${m.date}" max="${today}" data-minput="date"></label>
      <div class="segmented two" role="radiogroup" aria-label="Var">
        ${['gym', 'home'].map((p) => `<button type="button" role="radio" aria-checked="${m.place === p}" data-action="m-place" data-value="${p}">${PLACE_NAME[p]}</button>`).join('')}
      </div>
    </div>
    ${m.items.map((it, i) => {
      const ex = BY_ID[it.exId];
      const head = m.items.some((x) => x.warmup) && (i === 0 || (!it.warmup && m.items[i - 1].warmup))
        ? `<h3 class="part-title">${it.warmup ? 'Uppvärmning' : 'Pass'}</h3>` : '';
      return `${head}
      <div class="card m-ex">
        <div class="m-head"><b>${esc(ex.name)}</b>
          <button class="toggle small" data-action="m-warmup" data-i="${i}" aria-pressed="${!!it.warmup}">Uppvärmning</button>
          <button class="icon-btn" data-action="m-remove" data-i="${i}" aria-label="Ta bort ${esc(ex.name)}">${ICON.remove}</button></div>
        ${it.sets.map((set, k) => `
          <div class="m-set">
            ${set.side ? `<button class="side" data-action="m-side" data-i="${i}" data-k="${k}" aria-label="Set ${k + 1}, ${set.side === 'H' ? 'höger' : 'vänster'}. Tryck för att byta">${set.side}</button>` : `<span class="set-no">${k + 1}</span>`}
            <label class="kg"><input type="text" inputmode="numeric" value="${inMinutes(ex) ? fmtNum(set.reps / 60) : set.reps}" data-minput="reps" data-i="${i}" data-k="${k}" aria-label="${inMinutes(ex) ? 'Minuter' : ex.timed ? 'Sekunder' : 'Reps'} set ${k + 1}"><span>${inMinutes(ex) ? 'min' : ex.timed ? 's' : 'st'}</span></label>
            ${ex.distance ? `<label class="kg wide"><input type="text" inputmode="numeric" placeholder="0" value="${set.dist || ''}" data-minput="dist" data-i="${i}" data-k="${k}" aria-label="Meter set ${k + 1}"><span>m</span></label>` : ex.timed ? '' : `<label class="kg"><input type="text" inputmode="decimal" placeholder="0" value="${set.weight ? fmtNum(set.weight, 2) : ''}" data-minput="weight" data-i="${i}" data-k="${k}" aria-label="Vikt set ${k + 1}"><span>kg</span></label>`}
            ${it.sets.length > 1 ? `<button class="icon-btn small" data-action="m-unset" data-i="${i}" data-k="${k}" aria-label="Ta bort set ${k + 1}">${ICON.remove}</button>` : ''}
          </div>`).join('')}
        ${ex.timed && it.sets.length === 1 ? '' : `<button class="btn-text" data-action="m-addset" data-i="${i}">+ Set</button>`}
      </div>`;
    }).join('')}
    <button class="btn secondary" data-action="m-pick-open">+ Lägg till övningar</button>
    <button class="btn primary big" data-action="m-save" ${m.items.length ? '' : 'disabled'}>Spara</button>`;
}

function pickPane() {
  const st = ui.pick;
  return `
    <div class="sheet-head"><h2>Välj övningar</h2><button class="btn-text" data-action="${st.for === 'manual' ? 'm-pick-close' : 'close-sheet'}">${st.for === 'manual' ? 'Tillbaka' : 'Avbryt'}</button></div>
    <input type="search" class="search" placeholder="Sök övning" value="${esc(st.query)}" data-input="pick-search" aria-label="Sök övning">
    <p class="hint">Bocka för de övningar du vill ha med.</p>
    <div id="pick-list">${pickList()}</div>
    <div class="pick-footer"><button class="btn primary big" data-action="pick-done" id="pick-done" ${st.selected.length ? '' : 'disabled'}>${pickDoneLabel()}</button></div>`;
}
const pickDoneLabel = () => {
  const n = ui.pick.selected.length;
  return n ? `Lägg till ${n} ${n === 1 ? 'övning' : 'övningar'}` : 'Välj övningar';
};

function pickList() {
  const q = ui.pick.query.trim().toLowerCase();
  const list = EXERCISES.filter((e) => matchesQuery(e, q));
  const exact = list.some((e) => e.name.toLowerCase() === q);
  return `
    ${ui.pick.creating ? customForm() : `<button class="btn secondary create-btn" data-action="c-open">+ Skapa egen övning${q && !exact ? ` ”${esc(ui.pick.query.trim())}”` : ''}</button>`}
    ${MUSCLE_IDS.map((m) => {
      const items = list.filter((e) => e.muscles[0] === m);
      return items.length ? `<h3 class="group-title">${MUSCLES[m].name}</h3><ul class="ex-list">${items.map((ex) => `
        <li class="ex-item pick-item" data-group="${ex.muscles[0]}"><button class="ex-main" data-action="pick-toggle" data-id="${ex.id}" aria-pressed="${ui.pick.selected.includes(ex.id)}">
          <div class="fig thumb" data-ex="${ex.id}"></div>
          <div class="ex-text"><strong>${esc(ex.name)}</strong><small>${ex.custom ? 'Egen · ' : ex.physio ? 'Fysio · ' : ''}${GEAR[ex.gear]}${ex.unilateral ? ' · H/V' : ''}</small></div>
          <span class="check" aria-hidden="true">${ICON.check}</span>
        </button></li>`).join('')}</ul>` : '';
    }).join('')}`;
}

function customForm() {
  return `
    <div class="card form custom-form">
      <b>Egen övning</b>
      <label>Namn<input type="text" id="c-name" value="${esc(ui.pick.query.trim())}" placeholder="t.ex. Kettlebell swing" autocomplete="off"></label>
      <label>Muskelgrupp<select id="c-group">${MUSCLE_IDS.map((m) => `<option value="${m}">${MUSCLES[m].name}</option>`).join('')}</select></label>
      <label>Utrustning<select id="c-gear">${Object.entries(GEAR).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="check-row"><input type="checkbox" id="c-timed"> Mäts i sekunder (som plankan)</label>
      <label class="check-row"><input type="checkbox" id="c-uni"> Ett ben eller en arm i taget (H/V)</label>
      <div class="row"><button class="btn secondary" data-action="c-cancel">Avbryt</button><button class="btn primary" data-action="c-create">Skapa</button></div>
    </div>`;
}

function openPick(forWhat) {
  ui.pick = { for: forWhat, query: '', creating: false, selected: [] };
  if (forWhat === 'manual') sheetBody(pickPane()); else openSheet(pickPane());
}

/** Lägger till de förbockade övningarna: i passet före start, i loggningen eller i kön under passet. */
function finishPick() {
  const ids = ui.pick.selected;
  if (!ids.length) return;
  const n = ids.length;
  if (ui.pick.for === 'manual') {
    for (const exId of ids) {
      const ex = BY_ID[exId];
      ui.manual.items.push({ exId, warmup: isWarmupStart(exId, ui.manual.items), sets: makeSets(ex, ex.sets, lastWeights(data.sessions)[exId] ?? 0) });
    }
    ui.manual.items = warmupFirst(ui.manual.items);
    sheetBody(manualMain());
    return;
  }
  closeSheet();
  if (ui.pick.for === 'setup') {
    for (const exId of ids) ui.plans[ui.tab].push({ exId, sets: BY_ID[exId].sets });
    render();
  } else {
    const w = data.active;
    const current = w.items[w.index];
    for (const exId of ids) w.items.push(newItem(exId));
    w.items = warmupFirst(w.items);
    if (current) w.index = w.items.indexOf(current);
    w.picking = true;
    w.adding = false;
    save();
    renderWorkout();
    $('#wk-body').scrollTop = 0;
  }
  toast(`${n} ${n === 1 ? 'övning' : 'övningar'} tillagda`);
}

function saveManual() {
  const m = ui.manual;
  const isToday = m.date === dayKey(new Date());
  const start = isToday ? new Date() : new Date(`${m.date}T12:00:00`);
  const entries = warmupFirst(m.items)
    .map((it) => ({ exId: it.exId, ...(it.warmup ? { warmup: true } : {}), sets: it.sets.filter((x) => x.reps > 0).map((x) => ({
      ...(BY_ID[it.exId].timed ? { reps: x.reps, weight: 0, sec: true } : { reps: x.reps, weight: x.weight || 0 }),
      ...(x.dist > 0 ? { dist: x.dist } : {}),
      ...(x.side ? { side: x.side } : {}),
    })) }))
    .filter((e) => e.sets.length);
  if (!entries.length) { toast('Lägg till minst ett set'); return; }
  const old = m.editId && data.sessions.find((x) => x.id === m.editId);
  if (old) {
    // Samma dag: behåll starttiden.
    const keep = dayKey(new Date(old.date)) === m.date;
    Object.assign(old, { place: m.place, entries, ...(keep ? {} : { date: start.toISOString() }) });
    delete old.endDate;
    save();
    ui.manual = null;
    closeSheet();
    render();
    toast('Passet är ändrat');
    return;
  }
  data.sessions.push({ id: uid(), place: m.place, date: start.toISOString(), entries, manual: true });
  save();
  ui.manual = null;
  render();
  showFeedback(data.sessions[data.sessions.length - 1]);
}

function walkSheet() {
  const today = dayKey(new Date());
  return `
    <div class="sheet-head"><h2>Logga promenad</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="walk-form" class="form">
      <label>Datum<input type="date" name="date" value="${today}" max="${today}" required></label>
      <label>Minuter<input type="number" name="minutes" inputmode="numeric" min="1" max="600" value="30" required></label>
      <label>Kilometer (valfritt)<input type="text" name="km" inputmode="decimal" autocomplete="off" placeholder="t.ex. 3,5"></label>
      <div class="quick">${[15, 30, 45, 60].map((m) => `<button type="button" class="chip-btn" data-action="walk-quick" data-min="${m}">${m} min</button>`).join('')}</div>
      <button class="btn primary big" type="submit">Spara promenad</button>
    </form>`;
}

function sessionPraise(s) {
  if (s.type && s.type !== 'strength') return '';
  const before = data.sessions.filter((x) => x !== s && new Date(x.date) < new Date(s.date));
  const fb = workoutFeedback({ session: s, before, swims: data.swims.filter((x) => new Date(x.date) < new Date(s.date)), pain: {} });
  return `<ul class="fb-list small">${fb.highlights.slice(0, 3).map((h) => `<li><span class="fb-icon">${h.icon}</span><span>${esc(h.text)}</span></li>`).join('')}</ul>`;
}

function sessionSheet(s) {
  return `
    <div class="sheet-head"><h2>${s.place === 'gym' ? 'Gympass' : 'Hemmapass'}${s.type && s.type !== 'strength' ? ` · ${TYPES[s.type].name.toLowerCase()}` : ''}</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <p class="muted">${fmtDate(s.date)}${minLabel(s)}</p>
    ${sessionPraise(s)}
    ${bodyCard(loadLevels(sessionLoad(s.entries.map((e) => ({ ...e, sets: e.sets.length })))), 'Musklerna i passet')}
    ${[['Uppvärmning', s.entries.filter((e) => e.warmup)], ['Pass', s.entries.filter((e) => !e.warmup)]].map(([title, list]) => (list.length ? `
      ${s.entries.some((e) => e.warmup) ? `<h3 class="part-title">${title}</h3>` : ''}
      ${list.map((e) => {
        const ex = BY_ID[e.exId];
        return `<div class="card list">
          <div class="list-row head"><b>${esc(ex ? ex.name : e.exId)}</b></div>
          ${e.sets.map((set, i) => `<div class="list-row"><span>${e.sets.length > 1 || set.side ? `Set ${i + 1}${sideTag(set)}` : ex?.timed ? 'Tid' : 'Set 1'}</span><b>${fmtSet(ex, set)}</b></div>`).join('')}
        </div>`;
      }).join('')}` : '')).join('')}
    ${!s.type || s.type === 'strength' ? `<button class="btn secondary" data-action="edit-session" data-id="${esc(s.id)}">Ändra passet</button>` : ''}
    <button class="btn danger-outline" data-action="delete-session" data-id="${esc(s.id)}">Radera passet</button>`;
}

function walkDetailSheet(w) {
  return `
    <div class="sheet-head"><h2>Promenad</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <div class="card list">
      <div class="list-row"><span>Datum</span><b>${fmtDate(w.date)}</b></div>
      <div class="list-row"><span>Tid</span><b>${fmtNum(w.minutes, 0)} min</b></div>
      ${w.km ? `<div class="list-row"><span>Distans</span><b>${fmtNum(w.km)} km</b></div>` : ''}
    </div>
    <button class="btn danger-outline" data-action="delete-walk" data-id="${esc(w.id)}">Radera promenaden</button>`;
}

// ---------------------------------------------------------------------------
// Dialog (bekräftelser)
function confirmDialog({ title, message, buttons }) {
  const dlg = $('#dialog');
  dlg.innerHTML = `
    <div class="dialog-box" role="alertdialog" aria-labelledby="dlg-title">
      <h3 id="dlg-title">${title}</h3>
      ${message ? `<p>${message}</p>` : ''}
      <div class="dialog-buttons">
        ${buttons.map((b, i) => `<button class="btn ${b.style || 'secondary'}" data-dlg="${i}">${b.label}</button>`).join('')}
      </div>
    </div>`;
  dlg.hidden = false;
  dlg.onclick = (e) => {
    const btn = e.target.closest('[data-dlg]');
    if (!btn && e.target !== dlg) return;
    dlg.hidden = true;
    dlg.onclick = null;
    if (btn) buttons[Number(btn.dataset.dlg)].onClick?.();
  };
}

function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------------------------------------------------------------------------
// Träningspass
/** Långa tidsövningar (cykel, roddmaskin) visas i minuter. */
const inMinutes = (ex) => ex.timed && ex.defaultReps >= 120;
const fmtAmount = (ex, reps) => (inMinutes(ex) ? `${fmtNum(reps / 60)} min` : `${reps} ${ex.timed ? 's' : 'st'}`);
const fmtDist = (m) => (m >= 10000 ? `${fmtNum(m / 1000, 2)} km` : `${fmtNum(m, 0)} m`);
/** Ett set som text: tid (och distans), reps × vikt eller reps. */
const fmtSet = (ex, set) => (ex && (ex.timed || set.sec)
  ? `${fmtAmount(ex, set.reps)}${set.dist ? ` · ${fmtDist(set.dist)}` : ''}`
  : set.weight > 0 ? `${set.reps} × ${fmtNum(set.weight)} kg` : `${set.reps} st`);
/** Uppvärmningsövningar (roddmaskin, cykel) blir uppvärmning så länge inget riktigt set är klart. */
const isWarmupStart = (exId, before) => !!BY_ID[exId]?.warmup
  && before.every((it) => it.warmup || !Array.isArray(it.sets) || !it.sets.some((x) => x.done));
/** Uppvärmning först, sedan passet; ordningen inom varje del behålls. */
const warmupFirst = (list) => [...list.filter((x) => x.warmup), ...list.filter((x) => !x.warmup)];

/** Set för en övning. Enbensövningar får H och V växelvis, så antalet set dubbleras. */
function makeSets(ex, n = ex.sets, weight = 0, extra = {}) {
  const count = ex.unilateral ? n * 2 : n;
  return [...Array(count)].map((_, i) => ({ reps: ex.defaultReps, weight, ...extra, ...(ex.unilateral ? { side: i % 2 ? 'V' : 'H' } : {}) }));
}
const flip = (side) => (side === 'H' ? 'V' : side === 'V' ? 'H' : undefined);
const sideTag = (set) => (set.side ? ` (${set.side})` : '');

function newItem(exId, sets = BY_ID[exId].sets, before = data.active?.items ?? []) {
  const ex = BY_ID[exId];
  const warmup = isWarmupStart(exId, before);
  const item = { exId, warmup, sets: makeSets(ex, sets, lastWeights(data.sessions)[exId] ?? 0, { done: false }) };
  // Som uppvärmning räcker 5 minuter på cykel eller roddmaskin.
  if (warmup && inMinutes(ex)) for (const x of item.sets) x.reps = 300;
  return item;
}
/** Bygger en lista med övningar, där de inledande roddmaskin/cykel blir uppvärmning. */
function newItems(list) {
  const items = [];
  for (const p of list) items.push(newItem(p.exId, p.sets, items));
  return items;
}

function startWorkout(place) {
  const items = warmupFirst(newItems(ui.plans[place]));
  data.active = {
    place,
    start: Date.now(),
    index: 0,
    restEnd: null,
    restBeeped: false,
    avail: [...gearFor(place)], // Tillgänglig utrustning från Gym/Hemma-sidan
    gear: [...gearFor(place)],
    groups: [...groupsFor(place)],
    stype: 'strength',
    picking: true, // man trycker själv på övningen man ska köra
    items,
  };
  save();
  openWorkout();
}

// Kön = övningar utan klara set. Påbörjade övningar ligger först, i den ordning de kördes.
const queueIndexes = (w) => w.items.map((_, i) => i).filter((i) => !doneSets(w.items[i]));

/** Gör en övning till nästa: den läggs direkt efter de påbörjade och visas. */
function runItem(w, item) {
  const started = w.items.filter((it) => doneSets(it));
  const queued = w.items.filter((it) => !doneSets(it) && it !== item);
  w.items = [...started, item, ...queued];
  w.index = started.length;
  w.picking = false;
  w.adding = false;
  w.snap = JSON.stringify(item.sets); // för Avbryt
  w.restEnd = w.restEnd && w.restEnd > Date.now() ? w.restEnd : null;
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

function openPicker() {
  const w = data.active;
  w.picking = true;
  w.adding = false;
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

function openWorkout() {
  const w = $('#workout');
  w.hidden = false;
  document.body.classList.add('no-scroll');
  if (data.active.mode === 'interval') renderRunner(); else renderWorkout();
  keepAwake(true);
}

// ---------------------------------------------------------------------------
// Intervalltimer (cirkel, HIIT, kondition, balans)
function startInterval(place) {
  let n = Math.floor(Math.random() * QUICK_TIPS.length);
  const steps = [{ kind: 'rest', sec: 10, label: 'Gör dig redo' }, ...expandSteps(ui.iplans[place])]
    .map((st) => (st.kind === 'rest' ? { ...st, tip: QUICK_TIPS[n++ % QUICK_TIPS.length] } : st));
  data.active = { mode: 'interval', place, type: ui.iplans[place].type, start: Date.now(), steps, index: 0, endsAt: Date.now() + 10000, paused: null, done: [] };
  save();
  openWorkout();
}

const runLeft = (a) => (a.paused != null ? a.paused : Math.max(0, Math.ceil((a.endsAt - Date.now()) / 1000)));

function renderRunner() {
  const a = data.active;
  const step = a.steps[a.index];
  const nextWork = a.steps.slice(a.index + 1).find((x) => x.kind === 'work');
  const showId = step.kind === 'work' ? step.exId : nextWork?.exId;
  const ex = showId ? BY_ID[showId] : null;
  const working = step.kind === 'work';
  $('#workout').innerHTML = `
    <div class="wk-top">
      <span class="wk-spacer"></span>
      <div class="wk-title"><b>${a.type === 'stretch' ? 'Stretch' : TYPES[a.type].name}</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="progress"><div style="width:${(a.index / a.steps.length) * 100}%"></div></div>
    <div class="wk-body run ${working ? (step.physio ? 'is-physio' : 'is-work') : 'is-rest'}" id="wk-body">
      <p class="run-phase">${working ? (step.physio ? 'Fysio' : step.stretch ? 'Stretcha' : 'Kör!') : esc(step.label)}</p>
      <p class="run-label">${working ? esc(step.label || '') : ex ? 'Nästa övning' : ''}</p>
      ${ex ? `<div class="fig big" data-ex="${ex.id}" ${working ? 'data-play="1"' : ''}></div>
        <h2 class="wk-name">${esc(ex.name)}</h2>` : '<h2 class="wk-name">Snart klart!</h2>'}
      ${step.mode === 'reps'
        ? `<div class="run-reps">${esc(step.repsText)}</div><p class="muted center">Tryck på Klar när setet är gjort</p>`
        : `<div class="run-clock" id="run-clock">${fmtClock(runLeft(a))}</div>`}
      ${working && nextWork ? `<p class="muted center">Sedan: ${esc(BY_ID[nextWork.exId].name)}</p>` : ''}
      ${working ? `<details class="card"><summary>Så gör du</summary><ol class="tips">${ex.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>
        ${ex.safety.length ? `<details class="card safety-card"><summary>${ICON.shield} Tänk på</summary>${safetyList(ex)}</details>` : ''}`
        : `<p class="quick-tip">${ICON.shield}<span>${esc(step.tip || '')}</span></p>`}
    </div>
    <div class="wk-bottom">
      <button class="btn secondary square" data-action="run-prev" ${a.index === 0 ? 'disabled' : ''} aria-label="Föregående">${ICON.chevronL}</button>
      ${step.mode === 'reps'
        ? '<button class="btn success grow" data-action="run-done">Klar</button>'
        : `<button class="btn primary grow" data-action="run-pause">${a.paused != null ? `${ICON.play} Fortsätt` : 'Paus'}</button>`}
      <button class="btn secondary square" data-action="run-skip" aria-label="Hoppa över">${ICON.chevronR}</button>
      <button class="btn-text wk-end" data-action="end">${a.type === 'stretch' ? 'Hoppa över stretchen' : 'Avsluta passet'}</button>
    </div>`;
  mountFigures($('#workout'));
}

function runGo(index) {
  const a = data.active;
  if (index >= a.steps.length) { finishInterval(); return; }
  a.index = Math.max(0, index);
  const step = a.steps[a.index];
  a.endsAt = step.mode === 'reps' ? null : Date.now() + step.sec * 1000;
  a.paused = null;
  a.lastBeep = null;
  save();
  if (step.kind === 'work') beep(); else tone(520, 0.25);
  renderRunner();
}

function runAdvance(completed) {
  const a = data.active;
  if (completed && a.steps[a.index].kind === 'work' && !a.done.includes(a.index)) a.done.push(a.index);
  runGo(a.index + 1);
}

function tickRunner() {
  const a = data.active;
  if (!a || a.mode !== 'interval' || $('#workout').hidden) return;
  const elapsed = $('#elapsed');
  if (elapsed) elapsed.textContent = fmtClock(Math.floor((Date.now() - a.start) / 1000));
  const step = a.steps[a.index];
  if (step.mode === 'reps' || a.paused != null) return;
  const left = runLeft(a);
  const clock = $('#run-clock');
  if (clock) clock.textContent = fmtClock(left);
  if (left >= 1 && left <= 3 && a.lastBeep !== left) { a.lastBeep = left; tone(660, 0.1); }
  if (left <= 0) runAdvance(true);
}
setInterval(tickRunner, 250);

function finishInterval() {
  const a = data.active;
  const byEx = new Map();
  for (const i of a.done) {
    const st = a.steps[i];
    if (st.stretch) continue; // stretchen loggas inte som träning
    if (!byEx.has(st.exId)) byEx.set(st.exId, []);
    byEx.get(st.exId).push(st.mode === 'time' ? { reps: st.sec, weight: 0, sec: true } : { reps: BY_ID[st.exId].defaultReps, weight: 0 });
  }
  const entries = [...byEx].map(([exId, sets]) => ({ exId, sets }));
  if (a.type === 'stretch') { // stretch efter ett styrkepass som redan är sparat
    data.active = null;
    save();
    closeWorkout();
    ui.tab = 'log';
    render();
    const session = data.sessions.find((s) => s.id === a.feedbackFor);
    if (session) showFeedback(session);
    return;
  }
  if (entries.length) {
    data.sessions.push({ id: uid(), place: a.place, type: a.type, date: new Date(a.start).toISOString(), endDate: new Date().toISOString(), entries });
  }
  data.active = null;
  save();
  closeWorkout();
  if (entries.length) ui.tab = 'log';
  render();
  if (entries.length) showFeedback(data.sessions[data.sessions.length - 1]);
}

function closeWorkout() {
  $('#workout').hidden = true;
  $('#workout').innerHTML = '';
  document.body.classList.remove('no-scroll');
  keepAwake(false);
}

// ---- Kroppskarta ------------------------------------------------------------
const BODY_LEGEND = {
  ex: '<span><i class="sw bm-l2"></i>Huvudmuskel</span><span><i class="sw bm-l1"></i>Hjälper till</span>',
  load: '<span><i class="sw bm-l1"></i>Lite</span><span><i class="sw bm-l2"></i>Mer</span><span><i class="sw bm-l3"></i>Mest</span>',
};
const TAP_HINT = '<p class="hint center">Tryck på en muskel för att få förslag på övningar.</p>';

/** Vilka muskler övningen tränar. Det går inte att trycka på musklerna. */
function exerciseBody(ex) {
  const { p, s } = musclesOf(ex);
  if (!p.length && !s.length) return '';
  return `<div class="card body-card">
    ${bodyMap(exerciseLevels(ex), { label: `Muskler som ${ex.name} tränar` })}
    <div class="legend center">${BODY_LEGEND.ex}</div>
    <p class="bm-names"><b>${p.map((m) => BODY[m].name).join(', ')}</b>${s.length ? `${p.length ? ' · ' : ''}${s.map((m) => BODY[m].name).join(', ')}` : ''}</p>
  </div>`;
}

function bodyCard(levels, title, { interactive = false, extra = '' } = {}) {
  const used = Object.keys(levels).filter((m) => levels[m] > 0);
  return `<div class="card body-card">
    <h3 class="pk-title">${title}</h3>${extra}
    ${used.length ? `${bodyMap(levels, { interactive, label: title })}<div class="legend center">${BODY_LEGEND.load}</div>`
      : `${interactive ? bodyMap({}, { interactive, label: title }) : ''}<p class="muted center">Inga styrkeövningar loggade.</p>`}
    ${interactive ? TAP_HINT : ''}
  </div>`;
}

const lastStrengthSession = () => [...data.sessions].reverse().find(isStrength);

/** Musklerna i det här passet eller förra passet, under passet. */
function sessionBodyCard(w) {
  const prev = lastStrengthSession();
  const view = w.bodyView === 'prev' && prev ? 'prev' : 'now';
  const entries = view === 'prev'
    ? prev.entries.map((e) => ({ ...e, sets: e.sets.length }))
    : w.items.map((it) => ({ exId: it.exId, warmup: it.warmup, sets: doneSets(it) }));
  const toggle = prev ? `<div class="segmented two" role="radiogroup" aria-label="Vilket pass">
      ${[['now', 'Det här passet'], ['prev', 'Förra passet']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${view === v}" data-action="body-view" data-value="${v}">${l}</button>`).join('')}
    </div>${view === 'prev' ? `<p class="hint center">${fmtDate(prev.date)}</p>` : ''}` : '';
  return bodyCard(loadLevels(sessionLoad(entries)), 'Musklerna i passet', { interactive: true, extra: toggle });
}

/** Övningar som tränar en muskel. Under passet kan man köra eller köa dem direkt. */
function muscleSheet(m) {
  const w = data.active;
  const pain = data.settings.pain ?? {};
  const gear = w?.gear ?? GEAR_IDS;
  const list = exercisesFor(m, (ex) => ex.muscles[0] !== 'cardio' && gear.includes(ex.gear) && painOk(ex, pain));
  const done = new Set(exercisesToday().map((d) => d.exId));
  const queued = new Set(w ? queueIndexes(w).map((i) => w.items[i].exId) : []);
  const icon = (action, id, label, svg) => `<button class="icon-btn" data-action="${action}" data-id="${id}" aria-label="${label}">${svg}</button>`;
  return `
    <div class="sheet-head"><h2>${BODY[m].name}</h2><button class="btn-text" data-action="close-sheet">Stäng</button></div>
    ${bodyMap({ [m]: 2 }, { label: BODY[m].name })}
    ${w ? '<p class="hint center">Tryck på en övning för att köra den nu, eller på plus för att lägga den i kön.</p>' : ''}
    ${list.length ? `<ul class="ex-list">${list.map(({ ex, primary }) => suggestionItem(
      { ex, reason: `${primary ? 'Tränar främst ' : 'Hjälper till med '}${BODY[m].name.toLowerCase()}${done.has(ex.id) ? ' · kört idag' : queued.has(ex.id) ? ' · i kön' : ''}` },
      `<div class="ex-actions"><div class="pk-more">${icon('detail', ex.id, `Om ${esc(ex.name)}`, ICON.info)}${w && !queued.has(ex.id) ? icon('bm-queue', ex.id, `Lägg ${esc(ex.name)} i kön`, ICON.plus) : ''}</div></div>`,
      w ? `data-action="bm-go" data-id="${ex.id}"` : undefined)).join('')}</ul>`
      : '<p class="empty">Inga övningar för den här muskeln passar med vald utrustning.</p>'}`;
}

/** Ritar om passet men behåller scrollpositionen (byte av vy nollställer den separat). */
function renderWorkout() {
  const top = $('#wk-body')?.scrollTop ?? 0;
  drawWorkout();
  const body = $('#wk-body');
  if (body) body.scrollTop = top;
}

function drawWorkout() {
  const w = data.active;
  w.gear ??= gearFor(w.place);
  w.groups ??= groupsFor(w.place);
  if (w.picking || !w.items[w.index]) { renderPicker(); return; }
  const root = $('#workout');
  const item = w.items[w.index];
  const ex = BY_ID[item.exId];
  const figure = () => `<div class="fig big" data-ex="${ex.id}" data-play="1"></div>`;

  root.innerHTML = `
    <div class="wk-top">
      <span class="wk-spacer"></span>
      <div class="wk-title">${item.preview ? `<b>${esc(ex.name)}</b>`
        : `<b>${item.warmup ? 'Uppvärmning' : `Övning ${w.items.slice(0, w.index).filter((it) => !it.warmup).length + 1}`}</b><span id="elapsed">0:00</span>`}</div>
      <span class="wk-spacer"></span>
    </div>
    <div class="wk-body" id="wk-body">
      ${item.preview ? blocks({
        // Lägga till: namnet står överst, inga val och ingen instruktion (SPEC.md F2.23).
        figur: () => figure(),
        muskler: () => exerciseBody(ex),
      }) : blocks({
        rubrik: () => `<h2 class="wk-name">${esc(ex.name)}</h2>
      <p class="muted center">${ex.sets} set × ${ex.reps} · ${muscleNames(ex)}</p>`,
        logga: () => (simpleSets(ex) ? setsForm(ex, item) : `
      <div class="sets">${item.sets.map((s, k) => setRow(ex, s, k)).join('')}</div>
      ${inMinutes(ex) ? '' : '<button class="btn-text add-set" data-action="add-set">+ Lägg till set</button>'}`),
        figur: () => figure(),
        muskler: () => exerciseBody(ex),
        knappar: () => `<div class="wk-links">
        <button class="toggle small" data-action="wk-warmup" aria-pressed="${!!item.warmup}">Uppvärmning</button>
        ${FAV_TEXT[w.place] ? favoriteButtons(ex, w.place) : ''}
        <button class="btn-text wk-link" data-action="pain-sheet">Gör det ont?</button>
      </div>`,
        'så-gör-du': () => `<details class="card">
        <summary>Så gör du</summary>
        <ol class="tips">${ex.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      </details>`,
        'tänk-på': () => (ex.safety.length ? `<details class="card safety-card"><summary>${ICON.shield} Tänk på</summary>${safetyList(ex)}</details>` : ''),
      })}
    </div>
    <div id="rest" class="rest" hidden></div>
    <div class="wk-bottom">
      <button class="btn secondary grow" data-action="ex-cancel">Avbryt</button>
      ${item.preview ? '<button class="btn primary grow" data-action="ex-add">Lägg till</button>' : '<button class="btn primary grow" data-action="ex-done">Klar</button>'}
    </div>`;
  mountFigures(root);
  updateTimers();
}

/** Uppvärmningsalternativ för platsen; skonsamma först om knäna gör ont. */
function warmupOptions(place) {
  const pain = data.settings.pain ?? {};
  const ids = place === 'gym' ? ['rowing-machine', 'bike', 'march'] : ['march', 'shadow-box', 'jumping-jack'];
  const list = ids.map((id) => BY_ID[id]).filter((ex) => ex && painOk(ex, pain));
  return (pain.knees || 0) > 0 ? [...list].sort((a, b) => (a.load?.knees || 0) - (b.load?.knees || 0)) : list;
}
const WARM_WHY = {
  'rowing-machine': 'Värmer hela kroppen: ben, rygg och armar',
  bike: 'Skonsam för knäna, värmer upp benen',
  march: 'Lugn start som höjer pulsen',
  'shadow-box': 'Värmer axlar och överkropp',
  'jumping-jack': 'Får igång pulsen snabbt',
};

/** Översikten under passet: slutförda övningar och kön, plus knappar för att lägga till och avsluta. */
function renderPicker() {
  const w = data.active;
  if (w.adding) { renderAdd(); return; }
  const root = $('#workout');
  const qi = queueIndexes(w);
  const doneIdx = w.items.map((_, i) => i).filter((i) => doneSets(w.items[i]));
  const btn = (action, attr, label, icon) => `<button class="icon-btn" data-action="${action}" ${attr} aria-label="${label}">${icon}</button>`;
  // Ingen uppvärmning gjord (eller i kön) och inte bortvald: visa uppvärmningsövningar.
  const needWarm = !w.skipWarm && !w.items.some((it) => it.warmup);
  const warmList = needWarm ? warmupOptions(w.place) : [];
  const setsText = (it, ex, n) => (ex.timed && n === 1 ? fmtAmount(ex, it.sets[0].reps) : `${ex.unilateral ? Math.ceil(n / 2) : n} set × ${ex.reps}${ex.unilateral ? ' (H/V)' : ''}`);

  root.innerHTML = `
    <div class="wk-top">
      <span class="wk-spacer"></span>
      <div class="wk-title"><b>Passet</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="wk-body picker" id="wk-body">
      ${warmList.length ? `
        <div class="warm-box"><h3 class="pk-title">Uppvärmning <small>lugnt tempo, pulsen ska upp lite</small></h3>
        <ul class="ex-list">${warmList.map((ex) => suggestionItem(
          { ex, reason: `${WARM_WHY[ex.id] ?? 'Lätt uppvärmning'} · ${inMinutes(ex) ? '5 min' : `${ex.reps} × ${ex.sets}`}` },
          `<div class="ex-actions"><div class="pk-more">${btn('detail', `data-id="${ex.id}"`, `Om ${esc(ex.name)}`, ICON.info)}</div></div>`, `data-action="w-go" data-id="${ex.id}"`)).join('')}</ul>
        <button class="btn-text" data-action="skip-warm">Jag har redan värmt upp</button></div>` : ''}
      <div><h3 class="pk-title">Slutfört</h3>
      ${doneIdx.length ? `<ul class="ex-list">${doneIdx.map((i) => {
        const it = w.items[i], ex = BY_ID[it.exId];
        return suggestionItem({ ex, reason: `${it.warmup ? 'Uppvärmning · ' : ''}${setsText(it, ex, doneSets(it))} klart` },
          `<div class="ex-actions"><div class="pk-more">${btn('detail', `data-id="${ex.id}"`, `Om ${esc(ex.name)}`, ICON.info)}</div></div>`,
          `data-action="d-go" data-k="${i}"`);
      }).join('')}</ul>` : '<p class="empty">Inga övningar ännu.</p>'}</div>
      <div><h3 class="pk-title">Din kö <small>tryck på övningen du ska köra</small></h3>
      ${qi.length ? `<ul class="ex-list">${qi.map((i, n) => {
        const it = w.items[i], ex = BY_ID[it.exId];
        return suggestionItem({ ex, reason: `${it.warmup ? 'Uppvärmning · ' : ''}${setsText(it, ex, it.sets.length)}`}, `
          <div class="ex-actions">
            <div class="pk-more">
              ${btn('detail', `data-id="${ex.id}"`, `Om ${esc(ex.name)}`, ICON.info)}
              ${n ? btn('q-up', `data-k="${i}"`, `Flytta upp ${esc(ex.name)}`, ICON.up) : ''}
              ${btn('q-remove', `data-k="${i}"`, `Ta bort ${esc(ex.name)}`, ICON.remove)}
            </div>
          </div>`, `data-action="q-go" data-k="${i}"`);
      }).join('')}</ul>` : '<p class="empty">Kön är tom.</p>'}</div>
      <div class="stack">
        <button class="btn primary big" data-action="add-open">${ICON.plus} Lägg till övning</button>
        <button class="btn secondary" data-action="end">Avsluta passet</button>
      </div>
    </div>
    <div id="rest" class="rest" hidden></div>`;
  mountFigures(root);
  updateTimers();
}

/** Ny sida: välj typ, muskelgrupper och utrustning och få förslag. */
function renderAdd() {
  const w = data.active;
  const root = $('#workout');
  const done = exercisesToday();
  const qi = queueIndexes(w);
  const queueIds = qi.map((i) => w.items[i].exId);
  const suggestions = pickSuggestions(w, done, queueIds);
  const btn = (action, attr, label, icon) => `<button class="icon-btn" data-action="${action}" ${attr} aria-label="${label}">${icon}</button>`;
  const actions = (ex) => `
    <div class="ex-actions">
      <div class="pk-more">
        ${btn('detail', `data-id="${ex.id}"`, `Om ${esc(ex.name)}`, ICON.info)}
        ${btn('s-queue', `data-id="${ex.id}"`, `Lägg ${esc(ex.name)} i kön`, ICON.plus)}
      </div>
    </div>`;

  root.innerHTML = `
    <div class="wk-top">
      <button class="back wk-back" data-action="add-close">${ICON.chevronL}Passet</button>
      <div class="wk-title"><b>Lägg till övning</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="wk-body picker" id="wk-body">
      <p class="hint center">Tryck på en övning för att läsa om den och lägga till den, eller på + för att lägga den direkt i kön.</p>
      <section class="card controls pk-controls">${pickControls(w)}</section>
      <div><h3 class="pk-title">Förslag</h3>
      ${!w.gear.length && w.stype !== 'stretch' ? '<p class="note warn">Välj minst en typ av utrustning.</p>' : suggestions.length ? `
        <ul class="ex-list">${suggestions.map((x) => suggestionItem(x, `
          <div class="ex-actions">
            <div class="pk-more">
              ${btn('detail', `data-id="${x.ex.id}"`, `Om ${esc(x.ex.name)}`, ICON.info)}
              ${btn('s-queue', `data-id="${x.ex.id}"`, `Lägg ${esc(x.ex.name)} i kön`, ICON.plus)}
            </div>
          </div>`, `data-action="s-go" data-id="${x.ex.id}"`)).join('')}</ul>`
        : '<p class="empty">Inga fler övningar passar. Välj en annan typ, fler muskelgrupper eller mer utrustning.</p>'}
      </div>
      ${rehabSuggestions(w.place, [...queueIds, ...done.map((d) => d.exId), ...suggestions.map((x) => x.ex.id)]).map(([area, list]) => `
        <div><h3 class="pk-title">Fysio för ${AREAS[area].the}</h3>
        <ul class="ex-list">${list.map((ex) => suggestionItem({ ex, reason: `Stärker och avlastar ${AREAS[area].the}` }, actions(ex), `data-action="s-go" data-id="${ex.id}"`)).join('')}</ul></div>`).join('')}
      <button class="btn secondary" data-action="any-exercise">Välj övningar från listan</button>
      ${done.length ? `<div><h3 class="pk-title">Kört idag</h3>${todaySummary(done)}</div>` : ''}
      ${sessionBodyCard(w)}
    </div>
    <div id="rest" class="rest" hidden></div>`;
  mountFigures(root);
  updateTimers();
}

/** Styrkeövningar med reps anges som antal set, reps och vikt, i stället för set för set. */
const simpleSets = (ex) => !ex.timed && !ex.distance;
const sidesOf = (ex) => (ex.unilateral ? ['H', 'V'] : ['']);
/** Seten för en sida: 'H', 'V' eller '' för övningar med båda benen. */
const sideSets = (sets, side) => sets.filter((x) => (x.side ?? '') === side);
const doneCount = (list) => list.filter((x) => x.done).length;
/** Antal set i rad som är klara; för enbensövningar räknas den sida som kommit längst. */
const doneRounds = (ex, item) => Math.max(...sidesOf(ex).map((side) => doneCount(sideSets(item.sets, side))));
const roundCount = (ex, item) => Math.max(...sidesOf(ex).map((side) => sideSets(item.sets, side).length));

/** Ändrar antalet set för en sida. Klara set tas aldrig bort. Enbensövningar läggs H, V, H, V … */
function setSideCount(ex, item, side, n) {
  const lists = Object.fromEntries(sidesOf(ex).map((x) => [x, sideSets(item.sets, x)]));
  const list = lists[side];
  n = Math.min(20, Math.max(1, doneCount(list), n));
  while (list.length < n) {
    const last = list[list.length - 1];
    list.push({ reps: last?.reps ?? ex.defaultReps, weight: last?.weight ?? 0, done: false, ...(side ? { side } : {}) });
  }
  while (list.length > n) list.splice(list.findLastIndex((x) => !x.done), 1);
  const max = Math.max(...Object.values(lists).map((l) => l.length));
  item.sets = [...Array(max)].flatMap((_, i) => Object.values(lists).map((l) => l[i]).filter(Boolean));
}

/** Formuläret för en styrkeövning: set, reps och vikt, en gång per ben för enbensövningar. */
function setsForm(ex, item) {
  const weighted = ex.equipment !== 'none';
  const rounds = roundCount(ex, item);
  const done = doneRounds(ex, item);
  const blocks = sidesOf(ex).map((side) => {
    const list = sideSets(item.sets, side);
    const first = list[0] ?? { reps: ex.defaultReps, weight: 0 };
    const leg = side === 'H' ? 'höger ben' : side === 'V' ? 'vänster ben' : '';
    const label = (what) => `${what}${leg ? `, ${leg}` : ''}`;
    return `
      <div class="set-form${doneCount(list) >= list.length ? ' done' : ''}">
        ${side ? `<h3 class="sf-side"><span class="side">${side}</span>${side === 'H' ? 'Höger' : 'Vänster'} ben</h3>` : ''}
        <div class="sf-row"><span>Set</span>
          <div class="stepper">
            <button data-action="snum" data-side="${side}" data-d="-1" aria-label="${label('Färre set')}">−</button>
            <b>${list.length}</b>
            <button data-action="snum" data-side="${side}" data-d="1" aria-label="${label('Fler set')}">+</button>
          </div></div>
        <div class="sf-row"><span>Reps</span>
          <div class="stepper">
            <button data-action="sreps" data-side="${side}" data-d="-1" aria-label="${label('Färre reps')}">−</button>
            <b>${first.reps} st</b>
            <button data-action="sreps" data-side="${side}" data-d="1" aria-label="${label('Fler reps')}">+</button>
          </div></div>
        ${weighted ? `<div class="sf-row"><span>Vikt</span>
          <label class="kg"><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${first.weight ? fmtNum(first.weight, 2) : ''}" data-input="sweight" data-side="${side}" aria-label="${label('Vikt')}"><span>kg</span></label></div>` : ''}
      </div>`;
  }).join('');
  return `
    <div class="sets">${blocks}</div>
    <button class="btn ${done >= rounds ? 'secondary' : 'primary'} set-next" data-action="set-done" ${done >= rounds ? 'disabled' : ''}>
      ${done >= rounds ? `${ICON.check} Alla ${rounds} set klara` : `${ICON.check} Set ${done + 1} av ${rounds} klart`}</button>
    ${done ? `<button class="btn-text add-set" data-action="set-undo">Ångra senaste set</button>` : ''}`;
}

function setRow(ex, s, k) {
  return `
    <div class="set ${s.done ? 'done' : ''}">
      ${s.side ? `<button class="side" data-action="side" data-k="${k}" aria-label="Set ${k + 1}, ${s.side === 'H' ? 'höger' : 'vänster'} ben. Tryck för att byta">${s.side}</button>` : `<span class="set-no">${k + 1}</span>`}
      ${ex.distance ? `
        <label class="kg wide"><input type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${s.dist || ''}" data-input="dist" data-k="${k}" aria-label="Meter set ${k + 1}"><span>m</span></label>`
      : ex.equipment !== 'none' && !ex.timed ? `
        <label class="kg"><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${s.weight ? fmtNum(s.weight, 2) : ''}" data-input="weight" data-k="${k}" aria-label="Vikt set ${k + 1}"><span>kg</span></label>` : ''}
      <div class="stepper">
        <button data-action="reps" data-k="${k}" data-d="-1" aria-label="Minska">−</button>
        <b id="reps-${k}">${fmtAmount(ex, s.reps)}</b>
        <button data-action="reps" data-k="${k}" data-d="1" aria-label="Öka">+</button>
      </div>
      <button class="check" data-action="toggle-set" data-k="${k}" aria-pressed="${s.done}" aria-label="Set ${k + 1} klart">${ICON.check}</button>
    </div>`;
}

function goTo(index) {
  const w = data.active;
  if (index < 0) return;
  if (index >= w.items.length || w.picking) { if (!w.picking) openPicker(); return; }
  w.index = index;
  w.snap = JSON.stringify(w.items[index].sets);
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

function finishWorkout() {
  const w = data.active;
  const entries = warmupFirst(w.items)
    .map((it) => ({ exId: it.exId, ...(it.warmup ? { warmup: true } : {}), sets: it.sets.filter((s) => s.done).map(({ reps, weight, side, dist }) => ({
      reps, weight: Number(weight) || 0, ...(BY_ID[it.exId]?.timed ? { sec: true } : {}), ...(dist > 0 ? { dist } : {}), ...(side ? { side } : {}) })) }))
    .filter((e) => e.sets.length);
  if (entries.length) {
    data.sessions.push({ id: uid(), place: w.place, date: new Date(w.start).toISOString(), entries });
  }
  const place = w.place;
  data.active = null;
  // Gympass avslutas alltid med stretch. Passet är redan sparat; omdömet visas när stretchen är klar.
  if (place === 'gym' && entries.length) {
    const ids = buildStretch(entries.filter((e) => !e.warmup).map((e) => e.exId));
    const steps = [{ kind: 'rest', sec: 10, label: 'Passet är sparat. Dags att stretcha' }, ...stretchSteps(ids)];
    data.active = { mode: 'interval', place, type: 'stretch', feedbackFor: data.sessions[data.sessions.length - 1].id,
      start: Date.now(), steps, index: 0, endsAt: Date.now() + 10000, paused: null, done: [] };
    save();
    regenerate(place);
    renderRunner();
    return;
  }
  save();
  closeWorkout();
  regenerate(place);
  if (entries.length) ui.tab = 'log';
  render();
  if (entries.length) showFeedback(data.sessions[data.sessions.length - 1]);
}

/** Visar PT:ns omdöme för ett nyss sparat pass. */
function showFeedback(session) {
  const before = data.sessions.filter((x) => x !== session && new Date(x.date) < new Date(session.date));
  const fb = session.type === 'balance' ? balanceFeedback({ minutes: minutesOf(session), before })
    : session.type && session.type !== 'strength'
    ? cardioFeedback({ minutes: minutesOf(session), kind: TYPES[session.type].name.toLowerCase(), before, swims: data.swims })
    : workoutFeedback({ session, before, swims: data.swims, walks: data.walks, pain: data.settings.pain });
  openSheet(feedbackSheet(fb));
}

function feedbackSheet(fb) {
  return `
    <div class="feedback">
      <div class="fb-badge">💪</div>
      <h2>${esc(fb.title)}</h2>
      <ul class="fb-list">${fb.highlights.map((h) => `<li><span class="fb-icon">${h.icon}</span><span>${esc(h.text)}</span></li>`).join('')}</ul>
      <div class="card fb-tip"><b>Till nästa gång</b><p>${esc(fb.tip)}</p></div>
      <button class="btn primary big" data-action="close-sheet">Tack!</button>
    </div>`;
}

function endWorkoutDialog() {
  if (data.active.type === 'stretch') {
    confirmDialog({
      title: 'Hoppa över stretchen?',
      message: 'Passet är redan sparat. Stretch efter passet hjälper musklerna att slappna av.',
      buttons: [
        { label: 'Avsluta', style: 'primary', onClick: finishInterval },
        { label: 'Fortsätt stretcha', style: 'secondary' },
      ],
    });
    return;
  }
  const interval = data.active.mode === 'interval';
  const done = interval ? data.active.done.length : data.active.items.reduce((n, it) => n + it.sets.filter((s) => s.done).length, 0);
  confirmDialog({
    title: 'Avsluta passet?',
    message: interval ? `Du har klarat ${done} ${done === 1 ? 'övning' : 'övningar'}.` : `Du har klarat ${done} set.`,
    buttons: [
      { label: 'Spara och avsluta', style: 'primary', onClick: interval ? finishInterval : finishWorkout },
      { label: 'Släng passet', style: 'danger', onClick: () => { data.active = null; save(); closeWorkout(); render(); } },
      { label: 'Fortsätt träna', style: 'secondary' },
    ],
  });
}

// Timer för total tid och vila
function fmtClock(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function updateTimers() {
  const w = data.active;
  if (!w || w.mode === 'interval') return;
  const elapsed = $('#elapsed');
  if (elapsed) elapsed.textContent = fmtClock(Math.floor((Date.now() - w.start) / 1000));

  const rest = $('#rest');
  if (!rest) return;
  let html = '';
  let cls = 'rest';
  if (w.restEnd) {
    const remaining = Math.ceil((w.restEnd - Date.now()) / 1000);
    if (remaining > 0) {
      html = `<span>⏱</span><b>Vila ${remaining} s</b><span class="grow"></span>
        <button data-action="rest-add">+15 s</button><button data-action="rest-skip">Hoppa över</button>`;
    } else {
      if (!w.restBeeped) { w.restBeeped = true; save(); beep(); }
      cls = 'rest go';
      html = `<span>🔔</span><b>Dags för nästa set!</b><span class="grow"></span><button data-action="rest-skip">OK</button>`;
    }
  }
  rest.hidden = !html;
  rest.className = cls;
  if (rest.dataset.html !== html) { rest.innerHTML = html; rest.dataset.html = html; }
}
setInterval(updateTimers, 500);

let audioCtx = null;
function unlockAudio() {
  try { audioCtx ??= new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch { /* inget ljud */ }
}
function tone(freq, dur) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}
function beep() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  for (const offset of [0, 0.22]) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.3, t + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.2);
  }
}

// Håll skärmen tänd under passet (där webbläsaren stöder det)
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* stöds inte – ingen fara */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && data.active) { keepAwake(true); updateTimers(); tickRunner(); }
});

// ---------------------------------------------------------------------------
// Händelser
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const place = ui.tab;
  const k = Number(t.dataset.k);
  const w = data.active;

  switch (t.dataset.action) {
    case 'tab': {
      const to = t.dataset.tab;
      if (to === 'activity' && !SUB.has(ui.tab)) ui.actBack = ui.tab;
      if (SUB.has(to) && !SUB.has(ui.tab)) {
        ui.back = ui.tab;
        if (to !== 'swim') ui.type[to] = 'strength';
      }
      ui.tab = to; render(); window.scrollTo(0, 0); break;
    }

    // Steg
    case 'steps-new':
      openSheet(stepsSheet(t.dataset.date)); break;
    case 'steps-delete':
      delete data.steps[t.dataset.date]; save(); closeSheet(); render(); break;

    // Simma
    case 'swim-toggle': {
      const b = ui.plans.swim[Number(t.dataset.index)];
      b.done = !b.done;
      if (b.done && !ui.swimStart) ui.swimStart = Date.now();
      render();
      break;
    }
    case 'act': {
      const kind = t.dataset.kind;
      if (ui.tab !== 'activity' && !SUB.has(ui.tab)) ui.actBack = ui.tab;
      if (kind === 'walk') { openSheet(walkSheet()); break; }
      ui.back = ui.tab === 'activity' ? 'activity' : SUB.has(ui.tab) ? ui.back : ui.tab;
      if (kind === 'swim') { ui.tab = 'swim'; render(); window.scrollTo(0, 0); break; }
      if (ui.cardio.kind !== kind) { ui.cardio.kind = kind; ui.cardio.plan = null; }
      ui.tab = 'cardio'; render(); window.scrollTo(0, 0); break;
    }
    case 'c-min': ui.cardio.minutes = Number(t.dataset.value); regenerateCardio(); render(); break;
    case 'c-new': regenerateCardio(); render(); break;
    case 'c-toggle': {
      const b = ui.cardio.plan[Number(t.dataset.index)];
      b.done = !b.done;
      if (b.done && !ui.cardio.start) ui.cardio.start = Date.now();
      render(); break;
    }
    case 'c-save': openSheet(cardioSheet(ui.cardio.kind, true)); break;
    case 'cardio-log': openSheet(cardioSheet(null, false)); break;
    case 'cardio': openSheet(cardioDetailSheet(data.cardio.find((x) => x.id === t.dataset.id))); break;
    case 'delete-cardio':
      confirmDialog({ title: 'Radera passet?', buttons: [
        { label: 'Radera', style: 'danger', onClick: () => { data.cardio = data.cardio.filter((x) => x.id !== t.dataset.id); save(); closeSheet(); render(); } },
        { label: 'Avbryt' }] });
      break;
    case 'swim-save':
      openSheet(swimSheet(true)); break;
    case 'swim-log':
      openSheet(swimSheet(false)); break;
    case 'swim':
      openSheet(swimDetailSheet(data.swims.find((x) => x.id === t.dataset.id))); break;
    case 'delete-swim':
      confirmDialog({ title: 'Radera simpasset?', buttons: [
        { label: 'Radera', style: 'danger', onClick: () => { data.swims = data.swims.filter((x) => x.id !== t.dataset.id); save(); closeSheet(); render(); } },
        { label: 'Avbryt' }] });
      break;

    case 'minutes':
      ui.minutes[place] = Number(t.dataset.value); regenerate(place); render(); break;
    case 'regenerate':
      regenerate(place); render(); break;
    case 'swap': {
      const plan = ui.plans[place];
      const i = Number(t.dataset.index);
      const next = replacement(plan[i].exId, plan.map((p) => p.exId), place, exOpts(place));
      if (next) { plan[i] = { exId: next.id, sets: next.sets }; render(); }
      else toast('Ingen annan övning för den muskelgruppen');
      break;
    }
    case 'remove':
      ui.plans[place].splice(Number(t.dataset.index), 1); render(); break;
    case 'start':
      unlockAudio();
      if (ui.type[place] !== 'strength') startInterval(place); else startWorkout(place);
      break;
    case 'ptype':
      ui.type[place] = t.dataset.value;
      if (place === 'home' && !LENGTH_OPTIONS.home.includes(ui.minutes.home)) ui.minutes.home = 15;
      regenerate(place); render(); break;
    case 'iswap': {
      const plan = ui.iplans[place];
      const i = Number(t.dataset.index);
      const used = plan.stations.map((x) => x.exId);
      const next = plan.type === 'balance' ? balanceSwap(used[i], used, place, exOpts(place)) : replacement(used[i], used, place, exOpts(place));
      if (next && !(next.props || []).includes('barbell') && next.id !== 'bike') { plan.stations[i] = { exId: next.id }; render(); }
      else toast('Ingen annan övning för den muskelgruppen');
      break;
    }
    case 'iremove':
      ui.iplans[place].stations.splice(Number(t.dataset.index), 1); render(); break;
    case 'run-pause': {
      unlockAudio();
      const a = data.active;
      if (a.paused != null) { a.endsAt = Date.now() + a.paused * 1000; a.paused = null; }
      else a.paused = runLeft(a);
      save(); renderRunner(); break;
    }
    case 'run-done': unlockAudio(); runAdvance(true); break;
    case 'run-skip': unlockAudio(); runAdvance(false); break;
    case 'run-prev': runGo(data.active.index - 1); break;
    case 'pain': {
      data.settings.pain = { ...data.settings.pain, [t.dataset.area]: Number(t.dataset.level) };
      data.settings.painUpdated = new Date().toISOString();
      data.settings.kneeFriendly = data.settings.pain.knees > 0;
      save();
      for (const pl of ['gym', 'home']) ui.iplans[pl] = null;
      const box = t.closest('.pain-box');
      if (box) box.outerHTML = painSelector(box.dataset.areas.split(','));
      if (!data.active) render();
      else if (data.active.picking) renderWorkout();
      break;
    }
    case 'rehab-start': {
      unlockAudio();
      const ids = rehabSuggestions('home', [], 3).flatMap(([, list]) => list.map((ex) => ex.id));
      const items = newItems([...new Set(ids)].map((exId) => ({ exId, sets: BY_ID[exId].sets })));
      data.active = { place: 'home', start: Date.now(), index: 0, restEnd: null, restBeeped: false,
        gear: ['body'], groups: [], picking: false, items };
      save(); openWorkout(); break;
    }
    case 'fav': {
      const pl = t.dataset.place;
      const id = t.dataset.id;
      data.favorites[pl] = isFavorite(pl, id) ? data.favorites[pl].filter((x) => x !== id) : [...(data.favorites[pl] ?? []), id];
      save();
      t.setAttribute('aria-pressed', String(isFavorite(pl, id)));
      if (!data.active) ui.plans[pl] = null; // Gym/Hemma visar de nya favoriterna nästa gång
      break;
    }
    case 'detail':
      openSheet(detailSheet(BY_ID[t.dataset.id])); break;
    case 'library':
      openSheet(librarySheet(place)); break;
    case 'close-sheet':
      closeSheet(); break;
    case 'guide':
      openSheet(guideSheet()); break;

    // Logg
    case 'manual-new':
      ui.manual = { date: dayKey(new Date()), place: 'gym', items: [] };
      openSheet(manualMain()); break;
    case 'm-place': ui.manual.place = t.dataset.value; sheetBody(manualMain()); break;
    case 'm-warmup': {
      const it = ui.manual.items[Number(t.dataset.i)];
      it.warmup = !it.warmup;
      ui.manual.items = warmupFirst(ui.manual.items);
      sheetBody(manualMain()); break;
    }
    case 'edit-session': {
      const s = data.sessions.find((x) => x.id === t.dataset.id);
      if (!s) break;
      ui.manual = { editId: s.id, date: dayKey(new Date(s.date)), place: s.place === 'home' ? 'home' : 'gym',
        items: s.entries.filter((e) => BY_ID[e.exId]).map((e) => ({ exId: e.exId, warmup: !!e.warmup, sets: e.sets.map((x) => ({ ...x })) })) };
      sheetBody(manualMain()); break;
    }
    case 'm-remove': ui.manual.items.splice(Number(t.dataset.i), 1); sheetBody(manualMain()); break;
    case 'm-side': {
      const set = ui.manual.items[Number(t.dataset.i)].sets[k];
      set.side = flip(set.side);
      sheetBody(manualMain()); break;
    }
    case 'm-addset': {
      const sets = ui.manual.items[Number(t.dataset.i)].sets;
      const prev = sets[sets.length - 1] ?? { reps: 10, weight: 0 };
      sets.push({ ...prev, ...(prev.side ? { side: flip(prev.side) } : {}) });
      sheetBody(manualMain()); break;
    }
    case 'm-unset': ui.manual.items[Number(t.dataset.i)].sets.splice(k, 1); sheetBody(manualMain()); break;
    case 'm-pick-open': openPick('manual'); break;
    case 'm-pick-close': sheetBody(manualMain()); break;
    case 'm-save': saveManual(); break;
    case 'any-exercise': openPick('workout'); break;
    case 'setup-any': openPick('setup'); break;
    case 'pick-toggle': {
      const sel = ui.pick.selected;
      const id = t.dataset.id;
      const on = !sel.includes(id);
      if (on) sel.push(id); else sel.splice(sel.indexOf(id), 1);
      t.setAttribute('aria-pressed', on);
      const done = $('#pick-done');
      done.disabled = !sel.length;
      done.textContent = pickDoneLabel();
      break;
    }
    case 'pick-done': finishPick(); break;
    case 'c-open': ui.pick.creating = true; $('#pick-list').innerHTML = pickList(); mountFigures($('#pick-list')); $('#c-name')?.focus(); break;
    case 'c-cancel': ui.pick.creating = false; $('#pick-list').innerHTML = pickList(); mountFigures($('#pick-list')); break;
    case 'c-create': {
      const name = $('#c-name').value.trim();
      if (!name) { toast('Skriv ett namn'); break; }
      const def = { id: `c-${uid()}`, name, muscles: [$('#c-group').value], gear: $('#c-gear').value, timed: $('#c-timed').checked, unilateral: $('#c-uni').checked };
      data.customExercises.push(def);
      save();
      addCustomExercise(def);
      ui.pick.selected.push(def.id);
      ui.pick.creating = false;
      ui.pick.query = '';
      sheetBody(pickPane());
      toast(`${name} är skapad och förbockad`);
      break;
    }
    case 'walk-new':
      openSheet(walkSheet()); break;
    case 'walk-quick':
      $('#walk-form [name=minutes]').value = t.dataset.min; break;
    case 'session':
      openSheet(sessionSheet(data.sessions.find((s) => s.id === t.dataset.id))); break;
    case 'walk':
      openSheet(walkDetailSheet(data.walks.find((x) => x.id === t.dataset.id))); break;
    case 'delete-session':
      confirmDialog({ title: 'Radera passet?', message: 'Det går inte att ångra.', buttons: [
        { label: 'Radera', style: 'danger', onClick: () => { data.sessions = data.sessions.filter((s) => s.id !== t.dataset.id); save(); closeSheet(); render(); } },
        { label: 'Avbryt' }] });
      break;
    case 'delete-walk':
      confirmDialog({ title: 'Radera promenaden?', buttons: [
        { label: 'Radera', style: 'danger', onClick: () => { data.walks = data.walks.filter((x) => x.id !== t.dataset.id); save(); closeSheet(); render(); } },
        { label: 'Avbryt' }] });
      break;

    // Inställningar
    case 'theme-mode': data.settings.themeMode = t.dataset.value; save(); render(); break;
    case 'theme-accent': data.settings.themeAccent = t.dataset.value; save(); render(); break;
    case 'rest-step':
      data.settings.restSeconds = Math.min(300, Math.max(15, data.settings.restSeconds + Number(t.dataset.d))); save(); render(); break;
    case 'goal-step':
      data.settings.stepGoal = Math.min(30000, Math.max(1000, data.settings.stepGoal + Number(t.dataset.d))); save(); render(); break;
    case 'export': {
      const blob = new Blob([exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `minpt-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      break;
    }
    case 'reset':
      confirmDialog({ title: 'Radera all data?', message: 'Alla pass och promenader tas bort från telefonen.', buttons: [
        { label: 'Radera allt', style: 'danger', onClick: () => { resetAll(); ensurePain(); resetPlans(); render(); toast('All data raderad'); } },
        { label: 'Avbryt' }] });
      break;

    // Pågående pass
    case 'end': endWorkoutDialog(); break;
    case 'finish': finishWorkout(); break;
    case 'next': goTo(w.index + 1); break;
    case 'pick': openPicker(); break;
    case 'ex-done': {
      // Klar: övningen flyttas till Slutfört. Har man inte bockat av något set räknas alla set som gjorda.
      const it = w.items[w.index];
      delete it.fresh;
      if (!doneSets(it)) for (const x of it.sets) x.done = true;
      openPicker(); break;
    }
    case 'ex-cancel': {
      const it = w.items[w.index];
      // Avbryt: det du ändrat sedan övningen öppnades sparas inte. En nyvald övning tas bort helt.
      const before = w.snap ? JSON.parse(w.snap) : it.sets.map((x) => ({ ...x, done: false }));
      const lost = doneSets(it) - before.filter((x) => x.done).length;
      const cancel = () => {
        if (it.fresh) w.items.splice(w.index, 1);
        else it.sets = before;
        if (lost > 0) w.restEnd = null;
        w.index = Math.max(0, w.items.filter((x) => doneSets(x)).length - 1);
        openPicker();
      };
      if (lost <= 0) cancel();
      else confirmDialog({ title: 'Avbryta övningen?', message: `${lost === 1 ? 'Setet' : `De ${lost} set`} du gjort på ${BY_ID[it.exId].name.toLowerCase()} sparas inte.`, buttons: [
        { label: 'Avbryt övningen', style: 'danger', onClick: cancel },
        { label: 'Fortsätt', style: 'secondary' }] });
      break;
    }
    case 'pain-sheet': openSheet(painSheet(BY_ID[w.items[w.index].exId])); break;
    case 'pain-swap': {
      closeSheet();
      const it = w.items[w.index];
      if (!doneSets(it) && !BY_ID[it.exId].physio) w.items.splice(w.index, 1);
      w.index = Math.max(0, w.items.filter((x) => doneSets(x)).length - 1);
      openPicker(); break;
    }
    case 'pk-back': w.picking = false; save(); renderWorkout(); break;
    case 'q-go': delete w.items[k].fresh; delete w.items[k].preview; runItem(w, w.items[k]); break;
    // Vald under Lägg till övning: visas utan set och reps, och Lägg till lägger den i kön.
    case 's-go': runItem(w, { ...newItem(t.dataset.id), fresh: true, preview: true }); break;
    case 'ex-add': {
      const it = w.items[w.index];
      delete it.fresh;
      delete it.preview;
      toast('Lagd i kön');
      openPicker(); break;
    }
    case 'w-go': {
      // Vald som uppvärmning, även om man redan kört andra övningar.
      const it = { ...newItem(t.dataset.id), fresh: true, warmup: true };
      if (inMinutes(BY_ID[it.exId])) for (const x of it.sets) x.reps = 300;
      runItem(w, it); break;
    }
    case 'body-muscle': openSheet(muscleSheet(t.dataset.muscle)); break;
    case 'body-view': w.bodyView = t.dataset.value; save(); renderWorkout(); break;
    case 'bm-go': {
      closeSheet();
      const i = queueIndexes(w).find((j) => w.items[j].exId === t.dataset.id);
      runItem(w, i != null ? w.items[i] : { ...newItem(t.dataset.id), fresh: true }); break;
    }
    case 'bm-queue': closeSheet(); w.items.push(newItem(t.dataset.id)); save(); renderWorkout(); toast('Lagd i kön'); break;
    case 's-queue': w.items.push(newItem(t.dataset.id)); save(); renderWorkout(); toast('Lagd i kön'); break;
    case 'add-open': w.adding = true; save(); renderWorkout(); $('#wk-body').scrollTop = 0; break;
    case 'add-close': w.adding = false; save(); renderWorkout(); $('#wk-body').scrollTop = 0; break;
    case 'd-go': delete w.items[k].fresh; w.index = k; w.snap = JSON.stringify(w.items[k].sets); w.picking = false; w.adding = false; save(); renderWorkout(); $('#wk-body').scrollTop = 0; break;
    case 'wtype': w.stype = t.dataset.value; save(); renderWorkout(); break;
    case 'skip-warm': w.skipWarm = true; save(); renderWorkout(); break;
    case 'q-up': {
      const qi = queueIndexes(w);
      const p = qi.indexOf(k);
      if (p > 0) [w.items[qi[p - 1]], w.items[k]] = [w.items[k], w.items[qi[p - 1]]];
      save(); renderWorkout(); break;
    }
    case 'q-remove': {
      w.items.splice(k, 1);
      if (w.index >= k && w.index > 0) w.index--;
      save(); renderWorkout(); break;
    }
    case 'wgear': w.gear = toggle(w.gear, t.dataset.value); save(); renderWorkout(); break;
    case 'wgroup': w.groups = toggle(w.groups, t.dataset.value); save(); renderWorkout(); break;
    case 'gear': setPref('gear', place, toggle(gearFor(place), t.dataset.value)); if (ui.type[place] !== 'strength') regenerate(place); render(); break;
    case 'group': setPref('groups', place, toggle(groupsFor(place), t.dataset.value)); render(); break;
    case 'prev': goTo(w.index - 1); break;
    case 'reps': {
      const item = w.items[w.index];
      const ex = BY_ID[item.exId];
      const step = inMinutes(ex) ? 60 : ex.timed ? 5 : 1;
      const s = item.sets[k];
      s.reps = Math.min(inMinutes(ex) ? 7200 : 300, Math.max(1, s.reps + Number(t.dataset.d) * step));
      $(`#reps-${k}`).textContent = fmtAmount(ex, s.reps);
      save();
      break;
    }
    case 'toggle-set': {
      unlockAudio();
      const s = w.items[w.index].sets[k];
      s.done = !s.done;
      // Ingen vila efter uppvärmningen.
      if (s.done && !w.items[w.index].warmup) { w.restEnd = Date.now() + data.settings.restSeconds * 1000; w.restBeeped = false; }
      save();
      const row = t.closest('.set');
      row.classList.toggle('done', s.done);
      t.setAttribute('aria-pressed', s.done);
      updateTimers();
      break;
    }
    case 'wk-warmup': {
      const it = w.items[w.index];
      it.warmup = !it.warmup;
      save(); renderWorkout(); break;
    }
    case 'side': {
      const set = w.items[w.index].sets[k];
      set.side = flip(set.side);
      save(); renderWorkout(); break;
    }
    case 'snum': {
      const item = w.items[w.index];
      const ex = BY_ID[item.exId];
      const side = t.dataset.side;
      setSideCount(ex, item, side, sideSets(item.sets, side).length + Number(t.dataset.d));
      save(); renderWorkout(); break;
    }
    case 'sreps': {
      const list = sideSets(w.items[w.index].sets, t.dataset.side);
      const reps = Math.min(300, Math.max(1, (list[0]?.reps ?? 10) + Number(t.dataset.d)));
      for (const x of list) x.reps = reps;
      save(); renderWorkout(); break;
    }
    case 'set-done': {
      // Markerar nästa set som klart, för båda benen på en gång om det är en enbensövning.
      unlockAudio();
      const item = w.items[w.index];
      const ex = BY_ID[item.exId];
      const round = doneRounds(ex, item);
      let marked = false;
      for (const side of sidesOf(ex)) {
        const list = sideSets(item.sets, side);
        const next = doneCount(list) <= round ? list.find((x) => !x.done) : null;
        if (next) { next.done = true; marked = true; }
      }
      if (marked && !item.warmup) { w.restEnd = Date.now() + data.settings.restSeconds * 1000; w.restBeeped = false; }
      save(); renderWorkout(); break;
    }
    case 'set-undo': {
      const item = w.items[w.index];
      const ex = BY_ID[item.exId];
      const round = doneRounds(ex, item);
      for (const side of sidesOf(ex)) {
        const list = sideSets(item.sets, side);
        if (doneCount(list) === round) list.findLast((x) => x.done).done = false;
      }
      save(); renderWorkout(); break;
    }
    case 'add-set': {
      const sets = w.items[w.index].sets;
      const prev = sets[sets.length - 1];
      sets.push({ reps: prev?.reps ?? 10, weight: prev?.weight ?? 0, done: false, ...(prev?.side ? { side: flip(prev.side) } : {}) });
      save();
      renderWorkout();
      break;
    }
    case 'rest-add': w.restEnd += 15000; save(); updateTimers(); break;
    case 'rest-skip': w.restEnd = null; save(); updateTimers(); break;
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  switch (t.dataset.change) {
    case 'focus':
      ui.focus[ui.tab] = t.value; regenerate(ui.tab); render(); break;
    case 'swim-focus':
      ui.focus.swim = t.value; regenerate('swim'); render(); break;
    case 'c-focus':
      ui.cardio.focus = t.value; regenerateCardio(); render(); break;
    case 'c-kind-pick':
      $('#c-km-row').classList.toggle('hidden', !ACTS[t.value].km);
      $('#c-name-row').classList.toggle('hidden', t.value !== 'other');
      break;
    case 'swim-style':
      ui.swimStyle = t.value; regenerate('swim'); render(); break;
    case 'stats-ex': ui.statsEx = t.value; render(); break;
    case 'steps-date':
      if (t.value) openSheet(stepsSheet(t.value));
      break;
    case 'knee':
      data.settings.kneeFriendly = t.checked; save();
      ui.plans.gym = null; ui.iplans.gym = null;
      ui.plans.home = null; ui.iplans.home = null;
      break;
    case 'import': {
      const file = t.files?.[0];
      if (!file) break;
      file.text().then((text) => {
        importJSON(text);
        for (const c of data.customExercises) addCustomExercise(c);
        ensurePain();
        resetPlans();
        render();
        toast('Säkerhetskopian är importerad');
      }).catch(() => toast('Kunde inte läsa filen'));
      break;
    }
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.input === 'sweight' && data.active) {
    const v = parseFloat(String(t.value).replace(/\s/g, '').replace(',', '.'));
    for (const x of sideSets(data.active.items[data.active.index].sets, t.dataset.side)) x.weight = Number.isFinite(v) && v > 0 ? v : 0;
    save();
  } else if ((t.dataset.input === 'weight' || t.dataset.input === 'dist') && data.active) {
    const v = parseFloat(String(t.value).replace(/\s/g, '').replace(',', '.'));
    const ok = Number.isFinite(v) && v > 0;
    data.active.items[data.active.index].sets[Number(t.dataset.k)][t.dataset.input] = ok ? (t.dataset.input === 'dist' ? Math.round(v) : v) : 0;
    save();
  } else if (t.dataset.minput && ui.manual) {
    const v = t.dataset.minput;
    if (v === 'date') ui.manual[v] = t.value;
    else {
      const i = Number(t.dataset.i);
      const k = Number(t.dataset.k);
      const sets = ui.manual.items[i].sets;
      const n = parseFloat(String(t.value).replace(/\s/g, '').replace(',', '.'));
      const old = sets[k][v];
      const mins = v === 'reps' && inMinutes(BY_ID[ui.manual.items[i].exId]);
      const value = Number.isFinite(n) && n > 0 ? (v === 'reps' ? Math.round(mins ? n * 60 : n) : v === 'dist' ? Math.round(n) : n) : 0;
      sets[k][v] = value;
      // Följande set som hade samma värde följer med, så att man bara behöver skriva en gång.
      for (let j = k + 1; j < sets.length && sets[j][v] === old; j++) {
        sets[j][v] = value;
        const input = $(`[data-minput="${v}"][data-i="${i}"][data-k="${j}"]`);
        if (input) input.value = value ? (v === 'dist' ? value : fmtNum(mins ? value / 60 : value, 2)) : '';
      }
    }
  } else if (t.dataset.input === 'pick-search') {
    ui.pick.query = t.value;
    ui.pick.creating = false;
    $('#pick-list').innerHTML = pickList();
    mountFigures($('#pick-list'));
  } else if (t.dataset.input === 'search') {
    $('#lib-list').innerHTML = libraryList(ui.tab, t.value);
    mountFigures($('#lib-list'));
  }
});

function setPref(key, place, value) {
  data.settings[key] = { ...(data.settings[key] || {}), [place]: value };
  save();
}

const parseCount = (v) => parseInt(String(v || '').replace(/[\s.,]/g, ''), 10);

const FORMS = {
  'walk-form'(f) {
    const km = parseFloat(String(f.get('km') || '').replace(',', '.'));
    data.walks.push({ id: uid(), date: parseDate(f.get('date')).toISOString(), minutes: Number(f.get('minutes')), km: Number.isFinite(km) && km > 0 ? km : null });
    toast('Promenaden sparad 🚶');
  },
  'steps-form'(f) {
    const n = parseCount(f.get('steps'));
    if (Number.isFinite(n) && n > 0) data.steps[f.get('date')] = Math.min(n, 200000);
    else delete data.steps[f.get('date')];
    toast('Stegen sparade 👣');
  },
  'swim-form'(f) {
    const meters = parseCount(f.get('meters'));
    data.swims.push({
      id: uid(),
      date: parseDate(f.get('date')).toISOString(),
      minutes: Number(f.get('minutes')),
      meters: Number.isFinite(meters) && meters > 0 ? meters : null,
      style: f.get('style'),
    });
    if (f.get('fromPlan')) { regenerate('swim'); ui.tab = 'log'; }
    toast('Simpasset sparat 🏊');
  },
  'cardio-form'(f) {
    const kind = CARDIO_IDS.includes(f.get('kind')) ? f.get('kind') : 'other';
    const km = parseFloat(String(f.get('km') || '').replace(',', '.'));
    const name = String(f.get('name') || '').trim();
    const entry = { id: uid(), date: parseDate(f.get('date')).toISOString(), kind, minutes: Number(f.get('minutes')),
      ...(ACTS[kind].km && Number.isFinite(km) && km > 0 ? { km } : {}), ...(kind === 'other' && name ? { name } : {}) };
    const before = [...data.swims, ...data.cardio];
    data.cardio.push(entry);
    if (f.get('fromPlan')) { regenerateCardio(); ui.tab = 'log'; }
    ui.after = () => openSheet(feedbackSheet(cardioFeedback({ minutes: entry.minutes, km: entry.km, kind: actName(entry).toLowerCase(), before: data.sessions, swims: before })));
  },
};

document.addEventListener('submit', (e) => {
  const handler = FORMS[e.target.id];
  if (!handler) return;
  e.preventDefault();
  handler(new FormData(e.target));
  save();
  closeSheet();
  render();
  // T.ex. PT:ns omdöme efter ett sparat konditionspass.
  if (ui.after) { const fn = ui.after; ui.after = null; setTimeout(fn, 250); }
});

// Avläsning av diagram: tryck (mobil) eller hovra (dator) på en markering.
function showTip(e) {
  const hit = e.target.closest?.('[data-tip]');
  if (!hit) return;
  const card = hit.closest('.chart-card');
  const out = card?.querySelector('.readout');
  if (!out) return;
  out.textContent = hit.dataset.tip;
  out.classList.add('on');
  card.querySelectorAll('.hit.active').forEach((x) => x.classList.remove('active'));
  hit.classList.add('active');
}
document.addEventListener('click', showTip);
document.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') showTip(e); });

// Stäng ark vid tryck utanför
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });

// Svep mellan övningar under passet
let touchStart = null;
$('#workout').addEventListener('touchstart', (e) => {
  if (e.target.closest('input, button, details')) { touchStart = null; return; }
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
$('#workout').addEventListener('touchend', (e) => {
  if (!touchStart || !data.active || data.active.mode === 'interval' || data.active.picking) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) goTo(data.active.index + (dx < 0 ? 1 : -1));
});

// ---------------------------------------------------------------------------
// Start
for (const c of data.customExercises) addCustomExercise(c);
ensurePain();
render();
if (data.active) openWorkout(); // återuppta pågående pass

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    // iOS startar sällan om appen från hemskärmen, så leta efter ny version när den visas igen.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
}
