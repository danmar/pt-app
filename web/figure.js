// Ritar och animerar streckgubbar som SVG.
import { ANIMATIONS, BY_ID } from './exercises.js';

const NS = 'http://www.w3.org/2000/svg';
const KEYS = ['head', 'neck', 'hip', 'elbowN', 'handN', 'elbowF', 'handF', 'kneeN', 'footN', 'kneeF', 'footF'];
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const playing = new Set();
let rafId = null;

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.appendChild(node);
  return node;
}

function lerpPose(a, b, t) {
  const out = {};
  for (const k of KEYS) out[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t];
  return out;
}

const pts = (...points) => points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(' ');

function build(exercise) {
  const anim = ANIMATIONS[exercise.anim];
  const props = exercise.props ?? [];
  const svg = el('svg', { viewBox: '-0.09 -0.18 1.18 1.18', class: 'figure-svg', 'aria-hidden': 'true' });
  el('line', { x1: 0, y1: 0.96, x2: 1, y2: 0.96, class: 'floor' }, svg);

  if (props.includes('bench')) {
    el('rect', { x: 0.26, y: 0.72, width: 0.58, height: 0.045, rx: 0.01, class: 'prop soft' }, svg);
    for (const x of [0.32, 0.78]) el('line', { x1: x, y1: 0.765, x2: x, y2: 0.96, class: 'prop-line soft' }, svg);
  }
  if (props.includes('captain')) {
    el('line', { x1: 0.43, y1: 0.08, x2: 0.43, y2: 0.96, class: 'prop-line soft' }, svg);
    el('rect', { x: 0.41, y: 0.10, width: 0.04, height: 0.44, rx: 0.015, class: 'prop soft' }, svg);
    el('rect', { x: 0.44, y: 0.385, width: 0.26, height: 0.03, rx: 0.01, class: 'prop' }, svg);
  }
  if (props.includes('pullUpBar')) el('line', { x1: 0.22, y1: -0.06, x2: 0.84, y2: -0.06, class: 'prop-line' }, svg);
  if (props.includes('bike')) {
    el('circle', { cx: 0.68, cy: 0.80, r: 0.11, class: 'prop-ring soft' }, svg);
    el('line', { x1: 0.40, y1: 0.55, x2: 0.50, y2: 0.80, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.50, y1: 0.80, x2: 0.80, y2: 0.44, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.36, y1: 0.95, x2: 0.84, y2: 0.95, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.50, y1: 0.80, x2: 0.42, y2: 0.95, class: 'prop-line soft' }, svg);
    el('rect', { x: 0.33, y: 0.52, width: 0.13, height: 0.03, rx: 0.012, class: 'prop' }, svg);
    el('line', { x1: 0.77, y1: 0.42, x2: 0.84, y2: 0.42, class: 'prop-line' }, svg);
  }
  if (props.includes('thighpad')) el('rect', { x: 0.55, y: 0.50, width: 0.10, height: 0.04, rx: 0.015, class: 'prop' }, svg);
  if (props.includes('rowseat')) {
    el('rect', { x: 0.14, y: 0.79, width: 0.30, height: 0.04, rx: 0.01, class: 'prop soft' }, svg);
    el('line', { x1: 0.28, y1: 0.83, x2: 0.28, y2: 0.96, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.72, y1: 0.70, x2: 0.72, y2: 0.92, class: 'prop-line' }, svg);
  }
  if (exercise.cable) el('circle', { cx: exercise.cable[0], cy: exercise.cable[1], r: 0.03, class: 'prop-ring' }, svg);
  if (props.includes('wall')) el('line', { x1: 0.265, y1: -0.12, x2: 0.265, y2: 0.96, class: 'prop-line soft' }, svg);
  if (props.includes('machine')) {
    el('rect', { x: 0.30, y: 0.60, width: 0.36, height: 0.04, rx: 0.01, class: 'prop soft' }, svg);
    el('line', { x1: 0.31, y1: 0.60, x2: 0.26, y2: 0.24, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.46, y1: 0.64, x2: 0.46, y2: 0.96, class: 'prop-line soft' }, svg);
  }
  if (props.includes('legpress')) {
    el('line', { x1: 0.43, y1: 0.79, x2: 0.10, y2: 0.44, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.36, y1: 0.80, x2: 0.36, y2: 0.96, class: 'prop-line soft' }, svg);
    el('line', { x1: 0.80, y1: 0.40, x2: 1.02, y2: 0.24, class: 'prop-line soft' }, svg);
  }

  const far = anim.front ? 'limb' : 'limb far';
  const parts = {
    farLeg: el('polyline', { class: far }, svg),
    farArm: el('polyline', { class: far }, svg),
  };
  const dumbbell = (cls) => el('rect', { width: 0.075, height: 0.045, rx: 0.013, class: cls }, svg);
  if (props.includes('dumbbells')) parts.farDb = dumbbell(anim.front ? 'prop' : 'prop far');
  if (props.includes('barbell')) {
    parts.plate = el('circle', { r: 0.075, class: 'prop plate' }, svg);
    parts.hub = el('circle', { r: 0.019, class: 'hub' }, svg);
  }
  parts.torso = el('polyline', { class: 'limb' }, svg);
  parts.nearLeg = el('polyline', { class: 'limb' }, svg);
  if (exercise.cable) { parts.cable = el('line', { class: 'prop-rope' }, svg); parts.cableAt = exercise.cable; }
  if (props.includes('rope')) { parts.ropeN = el('polyline', { class: 'prop-rope' }, svg); parts.ropeF = el('polyline', { class: 'prop-rope soft' }, svg); }
  if (props.includes('pad')) parts.pad = el('circle', { r: 0.035, class: 'prop' }, svg);
  if (props.includes('legpress')) parts.platform = el('line', { class: 'prop-line' }, svg);
  parts.head = el('circle', { r: 0.058, class: 'head' }, svg);
  parts.nearArm = el('polyline', { class: 'limb' }, svg);
  if (props.includes('dumbbells')) parts.nearDb = dumbbell('prop');

  return { svg, parts, anim };
}

