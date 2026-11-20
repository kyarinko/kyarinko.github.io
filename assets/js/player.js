/* Shared preview player: one <audio preload="none"> for every
   <button class="preview" data-src="…" data-title="…"> on the page.
   Click (or Enter/Space, native to <button>) plays; clicking the playing one pauses.
   Never autoplays. Put aria-label="Play preview: {title}" on each button in the HTML. */
(() => {
  'use strict';
  const buttons = Array.from(document.querySelectorAll('button.preview[data-src]'));
  if (!buttons.length) return;
  const audio = new Audio();
  audio.preload = 'none';
  let current = null;

  const mark = (btn, playing) => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.classList.toggle('is-playing', playing);
  };

  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      if (btn === current && !audio.paused) { audio.pause(); return; }
      if (btn !== current) {
        if (current) mark(current, false);
        current = btn;
        audio.src = btn.dataset.src;
      }
      mark(btn, true);
      audio.play().catch(() => mark(btn, false)); // blocked or failed: reset the button
    });
  });

  audio.addEventListener('pause', () => { if (current) mark(current, false); });
  audio.addEventListener('ended', () => { if (current) mark(current, false); });
  // any other <audio>/<video> on the page starting stops the preview
  document.addEventListener('play', e => { if (e.target !== audio) audio.pause(); }, true);
})();
