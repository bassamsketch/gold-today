import { sellEstimate, pieceGain, totalGain, validatePiece, okPaid, okBoughtYm } from '../gold.js';
import { parseNumber } from '../calc.js';
import { formatNum } from '../price.js';
import { monthYear, monthNames, dayMonthYear, lastPriceText } from '../i18n.js';
import { yearRange, closeYearsAgo } from '../insights.js';
import { countUp } from '../ui/countup.js';
import { syncKarats, setKaratText } from '../ui/karats.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';
import { shareTextOnly } from '../ui/share.js';

const $ = (id) => document.getElementById(id);
const MAX_PIECES = 20;
// a weight as it was typed, up to three decimals (MG8)
const grams = (g) => formatNum(g, (String(Math.round(g * 1000) / 1000).split('.')[1] || '').length);
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** My gold tab: total sell estimate, pieces with bought-price gains, add/edit sheet (design 6, D8). */
export function mount(app) {
  const el = {
    total: $('gold-total'), mid: $('gold-mid'), unit: $('gold-unit'), range: $('gold-range'), gain: $('gold-gain'), covers: $('gold-covers'),
    noPrice: $('gold-noprice'), empty: $('gold-empty'), list: $('pieces'), add: $('add-piece'), max: $('gold-max'),
    keep: $('gold-keep'), storageNote: $('storage-note'), how: $('storage-how'), shareList: $('share-list'),
    sheet: $('piece-sheet'), form: $('piece-form'), title: $('piece-title'), karats: $('piece-karats'),
    grams: $('piece-grams'), gramsErr: $('piece-grams-err'), name: $('piece-name'), chips: $('name-chips'),
    paid: $('piece-paid'), paidErr: $('piece-paid-err'), month: $('piece-month'), year: $('piece-year'),
    cancel: $('piece-cancel'), removeRow: $('piece-remove-row'), remove: $('piece-remove'), confirm: $('piece-confirm'),
    removeYes: $('piece-remove-yes'), removeNo: $('piece-remove-no'),
    before: $('gold-before'), beforeHi: $('before-hi'), beforeLo: $('before-lo'), before5: $('before-5'), before10: $('before-10'),
    stale: $('gold-stale'), fx: $('gold-fx'), whenErr: $('piece-when-err'),
  };
  // the price every tab shows: the saved live price, or the last close when that is newer (MG1)
  const liveUsd = () => app.best()?.usd ?? null;
  // whether an amount shows as zero in the display currency, so a tiny gain or loss reads "no change" (MG12)
  const showsZero = (v) => Number(app.money.fmt(app.money.conv(Math.abs(v)), 'total').replace(/,/g, '')) === 0;
  const sep = () => (app.state.lang === 'ar' ? '، ' : ', ');
  const rows = new Map(); // piece id -> its list item, updated in place (QA15)
  let editingId = null;
  let sheetKarat = 22;

  function gainText(p, usd) {
    const g = pieceGain(p, usd);
    if (!g) return '';
    // the price paid is typed in rials; what is shown follows the display currency (design 9)
    const when = monthYear(app.state.lang, p.boughtYm);
    if (showsZero(g.amount)) return app.t('gainSame', app.money.conv(p.boughtPrice), when, app.money.code);
    const args = [app.money.conv(p.boughtPrice), when, app.money.conv(Math.abs(g.amount)), formatNum(Math.abs(g.pct) * 100, 0), app.money.code];
    return g.amount >= 0 ? app.t('gainUp', ...args) : app.t('gainDown', ...args);
  }

  function rowFor(p) {
    let li = rows.get(p.id);
    if (!li) {
      li = document.createElement('li');
      li.className = 'piece';
      li.innerHTML = '<p class="piece-name"></p><button type="button" class="piece-edit"></button><p class="piece-meta"></p><p class="piece-value"></p><p class="piece-gain"></p>';
      rows.set(p.id, li);
    }
    const name = p.name || app.t('unnamed');
    li.querySelector('.piece-name').textContent = name;
    const edit = li.querySelector('.piece-edit');
    edit.dataset.edit = p.id;
    edit.textContent = app.t('edit');
    edit.setAttribute('aria-label', app.t('editNamed', name));
    setKaratText(li.querySelector('.piece-meta'), `${app.t('gramsOf', grams(p.grams), p.grams)}${sep()}${app.t('karatN', p.karat)}`, app.t('karatN', p.karat));
    const e = sellEstimate([p], liveUsd());
    const value = li.querySelector('.piece-value');
    value.hidden = !e;
    value.textContent = e ? app.t('worthToday', app.money.conv(e.mid), app.money.code) : '';
    const gain = li.querySelector('.piece-gain');
    gain.textContent = gainText(p, liveUsd());
    gain.hidden = !gain.textContent;
    return li;
  }

  function render() {
    const { pieces } = app.state;
    const usd = liveUsd();
    const has = Number.isFinite(usd);
    const n = pieces.length;
    const b = app.best();
    el.stale.hidden = !(n && has && b?.old); // a price over 15 minutes old names its time, as the other tabs do
    if (!el.stale.hidden) el.stale.textContent = lastPriceText(app.state.lang, b.at);
    el.fx.hidden = !(n && has && ['EUR', 'LBP'].includes(app.money.code)); // past rials at today's rate (MG4)
    el.empty.hidden = n > 0;
    el.list.hidden = n === 0;
    el.total.hidden = n === 0 || !has;
    el.noPrice.hidden = n === 0 || has; // never a 100% "loss" while the price is missing (QA10)
    el.keep.hidden = n === 0;
    el.storageNote.parentElement.hidden = installed(); // home-screen apps keep their data
    el.add.disabled = n >= MAX_PIECES;
    el.max.hidden = n < MAX_PIECES;
    if (n && has) {
      const e = sellEstimate(pieces, usd);
      const code = app.money.code;
      countUp(el.mid, app.money.conv(e.mid), app.money.decimals('total'));
      el.unit.textContent = app.t('curWord', app.money.conv(e.mid), code); // agrees with its number (MG10)
      el.range.textContent = app.t('range', app.money.conv(e.low), app.money.conv(e.high), code);
      const g = totalGain(pieces, usd);
      el.gain.hidden = !g;
      el.covers.hidden = !g || g.counted === g.of;
      if (g) {
        el.gain.textContent = showsZero(g.amount) ? app.t('totalSame') : g.amount >= 0
          ? app.t('totalUp', app.money.conv(g.amount), formatNum(g.pct * 100, 0), code)
          : app.t('totalDown', app.money.conv(-g.amount), formatNum(-g.pct * 100, 0), code);
        el.covers.textContent = app.t('covers', g.counted, g.of);
      }
    }
    renderBefore(pieces, n && has);
    const ids = new Set(pieces.map((p) => p.id));
    for (const [id, li] of rows) if (!ids.has(id)) { li.remove(); rows.delete(id); }
    pieces.forEach((p, i) => {
      const li = rowFor(p);
      if (el.list.children[i] !== li) el.list.insertBefore(li, el.list.children[i] || null);
    });
  }

  // what the same pieces would have fetched before: the 12-month high and low, then 5 and 10 years ago (design 8)
  function renderBefore(pieces, show) {
    const h = app.data.history;
    const rows = [];
    if (show && h) {
      // today's price counts in the 12-month range (MG2); the dates carry their year (MG11)
      const lang = app.state.lang, yr = yearRange(h.daily, new Date(), liveUsd());
      if (yr) rows.push([el.beforeHi, yr.hi.c, dayMonthYear(lang, yr.hi.d)], [el.beforeLo, yr.lo.c, dayMonthYear(lang, yr.lo.d)]);
      for (const [row, n] of [[el.before5, 5], [el.before10, 10]]) {
        const c = closeYearsAgo(h.monthly, n);
        if (c) {
          row.querySelector('.lbl').textContent = app.t('yearsAgo', n);
          rows.push([row, c.c, null]);
        }
      }
    }
    [el.beforeHi, el.beforeLo, el.before5, el.before10].forEach((r) => { r.hidden = !rows.some(([x]) => x === r); });
    el.before.hidden = !rows.length;
    for (const [row, usd, when] of rows) {
      const v = app.money.conv(sellEstimate(pieces, usd).mid);
      row.querySelector('.num').textContent = app.money.fmt(v, 'total');
      row.querySelector('.u').textContent = app.t('curWord', v, app.money.code);
      if (when != null) row.querySelector('.when').textContent = when;
    }
  }

  function fillPickers() {
    const lang = app.state.lang;
    const now = new Date().getFullYear();
    el.month.replaceChildren(new Option(app.t('monthLabel'), ''), ...monthNames(lang).map((m, i) => new Option(m, String(i + 1).padStart(2, '0'))));
    el.year.replaceChildren(new Option(app.t('yearLabel'), ''), ...Array.from({ length: now - 1959 }, (_, i) => new Option(String(now - i), String(now - i))));
    el.chips.replaceChildren(...app.t('nameChips').map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.chip = c;
      b.textContent = c;
      return b;
    }));
  }

  const setError = (input, err, on) => {
    err.hidden = !on;
    input.setAttribute('aria-invalid', String(on));
  };

  async function openEditor(piece) {
    editingId = piece ? piece.id : null;
    el.title.textContent = app.t(piece ? 'editPiece' : 'addPiece');
    fillPickers();
    el.grams.value = piece ? String(piece.grams) : '';
    el.name.value = piece?.name ?? '';
    el.paid.value = piece?.boughtPrice ?? '';
    const [y = '', m = ''] = (piece?.boughtYm || '').split('-');
    el.year.value = y;
    el.month.value = m;
    // the last piece's karat, else Today's choice unless that is 24, which is rare for jewellery (QA17)
    sheetKarat = piece?.karat ?? app.state.pieces.at(-1)?.karat ?? (app.state.karat === 24 ? 22 : app.state.karat);
    el.removeRow.hidden = !piece;
    el.remove.hidden = false;
    el.confirm.hidden = true;
    setError(el.grams, el.gramsErr, false);
    setError(el.paid, el.paidErr, false);
    setError(el.month, el.whenErr, false);
    const done = openSheet(el.sheet);
    requestAnimationFrame(() => syncKarats(el.karats, sheetKarat, 'pk'));
    const result = await done;
    render();
    if (result === 'remove') el.add.focus();
  }

  function savePiece() {
    const paidRaw = el.paid.value.trim();
    const paid = paidRaw ? parseNumber(paidRaw) : null;
    const badPaid = Boolean(paidRaw) && !okPaid(paid); // never drop a price silently (QA16); 1 to 1,000,000 (MG7)
    const ym = el.year.value ? (el.month.value ? `${el.year.value}-${el.month.value}` : el.year.value) : null;
    // a month needs its year, and the date cannot be after this month (MG9)
    const badWhen = (Boolean(el.month.value) && !el.year.value) || !okBoughtYm(ym);
    const piece = validatePiece({
      id: editingId ?? undefined,
      name: el.name.value.trim(),
      grams: parseNumber(el.grams.value),
      karat: sheetKarat,
      boughtPrice: badPaid ? null : paid,
      boughtYm: ym,
    });
    setError(el.grams, el.gramsErr, !piece);
    setError(el.paid, el.paidErr, badPaid);
    setError(el.month, el.whenErr, badWhen);
    if (!piece) return el.grams.focus();
    if (badPaid) return el.paid.focus();
    if (badWhen) return (el.month.value && !el.year.value ? el.year : el.month).focus();
    const list = app.state.pieces;
    const i = list.findIndex((p) => p.id === piece.id);
    if (i >= 0) list[i] = piece;
    else if (list.length < MAX_PIECES) list.push(piece);
    app.persist();
    navigator.storage?.persist?.()?.catch(() => {}); // ask the browser to keep the saved pieces (QA9)
    app.emit('pieces');
    el.sheet.close('save');
  }

  function listText() {
    const lang = app.state.lang;
    const lines = app.state.pieces.map((p) => {
      const parts = [app.t('gramsOf', grams(p.grams), p.grams), app.t('karatN', p.karat)];
      if (p.boughtPrice != null) parts.push(app.t('listPaid', p.boughtPrice, monthYear(lang, p.boughtYm)));
      return `• ${p.name || app.t('unnamed')}: ${parts.join(sep())}`;
    });
    return [app.t('listTitle'), ...lines].join('\n');
  }

  el.add.addEventListener('click', () => openEditor(null));
  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]');
    if (b) openEditor(app.state.pieces.find((p) => p.id === b.dataset.edit));
  });
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    savePiece();
  });
  el.karats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pk]');
    if (!b) return;
    sheetKarat = Number(b.dataset.pk);
    syncKarats(el.karats, sheetKarat, 'pk');
  });
  el.chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]');
    if (b) el.name.value = b.dataset.chip;
  });
  // removing takes a second, deliberate tap (QA8)
  el.remove.addEventListener('click', () => {
    el.remove.hidden = true;
    el.confirm.hidden = false;
    el.removeNo.focus();
  });
  el.removeNo.addEventListener('click', () => {
    el.confirm.hidden = true;
    el.remove.hidden = false;
    el.remove.focus();
  });
  el.removeYes.addEventListener('click', () => {
    app.state.pieces = app.state.pieces.filter((p) => p.id !== editingId);
    app.persist();
    app.emit('pieces');
    el.sheet.close('remove');
  });
  el.cancel.addEventListener('click', () => el.sheet.close('cancel'));
  el.how.addEventListener('click', () => app.showInstall?.());
  el.shareList.addEventListener('click', () => shareTextOnly(app, listText()));
  closeOnBackdrop(el.sheet);

  app.on('currency', () => { el.mid._v = undefined; }); // count in the new currency from its own figure
  ['pieces', 'price', 'lang', 'data', 'currency'].forEach((evt) => app.on(evt, render));
  render();
}
