/* ============================================================
   AromaNSur — Sparkle Effect
   Canvas-based sparkle particles on hover for preview images.
   Draws sparkles directly as 4-point stars — no sprite needed.
   ============================================================ */

(function () {
  'use strict';

  /* ── Draw a 4-point star (sparkle) ── */
  function drawStar(ctx, cx, cy, size, rotation, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();

    // 4-point star shape with rotation
    var outer = size;
    var inner = size * 0.3;
    for (var i = 0; i < 8; i++) {
      var r = (i % 2 === 0) ? outer : inner;
      var angle = (Math.PI / 4) * i - Math.PI / 2 + rotation;
      var x = cx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Bright center glow
    ctx.globalAlpha = Math.min(alpha * 1.2, 1);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ── SparkleEffect class ── */
  function SparkleEffect(el, opts) {
    this.el = el;
    this.count = opts.count || 30;
    this.colors = opts.colors || ['#ffffff'];
    this.speed = opts.speed || 1;
    this.overlap = opts.overlap || 0;

    this.particles = [];
    this.animId = null;
    this.fade = false;
    this.fadeCount = 0;
    this.running = false;

    this._init();
  }

  SparkleEffect.prototype._init = function () {
    var self = this;

    // Ensure positioned parent
    var pos = getComputedStyle(this.el).position;
    if (pos === 'static') {
      this.el.style.position = 'relative';
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText =
      'position:absolute;top:-' + this.overlap + 'px;left:-' + this.overlap +
      'px;pointer-events:none;z-index:20;';
    this.el.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Size canvas
    this._resize();

    // Create particles (all start invisible)
    this._createParticles();

    // Hover events
    this.el.addEventListener('mouseenter', function () { self._over(); });
    this.el.addEventListener('mouseleave', function () { self._out(); });
    this.el.addEventListener('touchstart', function () { self._over(); }, { passive: true });
    this.el.addEventListener('touchend', function () { self._out(); }, { passive: true });

    // Re-measure on window resize
    window.addEventListener('resize', function () { self._resize(); });
  };

  SparkleEffect.prototype._resize = function () {
    var w = this.el.offsetWidth;
    var h = this.el.offsetHeight;
    // If element has no size yet, try again soon
    if (w === 0 || h === 0) {
      var self = this;
      setTimeout(function () { self._resize(); }, 200);
      return;
    }
    this.canvas.width = w + this.overlap * 2;
    this.canvas.height = h + this.overlap * 2;
  };

  SparkleEffect.prototype._createParticles = function () {
    this.particles = [];
    var w = this.canvas.width || 220;
    var h = this.canvas.height || 220;

    for (var i = 0; i < this.count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        opacity: 0,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        twinklePhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI
      });
    }
  };

  SparkleEffect.prototype._draw = function () {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (p.opacity <= 0) continue;

      // Twinkle effect: modulate size and brightness
      var twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      var currentSize = p.size * (0.7 + twinkle * 0.3);
      var alpha = p.opacity * (0.6 + twinkle * 0.4);

      drawStar(ctx, p.x, p.y, currentSize, p.rotation, p.color, alpha);
    }
  };

  SparkleEffect.prototype._update = function () {
    var self = this;

    this.animId = requestAnimationFrame(function () {
      var w = self.canvas.width;
      var h = self.canvas.height;

      for (var i = 0; i < self.particles.length; i++) {
        var p = self.particles[i];

        // Move
        p.x += p.dx * self.speed;
        p.y += p.dy * self.speed;

        // Twinkle phase
        p.twinklePhase += p.twinkleSpeed;

        // Wrap edges
        if (p.x > w + 5) p.x = -5;
        else if (p.x < -5) p.x = w + 5;

        if (p.y > h + 5) {
          p.y = -5;
          p.x = Math.random() * w;
        } else if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }

        // Opacity
        if (self.fade) {
          p.opacity -= 0.015;
          if (p.opacity < 0) p.opacity = 0;
        } else {
          p.opacity -= 0.003;
          if (p.opacity <= 0) {
            p.opacity = 0.7 + Math.random() * 0.3;
            // Respawn at random position
            p.x = Math.random() * w;
            p.y = Math.random() * h;
            p.size = 3 + Math.random() * 5;
            p.rotation = Math.random() * Math.PI;
          }
        }
      }

      self._draw();

      if (self.fade) {
        self.fadeCount -= 1;
        if (self.fadeCount <= 0) {
          // Check if all particles faded
          var allGone = true;
          for (var j = 0; j < self.particles.length; j++) {
            if (self.particles[j].opacity > 0) { allGone = false; break; }
          }
          if (allGone) {
            cancelAnimationFrame(self.animId);
            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.running = false;
            return;
          }
        }
        self._update();
      } else {
        self._update();
      }
    });
  };

  SparkleEffect.prototype._over = function () {
    // Re-measure in case layout changed
    if (this.canvas.width === 0) this._resize();

    cancelAnimationFrame(this.animId);

    // Give all particles visible opacity
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].opacity = 0.6 + Math.random() * 0.4;
      this.particles[i].x = Math.random() * this.canvas.width;
      this.particles[i].y = Math.random() * this.canvas.height;
    }

    this.fade = false;
    this.running = true;
    this._update();
  };

  SparkleEffect.prototype._out = function () {
    this.fade = true;
    this.fadeCount = 120;
  };

  /* ── Initialise ── */
  function initSparkles() {
    var colors = ['#e8a87c', '#f0c4a0', '#ffffff', '#ffe4c9', '#c4784a'];

    // Only target the small preview images on the left
    var previews = document.querySelectorAll('.category__preview');
    for (var i = 0; i < previews.length; i++) {
      new SparkleEffect(previews[i], {
        count: 45,
        colors: colors,
        speed: 0.3,
        overlap: 8
      });
    }

    // Wallapop buy buttons in feature bars (green sparkles)
    var wallapopColors = ['#4ade80', '#86efac', '#ffffff', '#bbf7d0', '#22c55e'];
    var wallapopBtns = document.querySelectorAll('.feature-item--wallapop');
    for (var j = 0; j < wallapopBtns.length; j++) {
      new SparkleEffect(wallapopBtns[j], {
        count: 20,
        colors: wallapopColors,
        speed: 0.4,
        overlap: 4
      });
    }

    // Wallapop CTA button in contact section (accent sparkles)
    var ctaColors = ['#e8a87c', '#f0c4a0', '#ffffff', '#ffe4c9'];
    var ctaBtns = document.querySelectorAll('.sobremi-contact__cta');
    for (var k = 0; k < ctaBtns.length; k++) {
      new SparkleEffect(ctaBtns[k], {
        count: 25,
        colors: ctaColors,
        speed: 0.35,
        overlap: 6
      });
    }

    // Category pages CTA button (.cat-cta)
    var catCtas = document.querySelectorAll('.cat-cta');
    if (catCtas.length > 0) {
      var rootStyle = getComputedStyle(document.documentElement);
      var catAccent = rootStyle.getPropertyValue('--cat-accent').trim() || '#e8a87c';
      var catAccentLight = rootStyle.getPropertyValue('--cat-accent-light').trim() || '#f0c4a0';
      var catColors = [catAccent, catAccentLight, '#ffffff', '#ffffff'];
      for (var m = 0; m < catCtas.length; m++) {
        new SparkleEffect(catCtas[m], {
          count: 25,
          colors: catColors,
          speed: 0.35,
          overlap: 6
        });
      }
    }
  }

  // Wait for everything to be loaded and painted
  window.addEventListener('load', function () {
    // Extra frame to ensure layout is settled
    requestAnimationFrame(function () {
      requestAnimationFrame(initSparkles);
    });
  });

})();
