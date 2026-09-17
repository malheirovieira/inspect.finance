import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check, FileText, Shield, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLenis } from '@/hooks/useSmoothScroll';
import { useAuth } from '@/hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

/**
 * Quem já tem conta (mesmo sem plano ativo) não deve passar pelo cadastro de novo — vai direto
 * pra tela de pagamento. Só quem nunca criou conta passa por /cadastro.
 */
function useGoToPlan() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (planState?: { plan: string; billingCycle: string }) => {
    navigate(isAuthenticated ? '/completar-pagamento' : '/cadastro', planState ? { state: planState } : undefined);
  };
}

/**
 * Landing page — hero com vídeo de fundo e efeito de digitação, seções
 * institucionais em tema claro. Paleta e tokens: ver src/styles/tokens.css
 * (--color-bg-dark, --color-accent, etc.). Tipografia: Playfair Display
 * (headings) + Inter (body), único par tipográfico da marca.
 * Único arquivo, seções comentadas para navegação.
 */

const SERIF = "'Playfair Display', Georgia, serif";
const LABEL_CLASS = 'text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-label-green)]';
const HERO_VIDEO_SRC = '/videos/hero-background.mp4';

/**
 * Label com efeito de digitação: dispara ao entrar na viewport.
 */
function TypewriterLabel({ text, className, delay = 0.05 }: { text: string; className?: string; delay?: number }) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const chars = text.split('');
    const typeProgress = { i: 0 };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true }).fromTo(
        typeProgress,
        { i: 0 },
        {
          i: chars.length,
          duration: chars.length * 0.08,
          ease: 'none',
          onUpdate: () => {
            if (textRef.current) {
              textRef.current.textContent = chars.slice(0, Math.round(typeProgress.i)).join('');
            }
          },
        },
        delay,
      );

      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: 'top 85%',
        onEnter: () => tl.play(0),
        onEnterBack: () => tl.play(0),
        onLeaveBack: () => tl.progress(0).pause(),
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, [text, delay]);

  return (
    <span ref={wrapperRef} className={className}>
      <span ref={textRef} />
      <span className="hero-label-cursor" />
    </span>
  );
}

/** Seta indicando "role para baixo", usada no rodapé de algumas seções. */
function ScrollArrow() {
  return (
    <div className="flex justify-center pb-10 pt-4">
      <div style={{ animation: 'arrow-bounce 1.8s ease-in-out infinite' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-text-secondary)] opacity-50"
          />
        </svg>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Dashboard Inteligente',
    description: 'Visualize receitas, despesas e saldo em tempo real com gráficos interativos.',
  },
  {
    icon: Zap,
    title: 'IA Financeira',
    description: 'Converse com sua IA pessoal sobre seus gastos. Disponível no plano Pro.',
  },
  {
    icon: Target,
    title: 'Metas & Conquistas',
    description: 'Defina objetivos e ganhe conquistas à medida que evolui financeiramente.',
  },
  {
    icon: FileText,
    title: 'Importação OFX/CSV',
    description: 'Importe extratos do seu banco em segundos.',
  },
  {
    icon: Users,
    title: 'Visão Casal',
    description: 'Gerencie finanças a dois com visão consolidada (plano Duo).',
  },
  {
    icon: Shield,
    title: 'Integração Bancária',
    description: 'Sincronize suas contas automaticamente via Open Finance (plano Pro).',
  },
];

const STATS = [
  { value: '+400', label: 'Metas criadas' },
  { value: '+1K', label: 'Assinantes' },
  { value: '+15', label: 'Bancos integrados' },
  { value: '4.8★', label: 'Avaliação média' },
];

