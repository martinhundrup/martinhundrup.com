// Small, dependency-free 2D rigid-body solver. Positions are in CSS pixels;
// angles and angular velocities are radians and radians/second.
export const MAX_SPEED = 1200;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dot = (a, b) => a.x * b.x + a.y * b.y;
const cross = (a, b) => a.x * b.y - a.y * b.x;

export function createBody(options) {
  const body = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0, width: 40, height: 40, mass: 1, grabbed: false, ...options };
  body.inertia = body.mass * (body.width ** 2 + body.height ** 2) / 12;
  return body;
}

export function applyScrollImpulse(bodies, distance, bounds) {
  // Objects lag behind the chamber as the page moves. Cap large anchor jumps
  // and vary the response slightly so the scene sloshes rather than moving as one.
  const impulse = clamp(distance, -90, 90) * .9;
  for (const body of bodies) {
    if (body.grabbed) continue;
    body.vy += impulse / Math.sqrt(body.mass);
    const offset = clamp(body.x / Math.max(1, bounds.width) - .5, -.5, .5);
    body.spin = clamp(body.spin + impulse * offset * .008, -5, 5);
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > MAX_SPEED) { body.vx *= MAX_SPEED / speed; body.vy *= MAX_SPEED / speed; }
  }
}

export function axes(body) {
  const c = Math.cos(body.angle), s = Math.sin(body.angle);
  return [{ x: c, y: s }, { x: -s, y: c }];
}

export function extents(body) {
  const c = Math.abs(Math.cos(body.angle)), s = Math.abs(Math.sin(body.angle));
  return { x: (c * body.width + s * body.height) / 2, y: (s * body.width + c * body.height) / 2 };
}

export function confineBody(body, bounds) {
  const size = extents(body);
  // Oversized bodies get centered instead of receiving contradictory impulses.
  const maxX = Math.max(size.x, bounds.width - size.x);
  const maxY = Math.max(size.y, bounds.height - size.y);
  if (body.x < size.x) { body.x = size.x; if (body.vx < 0) body.vx *= -.88; body.spin *= .95; }
  if (body.x > maxX) { body.x = maxX; if (body.vx > 0) body.vx *= -.88; body.spin *= .95; }
  if (body.y < size.y) { body.y = size.y; if (body.vy < 0) body.vy *= -.88; body.spin *= .95; }
  if (body.y > maxY) { body.y = maxY; if (body.vy > 0) body.vy *= -.88; body.spin *= .95; }
  if (size.x * 2 > bounds.width) body.x = bounds.width / 2;
  if (size.y * 2 > bounds.height) body.y = bounds.height / 2;
}

export function collideBodies(a, b) {
  const basisA = axes(a), basisB = axes(b);
  const delta = { x: b.x - a.x, y: b.y - a.y };
  let overlap = Infinity, normal;
  // Separating-axis test for rotating rectangular bodies.
  for (const axis of [...basisA, ...basisB]) {
    const radiusA = Math.abs(dot(axis, basisA[0])) * a.width / 2 + Math.abs(dot(axis, basisA[1])) * a.height / 2;
    const radiusB = Math.abs(dot(axis, basisB[0])) * b.width / 2 + Math.abs(dot(axis, basisB[1])) * b.height / 2;
    const distance = dot(delta, axis);
    const depth = radiusA + radiusB - Math.abs(distance);
    if (depth <= 0) return false;
    if (depth < overlap) { overlap = depth; normal = { x: axis.x * (distance < 0 ? -1 : 1), y: axis.y * (distance < 0 ? -1 : 1) }; }
  }
  // A grabbed object acts as a moving obstacle while the cursor holds it.
  const invA = a.grabbed ? 0 : 1 / a.mass;
  const invB = b.grabbed ? 0 : 1 / b.mass;
  const invSum = invA + invB;
  if (invSum === 0) return true;
  const correction = Math.max(0, overlap - .05) / invSum;
  a.x -= normal.x * correction * invA; a.y -= normal.y * correction * invA;
  b.x += normal.x * correction * invB; b.y += normal.y * correction * invB;

  // Approximate the contact on each face, keeping a centered hit torque-free.
  const contact = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const armA = { x: contact.x - a.x, y: contact.y - a.y };
  const armB = { x: contact.x - b.x, y: contact.y - b.y };
  const velocity = { x: b.vx - b.spin * armB.y - a.vx + a.spin * armA.y, y: b.vy + b.spin * armB.x - a.vy - a.spin * armA.x };
  const approach = dot(velocity, normal);
  if (approach >= 0) return true;
  const inertiaA = a.grabbed ? 0 : 1 / a.inertia;
  const inertiaB = b.grabbed ? 0 : 1 / b.inertia;
  const torqueA = cross(armA, normal), torqueB = cross(armB, normal);
  const impulse = -(1 + .88) * approach / (invSum + torqueA ** 2 * inertiaA + torqueB ** 2 * inertiaB);
  a.vx -= normal.x * impulse * invA; a.vy -= normal.y * impulse * invA;
  b.vx += normal.x * impulse * invB; b.vy += normal.y * impulse * invB;
  a.spin -= torqueA * impulse * inertiaA; b.spin += torqueB * impulse * inertiaB;
  return true;
}

export function settleBodies(bodies, bounds, passes = 3) {
  for (let pass = 0; pass < passes; pass++) {
    for (const body of bodies) confineBody(body, bounds);
    for (let a = 0; a < bodies.length; a++) for (let b = a + 1; b < bodies.length; b++) collideBodies(bodies[a], bodies[b]);
  }
  for (const body of bodies) confineBody(body, bounds);
}

export function stepWorld(bodies, bounds, dt, gravity = 0) {
  for (const body of bodies) {
    if (!body.grabbed) body.vy += gravity * dt;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > MAX_SPEED) { body.vx *= MAX_SPEED / speed; body.vy *= MAX_SPEED / speed; }
    body.spin = clamp(body.spin, -5, 5);
    const damping = Math.exp(-.025 * dt);
    body.vx *= damping; body.vy *= damping; body.spin *= Math.exp(-.10 * dt);
    body.x += body.vx * dt; body.y += body.vy * dt;
    body.angle = (body.angle + body.spin * dt) % (Math.PI * 2);
  }
  settleBodies(bodies, bounds);
}
