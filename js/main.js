/* ============================================================
   AromaNSur — Main JavaScript
   Scroll reveal, navbar effects, mobile menu, carousel
   ============================================================ */

(function () {
  'use strict';

  /* ── Scroll Reveal con IntersectionObserver ── */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Solo animar una vez
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  /* ── Navbar scroll effect ── */
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener(
      'scroll',
      () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
      },
      { passive: true }
    );
  }

  /* ── Mobile Menu Toggle ── */
  function initMobileMenu() {
    const toggle = document.querySelector('.navbar__toggle');
    const mobileMenu = document.querySelector('.navbar__mobile-menu');
    if (!toggle || !mobileMenu) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open')
        ? 'hidden'
        : '';
    });

    // Cerrar al hacer click en un enlace
    mobileMenu.querySelectorAll('.navbar__mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Smooth scroll para enlaces internos ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Carrusel automático ── */
  function initCarousels() {
    const carousels = document.querySelectorAll('[data-carousel]');
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const slides = carousel.querySelectorAll('.category__carousel-slide');
      const dots = carousel.querySelectorAll('.category__carousel-dot');
      if (slides.length < 2) return;

      let currentIndex = 0;
      let intervalId = null;
      const INTERVAL_MS = 3000;

      function goToSlide(index) {
        // Desactivar slide y dot actuales
        slides[currentIndex].classList.remove('active');
        if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

        // Activar nuevo slide y dot
        currentIndex = index;
        slides[currentIndex].classList.add('active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
      }

      function nextSlide() {
        const next = (currentIndex + 1) % slides.length;
        goToSlide(next);
      }

      function startAutoplay() {
        stopAutoplay();
        intervalId = setInterval(nextSlide, INTERVAL_MS);
      }

      function stopAutoplay() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }

      // Click en dots
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          goToSlide(i);
          startAutoplay(); // Reiniciar timer
        });
      });

      // Soporte touch swipe
      let touchStartX = 0;
      let touchEndX = 0;

      carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            // Swipe izquierda → siguiente
            goToSlide((currentIndex + 1) % slides.length);
          } else {
            // Swipe derecha → anterior
            goToSlide((currentIndex - 1 + slides.length) % slides.length);
          }
        }
        startAutoplay();
      }, { passive: true });

      // Pausar al hover
      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', startAutoplay);

      // Iniciar autoplay
      startAutoplay();
    });
  }

  /* ── Mobile Bento Carousel & Swipe Navigation ── */
  function initBentoCarousels() {
    const isMobile = window.matchMedia('(max-width: 768px)');
    if (!isMobile.matches) return;

    const grids = document.querySelectorAll('.bento-grid');
    if (!grids.length) return;

    grids.forEach((grid) => {
      // Evitar doble inicialización
      if (grid.dataset.bentoInitialized === 'true') return;
      grid.dataset.bentoInitialized = 'true';

      const items = grid.querySelectorAll('.bento-item');
      if (items.length < 2) return;

      // Asegurar visibilidad inmediata en móvil
      items.forEach((item) => {
        item.classList.add('visible');
      });

      // Contenedor de controles
      const controls = document.createElement('div');
      controls.className = 'bento-controls';

      // Fila de navegación (Anterior - Indicador Desliza - Siguiente)
      const navRow = document.createElement('div');
      navRow.className = 'bento-controls__nav-row';

      // Botón Anterior
      const prevBtn = document.createElement('button');
      prevBtn.className = 'bento-nav-btn bento-nav-btn--prev disabled';
      prevBtn.setAttribute('aria-label', 'Imagen anterior');
      prevBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      `;

      // Indicador interactivo "Desliza" (al pulsar cambia de imagen)
      const swipeHint = document.createElement('button');
      swipeHint.className = 'bento-swipe-hint';
      swipeHint.setAttribute('aria-label', 'Siguiente imagen');
      swipeHint.setAttribute('title', 'Toca o desliza para ver más');
      swipeHint.innerHTML = `
        <span class="bento-swipe-hint__icon bento-swipe-hint__icon--left">‹</span>
        <span class="bento-swipe-hint__text">Desliza</span>
        <span class="bento-swipe-hint__icon bento-swipe-hint__icon--right">›</span>
      `;

      // Botón Siguiente
      const nextBtn = document.createElement('button');
      nextBtn.className = 'bento-nav-btn bento-nav-btn--next';
      nextBtn.setAttribute('aria-label', 'Siguiente imagen');
      nextBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;

      navRow.appendChild(prevBtn);
      navRow.appendChild(swipeHint);
      navRow.appendChild(nextBtn);

      // Contenedor de Dots
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'bento-dots';
      dotsContainer.setAttribute('role', 'tablist');
      dotsContainer.setAttribute('aria-label', 'Navegación de imágenes');

      const dots = [];
      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'bento-dots__dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Foto ${i + 1} de ${items.length}`);
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

        dot.addEventListener('click', () => {
          scrollToIndex(i);
        });

        dotsContainer.appendChild(dot);
        dots.push(dot);
      });

      controls.appendChild(navRow);
      controls.appendChild(dotsContainer);

      // Insertar controles justo después de la cuadrícula
      grid.insertAdjacentElement('afterend', controls);

      let currentIndex = 0;

      function updateUI(index) {
        currentIndex = index;
        dots.forEach((d, di) => {
          const isActive = di === index;
          d.classList.toggle('active', isActive);
          d.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        prevBtn.classList.toggle('disabled', index === 0);
        nextBtn.classList.toggle('disabled', index === items.length - 1);
      }

      function scrollToIndex(index) {
        if (index < 0) index = 0;
        if (index >= items.length) index = items.length - 1;

        const targetItem = items[index];
        const gridRect = grid.getBoundingClientRect();
        const targetRect = targetItem.getBoundingClientRect();
        const scrollDelta = targetRect.left - gridRect.left - (gridRect.width - targetRect.width) / 2;

        grid.scrollBy({
          left: scrollDelta,
          behavior: 'smooth'
        });

        updateUI(index);
      }

      // Handlers de botones
      nextBtn.addEventListener('click', () => {
        const nextIdx = (currentIndex + 1) % items.length;
        scrollToIndex(nextIdx);
      });

      prevBtn.addEventListener('click', () => {
        const prevIdx = (currentIndex - 1 + items.length) % items.length;
        scrollToIndex(prevIdx);
      });

      // Al tocar el indicador minimalista "Desliza", avanza a la siguiente foto
      swipeHint.addEventListener('click', () => {
        const nextIdx = (currentIndex + 1) % items.length;
        scrollToIndex(nextIdx);
      });

      // Sincronización continua mientras el usuario hace "sweep" (deslizamiento táctil)
      let scrollTimeout = null;
      grid.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const gridCenter = grid.scrollLeft + grid.clientWidth / 2;
          let closestIndex = 0;
          let minDistance = Infinity;

          items.forEach((item, i) => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const dist = Math.abs(gridCenter - itemCenter);
            if (dist < minDistance) {
              minDistance = dist;
              closestIndex = i;
            }
          });

          updateUI(closestIndex);
        }, 40);
      }, { passive: true });
    });
  }

  /* ── Inicialización ── */
  function init() {
    initNavbar();
    initMobileMenu();
    initScrollReveal();
    initSmoothScroll();
    initCarousels();
    initBentoCarousels();
  }

  // Soporte para cambios dinámicos de tamaño de pantalla
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initBentoCarousels();
    }, 150);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
