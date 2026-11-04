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

  /* A primeira dobra aparece imediatamente para reduzir o tempo percebido de carregamento. */
  requestAnimationFrame(() => document.body.classList.add('ready'));

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

  /* ---- Abas de especialidades ---- */
  const tabs = $$('.tabs__btn'), pill = $('.tabs__pill');
  const movePill = btn => { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft}px)`; };
  function selectTab(btn) {
    tabs.forEach(b => {
      const on = b === btn, painel = $('#' + b.getAttribute('aria-controls'));
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      painel.hidden = !on;
      painel.classList.toggle('on', on);
    });
    movePill(btn);
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => selectTab(b));
    b.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next); next.focus();
    });
  });
  movePill($('.tabs__btn.on'));
  addEventListener('resize', () => movePill($('.tabs__btn.on')));
  document.fonts && document.fonts.ready.then(() => movePill($('.tabs__btn.on')));

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
