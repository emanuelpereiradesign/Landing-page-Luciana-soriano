/* ==========================================================================
   SCRIPTS - PÁGINA LUCIANA SORIANO | PSICÓLOGA CLÍNICA
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // CONFIGURAÇÃO DO WHATSAPP
  // Altere o número abaixo para o número oficial com DDD (ex: 5582999999999)
  const WHATSAPP_NUMBER = '5582999999999';
  const WHATSAPP_MSG = encodeURIComponent('Olá, Luciana! Vim pelo seu site e gostaria de agendar uma consulta.');
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

  // Atualiza todos os botões de CTA que apontam para o WhatsApp
  document.querySelectorAll('.js-whatsapp-link').forEach(btn => {
    btn.setAttribute('href', WHATSAPP_URL);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  // ==========================================================================
  // CARROSSEL DE APRESENTAÇÃO (DEPTH CAROUSEL)
  // ==========================================================================
  const carousel = document.getElementById('depthCarousel');
  const viewport = carousel?.querySelector('.depth-carousel-viewport');
  const cards = carousel ? Array.from(carousel.querySelectorAll('.depth-card')) : [];
  const counterEl = document.getElementById('depthCounter');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const dotsContainer = document.getElementById('sliderDots');

  if (carousel && viewport && cards.length > 0) {
    const n = cards.length;
    let target = 0;
    let current = 0;
    let dragging = false;
    let startX = 0;
    let startVal = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;
    let autoPlayInterval = null;

    function getCardWidth() {
      if (window.innerWidth <= 480) return 240;
      if (window.innerWidth <= 768) return 300;
      return 540;
    }
    let CARD_WIDTH = getCardWidth();
    const SIDE_SCALE = 0.65;
    const DEPTH = 140;
    const CURVE = 38;
    const MAX_BLUR = 4;

    function xFor(offset) {
      const s = Math.sign(offset);
      const a = Math.abs(offset);
      const first = CARD_WIDTH * 0.5 + 30;
      const step = CARD_WIDTH * SIDE_SCALE * 0.65;
      return a <= 1 ? offset * first : s * (first + (a - 1) * step);
    }

    function zFor(offset) {
      return -Math.min(Math.abs(offset), 4) * DEPTH;
    }

    function rotFor(offset) {
      return Math.max(-1, Math.min(1, offset)) * CURVE;
    }

    function scaleFor(offset) {
      return 1 - (1 - SIDE_SCALE) * Math.min(Math.abs(offset), 1);
    }

    function opacityFor(offset) {
      const a = Math.abs(offset);
      return 1 - Math.min(Math.max(a - 3, 0) / 1.3, 1);
    }

    function blurFor(offset) {
      return Math.min(Math.max(Math.abs(offset) - 0.35, 0) * 2.2, MAX_BLUR);
    }

    function applyTransforms() {
      cards.forEach((card, i) => {
        const offset = i - current;
        const x = xFor(offset);
        const z = zFor(offset);
        const rot = rotFor(offset);
        const scale = scaleFor(offset);
        const opacity = opacityFor(offset);
        const blur = blurFor(offset);
        const zIndex = Math.round(1000 - Math.abs(offset) * 10);

        card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.filter = `blur(${blur}px)`;
        card.style.zIndex = zIndex;
      });

      if (counterEl) {
        const active = Math.max(0, Math.min(n - 1, Math.round(current)));
        counterEl.textContent = `${String(active + 1).padStart(2, '0')} — ${String(n).padStart(2, '0')}`;
      }

      const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
      const activeIdx = Math.round(current);
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }

    function animate() {
      const diff = target - current;
      current += diff * 0.12;
      if (Math.abs(diff) < 0.001) current = target;
      applyTransforms();
      rafId = requestAnimationFrame(animate);
    }

    function snapTo(val) {
      target = Math.max(0, Math.min(n - 1, Math.round(val)));
    }

    function goTo(idx) {
      target = Math.max(0, Math.min(n - 1, idx));
      resetAutoPlay();
    }

    function nextSlide() { goTo(Math.round(target) + 1); }
    function prevSlide() { goTo(Math.round(target) - 1); }

    // Wheel
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 0.5) return;
      target = Math.max(0, Math.min(n - 1, target + d * 0.005));
      snapTimeout();
    }, { passive: false });

    // Drag
    let snapTimer;
    function snapTimeout() {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => snapTo(target), 160);
    }

    viewport.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = lastX = e.clientX;
      startVal = target;
      lastTime = performance.now();
      velocity = 0;
      viewport.setPointerCapture?.(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - startX;
      const perCard = Math.max(120, CARD_WIDTH * 0.5);
      target = Math.max(0, Math.min(n - 1, startVal - dx / perCard));
      const dt = now - lastTime;
      if (dt > 0) velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTime = now;
    });

    viewport.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      const perCard = Math.max(120, CARD_WIDTH * 0.5);
      const projected = target - velocity * 150 / perCard;
      snapTo(projected);
      resetAutoPlay();
    });

    // Touch swipe
    let touchStartX = 0;
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      pauseAutoPlay();
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      const dx = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(dx) > 40) {
        dx > 0 ? nextSlide() : prevSlide();
      }
      resetAutoPlay();
    }, { passive: true });

    // Arrows
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Dots
    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    // Auto-play
    function startAutoPlay() { autoPlayInterval = setInterval(nextSlide, 5000); }
    function pauseAutoPlay() { if (autoPlayInterval) clearInterval(autoPlayInterval); }
    function resetAutoPlay() { pauseAutoPlay(); startAutoPlay(); }

    carousel.addEventListener('mouseenter', pauseAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    // Resize
    window.addEventListener('resize', () => {
      CARD_WIDTH = getCardWidth();
      applyTransforms();
    });

    createDots();
    animate();
    startAutoPlay();
  }

  // ==========================================================================
  // MODAL DE POLÍTICA DE PRIVACIDADE
  // ==========================================================================
  const modal = document.getElementById('privacyModal');
  const openModalLinks = document.querySelectorAll('.js-open-privacy');
  const closeModalBtn = document.getElementById('closePrivacyModal');

  if (modal) {
    function openModal(e) {
      if (e) e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    openModalLinks.forEach(link => {
      link.addEventListener('click', openModal);
    });

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ==========================================================================
  // ROLAGEM SUAVE PARA LINKS INTERNOS
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
