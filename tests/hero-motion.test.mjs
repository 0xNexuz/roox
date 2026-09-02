import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HERO_LOOP_SECONDS, HERO_ART_SIZE, HERO_SCENE_HEIGHT, heroMotion, heroViewport } from '../lib/hero-motion.ts';

test('GPU rises eighteen CSS pixels, holds, and returns to its starting pose', () => {
  assert.equal(HERO_LOOP_SECONDS, 12);
  assert.equal(heroMotion(0).gpuY, 0);
  assert.equal(heroMotion(12 * .35).gpuY, -18);
  assert.equal(heroMotion(12 * .44).gpuY, -18);
  assert.ok(heroMotion(12 * .7).gpuY > -18);
  assert.ok(Math.abs(heroMotion(12).gpuY) === 0);
  for (let t = 0; t < 36; t += .013) {
    const value = heroMotion(t);
    assert.ok(value.gpuY <= 0 && value.gpuY >= -18);
    assert.ok(Math.abs(value.pitch) <= 1.11 * Math.PI / 180);
    assert.ok(Math.abs(value.yaw) <= 1.41 * Math.PI / 180);
    assert.ok(value.depth >= .988 && value.depth <= 1.012);
    assert.ok(Math.abs(value.leftX) <= .66);
    assert.equal(value.leftY, 0);
    assert.ok(Math.abs(value.curl) < .83);
    assert.ok(value.pulse >= 0 && value.pulse <= 1);
  }
});

test('cursor tilts the GPU while the hands shift in opposite directions', () => {
  const motion = heroMotion(0, { x: 1, y: 1 });
  assert.ok(motion.yaw > 0);
  assert.ok(motion.pitch < 0);
  assert.equal(motion.leftX, -motion.rightX);
  assert.equal(motion.leftY, -motion.rightY);
  assert.equal(motion.leftX, 2.2);
  assert.deepEqual(heroMotion(0, { x: 99, y: 99 }), motion);
});

test('the twelve-second pose loop is continuous, including its ring and hands', () => {
  const start = heroMotion(0), end = heroMotion(12 - .000001);
  for (const key of ['gpuY','pitch','yaw','depth','leftX','rightX','curl','pulse']) {
    assert.ok(Math.abs(start[key] - end[key]) < .00001, key);
  }
});

test('rotors turn continuously on independent slow periods', () => {
  const before = heroMotion(8.999999), after = heroMotion(9.000001);
  assert.ok(Math.abs(Math.sin(before.fanLeft) - Math.sin(after.fanLeft)) < .00001);
  assert.ok(Math.abs(Math.cos(before.fanLeft) - Math.cos(after.fanLeft)) < .00001);
  assert.notEqual(heroMotion(3).fanLeft, heroMotion(3).fanRight);
});

test('lighting and finger reach follow the descent instead of moving both hands heavily', () => {
  assert.ok(heroMotion(12 * .82).pulse > .99);
  assert.ok(heroMotion(12 * .84).leftX > .6);
  assert.equal(heroMotion(12 * .4).pulse, 0);
});

test('viewport maintains the artwork crop and caps rendering cost', () => {
  for (const [w,h,dpr] of [[390,694,3],[1440,694,2],[3840,1080,2]]) {
    const value = heroViewport(w,h,dpr);
    assert.ok(value.width * value.height < 2_405_000);
    const cover = Math.max(w / 900, h / HERO_SCENE_HEIGHT);
    assert.ok(Math.abs(value.pixel * cover * (w <= 700 ? 1.12 : 1.055) - 1) < .000001);
    assert.equal(value.positionY, w <= 700 ? .64 : .5);
  }
  const asset = readFileSync(new URL('../public/kyros-hero.png', import.meta.url));
  assert.equal(asset.readUInt32BE(16), HERO_ART_SIZE.width);
  assert.equal(asset.readUInt32BE(20), HERO_ART_SIZE.height);
});

test('invalid animation input cannot propagate NaN', () => {
  for (const value of Object.values(heroMotion(NaN, { x: Infinity, y: NaN }))) assert.ok(Number.isFinite(value));
});

test('motion remains decorative, has a static fallback, and pauses when not visible', () => {
  const component = readFileSync(new URL('../components/hero-scene.tsx', import.meta.url), 'utf8');
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /webglcontextlost/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /image.onerror = fallback/);
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /camera-breathe|light-sweep/);
});
