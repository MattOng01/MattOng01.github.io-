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

  iframe.style.width = '2000px';

  // Read both dimensions together, in this one pass, while the iframe
  // still has generous (2000px) room to lay out unconstrained. A <table>
  // given at least as much width as it needs settles at exactly its own
  // natural width and doesn't grow taller with more room — so giving it
  // *exactly* that width afterward doesn't change its height. There's no
  // need to re-read height a second time right after narrowing the
  // iframe down, which is what an earlier version of this function did.
  //
  // getBoundingClientRect() is used instead of scrollWidth/scrollHeight
  // because scrollWidth/scrollHeight round down to a whole pixel, which
  // can shave a table's true size just enough to clip its bottom edge;
  // getBoundingClientRect returns the exact (fractional) size. The +2px
  // is a small safety margin against any remaining sub-pixel rounding.
  var table = doc.querySelector('table');
  var box = table ? table.getBoundingClientRect() : doc.body.getBoundingClientRect();
  var w = Math.ceil(box.width) + 2;
  var h = Math.ceil(box.height) + 2;

  iframe.style.width = w + 'px';
  iframe.style.height = h + 'px';

  var wrapper = iframe.closest('.table-embed');
  if (wrapper) {
    wrapper.classList.toggle('is-scrollable', w > wrapper.clientWidth);
  }
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
