const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const floaters = [...document.querySelectorAll('[data-depth]')];

if (hero && !reduceMotion) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    floaters.forEach((item) => {
      const depth = Number(item.dataset.depth || 1);
      item.style.translate = `${x * 16 * depth}px ${y * 12 * depth}px`;
    });
  });
  hero.addEventListener('pointerleave', () => {
    floaters.forEach((item) => { item.style.translate = '0 0'; });
  });
}

const orbitCards = [...document.querySelectorAll('.orbit-card')];
const introMessage = document.querySelector('.intro-message');
orbitCards.forEach((card) => {
  card.addEventListener('click', (event) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--click-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--click-y', `${event.clientY - bounds.top}px`);
    orbitCards.forEach((item) => item.classList.toggle('is-active', item === card));
    hero?.classList.remove('is-reacting');
    void hero?.offsetWidth;
    hero?.classList.add('is-reacting');

    if (introMessage) {
      introMessage.classList.add('is-changing');
      window.setTimeout(() => {
        introMessage.textContent = card.dataset.message || introMessage.textContent;
        introMessage.classList.remove('is-changing');
      }, 180);
    }

    window.setTimeout(() => {
      document.querySelector(card.dataset.target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      card.classList.remove('is-active');
      hero?.classList.remove('is-reacting');
    }, 620);
  });
});

let scrollFrame = 0;
const updateScrollEffects = () => {
  scrollFrame = 0;
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  document.documentElement.style.setProperty('--scroll-progress', `${progress * 100}%`);
  if (hero) {
    const heroProgress = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
    hero.style.setProperty('--hero-scroll', heroProgress.toFixed(3));
  }
};
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}, { passive: true });
updateScrollEffects();

const canvas = document.querySelector('#signal-field');
if (canvas && hero) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let points = [];
  let animationFrame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(24, Math.min(58, Math.floor(width / 24)));
    points = Array.from({ length: count }, (_, index) => ({
      x: (index * 137.5) % width,
      y: (index * 83.3) % height,
      vx: ((index % 5) - 2) * 0.045,
      vy: ((index % 7) - 3) * 0.028,
      r: index % 9 === 0 ? 1.6 : 1
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    });
    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        const dx = points[first].x - points[second].x;
        const dy = points[first].y - points[second].y;
        const distance = Math.hypot(dx, dy);
        if (distance < 145) {
          context.strokeStyle = `rgba(109,242,255,${(1 - distance / 145) * 0.18})`;
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(points[first].x, points[first].y);
          context.lineTo(points[second].x, points[second].y);
          context.stroke();
        }
      }
    }
    points.forEach((point) => {
      context.fillStyle = point.r > 1 ? 'rgba(255,106,61,.78)' : 'rgba(109,242,255,.55)';
      context.beginPath();
      context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      context.fill();
    });
    if (!reduceMotion) animationFrame = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(1100px) rotateX(${-y * 2.6}deg) rotateY(${x * 2.6}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

const revealTargets = document.querySelectorAll('.protocol-grid li, .case, .timeline article, .matrix > div');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((target, index) => {
    target.classList.add('reveal');
    target.style.setProperty('--delay', `${(index % 4) * 70}ms`);
    observer.observe(target);
  });
}

const sections = document.querySelectorAll('.protocol, .work, .experience, .toolkit, .contact');
if ('IntersectionObserver' in window && !reduceMotion) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('section-enter');
    });
  }, { threshold: 0.16 });
  sections.forEach((section) => sectionObserver.observe(section));
}
