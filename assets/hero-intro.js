(function () {
  'use strict';
  var surface = document.getElementById('inicio');
  var track = document.querySelector('.hero-intro-track');
  var logo = document.getElementById('hero-intro-logo');
  var space = document.querySelector('.hero-brand-space');
  var words = document.querySelector('.hero-disciplines');
  var scrollCue = document.querySelector('.hero-scroll-cue');
  var header = document.querySelector('.site-header');
  var targetImage = document.getElementById('brand-logo');
  if (!surface || !track || !logo || !space || !words || !header || !targetImage) return;

  var serviceLines = Array.from(words.querySelectorAll('.hero-service-line'));
  var serviceWords = serviceLines.map(function (line) { return line.querySelector('.hero-service-word'); });
  var servicePitch = 1;
  var logoScrollEnd = .3;
  var serviceScrollEnd = 1;
  var ratio = 2116 / 743;
  var compactLogoWidth = 1;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var origin = { left: 0, top: 0, width: 1 };
  var travel = 1, trackStart = 0, frame = 0, revealFrame = 0, settleUntil = 0;
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function smooth(n) { n = clamp(n); return n * n * (3 - 2 * n); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function element(name, attributes, parent) {
    var node = document.createElementNS(NS, name);
    Object.keys(attributes).forEach(function (key) { node.setAttribute(key, attributes[key]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  // Preserve the logo's own paths and original letter reveal.
  var defs = element('defs', {});
  var letters = Array.from(logo.querySelectorAll('path')).map(function (path) {
    return { path: path, box: path.getBBox() };
  });
  if (!letters.length) return;
  var leadingInset = Math.min.apply(null, letters.map(function (letter) { return letter.box.x; })) / 2116;
  logo.insertBefore(defs, logo.firstChild);
  var longLetter = letters.reduce(function (a, b) { return a.box.height > b.box.height ? a : b; });
  letters.forEach(function (letter, index) {
    var bounds = letter.box;
    var clip = element('clipPath', { id: 'hero-intro-clip-' + index }, defs);
    letter.rect = element('rect', { x: bounds.x - 4, y: bounds.y - 3, width: bounds.width + 8, height: 0 }, clip);
    var group = element('g', { 'clip-path': 'url(#hero-intro-clip-' + index + ')' });
    letter.path.parentNode.insertBefore(group, letter.path);
    group.appendChild(letter.path);
    letter.height = bounds.height + 6;
    letter.offset = bounds.height + 8;
  });
  function reveal(progress) {
    letters.forEach(function (letter) {
      if (letter === longLetter) letter.rect.setAttribute('height', letter.height * progress);
      else {
        letter.rect.setAttribute('height', letter.height);
        letter.path.setAttribute('transform', 'translate(0 ' + letter.offset * (1 - progress) + ')');
      }
    });
  }
  function target() {
    var bounds = targetImage.getBoundingClientRect();
    // Match the contained SVG inside the existing header image box exactly.
    var width = Math.min(bounds.width, bounds.height * ratio);
    return { left: bounds.left, top: bounds.top + (bounds.height - width / ratio) / 2, width: width };
  }
  function positionServices(progress) {
    // The first service gains emphasis in place; each exit passes it to the next.
    // The list is clipped at the original architecture line.
    var serviceProgress = clamp((progress - logoScrollEnd) / (serviceScrollEnd - logoScrollEnd));
    var sequence = serviceProgress * serviceLines.length;
    var departed = 0;
    var stages = serviceLines.map(function (line, index) {
      var local = clamp(sequence - index);
      var exit = reduce.matches ? (local >= 1 ? 1 : 0) : smooth((local - .42) / .58);
      departed += exit;
      return { local: local, exit: exit };
    });
    serviceLines.forEach(function (line, index) {
      var stage = stages[index];
      var incoming = index === 0
        ? (reduce.matches ? (stage.local > 0 ? 1 : 0) : smooth(stage.local / .32))
        : stages[index - 1].exit;
      var emphasis = incoming * (1 - stage.exit);
      var offset = -Math.min(index + 1, departed) * servicePitch;
      line.style.transform = 'translate3d(0,' + offset + 'px,0)';
      line.setAttribute('aria-hidden', stage.exit >= 1 ? 'true' : 'false');
      serviceWords[index].style.setProperty('--service-growth', 2 * emphasis + 'pt');
      serviceWords[index].style.setProperty('--service-opacity', String(mix(.5, 1, emphasis)));
    });
    words.classList.toggle('is-scrolling', progress > 0);
    if (progress > 0) words.classList.add('is-visible');
    words.setAttribute('aria-hidden', sequence >= serviceLines.length ? 'true' : 'false');
  }
  function position() {
    var scrollProgress = Math.max(0, (window.scrollY - trackStart) / travel);
    var progress = clamp(scrollProgress);
    // Give the logo the opening scroll segment before the services begin.
    var logoProgress = clamp(progress / logoScrollEnd);
    var eased = reduce.matches ? logoProgress : smooth(logoProgress);
    var destination = target();
    var left = mix(origin.left, destination.left, eased);
    var top = mix(origin.top, destination.top, eased);
    var width = mix(origin.width, destination.width, eased);
    logo.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0) scale(' + width / origin.width + ')';
    positionServices(scrollProgress);

    var headerOpacity = smooth((progress - .42) / .5);
    // Reveal navigation before the service sequence finishes.
    var ready = progress >= .84 && header.classList.contains('is-compact')
      && Math.abs(destination.width - compactLogoWidth) < .5;
    var navOpacity = ready ? 1 : 0;
    header.style.setProperty('--intro-header-opacity', String(headerOpacity));
    header.style.setProperty('--intro-nav-opacity', String(navOpacity));
    header.classList.toggle('is-intro-visible', headerOpacity > 0);
    header.classList.toggle('is-intro-ready', ready);
    header.inert = !ready;
    header.setAttribute('aria-hidden', ready ? 'false' : 'true');
    logo.setAttribute('aria-hidden', ready ? 'true' : 'false');
    if (scrollCue) {
      var cueOpacity = 1 - smooth(progress / .35);
      var cueHidden = cueOpacity < .01;
      scrollCue.style.opacity = String(cueOpacity);
      scrollCue.classList.toggle('is-hidden', cueHidden);
      scrollCue.inert = cueHidden;
      scrollCue.setAttribute('aria-hidden', cueHidden ? 'true' : 'false');
    }
    if (!ready) {
      var toggle = header.querySelector('.menu-toggle');
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    }
  }
  function measure() {
    var headerStyle = window.getComputedStyle(header);
    compactLogoWidth = Math.min(
      parseFloat(headerStyle.getPropertyValue('--intro-compact-brand-width')) || 170,
      (parseFloat(headerStyle.getPropertyValue('--intro-compact-brand-height')) || 48) * ratio
    );
    document.documentElement.style.setProperty('--intro-content-inset', compactLogoWidth * leadingInset + 'px');
    var bounds = space.getBoundingClientRect();
    var sceneBounds = surface.getBoundingClientRect();
    origin = {
      left: bounds.left - bounds.width * leadingInset,
      top: bounds.top - sceneBounds.top,
      width: Math.max(1, bounds.width)
    };
    trackStart = window.scrollY + track.getBoundingClientRect().top;
    travel = Math.max(1, track.offsetHeight - surface.offsetHeight);
    // Continue after the hero unpins, until the next section fills about 26% of the viewport.
    serviceScrollEnd = 1 + surface.offsetHeight * .26 / travel;
    var wordStyle = window.getComputedStyle(words);
    var lineHeight = parseFloat(wordStyle.lineHeight) || (parseFloat(wordStyle.fontSize) || 30) * 1.1;
    words.style.setProperty('--service-line-height', lineHeight + 'px');
    servicePitch = lineHeight + (parseFloat(wordStyle.rowGap) || 0);
    logo.style.width = origin.width + 'px';
    position();
  }
  function paint(now) {
    frame = 0;
    position();
    // Follow the existing header's compact size transition without a jump.
    if (now < settleUntil) frame = window.requestAnimationFrame(paint);
  }
  function schedule() {
    settleUntil = performance.now() + 300;
    if (!frame) frame = window.requestAnimationFrame(paint);
  }
  function showLogo() {
    window.cancelAnimationFrame(revealFrame);
    if (reduce.matches) { reveal(1); words.classList.add('is-visible'); return; }
    var start = performance.now();
    function step(now) {
      var t = clamp((now - start) / 950);
      reveal(t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      if (t >= .35) words.classList.add('is-visible');
      if (t < 1) revealFrame = window.requestAnimationFrame(step);
      else revealFrame = 0;
    }
    revealFrame = window.requestAnimationFrame(step);
  }

  reveal(reduce.matches ? 1 : 0);
  measure();
  logo.style.visibility = 'visible';
  showLogo();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', function () { measure(); schedule(); });
  window.addEventListener('pagehide', function () {
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(revealFrame);
    frame = revealFrame = 0;
    reveal(1);
    words.classList.add('is-visible');
  });
  reduce.addEventListener('change', function () { reveal(1); words.classList.add('is-visible'); measure(); });
  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(function () { measure(); schedule(); });
    observer.observe(space);
    var inner = header.querySelector('.header-inner');
    if (inner) observer.observe(inner);
  }
  document.fonts?.ready.then(measure);
})();
