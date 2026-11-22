/* Shared by index.html and store.html (load before main.js / store.js):
   helpers, language switch, window reveal, wavy titles, ASCII background, footer year. */
window.KY = (() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     Language (ja / en). Text is swapped by CSS via <html lang>; this
     handles attributes, the page title, the switches, the wipe and ?lang=.
     meta = { ja: {title, desc}, en: {title, desc} }; onChange(lang, save) runs after each switch.
     ------------------------------------------------------------------ */
  function initLang(meta, onChange = () => {}) {
    // Translatable attributes: the HTML holds Japanese; data-*-en holds English.
    const I18N_ATTRS = [['alt', 'altEn', 'altJa'], ['aria-label', 'labelEn', 'labelJa']];
    const sel = attr => `[data-${attr === 'alt' ? 'alt' : 'label'}-en]`;
    I18N_ATTRS.forEach(([attr, , ja]) => $$(sel(attr)).forEach(el => { el.dataset[ja] = el.getAttribute(attr) || ''; }));
    const switches = $$('.lang-switch');
    const wipe = $('.lang-wipe');

    function setLang(lang, save) {
      lang = lang === 'en' ? 'en' : 'ja';
      root.lang = lang;
      document.title = meta[lang].title;
      const desc = $('meta[name="description"]');
      if (desc) desc.content = meta[lang].desc;
      I18N_ATTRS.forEach(([attr, en, ja]) => $$(sel(attr)).forEach(el => el.setAttribute(attr, el.dataset[lang === 'en' ? en : ja])));
      switches.forEach(sw => {
        sw.classList.toggle('is-flipped', lang === 'en');
        sw.setAttribute('aria-label', lang === 'en' ? '日本語に切り替え' : 'Switch to English');
      });
      if (save) {
        try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
        const url = new URL(location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(history.state, '', url);
      }
      onChange(lang, save);
    }

    // Click anywhere on a switch to flip. A blue wipe covers the swap.
    switches.forEach(sw => sw.addEventListener('click', () => {
      const next = root.lang === 'en' ? 'ja' : 'en';
      switches.forEach(s => s.classList.toggle('is-flipped', next === 'en')); // thumb moves right away
      if (reducedMotion.matches || !wipe) {
        setLang(next, true);
        $('main').animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
        return;
      }
      wipe.textContent = next === 'en' ? 'LANG // ENGLISH' : 'LANG // 日本語';
      wipe.classList.remove('is-run');
      void wipe.offsetWidth; // restart the animation
      wipe.classList.add('is-run');
      setTimeout(() => setLang(next, true), 330);
    }));
    if (wipe) wipe.addEventListener('animationend', () => wipe.classList.remove('is-run'));
    setLang(root.lang, false);
  }

  /* Windows pop in as you scroll */
  function initReveal() {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* Wavy text (original effect). Each language version is split separately; screen readers get the plain text. */
  function initWave() {
    const isWide = c => /[　-鿿＀-￯]/.test(c);
    const waveify = el => {
      const text = el.textContent.trim();
      let i = 0;
      const html = text.split(/(\s+)/).map(token => {
        if (/^\s+$/.test(token)) return ' ';
        const chars = Array.from(token).map(c => `<span class="wave-char" style="--i:${i++}">${c}</span>`).join('');
        return Array.from(token).some(isWide) ? chars : `<span class="wave-word">${chars}</span>`; // Japanese may wrap anywhere
      }).join('');
      el.innerHTML = `<span class="visually-hidden">${text}</span><span aria-hidden="true">${html}</span>`;
    };
    $$('.wave').forEach(el => {
      const parts = $$(':scope > [lang]', el);
      (parts.length ? parts : [el]).forEach(waveify);
    });
  }

  /* ------------------------------------------------------------------
     Original fluid ASCII background (whole page). Follows the mouse.
     opts.extraRows() asks for more rows than the screen (index's taller
     Dreamscape copy); opts.onFrame(lines) receives every frame's rows.
     ------------------------------------------------------------------ */
  function initAscii(pre, { extraRows = () => 0, onFrame } = {}) {
    const CHARS = ' ..::++--==__ ';
    let COLS = 120, ROWS = 45, t = 0;
    let colX = [], rowY = [], centerDist = []; // per-cell values that only change on resize
    let mx = innerWidth / 2, my = innerHeight / 2, tx = mx, ty = my;
    function size() {
      const fs = parseFloat(getComputedStyle(pre).fontSize) || 14;
      COLS = Math.min(260, Math.ceil(innerWidth / (fs * 0.6)) + 2);
      ROWS = Math.min(110, Math.ceil(innerHeight / (fs * 1.1)) + 1);
      const W = innerWidth, H = innerHeight;
      colX = Array.from({ length: COLS }, (_, x) => (x / COLS) * W);
      rowY = Array.from({ length: ROWS }, (_, y) => (y / ROWS) * H);
      centerDist = rowY.map(sy => colX.map(sx => Math.hypot(sx - W / 2, sy - H / 2)));
    }
    size();
    window.addEventListener('resize', size);
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    function draw() {
      if (!document.hidden) {
        mx += (tx - mx) * 0.05;
        my += (ty - my) * 0.05;
        const total = Math.max(ROWS, extraRows());
        const cosX = colX.map((_, x) => Math.cos(x * 0.1 + t));
        const lines = [];
        for (let y = 0; y < total; y++) {
          const ry = y % ROWS, sy = rowY[ry], cd = centerDist[ry], dy2 = (sy - my) ** 2, sinY = Math.sin(y * 0.1 - t);
          let row = '';
          for (let x = 0; x < COLS; x++) {
            const d2 = (colX[x] - mx) ** 2 + dy2;
            const mouse = d2 < 90000 ? (300 - Math.sqrt(d2)) / 300 : 0; // within 300px of the cursor
            const ripple = Math.sin(cd[x] * 0.005 - t * 1.5 + y * 0.04) * 0.5;
            const val = Math.max(0, Math.min(0.99, 0.5 + ripple * 0.5 + cosX[x] * sinY * 0.3 + mouse * 0.5));
            row += CHARS[Math.floor(val * CHARS.length)];
          }
          lines.push(row);
        }
        pre.textContent = lines.slice(0, ROWS).join('\n');
        if (onFrame) onFrame(lines);
        t += reducedMotion.matches ? 0.005 : 0.015; // Reduce Motion: keeps drifting, slowly
      }
      setTimeout(() => requestAnimationFrame(draw), 75);
    }
    draw();
  }

  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  return { $, $$, root, reducedMotion, initLang, initReveal, initWave, initAscii, initYear };
})();
