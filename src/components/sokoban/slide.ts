import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";

const DURATION_MS = 200;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function usePieceMotion(
  x: number,
  y: number,
  size: number,
  snap?: boolean,
  reducedMotion?: boolean,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const visual = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const destX = x * size;
    const destY = y * size;
    const instant = Boolean(snap || reducedMotion);

    if (visual.current === null || instant) {
      visual.current = { x: destX, y: destY };
      el.style.transform = `translate(${destX}px, ${destY}px)`;
      return;
    }

    const startX = visual.current.x;
    const startY = visual.current.y;
    if (startX === destX && startY === destY) return;

    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const e = easeOutCubic(t);
      const cx = startX + (destX - startX) * e;
      const cy = startY + (destY - startY) * e;
      visual.current = { x: cx, y: cy };
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      if (t < 1) raf = requestAnimationFrame(tick);
      else visual.current = { x: destX, y: destY };
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [x, y, size, snap, reducedMotion]);

  return ref;
}

export function pieceBoxStyle(size: number): CSSProperties {
  return {
    width: size,
    height: size,
    left: 0,
    top: 0,
  };
}
