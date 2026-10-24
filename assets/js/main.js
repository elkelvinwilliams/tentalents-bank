/* =====================================================================
   THE TEN TALENTS BANK — Interactions
   Lightweight, dependency-free. Respects prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header scrolled state + scroll progress ---- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.scroll-progress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Animated counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    function fmt(v) {
      return prefix + v.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    }
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- Subtle hero parallax (pointer) ---- */
  var orbs = document.querySelectorAll('.hero-orb');
  if (!reduceMotion && orbs.length && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      orbs.forEach(function (orb, i) {
        var depth = (i + 1) * 14;
        orb.style.transform = 'translate3d(' + (cx * depth) + 'px,' + (cy * depth) + 'px,0)';
      });
    }, { passive: true });
  }

  /* ---- Demo form handling ---- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var done = form.querySelector('.form-success');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setTimeout(function () {
        if (done) done.hidden = false;
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = 'Submit enquiry'; }
      }, 900);
    });
  });

  /* ---- Footer year ---- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();

/* ---- v2 motion: word-by-word headlines + card tilt ---- */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-words]').forEach(function (el) {
    if (reduce) { el.classList.add('in-view'); return; }
    var html = '', i = 0;
    el.childNodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { html += part; return; }
          html += '<span class="w" style="transition-delay:' + (i++ * 70) + 'ms">' + part + '</span>';
        });
      } else if (node.nodeType === 1) {
        html += '<span class="w" style="transition-delay:' + (i++ * 70) + 'ms">' + node.outerHTML + '</span>';
      }
    });
    el.innerHTML = html; el.classList.add('words');
    requestAnimationFrame(function () { setTimeout(function () { el.classList.add('in-view'); }, 120); });
  });
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 6) + 'deg'); card.style.setProperty('--rx', (-y * 6) + 'deg');
      });
      card.addEventListener('mouseleave', function () { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
    });
  }
})();

/* ---- Academy links follow TT_APP_URL (assets/js/config.js) ---- */
(function () {
  var url = window.TT_APP_URL; if (!url) return;
  document.querySelectorAll('a[data-app]').forEach(function (a) { a.setAttribute('href', url); if (/^https?:/.test(url)) a.setAttribute('rel', 'noopener'); });
})();

/* ---- Partnerships: render confirmed broker partners from TT_BROKERS (assets/js/config.js) ---- */
(function () {
  var box = document.querySelector('[data-brokers]'); if (!box) return;
  var list = box.querySelector('.bp-list'), empty = box.querySelector('.bp-empty');
  var brokers = Array.isArray(window.TT_BROKERS) ? window.TT_BROKERS.filter(function (b) { return b && typeof b.name === 'string' && b.name.trim(); }) : [];
  if (!brokers.length || !list) return;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  list.innerHTML = brokers.map(function (b) {
    // Only an approved http(s) referral link becomes a link; anything else shows the name alone.
    var linked = /^https?:\/\//i.test(b.url || '');
    var name = linked ? '<a href="' + esc(b.url) + '" rel="sponsored noopener" target="_blank">' + esc(b.name) + '</a>' : '<span class="bp-name">' + esc(b.name) + '</span>';
    var note = linked ? (b.note || 'Affiliate link \u2014 Ten Talents may receive a commission.') : (b.note || 'Affiliate partner');
    // Logo: a local file under assets/img/brokers/, or a domain fetched through the app's Logo.dev endpoint.
    var src = '', via = '';
    if (typeof b.logo === 'string' && /^assets\/img\/brokers\/[\w.-]+\.(png|svg|webp|jpg)$/i.test(b.logo)) { src = b.logo; via = 'file'; }
    else if (typeof b.domain === 'string' && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(b.domain) && window.TT_LOGO_ENDPOINT) { src = window.TT_LOGO_ENDPOINT + b.domain.toLowerCase(); via = 'logodev'; }
    var logo = src ? '<span class="bp-logo"><img src="' + esc(src) + '" alt="" width="48" height="48" loading="lazy" decoding="async" data-via="' + via + '" /></span>' : '';
    return '<li>' + logo + name + '<small>' + esc(note) + (b.risk ? ' ' + esc(b.risk) : '') + '</small></li>';
  }).join('');
  list.hidden = false; if (empty) empty.hidden = true;
  var credit = box.querySelector('.bp-credit');
  var syncCredit = function () { if (credit) credit.hidden = !list.querySelector('img[data-via="logodev"]'); };
  list.querySelectorAll('.bp-logo img').forEach(function (img) {
    img.addEventListener('error', function () { var w = img.parentNode; if (w && w.parentNode) w.parentNode.removeChild(w); syncCredit(); });
  });
  syncCredit();
})();