const TESTIMONIALS = [
  { stars: '★★★★★', text: 'Consigo saber quais gastos eram desnecessariamente caros e cortei R$400 em um mês.', author: 'Maria Julia Moretti' },
  { stars: '★★★★★', text: 'Tudo que compro eu registro, agora sei que os pequenos 10 reais somados viram centenas perdidas por mês.', author: 'Nicollas Malheiro Vieira' },
  { stars: '★★★★★', text: 'Comecei a utilizar o plano casal com meu marido e estamos ansiosos para alcançar a meta da viagem no fim do ano!', author: 'Silvia Andreia Calbaiser' },
  { stars: '★★★★★', text: 'Parei de fazer compras impulsivas quando comecei a pedir conselhos para a IA baseado no meu histórico e metas.', author: 'Avani Dias' },
  { stars: '★★★★★', text: 'Com todas as contas cadastradas fica mais fácil não esquecer de pagar nenhuma.', author: 'Nardele Barbosa' },
  { stars: '★★★★☆', text: 'Ferramenta muito fácil de usar.', author: 'Marcos Roberto' },
  { stars: '★★★★★', text: 'Bem melhor do que ficar criando grupo no WhatsApp com a minha namorada para dividir contas.', author: 'Gabriel Vieira' },
  { stars: '★★★★★', text: 'Sistema está de graça pelo que entrega.', author: 'Luis Henrique' },
];

type BillingCycle = 'monthly' | 'annual';

interface Plan {
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  annualTotal: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Basic',
    priceMonthly: 'R$19,90',
    priceAnnual: 'R$15,90',
    annualTotal: 'R$190,80/ano',
    description: 'Controle manual completo das suas finanças.',
    features: ['Dashboard configurável', 'Metas de poupança', 'Importação OFX/CSV', 'Gamificação completa'],
    highlighted: false,
  },
  {
    name: 'Pro',
    priceMonthly: 'R$29,90',
    priceAnnual: 'R$23,92',
    annualTotal: 'R$287,04/ano',
    description: 'Tudo do Basic, com IA e automação.',
    features: [
      'Tudo do Basic',
      'IA financeira (15 consultas/dia)',
      'Integração bancária automática',
      'Relatórios avançados',
    ],
    highlighted: true,
  },
  {
    name: 'Duo',
    priceMonthly: 'R$39,90',
    priceAnnual: 'R$31,92',
    annualTotal: 'R$383,04/ano',
    description: 'Para casais que dividem a vida financeira.',
    features: ['Tudo do Pro', '2 usuários vinculados', 'Visão consolidada do casal', 'Metas compartilhadas'],
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    question: 'É seguro conectar meu banco ao inspect.finance?',
    answer: 'Sim. Usamos o protocolo Open Finance regulamentado pelo Banco Central do Brasil. Nunca armazenamos sua senha bancária — apenas lemos os dados com sua autorização.',
  },
  {
    question: 'Funciona com qual banco?',
    answer: 'Funciona com mais de 15 instituições: Nubank, Itaú, Bradesco, Inter, Banco do Brasil, Caixa, Santander, BTG Pactual, XP, Sicoob, Sicredi, Mercado Pago, PicPay, Stone e outros.',
  },
  {
    question: 'Preciso de cartão de crédito para começar?',
    answer: 'Não. No Basic, os 7 dias grátis não pedem cartão nem PIX — é só se cadastrar. Se preferir, também dá pra assinar o Basic já com cartão (renovação automática) ou PIX. Nos planos Pro e Duo não há teste — a cobrança do plano escolhido (cartão ou PIX, mensal ou o valor cheio anual) acontece direto na assinatura.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'No plano mensal, sim — cancele quando quiser direto pelo painel, sem multa, em qualquer um dos planos. No plano anual, o valor cheio é cobrado no ato da assinatura.',
  },
  {
    question: 'Como funciona os 7 dias grátis?',
    answer: 'O teste de 7 dias grátis é exclusivo do plano Basic, sem precisar de cartão ou PIX — é só criar a conta. Nos planos Pro e Duo a assinatura começa a valer (e a ser cobrada) imediatamente, sem período de teste.',
  },
  {
    question: 'Funciona para casal ou família?',
    answer: 'Sim. O plano Casal permite que dois usuários conectem suas contas e visualizem as finanças juntos em um dashboard compartilhado.',
  },
  {
    question: 'A IA realmente analisa meus gastos automaticamente?',
    answer: 'Sim. Após conectar suas contas, a IA categoriza seus gastos, identifica padrões e gera alertas sobre onde você pode economizar — tudo sem você precisar registrar nada manualmente.',
  },
];

/* ============================================================================
 * HEADER — fixo, transparente sobre o vídeo do Hero, vira vidro fosco claro
 * ao passar da Hero durante o scroll.
 * ========================================================================== */
