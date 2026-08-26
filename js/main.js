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

  /* ── Mobile Bento Carousel Dots ── */
  function initBentoDots() {
    const isMobile = window.matchMedia('(max-width: 768px)');
    if (!isMobile.matches) return;

    const grids = document.querySelectorAll('.bento-grid');
    if (!grids.length) return;

    grids.forEach((grid) => {
      const items = grid.querySelectorAll('.bento-item');
      if (items.length < 2) return;

      // Create dots container
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'bento-dots';
      dotsContainer.setAttribute('role', 'tablist');
      dotsContainer.setAttribute('aria-label', 'Navegación del carrusel');

      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'bento-dots__dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Imagen ${i + 1} de ${items.length}`);
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

        dot.addEventListener('click', () => {
          items[i].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        });

        dotsContainer.appendChild(dot);
      });

      // Insert dots right after the grid
      grid.insertAdjacentElement('afterend', dotsContainer);

      // Track scroll to update active dot
      const dots = dotsContainer.querySelectorAll('.bento-dots__dot');

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              const index = Array.from(items).indexOf(entry.target);
              dots.forEach((d, di) => {
                d.classList.toggle('active', di === index);
                d.setAttribute('aria-selected', di === index ? 'true' : 'false');
              });
            }
          });
        },
        {
          root: grid,
          threshold: 0.5,
        }
      );

      items.forEach((item) => observer.observe(item));
    });
  }

  /* ── Inicialización ── */
  function init() {
    initNavbar();
    initMobileMenu();
    initScrollReveal();
    initSmoothScroll();
    initCarousels();
    initBentoDots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
