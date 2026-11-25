const W = 340, H = 200, TOP = 16, BOT = 30, X0 = 6, XS = W * 0.36, X1 = W - 6;
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
const line = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join(' ');

/**
 * Past 5 years (solid, log scale) joined at today to the history-based path (dotted) through the
 * 5 and 10-year points, inside its low-high band. The banks' 1-year view is drawn apart, as its own
 * marker with its range, so the two methods never read as one path. Values are in rials per gram.
 */
export function drawFuture(svg, { past, today, y1, y5, y10, labels, bankLabel }, animate) {
  const knots = [{ m: 0, lo: today, mid: today, hi: today }];
  if (y5) knots.push({ m: 60, ...y5 });
  if (y10) knots.push({ m: 120, ...y10 });
  const all = past.concat(knots.flatMap((k) => [k.lo, k.hi]), y1 ? [y1.lo, y1.hi] : []);
  const ymin = Math.log(Math.min(...all) * 0.92), ymax = Math.log(Math.max(...all) * 1.04);
  const Y = (v) => TOP + (1 - (Math.log(v) - ymin) / (ymax - ymin)) * (H - TOP - BOT);
  const xp = (i) => X0 + (i * (XS - X0)) / (past.length - 1);
  const xf = (m) => XS + (m * (X1 - XS)) / 120;
  const q = (sel) => svg.querySelector(sel);

  q('.f-past').setAttribute('d', smooth(past.map((v, i) => [xp(i), Y(v)])));
  q('.f-mid').setAttribute('d', line(knots.map((k) => [xf(k.m), Y(k.mid)])));
  const hi = knots.map((k) => [xf(k.m), Y(k.hi)]), lo = knots.map((k) => [xf(k.m), Y(k.lo)]).reverse();
  q('.f-band').setAttribute('d', `${line(hi)} ${line(lo).replace(/^M/, 'L')} Z`);
  const marks = svg.querySelectorAll('.f-m');
  marks.forEach((c, i) => {
    const k = knots[i + 1];
    c.style.display = k ? '' : 'none';
    if (k) { c.setAttribute('cx', f1(xf(k.m))); c.setAttribute('cy', f1(Y(k.mid))); }
  });
  const range = q('.f-bank-range'), bank = q('.f-bank'), bankText = q('.f-bank-l');
  [range, bank, bankText].forEach((n) => { n.style.display = y1 ? '' : 'none'; });
  if (y1) {
    const x = xf(12);
    range.setAttribute('x1', f1(x)); range.setAttribute('x2', f1(x));
    range.setAttribute('y1', f1(Y(y1.hi))); range.setAttribute('y2', f1(Y(y1.lo)));
    bank.setAttribute('cx', f1(x)); bank.setAttribute('cy', f1(Y(y1.mid)));
    bankText.setAttribute('x', f1(x + 8)); bankText.setAttribute('y', f1(Y(y1.hi) + 4));
    bankText.textContent = bankLabel || '';
  }
  const td = q('.f-today');
  td.setAttribute('x1', f1(XS)); td.setAttribute('x2', f1(XS)); td.setAttribute('y1', TOP - 8); td.setAttribute('y2', H - BOT + 6);
  const now = q('.f-now');
  now.setAttribute('cx', f1(XS)); now.setAttribute('cy', f1(Y(today)));
  [['.f-l0', X0], ['.f-l1', XS], ['.f-l2', X1]].forEach(([sel, x], i) => {
    const t = q(sel);
    t.setAttribute('x', f1(x));
    t.setAttribute('y', H - 8);
    t.textContent = labels[i];
  });

  const clip = q('.f-clip');
  if (!animate || reduce()) return clip.setAttribute('width', W);
  const t0 = performance.now();
  clip.setAttribute('width', 0);
  const step = (t) => {
    const k = Math.max(0, Math.min(1, (t - t0) / 1800));
    clip.setAttribute('width', f1(W * ease(k)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
