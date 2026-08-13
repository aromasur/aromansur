/* ============================================================
   AromaNSur — Title Stroke Animation
   Animated stroke-drawing reveal for category page titles.
   The text outline draws itself in, then fills with colour.
   ============================================================ */

(function () {
  'use strict';

  function initTitleStroke() {
    var titles = document.querySelectorAll('.cat-hero__title, .category__title');
    if (!titles.length) return;

    // Mark titles for stroke animation BEFORE the scroll-reveal
    // fires, so the initial state is set via CSS.
    titles.forEach(function (title) {
      title.classList.add('stroke-ready');
    });
  }

  // Run as early as possible so the class is added before
  // the IntersectionObserver in main.js triggers .visible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTitleStroke);
  } else {
    initTitleStroke();
  }
})();
