/*!
 * CRÉAZIO MOTIONS — motions.js
 * Gère : Reveal IO, Parallax scroll, Hover 3D tilt, Glow spotlight, Counters
 * Inclure en bas de <body> dans universal.html
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════
     1. SCROLL REVEAL — IntersectionObserver
     Cibles : .reveal, .fade-up, .slide-left, .slide-right,
              .scale-in, .text-reveal, .stagger, .counter-wrap
     ══════════════════════════════════════════════════ */
  var revealSelectors = [
    '.reveal', '.fade-up', '.slide-left', '.slide-right',
    '.scale-in', '.text-reveal', '.stagger',
  ].join(',');

  var revealEls = document.querySelectorAll(revealSelectors);

  if (reducedMotion) {
    revealEls.forEach(function(el) { el.classList.add('revealed'); });
  } else {
    var revealIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

    revealEls.forEach(function(el) { revealIO.observe(el); });
  }

  /* ══════════════════════════════════════════════════════
     2. COUNTERS — chiffres qui montent
     Usage : <span class="counter" data-target="2500" data-suffix="+"
              data-duration="1800">0</span>
     ══════════════════════════════════════════════════ */
  function animateCounter(el) {
    var target   = parseFloat(el.dataset.target   || 0);
    var duration = parseInt(el.dataset.duration   || 1600, 10);
    var suffix   = el.dataset.suffix  || '';
    var prefix   = el.dataset.prefix  || '';
    var decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      /* easeOutExpo */
      var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      var current = target * eased;
      el.textContent = prefix + (decimals ? current.toFixed(decimals) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counterEls = document.querySelectorAll('.counter[data-target]');
  if (counterEls.length) {
    var counterIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(function(el) { counterIO.observe(el); });
  }

  /* ══════════════════════════════════════════════════════
     3. PARALLAX — défilement en profondeur
     Usage : class="parallax-slow|medium|fast" (data-speed optionnel)
     Vitesse : slow=0.15, medium=0.30, fast=0.50
     ══════════════════════════════════════════════════ */
  if (!reducedMotion) {
    var parallaxEls = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');

    if (parallaxEls.length) {
      function getSpeed(el) {
        if (el.dataset.speed) return parseFloat(el.dataset.speed);
        if (el.classList.contains('parallax-fast'))   return 0.50;
        if (el.classList.contains('parallax-medium')) return 0.30;
        return 0.15; /* slow */
      }

      var ticking = false;
      function updateParallax() {
        var scrollY = window.scrollY || window.pageYOffset;
        parallaxEls.forEach(function(el) {
          var rect = el.getBoundingClientRect();
          var center = rect.top + rect.height / 2 - window.innerHeight / 2;
          var offset = center * getSpeed(el);
          el.style.transform = 'translateY(' + offset.toFixed(2) + 'px)';
        });
        ticking = false;
      }

      window.addEventListener('scroll', function() {
        if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
      }, { passive: true });

      updateParallax();
    }
  }

  /* ══════════════════════════════════════════════════════
     4. HOVER 3D TILT — rotation perspective au survol
     Usage : class="hover-3d" (data-intensity="8" optionnel)
     ══════════════════════════════════════════════════ */
  if (!reducedMotion) {
    document.querySelectorAll('.hover-3d').forEach(function(card) {
      var intensity = parseFloat(card.dataset.intensity || 8);

      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var cx   = (e.clientX - rect.left) / rect.width  - .5;
        var cy   = (e.clientY - rect.top)  / rect.height - .5;
        var rx   = -cy * intensity;
        var ry   =  cx * intensity;
        card.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(6px)';
      });

      card.addEventListener('mouseleave', function() {
        card.style.transform = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     5. GLOW SPOTLIGHT — halo qui suit la souris
     Usage : class="glow-hover"
     ══════════════════════════════════════════════════ */
  if (!reducedMotion) {
    document.querySelectorAll('.glow-hover').forEach(function(el) {
      el.addEventListener('mousemove', function(e) {
        var rect = el.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        el.style.setProperty('--glow-x', x + '%');
        el.style.setProperty('--glow-y', y + '%');
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     6. NAVBAR SCROLL — solid background après scroll
     ══════════════════════════════════════════════════ */
  var siteNav = document.getElementById('site-nav') || document.querySelector('header nav, nav.site-nav');
  if (siteNav) {
    window.addEventListener('scroll', function() {
      siteNav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     7. FAQ ACCORDÉON
     Compatible avec <details> et avec divs + onclick
     ══════════════════════════════════════════════════ */
  document.querySelectorAll('.faq-item details').forEach(function(details) {
    details.addEventListener('toggle', function() {
      var icon = details.querySelector('.faq-icon svg');
      if (!icon) return;
      icon.style.transform = details.open ? 'rotate(180deg)' : '';
    });
  });

  /* ══════════════════════════════════════════════════════
     8. SMOOTH SCROLL — ancres internes
     ══════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        var offset = parseInt(document.documentElement.style.getPropertyValue('--nav-height') || 60, 10);
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ══════════════════════════════════════════════════════
     9. CONTACT FORM — soumission Ajax
     ══════════════════════════════════════════════════ */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = contactForm.querySelector('[type="submit"]');
      var originalText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Envoi en cours…'; }

      var data = {
        name:    contactForm.querySelector('[name="name"]')?.value    || '',
        email:   contactForm.querySelector('[name="email"]')?.value   || '',
        subject: contactForm.querySelector('[name="subject"]')?.value || '',
        message: contactForm.querySelector('[name="message"]')?.value || '',
        siteId:  document.documentElement.dataset.siteId || '',
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function(r) { return r.json(); })
        .then(function() {
          contactForm.innerHTML = '<div class="form-success"><p>✓ Message envoyé ! Vous recevrez une réponse rapidement.</p></div>';
        })
        .catch(function() {
          if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
          alert('Une erreur est survenue. Veuillez réessayer.');
        });
    });
  }

})();
