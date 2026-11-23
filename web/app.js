import { EXERCISES, BY_ID, MUSCLES, MUSCLE_IDS, EQUIPMENT, GEAR, GEAR_IDS, isAvailable, painOk } from './exercises.js';
import { mountFigures } from './figure.js';
import { LENGTHS, replacement, lastWeights, daysBetween, suggestNext, volumeByGroup } from './planner.js';
import { TYPES, LENGTH_OPTIONS, TIMING, buildInterval, expandSteps, estimateMinutes, workFor } from './workouts.js';
import { data, save, uid, exportJSON, importJSON, resetAll } from './storage.js';
import { SWIM_STYLES, SWIM_FOCUS, suggestSwim } from './swim.js';
import { GUIDE, QUICK_TIPS } from './safety.js';
import { WEEK_KINDS, PRIORITIES, suggestWeek } from './week.js';
import { AREAS, AREA_IDS, LEVELS, REHAB, ADVICE, painAreasFor } from './physio.js';

// ---------------------------------------------------------------------------
// Tillstånd för gränssnittet (sparas inte)
const ui = {
  tab: 'start',
  back: 'start', // vart tillbaka-knappen i Gym/Hemma/Simma leder
  plans: { gym: null, home: null, swim: null },
  minutes: { gym: 40, home: 15, swim: 40 },
  type: { gym: 'strength', home: 'circuit' }, // passtyp per plats
  iplans: { gym: null, home: null }, // cirkel-, HIIT- och konditionspass
  focus: { gym: '', home: '', swim: 'endurance' },
  fixed: { gym: null, home: null }, // fysioövningar som alltid ligger först i passet
  skipPhysio: { gym: false, home: false }, // "Vanligt pass i stället" för just den här gången
  loaded: { gym: null, home: null, swim: null }, // namn på inläst sparat pass
  swimStyle: 'mixed',
  swimStart: null,
};

// Vyer man når från startsidan eller Planera (har en tillbaka-knapp).
const SUB = new Set(['gym', 'home', 'swim', 'physio']);

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtNum = (n, max = 1) => Number(n).toLocaleString('sv-SE', { maximumFractionDigits: max });
const muscleNames = (ex) => ex.muscles.map((m) => MUSCLES[m].name).join(' · ');
const byOrder = (a, b) => MUSCLES[a].order - MUSCLES[b].order;
const clone = (x) => JSON.parse(JSON.stringify(x));

/** Lokalt datum som 'ÅÅÅÅ-MM-DD' (toISOString ger UTC och blir fel runt midnatt). */
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const lastDays = (n) => [...Array(n)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d; });
const shortDay = (d) => d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '');
const weekIndex = (d = new Date()) => (d.getDay() + 6) % 7; // måndag = 0
const WEEKDAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const ACTIVITIES = { rest: 'Vila', gym: 'Gym', home: 'Hemma', swim: 'Simma', walk: 'Promenad' };
const PLACE_NAME = { gym: 'Gym', home: 'Hemma', swim: 'Simma' };
const PASS_NAME = { gym: 'Gympass', home: 'Hemmapass', swim: 'Simpass' };
const savedById = (id) => data.saved.find((s) => s.id === id);
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
  calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  steps: '<svg viewBox="0 0 24 24"><path d="M8 3c1.6 0 2.5 2 2.5 4.5S9.6 12 8 12 5.5 10 5.5 7.5 6.4 3 8 3zM6 14.5h4V17a2 2 0 0 1-4 0zM16 7c1.6 0 2.5 2 2.5 4.5S17.6 16 16 16s-2.5-2-2.5-4.5S14.4 7 16 7zM14 18.5h4V20a2 2 0 0 1-4 0z"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>',
};
const PLACE_ICON = { gym: ICON.gym, home: ICON.home, swim: ICON.swim, walk: ICON.walk };

// ---------------------------------------------------------------------------
// Rendering
function render() {
  const view = $('#view');
  const views = { start: startView, plan: planningView, log: logView, settings: settingsView, swim: swimView, physio: physioView };
  view.innerHTML = views[ui.tab] ? views[ui.tab]() : planView(ui.tab);
  const current = SUB.has(ui.tab) ? ui.back : ui.tab;
  for (const b of document.querySelectorAll('.tabbar button')) {
    b.classList.toggle('active', b.dataset.tab === current);
    b.setAttribute('aria-current', b.dataset.tab === current ? 'page' : 'false');
  }
  mountFigures(view);
}

const BACK_NAME = { start: 'Idag', plan: 'Planera', log: 'Logg', settings: 'Inställningar' };
const backButton = () => `<button class="back" data-action="tab" data-tab="${ui.back}">${ICON.chevronL}${BACK_NAME[ui.back] ?? 'Idag'}</button>`;

const physioFor = (place) => (data.settings.physioAlways && !ui.skipPhysio[place] ? physioItems(place) : []);

function regenerate(place) {
  if (place !== 'swim' && ui.type[place] !== 'strength') {
    ui.loaded[place] = null;
    ui.iplans[place] = buildInterval({
      type: ui.type[place], place, minutes: ui.minutes[place], sessions: data.sessions, opts: exOpts(), physio: physioFor(place),
    });
    return;
  }
  if (place === 'swim') {
    ui.loaded.swim = null;
    ui.plans.swim = suggestSwim({ minutes: ui.minutes.swim, style: ui.swimStyle, focus: ui.focus.swim });
    ui.swimStart = null;
    return;
  }
  // Styrka: inget färdigt program. Fysioövningarna läggs först i kön, resten föreslås under passet.
  if (!ui.fixed[place] && data.settings.physioAlways && !ui.skipPhysio[place]) ui.fixed[place] = physioItems(place);
  ui.loaded[place] = null;
  ui.plans[place] = clone(ui.fixed[place] ?? []);
}

// ---- Idag (startsida) -----------------------------------------------------
function startView() {
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 10 ? 'God morgon' : hour < 18 ? 'Hej' : 'God kväll';
  return `
    <header class="page-head">
      <p class="eyebrow">${fmtDate(now)}</p>
      <h1>${hello}!</h1>
      <p class="sub">Vad vill du göra idag?</p>
    </header>
    ${todayCard()}
    <div class="choices">
      ${choice('gym', 'Gym', 'Passförslag med maskiner och vikter', ICON.gym)}
      ${choice('home', 'Hemma', 'Korta cirkelpass och intervaller', ICON.home)}
      ${choice('swim', 'Simma', 'Simpass för bassängen', ICON.swim)}
      ${choice('plan', 'Planera', 'Veckoplan och sparade pass', ICON.calendar)}
    </div>
    ${goalsCard()}
    ${stepsCard()}
    ${physioCard()}
    <button class="card guide-card" data-action="guide">
      <span class="today-icon">${ICON.shield}</span>
      <span class="today-text"><b>Träna säkert</b><small>Uppvärmning, knäna och när du ska stoppa</small></span>
      <span class="chev">${ICON.chevronR}</span>
    </button>`;
}

const choice = (tab, title, text, icon) => `
  <button class="choice ${tab}" data-action="tab" data-tab="${tab}">
    <span class="choice-icon">${icon}</span><b>${title}</b><small>${text}</small>
  </button>`;

function doneToday(kind) {
  const today = (x) => daysBetween(x.date, new Date()) === 0;
  if (kind === 'swim') return data.swims.some(today);
  if (kind === 'walk') return data.walks.some(today);
  return data.sessions.some((s) => today(s) && s.place === kind);
}

