// De kleine interacties van de PR-overzichten: terug naar boven en een
// markering van de sectie die je leest.
(function () {
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

  // De links in de balk volgen het scrollen.
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
})();
