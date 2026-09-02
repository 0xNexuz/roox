// Motion is in CSS pixels/radians, independent of screen density or crop.
export const HERO_LOOP_SECONDS = 12;
export const HERO_ART_SIZE = { width: 1672, height: 941 };
export const HERO_SCENE_HEIGHT = 900 * HERO_ART_SIZE.height / HERO_ART_SIZE.width;
const TAU = Math.PI * 2;
const radians = Math.PI / 180;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
function ease(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function heroMotion(seconds: number, pointer = { x: 0, y: 0 }) {
  const time = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const phase = (time % HERO_LOOP_SECONDS) / HERO_LOOP_SECONDS;
  const x = clamp(pointer.x, -1, 1), y = clamp(pointer.y, -1, 1);
  const rise = ease(phase / .34) - ease((phase - .46) / .46);
  const pulse = ease((phase - .62) / .18) - ease((phase - .82) / .18);
  const reach = ease((phase - .68) / .12) - ease((phase - .88) / .12);
  return {
    phase,
    gpuY: rise ? -18 * rise : 0,
    pitch: (1.1 * Math.sin(TAU * phase) - y * 1.8) * radians,
    yaw: (1.4 * Math.sin(TAU * phase) + x * 2.2) * radians,
    depth: 1 + .012 * Math.sin(TAU * phase),
    leftX: x * 2.2 + reach * .65,
    rightX: -x * 2.2 - reach * .65,
    leftY: y * .8,
    rightY: -y * .8,
    curl: reach * .7 + .12 * Math.sin(TAU * phase * 3),
    pulse,
    fanLeft: (time % 9) / 9 * TAU,
    fanRight: (time % 9.6) / 9.6 * TAU,
  };
}

export function heroViewport(width: number, height: number, dpr: number) {
  const w = Math.max(1, width), h = Math.max(1, height);
  // Limit total fragment work on large displays and high-density phones.
  const density = Math.min(Math.max(dpr || 1, 1), 1.75, Math.sqrt(2_400_000 / (w * h)));
  const cover = Math.max(w / 900, h / HERO_SCENE_HEIGHT);
  return {
    width: Math.max(1, Math.round(w * density)),
    height: Math.max(1, Math.round(h * density)),
    pixel: 1 / (cover * (w <= 700 ? 1.12 : 1.055)),
    positionY: w <= 700 ? .64 : .5,
  };
}
