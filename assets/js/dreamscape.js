/* THE DREAMSCAPE page — language switch, reveal, and the wavy glitch background. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Language (shares the choice with the main page) ---------- */
  $$('[data-alt-en]').forEach(el => { el.dataset.altJa = el.alt; });
  const langBtn = $('#d-lang');
  function setLang(lang, save) {
    root.lang = lang === 'en' ? 'en' : 'ja';
    langBtn.setAttribute('aria-label', root.lang === 'en' ? '日本語に切り替え' : 'Switch to English');
    $$('[data-alt-en]').forEach(el => { el.alt = root.lang === 'en' ? el.dataset.altEn : el.dataset.altJa; });
    if (save) {
      try { localStorage.setItem('lang', root.lang); } catch (e) { /* private mode */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', root.lang);
      history.replaceState(null, '', url);
    }
  }
  setLang(root.lang, false);
  langBtn.addEventListener('click', () => setLang(root.lang === 'en' ? 'ja' : 'en', true));
  // keep the "back" links in the same language
  $$('a[href^="index.html"]').forEach(a => a.addEventListener('click', () => {
    a.href = `index.html?lang=${root.lang}#dreamscape`;
  }));

  /* ---------- Panels fade in ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.d-panel').forEach(p => io.observe(p));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Wavy texture with glitch bands (drawn small, scaled up pixelated) ---------- */
  const canvas = $('#dream-bg');
  const ctx = canvas.getContext('2d');
  // pastel bands: deep violet → purple → mauve → pink → teal → ice
  const PALETTE = [[34, 26, 70], [92, 58, 128], [150, 92, 168], [214, 150, 206], [140, 206, 196], [205, 240, 236]].map(([r, g, b]) => (255 << 24) | (b << 16) | (g << 8) | r);
  // slightly different tint per vertical strip (like the reference's stripes)
  const STRIPS = [1, 0.86, 1.08, 0.92, 1.12, 0.9, 1.04, 0.82, 1.1];
  let W = 0, H = 0, img, buf, t = 0, glitch = null, nextGlitch = 0;

  function resize() {
    const scale = innerWidth < 700 ? 4 : 6; // one canvas pixel = 4–6 screen pixels
    W = Math.max(60, Math.ceil(innerWidth / scale));
    H = Math.max(60, Math.ceil(innerHeight / scale));
    canvas.width = W; canvas.height = H;
    img = ctx.createImageData(W, H);
    buf = new Uint32Array(img.data.buffer);
  }

  function shade(color, k) {
    const r = Math.min(255, (color & 255) * k), g = Math.min(255, ((color >> 8) & 255) * k), b = Math.min(255, ((color >> 16) & 255) * k);
    return (255 << 24) | (b << 16) | (g << 8) | r;
  }

  function draw(now) {
    const n = PALETTE.length;
    for (let y = 0; y < H; y++) {
      const v = (y / H) * 3.2;
      for (let x = 0; x < W; x++) {
        const u = (x / W) * 4.2;
        const wx = u + 0.55 * Math.sin(v * 1.7 + t * 0.6) + 0.25 * Math.sin(v * 3.3 - t * 0.4);
        const wy = v + 0.5 * Math.sin(u * 1.3 - t * 0.5);
        const f = Math.sin(wx * 2.6 + Math.sin(wy * 2.1 + t * 0.35) * 2.6 + Math.cos(wy * 0.9 - t * 0.2));
        const band = Math.min(n - 1, ((f * 0.5 + 0.5) * n) | 0);
        const strip = STRIPS[((x / W) * STRIPS.length) | 0];
        buf[y * W + x] = shade(PALETTE[band], strip);
      }
    }

    // Glitch: a horizontal band is shifted sideways and sprinkled with coloured blocks
    if (now > nextGlitch && !glitch) {
      glitch = { y0: (Math.random() * H * 0.85) | 0, h: (4 + Math.random() * H * 0.18) | 0, shift: ((Math.random() - 0.5) * W * 0.25) | 0, until: now + 120 + Math.random() * 260 };
    }
    if (glitch) {
      const { y0, h, shift } = glitch;
      for (let y = y0; y < Math.min(H, y0 + h); y++) {
        const row = buf.slice(y * W, y * W + W);
        for (let x = 0; x < W; x++) buf[y * W + x] = row[(x - shift + W) % W];
      }
      const BLOCKS = [0xff3c8a3c, 0xff2a2a8a, 0xff8a3c9a, 0xff5ab0a0, 0xff1e1e1e];
      for (let i = 0; i < 40; i++) {
        const bx = (Math.random() * W) | 0, by = y0 + ((Math.random() * h) | 0), bw = 2 + ((Math.random() * 8) | 0), c = BLOCKS[(Math.random() * BLOCKS.length) | 0];
        for (let x = bx; x < Math.min(W, bx + bw); x++) if (by < H) buf[by * W + x] = c;
      }
      if (now > glitch.until) { glitch = null; nextGlitch = now + 900 + Math.random() * 2400; }
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop(now) {
    if (!document.hidden) { draw(now); t += reduced.matches ? 0.008 : 0.02; }
    setTimeout(() => requestAnimationFrame(loop), reduced.matches ? 140 : 60);
  }
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
})();
