// Små SVG-diagram utan bibliotek. Varje markering har data-tip, som visas i kortets
// avläsningsrad när man trycker eller hovrar (se app.js).
const W = 340;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Number(n).toLocaleString('sv-SE', { maximumFractionDigits: 1 });

/** Runda axelsteg: 0, steg, 2·steg … som täcker max. */
function ticks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const out = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(+v.toFixed(6));
  if (out[out.length - 1] < max) out.push(+(out[out.length - 1] + step).toFixed(6));
  return out;
}
const compact = (v) => (v >= 10000 ? `${fmt(v / 1000)}k` : fmt(v));

/** Stapel med 4px rundad topp och rak botten. */
function bar(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/**
 * Staplade kolumner. cols: [{ label, values: { serie: tal }, tip }], series: [{ key, name, cls }].
 * goal: valfri referenslinje { value, label }.
 */
export function columns({ cols, series, height = 170, unit = '', goal }) {
  const padL = 34, padB = 22, padT = 10;
  const totals = cols.map((c) => series.reduce((n, s) => n + (c.values[s.key] || 0), 0));
  const t = ticks(Math.max(1, ...totals, goal?.value ?? 0));
  const max = t[t.length - 1];
  const plotH = height - padB - padT;
  const slot = (W - padL) / cols.length;
  const bw = Math.min(24, slot * 0.62);
  const y = (v) => padT + plotH - (v / max) * plotH;
  const every = Math.ceil(cols.length / 8);
  let svg = t.map((v) => `<line class="grid" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('');
  cols.forEach((c, i) => {
    const x = padL + slot * i + (slot - bw) / 2;
    let base = 0;
    const segs = series.filter((s) => c.values[s.key] > 0);
    segs.forEach((s, j) => {
      const v = c.values[s.key];
      const top = y(base + v);
      // 2px yta mellan staplade segment; bara översta segmentet får rundad topp.
      const h = Math.max(0, y(base) - top - (j > 0 ? 2 : 0));
      svg += j === segs.length - 1
        ? `<path class="mark ${s.cls}" d="${bar(x, top, bw, h)}"/>`
        : `<rect class="mark ${s.cls}" x="${x}" y="${top}" width="${bw}" height="${h}"/>`;
      base += v;
    });
    svg += `<rect class="hit" x="${padL + slot * i}" y="${padT}" width="${slot}" height="${plotH}" data-tip="${esc(c.tip)}"/>`;
    if ((cols.length - 1 - i) % every === 0) svg += `<text class="tick" x="${padL + slot * i + slot / 2}" y="${height - 6}" text-anchor="middle">${esc(c.label)}</text>`;
  });
  // Mållinjen ritas ovanpå staplarna; den namnges i diagrammets underrubrik.
  if (goal) svg += `<line class="ref" x1="${padL}" x2="${W}" y1="${y(goal.value)}" y2="${y(goal.value)}"/>`;
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${height}" role="img" aria-label="Stapeldiagram${unit ? ` i ${unit}` : ''}">${svg}</svg>`;
}

/** Liggande staplar, en serie. rows: [{ label, value, tip }]. */
export function hbars({ rows, cls = 's-accent', unit = '' }) {
  const rowH = 30, labelW = 96, valueW = 44;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const plotW = W - labelW - valueW;
  const height = rows.length * rowH;
  const svg = rows.map((r, i) => {
    const yy = i * rowH;
    const w = (r.value / max) * plotW;
    const bh = 14;
    const by = yy + (rowH - bh) / 2;
    const path = w > 0 ? `M${labelW},${by}H${labelW + w - Math.min(4, w)}Q${labelW + w},${by} ${labelW + w},${by + Math.min(4, w)}V${by + bh - Math.min(4, w)}Q${labelW + w},${by + bh} ${labelW + w - Math.min(4, w)},${by + bh}H${labelW}Z` : '';
    return `<text class="tick lbl" x="0" y="${yy + rowH / 2 + 4}">${esc(r.label)}</text>
      <line class="grid" x1="${labelW}" x2="${labelW}" y1="${yy + 4}" y2="${yy + rowH - 4}"/>
      ${path ? `<path class="mark ${cls}" d="${path}"/>` : ''}
      <text class="value" x="${labelW + w + 6}" y="${yy + rowH / 2 + 4}">${fmt(r.value)}${unit}</text>
      <rect class="hit" x="0" y="${yy}" width="${W}" height="${rowH}" data-tip="${esc(r.tip)}"/>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${height}" role="img" aria-label="Liggande stapeldiagram">${svg}</svg>`;
}

/** Linje med punkter, en serie. points: [{ x: Date, y: tal, tip }]. */
export function line({ points, height = 180, unit = '', cls = 's-accent' }) {
  const padL = 34, padR = 44, padB = 22, padT = 12;
  if (!points.length) return '';
  const ys = points.map((p) => p.y);
  const t = ticks(Math.max(...ys) * 1.05);
  // Börja axeln närmare värdena när de ligger högt, så att utvecklingen syns.
  const minY = Math.min(...ys);
  const lo = minY > t[t.length - 1] * 0.5 ? Math.max(...t.filter((v) => v <= minY)) : 0;
  const tt = t.filter((v) => v >= lo);
  const max = tt[tt.length - 1];
  const plotH = height - padB - padT;
  const x0 = points[0].x.getTime();
  const x1 = points[points.length - 1].x.getTime();
  const X = (d) => padL + (x1 === x0 ? (W - padL - padR) / 2 : ((d.getTime() - x0) / (x1 - x0)) * (W - padL - padR));
  const Y = (v) => padT + plotH - ((v - lo) / Math.max(1e-9, max - lo)) * plotH;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${d}L${X(points[points.length - 1].x).toFixed(1)},${Y(lo)}L${X(points[0].x).toFixed(1)},${Y(lo)}Z`;
  const last = points[points.length - 1];
  const dateLbl = (dt) => dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }).replace('.', '');
  let svg = tt.map((v) => `<line class="grid" x1="${padL}" x2="${W - padR + 10}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('');
  svg += `<path class="area ${cls}" d="${area}"/><path class="line ${cls}" d="${d}"/>`;
  // Punkter bara när de är få; annars bara slutpunkten, så att linjen syns tydligt.
  const showDots = points.length <= 12;
  svg += points.map((p, i) => `${showDots || i === points.length - 1 ? `<circle class="dot ${cls}" cx="${X(p.x)}" cy="${Y(p.y)}" r="4"/>` : ''}<circle class="hit" cx="${X(p.x)}" cy="${Y(p.y)}" r="${Math.max(6, Math.min(14, (W - padL - padR) / points.length / 2 + 2))}" data-tip="${esc(p.tip)}"/>`).join('');
  svg += `<text class="value" x="${X(last.x) + 8}" y="${Y(last.y) + 4}">${fmt(last.y)}${unit}</text>`;
  svg += `<text class="tick" x="${padL}" y="${height - 6}">${dateLbl(points[0].x)}</text>`;
  if (points.length > 1) svg += `<text class="tick" x="${W - padR}" y="${height - 6}" text-anchor="end">${dateLbl(last.x)}</text>`;
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${height}" role="img" aria-label="Linjediagram">${svg}</svg>`;
}

/** Tabellvy för tillgänglighet. */
export function table(head, rows) {
  return `<details class="chart-table"><summary>Visa som tabell</summary><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}
