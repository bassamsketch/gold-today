/** Pieces of a sentence around its karat phrase ("عيار 22" / "22 karat"), with the digits apart. */
export function karatPieces(text, phrase) {
  const i = phrase ? text.indexOf(phrase) : -1;
  if (i < 0) return [{ text }];
  const inner = phrase.split(/(\d+)/).filter(Boolean).map((p) => ({ text: p, karat: true, digit: /^\d+$/.test(p) }));
  return [{ text: text.slice(0, i) }, ...inner, { text: text.slice(i + phrase.length) }].filter((p) => p.text);
}

/** Write a sentence with its karat phrase in bold and its number in the serif face, so the karat reads at a glance. */
export function setKaratText(el, text, phrase) {
  const key = `${text}|${phrase}`;
  if (el._kt === key) return; // unchanged: leave the nodes alone during the 10 s price updates
  el._kt = key;
  let b = null;
  const nodes = [];
  for (const p of karatPieces(text, phrase)) {
    if (!p.karat) {
      nodes.push(p.text);
      b = null;
      continue;
    }
    if (!b) {
      b = document.createElement('b');
      b.className = 'kt';
      nodes.push(b);
    }
    if (p.digit) {
      const n = document.createElement('span');
      n.className = 'kt-n';
      n.textContent = p.text;
      b.append(n);
    } else {
      b.append(p.text);
    }
  }
  el.replaceChildren(...nodes);
}

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
