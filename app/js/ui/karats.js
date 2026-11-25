/** Mark the chosen karat in a selector and glide its underline to it. `attr` is the data attribute, e.g. 'k'. */
export function syncKarats(container, value, attr) {
  if (!container) return;
  let on = null;
  container.querySelectorAll(`[data-${attr}]`).forEach((b) => {
    const sel = Number(b.dataset[attr]) === value;
    b.classList.toggle('on', sel);
    b.setAttribute('aria-checked', String(sel));
    if (sel) on = b;
  });
  const line = container.querySelector('.kline');
  if (!line || !on || !on.offsetWidth) return;
  line.style.width = `${on.offsetWidth}px`;
  line.style.transform = `translateX(${on.offsetLeft}px)`;
}
