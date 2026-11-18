/* KYARIN portfolio — site script. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ------------------------------------------------------------------
     0. Loading screen (~3 s on the first visit of each browser session)
     ------------------------------------------------------------------ */
  const loader = $('.loader');
  if (loader && !root.classList.contains('loaded')) {
    const pctEl = $('.loader-pct', loader);
    const DURATION = 3000;
    const start = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      loader.style.setProperty('--fill', '100%');
      pctEl.textContent = '100%';
      loader.classList.add('is-done');
      root.classList.add('loaded');
      try { sessionStorage.setItem('loaded', '1'); } catch (e) { /* private mode */ }
    };
    const tick = now => {
      if (done) return;
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.2); // fast start, gentle finish
      const pct = Math.round(eased * 100);
      loader.style.setProperty('--fill', `${pct}%`);
      pctEl.textContent = `${String(pct).padStart(3, '0')}%`;
      if (t < 1) requestAnimationFrame(tick); else setTimeout(finish, 150);
    };
    requestAnimationFrame(tick);
    loader.addEventListener('click', finish);
  }

  /* ------------------------------------------------------------------
     1. Language (ja / en)
     Text is swapped by CSS via <html lang>. JS handles attributes, the
     page title, the one-click switches, the wipe and the ?lang= URL.
     ------------------------------------------------------------------ */
  const META = {
    ja: { title: 'KYARIN・きゃりー | 作曲家・編曲家', desc: '作曲家・編曲家 KYARIN・きゃりーのポートフォリオ。ゲーム音楽、オーケストラ、吹奏楽などの作品。' },
    en: { title: 'KYARIN | Composer & Arranger', desc: 'Portfolio of composer and arranger KYARIN. Works including game music, orchestra, wind band and more.' }
  };
  // Translatable attributes: the HTML holds Japanese; data-*-en holds English.
  const I18N_ATTRS = [['alt', 'altEn', 'altJa'], ['aria-label', 'labelEn', 'labelJa']];
  I18N_ATTRS.forEach(([attr, , ja]) => {
    $$(`[data-${attr === 'alt' ? 'alt' : 'label'}-en]`).forEach(el => { el.dataset[ja] = el.getAttribute(attr) || ''; });
  });

  const langSwitches = $$('.lang-switch');
  const langWipe = $('.lang-wipe');

  function setLang(lang, save) {
    lang = lang === 'en' ? 'en' : 'ja';
    root.lang = lang;
    document.title = META[lang].title;
    const desc = $('meta[name="description"]');
    if (desc) desc.content = META[lang].desc;
    I18N_ATTRS.forEach(([attr, en, ja]) => {
      $$(`[data-${attr === 'alt' ? 'alt' : 'label'}-en]`).forEach(el => el.setAttribute(attr, el.dataset[lang === 'en' ? en : ja]));
    });
    langSwitches.forEach(sw => {
      sw.classList.toggle('is-flipped', lang === 'en');
      sw.setAttribute('aria-label', lang === 'en' ? '日本語に切り替え' : 'Switch to English');
    });
    if (save) {
      try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url);
      requestAnimationFrame(refreshCollapsibles);
    }
  }
  setLang(root.lang, false);

  // Click anywhere on a switch to flip. A blue wipe covers the swap.
  langSwitches.forEach(sw => sw.addEventListener('click', () => {
    const next = root.lang === 'en' ? 'ja' : 'en';
    langSwitches.forEach(s => s.classList.toggle('is-flipped', next === 'en')); // thumb moves right away
    if (reducedMotion.matches || !langWipe) {
      setLang(next, true);
      $('main').animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
      return;
    }
    langWipe.textContent = next === 'en' ? 'LANG // ENGLISH' : 'LANG // 日本語';
    langWipe.classList.remove('is-run');
    void langWipe.offsetWidth; // restart the animation
    langWipe.classList.add('is-run');
    setTimeout(() => setLang(next, true), 330);
  }));
  if (langWipe) langWipe.addEventListener('animationend', () => langWipe.classList.remove('is-run'));

  /* ------------------------------------------------------------------
     2. Top bar: slides in after the home screen; phone menu; active link
     ------------------------------------------------------------------ */
  const topbar = $('.topbar');
  const home = $('.home');
  new IntersectionObserver(([entry]) => {
    topbar.classList.toggle('is-shown', !entry.isIntersecting);
  }, { rootMargin: '-80px 0px 0px 0px', threshold: 0 }).observe($('.home-nav'));

  const menuBtn = $('.menu-btn');
  const topnav = $('#topnav');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  topnav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)').addEventListener('change', () => setMenu(false));

  const navLinks = $$('.topnav a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.setAttribute('aria-current', String(a.hash === '#' + entry.target.id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => sectionObserver.observe(s));

  /* ------------------------------------------------------------------
     3. Windows pop in as you scroll
     ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ------------------------------------------------------------------
     4. Wavy text (original effect). Each language version is split
        separately; screen readers get the plain text.
     ------------------------------------------------------------------ */
  const isWide = c => /[　-鿿＀-￯]/.test(c);
  function waveify(el) {
    const text = el.textContent.trim();
    let i = 0;
    const html = text.split(/(\s+)/).map(token => {
      if (/^\s+$/.test(token)) return ' ';
      const chars = Array.from(token).map(c => `<span class="wave-char" style="--i:${i++}">${c}</span>`).join('');
      return Array.from(token).some(isWide) ? chars : `<span class="wave-word">${chars}</span>`; // Japanese may wrap anywhere
    }).join('');
    el.innerHTML = `<span class="visually-hidden">${text}</span><span aria-hidden="true">${html}</span>`;
  }
  $$('.wave').forEach(el => {
    const parts = $$(':scope > [lang]', el);
    (parts.length ? parts : [el]).forEach(waveify);
  });

  /* ------------------------------------------------------------------
     5. Original fluid ASCII background (whole page) + the taller
        Dreamscape copy. Follows the mouse.
     ------------------------------------------------------------------ */
  const asciiBg = $('#ascii-bg');
  const dreamAscii = $('#dreamscape-ascii-bg');
  const ASCII_CHARS = ' ..::++--==__ ';
  // Grid size follows the screen so the pattern reaches every edge.
  let COLS = 120, ROWS = 45;
  function sizeAscii() {
    const fs = parseFloat(getComputedStyle(asciiBg).fontSize) || 14;
    COLS = Math.min(260, Math.ceil(innerWidth / (fs * 0.6)) + 2);
    ROWS = Math.min(110, Math.ceil(innerHeight / (fs * 1.1)) + 1);
  }
  sizeAscii();
  window.addEventListener('resize', sizeAscii);
  let asciiTime = 0;
  let mouseX = innerWidth / 2, mouseY = innerHeight / 2, targetX = mouseX, targetY = mouseY;
  let dreamRows = 95;
  let dreamVisible = false;

  window.addEventListener('mousemove', e => { targetX = e.clientX; targetY = e.clientY; }, { passive: true });

  function updateDreamRows() {
    if (!dreamAscii) return;
    const lineH = parseFloat(getComputedStyle(dreamAscii).lineHeight) || 20;
    dreamRows = Math.min(220, Math.max(55, Math.ceil(Math.max(400, dreamAscii.clientHeight) / lineH)));
  }
  window.addEventListener('resize', updateDreamRows);
  window.addEventListener('load', updateDreamRows);
  if (dreamAscii) new IntersectionObserver(([e]) => { dreamVisible = e.isIntersecting; }).observe(dreamAscii);

  function drawAscii() {
    if (!document.hidden) {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      const W = innerWidth, H = innerHeight;
      const totalRows = dreamVisible ? Math.max(ROWS, dreamRows) : ROWS;
      const lines = [];
      for (let y = 0; y < totalRows; y++) {
        let row = '';
        for (let x = 0; x < COLS; x++) {
          const sx = (x / COLS) * W, sy = ((y % ROWS) / ROWS) * H;
          const dx = sx - mouseX, dy = sy - mouseY;
          const mouseDist = Math.max(0, 300 - Math.sqrt(dx * dx + dy * dy)) / 300;
          const centerDist = Math.sqrt((sx - W / 2) ** 2 + (sy - H / 2) ** 2);
          const ambientRipple = Math.sin(centerDist * 0.005 - asciiTime * 1.5 + y * 0.04) * 0.5;
          const planarWave = Math.cos(x * 0.1 + asciiTime) * Math.sin(y * 0.1 - asciiTime);
          const val = Math.max(0, Math.min(0.99, 0.5 + ambientRipple * 0.5 + planarWave * 0.3 + mouseDist * 0.5));
          row += ASCII_CHARS[Math.floor(val * ASCII_CHARS.length)];
        }
        lines.push(row);
      }
      asciiBg.textContent = lines.slice(0, ROWS).join('\n');
      if (dreamAscii && dreamVisible) dreamAscii.textContent = lines.slice(0, dreamRows).join('\n');
      asciiTime += 0.015;
    }
    setTimeout(() => requestAnimationFrame(drawAscii), 75);
  }
  drawAscii();

  // Dreamscape title font (1.8 MB) loads only when the section gets close.
  const dream = $('.dream');
  if (dream) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { dream.classList.add('is-near'); obs.disconnect(); updateDreamRows(); }
    }, { rootMargin: '600px 0px' }).observe(dream);
  }

  /* ------------------------------------------------------------------
     6. Mouse depth: home ghost logo + Dreamscape parallax (original)
     ------------------------------------------------------------------ */
  const ghost = $('.home-ghost');
  window.addEventListener('mousemove', e => {
    if (!finePointer.matches || !ghost) return;
    ghost.style.setProperty('--mx', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
    ghost.style.setProperty('--my', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
  }, { passive: true });

  if (dream) {
    const items = $$('.parallax', dream);
    dream.addEventListener('mousemove', e => {
      if (!finePointer.matches) return;
      const r = dream.getBoundingClientRect();
      items.forEach(it => {
        const s = parseFloat(it.dataset.speed) || 0;
        it.style.transform = `translate(${((r.width / 2 - (e.clientX - r.left)) * s).toFixed(1)}px, ${((innerHeight / 2 - e.clientY) * s).toFixed(1)}px)`;
      });
    });
    dream.addEventListener('mouseleave', () => items.forEach(it => { it.style.transform = ''; }));
  }

  /* ------------------------------------------------------------------
     7. Pixel dither strips, drawn once as a tiny image (original effect)
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
     8. Collapsible lists: clipped part-way into a row (data-rows, e.g. 3.5)
        and faded out through the dither. "Show more" expands smoothly.
     ------------------------------------------------------------------ */
  const collapsibles = $$('.collapsible');

  function clipHeight(wrap) {
    const top = wrap.getBoundingClientRect().top;
    const items = $$(':scope > * > *', wrap);
    const rows = new Map(); // row top → tallest item in that row
    items.forEach(it => {
      const r = it.getBoundingClientRect();
      const key = Math.round(r.top - top);
      rows.set(key, Math.max(rows.get(key) || 0, r.height));
    });
    const tops = [...rows.keys()].sort((a, b) => a - b);
    const want = parseFloat(wrap.dataset.rows) || 2.5;
    const full = Math.floor(want);
    if (tops.length <= full) return null; // short enough: no clipping needed
    return tops[full] + rows.get(tops[full]) * (want - full);
  }

  function refreshCollapsibles() {
    collapsibles.forEach(wrap => {
      const btn = $(`[aria-controls="${wrap.id}"]`);
      if (!wrap.classList.contains('is-collapsed')) { wrap.style.maxHeight = 'none'; return; }
      const h = clipHeight(wrap);
      wrap.style.maxHeight = h === null ? 'none' : `${Math.ceil(h)}px`;
      if (btn) btn.closest('.more').hidden = h === null;
    });
  }

  $$('[data-toggle-collapse]').forEach(btn => {
    const wrap = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const expand = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(expand));
      wrap.style.maxHeight = `${wrap.scrollHeight}px`;
      if (expand) {
        wrap.classList.remove('is-collapsed');
        wrap.addEventListener('transitionend', function done(ev) {
          if (ev.propertyName !== 'max-height') return;
          wrap.removeEventListener('transitionend', done);
          if (!wrap.classList.contains('is-collapsed')) wrap.style.maxHeight = 'none';
        });
      } else {
        void wrap.offsetHeight;
        wrap.classList.add('is-collapsed');
        refreshCollapsibles();
        if (wrap.getBoundingClientRect().top < 0) wrap.scrollIntoView({ block: 'start' });
      }
    });
  });
  collapsibles.forEach(wrap => new ResizeObserver(refreshCollapsibles).observe(wrap.firstElementChild));
  window.addEventListener('load', refreshCollapsibles);

  // Timeline sort: one-click switch (recent ⇄ past)
  const timeline = $('#timeline');
  const sortSwitch = $('#sort-switch');
  sortSwitch.addEventListener('click', () => {
    const past = sortSwitch.getAttribute('aria-pressed') !== 'true';
    sortSwitch.setAttribute('aria-pressed', String(past));
    sortSwitch.classList.toggle('is-flipped', past);
    $$('li', timeline)
      .sort((a, b) => (past ? 1 : -1) * a.dataset.date.localeCompare(b.dataset.date))
      .forEach(li => timeline.appendChild(li));
    refreshCollapsibles();
  });

  /* ------------------------------------------------------------------
     9. Lightbox (gallery photos + concert posters)
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
  let swipeX = null; // swipe left/right on touch screens
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
     10. YouTube player dialog (cards still work as normal links without JS)
     ------------------------------------------------------------------ */
  const videoDialog = $('#video-dialog');
  const videoFrame = $('.video-frame', videoDialog);
  const videoTitle = $('#video-dialog-title');
  const videoLink = $('#video-dialog-link');
  const audio = $('#audio');

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
    if (!audio.paused) audio.pause();
    videoDialog.showModal();
  }));
  videoDialog.addEventListener('close', () => videoFrame.replaceChildren()); // stops playback

  /* ------------------------------------------------------------------
     11. Demo audio player + spectrograph / waveform
     ------------------------------------------------------------------ */
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
  let actx = null, analyser = null, gain = null, freq = null, wave = null;
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
    analyser.smoothingTimeConstant = 0.72;
    analyser.minDecibels = -95;
    analyser.maxDecibels = -12;
    gain = actx.createGain();
    src.connect(analyser);
    analyser.connect(gain);
    gain.connect(actx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
    wave = new Uint8Array(analyser.fftSize);
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

  // Logarithmic bars (50 Hz – 7 kHz) with peak-hold ticks, plus a live waveform line.
  const MIN_F = 50, MAX_F = 7000, BANDS = 72;
  const TICKS = [50, 100, 200, 500, 1000, 2000, 5000, 7000];
  const levels = new Float32Array(BANDS);
  const peaks = new Float32Array(BANDS);
  let vizVisible = false, vizRunning = false, frame = 0;

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    drawViz(false);
  }

  function drawViz(playing) {
    const W = canvas.width, H = canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const padX = 12 * dpr, padTop = 34 * dpr, padBottom = 22 * dpr;
    const plotW = W - padX * 2, plotH = H - padTop - padBottom;
    ctx2d.clearRect(0, 0, W, H);

    ctx2d.font = `500 ${10 * dpr}px "JetBrains Mono", monospace`;
    ctx2d.textBaseline = 'alphabetic';
    TICKS.forEach((hz, i) => {
      const x = padX + (Math.log(hz / MIN_F) / Math.log(MAX_F / MIN_F)) * plotW;
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx2d.fillRect(Math.round(x), padTop, 1, plotH);
      if (W < 480 * dpr && (hz === 200 || hz === 2000 || hz === 5000)) return;
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx2d.textAlign = i === 0 ? 'left' : i === TICKS.length - 1 ? 'right' : 'center';
      ctx2d.fillText(hz >= 1000 ? `${hz / 1000}kHz` : `${hz}Hz`, x, H - 7 * dpr);
    });

    const step = plotW / BANDS;
    const barW = Math.max(1, step * 0.66);
    for (let b = 0; b < BANDS; b++) {
      const x = padX + b * step + (step - barW) / 2;
      const h = Math.max(2 * dpr, levels[b] * plotH);
      ctx2d.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx2d.fillRect(x, padTop + plotH - h, barW, h);
      if (peaks[b] > 0.02) {
        ctx2d.fillStyle = '#fff';
        ctx2d.fillRect(x, padTop + plotH - peaks[b] * plotH - 3 * dpr, barW, 1.5 * dpr);
      }
    }
    ctx2d.fillStyle = '#fff';
    ctx2d.fillRect(padX, padTop + plotH, plotW, 1 * dpr);

    const mid = padTop + plotH * 0.36, amp = plotH * 0.3;
    ctx2d.beginPath();
    const N = 260;
    for (let i = 0; i <= N; i++) {
      const x = padX + (i / N) * plotW;
      let s = playing && wave ? Math.tanh(((wave[Math.floor((i / N) * (wave.length - 1))] - 128) / 128) * 1.7) : 0;
      const y = mid + s * amp;
      if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    }
    ctx2d.strokeStyle = playing ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.35)';
    ctx2d.lineWidth = 2 * dpr;
    ctx2d.stroke();
  }

  function vizLoop() {
    if (!vizVisible) { vizRunning = false; return; }
    const playing = !audio.paused;
    let peak = 0, peakHz = 0, energy = 0;
    if (playing && analyser) { analyser.getByteFrequencyData(freq); analyser.getByteTimeDomainData(wave); }
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
        target = Math.min(0.92, Math.pow(sum / (i1 - i0) / 255, 1.05) * (0.92 + 0.35 * (b / BANDS)));
        if (target > peak) { peak = target; peakHz = Math.sqrt(f0 * f1); }
      }
      levels[b] += (target - levels[b]) * (target > levels[b] ? 0.38 : 0.14);
      peaks[b] = levels[b] >= peaks[b] ? levels[b] : Math.max(0, peaks[b] - 0.0055);
      energy += levels[b] + peaks[b];
    }
    drawViz(playing && !!analyser);
    if (++frame % 8 === 0) {
      peakEl.textContent = peak > 0.05 ? `PEAK: ${peakHz >= 1000 ? (peakHz / 1000).toFixed(2) + ' kHz' : Math.round(peakHz) + ' Hz'}` : 'PEAK: -- Hz';
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
     12. Footer year
     ------------------------------------------------------------------ */
  $('#year').textContent = new Date().getFullYear();
})();
