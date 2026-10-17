import { createBody, applyScrollImpulse, confineBody, settleBodies, stepWorld, MAX_SPEED } from './physics.js';
import { createGifPlayer } from './gif-player.js';

export function initPlayground(panel) {
  const stage = panel.querySelector('.playground-stage');
  const pause = panel.querySelector('.playground-pause');
  const reset = panel.querySelector('.playground-reset');
  const gravityButton = panel.querySelector('.zero-g');
  const upload = panel.querySelector('.playground-upload');
  const files = panel.querySelector('.playground-files');
  const fullscreen = panel.querySelector('.playground-fullscreen');
  const status = panel.querySelector('.playground-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = panel.querySelector('.shroomie img');
  const bodies = [...stage.querySelectorAll('.physics-body')].map((element, index) => createBody({
    element, seed: { x: Number(element.dataset.x), y: Number(element.dataset.y), angle: Number(element.dataset.angle || 0) },
    mass: element.classList.contains('shroomie') ? 3 : element.classList.contains('code-note') ? 1.4 : .7,
    vx: [13, -10, 15, -12, -8, 11][index], vy: [-10, 8, -7, -9, 11, 7][index], spin: [.10, -.07, .13, -.12, .18, -.14][index],
  }));
  const grabs = new Map();
  let bounds = { width: 0, height: 0 };
  let paused = motion.matches;
  let gravity = 0;
  let uploadGeneration = 0;
  let previousOverflow = '';
  let visible = true;
  let frame = 0;
  let previousTime = 0;
  let accumulator = 0;
  let previousScrollY = window.scrollY;
  let scrollDistance = 0;
  const tick = 1 / 120;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function draw() {
    for (const body of bodies) body.element.style.transform = `translate(${body.x}px, ${body.y}px) translate(-50%, -50%) rotate(${body.angle}rad)`;
  }
  function running() { return !paused && visible && !document.hidden; }
  function start() { if (!frame && running()) { previousTime = 0; accumulator = 0; frame = requestAnimationFrame(animate); } }
  function syncPause() {
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Resume floating' : 'Pause floating');
    pause.textContent = paused ? 'Play' : 'Pause';
    panel.classList.toggle('is-paused', paused);
    for (const body of bodies) body.animation?.setPlaying(running());
    if (!running()) { cancelAnimationFrame(frame); frame = 0; scrollDistance = 0; }
    start();
  }
  function clearGrabs() {
    for (const [id, grab] of grabs) {
      grab.body.grabbed = false;
      grab.body.element.classList.remove('is-grabbed');
      if (grab.body.element.hasPointerCapture(id)) grab.body.element.releasePointerCapture(id);
    }
    grabs.clear();
  }
  function measure(initial = false) {
    const old = bounds;
    bounds = { width: stage.clientWidth, height: stage.clientHeight };
    if (!bounds.width || !bounds.height) return;
    clearGrabs();
    for (const body of bodies) {
      body.width = body.element.offsetWidth;
      body.height = body.element.offsetHeight;
      body.inertia = body.mass * (body.width ** 2 + body.height ** 2) / 12;
      body.x = initial || !old.width ? bounds.width * body.seed.x : body.x / old.width * bounds.width;
      body.y = initial || !old.height ? bounds.height * body.seed.y : body.y / old.height * bounds.height;
      if (initial) body.angle = body.seed.angle;
    }
    settleBodies(bodies, bounds, 12);
    panel.classList.add('physics-ready');
    draw(); start();
  }
  function point(event) {
    const rect = stage.getBoundingClientRect();
    return { x: clamp(event.clientX - rect.left, 0, bounds.width), y: clamp(event.clientY - rect.top, 0, bounds.height) };
  }
  function hold(grab, dt) {
    const body = grab.body;
    const c = Math.cos(body.angle), s = Math.sin(body.angle);
    const arm = { x: grab.offset.x * c - grab.offset.y * s, y: grab.offset.x * s + grab.offset.y * c };
    const error = { x: grab.target.x - body.x - arm.x, y: grab.target.y - body.y - arm.y };
    // A damped spring at the actual grab point lets off-center grabs spin.
    const ax = error.x * 420 - (body.vx - body.spin * arm.y) * 34;
    const ay = error.y * 420 - (body.vy + body.spin * arm.x) * 34;
    body.vx += ax * dt; body.vy += ay * dt;
    body.spin += ((arm.x * ay - arm.y * ax) * body.mass / body.inertia * .25 - body.spin * 5) * dt;
  }
  function animate(time) {
    frame = 0;
    if (!running()) return;
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    accumulator += elapsed;
    previousTime = time;
    if (scrollDistance) {
      applyScrollImpulse(bodies, scrollDistance, bounds);
      scrollDistance = 0;
    }
    while (accumulator >= tick) {
      for (const grab of grabs.values()) hold(grab, tick);
      stepWorld(bodies, bounds, tick, gravity);
      accumulator -= tick;
    }
    for (const body of bodies) body.animation?.advance(elapsed * 1000);
    draw(); frame = requestAnimationFrame(animate);
  }

  function attachBody(body) {
    const element = body.element;
    element.addEventListener('dragstart', event => event.preventDefault());
    element.addEventListener('pointerdown', event => {
      if (event.button !== 0 || body.grabbed) return;
      const target = point(event), dx = target.x - body.x, dy = target.y - body.y;
      const c = Math.cos(body.angle), s = Math.sin(body.angle);
      grabs.set(event.pointerId, { body, target, offset: { x: dx * c + dy * s, y: -dx * s + dy * c }, lastTime: event.timeStamp, lastMove: event.timeStamp, vx: 0, vy: 0 });
      body.grabbed = true; body.vx = 0; body.vy = 0; body.spin *= .3;
      element.classList.add('is-grabbed');
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener('pointermove', event => {
      const grab = grabs.get(event.pointerId);
      if (!grab) return;
      const target = point(event), dt = Math.max((event.timeStamp - grab.lastTime) / 1000, .008);
      grab.vx = grab.vx * .35 + clamp((target.x - grab.target.x) / dt, -MAX_SPEED, MAX_SPEED) * .65;
      grab.vy = grab.vy * .35 + clamp((target.y - grab.target.y) / dt, -MAX_SPEED, MAX_SPEED) * .65;
      grab.lastTime = event.timeStamp; grab.lastMove = event.timeStamp; grab.target = target;
      if (paused) {
        const c = Math.cos(body.angle), s = Math.sin(body.angle);
        body.x = target.x - grab.offset.x * c + grab.offset.y * s;
        body.y = target.y - grab.offset.x * s - grab.offset.y * c;
        settleBodies(bodies, bounds); draw();
      }
    });
    const release = event => {
      const grab = grabs.get(event.pointerId);
      if (!grab) return;
      grabs.delete(event.pointerId); body.grabbed = false; element.classList.remove('is-grabbed');
      if (event.type === 'pointerup' && !paused) {
        const fresh = event.timeStamp - grab.lastMove < 90;
        body.vx = fresh ? body.vx * .35 + grab.vx * .65 : body.vx * .2;
        body.vy = fresh ? body.vy * .35 + grab.vy * .65 : body.vy * .2;
      } else { body.vx = 0; body.vy = 0; body.spin = 0; }
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      confineBody(body, bounds); draw();
    };
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
    element.addEventListener('keydown', event => {
      if (body.uploaded && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault(); removeUploaded(body); upload.focus(); return;
      }
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!direction && event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (direction) {
        body.x += direction[0] * 12; body.y += direction[1] * 12;
        if (!paused) { body.vx += direction[0] * 65; body.vy += direction[1] * 65; }
      } else if (!paused) { body.vx += 65; body.vy -= 90; body.spin += 1.2; }
      settleBodies(bodies, bounds); draw();
    });
  }
  for (const body of bodies) attachBody(body);

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  }
  function removeUploaded(body) {
    clearGrabs();
    const index = bodies.indexOf(body);
    if (index < 0 || !body.uploaded) return;
    bodies.splice(index, 1);
    body.animation?.destroy();
    body.element.remove();
    URL.revokeObjectURL(body.objectUrl);
    message('Image removed.');
  }
  gravityButton.addEventListener('click', () => {
    gravity = gravity ? 0 : 900;
    gravityButton.textContent = gravity ? '1 G' : '0 G';
    gravityButton.setAttribute('aria-pressed', String(!!gravity));
    gravityButton.title = gravity ? 'Turn gravity off' : 'Turn gravity on';
    message(gravity ? 'Gravity on.' : 'Gravity off.');
  });
  upload.addEventListener('click', () => files.click());
  files.addEventListener('change', async () => {
    const selected = [...files.files];
    const generation = uploadGeneration;
    message('');
    upload.disabled = true;
    let added = 0, failed = 0;
    try {
      for (const file of selected) {
        if (bodies.filter(body => body.uploaded).length >= 8) { message('Eight images fit here. Remove one or reset to add more.', true); break; }
        if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { failed++; continue; }
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.src = objectUrl;
        try { await image.decode(); } catch { URL.revokeObjectURL(objectUrl); failed++; continue; }
        if (!image.naturalWidth || !image.naturalHeight) { URL.revokeObjectURL(objectUrl); failed++; continue; }
        if (generation !== uploadGeneration) { URL.revokeObjectURL(objectUrl); break; }
        const scale = 100 / Math.max(image.naturalWidth, image.naturalHeight);
        const width = Math.max(28, Math.round(image.naturalWidth * scale));
        const height = Math.max(28, Math.round(image.naturalHeight * scale));
        const element = document.createElement('button');
        element.className = 'physics-body uploaded-body';
        element.style.width = `${width}px`; element.style.height = `${height}px`;
        element.setAttribute('aria-label', `Uploaded image: ${file.name}`);
        element.setAttribute('aria-describedby', 'playground-help');
        element.title = 'Drag to toss. Double-click or press Delete to remove.';
        image.alt = ''; image.draggable = false; element.append(image);
        const signature = await file.slice(0, 6).text();
        const animation = signature === 'GIF87a' || signature === 'GIF89a' ? createGifPlayer(image, await file.arrayBuffer()) : null;
        if (generation !== uploadGeneration) { animation?.destroy(); URL.revokeObjectURL(objectUrl); break; }
        animation?.setPlaying(running()); stage.append(element);
        const body = createBody({ element, animation, width, height, mass: 1.2, uploaded: true, objectUrl, seed: { x: .3 + Math.random() * .4, y: .25 + Math.random() * .4, angle: (Math.random() - .5) * .4 }, vx: (Math.random() - .5) * 55, vy: -25, spin: (Math.random() - .5) * .5 });
        body.x = bounds.width * body.seed.x; body.y = bounds.height * body.seed.y; body.angle = body.seed.angle;
        bodies.push(body); attachBody(body);
        element.addEventListener('dblclick', () => { removeUploaded(body); upload.focus(); });
        settleBodies(bodies, bounds, 12); draw(); start(); added++;
      }
      if (failed) message('Some files could not be opened. Choose images smaller than 12 MB.', true);
      else if (added && !status.classList.contains('is-error')) message(`${added} ${added === 1 ? 'image added' : 'images added'}.`);
    } finally { files.value = ''; upload.disabled = false; }
  });

  function isExpanded() { return document.fullscreenElement === panel || panel.classList.contains('is-expanded'); }
  function syncFullscreen() {
    scrollDistance = 0;
    previousScrollY = window.scrollY;
    const expanded = isExpanded();
    panel.classList.toggle('is-fullscreen', expanded);
    fullscreen.setAttribute('aria-pressed', String(expanded));
    fullscreen.setAttribute('aria-label', expanded ? 'Exit fullscreen' : 'Enter fullscreen');
    fullscreen.title = expanded ? 'Exit fullscreen' : 'Enter fullscreen';
    panel.setAttribute('role', expanded ? 'dialog' : 'group');
    if (expanded) panel.setAttribute('aria-modal', 'true'); else panel.removeAttribute('aria-modal');
  }
  function closeExpanded() {
    panel.classList.remove('is-expanded');
    document.body.style.overflow = previousOverflow;
    syncFullscreen(); fullscreen.focus({ preventScroll: true });
  }
  fullscreen.addEventListener('click', async () => {
    clearGrabs();
    if (panel.classList.contains('is-expanded')) { closeExpanded(); return; }
    try {
      if (document.fullscreenElement === panel) await document.exitFullscreen();
      else if (panel.requestFullscreen) await panel.requestFullscreen();
      else throw new Error('Use expanded view');
    } catch {
      previousOverflow = document.body.style.overflow;
      panel.classList.add('is-expanded'); document.body.style.overflow = 'hidden';
    }
    syncFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('is-expanded')) { event.preventDefault(); closeExpanded(); }
    if (event.key !== 'Tab' || !isExpanded()) return;
    const controls = [...panel.querySelectorAll('button:not(:disabled)')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  pause.addEventListener('click', () => { paused = !paused; clearGrabs(); syncPause(); });
  reset.addEventListener('click', () => {
    clearGrabs();
    scrollDistance = 0;
    uploadGeneration++;
    for (const body of [...bodies]) if (body.uploaded) removeUploaded(body);
    message('Playground reset.');
    for (const [index, body] of bodies.entries()) {
      body.animation?.reset();
      body.vx = [13, -10, 15, -12, -8, 11][index]; body.vy = [-10, 8, -7, -9, 11, 7][index]; body.spin = [.10, -.07, .13, -.12, .18, -.14][index];
    }
    measure(true);
  });
  function updateMotion() {
    sprite.src = motion.matches ? 'assets/shroomie-still.png' : 'assets/shroomie.gif';
    if (motion.matches) { paused = true; clearGrabs(); }
    syncPause();
  }
  motion.addEventListener('change', updateMotion);
  // Actual page movement covers wheel, touch, keyboard, and scrollbar input.
  // Always update the baseline so sleeping scenes never replay missed scrolling.
  window.addEventListener('scroll', () => {
    const distance = window.scrollY - previousScrollY;
    previousScrollY = window.scrollY;
    if (!running() || motion.matches || isExpanded()) return;
    scrollDistance = clamp(scrollDistance + distance, -90, 90);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { clearGrabs(); syncPause(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) clearGrabs(); syncPause(); }).observe(panel);
  new ResizeObserver(() => measure()).observe(stage);
  document.fonts.ready.then(() => measure());
  measure(true); updateMotion();
  fetch('assets/shroomie.gif').then(response => response.arrayBuffer()).then(data => {
    bodies[0].animation = createGifPlayer(sprite, data);
    bodies[0].animation.setPlaying(running());
  }).catch(() => {});
}
