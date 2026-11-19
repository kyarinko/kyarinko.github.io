/* KYARIN STORE page — product filter. Language, reveal, wavy titles and the ASCII background come from common.js. */
(() => {
  'use strict';
  const { $, $$, root, reducedMotion: reduced } = window.KY;

  const META = {
    ja: { title: 'STORE | KYARIN・きゃりー', desc: 'KYARIN・きゃりーのストアとコミッション。楽譜・音源・メンバーシップ、作曲・編曲のご依頼。' },
    en: { title: 'STORE | KYARIN', desc: 'KYARIN store and commissions — scores, audio, memberships and custom composition & arrangement.' }
  };
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
      p.classList.toggle('is-hidden', f !== 'all' && p.dataset.cat !== f);
      p.classList.remove('is-in-anim');
    });
    if (!reduced.matches) {
      void document.body.offsetWidth; // one reflow restarts every card's animation
      products.forEach(p => { if (!p.classList.contains('is-hidden')) p.classList.add('is-in-anim'); });
    }
    updateCount();
  }));

  KY.initLang(META, updateCount);
  KY.initReveal();
  KY.initWave();
  KY.initAscii($('#ascii-bg'));
  KY.initYear();
})();
