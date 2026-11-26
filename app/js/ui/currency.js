import { CURRENCIES } from '../config.js';
import { available, fromRials, fmt } from '../money.js';
import { gramPrice, formatNum } from '../price.js';
import { bestPrice } from '../insights.js';
import { dayMonthYear } from '../i18n.js';
import { openSheet, closeOnBackdrop } from './sheet.js';
import { setKaratText } from './karats.js';

const $ = (id) => document.getElementById(id);

/** The display-currency button, its sheet, and Today's "Back to rials" line (design 9). Viewing only. */
export function mount(app) {
  const el = {
    open: $('cur-open'), label: $('cur-label'), sheet: $('cur-sheet'), close: $('cur-close'), cap: $('cur-cap'), list: $('cur-list'),
    rates: $('cur-rates'), lbp: $('cur-lbp'), note: $('cur-note'), noteText: $('cur-note-text'), back: $('cur-back'),
  };

  function renderLabel() {
    const code = app.money.code;
    el.label.textContent = app.t('curShort', code);
    el.open.setAttribute('aria-label', app.t('curAria', app.t('curName', code)));
    el.note.hidden = code === 'OMR';
    if (code !== 'OMR') el.noteText.textContent = app.t('pricesIn', code);
  }

  function renderSheet() {
    const rates = app.data.rates, k = app.state.karat, lang = app.state.lang, chosen = app.money.code;
    const usd = bestPrice(app.price, app.data.history?.daily, Date.now())?.usd;
    setKaratText(el.cap, app.t('curCap', k), app.t('karatN', k));
    el.list.replaceChildren(...CURRENCIES.map((code) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(code === chosen));
      b.dataset.cur = code;
      const ok = available(code, rates);
      b.disabled = !ok;
      const dot = document.createElement('span');
      dot.className = 'dot';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = app.t('curName', code);
      const val = document.createElement('span');
      val.className = 'val';
      if (!ok) val.textContent = app.t('curUnavailable');
      else if (Number.isFinite(usd)) {
        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = fmt(fromRials(gramPrice(usd, k), code, rates), code, 'gram');
        val.append(num, ` ${app.t('curUnit', code)}`);
      }
      b.append(dot, name, val);
      li.append(b);
      return li;
    }));
    el.rates.hidden = !rates;
    if (rates) {
      const a = document.createElement('a');
      a.href = rates.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.lang = 'en';
      a.textContent = rates.source;
      el.rates.replaceChildren(`${app.t('curRatesA', dayMonthYear(lang, rates.asOf))} `, a, app.t('curRatesB'));
    }
    const lbpOk = available('LBP', rates) && Number.isFinite(usd);
    el.lbp.hidden = !lbpOk;
    if (lbpOk) {
      const m = fromRials(gramPrice(usd, k), 'LBP', rates);
      el.lbp.textContent = app.t('curLbpNote', fmt(m, 'LBP', 'gram'), formatNum(Math.round(m * 1e3) * 1e3, 0));
    }
  }

  el.open.addEventListener('click', () => {
    renderSheet();
    openSheet(el.sheet);
  });
  el.close.addEventListener('click', () => el.sheet.close(''));
  closeOnBackdrop(el.sheet);
  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cur]');
    if (!b || b.disabled) return;
    app.setCurrency(b.dataset.cur);
    el.sheet.close('');
  });
  el.back.addEventListener('click', () => app.setCurrency('OMR'));
  ['currency', 'lang', 'data'].forEach((evt) => app.on(evt, renderLabel));
  renderLabel();
}
