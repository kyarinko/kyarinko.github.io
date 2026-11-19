/* KYARIN STORE page — language switch, reveal, wavy titles, ASCII background, product filter. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Language (shares the choice with the main page) ---------- */
  const META = {
    ja: { title: 'STORE | KYARIN・きゃりー', desc: 'KYARIN・きゃりーのストアとコミッション。楽譜・音源・メンバーシップ、作曲・編曲のご依頼。' },
    en: { title: 'STORE | KYARIN', desc: 'KYARIN store and commissions — scores, audio, memberships and custom composition & arrangement.' }
  };
  $$('[data-alt-en]').forEach(el => { el.dataset.altJa = el.alt; });
  const switches = $$('.lang-switch');
  const wipe = $('.lang-wipe');
  function setLang(lang, save) {
    lang = lang === 'en' ? 'en' : 'ja';
    root.lang = lang;
    document.title = META[lang].title;
    $('meta[name="description"]').content = META[lang].desc;
    $$('[data-alt-en]').forEach(el => { el.alt = lang === 'en' ? el.dataset.altEn : el.dataset.altJa; });
    switches.forEach(sw => {
      sw.classList.toggle('is-flipped', lang === 'en');
      sw.setAttribute('aria-label', lang === 'en' ? '日本語に切り替え' : 'Switch to English');
    });
    updateCount();
    if (save) {
      try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    }
  }
  switches.forEach(sw => sw.addEventListener('click', () => {
    const next = root.lang === 'en' ? 'ja' : 'en';
    switches.forEach(s => s.classList.toggle('is-flipped', next === 'en'));
    if (reduced.matches || !wipe) { setLang(next, true); return; }
    wipe.textContent = next === 'en' ? 'LANG // ENGLISH' : 'LANG // 日本語';
    wipe.classList.remove('is-run'); void wipe.offsetWidth; wipe.classList.add('is-run');
    setTimeout(() => setLang(next, true), 330);
  }));
  if (wipe) wipe.addEventListener('animationend', () => wipe.classList.remove('is-run'));
  // links back to the portfolio keep the language
  $$('a[href^="index.html"]').forEach(a => a.addEventListener('click', () => {
    const hash = a.getAttribute('href').split('#')[1];
    a.href = `index.html?lang=${root.lang}${hash ? '#' + hash : ''}`;
  }));

  /* ---------- Product filter ---------- */
  const filters = $$('.filter');
  const products = $$('.product');
  const countEl = $('#filter-count');
  function updateCount() {
    if (!countEl) return;
    const n = products.filter(p => !p.classList.contains('is-hidden')).length;
    countEl.textContent = root.lang === 'en' ? `${n} item${n === 1 ? '' : 's'}` : `${n}件`;
  }
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    products.forEach(p => {
      const show = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !show);
      if (show && !reduced.matches) { p.classList.remove('is-in-anim'); void p.offsetWidth; p.classList.add('is-in-anim'); }
    });
    updateCount();
  }));

  setLang(root.lang, false);

  /* ---------- Windows pop in ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Wavy titles (same effect as the main page) ---------- */
  const isWide = c => /[　-鿿＀-￯]/.test(c);
  function waveify(el) {
    const text = el.textContent.trim();
    let i = 0;
    const html = text.split(/(\s+)/).map(token => {
      if (/^\s+$/.test(token)) return ' ';
      const chars = Array.from(token).map(c => `<span class="wave-char" style="--i:${i++}">${c}</span>`).join('');
      return Array.from(token).some(isWide) ? chars : `<span class="wave-word">${chars}</span>`;
    }).join('');
    el.innerHTML = `<span class="visually-hidden">${text}</span><span aria-hidden="true">${html}</span>`;
  }
  $$('.wave').forEach(el => {
    const parts = $$(':scope > [lang]', el);
    (parts.length ? parts : [el]).forEach(waveify);
  });

  /* ---------- ASCII background (same as the main page) ---------- */
  const ascii = $('#ascii-bg');
  const CHARS = ' ..::++--==__ ';
  let COLS = 120, ROWS = 45, t = 0;
  let mx = innerWidth / 2, my = innerHeight / 2, tx = mx, ty = my;
  function size() {
    const fs = parseFloat(getComputedStyle(ascii).fontSize) || 14;
    COLS = Math.min(260, Math.ceil(innerWidth / (fs * 0.6)) + 2);
    ROWS = Math.min(110, Math.ceil(innerHeight / (fs * 1.1)) + 1);
  }
  size();
  window.addEventListener('resize', size);
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  function draw() {
    if (!document.hidden) {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      const W = innerWidth, H = innerHeight, lines = [];
      for (let y = 0; y < ROWS; y++) {
        let row = '';
        for (let x = 0; x < COLS; x++) {
          const sx = (x / COLS) * W, sy = (y / ROWS) * H;
          const md = Math.max(0, 300 - Math.hypot(sx - mx, sy - my)) / 300;
          const cd = Math.hypot(sx - W / 2, sy - H / 2);
          const v = Math.max(0, Math.min(0.99, 0.5 + Math.sin(cd * 0.005 - t * 1.5 + y * 0.04) * 0.25 + Math.cos(x * 0.1 + t) * Math.sin(y * 0.1 - t) * 0.3 + md * 0.5));
          row += CHARS[Math.floor(v * CHARS.length)];
        }
        lines.push(row);
      }
      ascii.textContent = lines.join('\n');
      t += reduced.matches ? 0.005 : 0.015;
    }
    setTimeout(() => requestAnimationFrame(draw), 75);
  }
  draw();
})();
