/* =============================================
   PORTFOLIO SCRIPT — Inspired by Active Theory
    Includes: WebGL Particles, GSAP,
   Loader, Scroll Reveals, Counter, Skill Bars
   ============================================= */

'use strict';

/* =============================================
   1. LOADER
   ============================================= */
const loader      = document.getElementById('loader');
const loaderText  = document.getElementById('loader-text');
let loadCount = 0;

const loadInterval = setInterval(() => {
  loadCount += Math.floor(Math.random() * 12) + 4;
  if (loadCount >= 100) {
    loadCount = 100;
    clearInterval(loadInterval);
    setTimeout(() => {
      loader.classList.add('done');
      startAnimations();
    }, 300);
  }
  loaderText.textContent = loadCount + '%';
}, 60);

/* =============================================
   2. WEBGL PARTICLE BACKGROUND
   ============================================= */
const canvas = document.getElementById('bg-canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (gl) {
  let WIDTH, HEIGHT, animId;
  const PARTICLE_COUNT = 180;

  /* --- Shaders --- */
  const vsSrc = `
    attribute vec2 a_pos;
    attribute float a_size;
    attribute float a_alpha;
    uniform vec2 u_res;
    uniform vec2 u_mouse;
    varying float v_alpha;
    void main(){
      vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
      clip.y *= -1.0;
      vec2 diff = a_pos - u_mouse;
      float dist = length(diff);
      float push = smoothstep(120.0, 0.0, dist);
      vec2 pushed = clip + normalize(diff) * push * 0.04;
      gl_Position = vec4(pushed, 0.0, 1.0);
      gl_PointSize = a_size;
      v_alpha = a_alpha;
    }
  `;

  const fsSrc = `
    precision mediump float;
    varying float v_alpha;
    void main(){
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if(d > 0.5) discard;
      float soft = 1.0 - smoothstep(0.3, 0.5, d);
      gl_FragColor = vec4(0.67, 0.55, 0.98, v_alpha * soft);
    }
  `;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   vsSrc));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const aPos   = gl.getAttribLocation(prog, 'a_pos');
  const aSize  = gl.getAttribLocation(prog, 'a_size');
  const aAlpha = gl.getAttribLocation(prog, 'a_alpha');

  /* --- Particle state --- */
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.4 + 0.1,
    phase: Math.random() * Math.PI * 2,
  }));

  const posData   = new Float32Array(PARTICLE_COUNT * 2);
  const sizeData  = new Float32Array(PARTICLE_COUNT);
  const alphaData = new Float32Array(PARTICLE_COUNT);

  const posBuf   = gl.createBuffer();
  const sizeBuf  = gl.createBuffer();
  const alphaBuf = gl.createBuffer();

  let mouse = { x: -1000, y: -1000 };
  let t = 0;

  function resize() {
    WIDTH  = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width  = WIDTH;
    canvas.height = HEIGHT;
    gl.viewport(0, 0, WIDTH, HEIGHT);
    gl.uniform2f(uRes, WIDTH, HEIGHT);
  }

  function uploadBuf(buf, loc, data, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  function drawFrame() {
    t += 0.008;
    gl.clear(gl.COLOR_BUFFER_BIT);

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = WIDTH + 10;
      if (p.x > WIDTH + 10) p.x = -10;
      if (p.y < -10) p.y = HEIGHT + 10;
      if (p.y > HEIGHT + 10) p.y = -10;

      posData[i * 2]     = p.x;
      posData[i * 2 + 1] = p.y;
      sizeData[i]  = p.size * (1 + 0.3 * Math.sin(t + p.phase));
      alphaData[i] = p.alpha * (0.6 + 0.4 * Math.sin(t * 0.7 + p.phase));
    });

    gl.uniform2f(uMouse, mouse.x, mouse.y);
    uploadBuf(posBuf,   aPos,   posData,   2);
    uploadBuf(sizeBuf,  aSize,  sizeData,  1);
    uploadBuf(alphaBuf, aAlpha, alphaData, 1);

    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    animId = requestAnimationFrame(drawFrame);
  }

  function initWebGL() {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    drawFrame();
  }

  initWebGL();
}

/* =============================================
   4. NAV — Scrolled state & Mobile Menu
   ============================================= */
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const mobileMenu= document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => {
    navToggle.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* =============================================
   5. GSAP — Hero Entrance
   ============================================= */
function startAnimations() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* Hero reveal lines */
  gsap.to('.reveal-line', {
    y: 0,
    opacity: 1,
    duration: 1.2,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.2,
  });

  /* Hero sub & cta */
  gsap.to('.hero-sub, .hero-cta, .hero-tag', {
    y: 0,
    opacity: 1,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.08,
    delay: 0.6,
  });
}

/* =============================================
   6. SCROLL REVEAL — IntersectionObserver
   ============================================= */
const revealEls = document.querySelectorAll('.reveal-up');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* =============================================
   7. COUNTER ANIMATION
   ============================================= */
const counters = document.querySelectorAll('.stat-num');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current  = 0;
      const step   = Math.ceil(target / 40);
      const tick   = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(tick); }
        el.textContent = current;
      }, 40);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

/* =============================================
   8. SKILL BAR ANIMATION
   ============================================= */
const bars = document.querySelectorAll('.bar');

const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar = entry.target;
      const w   = bar.dataset.w + '%';
      bar.style.setProperty('--fill-width', w);
      bar.classList.add('animated');
      barObserver.unobserve(bar);
    }
  });
}, { threshold: 0.4 });

bars.forEach(b => barObserver.observe(b));

/* =============================================
   9. PROJECT MOCKUP — Mouse Parallax
   ============================================= */
document.querySelectorAll('.project-item').forEach(item => {
  const mockup = item.querySelector('.project-mockup');
  if (!mockup) return;

  item.addEventListener('mousemove', e => {
    const rect = item.getBoundingClientRect();
    const rx = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
    const ry = ((e.clientX - rect.left) / rect.width  - 0.5) * -14;
    mockup.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
  });

  item.addEventListener('mouseleave', () => {
    mockup.style.transform = 'rotateY(-6deg) rotateX(3deg) scale(1)';
  });
});

/* =============================================
   10. CONTACT FORM
   ============================================= */
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-submit');
    btn.querySelector('span').textContent = 'Sending...';
    btn.disabled = true;

    // Simulate send (replace with real fetch/emailjs/formspree)
    setTimeout(() => {
      contactForm.reset();
      btn.querySelector('span').textContent = 'Send Message';
      btn.disabled = false;
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    }, 1400);
  });
}

/* =============================================
   11. NAV — Active link highlight on scroll
   ============================================= */
const sections   = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 200) current = s.id;
  });
  navLinkEls.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current
      ? 'var(--white)' : '';
  });
}, { passive: true });

/* =============================================
   12. SMOOTH SCROLL for internal links
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* =============================================
   13. SECTION LABEL HORIZONTAL SLIDE
   ============================================= */
const labels = document.querySelectorAll('.section-label');
labels.forEach(label => {
  label.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  label.style.transform  = 'translateX(-20px)';
  label.style.opacity    = '0';
});

const labelObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateX(0)';
      labelObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

labels.forEach(l => labelObs.observe(l));

/* =============================================
   14. FOOTER — current year
   ============================================= */
const copyEl = document.querySelector('.footer-copy');
if (copyEl) {
  copyEl.textContent = copyEl.textContent.replace('2025', new Date().getFullYear());
}