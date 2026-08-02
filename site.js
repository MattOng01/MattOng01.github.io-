/* site.js — shared behavior for Matthew Ong's portfolio writeup pages.
 *
 * Include on any page with:
 *   <script src="../site.js" defer></script>


function sizeTableFrame(iframe) {
  var doc = iframe.contentDocument;
  if (!doc || !doc.body) return;
  var table = doc.querySelector('table');

  function measure() {
    // Width: measure the <table> itself — <body> stretches to fill
    // whatever width the iframe currently is, so it can't be trusted
    // for width (see the width fix earlier in this file's history).
    var wBox = table ? table.getBoundingClientRect() : doc.body.getBoundingClientRect();

    // Height: measure <body>, not the table. Some table exports (gt/
    // Quarto output, specifically) wrap the <table> in their own div
    // with an independent overflow-x:auto. If that div's own horizontal
    // scrollbar ever kicks in — e.g. the table is a hair wider than the
    // div's available width — it eats a strip of vertical space at the
    // bottom that the table's own bounding box has no way to know
    // about. <body>'s height:auto wraps everything, scrollbar gutter
    // included, so it won't miss that extra space the way measuring the
    // table directly does.
    var hBox = doc.body.getBoundingClientRect();

    return { w: Math.ceil(wBox.width), h: Math.ceil(hBox.height) };
  }

  iframe.style.width = '2000px';

  // rAF, not an immediate read: gives the browser a real layout/paint
  // pass to settle on before we trust anything it reports.
  requestAnimationFrame(function () {
    var first = measure();
    iframe.style.width = (first.w + 2) + 'px';

    requestAnimationFrame(function () {
      // Re-measure at the now-final (narrower) width. If a cell wraps
      // onto a second line at this width that didn't wrap with 2000px
      // of room to spare, the table needs more height than the first
      // reading showed — take whichever measurement came out taller
      // instead of trusting the wide-open one blindly.
      var second = measure();
      var h = Math.max(first.h, second.h) + 2;
      iframe.style.height = h + 'px';

      var wrapper = iframe.closest('.table-embed');
      if (wrapper) {
        wrapper.classList.toggle('is-scrollable', first.w + 2 > wrapper.clientWidth);
      }
    });
  });
}

(function () {
  function initScrollSpy() {
    var links = document.querySelectorAll('.toc-link');
    if (!links.length) return;

    var sections = Array.from(links).map(function (l) {
      return document.querySelector(l.getAttribute('href'));
    }).filter(Boolean);

    function onScroll() {
      var scrollY = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.offsetTop <= scrollY) current = s;
      });
      links.forEach(function (l) {
        l.classList.toggle('toc-active',
          l.getAttribute('href') === '#' + current.id);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Safe to load this file from <head> (deferred or not) or from the
  // bottom of <body> — DOM readiness is checked rather than assumed.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollSpy);
  } else {
    initScrollSpy();
  }
})();
