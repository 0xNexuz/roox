// Warp the supplied artwork; no generated geometry replaces the GPU or hands.
import { HERO_SCENE_HEIGHT } from './hero-motion';
export const heroVertex = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const heroFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uArt;
uniform vec2 uViewport;
uniform float uPositionY;
uniform float uPixel;
uniform vec4 uGpu; // CSS displacement, pitch, yaw, depth scale
uniform vec4 uHands; // CSS-pixel left xy / right xy
uniform vec2 uFans;
uniform float uCurl;
uniform float uPulse;
uniform float uPhase;
uniform float uTime;
uniform float uStrength;
const vec2 SIZE = vec2(900.0, ${HERO_SCENE_HEIGHT});

vec3 art(vec2 p) { return texture2D(uArt, clamp(p / SIZE, 0.0, 1.0)).rgb; }
float blob(vec2 p, vec2 center, vec2 radius) {
  vec2 delta = (p - center) / radius;
  return exp(-dot(delta, delta) * 2.0);
}
float gpuMask(vec2 p) {
  float edge = min(min(p.x - 295.0, 605.0 - p.x), min(p.y - 140.0, 375.0 - p.y));
  return smoothstep(0.0, 15.0, edge);
}
vec2 gpuSource(vec2 p) {
  vec2 center = vec2(448.0, 262.0);
  vec2 q = p - center - vec2(0.0, uGpu.x * uPixel * uStrength);
  float pitch = uGpu.y * uStrength, yaw = uGpu.z * uStrength;
  float scale = mix(1.0, uGpu.w, uStrength);
  // Inverse projected plane: X/Y rotation and shallow forward/back drift.
  float a = scale * cos(yaw), b = scale * sin(yaw) * sin(pitch);
  float d = scale * cos(pitch);
  float px = -sin(yaw) / 700.0, py = cos(yaw) * sin(pitch) / 700.0;
  float m00 = a - q.x * px, m01 = b - q.x * py;
  float m10 = -q.y * px, m11 = d - q.y * py;
  float determinant = m00 * m11 - m01 * m10;
  return center + vec2(m11 * q.x - m01 * q.y, -m10 * q.x + m00 * q.y) / determinant;
}
vec3 fan(vec3 base, vec2 p, vec2 center, vec2 radii, float angle) {
  vec2 q = p - center;
  // The two rotors share the perspective of the photograph, not screen circles.
  vec2 local = vec2(q.x, q.y - q.x * .14) / radii;
  float radius = length(local);
  if (radius > 1.04) return base;
  float c = cos(angle), s = sin(angle);
  vec2 turned = vec2(c * local.x - s * local.y, s * local.x + c * local.y) * radii;
  turned.y += turned.x * .14;
  // Keep the hubs and outer shrouds fixed; only the photographed blades rotate.
  float blades = smoothstep(.22, .31, radius) * (1.0 - smoothstep(.88, 1.02, radius));
  return mix(base, art(center + turned), blades * uStrength);
}
void main() {
  float cover = max(uViewport.x / SIZE.x, uViewport.y / SIZE.y);
  vec2 offset = (uViewport - SIZE * cover) * vec2(.5, uPositionY);
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
  vec2 p = (screen - offset) / cover;
  vec2 source = mix(p, gpuSource(p), gpuMask(p));
  float left = (1.0 - smoothstep(280.0, 320.0, p.x)) * smoothstep(60.0, 125.0, p.y) * (1.0 - smoothstep(405.0, 465.0, p.y));
  float right = smoothstep(595.0, 650.0, p.x) * smoothstep(210.0, 260.0, p.y) * (1.0 - smoothstep(405.0, 465.0, p.y));
  float leftAnchor = pow(clamp(p.x / 285.0, 0.0, 1.0), 2.0);
  float rightAnchor = pow(clamp((900.0 - p.x) / 280.0, 0.0, 1.0), 2.0);
  source -= (uHands.xy * left * leftAnchor + uHands.zw * right * rightAnchor) * uPixel * uStrength;
  // Tiny localized finger flex. Wrists stay anchored; neither hand bobs.
  vec2 fingers = vec2(0.0);
  fingers += blob(p, vec2(264.0, 277.0), vec2(48.0, 17.0)) * vec2(1.0, -.7);
  fingers += blob(p, vec2(205.0, 224.0), vec2(42.0, 18.0)) * vec2(.6, .7);
  fingers += blob(p, vec2(270.0, 378.0), vec2(48.0, 29.0)) * vec2(.7, -1.0);
  fingers += blob(p, vec2(641.0, 276.0), vec2(49.0, 16.0)) * vec2(-1.0, .6);
  fingers += blob(p, vec2(636.0, 319.0), vec2(48.0, 17.0)) * vec2(-.8, -.6);
  fingers += blob(p, vec2(674.0, 356.0), vec2(40.0, 21.0)) * vec2(-.6, -.9);
  source -= fingers * uCurl * uPixel * uStrength;
  vec2 ringCenter = vec2(451.0, 452.0);
  float ringMask = blob(p, ringCenter, vec2(179.0, 40.0));
  float ringScale = 1.0 + .018 * uPulse * uStrength;
  source = mix(source, ringCenter + (source - ringCenter) / ringScale, ringMask);
  vec3 color = art(source);
  color = fan(color, source, vec2(424.0, 256.0), vec2(39.0, 44.0), uFans.x);
  color = fan(color, source, vec2(523.0, 269.0), vec2(38.0, 43.0), uFans.y);
  // Light travels along existing bright wire pixels; it never paints new hands.
  float luminance = dot(color, vec3(.2126, .7152, .0722));
  float traveling = pow(.5 + .5 * sin(p.x * .036 + p.y * .026 - uTime * .75), 12.0);
  float meshNoise = sin(p.x * 2.7 + p.y * 3.1 + uTime * 1.8) * .018;
  float mesh = clamp(left + right, 0.0, 1.0) * smoothstep(.025, .24, luminance);
  color *= 1.0 + mesh * (traveling * .16 + meshNoise) * uStrength;
  color *= 1.0 + ringMask * uPulse * .16 * uStrength;
  // A faint expanding light ripple below the card, delayed behind its descent.
  float radius = length((p - ringCenter) / vec2(126.0, 18.0));
  float ripplePhase = fract(uPhase + .18);
  float ripple = exp(-pow((radius - 1.0 - ripplePhase * .2) * 100.0, 2.0));
  color += vec3(.018, .02, .016) * ripple * sin(ripplePhase * 3.14159265) * uPulse * uStrength;
  gl_FragColor = vec4(color, 1.0);
}
`;
