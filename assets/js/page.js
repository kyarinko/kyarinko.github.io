/* Small pages (links.html, legal.html): language switch, reveal, wavy titles, ASCII background.
   Page titles/descriptions come from data-title-ja/-en and data-desc-ja/-en on <html>. */
(() => {
  'use strict';
  const d = document.documentElement.dataset;
  KY.initLang({ ja: { title: d.titleJa, desc: d.descJa }, en: { title: d.titleEn, desc: d.descEn } });
  KY.initReveal();
  KY.initWave();
  KY.initAscii(KY.$('#ascii-bg'));
  KY.initYear();
})();
