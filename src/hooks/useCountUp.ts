import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/** Anima um valor numérico contando de 0 até `target` (ease-out) sempre que `target` mudar —
 * usado nos valores monetários do dashboard. Pula direto pro valor final com reduced motion. */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