function todayCard() {
  let v = data.week[weekIndex()];
  const saved = v.startsWith('saved:') ? savedById(v.slice(6)) : null;
  if (v.startsWith('saved:') && !saved) v = '';
  if (!v) {
    return `
      <button class="card today-card k-none" data-action="tab" data-tab="plan">
        <span class="today-icon">${ICON.calendar}</span>
        <span class="today-text"><b>Ingen plan för idag</b><small>Planera din vecka så visas dagens pass här.</small></span>
        <span class="chev">${ICON.chevronR}</span>
      </button>`;
  }
  if (v === 'rest') {
    return `
      <section class="card today-card k-rest">
        <span class="today-icon">😌</span>
        <span class="today-text"><small>Idag enligt planen</small><b>Vilodag</b><small>Musklerna växer när du vilar. En promenad går bra.</small></span>
      </section>`;
  }
  const kind = saved ? saved.place : v;
  const done = doneToday(kind);
  const action = saved ? `data-action="load-saved" data-id="${esc(saved.id)}"`
    : v === 'walk' ? 'data-action="walk-new"' : `data-action="tab" data-tab="${v}"`;
  return `
    <section class="card today-card k-${kind}">
      <span class="today-icon">${PLACE_ICON[kind]}</span>
      <span class="today-text"><small>Idag enligt planen</small><b>${esc(saved ? saved.name : ACTIVITIES[v])}</b>
        ${done ? '<small class="done-text">✓ Klart för idag, bra jobbat!</small>' : ''}</span>
      <button class="btn primary small" ${action}>${done ? 'Igen' : v === 'walk' ? 'Logga' : 'Kör'}</button>
    </section>`;
}

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
      <p class="sub">${ui.loaded.swim ? `Sparat pass: ${esc(ui.loaded.swim)}` : 'Ett pass för 25-metersbassäng'}</p>
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
      <div class="row">
        <button class="btn secondary" data-action="regenerate">${ICON.refresh} Nytt förslag</button>
        <button class="btn secondary" data-action="save-plan">${ICON.save} Spara till senare</button>
      </div>
    </div>`;
}

// ---- Planera --------------------------------------------------------------
const kindOf = (v) => (v.startsWith('saved:') ? savedById(v.slice(6))?.place ?? '' : v);

function planningView() {
  const today = weekIndex();
  const options = (v) => [
    ['', 'Ingen plan'],
    ...Object.entries(ACTIVITIES),
    ...data.saved.map((s) => [`saved:${s.id}`, `${s.name} (${PLACE_NAME[s.place]})`]),
  ].map(([val, label]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(label)}</option>`).join('');

  return `
    <header class="page-head"><h1>Planera</h1><p class="sub">Din vecka och sparade pass</p></header>
    ${priorityCard()}
    ${weekSuggestCard()}
    ${goalsSection()}

    <h2 class="section-title">Veckoplan</h2>
    <section class="card list">
      ${WEEKDAYS.map((name, i) => `
        <label class="list-row week-row ${i === today ? 'today' : ''}">
          <span class="week-day"><i class="dot k-${kindOf(data.week[i]) || 'none'}"></i>${name}${i === today ? '<em class="pill">Idag</em>' : ''}</span>
          <select data-change="weekday" data-day="${i}" aria-label="Plan för ${name.toLowerCase()}">${options(data.week[i])}</select>
        </label>`).join('')}
    </section>
    <p class="hint">Dagens plan visas på startsidan. Du kan också lägga in ett av dina sparade pass.</p>

    <h2 class="section-title">Sparade pass</h2>
    ${data.saved.length
      ? `<ul class="log-list">${data.saved.map(savedRow).join('')}</ul>`
      : '<p class="empty">Inga sparade pass än. Sätt ihop ett pass och tryck på ”Spara till senare”.</p>'}
    <div class="row three">
      <button class="btn secondary" data-action="tab" data-tab="gym">+ Gym</button>
      <button class="btn secondary" data-action="tab" data-tab="home">+ Hemma</button>
      <button class="btn secondary" data-action="tab" data-tab="swim">+ Simma</button>
    </div>`;
}

// ---- Prioritering och mål -----------------------------------------------------
const priority = () => data.settings.priority ?? 'balanced';

function priorityCard() {
  return `
    <h2 class="section-title">Vad vill du prioritera?</h2>
    <section class="card controls">
      <div class="segmented types" role="radiogroup" aria-label="Prioritering">
        ${Object.entries(PRIORITIES).map(([k, p]) => `<button role="radio" aria-checked="${priority() === k}" data-action="priority" data-value="${k}">${p.name}</button>`).join('')}
      </div>
      <p class="hint">${PRIORITIES[priority()].desc}. Påverkar veckoförslaget och vilka övningar som föreslås.</p>
    </section>`;
}

const METRICS = { reps: 'reps i ett set', weight: 'kg', sec: 'sekunder' };
const metricsFor = (ex) => (ex.timed ? ['sec'] : ex.equipment === 'none' ? ['reps'] : ['weight', 'reps']);
const goalLabel = (g) => {
  const ex = BY_ID[g.exId];
  return g.metric === 'weight' ? `${fmtNum(g.target)} kg i ${ex.name.toLowerCase()}`
    : g.metric === 'sec' ? `${g.target} s ${ex.name.toLowerCase()}` : `${g.target} ${ex.name.toLowerCase()} i rad`;
};
/** Bästa resultat hittills för målets mått. */
function goalBest(g) {
  let best = 0;
  for (const s of data.sessions) for (const e of s.entries) {
    if (e.exId !== g.exId) continue;
    for (const set of e.sets) best = Math.max(best, g.metric === 'weight' ? (set.reps > 0 ? set.weight || 0 : 0) : set.reps || 0);
  }
  return best;
}
const activeGoals = () => data.goals.filter((g) => !g.achieved && BY_ID[g.exId]);
const goalHints = () => activeGoals().map((g) => ({ exId: g.exId, label: goalLabel(g) }));

function goalProgress(g) {
  const best = goalBest(g);
  const from = Math.min(g.start ?? 0, g.target);
  const pct = g.achieved || best >= g.target ? 100 : Math.max(4, Math.round(((best - from) / Math.max(1e-9, g.target - from)) * 100));
  return { best, pct };
}

function goalRow(g) {
  const ex = BY_ID[g.exId];
  const { best, pct } = goalProgress(g);
  const unit = g.metric === 'weight' ? 'kg' : g.metric === 'sec' ? 's' : 'st';
  return `
    <li class="goal-item ${g.achieved ? 'done' : ''}" data-group="${ex.muscles[0]}">
      <div class="goal-text">
        <b>${g.achieved ? '🏆 ' : ''}${esc(goalLabel(g))}</b>
        <small>${g.achieved ? `Klart ${new Date(g.achieved).toLocaleDateString('sv-SE')}` : `Bästa hittills: ${fmtNum(best)} ${unit}`}</small>
        <div class="goal-bar"><div style="width:${pct}%"></div></div>
      </div>
      <button class="icon-btn" data-action="goal-delete" data-id="${esc(g.id)}" aria-label="Ta bort målet">${ICON.remove}</button>
    </li>`;
}

function goalsSection() {
  const list = [...activeGoals(), ...data.goals.filter((g) => g.achieved && BY_ID[g.exId])];
  return `
    <h2 class="section-title">Mina mål</h2>
    ${list.length ? `<ul class="ex-list">${list.map(goalRow).join('')}</ul>
      <p class="hint">Övningar med mål föreslås oftare. För fler reps: kör 3 set nära max 2–3 gånger i veckan. För mer vikt: öka lite när du klarar alla set.</p>`
      : '<p class="empty">Inga mål än. Till exempel: 10 armhävningar i rad eller 60 sekunder plankan.</p>'}
    <button class="btn secondary" data-action="goal-new">+ Nytt mål</button>`;
}

function goalsCard() {
  const list = activeGoals().slice(0, 3);
  if (!list.length) return '';
  return `
    <button class="card goals-card" data-action="tab" data-tab="plan">
      <b>Mina mål</b>
      ${list.map((g) => `<span class="goal-mini"><small>${esc(goalLabel(g))}</small><span class="goal-bar"><span style="width:${goalProgress(g).pct}%"></span></span></span>`).join('')}
    </button>`;
}

