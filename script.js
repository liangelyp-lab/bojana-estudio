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
        inquiryForm.querySelector('[name="_captcha"]')?.remove();
        let replyTo = inquiryForm.querySelector('[name="_replyto"]');
        if (!replyTo) {
          replyTo = document.createElement('input');
          replyTo.type = 'hidden';
          replyTo.name = '_replyto';
          inquiryForm.appendChild(replyTo);
        }
        replyTo.value = values.email;
        let next = inquiryForm.querySelector('[name="_next"]');
        if (!next) {
          next = document.createElement('input');
          next.type = 'hidden';
          next.name = '_next';
          inquiryForm.appendChild(next);
        }
        next.value = 'https://bojana.com.ar/#contacto';
        inquiryForm.submit();
        return;
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
  const studioSection = document.querySelector('#estudio');
  if (projectTrack && projectCard && galleryStage && frames.length) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentFrame = -1;
    let stickyTop = 84;
    let stepDistance = 1;
    let motion = null;
    let animationFrame = 0;
    let updatePending = false;
    let readyAt = 0;
    let lastWheelAt = -Infinity;
    let wheelConsumed = false;
    let wheelAmount = 0;
    let wheelDirection = 0;
    let touchY = null;
    let touchX = null;
    let touchConsumed = false;
    let measuredWidth = 0;
    let measuredHeight = 0;
    let resizeTimer;

    // The scroll anchors preserve native scrollbar/navigation behavior. Input
    // gestures advance one anchor, regardless of trackpad momentum or swipe size.
    const trackStart = () => window.scrollY + projectTrack.getBoundingClientRect().top - stickyTop;
    const trackEnd = () => trackStart() + stepDistance * (frames.length - 1);
    const setFrame = (index) => {
      if (index === currentFrame) return;
      currentFrame = index;
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
    frames.forEach((frame) => {
      frame.style.transition = 'opacity 650ms cubic-bezier(.22, 1, .36, 1)';
    });
    const updateGallery = () => {
      updatePending = false;
      if (motion) return;
      const distance = window.scrollY - trackStart();
      setFrame(Math.max(0, Math.min(frames.length - 1,
        Math.floor((distance + stepDistance * .18) / stepDistance))));
    };
    const scheduleUpdate = () => {
      if (!updatePending) {
        updatePending = true;
        requestAnimationFrame(updateGallery);
      }
    };
    const stopMotion = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      motion = null;
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
    let previousScrollBehavior = document.documentElement.style.scrollBehavior;
    const studioTarget = () => {
      const headerBottom = header?.getBoundingClientRect().bottom || 0;
      return window.scrollY + studioSection.getBoundingClientRect().top - headerBottom;
    };
    const moveTo = (getTarget, duration) => {
      const startY = window.scrollY;
      const startedAt = performance.now();
      previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      motion = { getTarget };
      readyAt = startedAt + (reducedMotion.matches ? 250 : duration + 260);
      const slide = (now) => {
        if (!motion) return;
        const targetY = Math.max(0, Math.min(getTarget(), document.documentElement.scrollHeight - window.innerHeight));
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - startedAt) / duration);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({ top: startY + (targetY - startY) * eased, behavior: 'instant' });
        if (progress < 1) animationFrame = requestAnimationFrame(slide);
        else {
          // Resolve the target again at completion (header/layout can settle).
          window.scrollTo({ top: Math.max(0, Math.min(getTarget(), document.documentElement.scrollHeight - window.innerHeight)), behavior: 'instant' });
          stopMotion();
          updateGallery();
        }
      };
      animationFrame = requestAnimationFrame(slide);
    };
    const inGallery = (direction, amount = 0) => {
      const start = trackStart();
      const end = trackEnd();
      const y = window.scrollY;
      if (y >= start - 3 && y <= end + 3) return true;
      // Catch an incoming gesture before a large delta can skip the gallery.
      return (direction > 0 && y < start && y + amount >= start)
        || (direction < 0 && y > end && y - amount <= end);
    };
    const advance = (direction) => {
      if (motion || performance.now() < readyAt) return;
      const start = trackStart();
      if (window.scrollY < start - 3) {
        setFrame(0);
        moveTo(trackStart, 650);
      } else if (direction < 0 && window.scrollY > trackEnd() + 3) {
        setFrame(frames.length - 1);
        moveTo(trackEnd, 650);
      } else if (direction > 0 && currentFrame === frames.length - 1 && studioSection) {
        // Ensure tall viewports still allow the section to reach the header.
        const top = window.scrollY + studioSection.getBoundingClientRect().top;
        const headerBottom = header?.getBoundingClientRect().bottom || 0;
        const missing = window.innerHeight - headerBottom + 24 - (document.documentElement.scrollHeight - top);
        if (missing > 0) studioSection.style.minHeight = studioSection.offsetHeight + missing + 'px';
        moveTo(studioTarget, 1000);
      } else {
        const index = Math.max(0, Math.min(frames.length - 1, currentFrame + direction));
        if (index === currentFrame) return;
        setFrame(index);
        moveTo(() => trackStart() + index * stepDistance, 650);
      }
    };
    window.addEventListener('wheel', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const now = performance.now();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const direction = Math.sign(delta);
      if (now - lastWheelAt > 220) {
        wheelConsumed = false;
        wheelAmount = 0;
        wheelDirection = direction;
      }
      lastWheelAt = now;
      const captured = motion || wheelConsumed || inGallery(direction, Math.abs(delta));
      // At the first image scrolling upward leaves the gallery naturally.
      if (!captured || (!motion && !wheelConsumed && direction < 0 && currentFrame === 0)) return;
      event.preventDefault();
      if (motion || now < readyAt || wheelConsumed) {
        wheelConsumed = true;
        return;
      }
      if (wheelDirection !== direction) wheelAmount = 0;
      wheelDirection = direction;
      wheelAmount += Math.abs(delta);
      if (wheelAmount < 60) return;
      wheelConsumed = true;
      advance(direction);
    }, { passive: false });

    window.addEventListener('touchstart', (event) => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
      touchConsumed = false;
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
      if (event.defaultPrevented || touchY === null || event.touches.length !== 1) return;
      const distance = touchY - event.touches[0].clientY;
      const horizontal = touchX - event.touches[0].clientX;
      if (Math.abs(distance) <= Math.abs(horizontal)) return;
      const direction = Math.sign(distance);
      const captured = motion || touchConsumed || inGallery(direction, Math.abs(distance));
      if (!captured || (!motion && !touchConsumed && direction < 0 && currentFrame === 0)) return;
      if (!event.cancelable) return;
      event.preventDefault();
      if (motion || performance.now() < readyAt) {
        touchConsumed = true;
        return;
      }
      if (!touchConsumed && Math.abs(distance) >= 42) {
        touchConsumed = true;
        advance(direction);
      }
    }, { passive: false });
    const endTouch = () => { touchY = null; touchX = null; };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });

    window.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, button, [contenteditable]')) return;
      if (['Escape', 'Home', 'End'].includes(event.key)) { stopMotion(); return; }
      const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey ? 1
        : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0;
      if (!direction || (!motion && !inGallery(direction))) return;
      if (!motion && direction < 0 && currentFrame === 0) return;
      event.preventDefault();
      if (!event.repeat) advance(direction);
    });
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
      stopMotion(); readyAt = 0; wheelConsumed = false;
    }));

    const measureGallery = () => {
      // Mobile browser chrome changes height while scrolling; keep a running
      // transition intact and only rebuild geometry after the viewport settles.
      if (motion) { resizeTimer = setTimeout(measureGallery, 160); return; }
      measuredWidth = window.innerWidth;
      measuredHeight = window.innerHeight;
      studioSection?.style.removeProperty('min-height');
      stickyTop = Math.max(parseFloat(getComputedStyle(projectTrack).getPropertyValue('--project-sticky-top')) || 84,
        (header?.getBoundingClientRect().bottom || 0) + 16);
      projectTrack.style.setProperty('--project-sticky-top', stickyTop + 'px');
      projectTrack.style.removeProperty('--gallery-max-height');
      const overflow = projectCard.offsetHeight - (window.innerHeight - stickyTop - 16);
      if (overflow > 0) projectTrack.style.setProperty('--gallery-max-height', Math.max(120, galleryStage.offsetHeight - overflow) + 'px');
      stepDistance = Math.max(420, window.innerHeight * .85);
      projectTrack.style.minHeight = projectCard.offsetHeight + stepDistance * (frames.length - 1) + Math.max(80, window.innerHeight * .15) + 'px';
      projectTrack.classList.add('is-scroll-ready');
      updateGallery();
    };
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', () => {
      if (window.innerWidth === measuredWidth && Math.abs(window.innerHeight - measuredHeight) < 120) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureGallery, 200);
    });
    window.addEventListener('pageshow', measureGallery);
    window.addEventListener('pagehide', stopMotion);
    document.fonts?.ready.then(measureGallery);
    measureGallery();
  }
})();
