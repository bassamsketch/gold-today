const W = 340, H = 214, TOP = 30, BOT = 30, X0 = 8, XT = 326;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => 1 - Math.pow(1 - t, 4);
const f1 = (n) => n.toFixed(1);

function smooth(pts) {
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
const put = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, typeof v === 'number' ? f1(v) : v));

/**
 * The last five years of monthly closes and today's price, on a linear scale, with the record high marked (design 7.1).
 * `record` is { x, value } with x in months from the first point (a daily record sits between months), or null when
 * the record is older than the chart. No forecasts on this chart. Word labels and values sit on separate lines, so
 * Arabic and digits never mix in one SVG text.
 */
export function drawHistory(svg, { past, today, record, words, values }, animate) {
  const series = past.concat(today);
  const step = (XT - X0) / (series.length - 1);
  const all = series.concat(record ? [record.value] : []);
  const lo = Math.min(...all) * 0.94, hi = Math.max(...all) * 1.05;
  const Y = (v) => TOP + (1 - (v - lo) / (hi - lo)) * (H - TOP - BOT);
  const q = (sel) => svg.querySelector(sel);

  q('.f-past').setAttribute('d', smooth(series.map((v, i) => [X0 + i * step, Y(v)])));

  const rec = [q('.f-rec'), q('.f-rec-w'), q('.f-rec-v')];
  rec.forEach((n) => { n.style.display = record ? '' : 'none'; });
  if (record) {
    const x = X0 + record.x * step, y = Y(record.value);
    put(rec[0], { cx: x, cy: y });
    put(rec[1], { x: x - 10, y: y - 4 });
    put(rec[2], { x: x - 10, y: y + 12 });
    rec[1].textContent = words.record;
    rec[2].textContent = values.record;
  }

  const ty = Y(today);
  put(q('.f-now'), { cx: XT, cy: ty });
  put(q('.f-now-w'), { x: XT - 4, y: ty + 22 });
  put(q('.f-now-v'), { x: XT - 4, y: ty + 37 });
  q('.f-now-w').textContent = words.today;
  q('.f-now-v').textContent = values.today;
  const start = q('.f-l0');
  put(start, { x: X0, y: H - 6 });
  start.textContent = words.start;

  const clip = q('.f-clip');
  if (!animate || reduce()) return clip.setAttribute('width', W);
  const t0 = performance.now();
  clip.setAttribute('width', 0);
  const tick = (t) => {
    const k = Math.max(0, Math.min(1, (t - t0) / 1800));
    clip.setAttribute('width', f1(W * ease(k)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
