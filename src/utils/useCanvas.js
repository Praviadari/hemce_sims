// ═══════════════════════════════════════
// useCanvas — Reusable canvas drawing hook
// HiDPI-aware + optional continuous animation
// ═══════════════════════════════════════

import { useRef, useEffect, useCallback } from "react";

/**
 * @param {Function} draw - (ctx, W, H) => void — drawing function
 * @param {Array} deps - React dependency array for redraws
 * @param {Object} opts - { animate: boolean } — if true, runs rAF loop
 */
export function useCanvas(draw, deps, opts = {}) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    // Use CSS-driven size if available, fallback to attribute
    const cssW = rect.width || c.width;
    const cssH = rect.height || c.height;

    // Scale the canvas buffer for HiDPI
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(cssH * dpr)) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }

    const ctx = c.getContext("2d");

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);
      drawRef.current(ctx, cssW, cssH);
      ctx.restore();
    };

    if (opts.animate) {
      // Check for reduced motion preference
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        render();
        return;
      }
      const loop = () => {
        render();
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    } else {
      render();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