function useHeaderScroll(heroId: string) {
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const y = window.scrollY || window.pageYOffset || 0;
      const hero = document.getElementById(heroId);
      const limit = hero ? hero.offsetHeight - 90 : 600;
      setScrolled(y > 40);
      setLight(y > limit);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => window.removeEventListener('scroll', onScroll);
  }, [heroId]);

  return { scrolled, light };
}

function Header() {
  const navigate = useNavigate();
  const goToPlan = useGoToPlan();
  const { scrolled, light } = useHeaderScroll('hero-section');

  const navLinks = [
    { label: 'Produto', href: '#features' },
    { label: 'Planos', href: '#pricing' },
    { label: 'Blog', href: '#' },
  ];

  const headerBg = scrolled ? (light ? 'rgba(224, 224, 224, 0.72)' : 'rgba(10, 10, 10, 0.52)') : 'transparent';
  const headerBlur = scrolled ? 'blur(16px) saturate(1.1)' : 'none';
  const headerBorder = scrolled ? (light ? 'rgba(26, 26, 26, 0.08)' : 'rgba(255, 255, 255, 0.08)') : 'transparent';
  const ink = light ? 'var(--color-text-primary)' : '#e9e9e4';
  const pillBorder = light ? 'rgba(26, 26, 26, 0.22)' : 'rgba(233, 233, 228, 0.24)';

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center px-6 sm:px-14"
      style={{
        height: 'clamp(58px, 9svh, 78px)',
        background: headerBg,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur,
        borderBottom: `1px solid ${headerBorder}`,
        color: ink,
        transition: 'background 0.5s ease, border-color 0.5s ease, color 0.5s ease',
      }}
    >
      <div className="flex w-full items-center justify-between">
        <span style={{ fontFamily: SERIF, whiteSpace: 'nowrap', color: 'inherit' }} className="text-[19px] font-normal sm:text-[25px]">
          Inspect Finance
        </span>
        <nav className="flex items-center gap-4 sm:gap-7" style={{ color: 'inherit' }}>
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    const target = document.querySelector<HTMLElement>(link.href);
                    if (target) {
                      e.preventDefault();
                      getLenis()?.scrollTo(target, { duration: 1.2 });
                    }
                  }
                }}
                className="text-sm opacity-80 transition-opacity hover:opacity-100"
                style={{ color: 'inherit' }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hidden rounded-full px-4 py-1.5 text-sm transition-colors sm:inline-flex"
            style={{ border: `1px solid ${pillBorder}`, color: 'inherit' }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => goToPlan()}
            className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-[#0A0A0A] transition-all hover:scale-105 hover:bg-[#76B0FF]"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ============================================================================
 * SEÇÃO 1 — HERO (vídeo de fundo escuro + efeito de digitação em etapas)
 * ========================================================================== */
const HERO_EYEBROW = 'Gestão financeira com IA';
const HERO_LEAD = 'Próxima estação:';
const HERO_SUB = 'O Inspect Finance reúne as ferramentas que você precisa para organizar, entender e cuidar do seu dinheiro.';
const HERO_PHRASES = ['Metas alcançadas', 'Saúde financeira', 'Investimentos', 'Economia'];

function useHeroTypewriter() {
  const [state, setState] = useState({ eyebrow: '', lead: '', phrase: '', sub: '', stage: 0, revealed: false });

  useEffect(() => {
    let dead = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(setTimeout(resolve, ms)));

    const type = async (key: 'eyebrow' | 'lead' | 'phrase' | 'sub', text: string, speed: number) => {
      for (let i = 1; i <= text.length; i++) {
        if (dead) return;
        setState((s) => ({ ...s, [key]: text.slice(0, i) }));
        await wait(speed + (text[i - 1] === ' ' ? 24 : 0));
      }
    };
    const erase = async (key: 'phrase', text: string, speed: number) => {
      for (let i = text.length - 1; i >= 0; i--) {
        if (dead) return;
        setState((s) => ({ ...s, [key]: text.slice(0, i) }));
        await wait(speed);
      }
    };

    async function loopPhrases() {
      let i = 0;
      await wait(2800);
      while (!dead) {
        const cur = HERO_PHRASES[i % HERO_PHRASES.length];
        await erase('phrase', cur, 52);
        if (dead) return;
        await wait(420);
        i++;
        const next = HERO_PHRASES[i % HERO_PHRASES.length];
        await type('phrase', next, 95);
        await wait(2800);
      }
    }

    async function run() {
      await wait(700);
      setState((s) => ({ ...s, stage: 1 }));
      await type('eyebrow', HERO_EYEBROW, 46);
      await wait(420);
      setState((s) => ({ ...s, stage: 2 }));
      await type('lead', HERO_LEAD, 95);
      await wait(360);
      setState((s) => ({ ...s, stage: 3 }));
      await type('phrase', HERO_PHRASES[0], 95);
      loopPhrases();
      await wait(520);
      setState((s) => ({ ...s, stage: 4 }));
      await type('sub', HERO_SUB, 26);
      await wait(500);
      if (dead) return;
      setState((s) => ({ ...s, stage: 5, revealed: true }));
    }

    run();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return state;
}

function HeroSection() {
  const goToPlan = useGoToPlan();
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const t = useHeroTypewriter();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => {
      const p = v.play();
      if (p && 'catch' in p) p.catch(() => {});
    };
    tryPlay();
    v.addEventListener('canplay', tryPlay, { once: true });
    const onVis = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const revealStyle = {
    opacity: t.revealed ? 1 : 0,
    transform: t.revealed ? 'none' : 'translateY(9px)',
    filter: t.revealed ? 'blur(0px)' : 'blur(5px)',
    transition: 'opacity 2.2s cubic-bezier(0.33, 0, 0.2, 1), transform 2.2s cubic-bezier(0.22, 1, 0.36, 1), filter 1.8s ease-out',
  };

  return (
    <section
      id="hero-section"
      className="relative flex min-h-[640px] w-full flex-col overflow-hidden bg-[#0c0d0c] text-[#e9e9e4]"
      style={{ minHeight: '100svh', paddingTop: 'clamp(58px, 9svh, 78px)' }}
    >
      {/* Vídeo de fundo com overlays escurecendo as bordas para o texto ficar legível. */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ animation: 'hero-video-fade-in 1.9s ease-out both' }}>
        <video
          ref={videoRef}
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: '62% 45%',
            filter: 'saturate(1.04) contrast(1.1) brightness(0.9)',
            transform: 'scale(1.04)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(9px) saturate(1.03)',
            WebkitBackdropFilter: 'blur(9px) saturate(1.03)',
            maskImage:
              'linear-gradient(90deg, #000 0%, #000 32%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 74%)',
            WebkitMaskImage:
              'linear-gradient(90deg, #000 0%, #000 32%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 74%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(12,13,12,0.78) 0%, rgba(12,13,12,0.62) 30%, rgba(12,13,12,0.34) 50%, rgba(12,13,12,0.08) 70%, rgba(12,13,12,0.22) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(12,13,12,0.62) 0%, rgba(12,13,12,0) 30%, rgba(12,13,12,0) 66%, rgba(12,13,12,0.66) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 95% at 72% 48%, rgba(12,13,12,0) 40%, rgba(10,15,6,0.5) 100%)' }}
        />
        <div className="absolute inset-0 bg-[#0c0d0c]" style={{ animation: 'hero-veil-fade 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both' }} />
      </div>

      <div className="relative z-[2] flex flex-1 flex-wrap items-stretch">
        <div
          className="flex flex-col justify-center gap-4 px-6 py-10 sm:px-14"
          style={{ flex: '2 1 300px', minWidth: 'min(100%, 288px)', maxWidth: 720 }}
        >
          <div className="flex min-h-[14px] items-center gap-[7px]">
            <span className="relative whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
              <span aria-hidden="true" className="invisible">{HERO_EYEBROW}</span>
              <span className="absolute inset-0">{t.eyebrow}</span>
            </span>
            <span className="hero-label-cursor" style={{ display: t.stage === 1 ? 'block' : 'none' }} />
          </div>

          <h1
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(30px, 3.4vw, 60px)', lineHeight: 1.06, letterSpacing: '-0.022em', maxWidth: '15ch' }}
            className="m-0 text-white"
          >
            <span className="relative block">
              <span aria-hidden="true" className="invisible">{HERO_LEAD}</span>
              <span className="absolute inset-0">
                {t.lead}
                <span className="hero-label-cursor" style={{ display: t.stage === 2 ? 'inline-block' : 'none' }} />
              </span>
            </span>
            <span className="relative block text-[var(--color-accent)]">
              <span aria-hidden="true" className="invisible">Saúde financeira</span>
              <span className="absolute inset-0 whitespace-nowrap">
                {t.phrase}
                <span className="hero-label-cursor" style={{ display: t.stage >= 3 ? 'inline-block' : 'none' }} />
              </span>
            </span>
          </h1>

          <p className="m-0 max-w-[38ch] text-sm leading-relaxed text-[#9b9b95]" style={{ minHeight: '3.2em' }}>
            {t.sub}
            <span className="hero-label-cursor" style={{ display: t.stage === 4 ? 'inline-block' : 'none' }} />
          </p>

          <div className="flex flex-wrap items-center gap-5" style={revealStyle}>
            <button
              ref={ctaRef}
              type="button"
              onClick={() => goToPlan()}
              onMouseEnter={() => gsap.to(ctaRef.current, { scale: 1.05, duration: 0.2, ease: 'power2.out' })}
              onMouseLeave={() => gsap.to(ctaRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#76B0FF]"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <span className="text-sm text-[#8b8b85]">7 dias grátis para testar</span>
          </div>
        </div>

        <div style={{ flex: '3 1 300px', minWidth: 0 }} />
      </div>

      <div className="relative z-[2] flex items-center justify-center pb-6 pt-2" style={{ opacity: t.revealed ? 1 : 0, transition: 'opacity 2.4s ease-out 1.1s' }}>
        <ScrollArrow />
      </div>
    </section>
  );
}

/* ============================================================================
 * SEÇÃO 2 — FEATURES (grid de cards simples, fundo claro)
 * ========================================================================== */
function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.fade-in-item',
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="flex min-h-screen flex-col justify-center bg-[var(--color-bg-white)] px-[6vw] py-28 sm:px-[10vw]"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="fade-in-item mx-auto max-w-2xl text-center">
          <TypewriterLabel text="Uma plataforma para suas finanças" className={LABEL_CLASS} />
          <h2
            style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.05 }}
            className="mt-3 text-[clamp(32px,4vw,52px)] text-[var(--color-text-primary)]"
          >
            Controle para cada gasto, cartão e decisão.
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="fade-in-item plan-glass plan-glass--static flex flex-col gap-3.5 p-6"
            >
              <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                <feature.icon className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <ScrollArrow />
      </div>
    </section>
  );
}

