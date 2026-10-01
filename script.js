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
    const contactTicker = document.querySelector('.marquee-wrap');
    const contactFooter = document.querySelector('.footer');
    let contactAnimation = 0;
    let contactScrollBehavior = null;
    const measureContact = () => {
      const headerHeight = header?.getBoundingClientRect().height || 0;
      contactSection.style.setProperty('--contact-header-height', headerHeight + 'px');
      contactSection.style.setProperty('--contact-ticker-height', (contactTicker?.getBoundingClientRect().height || 0) + 'px');
      contactSection.style.setProperty('--contact-footer-height', (contactFooter?.getBoundingClientRect().height || 0) + 'px');
    };
    const cancelContactScroll = () => {
      cancelAnimationFrame(contactAnimation);
      contactAnimation = 0;
      if (contactScrollBehavior !== null) {
        document.documentElement.style.scrollBehavior = contactScrollBehavior;
        contactScrollBehavior = null;
      }
    };
    const alignContact = (focusField) => {
      cancelContactScroll();
      // Start after the click's other listeners have closed the mobile menu
      // and released any in-progress gallery animation.
      contactAnimation = requestAnimationFrame(() => {
        const startY = window.scrollY;
        const startedAt = performance.now();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        contactScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        const slide = (now) => {
          measureContact();
          const headerBottom = header?.getBoundingClientRect().bottom || 0;
          const target = Math.max(0, Math.min(
            window.scrollY + (contactTicker || contactSection).getBoundingClientRect().top - headerBottom,
            document.documentElement.scrollHeight - window.innerHeight
          ));
          const progress = reduced ? 1 : Math.min(1, (now - startedAt) / 950);
          const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
          window.scrollTo({ top: startY + (target - startY) * eased, behavior: 'instant' });
          if (progress < 1) contactAnimation = requestAnimationFrame(slide);
          else {
            cancelContactScroll();
            if (focusField) document.querySelector('#inquiry-name')?.focus({ preventScroll: true });
          }
        };
        contactAnimation = requestAnimationFrame(slide);
      });
    };
    const openContact = (focusField = false) => {
      contactPanel.hidden = false;
      contactToggle.setAttribute('aria-expanded', 'true');
      contactToggle.hidden = true;
      contactSection.classList.add('is-form-open');
      measureContact();
      alignContact(focusField);
    };
    contactToggle.addEventListener('click', (event) => openContact(event.detail === 0));
    nav?.querySelectorAll('a[href="#contacto"]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      if (window.location.hash !== '#contacto') history.pushState(null, '', '#contacto');
      openContact(event.detail === 0);
    }));
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
      if (link.getAttribute('href') !== '#contacto') cancelContactScroll();
    }));
    // Scrolling into Contact never opens the form. Once opened, it remains
    // available when navigating away and returning, retaining any typed values.
    window.addEventListener('wheel', cancelContactScroll, { passive: true });
    window.addEventListener('touchstart', cancelContactScroll, { passive: true });
    window.addEventListener('pagehide', cancelContactScroll);
    window.addEventListener('resize', measureContact);
    if ('ResizeObserver' in window) {
      const contactLayoutObserver = new ResizeObserver(measureContact);
      [header, contactTicker, contactFooter].filter(Boolean).forEach((element) => contactLayoutObserver.observe(element));
    }
    measureContact();

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

  const projectSection = document.querySelector('#proyectos');
  const projectTrack = projectSection?.querySelector('.project-scroll');
  const projectCard = projectTrack?.querySelector('.project-card');
  const galleryStage = projectTrack?.querySelector('.gallery-stage');
  const rail = galleryStage?.querySelector('.gallery-rail');
  const slides = rail ? [...rail.querySelectorAll('.gallery-slide')] : [];
  const galleryLabel = galleryStage?.querySelector('.gallery-label');
  const studioSection = document.querySelector('#estudio');
  if (projectTrack && projectCard && galleryStage && rail && slides.length && galleryLabel) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stickyTop = 59;
    let travel = 0;
    let photoStarts = [];
    let captionIndex = 0;
    let target = 0;
    let rendered = 0;
    let photoFrame = 0;
    let previousPhotoTime = 0;
    let verticalFrame = 0;
    let movingToFollowing = false;
    let holdingEnd = false;
    let endReachedAt = 0;
    let lastWheelAt = -Infinity;
    let wheelSequence = 0;
    let heldWheelSequence = 0;
    let wheelAmount = 0;
    let touchSequence = 0;
    let heldTouchSequence = 0;
    let touchY = null;
    let touchX = null;
    let visitedFollowing = false;
    let skipGateUntil = 0;
    let scrollFrame = 0;
    let resizeFrame = 0;

    const trackStart = () => window.scrollY + projectTrack.getBoundingClientRect().top - stickyTop;
    const trackEnd = () => trackStart() + travel;
    const studioTarget = () => studioSection
      ? window.scrollY + studioSection.getBoundingClientRect().top - (header?.getBoundingClientRect().bottom || 0)
      : trackEnd() + projectCard.offsetHeight;
    const paintPhotos = () => {
      rail.style.transform = 'translate3d(' + (-rendered) + 'px,0,0)';
      let next = 0;
      for (let i = 1; i < photoStarts.length; i++) {
        if (rendered + .5 >= photoStarts[i]) next = i;
        else break;
      }
      if (next !== captionIndex) {
        captionIndex = next;
        galleryLabel.textContent = slides[next].dataset.caption;
      }
    };
    const animatePhotos = (now) => {
      const dt = previousPhotoTime ? Math.min(64, now - previousPhotoTime) : 16;
      previousPhotoTime = now;
      rendered += (target - rendered) * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 55));
      if (Math.abs(target - rendered) < .1) rendered = target;
      paintPhotos();
      if (rendered !== target) photoFrame = requestAnimationFrame(animatePhotos);
      else { photoFrame = 0; previousPhotoTime = 0; }
    };
    const updatePhotos = () => {
      target = Math.max(0, Math.min(travel, window.scrollY - trackStart()));
      if (!photoFrame) photoFrame = requestAnimationFrame(animatePhotos);
    };
    const leaveEndHold = () => { holdingEnd = false; wheelAmount = 0; };
    const parkAtEnd = () => {
      if (!holdingEnd) {
        holdingEnd = true;
        endReachedAt = performance.now();
        heldWheelSequence = wheelSequence;
        heldTouchSequence = touchSequence;
        wheelAmount = 0;
      }
      window.scrollTo({ top: trackEnd(), behavior: 'instant' });
      updatePhotos();
    };
    const readyToLeave = () => holdingEnd && rendered >= travel - .5
      && performance.now() - endReachedAt >= 180;
    const atExit = () => window.scrollY >= trackEnd() - .5 && window.scrollY < studioTarget() - 1;
    const stopVertical = () => {
      cancelAnimationFrame(verticalFrame);
      verticalFrame = 0;
      movingToFollowing = false;
    };
    const revealFollowing = () => {
      if (!studioSection || movingToFollowing || window.scrollY >= studioTarget() - 1) return;
      movingToFollowing = true;
      visitedFollowing = true;
      cancelAnimationFrame(photoFrame);
      photoFrame = 0;
      previousPhotoTime = 0;
      target = rendered = travel;
      paintPhotos();
      // Preserve the existing ability to align Studio below the header even
      // when the remaining page is shorter than a tall desktop viewport.
      const studioTop = window.scrollY + studioSection.getBoundingClientRect().top;
      const remaining = document.documentElement.scrollHeight - studioTop;
      const needed = window.innerHeight - (header?.getBoundingClientRect().bottom || 0) - remaining;
      if (needed > 0) studioSection.style.minHeight = studioSection.offsetHeight + needed + 'px';
      const from = window.scrollY;
      const started = performance.now();
      const slide = (now) => {
        const to = Math.max(0, Math.min(studioTarget(), document.documentElement.scrollHeight - window.innerHeight));
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 650);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
        if (progress < 1) verticalFrame = requestAnimationFrame(slide);
        else {
          window.scrollTo({ top: to, behavior: 'instant' });
          stopVertical();
        }
      };
      verticalFrame = requestAnimationFrame(slide);
    };
    const onScroll = () => {
      scrollFrame = 0;
      const y = window.scrollY;
      if (y < trackEnd() - .5) {
        leaveEndHold();
        visitedFollowing = false;
      } else if (!movingToFollowing && !visitedFollowing && performance.now() >= skipGateUntil
        && atExit() && (!holdingEnd || y > trackEnd() + .5)) parkAtEnd();
      updatePhotos();
    };
    const scheduleScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll);
    };
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('wheel', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey
        || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      skipGateUntil = 0;
      const now = performance.now();
      if (now - lastWheelAt > 160) { wheelSequence++; wheelAmount = 0; }
      lastWheelAt = now;
      if (movingToFollowing) {
        if (event.deltaY < 0) stopVertical();
        else event.preventDefault();
        return;
      }
      if (event.deltaY < 0) { leaveEndHold(); return; }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const y = window.scrollY;
      if (y >= trackStart() - 1 && y < trackEnd() - .5 && y + delta >= trackEnd()) {
        event.preventDefault();
        visitedFollowing = false;
        parkAtEnd();
        return;
      }
      if (atExit()) {
        event.preventDefault();
        if (!holdingEnd) { visitedFollowing = false; parkAtEnd(); return; }
        if (wheelSequence <= heldWheelSequence || !readyToLeave()) return;
        wheelAmount += delta;
        if (wheelAmount >= 32) { leaveEndHold(); revealFollowing(); }
      }
    }, { passive: false });
    window.addEventListener('touchstart', (event) => {
      skipGateUntil = 0;
      touchSequence++;
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
      if (event.defaultPrevented || touchY === null || event.touches.length !== 1) return;
      const down = touchY - event.touches[0].clientY;
      const across = touchX - event.touches[0].clientX;
      if (Math.abs(down) <= Math.abs(across)) return;
      if (down < -10) {
        if (movingToFollowing) stopVertical();
        leaveEndHold();
        return;
      }
      if (down > 20 && (movingToFollowing || atExit())) {
        if (!event.cancelable) return;
        event.preventDefault();
        if (movingToFollowing) return;
        if (!holdingEnd) { visitedFollowing = false; parkAtEnd(); return; }
        if (touchSequence > heldTouchSequence && readyToLeave()) {
          leaveEndHold();
          revealFollowing();
        }
      }
    }, { passive: false });
    const endTouch = () => { touchY = null; touchX = null; };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey
        || event.target.closest('input, textarea, select, button, [contenteditable]')) return;
      skipGateUntil = 0;
      if (['Escape', 'Home', 'End', 'ArrowUp', 'PageUp'].includes(event.key)) {
        stopVertical();
        leaveEndHold();
        if (event.key === 'End') visitedFollowing = true;
        return;
      }
      if (['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey && atExit()) {
        event.preventDefault();
        if (!holdingEnd) { visitedFollowing = false; parkAtEnd(); }
        else if (!event.repeat && readyToLeave()) { leaveEndHold(); revealFollowing(); }
      }
    });
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
      stopVertical();
      leaveEndHold();
      // Anchor navigation and the existing Contact alignment bypass the pause.
      skipGateUntil = performance.now() + 1600;
      visitedFollowing = link.getAttribute('href') !== '#proyectos';
    }));
    const measure = () => {
      resizeFrame = 0;
      stickyTop = Math.max(0, header?.getBoundingClientRect().bottom || 0);
      projectSection.style.setProperty('--project-sticky-top', stickyTop + 'px');
      projectSection.style.setProperty('--project-viewport-height', Math.max(160, window.innerHeight - stickyTop) + 'px');
      travel = Math.max(0, rail.scrollWidth - galleryStage.clientWidth);
      photoStarts = slides.map((item) => item.offsetLeft - slides[0].offsetLeft);
      projectTrack.style.minHeight = projectCard.offsetHeight + travel + 'px';
      updatePhotos();
    };
    const scheduleMeasure = () => {
      if (!resizeFrame) resizeFrame = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('pageshow', () => {
      measure();
      if (window.scrollY >= studioTarget() - 1) visitedFollowing = true;
    });
    window.addEventListener('pagehide', () => {
      stopVertical();
      cancelAnimationFrame(photoFrame);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(resizeFrame);
      photoFrame = scrollFrame = resizeFrame = 0;
    });
    if ('ResizeObserver' in window) {
      const layoutObserver = new ResizeObserver(scheduleMeasure);
      layoutObserver.observe(galleryStage);
      if (header) layoutObserver.observe(header);
    }
    document.fonts?.ready.then(scheduleMeasure);
    reducedMotion.addEventListener('change', updatePhotos);
    measure();
  }
})();
