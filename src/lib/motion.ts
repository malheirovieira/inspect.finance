/** `true` quando o usuário pediu menos movimento no sistema operacional — todas as animações
 * baseadas em JS (contadores, gráficos) devem checar isso e pular direto pro estado final. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
