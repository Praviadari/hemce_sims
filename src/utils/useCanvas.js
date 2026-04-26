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

    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = c.getBoundingClientRect();
      const newW = rect.width || c.width / dpr;
      const newH = rect.height || c.height / dpr;
      if (newW <= 0 || newH <= 0) return;
      cssW = newW;
      cssH = newH;
      const scaledW = Math.round(cssW * dpr);
      const scaledH = Math.round(cssH * dpr);
      if (c.width !== scaledW || c.height !== scaledH) {
        c.width = scaledW;
        c.height = scaledH;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);
      drawRef.current(ctx, cssW, cssH);
      ctx.restore();
    };

    resize();

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (opts.animate && !prefersReduced) {
      const loop = () => {
        render();
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
    } else {
      render();
    }

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      resize();
      render();
    }) : null;

    const themeObserver = typeof MutationObserver !== "undefined" ? new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "data-theme") {
          resize();
          render();
          break;
        }
      }
    }) : null;

    if (observer) observer.observe(c);
    if (themeObserver) themeObserver.observe(document.body, { attributes: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      if (observer) observer.disconnect();
      if (themeObserver) themeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
