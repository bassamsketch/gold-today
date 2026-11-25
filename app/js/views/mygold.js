import { sellEstimate, pieceGain, totalGain, validatePiece } from '../gold.js';
import { parseNumber } from '../calc.js';
import { formatNum } from '../price.js';
import { monthYear, monthNames } from '../i18n.js';
import { countUp } from '../ui/countup.js';
import { syncKarats } from '../ui/karats.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';
import { shareTextOnly } from '../ui/share.js';

const $ = (id) => document.getElementById(id);
const MAX_PIECES = 20;
const grams = (g) => formatNum(g, Number.isInteger(g) ? 0 : 1);
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** My gold tab: total sell estimate, pieces with bought-price gains, add/edit sheet (design 6, D8). */
export function mount(app) {
  const el = {
    total: $('gold-total'), mid: $('gold-mid'), range: $('gold-range'), gain: $('gold-gain'), covers: $('gold-covers'),
    noPrice: $('gold-noprice'), empty: $('gold-empty'), list: $('pieces'), add: $('add-piece'), max: $('gold-max'),
    keep: $('gold-keep'), storageNote: $('storage-note'), how: $('storage-how'), shareList: $('share-list'),
    sheet: $('piece-sheet'), form: $('piece-form'), title: $('piece-title'), karats: $('piece-karats'),
    grams: $('piece-grams'), gramsErr: $('piece-grams-err'), name: $('piece-name'), chips: $('name-chips'),
    paid: $('piece-paid'), paidErr: $('piece-paid-err'), month: $('piece-month'), year: $('piece-year'),
    cancel: $('piece-cancel'), removeRow: $('piece-remove-row'), remove: $('piece-remove'), confirm: $('piece-confirm'),
    removeYes: $('piece-remove-yes'), removeNo: $('piece-remove-no'),
  };
  const sep = () => (app.state.lang === 'ar' ? '، ' : ', ');
  const rows = new Map(); // piece id -> its list item, updated in place (QA15)
  let editingId = null;
  let sheetKarat = 22;

  function gainText(p, usd) {
    const g = pieceGain(p, usd);
    if (!g) return '';
    const args = [p.boughtPrice, monthYear(app.state.lang, p.boughtYm), Math.abs(g.amount), formatNum(Math.abs(g.pct) * 100, 0)];
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
    li.querySelector('.piece-meta').textContent = `${grams(p.grams)} ${app.t('grams')}${sep()}${app.t('karatN', p.karat)}`;
    const e = sellEstimate([p], app.price.usd);
    const value = li.querySelector('.piece-value');
    value.hidden = !e;
    value.textContent = e ? app.t('worthToday', e.mid) : '';
    const gain = li.querySelector('.piece-gain');
    gain.textContent = gainText(p, app.price.usd);
    gain.hidden = !gain.textContent;
    return li;
  }

  function render() {
    const { pieces } = app.state;
    const usd = app.price.usd;
    const has = Number.isFinite(usd);
    const n = pieces.length;
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
      countUp(el.mid, e.mid, 0);
      el.range.textContent = app.t('range', e.low, e.high);
      const g = totalGain(pieces, usd);
      el.gain.hidden = !g;
      el.covers.hidden = !g || g.counted === g.of;
      if (g) {
        el.gain.textContent = g.amount >= 0
          ? app.t('totalUp', g.amount, formatNum(g.pct * 100, 0))
          : app.t('totalDown', -g.amount, formatNum(-g.pct * 100, 0));
        el.covers.textContent = app.t('covers', g.counted, g.of);
      }
    }
    const ids = new Set(pieces.map((p) => p.id));
    for (const [id, li] of rows) if (!ids.has(id)) { li.remove(); rows.delete(id); }
    pieces.forEach((p, i) => {
      const li = rowFor(p);
      if (el.list.children[i] !== li) el.list.insertBefore(li, el.list.children[i] || null);
    });
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
    const done = openSheet(el.sheet);
    requestAnimationFrame(() => syncKarats(el.karats, sheetKarat, 'pk'));
    const result = await done;
    render();
    if (result === 'remove') el.add.focus();
  }

  function savePiece() {
    const paidRaw = el.paid.value.trim();
    const paid = paidRaw ? parseNumber(paidRaw) : null;
    const badPaid = Boolean(paidRaw) && !(Number.isFinite(paid) && paid > 0); // never drop a price silently (QA16)
    const ym = el.year.value ? (el.month.value ? `${el.year.value}-${el.month.value}` : el.year.value) : null;
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
    if (!piece) return el.grams.focus();
    if (badPaid) return el.paid.focus();
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
      const parts = [`${grams(p.grams)} ${app.t('grams')}`, app.t('karatN', p.karat)];
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

  ['pieces', 'price', 'lang', 'data'].forEach((evt) => app.on(evt, render));
  render();
}
