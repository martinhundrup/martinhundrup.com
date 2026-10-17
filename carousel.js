// Native scrolling keeps touch, trackpads, links, and keyboard navigation intact.
export function initCarousel(root, { interval = 5000 } = {}) {
  const track = root.querySelector('.carousel-track');
  const label = root.getAttribute('aria-label') || 'Collection';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const footer = document.createElement('div');
  footer.className = 'carousel-footer';
  const status = document.createElement('span');
  status.className = 'carousel-status mono';
  const progress = document.createElement('div');
  progress.className = 'carousel-progress'; progress.setAttribute('aria-hidden', 'true');
  const indicator = document.createElement('span'); progress.append(indicator);
  const controls = document.createElement('div'); controls.className = 'carousel-controls';
  const button = (action, text, name) => {
    const element = document.createElement('button');
    element.type = 'button'; element.dataset.action = action; element.textContent = text;
    element.setAttribute('aria-label', `${name} ${label.toLowerCase()}`); element.title = name;
    element.setAttribute('aria-controls', track.id); controls.append(element); return element;
  };
  const previous = button('previous', '←', 'Previous');
  const toggle = button('toggle', 'Ⅱ', 'Pause automatic cycling of');
  const next = button('next', '→', 'Next');
  footer.append(status, progress, controls); root.append(footer);
  let slides = [], index = 0, visibleCount = 1, step = 0;
  let timer, scrollFrame;
  let paused = motion.matches, hovering = false, focused = false, dragging = false, visible = false;

  function maxIndex() { return Math.max(0, slides.length - visibleCount); }
  function schedule() {
    clearTimeout(timer);
    if (paused || hovering || focused || dragging || !visible || document.hidden || maxIndex() === 0) return;
    timer = setTimeout(() => go(index >= maxIndex() ? 0 : index + 1), interval);
  }
  function update() {
    index = Math.max(0, Math.min(maxIndex(), step ? Math.round(track.scrollLeft / step) : 0));
    const end = Math.min(slides.length, index + visibleCount);
    status.textContent = slides.length ? `${String(index + 1).padStart(2, '0')}–${String(end).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}` : '';
    status.setAttribute('aria-label', `Showing ${index + 1} to ${end} of ${slides.length}`);
    indicator.style.width = `${slides.length ? (end - index) / slides.length * 100 : 0}%`;
    indicator.style.left = `${slides.length ? index / slides.length * 100 : 0}%`;
    previous.disabled = next.disabled = toggle.disabled = maxIndex() === 0;
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} automatic cycling of ${label.toLowerCase()}`);
    toggle.title = paused ? 'Resume automatic cycling' : 'Pause automatic cycling';
    root.dataset.index = String(index);
    schedule();
  }
  function go(target, smooth = true) {
    const destination = Math.max(0, Math.min(maxIndex(), target));
    track.scrollTo({ left: Math.min(destination * step, track.scrollWidth - track.clientWidth), behavior: smooth && !motion.matches ? 'smooth' : 'instant' });
    if (!smooth || motion.matches) update();
    schedule();
  }
  function measure() {
    visibleCount = Math.min(slides.length || 1, Number.parseInt(getComputedStyle(track).getPropertyValue('--cards-per-view')) || 1);
    step = slides.length ? slides[0].getBoundingClientRect().width + (Number.parseFloat(getComputedStyle(track).columnGap) || 0) : 0;
    go(Math.min(index, maxIndex()), false);
    update();
  }
  function refresh() {
    slides = [...track.children].map((child, position) => {
      const slide = child.classList.contains('carousel-slide') ? child : document.createElement('div');
      if (slide !== child) { slide.className = 'carousel-slide'; child.replaceWith(slide); slide.append(child); }
      slide.setAttribute('role', 'group'); slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${position + 1} of ${track.children.length}`);
      return slide;
    });
    index = 0; measure();
  }
  previous.addEventListener('click', () => go(index <= 0 ? maxIndex() : index - 1));
  next.addEventListener('click', () => go(index >= maxIndex() ? 0 : index + 1));
  toggle.addEventListener('click', () => {
    paused = !paused;
    // Explicitly resuming is allowed while the rotation button keeps focus.
    if (!paused) focused = false;
    update();
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(update);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = { ArrowLeft: index <= 0 ? maxIndex() : index - 1, ArrowRight: index >= maxIndex() ? 0 : index + 1, Home: 0, End: maxIndex() }[event.key];
    if (target === undefined) return;
    event.preventDefault(); go(target);
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovering = true; schedule(); } });
  root.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', () => queueMicrotask(() => { focused = root.contains(document.activeElement); schedule(); }));
  track.addEventListener('pointerdown', () => { dragging = true; schedule(); });
  const release = () => { dragging = false; schedule(); };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { if (motion.matches) paused = true; update(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(root);
  new ResizeObserver(measure).observe(track);
  document.fonts.ready.then(measure);
  refresh();
  return { refresh };
}
