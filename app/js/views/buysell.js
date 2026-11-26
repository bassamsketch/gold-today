import { pieceCost, offerCheck, priceCheck, jewelleryVsBar, parseNumber } from '../calc.js';
import { gramPrice, formatNum } from '../price.js';
import { MAX_PRICE } from '../config.js';
import { syncKarats, setKaratText } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const VERDICT = { above: 'verdictAbove', close: 'verdictClose', usual: 'verdictUsual', low: 'verdictLow' };
const SCALE = 0.35; // the price-check track runs from no extra to 35% over the gold value
const okGrams = (g) => Number.isFinite(g) && g > 0 && g <= 5000;
const blank = (input) => input.value.trim() === '';
const pctOf = (x) => `${Math.max(0, Math.min(100, (x / SCALE) * 100)).toFixed(1)}%`;

/**
 * Buy & sell tab (design 6): the price check (B1), the offer check (B2), jewellery or a bar (B3), places, the karat
 * guide and tips. Typed results change only when something is typed or chosen, never by themselves (QA19).
 */
export function mount(app) {
  const el = {
    pcExample: $('pc-example'), pcGrams: $('pc-grams'), pcGramsErr: $('pc-grams-err'), pcKarats: $('pc-karats'), pcType: $('pc-type'),
    pcPrice: $('pc-price'), pcPriceErr: $('pc-price-err'), altOpen: $('pc-alt-open'), alt: $('pc-alt'),
    rate: $('cost-rate'), rateHint: $('cost-rate-hint'), rateErr: $('cost-rate-err'), mode: $('cost-mode'), making: $('cost-making'), makingErr: $('cost-making-err'),
    result: $('pc-result'), gold: $('pc-gold'), goldU: $('pc-gold-u'), over: $('pc-over'), extra: $('pc-extra'), extraU: $('pc-extra-u'),
    why: $('pc-why'), usual: $('pc-usual'), dot: $('pc-dot'), verdict: $('pc-verdict'), range: $('pc-range'), basis: $('pc-basis'),
    under: $('pc-under'), back: $('pc-back'), backU: $('pc-back-u'), per100: $('pc-per100'), target: $('pc-target'),
    pcPrompt: $('pc-prompt'), pcNoPrice: $('pc-noprice'),
    ocExample: $('oc-example'), offerGrams: $('offer-grams'), offerGramsErr: $('offer-grams-err'), offerKarats: $('offer-karats'),
    offerAmount: $('offer-amount'), offerAmountErr: $('offer-amount-err'), offerResult: $('offer-result'), verdictO: $('offer-verdict'),
    gap: $('offer-gap'), value: $('offer-value'), offerPrompt: $('offer-prompt'), offerNoPrice: $('offer-noprice'),
    jbRows: $('jb-rows'), places: $('places'),
  };
  let pcK = app.state.karat;
  let pcType = 'bar'; // karat 24 is a bar or coin unless switched (design 6.1)
  let offerK = app.state.karat;
  let mode = 'perGram';
  let rateEdited = false; // the rate holds the shop's own figure
  const live = () => (Number.isFinite(app.price.usd) ? app.price.usd : null);
  const setErr = (input, err, on) => {
    err.hidden = !on;
    input.setAttribute('aria-invalid', String(on));
  };
  const money = (node, unit, v) => {
    node.textContent = formatNum(v, 0);
    unit.textContent = app.t('rialWord', v);
  };

  function setRate() {
    if (rateEdited || live() == null) return;
    el.rate.value = gramPrice(live(), pcK).toFixed(3);
  }

  // the old route: the shop's rate and making charge make the price, with 5% VAT on the whole (design 6.1)
  function priceFromRate() {
    const g = parseNumber(el.pcGrams.value);
    const r = blank(el.rate) ? null : parseNumber(el.rate.value);
    const m = blank(el.making) ? 0 : parseNumber(el.making.value);
    const rateBad = !blank(el.rate) && !(Number.isFinite(r) && r > 0);
    const makingBad = !blank(el.making) && !(Number.isFinite(m) && m >= 0);
    setErr(el.rate, el.rateErr, rateBad);
    setErr(el.making, el.makingErr, makingBad);
    el.rateHint.hidden = rateEdited;
    if (!okGrams(g) || rateBad || makingBad) return;
    const cost = pieceCost({ grams: g, karat: pcK, rate: r, making: m, mode }, live());
    if (cost) el.pcPrice.value = cost.total.toFixed(3);
  }

  function renderPrice() {
    const usd = live();
    const g = parseNumber(el.pcGrams.value), p = parseNumber(el.pcPrice.value);
    const gramsBad = !blank(el.pcGrams) && !okGrams(g);
    const priceBad = !blank(el.pcPrice) && !(Number.isFinite(p) && p > 0 && p <= MAX_PRICE);
    setErr(el.pcGrams, el.pcGramsErr, gramsBad);
    setErr(el.pcPrice, el.pcPriceErr, priceBad);
    el.pcType.hidden = pcK !== 24;
    const ready = okGrams(g) && Number.isFinite(p) && p > 0 && p <= MAX_PRICE;
    const r = ready && usd != null ? priceCheck({ grams: g, karat: pcK, price: p, bar: pcType === 'bar' }, usd) : null;
    el.result.hidden = !r;
    el.pcPrompt.hidden = ready || gramsBad || priceBad;
    el.pcNoPrice.hidden = !(ready && usd == null);
    if (!r) return;
    money(el.gold, el.goldU, r.gold);
    const under = r.position === 'under';
    el.over.hidden = under;
    el.under.hidden = !under;
    if (!under) {
      money(el.extra, el.extraU, r.extra);
      el.why.textContent = app.t(r.bar ? 'pcWhyBar' : 'pcWhy', r.extraPct * 100);
      el.usual.style.insetInlineStart = pctOf(r.band[0]);
      el.usual.style.width = `calc(${pctOf(r.band[1])} - ${pctOf(r.band[0])})`;
      el.dot.style.insetInlineStart = pctOf(r.extraPct);
      const word = { within: 'Within', below: 'Below', above: 'Above' }[r.position];
      el.verdict.textContent = app.t(r.bar ? `pcBar${word}` : `pc${word}`);
      el.range.textContent = app.t('pcRange', r.band[0] * 100, r.band[1] * 100);
      el.basis.textContent = app.t(r.bar ? 'pcBarBasis' : 'pcBasis');
    }
    money(el.back, el.backU, r.back);
    el.per100.textContent = app.t('pcPer100', r.per100);
    el.target.hidden = !r.target;
    if (r.target) setKaratText(el.target, app.t('pcTarget', p, formatNum(r.target, 1), pcK, formatNum(r.rate, 1)), app.t('karatN', pcK));
  }

  function renderOffer() {
    const usd = live();
    const g = parseNumber(el.offerGrams.value);
    const o = parseNumber(el.offerAmount.value);
    const gramsBad = !blank(el.offerGrams) && !okGrams(g);
    const offerBad = !blank(el.offerAmount) && !(Number.isFinite(o) && o > 0);
    setErr(el.offerGrams, el.offerGramsErr, gramsBad);
    setErr(el.offerAmount, el.offerAmountErr, offerBad);
    const ready = okGrams(g) && Number.isFinite(o) && o > 0;
    const res = ready && usd != null ? offerCheck({ grams: g, karat: offerK, offer: o }, usd) : null;
    el.offerResult.hidden = !res;
    el.offerPrompt.hidden = ready || gramsBad || offerBad;
    el.offerNoPrice.hidden = !(ready && usd == null);
    if (!res) return;
    el.verdictO.textContent = app.t(VERDICT[res.verdict]);
    el.gap.textContent = res.verdict === 'above' ? app.t('gapAbove', formatNum(-res.gapPct, 1)) : app.t('gapBelow', formatNum(res.gapPct, 1));
    el.value.textContent = app.t('offerValue', formatNum(res.value, 3));
  }

  // jewellery or a bar: what a shop pays back the same day for every 100 paid (design 6.3)
  function renderJb() {
    const jb = jewelleryVsBar(live());
    el.jbRows.closest('section').hidden = !jb;
    if (!jb) return;
    const row = (text, phrase, lo, hi) => {
      const div = document.createElement('div');
      div.className = 'b3-row';
      const top = document.createElement('p');
      top.className = 'b3-top';
      const label = document.createElement('span');
      if (phrase) setKaratText(label, text, phrase);
      else label.textContent = text;
      const b = document.createElement('b');
      b.textContent = String(lo);
      if (hi != null && hi !== lo) {
        const to = document.createElement('small');
        to.textContent = ` ${app.t('jbTo')} `;
        b.append(to, String(hi));
      }
      top.append(label, b);
      const bar = document.createElement('span');
      bar.className = 'b3-bar';
      const fill = document.createElement('i');
      fill.style.width = `${lo}%`;
      bar.append(fill);
      if (hi != null && hi !== lo) {
        const ext = document.createElement('i');
        ext.className = 'ext';
        ext.style.insetInlineStart = `${lo}%`;
        ext.style.width = `${hi - lo}%`;
        bar.append(ext);
      }
      div.append(top, bar);
      return div;
    };
    el.jbRows.replaceChildren(
      row(app.t('jbBar'), app.t('karatN', 24), jb.bar[0], jb.bar[1]),
      row(app.t('jbPiece', 3, true), null, jb.plain),
      row(app.t('jbPiece', 6, false), null, jb.detailed),
    );
  }

  function renderPlaces() {
    const ar = app.state.lang === 'ar';
    el.places.replaceChildren(...(app.data.places || []).map((p) => {
      const li = document.createElement('li');
      const name = document.createElement('b');
      name.textContent = ar ? p.ar : p.en;
      const line = document.createElement('p');
      line.textContent = ar ? p.lineAr : p.lineEn;
      const links = document.createElement('div');
      links.className = 'place-links';
      const many = (p.links || []).length > 1;
      for (const l of p.links || []) {
        const a = document.createElement('a');
        a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.query)}`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = PIN;
        a.append(ar ? l.ar : l.en);
        a.setAttribute('aria-label', app.t('mapOf', ar ? p.ar : p.en, many ? (ar ? l.ar : l.en) : ''));
        links.append(a);
      }
      li.append(name, line, links);
      return li;
    }));
  }

  function syncSelectors() {
    syncKarats(el.pcKarats, pcK, 'ck');
    syncKarats(el.offerKarats, offerK, 'ok');
    const radio = (container, attr, value) => container.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      const on = b.dataset[attr] === value;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    });
    radio(el.mode, 'mode', mode);
    radio(el.pcType, 'type', pcType);
  }

  el.pcGrams.addEventListener('input', () => {
    if (!el.alt.hidden) priceFromRate();
    renderPrice();
  });
  el.pcPrice.addEventListener('input', renderPrice);
  [el.rate, el.making].forEach((i) => i.addEventListener('input', () => {
    if (i === el.rate) rateEdited = !blank(el.rate);
    priceFromRate();
    renderPrice();
  }));
  el.altOpen.addEventListener('click', () => {
    const open = el.alt.hidden;
    el.alt.hidden = !open;
    el.altOpen.setAttribute('aria-expanded', String(open));
    if (open) setRate();
  });
  el.pcKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ck]');
    if (!b) return;
    pcK = Number(b.dataset.ck);
    rateEdited = false; // a new karat brings its own market rate
    setRate();
    if (!el.alt.hidden) priceFromRate();
    syncSelectors();
    renderPrice();
  });
  el.pcType.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    pcType = b.dataset.type;
    syncSelectors();
    renderPrice();
  });
  el.mode.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    el.making.value = ''; // 3 rials a gram must not turn into 3% (QA19)
    syncSelectors();
    priceFromRate();
    renderPrice();
  });
  el.pcExample.addEventListener('click', () => {
    el.pcGrams.value = '20';
    el.pcPrice.value = '950.000';
    pcK = 22;
    syncSelectors();
    renderPrice();
  });
  [el.offerGrams, el.offerAmount].forEach((i) => i.addEventListener('input', renderOffer));
  el.offerKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ok]');
    if (!b) return;
    offerK = Number(b.dataset.ok);
    syncSelectors();
    renderOffer();
  });
  el.ocExample.addEventListener('click', () => {
    el.offerGrams.value = '20';
    el.offerAmount.value = '780.000';
    offerK = 22;
    syncSelectors();
    renderOffer();
  });

  app.on('price', () => {
    setRate();
    renderJb();
    if (!el.pcNoPrice.hidden) renderPrice(); // waiting for the first price
    if (!el.offerNoPrice.hidden) renderOffer();
  });
  app.on('lang', () => {
    renderPlaces();
    renderPrice();
    renderOffer();
    renderJb();
  });
  app.on('data', renderPlaces);
  app.on('view', (v) => { if (v === 'buysell') requestAnimationFrame(syncSelectors); });
  setRate();
  renderPrice();
  renderOffer();
  renderJb();
  renderPlaces();
  syncSelectors();
}
