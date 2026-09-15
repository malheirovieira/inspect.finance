import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check, FileText, Shield, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLenis } from '@/hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

/**
 * Landing page — identidade visual Solidroad.
 * Paleta e tokens: ver bloco "Landing page (identidade visual Solidroad)" em
 * src/styles/tokens.css (--color-bg-dark, --color-accent, etc.) — consumidos
 * aqui via arbitrary values do Tailwind (`bg-[var(--color-bg-dark)]` etc.).
 * Tipografia: Playfair Display 400 (headings/citações/números de destaque,
 * aplicada via inline style — mesma família do `font-heading` global) +
 * Cormorant Garamond 300 (Proposta e CTA final, contraste tipográfico
 * proposital nessas duas seções) + Inter (body, já é a fonte padrão de
 * <body>).
 * Único arquivo, seções comentadas para navegação.
 */

const SERIF = "'Playfair Display', Georgia, serif";
const PROPOSAL_SERIF = "'Cormorant Garamond', Georgia, serif";
const LABEL_CLASS = 'text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-label-green)]';
const HERO_LABEL_TEXT = 'Gestão financeira com IA';
const LABEL_TYPE_DELAY = 0.05;
const LABEL_TYPE_SPEED = 0.08;

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

/**
 * Label com efeito de digitação (mesmo mecanismo do rótulo da Hero): dispara
 * ao entrar na viewport e começa a digitar `LABEL_TYPE_DELAY` segundos depois
 * — tempo suficiente para o texto principal da seção já ter aparecido.
 */
function TypewriterLabel({ text, className, delay = LABEL_TYPE_DELAY }: { text: string; className?: string; delay?: number }) {
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
          duration: chars.length * LABEL_TYPE_SPEED,
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
      <div
        style={{
          animation: 'arrow-bounce 1.8s ease-in-out infinite',
        }}
      >
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

const LOGO_BAR_ITEMS = [
  { name: 'Nubank', file: 'nubank.svg' },
  { name: 'Inter', file: 'inter.svg' },
  { name: 'Itaú', file: 'itau.svg' },
  { name: 'Bradesco', file: 'bradesco.svg' },
  { name: 'Santander', file: 'santander.svg' },
  { name: 'Caixa', file: 'caixa.svg' },
  { name: 'Banco do Brasil', file: 'banco-do-brasil.svg' },
  { name: 'XP', file: 'xp.svg' },
  { name: 'C6 Bank', file: 'c6bank.svg' },
  { name: 'Mercado Pago', file: 'mercado-pago.svg' },
  { name: 'PicPay', file: 'picpay.svg' },
  { name: 'Neon', file: 'neon.png' },
  { name: 'Next', file: 'next.svg' },
  { name: 'BTG Pactual', file: 'btg-pactual.svg' },
  { name: 'Sicoob', file: 'sicoob.svg' },
  { name: 'Sicredi', file: 'sicredi.svg' },
  { name: 'Safra', file: 'safra.svg' },
  { name: 'Original', file: 'original.svg' },
  { name: 'PagBank', file: 'pagbank.svg' },
  { name: 'Banco Pan', file: 'banco-pan.svg' },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Dashboard Inteligente',
    description: 'Visualize receitas, despesas e saldo em tempo real com gráficos interativos.',
    detail:
      'Widgets configuráveis mostram saldo, receitas, despesas e evolução mensal em gráficos interativos. Filtre por conta, cartão ou categoria e veja para onde seu dinheiro está indo em tempo real.',
  },
  {
    icon: Zap,
    title: 'IA Financeira',
    description: 'Converse com sua IA pessoal sobre seus gastos. Disponível no plano Pro.',
    detail:
      'Converse em linguagem natural com uma IA que já conhece seus últimos 90 dias de transações, metas e contas. Ela categoriza gastos automaticamente e sugere onde economizar. Até 15 consultas por dia no plano Pro.',
  },
  {
    icon: Target,
    title: 'Metas & Conquistas',
    description: 'Defina objetivos e ganhe conquistas à medida que evolui financeiramente.',
    detail:
      'Crie metas de poupança com prazo e valor, acompanhe o progresso em tempo real e desbloqueie conquistas conforme cria bons hábitos financeiros — uma forma de gamificação para manter a disciplina.',
  },
  {
    icon: Shield,
    title: 'Integração Bancária',
    description: 'Sincronize suas contas automaticamente via Open Finance (plano Pro).',
    detail:
      'Conecte seus bancos via Open Finance, regulamentado pelo Banco Central. Transações são importadas e categorizadas automaticamente, sem precisar digitar nada — nunca armazenamos sua senha bancária.',
  },
  {
    icon: FileText,
    title: 'Importação OFX/CSV',
    description: 'Importe extratos do seu banco em segundos.',
    detail:
      'Não usa Open Finance? Sem problema: exporte o extrato do seu banco em OFX ou CSV e importe em segundos. O sistema reconhece e categoriza as transações automaticamente, disponível em todos os planos.',
  },
  {
    icon: Users,
    title: 'Visão Casal',
    description: 'Gerencie finanças a dois com visão consolidada (plano Duo).',
    detail:
      'No plano Duo, dois usuários conectam suas contas e cartões e visualizam um dashboard único e consolidado — ideal para casais que dividem contas, metas de viagem ou orçamento doméstico juntos.',
  },
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
  order: string;
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
    order: 'order-2 md:order-1',
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
    order: 'order-1 md:order-2',
  },
  {
    name: 'Duo',
    priceMonthly: 'R$39,90',
    priceAnnual: 'R$31,92',
    annualTotal: 'R$383,04/ano',
    description: 'Para casais que dividem a vida financeira.',
    features: ['Tudo do Pro', '2 usuários vinculados', 'Visão consolidada do casal'],
    highlighted: false,
    order: 'order-3 md:order-3',
  },
];

