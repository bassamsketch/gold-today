import { pieceCost, offerCheck, parseNumber } from '../calc.js';
import { gramPrice, formatNum } from '../price.js';
import { syncKarats } from '../ui/karats.js';
import { countUp } from '../ui/countup.js';

const $ = (id) => document.getElementById(id);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const VERDICT = { above: 'verdictAbove', close: 'verdictClose', usual: 'verdictUsual', low: 'verdictLow' };
const okGrams = (g) => Number.isFinite(g) && g > 0 && g <= 5000;
const blank = (input) => input.value.trim() === '';

/**
 * Buy & sell tab: fair piece cost (N2), offer check (N3), places in Muscat, karat guide (N10), tips.
 * Results change only when something is typed or chosen, never by themselves with the live price (QA19).
 */
export function mount(app) {
  const el = {
    costGrams: $('cost-grams'), costGramsErr: $('cost-grams-err'), costKarats: $('cost-karats'), costMode: $('cost-mode'),
    costMaking: $('cost-making'), costMakingErr: $('cost-making-err'), costRate: $('cost-rate'), costRateHint: $('cost-rate-hint'),
    costRateErr: $('cost-rate-err'), costResult: $('cost-result'), costGold: $('cost-gold'), costMk: $('cost-mk'),
    costVat: $('cost-vat'), costTotal: $('cost-total'), costVat24: $('cost-vat24'), costPrompt: $('cost-prompt'), costNoPrice: $('cost-noprice'),
    offerGrams: $('offer-grams'), offerGramsErr: $('offer-grams-err'), offerKarats: $('offer-karats'), offerAmount: $('offer-amount'),
    offerAmountErr: $('offer-amount-err'), offerResult: $('offer-result'), verdict: $('offer-verdict'), gap: $('offer-gap'),
    value: $('offer-value'), offerPrompt: $('offer-prompt'), offerNoPrice: $('offer-noprice'), places: $('places'),
  };
  let costK = app.state.karat;
  let offerK = app.state.karat;
  let mode = 'perGram';
  let rateEdited = false; // the rate holds the shop's own figure
  let costTouched = false; // once typing starts, the prefilled rate stops following the live price
  const live = () => (Number.isFinite(app.price.usd) ? app.price.usd : null);
  const setErr = (input, err, on) => {
    err.hidden = !on;
    input.setAttribute('aria-invalid', String(on));
  };

  function setRate() {
    if (rateEdited || live() == null) return;
    el.costRate.value = gramPrice(live(), costK).toFixed(3);
  }

  function renderCost() {
    const usd = live();
    const g = parseNumber(el.costGrams.value);
    const m = blank(el.costMaking) ? 0 : parseNumber(el.costMaking.value);
    const r = blank(el.costRate) ? null : parseNumber(el.costRate.value);
    const gramsBad = !blank(el.costGrams) && !okGrams(g);
    const makingBad = !blank(el.costMaking) && !(Number.isFinite(m) && m >= 0);
    const rateBad = !blank(el.costRate) && !(Number.isFinite(r) && r > 0); // "1e9" is an error, not a silent fallback
    setErr(el.costGrams, el.costGramsErr, gramsBad);
    setErr(el.costMaking, el.costMakingErr, makingBad);
    setErr(el.costRate, el.costRateErr, rateBad);
    el.costRateHint.hidden = rateEdited;
    el.costVat24.hidden = costK !== 24; // bars and coins are usually zero-rated (QA28)
    const ready = okGrams(g) && !makingBad && !rateBad;
    const res = ready && (r != null || usd != null) ? pieceCost({ grams: g, karat: costK, rate: r, making: m, mode }, usd) : null;
    el.costResult.hidden = !res;
    el.costPrompt.hidden = !blank(el.costGrams);
    el.costNoPrice.hidden = !(ready && !res && usd == null);
    if (!res) return;
    countUp(el.costGold, res.gold, 3);
    countUp(el.costMk, res.making, 3);
    countUp(el.costVat, res.vat, 3);
    countUp(el.costTotal, res.total, 3);
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
    el.verdict.textContent = app.t(VERDICT[res.verdict]);
    el.gap.textContent = res.verdict === 'above' ? app.t('gapAbove', formatNum(-res.gapPct, 1)) : app.t('gapBelow', formatNum(res.gapPct, 1));
    el.value.textContent = app.t('offerValue', formatNum(res.value, 3));
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
    syncKarats(el.costKarats, costK, 'ck');
    syncKarats(el.offerKarats, offerK, 'ok');
    el.costMode.querySelectorAll('[data-mode]').forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    });
  }

  [el.costGrams, el.costMaking].forEach((i) => i.addEventListener('input', () => {
    costTouched = true;
    renderCost();
  }));
  el.costRate.addEventListener('input', () => {
    costTouched = true;
    rateEdited = !blank(el.costRate);
    renderCost();
  });
  [el.offerGrams, el.offerAmount].forEach((i) => i.addEventListener('input', renderOffer));
  el.costKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ck]');
    if (!b) return;
    costK = Number(b.dataset.ck);
    rateEdited = false; // a new karat brings its own market rate
    setRate();
    syncSelectors();
    renderCost();
  });
  el.offerKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ok]');
    if (!b) return;
    offerK = Number(b.dataset.ok);
    syncSelectors();
    renderOffer();
  });
  el.costMode.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    el.costMaking.value = ''; // 3 rials a gram must not turn into 3% (QA19)
    syncSelectors();
    renderCost();
  });

  app.on('price', () => {
    if (!costTouched) setRate();
    if (!el.costNoPrice.hidden) renderCost(); // waiting for the first price
    if (!el.offerNoPrice.hidden) renderOffer();
  });
  app.on('lang', () => {
    renderPlaces();
    renderCost();
    renderOffer();
  });
  app.on('data', renderPlaces);
  app.on('view', (v) => { if (v === 'buysell') requestAnimationFrame(syncSelectors); });
  setRate();
  renderCost();
  renderOffer();
  renderPlaces();
  syncSelectors();
}
