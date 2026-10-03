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
    const verticalGallery = window.matchMedia('(max-width: 760px)');
    projectSection.style.overflowAnchor = 'none';
    // The first copy supports the continuation and a seamless forward loop.
    const continuation = slides[0].cloneNode(true);
    continuation.setAttribute('aria-hidden', 'true');
    rail.appendChild(continuation);
    slides.slice(1).forEach((slide) => {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      rail.appendChild(copy);
    });
    let stickyTop = 59;
    let travel = 0;
    let extraTravel = 0;
    let entryLead = 0;
    let cardHeight = 1;
    let photoSize = 1;
    let cycleLength = 0;
    let firstPhotoLooped = false;
    let passStart = 0;
    let passLast = 0;
    let galleryReleased = false;
    let resumedPass = false;
    let mobileViewportHeight = window.visualViewport?.height || window.innerHeight;
    let photoStarts = [];
    let captionIndex = 0;
    let target = 0;
    let rendered = 0;
    let photoFrame = 0;
    let previousPhotoTime = 0;
    let resizeFrame = 0;
    let exitFrame = 0;
    let exitPending = false;
    let exiting = false;
    let enteredStudio = false;
    let previousY = window.scrollY;
    let bypassUntil = 0;
    let lastWheelAt = -Infinity;
    let wheelSequence = 0;
    let exitWheelSequence = -1;
    let touchSequence = 0;
    let exitTouchSequence = -1;
    let touchY = null;
    let touchX = null;
    let exitKeyHeld = false;
    let entryFrame = 0;
    let entryScrollBehavior = null;
    let enteringProject = false;
    let entryAligned = false;
    let resumingProject = false;

    const trackStart = () => window.scrollY + projectTrack.getBoundingClientRect().top - stickyTop;
    const playbackLead = () => resumedPass ? 0 : entryLead;
    const exitStart = () => trackStart() + passLast - passStart + extraTravel - playbackLead();
    const studioTarget = () => window.scrollY + studioSection.getBoundingClientRect().top
      - (header?.getBoundingClientRect().bottom || 0);
    const atStudio = () => studioSection && Math.abs(window.scrollY - studioTarget()) < 2;
    const photoPosition = () => cycleLength ? ((rendered % cycleLength) + cycleLength) % cycleLength : rendered;
    const sizeTrack = () => {
      const scrollRoom = galleryReleased ? 0 : Math.max(0, passLast - passStart + extraTravel - playbackLead());
      projectTrack.style.minHeight = Math.ceil(cardHeight + scrollRoom) + 'px';
    };
    const paintPhotos = () => {
      // Keep the opening gutter until the full-width copy wraps into the first photo.
      if (!firstPhotoLooped && cycleLength && rendered >= cycleLength) {
        firstPhotoLooped = true;
        slides[0].style.paddingLeft = '0px';
        measure();
        return;
      }
      const position = photoPosition();
      rail.style.transform = verticalGallery.matches
        ? 'translate3d(0,' + (-position) + 'px,0)'
        : 'translate3d(' + (-position) + 'px,0,0)';
      let next = 0;
      for (let i = 1; i < photoStarts.length; i++) {
        if (position + .5 >= photoStarts[i]) next = i;
        else break;
      }
      if (next !== captionIndex) {
        captionIndex = next;
        galleryLabel.textContent = slides[next].dataset.caption;
      }
      if (verticalGallery.matches) {
        const photoBottom = photoStarts[next] + slides[next].offsetHeight - position;
        galleryStage.style.setProperty('--project-caption-bottom', Math.max(0, galleryStage.clientHeight - photoBottom) + 'px');
      }
    };
    const cancelExit = () => {
      cancelAnimationFrame(exitFrame);
      exitFrame = 0;
      exitPending = exiting = false;
      exitWheelSequence = exitTouchSequence = -1;
      exitKeyHeld = false;
    };
    const enterStudio = () => {
      exitPending = false;
      exiting = true;
      cancelAnimationFrame(photoFrame);
      photoFrame = 0;
      previousPhotoTime = 0;
      const fromY = window.scrollY;
      const fromX = rendered;
      const started = performance.now();
      const slide = (now) => {
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 520);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        const to = Math.max(0, Math.min(studioTarget(), document.documentElement.scrollHeight - window.innerHeight));
        // One animation moves Studio to the header and rewinds the extra 30%.
        target = rendered = fromX + (passLast - fromX) * eased;
        paintPhotos();
        window.scrollTo({ top: fromY + (to - fromY) * eased, behavior: 'instant' });
        previousY = window.scrollY;
        if (progress < 1) exitFrame = requestAnimationFrame(slide);
        else {
          exitFrame = 0;
          exiting = false;
          enteredStudio = true;
          target = rendered = passLast;
          paintPhotos();
        }
      };
      exitFrame = requestAnimationFrame(slide);
    };
    const cancelEntry = () => {
      cancelAnimationFrame(entryFrame);
      entryFrame = 0;
      enteringProject = false;
      resumingProject = false;
      document.dispatchEvent(new CustomEvent('bojana:project-entry', { detail: { active: false } }));
      if (entryScrollBehavior !== null) {
        document.documentElement.style.scrollBehavior = entryScrollBehavior;
        entryScrollBehavior = null;
      }
    };
    const alignProject = (resume = false) => {
      if (enteringProject || (!resume && entryAligned) || exitPending || exiting || performance.now() < bypassUntil) return;
      const from = window.scrollY;
      if (!resume && from >= trackStart() - .5) { entryAligned = true; return; }
      enteringProject = true;
      resumingProject = resume;
      document.dispatchEvent(new CustomEvent('bojana:project-entry', { detail: { active: true } }));
      entryScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      const started = performance.now();
      const settle = (now) => {
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 360);
        const eased = 1 - (1 - progress) ** 3;
        const to = Math.max(0, Math.min(trackStart(), document.documentElement.scrollHeight - window.innerHeight));
        // Continue the photos while gently settling below the header.
        const next = from + (to - from) * eased;
        window.scrollTo({ top: resume ? next : Math.max(window.scrollY, next), behavior: 'instant' });
        previousY = window.scrollY;
        if (progress < 1) entryFrame = requestAnimationFrame(settle);
        else {
          cancelEntry();
          entryAligned = true;
          updatePhotos();
        }
      };
      entryFrame = requestAnimationFrame(settle);
    };
    const releaseGallery = () => {
      cancelEntry();
      cancelExit();
      if (galleryReleased) return;
      cancelAnimationFrame(photoFrame);
      photoFrame = 0;
      previousPhotoTime = 0;
      target = rendered = photoPosition();
      const y = window.scrollY;
      const start = trackStart();
      const scrollRoom = Math.max(0, projectTrack.getBoundingClientRect().height - cardHeight);
      galleryReleased = true;
      entryAligned = false;
      sizeTrack();
      // Remove the sticky runway while preserving the visible page position.
      const removed = Math.max(0, Math.min(scrollRoom, y - start));
      window.scrollTo({ top: Math.max(0, y - removed), behavior: 'instant' });
      previousY = window.scrollY;
      paintPhotos();
    };
    const resumeGallery = () => {
      if (!galleryReleased || performance.now() < bypassUntil) return;
      passStart = target = rendered = photoPosition();
      // When the last photo was reached, continue into the first copy.
      passLast = travel + (passStart >= travel - .5 ? cycleLength : 0);
      galleryReleased = false;
      resumedPass = true;
      enteredStudio = false;
      entryAligned = false;
      sizeTrack();
      alignProject(true);
    };
    const captureProjectEntry = (delta) => {
      const y = window.scrollY;
      if (delta <= 0 || performance.now() < bypassUntil || enteringProject || exiting
        || y >= trackStart() - .5 || y + delta < trackStart() - entryLead * .72) return false;
      if (galleryReleased) resumeGallery();
      else alignProject();
      return enteringProject;
    };
    const animatePhotos = (now) => {
      const dt = previousPhotoTime ? Math.min(64, now - previousPhotoTime) : 16;
      previousPhotoTime = now;
      rendered += (target - rendered) * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 55));
      if (Math.abs(target - rendered) < .1 || (exitPending && Math.abs(target - rendered) < .5)) rendered = target;
      paintPhotos();
      if (exitPending && rendered === target) { enterStudio(); return; }
      if (rendered !== target) photoFrame = requestAnimationFrame(animatePhotos);
      else { photoFrame = 0; previousPhotoTime = 0; }
    };
    const requestExit = () => {
      if (!studioSection || galleryReleased || exitPending || exiting || performance.now() < bypassUntil) return;
      exitPending = true;
      enteredStudio = false;
      exitWheelSequence = wheelSequence;
      exitTouchSequence = touchSequence;
      target = passLast + extraTravel;
      if (!photoFrame) photoFrame = requestAnimationFrame(animatePhotos);
    };
    const updatePhotos = () => {
      if (galleryReleased || resumingProject || enteredStudio || exitPending || exiting) return;
      const distance = window.scrollY - trackStart() + playbackLead();
      // Only forward page movement advances the remembered photo position.
      target = passStart + Math.max(0, Math.min(passLast - passStart + extraTravel, distance));
      if (!photoFrame) photoFrame = requestAnimationFrame(animatePhotos);
    };
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const downward = y > previousY;
      const upward = y < previousY;
      previousY = y;
      if (upward && !galleryReleased && !enteringProject && !exiting) {
        releaseGallery();
        return;
      }
      if (galleryReleased) {
        if (downward && y >= trackStart() - entryLead * .72 && y < trackStart() + cardHeight) resumeGallery();
        return;
      }
      if (!enteringProject) {
        if (y < trackStart() - entryLead - 1) entryAligned = false;
        else if (y >= trackStart() - .5) entryAligned = true;
        else if (downward && y >= trackStart() - entryLead * .72) alignProject();
      }
      if (y < exitStart() - 1 && !exitPending && !exiting) enteredStudio = false;
      if (downward && !enteredStudio && !exitPending && !exiting
        && performance.now() >= bypassUntil && y >= exitStart() - .5) requestExit();
      updatePhotos();
    }, { passive: true });
    window.addEventListener('wheel', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey
        || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const now = performance.now();
      if (now - lastWheelAt > 140) wheelSequence++;
      lastWheelAt = now;
      if (event.deltaY < 0) { releaseGallery(); return; }
      if (enteringProject) { event.preventDefault(); return; }
      if (exitPending || exiting) {
        exitWheelSequence = wheelSequence;
        event.preventDefault();
        return;
      }
      if (enteredStudio && wheelSequence === exitWheelSequence && atStudio()) {
        event.preventDefault();
        return;
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (captureProjectEntry(delta)) { event.preventDefault(); return; }
      const y = window.scrollY;
      if (!galleryReleased && !enteredStudio && now >= bypassUntil && y >= trackStart() - entryLead
        && y < exitStart() && y + delta >= exitStart()) {
        event.preventDefault();
        requestExit();
      }
    }, { passive: false });
    window.addEventListener('touchstart', (event) => {
      touchSequence++;
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
      if (event.defaultPrevented || touchY === null || event.touches.length !== 1) return;
      const nextY = event.touches[0].clientY;
      const nextX = event.touches[0].clientX;
      const down = touchY - nextY;
      const across = touchX - nextX;
      touchY = nextY;
      touchX = nextX;
      if (Math.abs(down) <= Math.abs(across)) return;
      if (down < 0) { releaseGallery(); return; }
      if (enteringProject) { if (event.cancelable) event.preventDefault(); return; }
      if (captureProjectEntry(down)) { if (event.cancelable) event.preventDefault(); return; }
      const y = window.scrollY;
      const crossing = !galleryReleased && !enteredStudio && performance.now() >= bypassUntil
        && y >= trackStart() - entryLead && y < exitStart() && y + down >= exitStart();
      if (exitPending || exiting || (enteredStudio && touchSequence === exitTouchSequence && atStudio()) || crossing) {
        if (event.cancelable) event.preventDefault();
        if (exitPending || exiting) exitTouchSequence = touchSequence;
        if (crossing) requestExit();
      }
    }, { passive: false });
    const endTouch = () => { touchY = touchX = null; };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey
        || event.target.closest('input, textarea, select, button, [contenteditable]')) return;
      if (['Escape', 'Home', 'End', 'ArrowUp', 'PageUp'].includes(event.key)
        || (event.key === ' ' && event.shiftKey)) {
        releaseGallery();
        if (event.key === 'End') enteredStudio = true;
        return;
      }
      if (!['ArrowDown', 'PageDown', ' '].includes(event.key)) return;
      if (enteringProject || exitPending || exiting || (exitKeyHeld && event.repeat && atStudio())) {
        event.preventDefault();
        return;
      }
      const y = window.scrollY;
      const amount = event.key === 'ArrowDown' ? 40 : window.innerHeight * .85;
      if (captureProjectEntry(amount)) { event.preventDefault(); return; }
      if (!galleryReleased && !enteredStudio && y >= trackStart() - entryLead && y < exitStart() && y + amount >= exitStart()) {
        event.preventDefault();
        exitKeyHeld = true;
        requestExit();
      }
    });
    window.addEventListener('keyup', (event) => {
      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) exitKeyHeld = false;
    });
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
      releaseGallery();
      bypassUntil = performance.now() + 1600;
      enteredStudio = link.getAttribute('href') !== '#proyectos';
    }));

    const measure = () => {
      resizeFrame = 0;
      stickyTop = Math.max(0, header?.getBoundingClientRect().bottom || 0);
      // Keep the gallery stable while the contact keyboard or pinch zoom is open.
      if (verticalGallery.matches && (window.visualViewport?.scale || 1) === 1
        && !document.activeElement?.closest('input, textarea, select, [contenteditable]')) {
        mobileViewportHeight = window.visualViewport?.height || window.innerHeight;
      }
      const viewportHeight = verticalGallery.matches ? mobileViewportHeight : window.innerHeight;
      projectSection.style.setProperty('--project-sticky-top', stickyTop + 'px');
      projectSection.style.setProperty('--project-viewport-height', Math.max(160, viewportHeight - stickyTop) + 'px');
      const bounds = galleryStage.getBoundingClientRect();
      const width = bounds.width;
      const previousCycle = cycleLength;
      const round = previousCycle ? Math.floor(passLast / previousCycle) : 0;
      photoSize = verticalGallery.matches ? Math.max(1, slides.at(-1).offsetHeight) : slides.at(-1).offsetWidth;
      continuation.style.paddingLeft = '0px';
      continuation.style.marginLeft = verticalGallery.matches
        ? '0px'
        : -(parseFloat(getComputedStyle(rail).columnGap) || 0) + 'px';
      photoStarts = slides.map((item) => verticalGallery.matches ? item.offsetTop - slides[0].offsetTop : item.offsetLeft - slides[0].offsetLeft);
      travel = photoStarts.at(-1) || 0;
      cycleLength = verticalGallery.matches ? continuation.offsetTop - slides[0].offsetTop : continuation.offsetLeft - slides[0].offsetLeft;
      // Repeat enough photos to fill the viewport at the end of each pass.
      // Each render keeps its own proportions without an empty interval.
      const viewportSize = verticalGallery.matches ? bounds.height : width;
      const railEnd = () => {
        const last = rail.lastElementChild;
        return verticalGallery.matches ? last.offsetTop + last.offsetHeight : last.offsetLeft + last.offsetWidth;
      };
      if (cycleLength > 0) {
        while (railEnd() < cycleLength + viewportSize) {
          const previousEnd = railEnd();
          slides.forEach((slide) => {
            const copy = slide.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            copy.style.paddingLeft = '0px';
            copy.style.marginLeft = '0px';
            rail.appendChild(copy);
          });
          if (railEnd() <= previousEnd) break;
        }
      }
      if (previousCycle) {
        const scale = cycleLength / previousCycle;
        passStart *= scale;
        target *= scale;
        rendered *= scale;
      }
      passLast = round * cycleLength + travel;
      const gap = verticalGallery.matches ? 0 : Math.max(0, continuation.offsetLeft - slides.at(-1).offsetLeft - photoSize);
      extraTravel = photoSize * .3 + gap;
      cardHeight = projectCard.getBoundingClientRect().height;
      entryLead = Math.min(180, cardHeight * .22);
      projectSection.style.setProperty('--project-entry-lead', entryLead + 'px');
      sizeTrack();
      paintPhotos();

      // Keep Studio at its content height, with the ticker immediately below.
      // Only add the missing scroll room inside the contact backdrop.
      if (studioSection) {
        studioSection.style.minHeight = '';
        const contact = document.querySelector('#contacto');
        if (contact && !contact.classList.contains('is-form-open')) {
          const reserved = parseFloat(contact.style.getPropertyValue('--studio-scroll-room')) || 0;
          const studioTop = window.scrollY + studioSection.getBoundingClientRect().top;
          const remaining = document.documentElement.scrollHeight - studioTop - reserved;
          contact.style.setProperty('--studio-scroll-room', Math.max(0, cardHeight - remaining) + 'px');
        }
      }
      if (exitPending) target = passLast + extraTravel;
      updatePhotos();
    };
    const scheduleMeasure = () => {
      if (!resizeFrame) resizeFrame = requestAnimationFrame(measure);
    };
    rail.querySelectorAll('img').forEach((image) => image.addEventListener('load', scheduleMeasure));
    window.addEventListener('resize', scheduleMeasure);
    window.visualViewport?.addEventListener('resize', scheduleMeasure);
    verticalGallery.addEventListener('change', scheduleMeasure);
    window.addEventListener('pageshow', () => {
      measure();
      previousY = window.scrollY;
      entryAligned = window.scrollY >= trackStart() - .5;
      enteredStudio = studioSection && window.scrollY >= studioTarget() - 1;
    });
    window.addEventListener('pagehide', () => {
      cancelEntry();
      cancelExit();
      cancelAnimationFrame(photoFrame);
      cancelAnimationFrame(resizeFrame);
      photoFrame = resizeFrame = 0;
      previousPhotoTime = 0;
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
