import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Instância única do Lenis, exposta para componentes fora deste hook que
// precisem chamar `lenis.scrollTo(...)` (ex.: navegação programática entre
// seções). Fica `null` até o rAF de inicialização rodar, e de novo após o
// unmount — por isso `getLenis()` sempre retorna um tipo anulável.
let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Liga o scroll suave (Lenis) ao ticker do GSAP, para que o ScrollTrigger
 * receba a posição de scroll já suavizada em vez do scroll nativo do browser.
 * Chamado uma vez no topo da árvore (App.tsx) para valer em toda a aplicação.
 */
export function useSmoothScroll() {
  useEffect(() => {
    let ticker: ((time: number) => void) | undefined;

    // Inicializa o Lenis num requestAnimationFrame para não competir com o
    // primeiro render da página.
    const raf = requestAnimationFrame(() => {
      const lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0,
        infinite: false,
      });
      lenisInstance = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      ticker = gsap.ticker.add((time: number) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (ticker) gsap.ticker.remove(ticker);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);
}
