import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
let ready = false;

if (key) {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false, // controlamos manualmente via useTrackPageviews (SPA com React Router)
    autocapture: true,
  });
  ready = true;
} else {
  // Silencioso por padrão: analytics é opcional, diferente de Supabase (que bloqueia login/dados).
  console.info('PostHog não configurado: defina VITE_POSTHOG_KEY em .env.local para habilitar analytics.');
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!ready) return;
  posthog.capture(name, properties);
}

export function trackPageview(path: string) {
  if (!ready) return;
  posthog.capture('$pageview', { $current_url: window.location.origin + path });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!ready) return;
  posthog.identify(userId, traits);
}

export function resetAnalyticsIdentity() {
  if (!ready) return;
  posthog.reset();
}
