(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '5561998101329';
  const waUrl = texto => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

  /* ---- Links de WhatsApp com mensagem pronta ---- */
  $$('[data-wa]').forEach(el => {
    el.href = waUrl(el.dataset.wa);
    el.target = '_blank';
    el.rel = 'noopener';
  });
  $('#ano').textContent = new Date().getFullYear();

  /* ---- Loader: contador ligado ao carregamento real da imagem do hero, mínimo 1,8s ---- */
  const loader = $('#loader'), countEl = $('#count'), bar = $('#bar');
  const imgs = $$('.hero img');
  let loaded = 0;
  imgs.forEach(img => {
    if (img.complete) loaded++;
    else img.addEventListener('load', () => loaded++, { once: true }), img.addEventListener('error', () => loaded++, { once: true });
  });
  const start = performance.now(), minT = reduce ? 200 : 1800;
  let shown = 0;
  (function tick(now) {
    const timeP = Math.min((now - start) / minT, 1);
    const loadP = imgs.length ? loaded / imgs.length : 1;
    const target = Math.min(timeP, Math.max(loadP, timeP * .9)) * 100;
    shown += (target - shown) * .12;
    if (timeP >= 1 && loadP >= 1) shown = Math.max(shown, 99.6);
    if (now - start > 5000) shown = 100; // fallback em redes lentas
    const v = Math.round(shown);
    countEl.textContent = v;
    bar.style.width = v + '%';
    if (v >= 100) return finish();
    requestAnimationFrame(tick);
  })(start);
  function finish() {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.remove('is-loading');
      document.body.classList.add('ready');
      setTimeout(() => loader.remove(), 1200);
    }, 250);
  }

  /* ---- Títulos revelados palavra por palavra ---- */
  $$('.words').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* ---- Reveal on scroll ---- */
  // elementos totalmente recortados nunca reportam interseção, então o reveal "clip" observa o pai
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    (e.target._revealTargets || [e.target]).forEach(t => t.classList.add('in'));
    io.unobserve(e.target);
  }), { threshold: .1, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], .circled, #band').forEach(el => {
    if (el.dataset.reveal !== 'clip') return io.observe(el);
    const p = el.parentElement;
    (p._revealTargets ||= []).push(el);
    io.observe(p);
  });

  /* ---- Contadores ---- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '', t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / 1800, 1), k = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * k).toFixed(dec).replace('.', ',') + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---- Efeitos ligados ao scroll ---- */
  const header = $('#header');
  const hs = $('#hscroll'), ht = $('#htrack');
  const parallax = $$('[data-parallax]');
  const words = $$('.words');
  let lastY = 0;
  function onScroll() {
    const y = scrollY, vh = innerHeight;
    header.classList.toggle('solid', y > 40);
    header.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;

    // galeria horizontal
    if (innerWidth > 980) {
      const r = hs.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / (r.height - vh), 0), 1);
      ht.style.transform = `translate3d(${-p * (ht.scrollWidth - innerWidth)}px,0,0)`;
    }
    // palavra por palavra
    words.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max((vh * .85 - r.top) / (r.height + vh * .35), 0), 1);
      const ws = el.children, n = Math.floor(p * ws.length * 1.05);
      for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    });
    // parallax
    if (!reduce) parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const off = (r.top + r.height / 2 - vh / 2) * -(+el.dataset.parallax);
      el.style.transform = `translate3d(0,${off - r.height * .07}px,0)`;
    });
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- Acordeões (serviços troca a imagem fixa) ---- */
  function accordion(root, onOpen) {
    const items = $$('.acc__item', root);
    items.forEach((it, i) => $('.acc__btn', it).addEventListener('click', () => {
      const wasOpen = it.classList.contains('open');
      items.forEach(x => { x.classList.remove('open'); $('.acc__btn', x).setAttribute('aria-expanded', 'false'); });
      if (!wasOpen) { it.classList.add('open'); $('.acc__btn', it).setAttribute('aria-expanded', 'true'); }
      onOpen && onOpen(it, i);
    }));
  }
  const svcIn = $('#svcIn');
  accordion($('#acc'), (it, i) => {
    svcIn.classList.add('troca');
    setTimeout(() => {
      $('#svcG').textContent = it.dataset.g;
      $('#svcN').textContent = String(i + 1).padStart(2, '0');
      $('#svcT').textContent = $('.acc__btn span', it).textContent;
      $('#svcP').textContent = it.dataset.p;
      svcIn.classList.remove('troca');
    }, 280);
  });


  /* ---- Formulário: monta a mensagem e envia pelo WhatsApp (sem servidor) ---- */
  const form = $('#form'), formErro = $('#formErro');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const nome = d.get('nome').trim(), tel = d.get('tel').trim(), assunto = d.get('assunto');
    if (!nome || tel.replace(/\D/g, '').length < 10 || !assunto) {
      formErro.textContent = 'Preencha nome, WhatsApp com DDD e o assunto.';
      return;
    }
    formErro.textContent = '';
    let msg = `Olá, Dra. Jaqueline! Meu nome é ${nome}. Gostaria de falar sobre: ${assunto}.`;
    const extra = d.get('msg').trim();
    if (extra) msg += `\n\n${extra}`;
    msg += `\n\nMeu WhatsApp: ${tel}`;
    window.open(waUrl(msg), '_blank', 'noopener');
  });
  form.addEventListener('input', () => (formErro.textContent = ''));
})();
