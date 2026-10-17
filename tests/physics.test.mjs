import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, collideBodies, confineBody, extents, stepWorld } from '../physics.js';

test('an offset impact transfers momentum and rotation without adding energy', () => {
  const a = createBody({ x: 90, y: 100, width: 40, height: 40, vx: 150, mass: 2 });
  const b = createBody({ x: 125, y: 115, width: 40, height: 40 });
  const momentum = a.mass * a.vx;
  const energy = body => .5 * body.mass * (body.vx ** 2 + body.vy ** 2) + .5 * body.inertia * body.spin ** 2;
  const before = energy(a) + energy(b);
  assert.equal(collideBodies(a, b), true);
  assert.ok(b.vx > 0);
  assert.ok(Math.abs(a.spin) + Math.abs(b.spin) > 0);
  assert.ok(Math.abs(a.mass * a.vx + b.mass * b.vx - momentum) < .0001);
  assert.ok(energy(a) + energy(b) <= before + .0001);
});

test('separated rotating objects do not receive collision impulses', () => {
  const a = createBody({ x: 40, y: 40, angle: .5, vx: 20 });
  const b = createBody({ x: 160, y: 160, angle: -.3 });
  assert.equal(collideBodies(a, b), false);
  assert.equal(a.vx, 20);
  assert.equal(b.vx, 0);
});

test('walls contain the full rotated shape and reflect outward velocity', () => {
  const body = createBody({ x: -50, y: 300, width: 120, height: 70, angle: .7, vx: -100, vy: 50 });
  const bounds = { width: 280, height: 240 };
  confineBody(body, bounds);
  const half = extents(body);
  assert.ok(body.x >= half.x && body.y <= bounds.height - half.y);
  assert.ok(body.vx > 0 && body.vy < 0);
});

test('fast throws stay finite and in bounds across many fixed substeps', () => {
  const bounds = { width: 270, height: 220 };
  const bodies = [createBody({ x: 90, y: 80, width: 90, height: 90, vx: 3000, vy: -2100, spin: 20, mass: 3 }), createBody({ x: 210, y: 160, width: 60, height: 30, vx: -300, vy: -50 })];
  for (let frame = 0; frame < 1200; frame++) {
    stepWorld(bodies, bounds, 1 / 120);
    for (const body of bodies) {
      const half = extents(body);
      assert.ok([body.x, body.y, body.vx, body.vy, body.spin].every(Number.isFinite));
      assert.ok(body.x >= half.x - .001 && body.x <= bounds.width - half.x + .001);
      assert.ok(body.y >= half.y - .001 && body.y <= bounds.height - half.y + .001);
    }
  }
});

test('a grabbed object pushes free objects without receiving their impulse', () => {
  const grabbed = createBody({ x: 80, y: 80, vx: 100, grabbed: true });
  const free = createBody({ x: 110, y: 80 });
  collideBodies(grabbed, free);
  assert.equal(grabbed.x, 80);
  assert.equal(grabbed.vx, 100);
  assert.ok(free.vx > 100);
});

test('gravity accelerates free objects downward while zero gravity preserves rest', () => {
  const bounds = { width: 1000, height: 1000 };
  const free = createBody({ x: 300, y: 100 });
  const floating = createBody({ x: 600, y: 100 });
  for (let frame = 0; frame < 60; frame++) {
    stepWorld([free], bounds, 1 / 120, 900);
    stepWorld([floating], bounds, 1 / 120);
  }
  assert.ok(free.y > 200 && free.vy > 400);
  assert.equal(floating.y, 100);
  assert.equal(floating.vy, 0);
});

test('turning gravity off retains a throw’s momentum', () => {
  const body = createBody({ x: 300, y: 100, vy: 100 });
  stepWorld([body], { width: 1000, height: 1000 }, 1 / 120, 0);
  assert.ok(body.y > 100 && body.vy > 99);
});