/* ============================================================================
 * NAVBAR — vidro fosco (transparente + blur) fixo, sempre com o mesmo estilo
 * do topo, mesmo durante o scroll — nunca vira um fundo sólido opaco.
 * ========================================================================== */
function Navbar() {
  const navigate = useNavigate();
  const navLinks = [
    { label: 'Produto', href: '#features' },
    { label: 'Planos', href: '#pricing' },
    { label: 'Blog', href: '#' },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center px-16"
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 1px 16px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex w-full items-center justify-between">
        <span
          style={{ fontFamily: SERIF, whiteSpace: 'nowrap' }}
          className="text-[18px] font-normal text-[var(--color-text-primary)] sm:text-[26px]"
        >
          Inspect Finance
        </span>
        <nav className="flex items-center gap-8">
          <div className="hidden items-center gap-7 sm:flex">
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
                className="text-sm text-[var(--color-text-primary)]/70 transition-colors hover:text-[var(--color-text-primary)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm text-[var(--color-text-primary)] transition-colors hover:border-black/40"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => navigate('/cadastro')}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-[#0A0A0A] transition-all hover:scale-105 hover:bg-[#D9FF33]"
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
 * SEÇÃO 1 — HERO (fundo branco, sem foto)
 * ========================================================================== */
function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const noCardRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const labelChars = HERO_LABEL_TEXT.split('');
      const typeProgress = { i: 0 };

      const tl = gsap
        .timeline({ paused: true, delay: 0.2 })
        .fromTo(
          [titleRef.current, subtitleRef.current, ctaRef.current, noCardRef.current],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.18 },
        )
        .fromTo(
          typeProgress,
          { i: 0 },
          {
            i: labelChars.length,
            duration: labelChars.length * LABEL_TYPE_SPEED,
            ease: 'none',
            onUpdate: () => {
              if (labelRef.current) {
                labelRef.current.textContent = labelChars.slice(0, Math.round(typeProgress.i)).join('');
              }
            },
          },
          `+=${LABEL_TYPE_DELAY}`,
        );

      tl.play();

      // Refaz sempre que a Hero volta a aparecer na tela (scroll para cima),
      // resetando quando ela sai (scroll para baixo).
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        onEnterBack: () => tl.restart(),
        onLeave: () => tl.progress(0).pause(),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen min-h-[640px] w-full items-center overflow-hidden bg-white"
    >
      <div className="relative z-10 pl-[10vw] pr-6">
        <span className={cn('mb-6 block', LABEL_CLASS)}>
          <span ref={labelRef} />
          <span className="hero-label-cursor" />
        </span>
        <h1
          ref={titleRef}
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 'clamp(40px, 5.5vw, 72px)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
          }}
          className="text-[var(--color-text-primary)]"
        >
          A verdadeira nobreza se dá
          <br />
          à capacidade de poupar o
          <br />
          presente para garantir o futuro!
        </h1>
        <p ref={subtitleRef} className="mt-5 max-w-[420px] text-base leading-relaxed text-[var(--color-text-secondary)]">
          Acompanhe seus cartões, entenda seus gastos com IA e tome controle real do seu dinheiro.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <button
            ref={ctaRef}
            type="button"
            onClick={() => navigate('/cadastro')}
            onMouseEnter={() => gsap.to(ctaRef.current, { scale: 1.05, duration: 0.2, ease: 'power2.out' })}
            onMouseLeave={() => gsap.to(ctaRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })}
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D9FF33]"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <span ref={noCardRef} className="text-sm text-[var(--color-text-secondary)]">7 dias grátis para testar</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center">
        <ScrollArrow />
      </div>

      <LogoBar />
    </section>
  );
}