/* ============================================================================
 * SEÇÃO 3 — INSTITUCIONAL (texto + estatísticas) e depoimentos em carrossel
 * duplo (duas fileiras rolando em direções opostas).
 * ========================================================================== */
function BioSection() {
  const sectionRef = useFadeInOnScroll<HTMLElement>();
  const rowA = [...TESTIMONIALS.slice(0, 4), ...TESTIMONIALS.slice(0, 4)];
  const rowB = [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(4)];

  return (
    <section ref={sectionRef} className="bg-[var(--color-bg-white)]">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-[10vw] sm:py-32">
        <div className="fade-in-item flex flex-col gap-6">
          <h2
            style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.12, maxWidth: '22ch' }}
            className="text-[clamp(28px,3.3vw,50px)] text-[var(--color-text-primary)]"
          >
            Tenha o controle da sua vida financeira em um só lugar
          </h2>
          <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              O <strong className="font-medium text-[var(--color-text-primary)]">Inspect Finance</strong> é uma plataforma
              completa de controle e gestão das suas finanças pessoais, criada para tornar sua vida financeira mais
              simples, organizada e inteligente.
            </p>
            <p>
              Acompanhe suas <strong className="font-medium text-[var(--color-text-primary)]">receitas, despesas, contas
              e compromissos</strong> através de dashboards intuitivos, organize sua{' '}
              <strong className="font-medium text-[var(--color-text-primary)]">agenda financeira</strong>, defina{' '}
              <strong className="font-medium text-[var(--color-text-primary)]">metas</strong> e tenha uma visão clara da
              sua saúde financeira.
            </p>
            <p>
              Com o auxílio da <strong className="font-medium text-[var(--color-text-primary)]">Inteligência
              Artificial</strong>, o Inspect Finance analisa seus dados e oferece{' '}
              <strong className="font-medium text-[var(--color-text-primary)]">insights e recomendações
              personalizadas</strong>, ajudando você a entender seus hábitos e tomar decisões mais conscientes sobre o
              seu dinheiro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-[var(--color-border)] pt-5 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <span style={{ fontFamily: SERIF }} className="text-[clamp(24px,2.2vw,34px)] leading-none text-[var(--color-text-primary)]">
                  {stat.value}
                </span>
                <span className="text-[11.5px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-16 sm:pb-24">
        <div className="fade-in-item flex items-center justify-center gap-2 pb-2">
          <TypewriterLabel text="Quem já embarcou" className={LABEL_CLASS} />
        </div>
        <div className="testimonial-marquee">
          <div className="testimonial-track testimonial-track--a">
            {rowA.map((r, i) => (
              <figure key={`a-${i}`} className="testimonial-card">
                <span className="text-xs tracking-[0.1em] text-[var(--color-label-green)]">{r.stars}</span>
                <blockquote className="m-0 text-[14.5px] leading-relaxed text-[#3a3d38]">{r.text}</blockquote>
                <figcaption className="text-[11.5px] uppercase tracking-[0.16em] text-[#8b8e88]">{r.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="testimonial-marquee">
          <div className="testimonial-track testimonial-track--b">
            {rowB.map((r, i) => (
              <figure key={`b-${i}`} className="testimonial-card">
                <span className="text-xs tracking-[0.1em] text-[var(--color-label-green)]">{r.stars}</span>
                <blockquote className="m-0 text-[14.5px] leading-relaxed text-[#3a3d38]">{r.text}</blockquote>
                <figcaption className="text-[11.5px] uppercase tracking-[0.16em] text-[#8b8e88]">{r.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function useFadeInOnScroll<T extends HTMLElement>(selector = '.fade-in-item') {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [selector]);

  return ref;
}

/* ============================================================================
 * SEÇÃO 4 — PRICING (grid estático com destaque no plano popular)
 * ========================================================================== */
function PricingSection() {
  const goToPlan = useGoToPlan();
  const sectionRef = useFadeInOnScroll<HTMLElement>();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" ref={sectionRef} className="bg-[var(--color-bg-white)] px-6 py-24 sm:px-[10vw] sm:py-[100px]">
      <div className="mx-auto max-w-6xl">
        <div className="fade-in-item text-center">
          <TypewriterLabel text="Planos" className={LABEL_CLASS} />
          <h2
            style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.05 }}
            className="mt-3 text-[clamp(30px,4vw,58px)] text-[var(--color-text-primary)]"
          >
            Planos simples, sem surpresas.
          </h2>
          <p className="mt-3 text-[14.5px] text-[var(--color-text-secondary)]">Teste de 7 dias grátis apenas no plano Basic.</p>

          <div className="mx-auto mt-8 inline-flex items-center gap-3">
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                billingCycle === 'monthly' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
              )}
            >
              Mensal
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={billingCycle === 'annual'}
                onChange={(e) => setBillingCycle(e.target.checked ? 'annual' : 'monthly')}
              />
              <span className="slider" />
            </label>
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                billingCycle === 'annual' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
              )}
            >
              Anual <span className="text-[var(--color-label-green)]">(-20%)</span>
            </span>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                'fade-in-item plan-glass plan-glass--static relative flex flex-col gap-5 p-8',
                plan.highlighted && 'plan-glass--highlighted',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[#0A0A0A]">
                  Mais popular
                </span>
              )}

              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{plan.name}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{plan.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: SERIF, fontWeight: 400 }} className="text-4xl text-[var(--color-text-primary)]">
                    {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">/mês</span>
                </div>
                <p className={cn('mt-1 text-xs text-[var(--color-text-secondary)]', billingCycle === 'annual' ? 'opacity-100' : 'opacity-0')}>
                  cobrado {plan.annualTotal}
                </p>
              </div>

              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-label-green)]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => goToPlan({ plan: plan.name.toLowerCase(), billingCycle })}
                className={cn(
                  'group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all hover:scale-105',
                  plan.highlighted
                    ? 'bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#76B0FF]'
                    : 'border border-[var(--color-bg-dark)] text-[var(--color-text-primary)] hover:bg-black/5',
                )}
              >
                {plan.name === 'Basic' ? 'Começar grátis' : 'Assinar agora'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * SEÇÃO 5 — FAQ (acordeão)
 * ========================================================================== */
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useFadeInOnScroll<HTMLElement>();

  return (
    <section id="faq" ref={sectionRef} className="bg-[var(--color-bg-white)] px-6 py-24 sm:px-[10vw]">
      <div className="fade-in-item mx-auto max-w-3xl">
        <span className={LABEL_CLASS}>FAQ</span>
        <h2
          style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.05 }}
          className="mt-3 text-[clamp(28px,3.5vw,44px)] text-[var(--color-text-primary)]"
        >
          Dúvidas frequentes.
        </h2>

        <div className="mt-12 divide-y divide-[var(--color-border)]">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-5">
              <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex w-full items-center justify-between gap-4 text-left">
                <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{item.question}</span>
                <span
                  className="shrink-0 text-[var(--color-text-secondary)] transition-transform duration-300"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </button>
              {openIndex === i && <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>

      <ScrollArrow />
    </section>
  );
}

