(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  const A = 'assets/img/';
  const FALLBACK = [
    'linear-gradient(145deg,#2a2a2c 0%,#1c1c1e 55%,#161617 100%)',
    'linear-gradient(160deg,#33302a 0%,#201e1a 55%,#161514 100%)'
  ];

  const IMAGES = {
    'hero':       A + 'factory-hero.webp',
    'team':       A + 'team.webp',
    'extrusion':  A + 'extrusion.webp'
  };

  let fbI = 0;

  function paint(el, key) {
    const url = IMAGES[key];
    const fb = FALLBACK[fbI++ % FALLBACK.length];
    if (!url) { el.style.backgroundImage = fb; return; }
    if (el.querySelector('.bgimg')) return;
    const img = new Image();
    img.className = 'bgimg';
    img.alt = el.dataset.alt || '';
    img.decoding = 'async';

    if (key === 'hero') img.fetchPriority = 'high';
    img.onload = () => { el.appendChild(img); };
    img.onerror = () => { el.style.backgroundImage = fb; };
    img.src = new URL(url, document.baseURI).href;
  }

  function initImages() {
    const els = Array.from(document.querySelectorAll('[data-img]'));
    els.filter((e) => e.dataset.img === 'hero').forEach((e) => paint(e, e.dataset.img));
    const rest = els.filter((e) => e.dataset.img !== 'hero');
    if (!('IntersectionObserver' in window)) { rest.forEach((e) => paint(e, e.dataset.img)); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { paint(en.target, en.target.dataset.img); io.unobserve(en.target); }
    }), { rootMargin: '400px 0px' });
    rest.forEach((e) => io.observe(e));
  }

  function splitWords() {
    document.querySelectorAll('.split-words').forEach((el) => {
      if (el.dataset.done) return; el.dataset.done = '1';
      const frag = document.createDocumentFragment();
      el.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
            const s = document.createElement('span'); s.className = 'word'; s.style.display = 'inline-block'; s.textContent = tok; frag.appendChild(s);
          });
        } else frag.appendChild(node.cloneNode(true));
      });
      el.innerHTML = ''; el.appendChild(frag);
    });
  }

  function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }

  function initNav() {
    const nav = document.getElementById('nav');
    const on = () => nav.classList.toggle('is-solid', window.scrollY > 40);
    window.addEventListener('scroll', on, { passive: true }); on();
  }
  let menuEl, burgerEl;
  function closeMenu() { if (menuEl) { menuEl.classList.remove('is-open'); menuEl.setAttribute('aria-hidden', 'true'); if (burgerEl) { burgerEl.setAttribute('aria-expanded', 'false'); burgerEl.setAttribute('aria-label', 'Open menu'); } document.body.style.overflow = ''; } }
  function initMenu() {
    menuEl = document.getElementById('menu');
    const b = document.getElementById('burger');
    if (!menuEl || !b) return;
    burgerEl = b;
    b.addEventListener('click', () => {
      const open = menuEl.classList.toggle('is-open');
      menuEl.setAttribute('aria-hidden', open ? 'false' : 'true');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuEl.classList.contains('is-open')) { closeMenu(); b.focus(); }
    });
  }
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); closeMenu();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    }));
  }
  function initHero() {
    const slides = document.querySelectorAll('.hero__slide');
    if (slides.length > 1 && !reduced) {
      let i = 0;
      setInterval(() => { slides[i].classList.remove('is-active'); i = (i + 1) % slides.length; slides[i].classList.add('is-active'); }, 5500);
    }

    const late = performance.now() > 1500;
    if (hasGSAP && !reduced && !late) {
      const lines = document.querySelectorAll('.hero__title .line > span');
      if (lines.length) {
        gsap.set(lines, { yPercent: 115 });
        gsap.to(lines, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
      }
      gsap.fromTo('.hero__lead, .hero__cta, .hero__assure', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
      setTimeout(() => { if (lines.length) gsap.set(lines, { yPercent: 0 }); gsap.set('.hero__lead,.hero__cta,.hero__assure', { opacity: 1, y: 0 }); }, 2200);
    }
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', pre = el.dataset.prefix || '';
      if (reduced) { el.textContent = pre + target + suf; return; }
      let s = null; const dur = 1400;
      const step = (t) => { if (!s) s = t; const p = Math.min((t - s) / dur, 1); el.textContent = pre + Math.floor((1 - Math.pow(1 - p, 3)) * target) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = pre + target + suf; };
      requestAnimationFrame(step);
    }), { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    try {
      const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'li_fat_id', 'fbclid'];
      const qs = new URLSearchParams(location.search);
      KEYS.forEach((k) => { const v = qs.get(k); if (v) sessionStorage.setItem('attr_' + k, v); });
      KEYS.forEach((k) => { const el = form.elements[k]; const v = sessionStorage.getItem('attr_' + k); if (el && v) el.value = v; });
      if (form.elements.landing_url) form.elements.landing_url.value = location.href.split('#')[0];
    } catch (err) {  }
  }

  function initProgress() {
    const bar = document.getElementById('scrollProgress'); if (!bar) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? (window.scrollY / max).toFixed(4) : 0) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initQuickbar() {
    const bar = document.getElementById('quickbar'); if (!bar) return;
    const contact = document.getElementById('contact');
    let nearContact = false;
    function update() {
      const show = window.scrollY > 600 && !nearContact;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    window.addEventListener('scroll', update, { passive: true });
    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver((ents) => { ents.forEach((e) => { nearContact = e.isIntersecting; }); update(); }, { threshold: 0.05 }).observe(contact);
    }
    update();
  }

  function initMap() {
    const ph = document.getElementById('mapLoad');
    if (!ph) return;
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const f = document.createElement('iframe');
      f.className = 'contact__map-frame';
      f.title = 'Alcami Manufacturing — Prachinburi, Thailand';
      f.src = ph.getAttribute('data-map-src');
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.addEventListener('load', () => ph.remove());
      ph.parentNode.insertBefore(f, ph);
    };
    if (!('IntersectionObserver' in window)) { load(); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { io.disconnect(); load(); }
    }), { rootMargin: '800px 0px' });
    io.observe(ph.closest('.contact__map') || ph);
  }

  function initTop() {
    const btn = document.getElementById('toTop'); if (!btn) return;
    const t = () => btn.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', t, { passive: true }); t();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  function initChatWidget() {
    const SRC = 'https://portal.b2blead.ai/api/deployment/d333a20a-c9ba-4f71-8e3b-140a200e737c?v=2026-07-11T12%3A52%3A13.83307%2B00%3A00';
    let loaded = false;
    const hero = document.getElementById('hero');
    const load = () => {
      if (loaded) return;
      loaded = true;
      window.removeEventListener('scroll', onScroll);
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      document.body.appendChild(s);
    };
    const onScroll = () => { if (window.scrollY > (hero ? hero.offsetHeight - 80 : 400)) load(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    initImages();
    splitWords(); initReveals(); initNav(); initMenu(); initAnchors();
    initHero(); initCounters(); initForm(); initMap(); initTop();
    initProgress(); initQuickbar(); initChatWidget();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
