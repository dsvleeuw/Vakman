// De kleine interacties van de PR-overzichten:
//   · terug naar boven en de markering van de sectie die je leest
//   · de donkere modus, met een voorkeur die bewaard blijft
//   · de voortgangsbalk bovenin
//   · de lichtkast: klik op een schermafbeelding om hem groot te zien
(function () {
  'use strict';

  /* --- terug naar boven ------------------------------------------------- */

  var button = document.querySelector('[data-totop]');
  if (button) {
    var toggle = function () {
      button.classList.toggle('is-visible', window.scrollY > 420);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- de links in de balk volgen het scrollen -------------------------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            var active = link.getAttribute('href') === '#' + entry.target.id;
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* --- de donkere modus -------------------------------------------------- */

  var STORE = 'klusbaas-lavish-thema';
  var root = document.body;

  var applyTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    var toggleButton = document.querySelector('[data-theme-toggle]');
    if (toggleButton) {
      toggleButton.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      var label = toggleButton.querySelector('[data-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'Licht' : 'Donker';
    }
  };

  var stored = null;
  try {
    stored = window.localStorage.getItem(STORE);
  } catch (error) {
    stored = null;
  }
  var prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));

  var themeButton = document.querySelector('[data-theme-toggle]');
  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        window.localStorage.setItem(STORE, next);
      } catch (error) {
        /* zonder opslag blijft het thema alleen voor deze pagina */
      }
    });
  }

  /* --- de voortgangsbalk -------------------------------------------------- */

  var progressBar = document.querySelector('[data-progress]');
  if (progressBar) {
    var updateProgress = function () {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = height > 0 ? window.scrollY / height : 0;
      progressBar.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* --- de lichtkast ------------------------------------------------------- */

  var shots = Array.prototype.slice.call(document.querySelectorAll('[data-shot]'));
  if (!shots.length) return;

  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Schermafbeelding vergroten');
  lightbox.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="Sluiten">&times;</button>' +
    '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Vorige">&#8249;</button>' +
    '<figure class="lightbox__figure">' +
    '<img alt="" />' +
    '<figcaption class="lightbox__cap"></figcaption>' +
    '</figure>' +
    '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Volgende">&#8250;</button>';
  document.body.appendChild(lightbox);

  var lightboxImage = lightbox.querySelector('img');
  var lightboxCaption = lightbox.querySelector('.lightbox__cap');
  var current = 0;
  var lastFocused = null;

  var captionOf = function (shot) {
    var caption = shot.querySelector('.shot__cap');
    return caption ? caption.textContent.trim() : '';
  };

  var show = function (index) {
    if (!shots.length) return;
    current = (index + shots.length) % shots.length;
    var shot = shots[current];
    var image = shot.querySelector('img');
    if (!image) return;
    lightboxImage.src = image.getAttribute('src');
    lightboxImage.alt = image.getAttribute('alt') || '';
    lightboxCaption.textContent = captionOf(shot);
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox__close').focus();
  };

  var hide = function () {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  shots.forEach(function (shot, index) {
    var frame = shot.querySelector('.shot__frame, .shot__phone, .prshot');
    if (!frame) return;
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    frame.addEventListener('click', function () {
      lastFocused = frame;
      show(index);
    });
    frame.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        lastFocused = frame;
        show(index);
      }
    });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', hide);
  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () {
    show(current - 1);
  });
  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () {
    show(current + 1);
  });
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) hide();
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') hide();
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
})();
