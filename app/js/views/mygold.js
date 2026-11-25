import { sellEstimate, pieceGain, totalGain, validatePiece } from '../gold.js';
import { parseNumber } from '../calc.js';
import { formatNum } from '../price.js';
import { monthYear } from '../i18n.js';
import { countUp } from '../ui/countup.js';
import { syncKarats } from '../ui/karats.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';

const $ = (id) => document.getElementById(id);
const MAX_PIECES = 20;
const grams = (g) => formatNum(g, Number.isInteger(g) ? 0 : 1);

/** My gold tab: total sell estimate, pieces with bought-price gains, add/edit sheet (design 6, D8). */
export function mount(app) {
  const el = {
    total: $('gold-total'), mid: $('gold-mid'), range: $('gold-range'), gain: $('gold-gain'),
    empty: $('gold-empty'), list: $('pieces'), add: $('add-piece'),
    sheet: $('piece-sheet'), form: $('piece-form'), title: $('piece-title'), karats: $('piece-karats'),
    error: $('piece-error'), remove: $('piece-remove'), cancel: $('piece-cancel'),
  };
  const sep = () => (app.state.lang === 'ar' ? '، ' : ', ');
  let editingId = null;
  let sheetKarat = 22;

  function gainText(p, usd) {
    const g = pieceGain(p, usd);
    if (!g) return '';
    const when = monthYear(app.state.lang, p.boughtYm);
    const args = [formatNum(p.boughtPrice, 0), when, formatNum(Math.abs(g.amount), 0), formatNum(Math.abs(g.pct) * 100, 0)];
    return g.amount >= 0 ? app.t('gainUp', ...args) : app.t('gainDown', ...args);
  }

  function pieceRow(p, usd) {
    const li = document.createElement('li');
    li.className = 'piece';
    const name = document.createElement('p');
    name.className = 'piece-name';
    name.textContent = p.name || app.t('unnamed');
    const meta = document.createElement('p');
    meta.className = 'piece-meta';
    meta.textContent = `${grams(p.grams)} ${app.t('grams')}${sep()}${app.t('karatN', p.karat)}`;
    const value = document.createElement('p');
    value.className = 'piece-value';
    value.textContent = Number.isFinite(usd) ? app.t('worthToday', formatNum(sellEstimate([p], usd).mid, 0)) : '';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'piece-edit';
    edit.dataset.edit = p.id;
    edit.textContent = app.t('edit');
    li.append(name, edit, meta, value);
    const gain = gainText(p, usd);
    if (gain) {
      const gl = document.createElement('p');
      gl.className = 'piece-gain';
      gl.textContent = gain;
      li.append(gl);
    }
    return li;
  }

  function render() {
    const { pieces } = app.state;
    const usd = app.price.usd;
    const has = Number.isFinite(usd);
    el.empty.hidden = pieces.length > 0;
    el.list.hidden = pieces.length === 0;
    el.total.hidden = pieces.length === 0 || !has;
    el.add.disabled = pieces.length >= MAX_PIECES;
    if (pieces.length && has) {
      const e = sellEstimate(pieces, usd);
      countUp(el.mid, e.mid, 0);
      el.range.textContent = app.t('range', formatNum(e.low, 0), formatNum(e.high, 0));
      const g = totalGain(pieces, usd);
      el.gain.hidden = !g;
      if (g) {
        const txt = g.amount >= 0
          ? app.t('totalUp', formatNum(g.amount, 0), formatNum(g.pct * 100, 0))
          : app.t('totalDown', formatNum(-g.amount, 0), formatNum(-g.pct * 100, 0));
        el.gain.textContent = g.counted < g.of ? `${txt}${sep()}${app.t('covers', g.counted, g.of)}` : txt;
      }
    }
    el.list.replaceChildren(...pieces.map((p) => pieceRow(p, usd)));
  }

  async function openEditor(piece) {
    editingId = piece ? piece.id : null;
    const f = el.form.elements;
    el.title.textContent = app.t(piece ? 'editPiece' : 'addPiece');
    f.name.value = piece?.name ?? '';
    f.grams.value = piece ? String(piece.grams) : '';
    f.boughtPrice.value = piece?.boughtPrice ?? '';
    f.boughtYm.value = piece?.boughtYm ?? '';
    sheetKarat = piece?.karat ?? app.state.karat;
    el.remove.hidden = !piece;
    el.error.hidden = true;
    const done = openSheet(el.sheet);
    requestAnimationFrame(() => syncKarats(el.karats, sheetKarat, 'pk'));
    await done;
    render();
  }

  function savePiece() {
    const f = el.form.elements;
    const bpRaw = f.boughtPrice.value.trim();
    const bp = bpRaw ? parseNumber(bpRaw) : null;
    const piece = validatePiece({
      id: editingId ?? undefined,
      name: f.name.value.trim(),
      grams: parseNumber(f.grams.value),
      karat: sheetKarat,
      boughtPrice: bp,
      boughtYm: f.boughtYm.value || null,
    });
    if (!piece) {
      el.error.textContent = app.t('badWeight');
      el.error.hidden = false;
      f.grams.focus();
      return;
    }
    const list = app.state.pieces;
    const i = list.findIndex((p) => p.id === piece.id);
    if (i >= 0) list[i] = piece;
    else if (list.length < MAX_PIECES) list.push(piece);
    app.persist();
    app.emit('pieces');
    el.sheet.close('save');
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
  el.remove.addEventListener('click', () => {
    app.state.pieces = app.state.pieces.filter((p) => p.id !== editingId);
    app.persist();
    app.emit('pieces');
    el.sheet.close('remove');
  });
  el.cancel.addEventListener('click', () => el.sheet.close('cancel'));
  closeOnBackdrop(el.sheet);

  ['pieces', 'price', 'lang', 'data'].forEach((evt) => app.on(evt, render));
  render();
}
