/* site.js — shared behavior for Matthew Ong's portfolio writeup pages.
 *
 * Include on any page with:
 *   <script src="../js/site.js" defer></script>
 * (adjust the relative path to wherever this file actually lives)
 *
 * Provides two independent, page-agnostic pieces. Neither requires any
 * other page-specific script — just the markup conventions noted below.
 *
 * ── sizeTableFrame(iframe) ──────────────────────────────────────────────
 * Auto-sizes a .table-embed iframe to match its embedded R-table
 * fragment, and toggles .is-scrollable on the wrapper when the table is
 * wider than the page (styles.css handles the actual scroll/fade
 * behavior off that class). Wire it up per-iframe with:
 *   <iframe src="tables/whatever.html" onload="sizeTableFrame(this)"></iframe>
 * inside a `.table-embed` wrapper. The inline onload attribute (rather
 * than addEventListener from this file) is deliberate — it's registered
 * at parse time, before the iframe starts fetching its src, so it can
 * never miss the load event even if the sub-document loads instantly
 * from cache.
 *
 * ── TOC scroll-spy ──────────────────────────────────────────────────────
 * Highlights the current section's link (adds .toc-active) as the reader
 * scrolls, for any page with `.toc-link` elements whose href targets
 * exist in the document. Runs automatically; does nothing if the page
 * has no `.toc-link` elements.
 */

function sizeTableFrame(iframe) {
  var doc = iframe.contentDocument;
  if (!doc || !doc.body) return;
  var table = doc.querySelector('table');

  function measure() {
    var box = table ? table.getBoundingClientRect() : doc.body.getBoundingClientRect();
    return { w: Math.ceil(box.width), h: Math.ceil(box.height) };
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
