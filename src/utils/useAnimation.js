// ═══════════════════════════════════════
// useAnimation — Reusable animation loop hook
// ═══════════════════════════════════════

import { useEffect, useRef } from "react";

export function useAnimation(running, duration, onTick, onEnd) {
  const animRef = useRef(null);

  useEffect(() => {
    if (!running) return;

    // WCAG 2.1 SC 2.3.3: respect reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Skip animation — jump to end state immediately
      onTick(duration);
      onEnd?.();
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const elapsed = (now - start) / 1000;
      onTick(elapsed);
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onEnd?.();
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return () => cancelAnimationFrame(animRef.current);
}
