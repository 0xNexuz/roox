'use client';

/* The same supplied image is both the texture and the accessible fallback. */
/* oxlint-disable next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { HERO_ART_SIZE, heroMotion, heroViewport } from '@/lib/hero-motion';
import { heroFragment, heroVertex } from '@/lib/hero-shaders';

const ART = '/kyros-hero.png';

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    const stage = layer?.parentElement;
    if (!canvas || !layer || !stage || reduced) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let disposed = false, loaded = false, visible = true, contextLost = false;
    let frame = 0, last = 0, elapsed = 0;
    let width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
    const target = { x: 0, y: 0 }, pointer = { x: 0, y: 0 };
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const image = new Image();
    const fallback = () => { layer.dataset.ready = 'false'; };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };

    function shader(kind: number, source: string) {
      const value = gl!.createShader(kind);
      if (!value) throw new Error('Unable to allocate hero shader');
      shaders.push(value);
      gl!.shaderSource(value, source);
      gl!.compileShader(value);
      if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS)) throw new Error('Hero shader not supported');
      return value;
    }

    let resize: ResizeObserver | undefined;
    let intersection: IntersectionObserver | undefined;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};

    function draw(now: number) {
      frame = 0;
      if (disposed || contextLost || !loaded || !visible || document.hidden) { last = 0; return; }
      const minimumFrame = coarse.matches ? 1000 / 30 : 1000 / 60;
      if (last && now - last < minimumFrame - 1) { frame = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min((now - last) / 1000, .08) : 0;
      last = now;
      elapsed += dt;
      const follow = 1 - Math.exp(-dt * 3.6);
      pointer.x += (target.x - pointer.x) * follow;
      pointer.y += (target.y - pointer.y) * follow;
      const motion = heroMotion(elapsed, pointer);
      const viewport = heroViewport(width, height, window.devicePixelRatio);
      if (canvas!.width !== viewport.width || canvas!.height !== viewport.height) {
        canvas!.width = viewport.width; canvas!.height = viewport.height;
      }
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.useProgram(program);
      gl!.uniform2f(uniforms.uViewport, width, height);
      gl!.uniform1f(uniforms.uPositionY, viewport.positionY);
      gl!.uniform1f(uniforms.uPixel, viewport.pixel);
      gl!.uniform4f(uniforms.uGpu, motion.gpuY, motion.pitch, motion.yaw, motion.depth);
      gl!.uniform4f(uniforms.uHands, motion.leftX, motion.leftY, motion.rightX, motion.rightY);
      gl!.uniform2f(uniforms.uFans, motion.fanLeft, motion.fanRight);
      gl!.uniform1f(uniforms.uCurl, motion.curl);
      gl!.uniform1f(uniforms.uPulse, motion.pulse);
      gl!.uniform1f(uniforms.uPhase, motion.phase);
      gl!.uniform1f(uniforms.uTime, elapsed);
      gl!.uniform1f(uniforms.uStrength, Math.min(elapsed / 1.5, 1));
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      if (layer!.dataset.ready !== 'true') {
        if (gl!.getError() !== gl!.NO_ERROR) { stop(); fallback(); return; }
        layer!.dataset.ready = 'true';
      }
      frame = requestAnimationFrame(draw);
    }

    const resume = () => {
      if (!frame && loaded && visible && !document.hidden && !disposed && !contextLost) frame = requestAnimationFrame(draw);
    };
    const visibility = () => { if (document.hidden) stop(); else resume(); };
    const resetPointer = () => { target.x = 0; target.y = 0; };
    const move = (event: PointerEvent) => {
      if (coarse.matches || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    };
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; stop(); fallback(); };
    const restored = () => setContextVersion((version) => version + 1);

    try {
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate hero renderer');
      gl.attachShader(program, shader(gl.VERTEX_SHADER, heroVertex));
      // Older devices without highp fragments can still use this small coordinate range.
      const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      const fragment = precision?.precision ? heroFragment : heroFragment.replace('precision highp float;', 'precision mediump float;');
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Unable to link hero renderer');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['uArt','uViewport','uPositionY','uPixel','uGpu','uHands','uFans','uCurl','uPulse','uPhase','uTime','uStrength'].map((name) => [name, gl.getUniformLocation(program!, name)]));
      gl.uniform1i(uniforms.uArt, 0);
      texture = gl.createTexture();
      if (!texture || !buffer) throw new Error('Unable to allocate hero resources');
      image.onload = () => {
        if (disposed || contextLost) return;
        try {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
          loaded = true;
          resume();
        } catch { fallback(); }
      };
      image.onerror = fallback;
      image.src = ART;
      resize = new ResizeObserver(([entry]) => {
        width = Math.max(1, entry.contentRect.width);
        height = Math.max(1, entry.contentRect.height);
        resume();
      });
      resize.observe(stage);
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resume(); else stop();
      }, { threshold: 0 });
      intersection.observe(stage);
      stage.addEventListener('pointermove', move, { passive: true });
      stage.addEventListener('pointerleave', resetPointer);
      stage.addEventListener('pointercancel', resetPointer);
      coarse.addEventListener('change', resetPointer);
      document.addEventListener('visibilitychange', visibility);
      canvas.addEventListener('webglcontextlost', lost);
      canvas.addEventListener('webglcontextrestored', restored);
    } catch { fallback(); }

    return () => {
      disposed = true;
      stop();
      fallback();
      image.onload = null; image.onerror = null;
      resize?.disconnect(); intersection?.disconnect();
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', resetPointer);
      stage.removeEventListener('pointercancel', resetPointer);
      coarse.removeEventListener('change', resetPointer);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((value) => gl.deleteShader(value));
    };
  }, [reduced, contextVersion]);

  return (
    <div ref={layerRef} className="hero-scene" data-motion={reduced ? 'still' : 'magnetic'}>
      <img className="hero-art" src={ART} width={HERO_ART_SIZE.width} height={HERO_ART_SIZE.height} fetchPriority="high" alt="A GPU magnetically suspended between two reaching wireframe hands" />
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
    </div>
  );
}
