const DIGIT = /\d/;

/** Show `text` (e.g. "39.321") as rolling digit columns; digits after the dot are smaller. */
export function odometer(el, text) {
  const chars = [...text];
  const sig = chars.map((c) => (DIGIT.test(c) ? 'd' : c)).join('');
  if (el._sig !== sig) {
    el._sig = sig;
    el.textContent = '';
    let dec = false;
    for (const c of chars) {
      if (c === '.') dec = true;
      if (DIGIT.test(c)) {
        const od = document.createElement('span');
        od.className = dec ? 'od dec' : 'od';
        od.setAttribute('aria-hidden', 'true');
        const ph = document.createElement('span');
        ph.className = 'ph';
        ph.textContent = '0';
        const strip = document.createElement('span');
        strip.className = 'strip';
        for (let i = 0; i < 10; i++) {
          const s = document.createElement('span');
          s.textContent = String(i);
          strip.appendChild(s);
        }
        od.append(ph, strip);
        el.appendChild(od);
      } else {
        const s = document.createElement('span');
        if (dec) s.className = 'dec';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = c;
        el.appendChild(s);
      }
    }
    el.getBoundingClientRect(); // commit the starting position so the first roll animates
  }
  const digits = chars.filter((c) => DIGIT.test(c));
  el.querySelectorAll('.od').forEach((od, i) => {
    od.firstChild.textContent = digits[i];
    od.lastChild.style.transform = `translateY(${-Number(digits[i]) * 10}%)`;
  });
}
