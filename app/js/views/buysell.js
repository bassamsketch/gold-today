import { offerCheck, priceCheck, jewelleryVsBar, parseNumber } from '../calc.js';
import { formatNum } from '../price.js';
import { MAX_PRICE } from '../config.js';
import { lastPriceText } from '../i18n.js';
import { syncKarats } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const VERDICT = { above: 'verdictAbove', close: 'verdictClose', usual: 'verdictUsual', low: 'verdictLow' };
const okGrams = (g) => Number.isFinite(g) && g >= 0.1 && g <= 5000; // as the weight message says (BS7)
const blank = (input) => input.value.trim() === '';

/** Whether any box holds a number: a Clear button then shows beside the example (owner, 2026-11-26). */
export const hasNumbers = (...values) => values.some((v) => v.trim() !== '');

/**
 * Buy & sell tab (design 6): the price check (B1), the offer check (B2), jewellery or a bar (B3), places, the karat
 * guide and tips. Typed results change only when something is typed or chosen, never by themselves (QA19).
 */
export function mount(app) {
  const el = {
    pcExample: $('pc-example'), pcGrams: $('pc-grams'), pcGramsErr: $('pc-grams-err'), pcKarats: $('pc-karats'), pcType: $('pc-type'),
    pcPrice: $('pc-price'), pcPriceErr: $('pc-price-err'), stale: $('pc-stale'),
    result: $('pc-result'), gold: $('pc-gold'), goldU: $('pc-gold-u'), over: $('pc-over'), extra: $('pc-extra'), extraU: $('pc-extra-u'),
    why: $('pc-why'), verdict: $('pc-verdict'), range: $('pc-range'), basis: $('pc-basis'), more: $('pc-more'),
    back: $('pc-back'), backU: $('pc-back-u'), per100: $('pc-per100'),
    pcPrompt: $('pc-prompt'), pcNoPrice: $('pc-noprice'),
    ocExample: $('oc-example'), offerGrams: $('offer-grams'), offerGramsErr: $('offer-grams-err'), offerKarats: $('offer-karats'),
    offerAmount: $('offer-amount'), offerAmountErr: $('offer-amount-err'), offerResult: $('offer-result'), verdictO: $('offer-verdict'),
    offerMoney: $('offer-money'), offerPrompt: $('offer-prompt'), offerNoPrice: $('offer-noprice'), offerStale: $('offer-stale'),
    jb: $('jb'), jbBar: $('jb-bar'), jbJewel: $('jb-jewel'), conv: $('pc-conv'), places: $('places'),
    pcClear: $('pc-clear'), ocClear: $('oc-clear'),
  };
  let pcK = app.state.karat;
  let pcType = 'bar'; // karat 24 is a bar or coin unless switched (design 6.1)
  let offerK = app.state.karat;
  let pcExampleOn = false, ocExampleOn = false; // an example's numbers are in the boxes (BR1)
  // the saved live price, or the last close when that is newer (design 6.1), as on every tab
  const price = () => app.best();
  const live = () => price()?.usd ?? null;
  const setErr = (input, err, on) => {
    err.hidden = !on;
    input.setAttribute('aria-invalid', String(on));
  };
  const money = (node, unit, v) => {
    node.textContent = formatNum(v, 0);
    unit.textContent = app.t('rialWord', v);
  };
  // a Clear button stands beside each example once any box holds a number; the example button never changes
  // one way to give the price: the full price the shop asks (the rate-and-making route is gone, owner 2026-11-26)
  const pcFilled = () => hasNumbers(el.pcGrams.value, el.pcPrice.value);
  const ocFilled = () => hasNumbers(el.offerGrams.value, el.offerAmount.value);

  function renderPrice() {
    const usd = live();
    const g = parseNumber(el.pcGrams.value), p = parseNumber(el.pcPrice.value);
    const gramsBad = !blank(el.pcGrams) && !okGrams(g);
    const priceBad = !blank(el.pcPrice) && !(Number.isFinite(p) && p > 0 && p <= MAX_PRICE);
    setErr(el.pcGrams, el.pcGramsErr, gramsBad);
    setErr(el.pcPrice, el.pcPriceErr, priceBad);
    el.pcClear.hidden = !pcFilled();
    el.pcType.hidden = pcK !== 24;
    const ready = okGrams(g) && Number.isFinite(p) && p > 0 && p <= MAX_PRICE;
    const r = ready && usd != null ? priceCheck({ grams: g, karat: pcK, price: p, bar: pcType === 'bar' }, usd) : null;
    el.result.hidden = !r;
    el.pcPrompt.hidden = ready || gramsBad || priceBad;
    el.pcNoPrice.hidden = !(ready && usd == null);
    if (!r) return;
    // the answer first, then the gold, the shop's extra and what a shop pays back; the reasons fold away (U1)
    const under = r.position === 'under';
    const word = { within: 'Within', below: 'Below', above: 'Above' }[r.position];
    el.verdict.textContent = under ? app.t('pcUnder') : app.t(r.bar ? `pcBar${word}` : `pc${word}`);
    money(el.gold, el.goldU, r.gold);
    el.over.hidden = el.more.hidden = under;
    if (!under) {
      money(el.extra, el.extraU, r.extra);
      el.why.textContent = app.t(r.bar ? 'pcWhyBar' : 'pcWhy', r.extraPct * 100);
      el.range.textContent = app.t('pcRange', r.band[0] * 100, r.band[1] * 100);
      el.basis.textContent = app.t(r.bar ? 'pcBarBasis' : 'pcBasis');
    }
    money(el.back, el.backU, r.back);
    el.per100.hidden = r.per100 == null;
    if (r.per100 != null) el.per100.textContent = app.t('pcPer100', r.per100);
    // shopping stays in rials; one line shows the price in the display currency (design 9)
    const code = app.money.code;
    el.conv.hidden = code === 'OMR';
    if (code !== 'OMR') {
      const v = app.money.conv(p);
      el.conv.textContent = app.t('pcConverted', `${app.money.fmt(v, 'total')} ${app.t('curWord', v, code)}`);
    }
    const bp = price();
    el.stale.hidden = !bp?.old; // right under the gold figure it qualifies (BS12)
    if (bp?.old) el.stale.textContent = app.t('staleUse', lastPriceText(app.state.lang, bp.at));
  }

  function renderOffer() {
    const usd = live();
    const g = parseNumber(el.offerGrams.value);
    const o = parseNumber(el.offerAmount.value);
    const gramsBad = !blank(el.offerGrams) && !okGrams(g);
    const offerBad = !blank(el.offerAmount) && !(Number.isFinite(o) && o > 0 && o <= MAX_PRICE);
    setErr(el.offerGrams, el.offerGramsErr, gramsBad);
    setErr(el.offerAmount, el.offerAmountErr, offerBad);
    el.ocClear.hidden = !ocFilled();
    const ready = okGrams(g) && Number.isFinite(o) && o > 0 && o <= MAX_PRICE;
    const res = ready && usd != null ? offerCheck({ grams: g, karat: offerK, offer: o }, usd) : null;
    el.offerResult.hidden = !res;
    el.offerPrompt.hidden = ready || gramsBad || offerBad;
    el.offerNoPrice.hidden = !(ready && usd == null);
    if (!res) return;
    el.verdictO.textContent = app.t(VERDICT[res.verdict]);
    el.offerMoney.textContent = app.t('offerMoney', res.value, res.diff, res.dir); // in rials, not a percent (U3)
    const bp = price();
    el.offerStale.hidden = !bp?.old; // as the price check says it (BR3)
    if (bp?.old) el.offerStale.textContent = app.t('staleUse', lastPriceText(app.state.lang, bp.at));
  }

  // for saving: of every 1,000 rials paid today, what comes back on selling if the gold price stays the same.
  // Two plain amounts in rials, a bar with and without VAT and jewellery with making of 6 down to 3 rials a gram.
  function renderJb() {
    const jb = jewelleryVsBar(live());
    el.jb.hidden = !jb;
    if (!jb) return;
    el.jbBar.textContent = app.t('jbRange', jb.bar[0] * 10, jb.bar[1] * 10);
    el.jbJewel.textContent = app.t('jbRange', jb.detailed * 10, jb.plain * 10);
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
    radio(el.pcType, 'type', pcType);
  }

  // each fold says "Show details" while closed and "Hide details" while open
  document.querySelectorAll('[data-view=buysell] details.more-info').forEach((d) => d.addEventListener('toggle', () => {
    const s = d.querySelector('summary');
    s.dataset.t = d.open ? 'hideDetails' : 'showDetails';
    s.textContent = app.t(s.dataset.t);
  }));

  // Clear: back to how the section opened, with empty boxes and the family's own karat
  function clearPc() {
    el.more.open = false;
    el.pcGrams.value = el.pcPrice.value = '';
    pcExampleOn = false;
    pcK = app.state.karat;
    pcType = 'bar';
    syncSelectors();
    renderPrice();
  }
  function showPcExample() {
    el.pcGrams.value = '20';
    el.pcPrice.value = '950.000';
    pcK = 22;
    pcExampleOn = true;
    syncSelectors();
    renderPrice();
  }
  // starting to type a real piece while the example shows empties the boxes first, so no example number is kept (BR1)
  [el.pcGrams, el.pcPrice].forEach((i) => {
    i.addEventListener('focus', () => { if (pcExampleOn) clearPc(); });
    i.addEventListener('input', () => {
      pcExampleOn = false;
      renderPrice();
    });
  });
  el.pcKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ck]');
    if (!b) return;
    pcK = Number(b.dataset.ck);
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
  el.pcExample.addEventListener('click', showPcExample);
  el.pcClear.addEventListener('click', () => {
    clearPc();
    el.pcExample.focus(); // Clear hides itself once the boxes are empty, so focus stays in the row
  });

  function clearOc() {
    el.offerGrams.value = el.offerAmount.value = '';
    offerK = app.state.karat;
    ocExampleOn = false;
    syncSelectors();
    renderOffer();
  }
  [el.offerGrams, el.offerAmount].forEach((i) => {
    i.addEventListener('focus', () => { if (ocExampleOn) clearOc(); }); // (BR1)
    i.addEventListener('input', () => {
      ocExampleOn = false;
      renderOffer();
    });
  });
  el.offerKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ok]');
    if (!b) return;
    offerK = Number(b.dataset.ok);
    syncSelectors();
    renderOffer();
  });
  el.ocClear.addEventListener('click', () => {
    clearOc();
    el.ocExample.focus();
  });
  el.ocExample.addEventListener('click', () => {
    el.offerGrams.value = '20';
    el.offerAmount.value = '780.000';
    offerK = 22;
    ocExampleOn = true;
    syncSelectors();
    renderOffer();
  });

  app.on('price', () => {
    renderJb();
    if (!el.pcNoPrice.hidden) renderPrice(); // waiting for the first price
    if (!el.offerNoPrice.hidden) renderOffer();
  });
  app.on('lang', () => {
    renderPlaces();
    renderPrice();
    renderOffer();
    renderJb();
    requestAnimationFrame(syncSelectors); // the karat underlines move with the text direction (BS2)
  });
  app.on('currency', () => {
    renderPrice();
    renderJb();
  });
  app.on('data', () => {
    renderPlaces();
    renderJb(); // the last close can stand in for a missing live price
    if (!el.pcNoPrice.hidden) renderPrice();
    if (!el.offerNoPrice.hidden) renderOffer(); // (BS8)
  });
  app.on('view', (v) => { if (v === 'buysell') requestAnimationFrame(syncSelectors); });
  renderPrice();
  renderOffer();
  renderJb();
  renderPlaces();
  syncSelectors();
}
