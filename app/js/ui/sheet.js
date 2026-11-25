// Bottom sheets built on <dialog>. Android's back button closes an open sheet (QA31), a tap on the
// sheet's own padding never closes it (QA7), and phones without <dialog> get a plain fallback (QA32).

let current = null;

/** Whether a tap at (x, y) falls outside the sheet. Clicks made with the keyboard report 0,0 and never count. */
export function isOutside(rect, x, y) {
  if (x === 0 && y === 0) return false;
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}

function polyfill(dialog) {
  if (typeof dialog.close === 'function') return;
  dialog.close = (value = '') => {
    if (!dialog.hasAttribute('open')) return;
    dialog.returnValue = value;
    dialog.removeAttribute('open');
    dialog.previousElementSibling?.classList.contains('sheet-shade') && dialog.previousElementSibling.remove();
    dialog.dispatchEvent(new Event('close'));
  };
}

/** Open a <dialog> as a bottom sheet; resolves with its returnValue ('' when dismissed) once it closes. */
export function openSheet(dialog) {
  return new Promise((resolve) => {
    dialog.returnValue = '';
    const opener = document.activeElement;
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      current = null;
      if (history.state?.sheet) history.back(); // drop the entry the sheet added
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
      resolve(dialog.returnValue);
    };
    dialog.addEventListener('close', onClose);
    current = dialog;
    history.pushState({ ...(history.state || {}), sheet: true }, '');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      polyfill(dialog);
      const shade = document.createElement('div');
      shade.className = 'sheet-shade';
      shade.addEventListener('click', () => dialog.close(''));
      dialog.before(shade);
      dialog.setAttribute('open', '');
      dialog.querySelector('[autofocus], input, button')?.focus();
    }
  });
}

/** Close the open sheet, if any; true when one was closed. Used by the back button. */
export function closeOpenSheet() {
  if (!current) return false;
  current.close('');
  return true;
}

/** Close a sheet when the backdrop around it is tapped. */
export function closeOnBackdrop(dialog) {
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    if (isOutside(dialog.getBoundingClientRect(), e.clientX, e.clientY)) dialog.close('');
  });
}
