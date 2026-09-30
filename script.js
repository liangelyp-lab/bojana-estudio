(() => {
  const header = document.querySelector('.site-header');
  if (header) {
    let compact = false;
    let framePending = false;
    const updateHeader = () => {
      if (window.scrollY > 80) compact = true;
      else if (window.scrollY < 24) compact = false;
      header.classList.toggle('is-compact', compact);
      framePending = false;
    };
    const scheduleHeaderUpdate = () => {
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(updateHeader);
      }
    };
    window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
    window.addEventListener('pageshow', updateHeader);
    updateHeader();
  }

  document.querySelectorAll('.brand').forEach((brand) => {
    const logo = brand.querySelector('img');
    if (!logo) return;
    logo.addEventListener('error', () => brand.classList.add('logo-error'));
    if (logo.complete && logo.naturalWidth === 0) brand.classList.add('logo-error');
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  if (toggle && nav) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      nav.classList.remove('open');
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', expanded ? 'Abrir menú' : 'Cerrar menú');
      nav.classList.toggle('open', !expanded);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  if (nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    let pendingSection = null;
    let pendingTimer = null;
    let navFramePending = false;
    const setActive = (id) => {
      links.forEach((link) => {
        const active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const updateNavigation = () => {
      navFramePending = false;
      const marker = (header ? header.getBoundingClientRect().bottom : 0) + 64;
      const atBottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (pendingSection) {
        const top = pendingSection.getBoundingClientRect().top;
        if ((top >= -16 && top <= marker) || (atBottom && pendingSection === sections.at(-1))) {
          pendingSection = null;
          clearTimeout(pendingTimer);
        } else return;
      }
      let current = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) current = section.id;
      }
      if (atBottom) current = sections.at(-1)?.id;
      setActive(current);
    };
    const scheduleNavigation = () => {
      if (!navFramePending) {
        navFramePending = true;
        requestAnimationFrame(updateNavigation);
      }
    };
    links.forEach((link) => link.addEventListener('click', () => {
      pendingSection = document.querySelector(link.getAttribute('href'));
      setActive(pendingSection?.id);
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => { pendingSection = null; updateNavigation(); }, 1500);
    }));
    const cancelPending = () => {
      pendingSection = null;
      clearTimeout(pendingTimer);
      scheduleNavigation();
    };
    window.addEventListener('scroll', scheduleNavigation, { passive: true });
    window.addEventListener('resize', scheduleNavigation);
    window.addEventListener('pageshow', scheduleNavigation);
    window.addEventListener('wheel', cancelPending, { passive: true });
    window.addEventListener('touchstart', cancelPending, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelPending();
    });
    updateNavigation();
  }

  const contactVideo = document.querySelector('.contact-video');
  const contactSection = document.querySelector('#contacto');
  if (contactVideo && contactSection) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let contactInView = false;
    contactVideo.muted = true;
    const updateContactVideo = () => {
      if (!contactInView || document.hidden || reducedMotion.matches) {
        contactVideo.pause();
        return;
      }
      const source = contactVideo.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
        contactVideo.load();
      }
      contactVideo.play().catch(() => {});
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        contactInView = entry.isIntersecting;
        updateContactVideo();
      }, { rootMargin: '160px' });
      observer.observe(contactSection);
    } else {
      contactInView = true;
      updateContactVideo();
    }
    contactVideo.addEventListener('canplay', updateContactVideo);
    reducedMotion.addEventListener('change', updateContactVideo);
    document.addEventListener('visibilitychange', updateContactVideo);
  }

  const contactToggle = document.querySelector('#contact-toggle');
  const contactPanel = document.querySelector('#contact-form-panel');
  const inquiryForm = document.querySelector('#inquiry-form');
  if (contactToggle && contactPanel && inquiryForm) {
    contactToggle.addEventListener('click', () => {
      contactPanel.hidden = false;
      contactToggle.setAttribute('aria-expanded', 'true');
      contactToggle.hidden = true;
      document.querySelector('#inquiry-name').focus({ preventScroll: true });
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      contactPanel.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    });

    const submitButton = document.querySelector('#inquiry-submit');
    const status = document.querySelector('#inquiry-status');
    inquiryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitButton.disabled || !inquiryForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(inquiryForm));
      values.name = values.name.trim();
      values.email = values.email.trim();
      values.message = values.message.trim();
      if (!values.name || values.message.length < 10) {
        status.textContent = 'Escribe tu nombre y una consulta de al menos 10 caracteres.';
        status.dataset.state = 'error';
        return;
      }
      if (values._honey) return;
      values._replyto = values.email;
      values._url = window.location.href.split('#')[0];
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando…';
      inquiryForm.setAttribute('aria-busy', 'true');
      status.textContent = '';
      delete status.dataset.state;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch('https://formsubmit.co/ajax/info@bojana.com.ar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(values),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || ![true, 'true'].includes(result.success)) throw new Error('Submission not accepted');
        status.textContent = 'Gracias. Tu consulta fue enviada.';
        status.dataset.state = 'success';
        inquiryForm.reset();
      } catch {
        status.textContent = 'No pudimos enviar tu consulta. Intenta nuevamente o escribe a info@bojana.com.ar.';
        status.dataset.state = 'error';
      } finally {
        clearTimeout(timeout);
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar consulta';
        inquiryForm.removeAttribute('aria-busy');
      }
    });
  }

  const projectTrack = document.querySelector('.project-scroll');
  const projectCard = projectTrack?.querySelector('.project-card');
  const galleryStage = projectTrack?.querySelector('.gallery-stage');
  const frames = [...document.querySelectorAll('.gallery-frame')];
  const captions = [...document.querySelectorAll('.gallery-option')];
  if (projectTrack && projectCard && galleryStage && frames.length) {
    let currentFrame = -1;
    let galleryFramePending = false;
    let stickyTop = 84;
    let scrollDistance = 1;
    const studioSection = document.querySelector('#estudio');
    let finalFrameShownAt = 0;
    let transitionFrame = 0;
    let transitioningToStudio = false;
    const cancelStudioTransition = () => {
      cancelAnimationFrame(transitionFrame);
      transitionFrame = 0;
      transitioningToStudio = false;
    };
    const canAdvanceToStudio = () => {
      if (!studioSection || currentFrame !== frames.length - 1 || performance.now() - finalFrameShownAt < 350) return false;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      return projectTrack.getBoundingClientRect().top <= stickyTop
        && projectCard.getBoundingClientRect().bottom > headerBottom
        && studioSection.getBoundingClientRect().top > headerBottom + 2;
    };
    const advanceToStudio = () => {
      const startY = window.scrollY;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const studioTop = startY + studioSection.getBoundingClientRect().top;
      // Keep enough scroll room for the section to reach the header on tall screens.
      const missingRoom = window.innerHeight - headerBottom + 24 - (document.documentElement.scrollHeight - studioTop);
      if (missingRoom > 0) studioSection.style.minHeight = studioSection.offsetHeight + missingRoom + 'px';
      const targetY = Math.max(0, Math.min(
        studioTop - headerBottom,
        document.documentElement.scrollHeight - window.innerHeight
      ));
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: targetY, behavior: 'instant' });
        return;
      }
      transitioningToStudio = true;
      const startedAt = performance.now();
      const slide = (now) => {
        const progress = Math.min(1, (now - startedAt) / 850);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({ top: startY + (targetY - startY) * eased, behavior: 'instant' });
        if (progress < 1) transitionFrame = requestAnimationFrame(slide);
        else cancelStudioTransition();
      };
      transitionFrame = requestAnimationFrame(slide);
    };
    if (studioSection) {
      let lastWheelAt = -Infinity;
      window.addEventListener('wheel', (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        const now = performance.now();
        const newGesture = now - lastWheelAt > 180;
        lastWheelAt = now;
        if (event.deltaY < 0) {
          cancelStudioTransition();
          return;
        }
        if (transitioningToStudio) event.preventDefault();
        else if (newGesture && canAdvanceToStudio()) {
          event.preventDefault();
          advanceToStudio();
        }
      }, { passive: false });

      let touchStartY = null;
      let touchCanAdvance = false;
      window.addEventListener('touchstart', (event) => {
        cancelStudioTransition();
        touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
        touchCanAdvance = touchStartY !== null && canAdvanceToStudio();
      }, { passive: true });
      window.addEventListener('touchmove', (event) => {
        if (event.defaultPrevented || touchStartY === null || event.touches.length !== 1) return;
        const distance = touchStartY - event.touches[0].clientY;
        if (distance < -12) {
          touchCanAdvance = false;
          cancelStudioTransition();
        } else if (event.cancelable && distance > 24 && (transitioningToStudio || touchCanAdvance)) {
          event.preventDefault();
          if (!transitioningToStudio) advanceToStudio();
          touchCanAdvance = false;
        }
      }, { passive: false });
      window.addEventListener('touchend', () => { touchStartY = null; touchCanAdvance = false; }, { passive: true });
      window.addEventListener('touchcancel', () => { touchStartY = null; touchCanAdvance = false; }, { passive: true });

      window.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, button, [contenteditable]')) return;
        if (['ArrowUp', 'PageUp', 'Home', 'End', 'Escape'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
          cancelStudioTransition();
          return;
        }
        if (!['ArrowDown', 'PageDown', ' '].includes(event.key)) return;
        if (transitioningToStudio) event.preventDefault();
        else if (!event.repeat && canAdvanceToStudio()) {
          event.preventDefault();
          advanceToStudio();
        }
      });
      document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', cancelStudioTransition));
      window.addEventListener('resize', cancelStudioTransition);
      window.addEventListener('pagehide', cancelStudioTransition);
    }
    const updateGallery = () => {
      galleryFramePending = false;
      const progress = Math.max(0, Math.min(1, (stickyTop - projectTrack.getBoundingClientRect().top) / scrollDistance));
      const index = Math.min(frames.length - 1, Math.floor(progress * frames.length));
      if (index === currentFrame) return;
      currentFrame = index;
      if (index === frames.length - 1) finalFrameShownAt = performance.now();
      frames.forEach((frame, i) => {
        frame.classList.toggle('active', i === index);
        frame.setAttribute('aria-hidden', String(i !== index));
      });
      captions.forEach((caption, i) => {
        caption.classList.toggle('active', i === index);
        if (i === index) caption.setAttribute('aria-current', 'step');
        else caption.removeAttribute('aria-current');
      });
    };
    const scheduleGalleryUpdate = () => {
      if (!galleryFramePending) {
        galleryFramePending = true;
        requestAnimationFrame(updateGallery);
      }
    };
    const measureGallery = () => {
      cancelStudioTransition();
      studioSection?.style.removeProperty('min-height');
      stickyTop = parseFloat(getComputedStyle(projectTrack).getPropertyValue('--project-sticky-top')) || 84;
      projectTrack.style.removeProperty('--gallery-max-height');
      const availableHeight = window.innerHeight - stickyTop - 16;
      const overflow = projectCard.offsetHeight - availableHeight;
      if (overflow > 0) {
        projectTrack.style.setProperty('--gallery-max-height', Math.max(120, galleryStage.offsetHeight - overflow) + 'px');
      }
      scrollDistance = Math.max(240, window.innerHeight * .5) * (frames.length - 1);
      projectTrack.style.minHeight = projectCard.offsetHeight + scrollDistance + 'px';
      projectTrack.classList.add('is-scroll-ready');
      updateGallery();
    };
    window.addEventListener('scroll', scheduleGalleryUpdate, { passive: true });
    window.addEventListener('resize', measureGallery);
    window.addEventListener('pageshow', measureGallery);
    document.fonts?.ready.then(measureGallery);
    measureGallery();
  }
})();