function goalSheet(exId) {
  const ex = BY_ID[exId] ?? BY_ID['push-up'];
  const options = MUSCLE_IDS.map((m) => {
    const items = EXERCISES.filter((e) => !e.physio && e.muscles[0] === m);
    return items.length ? `<optgroup label="${MUSCLES[m].name}">${items.map((e) => `<option value="${e.id}" ${e.id === ex.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  return `
    <div class="sheet-head"><h2>Nytt mål</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="goal-form" class="form">
      <label class="field"><span class="field-label">Övning</span><select name="exId" data-change="goal-ex">${options}</select></label>
      <div id="goal-metric">${goalMetricFields(ex)}</div>
      <button class="btn primary big" type="submit">Spara målet</button>
    </form>`;
}
function goalMetricFields(ex) {
  const ms = metricsFor(ex);
  const best = goalBest({ exId: ex.id, metric: ms[0] });
  return `
    <label class="field"><span class="field-label">Mål</span>
      <span class="goal-input"><input name="target" type="text" inputmode="decimal" required placeholder="${ms[0] === 'weight' ? '40' : ms[0] === 'sec' ? '60' : '10'}">
      <select name="metric">${ms.map((m) => `<option value="${m}">${METRICS[m]}</option>`).join('')}</select></span></label>
    ${best ? `<p class="hint">Ditt bästa hittills: ${fmtNum(best)} ${ms[0] === 'weight' ? 'kg' : ms[0] === 'sec' ? 's' : 'st'}.</p>` : ''}`;
}

/** Kollar mål efter ett pass. */
function checkGoals() {
  const reached = activeGoals().filter((g) => goalBest(g) >= g.target);
  for (const g of reached) g.achieved = new Date().toISOString();
  return reached;
}

const weekDays = () => data.settings.weekDays ?? 4;
const weekKinds = () => data.settings.weekKinds ?? ['gym', 'swim', 'walk'];
const dayLabel = (d, i) => (i === 0 ? 'Idag' : i === 1 ? 'Imorgon' : WEEKDAYS[weekIndex(d)]);

function weekSuggestCard() {
  const p = ui.weekProposal;
  const h = p?.hist;
  return `
    <h2 class="section-title">Förslag för kommande vecka</h2>
    <section class="card controls">
      <div class="field"><span class="field-label">Träningsdagar</span>
        <div class="segmented five" role="radiogroup" aria-label="Träningsdagar per vecka">
          ${[2, 3, 4, 5, 6].map((n) => `<button role="radio" aria-checked="${weekDays() === n}" data-action="wdays" data-value="${n}">${n}</button>`).join('')}
        </div></div>
      <div class="field"><span class="field-label">Aktiviteter</span>${chipToggles('wkind', Object.entries(WEEK_KINDS), weekKinds())}</div>
      ${p ? '' : `<button class="btn primary" data-action="week-suggest" ${weekKinds().length ? '' : 'disabled'}>Föreslå veckan</button>`}
    </section>
    ${p ? `
      <p class="hint">Senaste två veckorna: ${h.gym} gympass, ${h.home} hemmapass, ${h.swim} simpass och ${h.walk} promenader${painSummary() ? `. Hänsyn till: ${esc(painSummary().toLowerCase())}` : ''}.</p>
      <ul class="ex-list week-proposal">${p.days.map((x, i) => `
        <li class="week-day-item k-${x.kind}">
          <span class="wd">${dayLabel(x.date, i)}</span>
          <span class="wk"><b>${ACTIVITIES[x.kind]}</b><small>${esc(x.reason)}</small></span>
        </li>`).join('')}</ul>
      <div class="row">
        <button class="btn secondary" data-action="week-cancel">Avbryt</button>
        <button class="btn primary" data-action="week-apply">Använd</button>
      </div>` : ''}`;
}

function savedRow(s) {
  const info = s.place === 'swim'
    ? `${fmtNum(s.items.reduce((n, b) => n + b.meters, 0), 0)} m · ${s.minutes} min`
    : s.physio ? `${s.items.length} fysioövningar, sedan förslag`
    : s.type && s.type !== 'strength' ? `${TYPES[s.type].name} · ${s.items.length} övningar · ${s.minutes} min` : `${s.items.length} övningar`;
  return `
    <li class="saved-item">
      <button class="log-item" data-action="load-saved" data-id="${esc(s.id)}">
        <span class="log-icon ${s.place}">${PLACE_ICON[s.place]}</span>
        <span class="log-text"><strong>${esc(s.name)}</strong><small>${PLACE_NAME[s.place]} · ${info}</small></span>
        <span class="chev">${ICON.chevronR}</span>
      </button>
      <button class="icon-btn" data-action="delete-saved" data-id="${esc(s.id)}" aria-label="Ta bort ${esc(s.name)}">${ICON.remove}</button>
    </li>`;
}

function loadSaved(id) {
  const s = savedById(id);
  if (!s) return;
  const items = clone(s.items);
  if (s.minutes) ui.minutes[s.place] = s.minutes;
  if (s.place === 'swim') ui.plans.swim = items.map((b) => ({ ...b, done: false }));
  else {
    const valid = items.filter((p) => BY_ID[p.exId]);
    ui.type[s.place] = s.type || 'strength';
    if (ui.type[s.place] === 'strength') {
      ui.fixed[s.place] = s.physio ? valid : null;
      ui.plans[s.place] = clone(valid);
    } else {
      ui.fixed[s.place] = null;
      ui.iplans[s.place] = buildInterval({
        type: s.type, place: s.place, minutes: ui.minutes[s.place], sessions: data.sessions, opts: exOpts(), physio: physioFor(s.place), stations: valid,
      });
    }
  }
  ui.loaded[s.place] = s.name;
  if (s.place === 'swim') ui.swimStart = null;
  if (!SUB.has(ui.tab)) ui.back = ui.tab === 'plan' ? 'plan' : 'start';
  ui.tab = s.place;
  render();
  window.scrollTo(0, 0);
}

// ---- Gym / Hemma ----------------------------------------------------------
const exOpts = () => ({ hasDumbbells: data.settings.hasDumbbells, pain: data.settings.pain });
const painNames = (areas) => areas.map((a) => AREAS[a].the).join(' och ');
const painWarn = (ex) => {
  const areas = painAreasFor(ex, data.settings.pain);
  return areas.length ? `<em class="knee-warn">Belastar ${painNames(areas)}</em>` : '';
};

// Fysiopassen läggs in som sparade pass första gången appen startar.
const PHYSIO_PASSES = [
  { id: 'fysio-gym', name: 'Fysio gym', place: 'gym', minutes: 40, physio: true,
    items: ['single-leg-extension', 'single-leg-curl', 'single-leg-press'] },
  { id: 'fysio-hemma', name: 'Fysio hemma', place: 'home', minutes: 40, physio: true,
    items: ['single-leg-mini-squat', 'wall-sit-high'] },
];
function resetPlans() {
  ui.plans = { gym: null, home: null, swim: null };
  ui.iplans = { gym: null, home: null };
  ui.fixed = { gym: null, home: null };
  ui.loaded = { gym: null, home: null, swim: null };
  ui.skipPhysio = { gym: false, home: false };
}

/** Fysioövningarna för gym eller hemma (från det sparade fysiopasset, så att dina ändringar där gäller). */
function physioItems(place) {
  const def = PHYSIO_PASSES.find((p) => p.place === place);
  const saved = savedById(def.id);
  const items = saved ? saved.items : def.items.map((exId) => ({ exId, sets: BY_ID[exId].sets }));
  return clone(items).filter((p) => BY_ID[p.exId]);
}

function seedPhysio() {
  const seeded = data.settings.seeded;
  for (const pass of PHYSIO_PASSES) {
    if (seeded.includes(pass.id)) continue;
    seeded.push(pass.id);
    if (savedById(pass.id)) continue;
    data.saved.unshift({ ...pass, items: pass.items.map((exId) => ({ exId, sets: BY_ID[exId].sets })) });
  }
  save();
}

function placeHeader(place) {
  return `
    ${backButton()}
    <header class="page-head">
      <h1>${place === 'gym' ? 'Gym' : 'Hemma'}</h1>
      <p class="sub">${ui.loaded[place] ? `Sparat pass: ${esc(ui.loaded[place])}` : place === 'gym' ? 'Ett pass för gymmet' : 'Korta pass hemma'}</p>
    </header>
    <section class="card controls">
      <div class="segmented types" role="radiogroup" aria-label="Typ av pass">
        ${Object.entries(TYPES).map(([k, t]) => `<button role="radio" aria-checked="${ui.type[place] === k}" data-action="ptype" data-value="${k}">${t.name}</button>`).join('')}
      </div>
      ${ui.type[place] === 'strength' ? strengthControls(place) : `
      <div class="segmented" role="radiogroup" aria-label="Passets längd">
        ${LENGTH_OPTIONS[place].map((m) => `<button role="radio" aria-checked="${ui.minutes[place] === m}" data-action="minutes" data-value="${m}">${m} min</button>`).join('')}
      </div>`}
    </section>
    <p class="hint">${ui.type[place] === 'strength' ? 'Du väljer övning för övning. Appen föreslår vad som passar efter det du redan kört idag.' : TYPES[ui.type[place]].desc}</p>
    ${ui.type[place] === 'strength' ? `<p class="note">${ICON.shield} <b>Värm upp först:</b> 5 minuter på ${place === 'gym' ? 'cykel' : 'marsch på stället'}, och kör första setet av varje övning med lätt vikt. <button class="inline-link" data-action="guide">Träna säkert</button></p>` : ''}`;
}

const physioNote = (place) => `<p class="note">Dina fysioövningar ingår alltid och ligger först. <button class="inline-link" data-action="leave-physio">Hoppa över fysio idag</button></p>`;

function intervalView(place) {
  if (!ui.iplans[place]) regenerate(place);
  const plan = ui.iplans[place];
  const t = TIMING[plan.type];
  const steps = expandSteps(plan);
  const hasPhysio = plan.physio.length || plan.stations.some((s) => s.physio);
  const startLabel = { circuit: 'Starta cirkeln', hiit: 'Starta HIIT', cardio: 'Starta konditionspasset' }[plan.type];
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
    ${hasPhysio ? physioNote(place) : ''}
    ${plan.physio.length ? `
      <h2 class="section-title">Fysio först</h2>
      <ul class="ex-list">${plan.physio.map((p) => item(p.exId, `${p.sets} set × ${BY_ID[p.exId].reps}`)).join('')}</ul>` : ''}
    ${plan.bikeSec || plan.warmup ? `
      <h2 class="section-title">Uppvärmning</h2>
      <ul class="ex-list">${plan.bikeSec ? item('bike', `${Math.round(plan.bikeSec / 60)} min i jämnt tempo`)
        : item(plan.warmup.exId, `${fmtClock(plan.warmup.sec)} min i lugnt tempo`)}</ul>` : ''}
    <h2 class="section-title">${plan.type === 'circuit' ? 'Stationer' : 'Intervaller'} <span class="title-note">varje varv</span></h2>
    <ol class="ex-list stations">
      ${plan.stations.map((st, i) => {
        const ex = BY_ID[st.exId];
        const text = st.physio && !ex.timed ? ex.reps : `${workFor(plan.type, st.exId)} s`;
        return item(st.exId, text, `<div class="ex-actions">
          ${st.physio ? '' : `<button class="icon-btn" data-action="iswap" data-index="${i}" aria-label="Byt ${esc(ex.name)}">${ICON.swap}</button>`}
          <button class="icon-btn" data-action="iremove" data-index="${i}" aria-label="Ta bort ${esc(ex.name)}">${ICON.remove}</button></div>`);
      }).join('')}
    </ol>
    <div class="stack">
      <button class="btn primary big" data-action="start" ${plan.stations.length ? '' : 'disabled'}>${ICON.play} ${startLabel}</button>
      <div class="row">
        <button class="btn secondary" data-action="regenerate">${ICON.refresh} Nytt förslag</button>
        <button class="btn secondary" data-action="library">Alla övningar</button>
      </div>
      <button class="btn secondary" data-action="save-plan" ${plan.stations.length ? '' : 'disabled'}>${ICON.save} Spara till senare</button>
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

function focusNote(place) {
  const i = weekIndex();
  const focus = (data.weekFocus[i] || []).filter((m) => MUSCLES[m]);
  if (data.week[i] !== place || !focus.length) return '';
  const same = focus.length === groupsFor(place).length && focus.every((m) => groupsFor(place).includes(m));
  return same ? '' : `<p class="note">${ICON.calendar} Veckoplanen föreslår fokus på ${esc(focus.map((m) => MUSCLES[m].name.toLowerCase()).join(', '))} idag. <button class="inline-link" data-action="use-focus">Använd</button></p>`;
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
const defaultGear = (place) => (place === 'gym' ? [...GEAR_IDS] : ['body', ...(data.settings.hasDumbbells ? ['dumbbells'] : [])]);
const gearFor = (place) => data.settings.gear?.[place] ?? defaultGear(place);
const groupsFor = (place) => data.settings.groups?.[place] ?? [];
const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const isToday = (d) => dayKey(d) === dayKey(new Date());
const doneSets = (it) => it.sets.filter((x) => x.done).length;

function chipToggles(action, entries, selected) {
  return `<div class="toggles">${entries.map(([k, label]) =>
    `<button class="toggle" data-action="${action}" data-value="${k}" aria-pressed="${selected.includes(k)}">${label}</button>`).join('')}</div>`;
}
function strengthControls(place, prefix = '') {
  const groups = prefix ? data.active.groups : groupsFor(place);
  return `
      <div class="field"><span class="field-label">Utrustning</span>
        ${chipToggles(`${prefix}gear`, Object.entries(GEAR), prefix ? data.active.gear : gearFor(place))}</div>
      <div class="field"><span class="field-label">Muskelgrupper <small>${groups.length ? '' : 'inget valt = alla'}</small></span>
        ${chipToggles(`${prefix}group`, MUSCLE_IDS.map((m) => [m, MUSCLES[m].name]), groups)}</div>`;
}

/** Det du kört idag: tidigare sparade pass + klara set i pågående pass, i tidsordning. */
function exercisesToday() {
  const done = [];
  for (const s of data.sessions) if (isToday(s.date)) for (const e of s.entries) done.push({ exId: e.exId, sets: e.sets.length });
  if (data.active?.items) for (const it of data.active.items) if (doneSets(it)) done.push({ exId: it.exId, sets: doneSets(it) });
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
  const done = exercisesToday();
  const gear = gearFor(place);
  const preview = gear.length ? suggestNext({ done, groups: groupsFor(place), gear, pain: data.settings.pain, goals: goalHints(), priority: priority(),
    exclude: queue.map((p) => p.exId), sessions: data.sessions, limit: 3 }).filter((x) => !x.busy) : [];

  return `
    ${placeHeader(place)}
    ${focusNote(place)}
    ${painNote()}
    ${done.length ? `<h2 class="section-title">Kört idag</h2>${todaySummary(done)}` : ''}
    ${queue.length ? `
      ${ui.fixed[place] ? physioNote(place) : ''}
      <h2 class="section-title">Först i passet</h2>
      <ul class="ex-list">${queue.map((p, i) => planItem(p, i)).join('')}</ul>` : ''}
    ${!gear.length ? '<p class="note warn">Välj minst en typ av utrustning.</p>' : `
      <h2 class="section-title">${queue.length ? 'Sedan till exempel' : 'Förslag att börja med'}</h2>
      <ul class="ex-list">${preview.map((x) => suggestionItem(x, '')).join('')}</ul>
      ${preview.length ? '' : '<p class="empty">Inga övningar passar. Välj fler muskelgrupper eller mer utrustning.</p>'}
      <p class="hint">Förslagen ändras under passet efter det du har kört.</p>`}
    <div class="stack">
      <button class="btn primary big" data-action="start" ${gear.length ? '' : 'disabled'}>${ICON.play} Börja träna</button>
      <button class="btn secondary" data-action="library">Alla övningar</button>
    </div>`;
}

function suggestionItem({ ex, reason, busy }, actions) {
  return `
    <li class="ex-item ${busy ? 'is-busy' : ''}" data-group="${ex.muscles[0]}">
      <button class="ex-main" data-action="detail" data-id="${ex.id}">
        <div class="fig thumb" data-ex="${ex.id}"></div>
        <div class="ex-text">
          <strong>${esc(ex.name)}</strong>
          <span>${busy ? 'Upptagen' : esc(reason)}</span>
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

// ---- Logg -----------------------------------------------------------------
function logView() {
  const now = new Date();
  const week = (d) => daysBetween(d, now) < 7;
  const weekSessions = data.sessions.filter((s) => week(s.date));
  const weekWalks = data.walks.filter((w) => week(w.date));
  const weekSwims = data.swims.filter((w) => week(w.date));
  const sets = weekSessions.reduce((n, s) => n + s.entries.reduce((m, e) => m + e.sets.length, 0), 0);
  const walkMin = weekWalks.reduce((n, w) => n + (Number(w.minutes) || 0), 0);
  const swimM = weekSwims.reduce((n, w) => n + (Number(w.meters) || 0), 0);
  const mins = (list, d) => list.filter((x) => daysBetween(x.date, d) === 0).reduce((n, x) => n + (Number(x.minutes) || 0), 0);

  // Aktiva minuter per dag, senaste 7 dagarna
  const days = lastDays(7).map((d) => ({
    d,
    train: data.sessions.filter((s) => daysBetween(s.date, d) === 0).reduce((n, s) => n + minutesOf(s), 0),
    swim: mins(data.swims, d),
    walk: mins(data.walks, d),
  }));
  const maxMin = Math.max(30, ...days.map((x) => x.train + x.swim + x.walk));

  const items = [
    ...data.sessions.map((s) => ({ date: s.date, html: () => sessionRow(s) })),
    ...data.walks.map((w) => ({ date: w.date, html: () => walkRow(w) })),
    ...data.swims.map((w) => ({ date: w.date, html: () => swimRow(w) })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return `
    <header class="page-head"><h1>Logg</h1><p class="sub">Senaste 7 dagarna</p></header>

    <div class="tiles">
      <div class="tile"><span>Pass</span><b>${weekSessions.length + weekSwims.length}</b></div>
      <div class="tile"><span>Set</span><b>${sets}</b></div>
      <div class="tile"><span>Simmat</span><b>${fmtNum(swimM, 0)} m</b></div>
      <div class="tile"><span>Promenad</span><b>${walkMin} min</b></div>
    </div>

    <section class="card chart" aria-label="Aktiva minuter per dag">
      <div class="chart-head">
        <h3>Aktiva minuter</h3>
        <div class="legend"><i class="sw train"></i>Träning <i class="sw swim"></i>Simning <i class="sw walk"></i>Promenad</div>
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
    </section>

    <div class="row">
      <button class="btn primary" data-action="walk-new">${ICON.walk} Promenad</button>
      <button class="btn primary swim-btn" data-action="swim-log">${ICON.swim} Simpass</button>
    </div>

    <h2 class="section-title">Historik</h2>
    ${items.length === 0 ? '<p class="empty">Inget loggat än. Kör ett pass eller logga en promenad eller ett simpass.</p>' : ''}
    <ul class="log-list">
      ${items.map((it) => it.html()).join('')}
    </ul>`;
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

const minutesOf = (s) => Math.max(1, Math.round((new Date(s.endDate) - new Date(s.date)) / 60000));
const fmtDate = (d) => new Date(d).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

function sessionRow(s) {
  const sets = s.entries.reduce((n, e) => n + e.sets.length, 0);
  return `
    <li><button class="log-item" data-action="session" data-id="${esc(s.id)}">
      <span class="log-icon">${s.place === 'gym' ? ICON.gym : ICON.home}</span>
      <span class="log-text"><strong>${fmtDate(s.date)}</strong>
        <small>${s.place === 'gym' ? 'Gym' : 'Hemma'}${s.type && s.type !== 'strength' ? ` · ${TYPES[s.type].name}` : ''} · ${s.entries.length} övningar · ${minutesOf(s)} min</small></span>
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
function settingsView() {
  const s = data.settings;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <header class="page-head"><h1>Inställningar</h1></header>

    <section class="card list">
      <button class="list-row action" data-action="tab" data-tab="physio">
        <span class="row-text">Ont i axlar, rygg eller knän<small>${painSummary() || 'Inget just nu'}</small></span>
        <span class="chev">${ICON.chevronR}</span>
      </button>
      <label class="list-row">
        <span class="row-text">Fysioövningar i alla pass<small>Gym- och hemmapass börjar alltid med dina fysioövningar</small></span>
        <input type="checkbox" class="switch" data-change="physio" ${s.physioAlways ? 'checked' : ''}>
      </label>
      <label class="list-row">
        <span>Jag har hantlar hemma</span>
        <input type="checkbox" class="switch" data-change="dumbbells" ${s.hasDumbbells ? 'checked' : ''}>
      </label>
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
    </section>

    ${standalone ? '' : `
    <h2 class="section-title">Installera på iPhone</h2>
    <section class="card prose">
      <ol>
        <li>Öppna sidan i <b>Safari</b>.</li>
        <li>Tryck på <b>Dela</b>-knappen (fyrkanten med pil uppåt).</li>
        <li>Välj <b>Lägg till på hemskärmen</b>.</li>
      </ol>
      <p class="muted">Då öppnas Min PT i helskärm som en vanlig app och fungerar även utan internet.</p>
    </section>`}

    <section class="card list">
      <button class="list-row action" data-action="guide">Träna säkert – råd och varningssignaler</button>
    </section>

    <h2 class="section-title">Din data</h2>
    <section class="card list">
      <button class="list-row action" data-action="export">Exportera säkerhetskopia</button>
      <label class="list-row action">Importera säkerhetskopia
        <input type="file" accept="application/json,.json" data-change="import" hidden>
      </label>
      <button class="list-row action danger" data-action="reset">Radera all data</button>
    </section>
    <p class="hint">Allt sparas bara på den här telefonen. Exportera då och då om du vill vara säker på att inte tappa din historik.</p>`;
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
    ${painAreasFor(ex, data.settings.pain).length ? `<p class="note warn">Den här övningen belastar ${painNames(painAreasFor(ex, data.settings.pain))}, där du har ont. Kör den bara om det känns bra, högst 3 av 10.</p>` : ''}
    ${ex.physio ? '<p class="note">Övningen kommer från ditt fysioprogram. Följ fysioterapeutens instruktioner om de skiljer sig från tipsen här.</p>' : ''}
    <div class="card list">
      <div class="list-row"><span>Utrustning</span><b>${EQUIPMENT[ex.equipment]}</b></div>
      <div class="list-row"><span>Rekommenderat</span><b>${ex.sets} set × ${ex.reps}</b></div>
    </div>
    <h3>Så gör du</h3>
    <ol class="tips">${ex.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    ${safetyBlock(ex)}
    ${ex.physio || data.active ? '' : `<button class="btn secondary" data-action="goal-new" data-id="${ex.id}">Sätt ett mål för ${esc(ex.name.toLowerCase())}</button>`}
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
  const list = EXERCISES.filter((e) => (e.physio || isAvailable(e, place, exOpts())) && (place === 'gym' || e.equipment !== 'gym') && (!q || e.name.toLowerCase().includes(q)));
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

function savePlanSheet(place) {
  const name = `${PASS_NAME[place]} ${new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }).replace('.', '')}`;
  return `
    <div class="sheet-head"><h2>Spara pass</h2><button class="btn-text" data-action="close-sheet">Avbryt</button></div>
    <form id="save-plan-form" class="form">
      <input type="hidden" name="place" value="${place}">
      <label>Namn<input type="text" name="name" value="${esc(ui.loaded[place] || name)}" maxlength="40" autocomplete="off" required></label>
      <p class="hint">Passet hamnar under Planera. Där kan du starta det eller lägga in det i veckoplanen.</p>
      <button class="btn primary big" type="submit">Spara</button>
    </form>`;
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

function sessionSheet(s) {
  return `
    <div class="sheet-head"><h2>${s.place === 'gym' ? 'Gympass' : 'Hemmapass'}${s.type && s.type !== 'strength' ? ` · ${TYPES[s.type].name.toLowerCase()}` : ''}</h2><button class="btn-text" data-action="close-sheet">Klar</button></div>
    <p class="muted">${fmtDate(s.date)} · ${minutesOf(s)} min</p>
    ${s.entries.map((e) => {
      const ex = BY_ID[e.exId];
      return `<div class="card list">
        <div class="list-row head"><b>${esc(ex ? ex.name : e.exId)}</b></div>
        ${e.sets.map((set, i) => `<div class="list-row"><span>Set ${i + 1}</span><b>${ex?.timed || set.sec ? `${set.reps} s` : set.weight > 0 ? `${set.reps} × ${fmtNum(set.weight)} kg` : `${set.reps} st`}</b></div>`).join('')}
      </div>`;
    }).join('')}
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
function newItem(exId, sets = BY_ID[exId].sets) {
  const weight = lastWeights(data.sessions)[exId] ?? 0;
  return { exId, sets: [...Array(sets)].map(() => ({ reps: BY_ID[exId].defaultReps, weight, done: false })) };
}

function startWorkout(place) {
  const items = ui.plans[place].map((p) => newItem(p.exId, p.sets));
  data.active = {
    place,
    start: Date.now(),
    index: 0,
    restEnd: null,
    restBeeped: false,
    gear: [...gearFor(place)],
    groups: [...groupsFor(place)],
    busy: {},
    picking: !items.length,
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
  w.restEnd = w.restEnd && w.restEnd > Date.now() ? w.restEnd : null;
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

function openPicker() {
  const w = data.active;
  w.picking = true;
  w.more = false;
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

/** Markera en maskin som upptagen och flytta övningen sist i kön. */
function markBusy(w, exId) {
  w.busy[exId] = true;
  const i = w.items.findIndex((it) => it.exId === exId && !doneSets(it));
  if (i >= 0) w.items.push(...w.items.splice(i, 1));
}

function openWorkout() {
  const w = $('#workout');
  w.hidden = false;
  document.body.classList.add('no-scroll');
  if (data.active.mode === 'interval') renderRunner(); else renderWorkout();
  keepAwake(true);
}

// ---------------------------------------------------------------------------
// Intervalltimer (cirkel, HIIT, kondition)
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
      <button class="btn-text" data-action="end">Avsluta</button>
      <div class="wk-title"><b>${TYPES[a.type].name}</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="progress"><div style="width:${(a.index / a.steps.length) * 100}%"></div></div>
    <div class="wk-body run ${working ? (step.physio ? 'is-physio' : 'is-work') : 'is-rest'}" id="wk-body">
      <p class="run-phase">${working ? (step.physio ? 'Fysio' : 'Kör!') : esc(step.label)}</p>
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
    if (!byEx.has(st.exId)) byEx.set(st.exId, []);
    byEx.get(st.exId).push(st.mode === 'time' ? { reps: st.sec, weight: 0, sec: true } : { reps: BY_ID[st.exId].defaultReps, weight: 0 });
  }
  const entries = [...byEx].map(([exId, sets]) => ({ exId, sets }));
  if (entries.length) {
    data.sessions.push({ id: uid(), place: a.place, type: a.type, date: new Date(a.start).toISOString(), endDate: new Date().toISOString(), entries });
  }
  data.active = null;
  const reached = checkGoals();
  save();
  closeWorkout();
  if (entries.length) { ui.tab = 'log'; toast(reached.length ? `🏆 Mål klart: ${goalLabel(reached[0])}!` : 'Passet sparat 💪'); }
  render();
}

function closeWorkout() {
  $('#workout').hidden = true;
  $('#workout').innerHTML = '';
  document.body.classList.remove('no-scroll');
  keepAwake(false);
}

function renderWorkout() {
  const w = data.active;
  w.busy ??= {};
  w.gear ??= gearFor(w.place);
  w.groups ??= groupsFor(w.place);
  if (w.picking || !w.items[w.index]) { renderPicker(); return; }
  const root = $('#workout');
  const item = w.items[w.index];
  const ex = BY_ID[item.exId];

  root.innerHTML = `
    <div class="wk-top">
      <button class="btn-text" data-action="end">Avsluta</button>
      <div class="wk-title"><b>Övning ${w.index + 1}</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="wk-body" id="wk-body">
      <div class="fig big" data-ex="${ex.id}" data-play="1"></div>
      <h2 class="wk-name">${esc(ex.name)}</h2>
      <p class="muted center">${ex.sets} set × ${ex.reps} · ${muscleNames(ex)}</p>
      <div class="wk-links">
        ${doneSets(item) || ex.physio ? '' : '<button class="btn-text busy-link" data-action="busy-now">Upptagen?</button>'}
        <button class="btn-text busy-link" data-action="pain-sheet">Gör det ont?</button>
      </div>
      <details class="card">
        <summary>Så gör du</summary>
        <ol class="tips">${ex.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      </details>
      ${ex.safety.length ? `<details class="card safety-card"><summary>${ICON.shield} Tänk på</summary>${safetyList(ex)}</details>` : ''}
      <div class="sets">${item.sets.map((s, k) => setRow(ex, s, k)).join('')}</div>
      <button class="btn-text add-set" data-action="add-set">+ Lägg till set</button>
    </div>
    <div id="rest" class="rest" hidden></div>
    <div class="wk-bottom">
      <button class="btn secondary square" data-action="prev" ${w.index === 0 ? 'disabled' : ''} aria-label="Föregående övning">${ICON.chevronL}</button>
      <button class="btn primary grow" data-action="pick">Nästa övning</button>
    </div>`;
  mountFigures(root);
  updateTimers();
}

function renderPicker() {
  const w = data.active;
  const root = $('#workout');
  const done = exercisesToday();
  const qi = queueIndexes(w);
  const queueIds = qi.map((i) => w.items[i].exId);
  const list = w.gear.length ? suggestNext({ done, groups: w.groups, gear: w.gear, pain: data.settings.pain, goals: goalHints(), priority: priority(),
    exclude: queueIds, busy: w.busy, sessions: data.sessions, limit: w.more ? 99 : 4 }) : [];
  const free = list.filter((x) => !x.busy);
  const busy = list.filter((x) => x.busy);
  const started = w.items.some((it) => doneSets(it));
  const btn = (action, attr, label, icon) => `<button class="icon-btn" data-action="${action}" ${attr} aria-label="${label}">${icon}</button>`;

  root.innerHTML = `
    <div class="wk-top">
      <button class="btn-text" data-action="end">Avsluta</button>
      <div class="wk-title"><b>${started ? 'Nästa övning' : 'Första övningen'}</b><span id="elapsed">0:00</span></div>
      <span class="wk-spacer"></span>
    </div>
    <div class="wk-body picker" id="wk-body">
      ${done.length ? `<div><h3 class="pk-title">Kört idag</h3>${todaySummary(done)}</div>` : ''}
      ${qi.length ? `
        <div><h3 class="pk-title">Din kö <small>flytta om något är upptaget</small></h3>
        <ul class="ex-list">${qi.map((i, n) => {
          const ex = BY_ID[w.items[i].exId];
          return suggestionItem({ ex, reason: `${w.items[i].sets.length} set × ${ex.reps}`, busy: w.busy[ex.id] }, `
            <div class="ex-actions">
              <button class="go-btn" data-action="q-go" data-k="${i}">Kör</button>
              <div class="pk-more">
                ${n ? btn('q-up', `data-k="${i}"`, `Flytta upp ${esc(ex.name)}`, ICON.up) : ''}
                ${btn('q-busy', `data-k="${i}"`, `${esc(ex.name)} är upptagen, flytta sist`, ICON.clock)}
                ${btn('q-remove', `data-k="${i}"`, `Ta bort ${esc(ex.name)}`, ICON.remove)}
              </div>
            </div>`);
        }).join('')}</ul></div>` : ''}
      <div><h3 class="pk-title">${qi.length ? 'Eller välj ett förslag' : 'Förslag'}</h3>
      ${!w.gear.length ? '<p class="note warn">Välj minst en typ av utrustning nedan.</p>' : free.length ? `
        <ul class="ex-list">${free.map((x) => suggestionItem(x, `
          <div class="ex-actions">
            <button class="go-btn" data-action="s-go" data-id="${x.ex.id}">Kör</button>
            <div class="pk-more">
              ${btn('s-queue', `data-id="${x.ex.id}"`, `Lägg ${esc(x.ex.name)} i kön`, ICON.plus)}
              ${btn('s-busy', `data-id="${x.ex.id}"`, `${esc(x.ex.name)} är upptagen`, ICON.clock)}
            </div>
          </div>`)).join('')}</ul>
        ${w.more ? '' : '<button class="btn-text" data-action="s-more">Visa fler förslag</button>'}`
        : '<p class="empty">Inga fler övningar passar. Välj fler muskelgrupper eller mer utrustning nedan.</p>'}
      </div>
      ${rehabSuggestions(w.place, [...queueIds, ...done.map((d) => d.exId), ...free.map((x) => x.ex.id)]).map(([area, list]) => `
        <div><h3 class="pk-title">Fysio för ${AREAS[area].the}</h3>
        <ul class="ex-list">${list.map((ex) => suggestionItem({ ex, reason: `Stärker och avlastar ${AREAS[area].the}` }, `
          <div class="ex-actions">
            <button class="go-btn" data-action="s-go" data-id="${ex.id}">Kör</button>
            <div class="pk-more">${btn('s-queue', `data-id="${ex.id}"`, `Lägg ${esc(ex.name)} i kön`, ICON.plus)}</div>
          </div>`)).join('')}</ul></div>`).join('')}
      ${busy.length ? `<div><h3 class="pk-title">Upptaget just nu</h3>
        <ul class="ex-list">${busy.map((x) => suggestionItem(x, `<div class="ex-actions"><button class="go-btn soft" data-action="s-free" data-id="${x.ex.id}">Ledig nu</button></div>`)).join('')}</ul></div>` : ''}
      <details class="card"><summary>Ändra utrustning och muskelgrupper</summary><div class="controls pk-controls">${strengthControls(w.place, 'w')}</div></details>
    </div>
    <div id="rest" class="rest" hidden></div>
    <div class="wk-bottom">
      ${w.items[w.index] ? `<button class="btn secondary square" data-action="pk-back" aria-label="Tillbaka till övningen">${ICON.chevronL}</button>` : ''}
      <button class="btn success grow" data-action="finish" ${started ? '' : 'disabled'}>Klar – spara passet</button>
    </div>`;
  mountFigures(root);
  updateTimers();
}

function setRow(ex, s, k) {
  return `
    <div class="set ${s.done ? 'done' : ''}">
      <span class="set-no">${k + 1}</span>
      ${ex.equipment !== 'none' ? `
        <label class="kg"><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${s.weight ? fmtNum(s.weight, 2) : ''}" data-input="weight" data-k="${k}" aria-label="Vikt set ${k + 1}"><span>kg</span></label>` : ''}
      <div class="stepper">
        <button data-action="reps" data-k="${k}" data-d="-1" aria-label="Minska">−</button>
        <b id="reps-${k}">${s.reps} ${ex.timed ? 's' : 'st'}</b>
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
  save();
  renderWorkout();
  $('#wk-body').scrollTop = 0;
}

function finishWorkout() {
  const w = data.active;
  const entries = w.items
    .map((it) => ({ exId: it.exId, sets: it.sets.filter((s) => s.done).map(({ reps, weight }) => ({ reps, weight: Number(weight) || 0 })) }))
    .filter((e) => e.sets.length);
  if (entries.length) {
    data.sessions.push({ id: uid(), place: w.place, date: new Date(w.start).toISOString(), endDate: new Date().toISOString(), entries });
  }
  const place = w.place;
  data.active = null;
  const reached = checkGoals();
  save();
  closeWorkout();
  regenerate(place);
  if (entries.length) {
    ui.tab = 'log';
    toast(reached.length ? `🏆 Mål klart: ${goalLabel(reached[0])}!` : 'Passet sparat 💪');
  }
  render();
}

function endWorkoutDialog() {
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
      if (SUB.has(to) && !SUB.has(ui.tab)) {
        ui.back = ui.tab;
        // Via startsidan eller Planera: börja med ett vanligt förslag, inte ett tidigare inläst pass.
        if (ui.loaded[to]) { ui.loaded[to] = null; ui.plans[to] = null; if (to !== 'swim') { ui.fixed[to] = null; ui.iplans[to] = null; } }
        if (to !== 'swim' && ui.skipPhysio[to] && data.settings.physioAlways) { ui.skipPhysio[to] = false; ui.plans[to] = null; ui.iplans[to] = null; }
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

    // Sparade pass
    case 'save-plan':
      openSheet(savePlanSheet(place)); break;
    case 'load-saved':
      loadSaved(t.dataset.id); break;
    case 'delete-saved': {
      const s = savedById(t.dataset.id);
      confirmDialog({ title: `Ta bort ”${esc(s.name)}”?`, message: 'Passet tas också bort från veckoplanen.', buttons: [
        { label: 'Ta bort', style: 'danger', onClick: () => {
          data.saved = data.saved.filter((x) => x.id !== s.id);
          data.week = data.week.map((v) => (v === `saved:${s.id}` ? '' : v));
          save(); render();
        } },
        { label: 'Avbryt' }] });
      break;
    }
    case 'minutes':
      ui.minutes[place] = Number(t.dataset.value); regenerate(place); render(); break;
    case 'regenerate':
      regenerate(place); render(); break;
    case 'leave-physio':
      ui.fixed[place] = null; ui.skipPhysio[place] = true; ui.loaded[place] = null; regenerate(place); render(); break;
    case 'swap': {
      const plan = ui.plans[place];
      const i = Number(t.dataset.index);
      const next = replacement(plan[i].exId, plan.map((p) => p.exId), place, exOpts());
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
      ui.fixed[place] = null; ui.loaded[place] = null;
      regenerate(place); render(); break;
    case 'iswap': {
      const plan = ui.iplans[place];
      const i = Number(t.dataset.index);
      const next = replacement(plan.stations[i].exId, plan.stations.map((x) => x.exId), place, exOpts());
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
      for (const pl of ['gym', 'home']) if (!ui.loaded[pl]) ui.iplans[pl] = null;
      const box = t.closest('.pain-box');
      if (box) box.outerHTML = painSelector(box.dataset.areas.split(','));
      if (!data.active) render();
      else if (data.active.picking) renderWorkout();
      break;
    }
    case 'rehab-start': {
      unlockAudio();
      const ids = rehabSuggestions('home', [], 3).flatMap(([, list]) => list.map((ex) => ex.id));
      const items = [...new Set(ids)].map((id) => newItem(id));
      data.active = { place: 'home', start: Date.now(), index: 0, restEnd: null, restBeeped: false,
        gear: ['body'], groups: [], busy: {}, picking: false, items };
      save(); openWorkout(); break;
    }
    case 'priority': data.settings.priority = t.dataset.value; save(); if (ui.weekProposal) makeWeek(); render(); break;
    case 'goal-new': openSheet(goalSheet(t.dataset.id)); break;
    case 'goal-delete':
      confirmDialog({ title: 'Ta bort målet?', buttons: [
        { label: 'Ta bort', style: 'danger', onClick: () => { data.goals = data.goals.filter((g) => g.id !== t.dataset.id); save(); render(); } },
        { label: 'Avbryt' }] });
      break;
    case 'wdays': data.settings.weekDays = Number(t.dataset.value); save(); if (ui.weekProposal) makeWeek(); render(); break;
    case 'wkind': data.settings.weekKinds = toggle(weekKinds(), t.dataset.value); save(); if (ui.weekProposal) makeWeek(); render(); break;
    case 'week-suggest': makeWeek(); render(); break;
    case 'week-cancel': ui.weekProposal = null; render(); break;
    case 'week-apply':
      for (const x of ui.weekProposal.days) {
        data.week[weekIndex(x.date)] = x.kind;
        data.weekFocus[weekIndex(x.date)] = x.focus ?? [];
      }
      ui.weekProposal = null; save(); render(); toast('Veckoplanen är uppdaterad'); break;
    case 'use-focus': setPref('groups', place, [...data.weekFocus[weekIndex()]]); render(); break;
    case 'detail':
      openSheet(detailSheet(BY_ID[t.dataset.id])); break;
    case 'library':
      openSheet(librarySheet(place)); break;
    case 'close-sheet':
      closeSheet(); break;
    case 'guide':
      openSheet(guideSheet()); break;

    // Logg
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
        { label: 'Radera allt', style: 'danger', onClick: () => { resetAll(); ensurePain(); resetPlans(); seedPhysio(); render(); toast('All data raderad'); } },
        { label: 'Avbryt' }] });
      break;

    // Pågående pass
    case 'end': endWorkoutDialog(); break;
    case 'finish': finishWorkout(); break;
    case 'next': goTo(w.index + 1); break;
    case 'pick': openPicker(); break;
    case 'pain-sheet': openSheet(painSheet(BY_ID[w.items[w.index].exId])); break;
    case 'pain-swap': {
      closeSheet();
      const it = w.items[w.index];
      if (!doneSets(it) && !BY_ID[it.exId].physio) w.items.splice(w.index, 1);
      w.index = Math.max(0, w.items.filter((x) => doneSets(x)).length - 1);
      openPicker(); break;
    }
    case 'pk-back': w.picking = false; save(); renderWorkout(); break;
    case 'busy-now':
      markBusy(w, w.items[w.index].exId);
      w.index = Math.max(0, w.items.filter((it) => doneSets(it)).length - 1);
      openPicker(); break;
    case 'q-go': delete w.busy[w.items[k].exId]; runItem(w, w.items[k]); break;
    case 's-go': runItem(w, newItem(t.dataset.id)); break;
    case 's-queue': w.items.push(newItem(t.dataset.id)); save(); renderWorkout(); toast('Lagd i kön'); break;
    case 's-busy': markBusy(w, t.dataset.id); save(); renderWorkout(); break;
    case 's-free': delete w.busy[t.dataset.id]; save(); renderWorkout(); break;
    case 's-more': w.more = true; save(); renderWorkout(); break;
    case 'q-up': {
      const qi = queueIndexes(w);
      const p = qi.indexOf(k);
      if (p > 0) [w.items[qi[p - 1]], w.items[k]] = [w.items[k], w.items[qi[p - 1]]];
      save(); renderWorkout(); break;
    }
    case 'q-busy': markBusy(w, w.items[k].exId); save(); renderWorkout(); break;
    case 'q-remove': {
      w.items.splice(k, 1);
      if (w.index >= k && w.index > 0) w.index--;
      save(); renderWorkout(); break;
    }
    case 'wgear': w.gear = toggle(w.gear, t.dataset.value); save(); renderWorkout(); break;
    case 'wgroup': w.groups = toggle(w.groups, t.dataset.value); save(); renderWorkout(); break;
    case 'gear': setPref('gear', place, toggle(gearFor(place), t.dataset.value)); render(); break;
    case 'group': setPref('groups', place, toggle(groupsFor(place), t.dataset.value)); render(); break;
    case 'prev': goTo(w.index - 1); break;
    case 'reps': {
      const item = w.items[w.index];
      const ex = BY_ID[item.exId];
      const step = ex.timed ? 5 : 1;
      const s = item.sets[k];
      s.reps = Math.min(300, Math.max(1, s.reps + Number(t.dataset.d) * step));
      $(`#reps-${k}`).textContent = `${s.reps} ${ex.timed ? 's' : 'st'}`;
      save();
      break;
    }
    case 'toggle-set': {
      unlockAudio();
      const s = w.items[w.index].sets[k];
      s.done = !s.done;
      if (s.done) { w.restEnd = Date.now() + data.settings.restSeconds * 1000; w.restBeeped = false; }
      save();
      const row = t.closest('.set');
      row.classList.toggle('done', s.done);
      t.setAttribute('aria-pressed', s.done);
      updateTimers();
      break;
    }
    case 'add-set': {
      const sets = w.items[w.index].sets;
      const prev = sets[sets.length - 1];
      sets.push({ reps: prev?.reps ?? 10, weight: prev?.weight ?? 0, done: false });
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
    case 'swim-style':
      ui.swimStyle = t.value; regenerate('swim'); render(); break;
    case 'goal-ex':
      $('#goal-metric').innerHTML = goalMetricFields(BY_ID[t.value]); break;
    case 'weekday':
      data.week[Number(t.dataset.day)] = t.value;
      data.weekFocus[Number(t.dataset.day)] = []; save(); render(); break;
    case 'steps-date':
      if (t.value) openSheet(stepsSheet(t.value));
      break;
    case 'dumbbells':
      data.settings.hasDumbbells = t.checked; save(); ui.plans.home = null; ui.iplans.home = null; break;
    case 'physio':
      data.settings.physioAlways = t.checked; save();
      for (const pl of ['gym', 'home']) { ui.fixed[pl] = null; ui.skipPhysio[pl] = false; ui.loaded[pl] = null; ui.plans[pl] = null; ui.iplans[pl] = null; }
      break;
    case 'knee':
      data.settings.kneeFriendly = t.checked; save();
      if (!ui.loaded.gym) { ui.plans.gym = null; ui.iplans.gym = null; }
      if (!ui.loaded.home) { ui.plans.home = null; ui.iplans.home = null; }
      break;
    case 'import': {
      const file = t.files?.[0];
      if (!file) break;
      file.text().then((text) => {
        importJSON(text);
        ensurePain();
        resetPlans();
        seedPhysio();
        render();
        toast('Säkerhetskopian är importerad');
      }).catch(() => toast('Kunde inte läsa filen'));
      break;
    }
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.input === 'weight' && data.active) {
    const v = parseFloat(String(t.value).replace(',', '.'));
    data.active.items[data.active.index].sets[Number(t.dataset.k)].weight = Number.isFinite(v) ? v : 0;
    save();
  } else if (t.dataset.input === 'search') {
    $('#lib-list').innerHTML = libraryList(ui.tab, t.value);
    mountFigures($('#lib-list'));
  }
});

function makeWeek() {
  ui.weekProposal = weekKinds().length ? suggestWeek({ days: weekDays(), kinds: weekKinds(), sessions: data.sessions,
    swims: data.swims, walks: data.walks, pain: data.settings.pain, priority: priority() }) : null;
}

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
  'goal-form'(f) {
    const exId = f.get('exId');
    const metric = f.get('metric');
    const target = parseFloat(String(f.get('target')).replace(',', '.'));
    if (!BY_ID[exId] || !(target > 0)) { toast('Skriv in ett mål'); return; }
    data.goals.push({ id: uid(), exId, metric, target, start: goalBest({ exId, metric }), created: new Date().toISOString() });
    toast('Målet är sparat 🎯');
  },
  'save-plan-form'(f) {
    const place = f.get('place');
    const name = String(f.get('name')).trim() || PASS_NAME[place];
    const type = place === 'swim' ? undefined : ui.type[place];
    const items = place === 'swim' ? clone(ui.plans.swim).map((x) => ({ ...x, done: false }))
      : type === 'strength' ? clone(ui.plans[place]) : clone(ui.iplans[place].stations);
    data.saved.push({ id: uid(), name, place, type, items, minutes: ui.minutes[place] });
    ui.loaded[place] = name;
    toast('Sparat under Planera');
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
});

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
ensurePain();
seedPhysio();
render();
if (data.active) openWorkout(); // återuppta pågående pass

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