function draw({ parts }, p) {
  parts.farLeg.setAttribute('points', pts(p.hip, p.kneeF, p.footF));
  parts.farArm.setAttribute('points', pts(p.neck, p.elbowF, p.handF));
  parts.torso.setAttribute('points', pts(p.head, p.neck, p.hip));
  parts.nearLeg.setAttribute('points', pts(p.hip, p.kneeN, p.footN));
  parts.nearArm.setAttribute('points', pts(p.neck, p.elbowN, p.handN));
  parts.head.setAttribute('cx', p.head[0]);
  parts.head.setAttribute('cy', p.head[1]);
  for (const [key, hand] of [['farDb', p.handF], ['nearDb', p.handN]]) {
    if (!parts[key]) continue;
    parts[key].setAttribute('x', hand[0] - 0.0375);
    parts[key].setAttribute('y', hand[1] - 0.0225);
  }
  for (const [key, hand] of [['ropeN', p.handN], ['ropeF', p.handF]]) {
    if (!parts[key]) continue;
    const mid = [(hand[0] + 1.06) / 2, (hand[1] + 0.93) / 2 + (0.6 - hand[1]) * 0.5];
    parts[key].setAttribute('points', pts(hand, mid, [1.06, 0.93]));
  }
  if (parts.cable) {
    parts.cable.setAttribute('x1', p.handN[0]); parts.cable.setAttribute('y1', p.handN[1]);
    parts.cable.setAttribute('x2', parts.cableAt[0]); parts.cable.setAttribute('y2', parts.cableAt[1]);
  }
  if (parts.pad) {
    parts.pad.setAttribute('cx', p.footN[0]);
    parts.pad.setAttribute('cy', p.footN[1] - 0.045);
  }
  if (parts.platform) { // plattan står vinkelrätt mot benpressens riktning
    const [x, y] = p.footN;
    parts.platform.setAttribute('x1', x + 0.025 - 0.07); parts.platform.setAttribute('y1', y + 0.03 - 0.1);
    parts.platform.setAttribute('x2', x + 0.025 + 0.07); parts.platform.setAttribute('y2', y + 0.03 + 0.1);
  }
  for (const key of ['plate', 'hub']) {
    if (!parts[key]) continue;
    parts[key].setAttribute('cx', p.handN[0]);
    parts[key].setAttribute('cy', p.handN[1]);
  }
}

/** Ställning vid tiden ms. Går runt genom alla ställningar med mjuka övergångar. */
function poseAt(anim, ms) {
  const n = anim.frames.length;
  const t = (((ms / 1000 / anim.period) % 1) + 1) % 1 * n;
  const i = Math.floor(t);
  const ease = (1 - Math.cos(Math.PI * (t - i))) / 2;
  return lerpPose(anim.frames[i], anim.frames[(i + 1) % n], ease);
}

function tick(now) {
  for (const fig of playing) {
    if (!fig.svg.isConnected) { playing.delete(fig); continue; }
    draw(fig, poseAt(fig.anim, now));
  }
  rafId = playing.size ? requestAnimationFrame(tick) : null;
}

/** Hittar alla `.fig[data-ex]` under root och ritar in gubbar. `data-play` = animera. */
export function mountFigures(root) {
  for (const host of root.querySelectorAll('.fig[data-ex]:not([data-mounted])')) {
    const exercise = BY_ID[host.dataset.ex];
    if (!exercise) continue;
    host.dataset.mounted = '1';
    const fig = build(exercise);
    host.appendChild(fig.svg);
    if (host.dataset.play && !reducedMotion) {
      draw(fig, poseAt(fig.anim, performance.now()));
      playing.add(fig);
    } else {
      draw(fig, fig.anim.frames[1]); // stillbild
    }
  }
  if (playing.size && rafId === null) rafId = requestAnimationFrame(tick);
}
