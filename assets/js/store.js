/* KYARIN STORE page. Language, reveal, wavy titles and the ASCII background come from common.js. */
(() => {
  'use strict';
  const { $, $$, root } = window.KY;

  const META = {
    ja: { title: 'STORE | KYARIN・きゃりー', desc: 'KYARIN・きゃりーのストアとコミッション。作曲・編曲・効果音・楽譜作成のご依頼と料金。' },
    en: { title: 'STORE | KYARIN', desc: 'KYARIN store and commissions — prices for composition, arrangement, sound effects and score preparation.' }
  };
  // links back to the portfolio keep the language
  $$('a[href^="index.html"]').forEach(a => a.addEventListener('click', () => {
    const hash = a.getAttribute('href').split('#')[1];
    a.href = `index.html?lang=${root.lang}${hash ? '#' + hash : ''}`;
  }));

  KY.initLang(META);
  KY.initReveal();
  KY.initWave();
  KY.initAscii($('#ascii-bg'));
  KY.initYear();
})();
