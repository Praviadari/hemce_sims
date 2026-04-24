// ═══════════════════════════════════════
// useCanvas — Reusable canvas drawing hook
// ═══════════════════════════════════════

import { useRef, useEffect } from "react";

export function useCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    draw(ctx, c.width, c.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
