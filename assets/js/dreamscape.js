/* THE DREAMSCAPE page — language switch, reveal, VHS overlay and the aero-sky background. */
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

  /* ---------- VHS on-screen timestamp (analog-horror touch) ---------- */
  const ts = $('#vhs-ts');
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const d = new Date();
    let h = d.getHours(); const ampm = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12;
    ts.innerHTML = `${ampm} ${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())}<br>${MONTHS[d.getMonth()]}. ${pad(d.getDate())} ${d.getFullYear()}`;
  }
  if (ts) { tick(); setInterval(tick, 1000); }

  /* Rare whole-page tracking hiccup */
  function hiccup() {
    if (!reduced.matches && !document.hidden) {
      document.body.classList.add('is-tracking');
      setTimeout(() => document.body.classList.remove('is-tracking'), 260);
    }
    setTimeout(hiccup, 9000 + Math.random() * 14000);
  }
  setTimeout(hiccup, 6000);

  /* ---------- Background: twilight sky, Vista aurora ribbons, aero bubbles, VHS tracking ---------- */
  const canvas = $('#dream-bg');
  const ctx = canvas.getContext('2d');
  const RIBBONS = [
    { y: 0.38, amp: 0.10, freq: 1.3, speed: 0.22, width: 0.20, hue: [95, 212, 255] },
    { y: 0.50, amp: 0.08, freq: 1.8, speed: -0.17, width: 0.14, hue: [143, 240, 200] },
    { y: 0.60, amp: 0.12, freq: 1.0, speed: 0.13, width: 0.24, hue: [255, 179, 225] },
    { y: 0.30, amp: 0.06, freq: 2.4, speed: -0.28, width: 0.08, hue: [200, 240, 255] },
  ];
  let W = 0, H = 0, scale = 1, t = 0, sky, bubbles = [], clouds = [], glitch = null, nextGlitch = 2500;

  function makeBubble(randomY) {
    const r = 4 + Math.random() * Math.random() * 28;
    return { x: Math.random() * W, y: randomY ? Math.random() * H : H + r * 2, r, vy: 0.15 + Math.random() * 0.35 + r * 0.01, sway: Math.random() * 6.28, a: 0.35 + Math.random() * 0.45 };
  }

  function resize() {
    scale = innerWidth < 700 ? 2 : 2.5; // draw at reduced resolution, CSS scales it smoothly
    W = Math.ceil(innerWidth / scale); H = Math.ceil(innerHeight / scale);
    canvas.width = W; canvas.height = H;
    sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040a1e');
    sky.addColorStop(0.35, '#0b2a5c');
    sky.addColorStop(0.68, '#1f6aa6');
    sky.addColorStop(0.88, '#6fb9de');
    sky.addColorStop(1, '#e3b6dc');
    const count = Math.round(Math.min(46, (W * H) / 2600));
    bubbles = Array.from({ length: count }, () => makeBubble(true));
    clouds = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: H * (0.72 + Math.random() * 0.25), r: W * (0.12 + Math.random() * 0.14), v: 0.04 + Math.random() * 0.08, i }));
  }

  function drawRibbon(rb) {
    const [r, g, b] = rb.hue;
    const mid = [];
    for (let x = -10; x <= W + 10; x += 8) {
      const u = x / W;
      mid.push([x, H * (rb.y + rb.amp * Math.sin(u * 6.28 * rb.freq + t * rb.speed * 3) + rb.amp * 0.4 * Math.sin(u * 13 - t * 0.5))]);
    }
    const half = H * rb.width / 2;
    for (let layer = 0; layer < 3; layer++) {
      const w = half * (1 - layer * 0.35);
      ctx.beginPath();
      mid.forEach(([x, y], i) => i ? ctx.lineTo(x, y - w * (0.6 + 0.4 * Math.sin(x * 0.02 + t))) : ctx.moveTo(x, y - w));
      for (let i = mid.length - 1; i >= 0; i--) ctx.lineTo(mid[i][0], mid[i][1] + w * 0.3);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r},${g},${b},${0.05 + layer * 0.05})`;
      ctx.fill();
    }
  }

  function draw(now) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // faint stars at the top
    ctx.fillStyle = 'rgba(220,240,255,0.5)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97.3) % W, sy = ((i * 53.7) % (H * 0.35));
      if (Math.sin(t * 2 + i) > 0.2) ctx.fillRect(sx, sy, 1, 1);
    }

    // aurora ribbons, additive
    ctx.globalCompositeOperation = 'lighter';
    RIBBONS.forEach(drawRibbon);

    // dreamy low clouds
    ctx.globalCompositeOperation = 'source-over';
    clouds.forEach(c => {
      c.x += c.v; if (c.x - c.r > W) c.x = -c.r;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      g.addColorStop(0, 'rgba(255,240,250,0.35)'); g.addColorStop(1, 'rgba(255,240,250,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * 0.45, 0, 0, 6.29); ctx.fill();
    });

    // Frutiger-aero bubbles
    bubbles.forEach((b, i) => {
      b.y -= b.vy; b.x += Math.sin(t * 1.5 + b.sway) * 0.15;
      if (b.y < -b.r * 2) bubbles[i] = makeBubble(false);
      const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(255,255,255,${b.a})`);
      g.addColorStop(0.35, `rgba(180,235,255,${b.a * 0.18})`);
      g.addColorStop(0.85, `rgba(120,210,255,${b.a * 0.25})`);
      g.addColorStop(1, `rgba(200,245,255,${b.a * 0.7})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.29); ctx.fill();
    });

    // VHS tracking: a horizontal band slides sideways with static
    if (now > nextGlitch && !glitch) {
      glitch = { y: Math.random() * H * 0.9, h: 3 + Math.random() * H * 0.12, shift: (Math.random() - 0.5) * W * 0.12, until: now + 140 + Math.random() * 260 };
    }
    if (glitch) {
      const { y, h, shift } = glitch;
      ctx.drawImage(canvas, 0, y, W, h, shift, y, W, h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * W, y + Math.random() * h, 1 + Math.random() * 6, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, y + h - 1, W, 1);
      if (now > glitch.until) { glitch = null; nextGlitch = now + 1800 + Math.random() * 4200; }
    }
  }

  function loop(now) {
    if (!document.hidden) { draw(now); t += reduced.matches ? 0.003 : 0.012; }
    if (reduced.matches) setTimeout(() => requestAnimationFrame(loop), 200);
    else requestAnimationFrame(loop);
  }
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
})();
