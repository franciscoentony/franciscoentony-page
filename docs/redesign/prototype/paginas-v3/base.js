/* v3: comportamento comum. Tudo respeita os níveis (PERF-TIERS) e o reduced motion. */
(() => {
  const q = new URLSearchParams(location.search);
  const TIER = q.get('quality') || 'alto';
  document.documentElement.dataset.quality = TIER;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATIC = RM || TIER === 'baixo';
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const RAMP = ' .,:;-=+*#%@';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const P = window.V3 = { q, TIER, RM, STATIC, FINE, DPR, RAMP, clamp };

  P.fit = c => { const r = c.getBoundingClientRect(); c.width = Math.max(1, r.width * DPR); c.height = Math.max(1, r.height * DPR); const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return { x, w: r.width, h: r.height }; };

  /* ---------- estrelas da Home ---------- */
  const sc = document.getElementById('stars'); let S, W, H, L = [];
  const initS = () => { ({ x: S, w: W, h: H } = P.fit(sc)); L = Array.from({ length: Math.round(W * H / (TIER === 'alto' ? 4200 : 8400)) }, () => ({ x: Math.random() * W, y: Math.random() * H * 3, z: Math.random() ** 2 * .9 + .1, t: Math.random() * 6 })); };
  const drawS = t => { S.clearRect(0, 0, W, H); for (const s of L) { const y = ((s.y - scrollY * s.z * .35) % (H * 3) + H * 3) % (H * 3) - H; if (y < -10 || y > H + 10) continue;
    const tw = STATIC ? 1 : .7 + .3 * Math.sin(t * .002 + s.t); S.fillStyle = `rgba(235,230,255,${(.35 + .6 * s.z) * tw})`; const r = .7 + s.z * 1.9; S.fillRect(s.x, y, r, r); } };
  const frameHooks = [];
  P.onFrame = fn => frameHooks.push(fn);
  P.start = () => { initS(); addEventListener('resize', initS);
    if (STATIC) { drawS(0); addEventListener('scroll', () => drawS(0), { passive: true }); addEventListener('resize', () => drawS(0)); return; }
    const loop = t => { drawS(t); for (const f of frameHooks) f(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); };

  /* ---------- nav: some ao descer; local nav sobe para o topo e mostra o título ---------- */
  const root = document.documentElement; let lastY = scrollY;
  const title = () => document.querySelector('[data-title]');
  const bar = () => document.querySelector('.lnav .rule i');
  const readEl = () => document.querySelector('[data-read]');
  const onScroll = () => { const y = scrollY; root.classList.toggle('nav-hidden', y > lastY && y > 200); lastY = y;
    const t = title(); if (t) root.classList.toggle('past-title', t.getBoundingClientRect().bottom < 100);
    const r = readEl(), b = bar(); if (r && b) { const rr = r.getBoundingClientRect(); b.style.transform = `scaleX(${clamp(-rr.top / Math.max(1, rr.height - innerHeight))})`; } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('load', onScroll);

  /* ---------- skeleton (spec C): simula rede lenta ---------- */
  P.media = () => { const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target);
    const f = e.target, img = f.querySelector('img[data-src]'); if (!img) { if (!STATIC) f.dataset.state = 'loading'; return; }
    f.dataset.state = 'loading'; setTimeout(() => { img.onload = () => { if (f.hasAttribute('data-reveal') && !STATIC) { const c = f.querySelector('canvas.reveal'); P.asciiImage(c, img, 7); f.dataset.state = 'ascii'; setTimeout(() => f.dataset.state = 'loaded', 700); } else f.dataset.state = 'loaded'; f.dispatchEvent(new Event('mediaload')); }; img.onerror = () => { f.dataset.state = 'error'; f.dataset.alt = img.alt; }; img.src = img.dataset.src; }, 300 + Math.random() * 800); }), { rootMargin: '200px' });
    document.querySelectorAll('[data-media]').forEach(f => io.observe(f)); };

  /* ---------- ASCII de uma imagem (desenhado uma vez; a lente é só máscara CSS) ---------- */
  P.asciiImage = (canvas, img, cell = 7, lift = 1) => {
    const { x, w, h } = P.fit(canvas); const cw = cell * .62, ch = cell * 1.12;
    const cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
    const t = document.createElement('canvas'); t.width = cols; t.height = rows; const tx = t.getContext('2d');
    const ir = img.naturalWidth / img.naturalHeight, cr = w / h; let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (ir > cr) { sw = sh * cr; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / cr; sy = (img.naturalHeight - sh) / 2; }
    tx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows); const d = tx.getImageData(0, 0, cols, rows).data;
    x.clearRect(0, 0, w, h); x.font = `600 ${cell}px "Geist Mono", monospace`; x.textBaseline = 'top';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const o = (j * cols + i) * 4;
      let b = (d[o] * .3 + d[o + 1] * .59 + d[o + 2] * .11) / 255; b = Math.pow(b, .85 / lift) * 1.1 * lift; if (b < .06) continue; b = clamp(b);
      x.fillStyle = `hsla(${250 + (i / cols) * 40},90%,${55 + b * 35}%,${.4 + b * .6})`; x.fillText(RAMP[Math.round(b * (RAMP.length - 1))], i * cw, j * ch); }
  };
  /* liga a lente: só com mouse e fora do Baixo/RM */
  P.lens = (box, draw) => { if (STATIC || !FINE) return; let drawn = false;
    box.addEventListener('pointerenter', () => { if (!drawn) { draw(); drawn = true; } box.classList.add('on'); });
    box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); box.style.setProperty('--px', (e.clientX - r.left) + 'px'); box.style.setProperty('--py', (e.clientY - r.top) + 'px'); });
    box.addEventListener('pointerleave', () => box.classList.remove('on')); };

  /* ---------- decodificação ASCII de um texto (cópia de link, números) ---------- */
  P.decode = (el, text, ms = 520) => { if (STATIC) { el.textContent = text; return; }
    const t0 = performance.now(); const step = now => { const k = clamp((now - t0) / ms); const n = Math.floor(k * text.length);
      el.textContent = text.slice(0, n) + [...text.slice(n)].map(c => c === ' ' ? ' ' : RAMP[1 + Math.floor(Math.random() * (RAMP.length - 1))]).join('');
      if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

  /* ---------- menu no celular: o overlay de tela cheia da Home (D20) ---------- */
  const navWrap = document.querySelector('nav.top .wrap'), links = document.querySelector('nav.top .links');
  if (navWrap && links) {
    const btn = document.createElement('button'); btn.className = 'menu-btn'; btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mmenu');
    btn.innerHTML = '<span class="vh">Abrir menu</span><svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h12M3 12h12"/></svg>';
    const ov = document.createElement('div'); ov.id = 'mmenu'; ov.className = 'mmenu'; ov.hidden = true; ov.innerHTML = links.innerHTML; document.body.append(ov);
    btn.onclick = () => { const open = ov.hidden; ov.hidden = !open; btn.setAttribute('aria-expanded', open); btn.querySelector('.vh').textContent = open ? 'Fechar menu' : 'Abrir menu'; btn.querySelector('path').setAttribute('d', open ? 'M4.5 4.5l9 9M13.5 4.5l-9 9' : 'M3 6h12M3 12h12'); document.body.style.overflow = open ? 'hidden' : ''; };
    addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) { btn.click(); btn.focus(); } });
    navWrap.append(btn);
  }

  /* ---------- copiar: decodifica o rótulo; falha diz que falhou; leitor de tela ouve a versão limpa ---------- */
  const live = document.createElement('p'); live.className = 'vh'; live.setAttribute('aria-live', 'polite'); document.body.append(live);
  P.copy = (btn, text, ok, idle) => { btn.setAttribute('aria-label', idle);
    const done = msg => { P.decode(btn, msg); live.textContent = msg; clearTimeout(btn._t); btn._t = setTimeout(() => P.decode(btn, idle), 2200); };
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => done(ok), () => done('Não deu para copiar')); };

  /* ---------- só no protótipo: marcar o que é conteúdo de exemplo ---------- */
  P.proto = () => { const b = document.createElement('div'); b.className = 'proto';
    const t = document.createElement('button'); t.textContent = 'Marcar conteúdo de exemplo'; t.setAttribute('aria-pressed', 'false');
    t.onclick = () => { const on = root.classList.toggle('show-ex'); t.setAttribute('aria-pressed', on); }; b.append(t); document.body.append(b); };
})();
