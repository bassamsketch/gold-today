/** Register the service worker and, once, show how to add the app to the home screen (design section 9). */
export function mount(app) {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const android = /Android/.test(navigator.userAgent);
  if (app.state.tips.install || standalone || !(ios || android)) return;
  setTimeout(() => {
    const box = document.createElement('div');
    box.className = 'install';
    box.setAttribute('role', 'status');
    const title = document.createElement('b');
    title.textContent = app.t('installTitle');
    const how = document.createElement('p');
    how.textContent = app.t(ios ? 'installIos' : 'installAndroid');
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = app.t('gotIt');
    ok.addEventListener('click', () => {
      app.state.tips.install = true;
      app.persist();
      box.remove();
    });
    box.append(title, how, ok);
    document.querySelector('.app').append(box);
  }, 3000);
}
