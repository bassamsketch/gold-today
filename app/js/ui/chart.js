const W = 340, H = 210, TOP = 16, BOT = 30, X0 = 6, XS = W * 0.36, X1 = W - 6;
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
const put = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, typeof v === 'number' ? f1(v) : v));

/**
 * Past 5 years (solid, log scale), then the range gold's own history gives for 5 and 10 years as a
 * faint fan with no middle line, so it never reads as a prediction (QA1). The banks' view is a
 * separate marker with its range. Today's point and the banks' marker carry their values (QA25).
 * Word labels and values sit on separate lines, so Arabic and digits never mix in one SVG line.
 */
export function drawFuture(svg, { past, today, y1, y5, y10, words, values }, animate) {
  const knots = [{ m: 0, lo: today, hi: today }];
  if (y5) knots.push({ m: 60, ...y5 });
  if (y10) knots.push({ m: 120, ...y10 });
  const all = past.concat(knots.flatMap((k) => [k.lo, k.hi]), y1 ? [y1.lo, y1.hi] : []);
  const ymin = Math.log(Math.min(...all) * 0.92), ymax = Math.log(Math.max(...all) * 1.04);
  const Y = (v) => TOP + (1 - (Math.log(v) - ymin) / (ymax - ymin)) * (H - TOP - BOT);
  const xp = (i) => X0 + (i * (XS - X0)) / (past.length - 1);
  const xf = (m) => XS + (m * (X1 - XS)) / 120;
  const q = (sel) => svg.querySelector(sel);

  q('.f-past').setAttribute('d', smooth(past.map((v, i) => [xp(i), Y(v)])));
  const hi = knots.map((k) => [xf(k.m), Y(k.hi)]), lo = knots.map((k) => [xf(k.m), Y(k.lo)]).reverse();
  q('.f-band').setAttribute('d', knots.length > 1 ? `${line(hi)} ${line(lo).replace(/^M/, 'L')} Z` : '');

  const bank = [q('.f-bank-range'), q('.f-bank'), q('.f-bank-w'), q('.f-bank-v')];
  bank.forEach((n) => { n.style.display = y1 ? '' : 'none'; });
  if (y1) {
    const x = xf(12), y = Y(y1.mid);
    put(bank[0], { x1: x, x2: x, y1: Y(y1.hi), y2: Y(y1.lo) });
    put(bank[1], { cx: x, cy: y });
    put(bank[2], { x: x + 10, y: y - 4 });
    put(bank[3], { x: x + 10, y: y + 11 });
    bank[2].textContent = words.bank;
    bank[3].textContent = values.bank;
  }

  put(q('.f-today'), { x1: XS, x2: XS, y1: TOP - 8, y2: H - BOT + 6 });
  const ty = Y(today);
  put(q('.f-now'), { cx: XS, cy: ty });
  // below and right of today's point: under the fan's lower edge, clear of the past line; above it when too low
  const below = ty + 36 <= H - BOT + 8;
  put(q('.f-now-w'), { x: XS + 9, y: below ? ty + 19 : ty - 24 });
  put(q('.f-now-v'), { x: XS + 9, y: below ? ty + 34 : ty - 9 });
  q('.f-now-w').textContent = words.today;
  q('.f-now-v').textContent = values.today;

  [['.f-l0', X0, words.start], ['.f-l2', X1, words.end]].forEach(([sel, x, text]) => {
    const t = q(sel);
    put(t, { x, y: H - 8 });
    t.textContent = text;
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
