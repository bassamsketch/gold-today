/** Register the service worker and show how to add the app to the home screen: once on its own, and again on request (QA9). */
export function mount(app) {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const android = /Android/.test(navigator.userAgent);
  let box = null;

  function show(asked) {
    box?.remove();
    box = document.createElement('div');
    box.className = 'install';
    box.setAttribute('role', asked ? 'dialog' : 'status');
    const title = document.createElement('b');
    title.id = 'install-title';
    title.textContent = app.t('installTitle');
    box.setAttribute('aria-labelledby', title.id);
    box.append(title);
    for (const key of ios ? ['installIos'] : android ? ['installAndroid'] : ['installIos', 'installAndroid']) {
      const p = document.createElement('p');
      p.textContent = app.t(key);
      box.append(p);
    }
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = app.t('gotIt');
    ok.addEventListener('click', () => {
      app.state.tips.install = true;
      app.persist();
      box.remove();
      box = null;
    });
    box.append(ok);
    document.querySelector('.app').append(box);
    if (asked) ok.focus();
  }

  app.showInstall = () => show(true);
  app.on('lang', () => { if (box) show(box.getAttribute('role') === 'dialog'); });
  if (app.state.tips.install || standalone || !(ios || android)) return;
  setTimeout(() => show(false), 3000);
}