/* ============================================================================
 * SEÇÃO 6 — CTA FINAL
 * ========================================================================== */
function FinalCtaSection() {
  const goToPlan = useGoToPlan();
  const ctaRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="relative overflow-hidden bg-white px-6 py-28 sm:px-[10vw] sm:py-32" style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute',
          left: '-570px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 950,
          height: 950,
          animation: 'blob-morph 22s ease-in-out infinite',
          backgroundColor: 'var(--color-bg-green-dark)',
          zIndex: 1,
        }}
      />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(32px, 4.2vw, 62px)', letterSpacing: '-0.022em', lineHeight: 1.08, maxWidth: '16ch' }}
          className="mx-auto text-[var(--color-text-primary)]"
        >
          Controle seu dinheiro. Transforme suas decisões.
        </h2>
        <p className="mt-4 text-base text-[var(--color-text-secondary)]">
          Tenha uma visão completa da sua vida financeira, acompanhe suas metas, organize suas contas e receba insights
          inteligentes para tomar decisões melhores. Tudo em um só lugar.
        </p>
        <button
          ref={ctaRef}
          type="button"
          onClick={() => goToPlan()}
          onMouseEnter={() => gsap.to(ctaRef.current, { scale: 1.05, duration: 0.2, ease: 'power2.out' })}
          onMouseLeave={() => gsap.to(ctaRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })}
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-10 py-4 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#76B0FF]"
        >
          Começar 7 dias grátis
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Cancele quando quiser no plano mensal</p>

        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Também atendemos empresas.{' '}
            <a href="mailto:contato@inspect.finance" className="font-semibold text-[var(--color-bg-green-dark)] underline">
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * FOOTER
 * ========================================================================== */