/* ============================================================================
 * BARRA DE LOGOS — carrossel infinito (CSS puro), ancorado no rodapé do Hero.
 * ========================================================================== */
function LogoBar() {
  return (
    <div className="marquee-wrapper absolute inset-x-0 bottom-0 z-10">
      <div className="marquee-track">
        <div className="marquee-set">
          {LOGO_BAR_ITEMS.map((item, i) => (
            <img
              key={`a-${i}`}
              src={`/images/logos/${item.file}`}
              alt={item.name}
              className="marquee-item"
            />
          ))}
        </div>
        <div className="marquee-set">
          {LOGO_BAR_ITEMS.map((item, i) => (
            <img
              key={`b-${i}`}
              src={`/images/logos/${item.file}`}
              alt={item.name}
              className="marquee-item"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * SEÇÃO 2 — FEATURES (grid de cards com ícone, fundo branco)
 * ========================================================================== */
function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.fade-in-item',
        {
          opacity: 0,
          x: -60,
          filter: 'blur(8px)',
        },
        {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="flex min-h-screen flex-col justify-center bg-[var(--color-bg-white)] px-[10vw] py-28"
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
          {FEATURES.map((feature, i) => {
            const isHovered = hoveredIndex === i;
            const isDimmed = hoveredIndex !== null && !isHovered;

            return (
              <div
                key={feature.title}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ zIndex: isHovered ? 20 : 1 }}
                className={cn(
                  'fade-in-item plan-glass plan-glass--static relative p-6 transition-opacity duration-700 ease-out',
                  isDimmed && 'md:opacity-60',
                )}
              >
                <div className={cn('transition-opacity duration-700 ease-out', isHovered && 'md:opacity-0')}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                    <feature.icon className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                </div>

                {/* Painel expandido — sempre montado (evita salto no grid),
                    só fica visível/opaco no card em hover, crescendo a partir
                    do centro (para cima, para baixo e para os lados) com um
                    empurrão extra para cima (-translate-y). */}
                <div
                  className={cn(
                    'plan-glass-overlay pointer-events-none z-10 origin-center p-6 opacity-0 shadow-2xl transition-all duration-700 ease-out',
                    isHovered && 'md:-translate-y-3 md:scale-[1.16] md:opacity-100',
                  )}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                    <feature.icon className="h-5 w-5 text-[var(--color-text-primary)]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                    {feature.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <ScrollArrow />
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: 'Maria Julia Moretti', text: 'Consigo saber quais gastos eram desnecessariamente caros e cortei R$400 em um mês.' },
  { name: 'Nicollas Malheiro Vieira', text: 'Tudo que compro eu registro, agora sei que não é um pequeno 10 reais e sim os pequenos 10 reais que somados viram centenas de reais perdidos por mês.' },
  { name: 'Silvia Andreia Calbaiser', text: 'Comecei a utilizar o plano casal com meu marido e estamos ansiosos para alcançar a meta da viagem no fim do ano!!!' },
  { name: 'Avani Dias', text: 'Parei de fazer compras impulsivas quando comecei a pedir conselhos para a IA baseado no meu histórico e metas, me ajuda muito no dia a dia.' },
  { name: 'Nardele Barbosa', text: 'Com todas as contas cadastradas fica mais fácil não esquecer de pagar nenhuma.' },
  { name: 'Marcos Roberto', text: 'Ferramenta muito fácil de usar.' },
  { name: 'Gabriel Vieira', text: 'Bem melhor do que ficar criando grupo no WhatsApp com a minha namorada para dividir contas.' },
  { name: 'Luis Henrique', text: 'Sistema está de graça pelo que entrega.' },
];

function GreenSection() {
  const [index, setIndex] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = textRef.current;
      if (!el) return;

      gsap.to(el, {
        y: 50, opacity: 0,
        filter: 'blur(6px)',
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          setIndex(prev => (prev + 1) % TESTIMONIALS.length);
          gsap.fromTo(el,
            { y: -50, opacity: 0, filter: 'blur(6px)' },
            { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
          );
        },
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: '10vw',
        paddingRight: '10vw',
        scrollSnapAlign: 'start',
      }}
    >
      {/* Large green circle — right side, partially off-screen */}
      <div
        style={{
          position: 'absolute',
          right: '-780px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 1420,
          height: 1420,
          animation: 'blob-morph 22s ease-in-out infinite',
          backgroundColor: 'var(--color-bg-green-dark)',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingLeft: 90,
        }}
      >
        {/* Rotating testimonial */}
        <div ref={textRef} style={{ width: 420, zIndex: 20 }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 300,
            fontSize: '2.10rem',
            color: '#E8F5D0',
            lineHeight: 1.3,
            marginBottom: '0.75rem',
          }}>
            "{TESTIMONIALS[index].text}"
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            — {TESTIMONIALS[index].name}
          </p>
        </div>
      </div>

      {/* Texto institucional — reposicionado à esquerda, com scroll interno
          próprio (ver .green-text-scroll em globals.css e o atributo
          data-lenis-prevent abaixo). */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 660 }}>
        <div
          data-lenis-prevent
          className="green-text-scroll"
          style={{ maxHeight: 'min(64vh, 560px)', overflowY: 'auto', paddingRight: '1.25rem' }}
        >
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 400,
              fontSize: 'clamp(2.2rem, 3.2vw, 3rem)',
              color: '#1A1A1A',
              lineHeight: 1.25,
            }}
          >
            Tenha o controle da sua vida financeira em um só lugar
          </h2>
          <p style={{ marginTop: '1.25rem', fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', lineHeight: 1.7, color: '#444' }}>
            O <strong>Inspect Finance</strong> é uma plataforma completa de controle e gestão das
            suas finanças pessoais, criada para tornar sua vida financeira mais simples,
            organizada e inteligente.
          </p>
          <p style={{ marginTop: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', lineHeight: 1.7, color: '#444' }}>
            Acompanhe suas <strong>receitas, despesas, contas e compromissos</strong> através de
            dashboards intuitivos, organize sua <strong>agenda financeira</strong>, defina e
            acompanhe <strong>metas</strong>, monitore sua economia e tenha uma visão clara de
            como está sua saúde financeira.
          </p>
          <p style={{ marginTop: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', lineHeight: 1.7, color: '#444' }}>
            Com o auxílio da <strong>Inteligência Artificial</strong>, o Inspect Finance analisa
            seus dados e oferece <strong>insights e recomendações personalizadas</strong>,
            ajudando você a entender seus hábitos financeiros e tomar decisões mais conscientes
            sobre o seu dinheiro.
          </p>
          <p style={{ marginTop: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', lineHeight: 1.7, color: '#444' }}>
            Com a <strong>integração bancária</strong>, suas movimentações podem ser acompanhadas
            de forma prática e centralizada, reduzindo o trabalho manual e mantendo suas
            informações financeiras sempre atualizadas.
          </p>
          <p
            style={{
              marginTop: '1.25rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.2rem',
              lineHeight: 1.7,
              color: '#1A1A1A',
              fontWeight: 600,
            }}
          >
            Menos planilhas. Menos preocupação. Mais controle sobre o seu dinheiro.
          </p>
          <p
            style={{
              marginTop: '0.75rem',
              marginBottom: '0.25rem',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.3rem',
              fontWeight: 600,
              color: 'var(--color-bg-green-dark)',
            }}
          >
            Inspect Finance — sua vida financeira sob controle.
          </p>
        </div>

        {/* Lista de métricas — alinhadas horizontalmente */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.75rem' }}>
          {[
            { value: '+400', label: 'metas criadas' },
            { value: '+1K', label: 'assinantes' },
            { value: '+15', label: 'bancos integrados' },
            { value: '4.8★', label: 'avaliação média' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 300,
                fontSize: '1.5rem',
                color: 'var(--color-bg-green-dark)',
              }}>{stat.value}</span>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

/* ============================================================================
 * SEÇÃO 5 — PRICING (lógica intocada, apenas herdando o layout já existente)
 * ========================================================================== */
function PricingSection() {
  const navigate = useNavigate();
  const sectionRef = useFadeInOnScroll<HTMLElement>();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plansOpen, setPlansOpen] = useState(false);

  return (
    <section id="pricing" ref={sectionRef} className="bg-[var(--color-bg-white)] px-[10vw] py-[100px]">
      <div className="mx-auto max-w-6xl">
        <div className="fade-in-item text-center">
          <TypewriterLabel text="Planos" className={LABEL_CLASS} />
          <h2
            style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.05 }}
            className="mt-3 text-[clamp(32px,4vw,52px)] text-[var(--color-text-primary)]"
          >
            Planos simples, sem surpresas.
          </h2>
          <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
            Teste de 7 dias grátis apenas no plano Basic.
          </p>

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

        <div
          className={cn(
            'plan-stack mt-14 grid grid-cols-1 items-center gap-8 md:grid-cols-3',
            plansOpen && 'is-open',
          )}
          onMouseEnter={() => setPlansOpen(true)}
        >
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              style={
                {
                  '--r': (i - 1) * 3,
                  '--closeX': `${(1 - i) * 130}px`,
                  '--openX': `${(i - 1) * 24}px`,
                  zIndex: plan.highlighted ? 3 : i === 0 ? 2 : 1,
                } as CSSProperties
              }
              className={cn(
                'plan-glass relative cursor-pointer p-10 md:mx-auto md:w-[340px]',
                plan.order,
                plan.highlighted && 'plan-glass--highlighted',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[#0A0A0A]">
                  Mais popular
                </span>
              )}

              <h3 className="font-semibold text-[var(--color-text-primary)]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span
                  style={{ fontFamily: SERIF, fontWeight: 400 }}
                  className="text-4xl text-[var(--color-text-primary)]"
                >
                  {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">/mês</span>
              </div>
              <p
                className={cn(
                  'mt-1 text-xs text-[var(--color-text-secondary)]',
                  billingCycle === 'annual' ? 'opacity-100' : 'opacity-0',
                )}
              >
                cobrado {plan.annualTotal}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-label-green)]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => navigate('/cadastro', { state: { plan: plan.name.toLowerCase(), billingCycle } })}
                className={cn(
                  'group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all hover:scale-105',
                  plan.highlighted
                    ? 'bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#D9FF33]'
                    : 'border border-[var(--color-bg-dark)] text-[var(--color-text-primary)] hover:bg-black/5',
                )}
              >
                {plan.name === 'Basic' ? 'Começar grátis' : 'Assinar agora'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    answer: 'Depende do plano. No Basic, pedimos os dados do cartão só para liberar os 7 dias grátis. Nos planos Pro e Duo não há teste — a cobrança do plano escolhido (mensal ou 12x no anual) começa direto na assinatura.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'No plano mensal, sim — cancele quando quiser direto pelo painel, sem multa, em qualquer um dos planos. No plano anual, as 12 parcelas são cobradas no ato da assinatura (ou ao final do teste, no caso do Basic).',
  },
  {
    question: 'Como funciona os 7 dias grátis?',
    answer: 'O teste de 7 dias grátis é exclusivo do plano Basic — você usa todas as funcionalidades com o cartão já cadastrado e pode cancelar antes do fim do teste para não ser cobrado. Nos planos Pro e Duo a assinatura começa a valer (e a ser cobrada) imediatamente, sem período de teste.',
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

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useFadeInOnScroll<HTMLElement>();

  return (
    <section ref={sectionRef} className="bg-[var(--color-bg-white)] px-[10vw] py-24">
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
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
                  {item.question}
                </span>
                <span className="shrink-0 text-[var(--color-text-secondary)] transition-transform duration-300"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                  +
                </span>
              </button>
              {openIndex === i && (
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ScrollArrow />
    </section>
  );
}

/* ============================================================================
 * SEÇÃO CTA FINAL
 * ========================================================================== */
function FinalCtaSection() {
  const navigate = useNavigate();
  const ctaRef = useRef<HTMLButtonElement>(null);

  return (
    <section
      className="relative overflow-hidden bg-white px-[10vw] py-32"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {/* Bola verde orgânica — lado esquerdo, parcialmente fora da tela */}
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

      {/* Conteúdo — centralizado na página */}
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          style={{
            fontFamily: PROPOSAL_SERIF,
            fontWeight: 300,
            fontSize: 'clamp(40px, 5vw, 68px)',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}
          className="text-[var(--color-text-primary)]"
        >
          Controle seu dinheiro.
          <br />
          Transforme suas decisões.
        </h2>
        <p className="mt-4 text-base text-[var(--color-text-secondary)]">
          Tenha uma visão completa da sua vida financeira, acompanhe suas metas, organize suas contas e
          receba insights inteligentes para tomar decisões melhores. Tudo em um só lugar.
        </p>
        <button
          ref={ctaRef}
          type="button"
          onClick={() => navigate('/cadastro')}
          onMouseEnter={() => gsap.to(ctaRef.current, { scale: 1.05, duration: 0.2, ease: 'power2.out' })}
          onMouseLeave={() => gsap.to(ctaRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })}
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-10 py-4 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D9FF33]"
        >
          Começar 7 dias grátis
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Cancele quando quiser no plano mensal</p>

        {/* Para empresas — chamada genérica */}
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
    <footer
      className="relative bg-[var(--color-bg-dark)] px-[10vw] pb-8 pt-10"
      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', zIndex: 10 }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-4">
        <div>
          <span style={{ fontFamily: SERIF, fontWeight: 400 }} className="text-base text-white">
            inspect.finance
          </span>
          <p className="mt-3 max-w-[220px] text-[13px] text-white/45">
            Controle e inteligência financeira pessoal para o mercado brasileiro.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Produto</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li>
              <a href="#features" className="transition-colors hover:text-white">
                Funcionalidades
              </a>
            </li>
            <li>
              <a href="#pricing" className="transition-colors hover:text-white">
                Preços
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-white">
                Blog
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Empresa</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li>
              <a href="#" className="transition-colors hover:text-white">
                Sobre
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-white">
                Contato
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-white">
                LGPD
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-[13px] text-white/55">
            <li>
              <a href="#" className="transition-colors hover:text-white">
                Termos
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-white">
                Privacidade
              </a>
            </li>
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
  return (
    <div className="min-h-screen bg-[var(--color-bg-white)]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <GreenSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <Footer />
    </div>
  );
}
