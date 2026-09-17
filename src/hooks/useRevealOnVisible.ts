import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/** Dispara `true` quando o elemento referenciado entra na viewport (uma vez só) — usado pra só
 * animar gráficos quando o usuário realmente rola até eles, não no carregamento da página toda. */
export function useRevealOnVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible] as const;
}
