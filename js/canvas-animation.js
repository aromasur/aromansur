/* ============================================================
   AromaNSur -- Canvas Particle Animation
   Efecto de particulas formando el texto "AromaNSur"
   Archivo 100% independiente: no modifica CSS ni DOM externo.
   ============================================================ */

(function () {
  'use strict';

  /* -- Coleccion de paletas de color con variedad visual -- */
  const PALETTES = [
    ['#4ecdc4', '#6ee7b7', '#a3e635', '#facc15', '#fb923c', '#f97316', '#ef4444', '#e879a8', '#c084fc', '#818cf8'],
    ['#ff4e50', '#f9d423', '#ff758c', '#ff7eb3', '#f06595', '#fb923c', '#f97316'],
    ['#00f2fe', '#4facfe', '#00c6ff', '#0072ff', '#43e97b', '#38f9d7', '#a8ff78'],
    ['#b8c6db', '#f5f7fa', '#e0c3fc', '#8ec5fc', '#80d0c7', '#fbc2eb', '#a1c4fd'],
    ['#f83600', '#fe8c00', '#f9d423', '#2af598', '#009efd', '#b122e5']
  ];

  /* -- Configuracion -- */
  const CONFIG = {
    text: 'AromaNSur',
    fontSizeBase: 200,
    particleCount: 3500,
    particleMinSize: 1.5,
    particleMaxSize: 5,
    mouseRadius: 120,
    mouseForce: 3,
    returnSpeed: 0.02,
    friction: 0.92,
    colors: [],
    bgColor: '#0a0a0f',
    gridLineColor: 'rgba(255, 255, 255, 0.04)',
    gridDotColor: 'rgba(200, 180, 220, 0.5)',
    gridDotSize: 2.5,
    colorTransitionSpeed: 0.0008,
  };

  /* -- Estado -- */
  let canvas, ctx, offCanvas, offCtx;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let scrollProgress = 0;
  let animFrameId;
  let textPixels = [];
  let canvasWidth, canvasHeight;
  let colorPhase = 0;
  let isInitialized = false;
  let entryAnimationType = 0;

  /* -- Seleccionar y mezclar paleta de colores aleatoria -- */
  function selectRandomPalette() {
    // Escoger una paleta al azar
    const selectedPaletteIndex = Math.floor(Math.random() * PALETTES.length);
    const chosenPalette = [...PALETTES[selectedPaletteIndex]];

    // Mezclar el orden de los colores dentro de la paleta seleccionada
    for (let i = chosenPalette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = chosenPalette[i];
      chosenPalette[i] = chosenPalette[j];
      chosenPalette[j] = temp;
    }

    CONFIG.colors = chosenPalette;

    // Establecer un punto de inicio aleatorio para la fase del ciclo cromatico
    colorPhase = Math.random() * CONFIG.colors.length;
  }

  /* -- Inicializacion -- */
  async function init() {
    canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    offCanvas = document.createElement('canvas');
    offCtx = offCanvas.getContext('2d');

    // Seleccionar la paleta de colores para esta sesion
    selectRandomPalette();

    // Esperar a que las fuentes tipograficas esten cargadas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Seleccionar animacion de entrada aleatoria (0, 1, o 2)
    entryAnimationType = Math.floor(Math.random() * 3);

    resize();
    generateTextPixels();
    createParticles();
    bindEvents();
    isInitialized = true;
    animate();
  }

  function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  /* -- Generar pixeles del texto -- */
  function generateTextPixels() {
    const fontSize = Math.min(CONFIG.fontSizeBase, canvasWidth * 0.14);
    offCanvas.width = canvasWidth;
    offCanvas.height = canvasHeight;

    offCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    offCtx.fillStyle = '#ffffff';
    offCtx.font = `bold ${fontSize}px 'Playfair Display', serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(CONFIG.text, canvasWidth / 2, canvasHeight / 2);

    const imageData = offCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    textPixels = [];

    // Muestreo mas fino (gap 3) para mejor relleno de letras como la N
    const gap = 3;
    for (let y = 0; y < canvasHeight; y += gap) {
      for (let x = 0; x < canvasWidth; x += gap) {
        const index = (y * canvasWidth + x) * 4;
        if (data[index + 3] > 100) {
          textPixels.push({ x, y });
        }
      }
    }

    // Mezclar las coordenadas aleatoriamente para evitar el corte vertical del barrido
    for (let i = textPixels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = textPixels[i];
      textPixels[i] = textPixels[j];
      textPixels[j] = temp;
    }
  }

  /* -- Crear particulas con animacion de entrada variable -- */
  function createParticles() {
    particles = [];
    const count = Math.min(CONFIG.particleCount, textPixels.length);
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    for (let i = 0; i < count; i++) {
      const target = textPixels[i % textPixels.length];
      let startX, startY;

      switch (entryAnimationType) {
        case 0:
          // Animacion 1: Dispersion aleatoria desde cualquier posicion
          startX = Math.random() * canvasWidth;
          startY = Math.random() * canvasHeight;
          break;
        case 1:
          // Animacion 2: Caida desde arriba (lluvia de particulas)
          startX = target.x + (Math.random() - 0.5) * 200;
          startY = -Math.random() * canvasHeight;
          break;
        case 2:
          // Animacion 3: Expansion desde el centro (big bang inverso)
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * Math.max(canvasWidth, canvasHeight) * 0.8;
          startX = cx + Math.cos(angle) * dist;
          startY = cy + Math.sin(angle) * dist;
          break;
      }

      particles.push({
        x: startX,
        y: startY,
        targetX: target.x,
        targetY: target.y,
        vx: 0,
        vy: 0,
        size: CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize),
        colorIndex: Math.floor(Math.random() * CONFIG.colors.length),
        colorProgress: 0,
        alpha: 0.6 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /* -- Eventos -- */
  function bindEvents() {
    window.addEventListener('resize', () => {
      resize();
      generateTextPixels();
      // Reasignar targets
      particles.forEach((p, i) => {
        const target = textPixels[i % textPixels.length];
        p.targetX = target.x;
        p.targetY = target.y;
      });
    });

    canvas.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener('scroll', () => {
      const heroHeight = window.innerHeight;
      scrollProgress = Math.min(window.scrollY / heroHeight, 1);
    }, { passive: true });
  }

  /* -- Dibujar fondo con cuadricula -- */
  function drawBackground() {
    ctx.fillStyle = CONFIG.bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Lineas de cuadricula punteadas (como en las imagenes de referencia)
    const gridSpacing = 60;
    ctx.strokeStyle = CONFIG.gridLineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);

    // Lineas verticales
    for (let x = gridSpacing; x < canvasWidth; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Lineas horizontales
    for (let y = gridSpacing; y < canvasHeight; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Puntos en las intersecciones
    ctx.fillStyle = CONFIG.gridDotColor;
    for (let x = gridSpacing; x < canvasWidth; x += gridSpacing) {
      for (let y = gridSpacing; y < canvasHeight; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, CONFIG.gridDotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* -- Interpolacion de color para transicion gradual -- */
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getParticleColor(particle) {
    const idx = (particle.colorIndex + Math.floor(colorPhase)) % CONFIG.colors.length;
    const nextIdx = (idx + 1) % CONFIG.colors.length;
    const t = colorPhase % 1;
    return lerpColor(CONFIG.colors[idx], CONFIG.colors[nextIdx], t);
  }

  /* -- Animar -- */
  function animate() {
    if (!isInitialized) return;

    colorPhase += CONFIG.colorTransitionSpeed;
    drawBackground();

    // Opacidad global del canvas basada en scroll
    const canvasOpacity = 1 - scrollProgress;
    canvas.style.opacity = canvasOpacity;

    if (scrollProgress >= 1) {
      canvas.style.pointerEvents = 'none';
    } else {
      canvas.style.pointerEvents = 'auto';
    }

    // Actualizar y dibujar particulas
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Dispersion por scroll
      const disperseX = (Math.random() - 0.5) * scrollProgress * canvasWidth * 2;
      const disperseY = (Math.random() - 0.5) * scrollProgress * canvasHeight * 2;
      const effectiveTargetX = p.targetX + disperseX * scrollProgress;
      const effectiveTargetY = p.targetY + disperseY * scrollProgress;

      // Atraccion hacia el target
      const dx = effectiveTargetX - p.x;
      const dy = effectiveTargetY - p.y;
      p.vx += dx * CONFIG.returnSpeed;
      p.vy += dy * CONFIG.returnSpeed;

      // Repulsion del mouse (mas suave y mas lenta)
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const dist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (dist < CONFIG.mouseRadius) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
        p.vx += (mdx / dist) * force * CONFIG.mouseForce;
        p.vy += (mdy / dist) * force * CONFIG.mouseForce;
      }

      // Aplicar friccion
      p.vx *= CONFIG.friction;
      p.vy *= CONFIG.friction;

      // Mover
      p.x += p.vx;
      p.y += p.vy;

      // Pulsacion sutil
      const pulseFactor = 1 + Math.sin(p.phase + colorPhase * 10) * 0.15;
      const size = p.size * pulseFactor;

      // Dibujar
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = getParticleColor(p);
      ctx.globalAlpha = p.alpha * (1 - scrollProgress * 0.5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    animFrameId = requestAnimationFrame(animate);
  }

  /* -- Arrancar cuando el DOM este listo -- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* -- Cleanup -- */
  window.addEventListener('beforeunload', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
  });

})();