/**
 * Register the service worker and show how to add the app to the home screen: once on its own, and again on
 * request (QA9). Where the browser offers its own install box (Chrome, Samsung Internet and Edge), the tip carries
 * a one-tap button that opens it, so nobody has to find the option in the browser's menu. main.js keeps that
 * offer as app.installOffer, because it can come before this module loads.
 */

/** The tip's lines: the second tap, when the button can open the browser's box, or else each phone's menu steps. */
export function tipLines({ ios, android, canPrompt }) {
  if (canPrompt) return ['installNext'];
  if (ios) return ['installIos'];
  if (android) return ['installAndroid'];
  return ['installIos', 'installAndroid'];
}

/**
 * Whether the tip opens on its own. iPhones get their steps. Android phones wait for the browser's offer, which
 * Chrome makes after a first tap and about 30 seconds on a first visit, so the first thing they see is the button.
 * The Android flag (installApp) is new, so people who closed the old menu steps see the button once.
 * Computers show the tip only when asked.
 */
export function opensItself({ ios, android, standalone, canPrompt, tips }) {
  if (standalone) return false;
  if (ios) return !tips.install;
  return Boolean(android && canPrompt && !tips.installApp);
}

export function mount(app) {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const android = /Android/.test(navigator.userAgent);
  const mountedAt = Date.now();
  const env = () => ({ ios, android, standalone, canPrompt: Boolean(app.installOffer), tips: app.state.tips });
  let box = null;
  let kind = 'tip'; // 'done' once the app is installed

  function button(className, key, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = app.t(key);
    b.addEventListener('click', onClick);
    return b;
  }

  function remember() {
    app.state.tips.install = true;
    app.state.tips.installApp = true;
    app.persist();
  }

  function close() {
    remember();
    box?.remove();
    box = null;
  }

  /** Draw the box. Focus moves in when the tip is asked for, and stays on the same control when the box is redrawn under it. */
  function render(asked, titleKey, lines, withButton, focus) {
    const held = box?.contains(document.activeElement) ? document.activeElement.className : null;
    box?.remove();
    box = document.createElement('div');
    box.className = 'install';
    box.setAttribute('role', asked ? 'dialog' : 'status');
    const title = document.createElement('b');
    title.id = 'install-title';
    title.textContent = app.t(titleKey);
    box.setAttribute('aria-labelledby', title.id);
    box.append(title);
    for (const key of lines) {
      const p = document.createElement('p');
      p.textContent = app.t(key);
      box.append(p);
    }
    const row = document.createElement('div');
    row.className = 'install-actions';
    if (withButton) row.append(button('install-go', 'installNow', openOffer));
    row.append(button('install-close', 'close', close));
    box.append(row);
    document.querySelector('.app').append(box);
    const target = held ? row.querySelector(`.${held}`) || row.firstChild : focus ? row.firstChild : null;
    target?.focus();
  }

  function show(asked, focus = false) {
    kind = 'tip';
    render(asked, 'installTitle', tipLines(env()), Boolean(app.installOffer), focus);
  }

  function done() {
    kind = 'done';
    render(false, 'installedTitle', ['installedText'], false, false);
  }

  /** Open the browser's install box. It opens once per offer: if it is cancelled, the menu steps take the button's place. */
  async function openOffer() {
    const offer = app.installOffer;
    app.installOffer = null;
    if (!offer) return;
    let outcome = 'dismissed';
    try {
      await offer.prompt();
      ({ outcome } = await offer.userChoice);
    } catch { /* the browser would not open it now */ }
    if (outcome === 'accepted') {
      remember();
      if (kind === 'tip') { box?.remove(); box = null; } // the installed note may already be showing: keep it
    } else if (box && kind === 'tip') show(box.getAttribute('role') === 'dialog');
  }

  /**
   * Open the tip on its own, no sooner than 3 seconds after the app starts, unless it is open already or no longer
   * wanted. It waits while a box is being typed in or a sheet is open, so it never covers what is in use.
   */
  function soon() {
    const attempt = () => {
      if (box || !opensItself(env())) return;
      if (document.querySelector('dialog[open]') || document.activeElement?.matches('input, textarea, select')) {
        setTimeout(attempt, 1000);
        return;
      }
      show(false);
    };
    setTimeout(attempt, Math.max(0, 3000 - (Date.now() - mountedAt)));
  }

  app.showInstall = () => show(true, true);
  app.on('lang', () => {
    if (!box) return;
    if (kind === 'done') done();
    else show(box.getAttribute('role') === 'dialog');
  });
  app.on('installoffer', () => {
    if (box && kind === 'tip') show(box.getAttribute('role') === 'dialog');
    else if (!box && opensItself(env())) soon();
  });
  addEventListener('appinstalled', () => {
    app.installOffer = null;
    app.state.tips.install = true;
    app.state.tips.installApp = true;
    app.persist();
    done();
  });
  if (opensItself(env())) soon();
}
