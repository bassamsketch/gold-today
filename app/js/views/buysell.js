import { pieceCost, offerCheck, parseNumber } from '../calc.js';
import { gramPrice, formatNum } from '../price.js';
import { syncKarats } from '../ui/karats.js';
import { countUp } from '../ui/countup.js';

const $ = (id) => document.getElementById(id);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const VERDICT = { above: 'verdictAbove', close: 'verdictClose', low: 'verdictLow', veryLow: 'verdictVeryLow' };

/** Buy & sell tab: fair piece cost (N2), offer check (N3), places in Muscat, karat guide (N10), tips. */
export function mount(app) {
  const el = {
    costGrams: $('cost-grams'), costKarats: $('cost-karats'), costMode: $('cost-mode'), costMaking: $('cost-making'),
    costRate: $('cost-rate'), costResult: $('cost-result'), costGold: $('cost-gold'), costMk: $('cost-mk'),
    costVat: $('cost-vat'), costTotal: $('cost-total'), costPrompt: $('cost-prompt'),
    offerGrams: $('offer-grams'), offerKarats: $('offer-karats'), offerAmount: $('offer-amount'),
    offerResult: $('offer-result'), verdict: $('offer-verdict'), gap: $('offer-gap'), value: $('offer-value'),
    offerPrompt: $('offer-prompt'), places: $('places'),
  };
  let costK = app.state.karat;
  let offerK = app.state.karat;
  let mode = 'perGram';
  let rateEdited = false;
  const live = () => (Number.isFinite(app.price.usd) ? app.price.usd : null);

  function prefillRate() {
    if (rateEdited || live() == null) return;
    el.costRate.value = gramPrice(live(), costK).toFixed(3);
  }

  function renderCost() {
    const usd = live();
    const r = usd == null ? null : pieceCost({
      grams: parseNumber(el.costGrams.value),
      karat: costK,
      rate: parseNumber(el.costRate.value),
      making: parseNumber(el.costMaking.value) ?? 0,
      mode,
    }, usd);
    el.costResult.hidden = !r;
    el.costPrompt.hidden = Boolean(r);
    if (!r) return;
    countUp(el.costGold, r.gold, 3);
    countUp(el.costMk, r.making, 3);
    countUp(el.costVat, r.vat, 3);
    countUp(el.costTotal, r.total, 3);
  }

  function renderOffer() {
    const usd = live();
    const r = usd == null ? null : offerCheck({ grams: parseNumber(el.offerGrams.value), karat: offerK, offer: parseNumber(el.offerAmount.value) }, usd);
    el.offerResult.hidden = !r;
    el.offerPrompt.hidden = Boolean(r);
    if (!r) return;
    el.verdict.textContent = app.t(VERDICT[r.verdict]);
    el.gap.textContent = r.verdict === 'above' ? app.t('gapAbove', formatNum(-r.gapPct, 1)) : app.t('gapBelow', formatNum(r.gapPct, 1));
    el.value.textContent = app.t('offerValue', formatNum(r.value, 3));
  }

  function renderPlaces() {
    const ar = app.state.lang === 'ar';
    el.places.replaceChildren(...(app.data.places || []).map((p) => {
      const li = document.createElement('li');
      const text = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = ar ? p.ar : p.en;
      const area = document.createElement('small');
      area.textContent = ar ? p.areaAr : p.areaEn;
      const line = document.createElement('small');
      line.textContent = ar ? p.lineAr : p.lineEn;
      text.append(name, area, line);
      const a = document.createElement('a');
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.maps)}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = PIN;
      a.append(app.t('map'));
      li.append(text, a);
      return li;
    }));
  }

  function syncSelectors() {
    syncKarats(el.costKarats, costK, 'ck');
    syncKarats(el.offerKarats, offerK, 'ok');
    el.costMode.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  }

  function renderAll() {
    prefillRate();
    renderCost();
    renderOffer();
    renderPlaces();
    syncSelectors();
  }

  [el.costGrams, el.costMaking].forEach((i) => i.addEventListener('input', renderCost));
  el.costRate.addEventListener('input', () => {
    rateEdited = el.costRate.value.trim() !== '';
    renderCost();
  });
  [el.offerGrams, el.offerAmount].forEach((i) => i.addEventListener('input', renderOffer));
  el.costKarats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ck]');
    if (!b) return;
    costK = Number(b.dataset.ck);
    rateEdited = false;
    prefillRate();
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
    if (!b) return;
    mode = b.dataset.mode;
    syncSelectors();
    renderCost();
  });

  ['price', 'lang', 'data'].forEach((evt) => app.on(evt, renderAll));
  app.on('view', (v) => { if (v === 'buysell') requestAnimationFrame(syncSelectors); });
  renderAll();
}