function Footer() {
  return (
    <footer className="relative bg-[var(--color-bg-dark)] px-6 pb-8 pt-10 sm:px-[10vw]" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', zIndex: 10 }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-4">
        <div>
          <span style={{ fontFamily: SERIF, fontWeight: 400 }} className="text-base text-white">
            inspect.finance
          </span>
          <p className="mt-3 max-w-[220px] text-[13px] text-white/45">Controle e inteligência financeira pessoal para o mercado brasileiro.</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Produto</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li><a href="#features" className="transition-colors hover:text-white">Funcionalidades</a></li>
            <li><a href="#pricing" className="transition-colors hover:text-white">Preços</a></li>
            <li><a href="#" className="transition-colors hover:text-white">Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Empresa</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li><a href="#" className="transition-colors hover:text-white">Sobre</a></li>
            <li><a href="mailto:contato@inspect.finance" className="transition-colors hover:text-white">Contato</a></li>
            <li><Link to="/privacidade" className="transition-colors hover:text-white">LGPD</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li><Link to="/termos" className="transition-colors hover:text-white">Termos</Link></li>
            <li><Link to="/privacidade" className="transition-colors hover:text-white">Privacidade</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/35">
        © {new Date().getFullYear()} inspect.finance. Todos os direitos reservados.
      </div>
    </footer>
  );
}

/* ============================================================================
 * PÁGINA
 * ========================================================================== */
export function LandingPage() {
  useEffect(() => {
    if (window.location.hash !== '#pricing') return;
    const timeout = setTimeout(() => {
      const lenis = getLenis();
      const target = document.querySelector('#pricing');
      if (lenis && target) lenis.scrollTo(target as HTMLElement);
      else target?.scrollIntoView();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-white)]">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BioSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <Footer />
    </div>
  );
}
