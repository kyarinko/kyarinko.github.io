/* KYARIN portfolio — site script. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');

  /* ------------------------------------------------------------------
     1. Language (ja / en)
     Text is swapped by CSS via <html lang>. JS only handles attributes,
     the page title, saving the choice, and the ?lang= URL.
     ------------------------------------------------------------------ */
  const META = {
    ja: { title: 'KYARIN・きゃりー | 作曲家・編曲家', desc: '作曲家・編曲家 KYARIN（ミネアロマン）のポートフォリオ。ゲーム音楽、オーケストラ、吹奏楽などの作品。' },
    en: { title: 'KYARIN | Composer & Arranger', desc: 'Portfolio of composer and arranger KYARIN (Roman Minear). Works including game music, orchestra, wind band and more.' }
  };
  // Translatable attributes: the HTML holds Japanese; data-*-en holds English.
  const I18N_ATTRS = [['alt', 'altEn', 'altJa'], ['aria-label', 'labelEn', 'labelJa']];
  I18N_ATTRS.forEach(([attr, en, ja]) => {
    $$(`[data-${attr === 'alt' ? 'alt' : 'label'}-en]`).forEach(el => { el.dataset[ja] = el.getAttribute(attr) || ''; });
  });

  function setLang(lang, save) {
    lang = lang === 'en' ? 'en' : 'ja';
    root.lang = lang;
    document.title = META[lang].title;
    const desc = $('meta[name="description"]');
    if (desc) desc.content = META[lang].desc;
    I18N_ATTRS.forEach(([attr, en, ja]) => {
      $$(`[data-${attr === 'alt' ? 'alt' : 'label'}-en]`).forEach(el => el.setAttribute(attr, el.dataset[lang === 'en' ? en : ja]));
    });
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    if (save) {
      try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url);
    }
  }
  setLang(root.lang, false);
  $$('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang, true)));

  /* ------------------------------------------------------------------
     2. Header: mobile menu + active section highlight
     ------------------------------------------------------------------ */
  const menuBtn = $('.menu-btn');
  const nav = $('#site-nav');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)').addEventListener('change', () => setMenu(false));

  const navLinks = $$('.site-nav a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.setAttribute('aria-current', String(a.hash === '#' + entry.target.id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => sectionObserver.observe(s));

  /* ------------------------------------------------------------------
     3. Scroll reveal
     ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ------------------------------------------------------------------
     4. Wavy hero name (split into letters; screen readers get the plain word)
     ------------------------------------------------------------------ */
  $$('.wave').forEach(el => {
    const text = el.textContent;
    el.innerHTML = `<span class="visually-hidden">${text}</span><span aria-hidden="true">${
      Array.from(text).map((c, i) => `<span class="wave-char" style="--i:${i}">${c}</span>`).join('')
    }</span>`;
  });

  /* ------------------------------------------------------------------
     5. Animated ASCII backgrounds (only animate while on screen)
     ------------------------------------------------------------------ */
  const ASCII_CHARS = ' ..::++--==__ ';
  const fields = $$('pre.ascii').map(pre => ({ pre, host: pre.parentElement, visible: false, cols: 0, rows: 0, w: 1, h: 1, mx: -9999, my: -9999, tx: -9999, ty: -9999 }));
  let asciiTime = 0;
  let asciiTimer = 0;

  function sizeField(f) {
    const r = f.host.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(f.pre).fontSize) || 13;
    f.w = r.width; f.h = r.height;
    f.cols = Math.min(200, Math.ceil(r.width / (fs * 0.6)));
    f.rows = Math.min(160, Math.ceil(r.height / (fs * 1.1)));
  }

  function drawField(f) {
    f.mx += (f.tx - f.mx) * 0.08;
    f.my += (f.ty - f.my) * 0.08;
    const cx = f.w / 2, cy = f.h / 2, n = ASCII_CHARS.length;
    let out = '';
    for (let y = 0; y < f.rows; y++) {
      const sy = (y / f.rows) * f.h;
      for (let x = 0; x < f.cols; x++) {
        const sx = (x / f.cols) * f.w;
        const dx = sx - f.mx, dy = sy - f.my;
        const mouse = Math.max(0, 300 - Math.sqrt(dx * dx + dy * dy)) / 300;
        const center = Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy));
        const ripple = Math.sin(center * 0.005 - asciiTime * 1.5 + y * 0.04) * 0.5;
        const plane = Math.cos(x * 0.1 + asciiTime) * Math.sin(y * 0.1 - asciiTime);
        const v = Math.max(0, Math.min(0.99, 0.5 + ripple * 0.5 + plane * 0.3 + mouse * 0.5));
        out += ASCII_CHARS[(v * n) | 0];
      }
      out += '\n';
    }
    f.pre.textContent = out;
  }

  function asciiLoop() {
    asciiTimer = 0;
    const active = fields.filter(f => f.visible);
    if (!active.length || document.hidden) return;
    active.forEach(drawField);
    asciiTime += 0.015;
    if (!reducedMotion.matches) asciiTimer = setTimeout(() => requestAnimationFrame(asciiLoop), 80);
  }
  const kickAscii = () => { if (!asciiTimer) asciiLoop(); };

  if (fields.length) {
    const asciiObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const f = fields.find(x => x.host === entry.target);
        f.visible = entry.isIntersecting;
        if (f.visible) { sizeField(f); kickAscii(); }
      });
    });
    fields.forEach(f => {
      asciiObserver.observe(f.host);
      f.host.addEventListener('pointermove', e => {
        const r = f.host.getBoundingClientRect();
        f.tx = e.clientX - r.left; f.ty = e.clientY - r.top;
      }, { passive: true });
    });
    new ResizeObserver(() => fields.forEach(sizeField)).observe(document.body);
    document.addEventListener('visibilitychange', kickAscii);
  }

  // Load the Dreamscape title font only when that section gets close.
  const dream = $('#dreamscape');
  if (dream) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { dream.classList.add('is-near'); obs.disconnect(); }
    }, { rootMargin: '600px 0px' }).observe(dream);
  }

  /* ------------------------------------------------------------------
     6. Pixel dither strips (black → blue), drawn once as a tiny image
     ------------------------------------------------------------------ */
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  $$('[data-dither]').forEach(el => {
    const [from, to] = el.dataset.dither.split(',');
    const rows = 16;
    const c = document.createElement('canvas');
    c.width = 4; c.height = rows;
    const ctx = c.getContext('2d');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = (y / (rows - 1)) >= (BAYER[y % 4][x] + 0.5) / 16 ? to : from;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    el.style.backgroundImage = `url(${c.toDataURL()})`;
  });

  /* ------------------------------------------------------------------
     7. "View all" collapse buttons + timeline sorting
     ------------------------------------------------------------------ */
  $$('[data-toggle-collapse]').forEach(btn => {
    const target = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const expand = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(expand));
      target.classList.toggle('is-collapsed', !expand);
      if (!expand && target.getBoundingClientRect().top < 0) target.scrollIntoView({ block: 'start' });
    });
  });

  const timeline = $('#timeline');
  $$('[data-sort]').forEach(btn => btn.addEventListener('click', () => {
    const dir = btn.dataset.sort === 'asc' ? 1 : -1;
    $$('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    $$('li', timeline)
      .sort((a, b) => dir * a.dataset.date.localeCompare(b.dataset.date))
      .forEach(li => { li.classList.add('is-in'); timeline.appendChild(li); });
  }));

  /* ------------------------------------------------------------------
     8. Lightbox (gallery photos + concert posters)
     ------------------------------------------------------------------ */
  const lightbox = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCap = $('#lightbox-cap');
  const lbCount = $('#lightbox-count');
  const lbPrev = $('.lightbox-prev', lightbox);
  const lbNext = $('.lightbox-next', lightbox);
  let lbItems = [];
  let lbIndex = 0;

  function showLightboxItem(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const item = lbItems[lbIndex];
    const thumb = $('img', item);
    lbImg.src = item.dataset.full;
    lbImg.alt = thumb ? thumb.alt : '';
    const cap = $('.cap, .event-title', item);
    lbCap.innerHTML = cap ? cap.innerHTML : '';
    lbCount.textContent = lbItems.length > 1 ? `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbItems.length).padStart(2, '0')}` : '';
    lbPrev.hidden = lbNext.hidden = lbItems.length < 2;
  }

  $$('[data-full]').forEach(item => item.addEventListener('click', () => {
    lbItems = $$(`[data-full][data-group="${item.dataset.group}"]`);
    showLightboxItem(lbItems.indexOf(item));
    lightbox.showModal();
  }));
  lbPrev.addEventListener('click', () => showLightboxItem(lbIndex - 1));
  lbNext.addEventListener('click', () => showLightboxItem(lbIndex + 1));
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') showLightboxItem(lbIndex - 1);
    if (e.key === 'ArrowRight') showLightboxItem(lbIndex + 1);
  });
  // Swipe left/right on touch screens
  let swipeX = null;
  lightbox.addEventListener('pointerdown', e => { swipeX = e.clientX; });
  lightbox.addEventListener('pointerup', e => {
    if (swipeX === null || lbItems.length < 2) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) showLightboxItem(lbIndex + (dx < 0 ? 1 : -1));
  });
  lightbox.addEventListener('close', () => { lbImg.src = 'data:,'; });

  // Shared dialog behaviour: close buttons + click outside the content
  $$('dialog').forEach(d => {
    $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', e => {
      const t = e.target;
      if (t === d || t.classList.contains('lightbox-inner') || t.classList.contains('lightbox-figure')) d.close();
    });
  });

  /* ------------------------------------------------------------------
     9. YouTube player dialog (cards still work as normal links without JS)
     ------------------------------------------------------------------ */
  const videoDialog = $('#video-dialog');
  const videoFrame = $('.video-frame', videoDialog);
  const videoTitle = $('#video-dialog-title');
  const videoLink = $('#video-dialog-link');

  $$('[data-yt]').forEach(card => card.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab clicks through
    e.preventDefault();
    const id = card.dataset.yt;
    const start = parseInt(card.dataset.start, 10) || 0;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1${start ? `&start=${start}` : ''}`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.title = $('.card-title', card).textContent.trim();
    videoFrame.replaceChildren(iframe);
    videoTitle.innerHTML = $('.card-title', card).innerHTML;
    videoLink.href = card.href;
    if (audio && !audio.paused) audio.pause();
    videoDialog.showModal();
  }));
  videoDialog.addEventListener('close', () => videoFrame.replaceChildren()); // stops playback

  /* ------------------------------------------------------------------
     10. Demo audio player + spectrum visualiser
     ------------------------------------------------------------------ */
  const audio = $('#audio');
  const tracks = $$('.track');
  const btnPlay = $('#btn-play');
  const seek = $('#seek');
  const volume = $('#volume');
  const timeEl = $('#time');
  const nowEl = $('#player-now');
  const canvas = $('#viz-canvas');
  const peakEl = $('#viz-peak');
  const ctx2d = canvas.getContext('2d');

  // Web Audio is only used over http(s): on file:// it would silence the audio.
  const canUseWebAudio = /^https?:$/.test(location.protocol) && (window.AudioContext || window.webkitAudioContext);
  let actx = null, analyser = null, gain = null, freq = null;
  let current = -1;

  const fmt = s => {
    if (!isFinite(s)) return '0:00';
    s = Math.floor(s);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const setRangeFill = (el, pct) => el.style.setProperty('--p', `${pct}%`);

  function applyVolume() {
    const v = volume.value / 100;
    setRangeFill(volume, volume.value);
    if (gain) { gain.gain.value = v; audio.volume = 1; } else { audio.volume = v; } // iOS ignores audio.volume; the gain node fixes that
  }

  function ensureAudioGraph() {
    if (actx || !canUseWebAudio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    actx = new AC();
    audio.crossOrigin = 'anonymous';
    const src = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.75;
    analyser.minDecibels = -95;
    analyser.maxDecibels = -15;
    gain = actx.createGain();
    src.connect(analyser);
    analyser.connect(gain);
    gain.connect(actx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
    applyVolume();
  }

  function loadTrack(i) {
    current = (i + tracks.length) % tracks.length;
    tracks.forEach((t, j) => t.setAttribute('aria-current', String(j === current)));
    audio.src = tracks[current].dataset.src;
    nowEl.innerHTML = tracks[current].children[1].innerHTML;
    seek.value = 0;
    setRangeFill(seek, 0);
  }

  function play(i) {
    ensureAudioGraph();
    if (i !== undefined && i !== current) loadTrack(i);
    else if (current < 0) loadTrack(0);
    if (actx && actx.state === 'suspended') actx.resume();
    audio.play().catch(() => {});
  }

  tracks.forEach((t, i) => t.addEventListener('click', () => (i === current && !audio.paused ? audio.pause() : play(i))));
  btnPlay.addEventListener('click', () => (audio.paused ? play() : audio.pause()));
  $('#btn-prev').addEventListener('click', () => (audio.currentTime > 3 ? (audio.currentTime = 0) : play(current - 1)));
  $('#btn-next').addEventListener('click', () => play(current + 1));
  volume.addEventListener('input', applyVolume);
  seek.addEventListener('input', () => {
    setRangeFill(seek, seek.value / 10);
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
  });

  audio.addEventListener('play', () => { btnPlay.setAttribute('aria-pressed', 'true'); startViz(); });
  audio.addEventListener('pause', () => btnPlay.setAttribute('aria-pressed', 'false'));
  audio.addEventListener('ended', () => { if (current < tracks.length - 1) play(current + 1); });
  audio.addEventListener('loadedmetadata', () => {
    const len = $('.track-len', tracks[current]);
    if (len) len.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    seek.value = pct * 10;
    setRangeFill(seek, pct);
    timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  audio.addEventListener('error', () => { if (current >= 0) nowEl.textContent = '⚠ ' + (root.lang === 'en' ? 'Could not load the audio.' : '音源を読み込めませんでした。'); });
  applyVolume();

  // Visualiser: logarithmic bars, 50 Hz – 7 kHz. Runs only while playing (or decaying) and on screen.
  const MIN_F = 50, MAX_F = 7000, BANDS = 72;
  const TICKS = [50, 100, 200, 500, 1000, 2000, 5000, 7000];
  const levels = new Float32Array(BANDS);
  let vizVisible = false, vizRunning = false, frame = 0;

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    drawViz();
  }

  function drawViz() {
    const W = canvas.width, H = canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const padX = 12 * dpr, padTop = 30 * dpr, padBottom = 22 * dpr;
    const plotW = W - padX * 2, plotH = H - padTop - padBottom;
    ctx2d.clearRect(0, 0, W, H);

    // Frequency grid + labels
    ctx2d.font = `300 ${10 * dpr}px "JetBrains Mono", monospace`;
    ctx2d.textBaseline = 'alphabetic';
    TICKS.forEach((hz, i) => {
      const x = padX + (Math.log(hz / MIN_F) / Math.log(MAX_F / MIN_F)) * plotW;
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx2d.fillRect(Math.round(x), padTop, 1, plotH);
      if (W < 480 * dpr && (hz === 200 || hz === 2000 || hz === 5000)) return;
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx2d.textAlign = i === 0 ? 'left' : i === TICKS.length - 1 ? 'right' : 'center';
      ctx2d.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), x, H - 7 * dpr);
    });

    // Bars
    const step = plotW / BANDS;
    const barW = Math.max(1, step * 0.62);
    ctx2d.fillStyle = '#fff';
    for (let b = 0; b < BANDS; b++) {
      const h = Math.max(2 * dpr, levels[b] * plotH);
      ctx2d.fillRect(padX + b * step + (step - barW) / 2, padTop + plotH - h, barW, h);
    }
    ctx2d.fillRect(padX, padTop + plotH, plotW, 1 * dpr);
  }

  function vizLoop() {
    if (!vizVisible) { vizRunning = false; return; }
    const playing = !audio.paused;
    let peak = 0, peakHz = 0, energy = 0;
    if (playing && analyser) analyser.getByteFrequencyData(freq);
    const nyquist = actx ? actx.sampleRate / 2 : 22050;
    for (let b = 0; b < BANDS; b++) {
      let target = 0;
      if (playing && analyser) {
        const f0 = MIN_F * Math.pow(MAX_F / MIN_F, b / BANDS);
        const f1 = MIN_F * Math.pow(MAX_F / MIN_F, (b + 1) / BANDS);
        const i0 = Math.floor((f0 / nyquist) * freq.length);
        const i1 = Math.max(i0 + 1, Math.ceil((f1 / nyquist) * freq.length));
        let sum = 0;
        for (let i = i0; i < i1; i++) sum += freq[i];
        target = Math.pow(sum / (i1 - i0) / 255, 1.15) * (0.9 + 0.3 * (b / BANDS));
        if (target > peak) { peak = target; peakHz = Math.sqrt(f0 * f1); }
      }
      levels[b] += (target - levels[b]) * (target > levels[b] ? 0.45 : 0.12);
      energy += levels[b];
    }
    drawViz();
    if (++frame % 8 === 0) {
      peakEl.textContent = peak > 0.05 ? `PEAK ${peakHz >= 1000 ? (peakHz / 1000).toFixed(2) + ' kHz' : Math.round(peakHz) + ' Hz'}` : 'PEAK — Hz';
    }
    if (playing || energy > 0.01) requestAnimationFrame(vizLoop);
    else vizRunning = false;
  }

  function startViz() {
    if (vizRunning || !vizVisible) return;
    vizRunning = true;
    requestAnimationFrame(vizLoop);
  }

  new ResizeObserver(sizeCanvas).observe(canvas);
  new IntersectionObserver(entries => {
    vizVisible = entries[0].isIntersecting;
    if (vizVisible && !audio.paused) startViz();
  }).observe(canvas);

  /* ------------------------------------------------------------------
     11. Footer year
     ------------------------------------------------------------------ */
  $('#year').textContent = new Date().getFullYear();
})();
