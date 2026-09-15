# CLAUDE.md — inspect.finance

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Não remova nem renomeie. Mantenha atualizado conforme o projeto evolui.

---

## Visão Geral do Projeto

**inspect.finance** é um SaaS de controle e inteligência financeira pessoal voltado ao mercado brasileiro.

Permite que usuários unifiquem múltiplas contas e cartões em um único lugar, acompanhem receitas, despesas, metas e investimentos, e recebam análises de saúde financeira via IA.

**Fundador / CEO:** Nicollas  
**Repositório:** monorepo (frontend + supabase)  
**Status atual:** Fase de configuração inicial — MVP em desenvolvimento

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Animações | Framer Motion |
| Backend / BaaS | Supabase (Auth + PostgreSQL + Edge Functions + Storage + Realtime) |
| Banco de Dados | PostgreSQL via Supabase com Row Level Security |
| Deploy | Vercel (frontend) |
| Pagamentos | AbacatePay (PIX nativo) |
| Email | Resend |
| IA | Google Gemini 1.5 Flash (free tier via Edge Function) |
| Rate Limiting / Cache | Upstash Redis |
| Analytics | PostHog |
| Integração Bancária | Pluggy API (apenas plano Pro — V1) |

---

## Estrutura de Pastas

```
inspect.finance/
├── CLAUDE.md                  ← este arquivo
├── docs/
│   ├── product.md             ← visão de produto, planos, preços
│   ├── architecture.md        ← decisões arquiteturais
│   ├── database.md            ← schema completo do banco
│   ├── security.md            ← auth, RLS, segurança
│   ├── billing.md             ← modelo de cobrança
│   ├── roadmap.md             ← MVP / V1 / V2
│   └── decisions.md           ← ADR — registro de decisões
├── src/
│   ├── components/            ← componentes React (shadcn/ui base)
│   ├── pages/                 ← páginas da aplicação
│   ├── hooks/                 ← custom hooks
│   ├── lib/                   ← utilitários, clientes (supabase, gemini, etc.)
│   ├── types/                 ← tipos TypeScript globais
│   └── styles/                ← tokens de design, variáveis CSS
├── supabase/
│   ├── migrations/            ← migrations SQL numeradas
│   ├── functions/             ← Edge Functions
│   └── seed.sql               ← dados iniciais (categorias padrão, achievements)
└── public/
```

---

## Convenções de Código

### Geral
- TypeScript strict mode: sempre
- Nenhum `any` sem comentário justificando
- Imports absolutos via path alias `@/` mapeado para `src/`
- Componentes: PascalCase (`TransactionCard.tsx`)
- Hooks: camelCase prefixado com `use` (`useTransactions.ts`)
- Utilitários: camelCase (`formatCurrency.ts`)
- Constantes: UPPER_SNAKE_CASE

### React
- Componentes funcionais com TypeScript: sempre
- Props tipadas com `interface` (não `type`) exceto quando houver union types
- Separar lógica de negócio em hooks — componentes só renderizam
- Evitar prop drilling além de 2 níveis — usar Context ou Zustand
- Estado global somente se realmente necessário

### Supabase
- Nunca chamar Supabase direto nos componentes — usar hooks customizados em `src/hooks/`
- Todas as queries devem respeitar RLS — nunca usar `service_role` no frontend
- Mutations sempre com tratamento de erro explícito
- Timestamps: sempre UTC no banco, converter para fuso do usuário no frontend

### Estilização
- Tailwind utility classes: preferido
- Sem CSS inline exceto valores dinâmicos (ex: cores geradas por usuário)
- Tokens de design centralizados em CSS Custom Properties em `src/styles/tokens.css`
- Dark mode: preparado via CSS variables — não use valores hardcoded de cor
- Responsivo: mobile-first em todos os componentes

### Nomenclatura do Banco (snake_case)
- Tabelas: plural (`transactions`, `accounts`, `goals`)
- Colunas: snake_case (`created_at`, `user_id`, `is_active`)
- FKs: `<tabela_referenciada_singular>_id` (ex: `account_id`, `category_id`)
- Timestamps: sempre `created_at`, `updated_at`, `deleted_at` (soft delete)

---

## Regras de Segurança — Obrigatórias

- **NUNCA** expor a `service_role` key no frontend ou em código commitado
- **NUNCA** desabilitar RLS em nenhuma tabela com dados de usuário
- **NUNCA** fazer queries sem filtro de `user_id` — o RLS é a segunda camada, não a única
- **NUNCA** logar dados financeiros em console em produção
- **NUNCA** armazenar chaves de API no código — apenas em variáveis de ambiente
- Soft delete em todos os dados financeiros — nunca deletar fisicamente uma transação
- Audit log obrigatório para INSERT, UPDATE, DELETE em tabelas financeiras

---

## Variáveis de Ambiente

```bash
# .env.local (nunca commitar)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_POSTHOG_KEY=

# Supabase Edge Functions (via Supabase Dashboard → Secrets)
GEMINI_API_KEY=
ABACATEPAY_API_KEY=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PLUGGY_CLIENT_ID=          # apenas quando integração bancária ativa (V1)
PLUGGY_CLIENT_SECRET=      # apenas quando integração bancária ativa (V1)
```

---

## Autenticação — Métodos Suportados

| Método | MVP | V1 |
|---|---|---|
| Email + senha | ✅ | ✅ |
| Google Social Login (Supabase OAuth) | ✅ | ✅ |
| MFA (TOTP) | ❌ | ✅ (opcional) |

**Google Login:** implementado via Supabase Auth → Providers → Google. Mesmo fluxo de sessão JWT, perfil criado automaticamente no primeiro login.  
**MFA:** não está no MVP. Entra no V1 como funcionalidade opcional que o usuário ativa nas configurações.

---

## Planos e Limites (para controle de acesso)

| Feature | Basic (R$19,90) | Pro (R$29,90) | Duo (R$39,90) |
|---|---|---|---|
| Dashboard configurável | ✅ | ✅ | ✅ |
| Gamificação | ✅ | ✅ | ✅ |
| Metas | ✅ | ✅ | ✅ |
| Importação OFX/CSV | ✅ | ✅ | ✅ |
| IA financeira | ❌ | ✅ | ✅ |
| Integração bancária auto | ❌ | ✅ | ✅ |
| Relatórios avançados | ❌ | ✅ | ✅ |
| Visão consolidada casal | ❌ | ❌ | ✅ |
| Limite IA queries/dia | — | 15 | 15 |

Trial: 14 dias em todos os planos — **sem exigir dados de pagamento**. Usuário escolhe o plano no cadastro e tem acesso imediato. E-mails de lembrete: D-11 (informativo), D-13 (urgência), D-14/expiração (CTA de upgrade).

---

## IA Financeira — Estratégia e Limites

**Modelo:** Gemini 1.5 Flash (free tier app-level via Edge Function `ai-financial-analysis`)  
**Exclusivo:** Plano Pro e Duo

### Contexto enviado em cada query
O sistema prompt inclui automaticamente (sem ação do usuário):
- Últimos 90 dias de transações (categorizadas)
- Contas ativas e saldos atuais
- Metas ativas e progresso
- Plano financeiro base (moeda, perfil)

### Rate Limiting (Upstash Redis)
- 15 queries/dia por usuário Pro (reset à meia-noite UTC)
- Contador armazenado em `profiles.ai_queries_today` (redundância)

### Resumo Semanal Automático
Todo domingo, Edge Function cron gera um resumo financeiro para usuários Pro ativos e exibe no dashboard na seção "Inteligência IA". Não consome quota das 15 queries diárias do usuário — gerado pela conta app.

---

## Rate Limiting Completo (Upstash Redis)

| Ação | Limite | Janela |
|---|---|---|
| Login por IP | 10 tentativas | 1 hora |
| Cadastro por IP | 5 tentativas | 1 hora |
| Queries IA por usuário | 15 | 1 dia |
| Import OFX/CSV por usuário | 20 | 1 dia |

---

## Infraestrutura e Custos (MVP)

| Serviço | Plano | Custo |
|---|---|---|
| Supabase | Free tier | R$0 |
| Vercel | Hobby | R$0 |
| Upstash Redis | Free tier | R$0 |
| PostHog | Free tier (1M eventos/mês) | R$0 |
| Resend | Free tier (3.000 emails/mês) | R$0 |
| Gemini 1.5 Flash | Free tier (1M tokens/dia) | R$0 |
| AbacatePay | ~0,99% por transação PIX | % do que entrar |
| Domínio inspect.finance | Anual | ~R$80/ano |

**Custo fixo mensal no MVP: R$0**. Custos só surgem com volume (AbacatePay por transação) ou ao escalar para planos pagos dos serviços.

---

## Moedas Suportadas

- Base: BRL (padrão)
- Adicionais: USD, EUR, GBP, ARS, BTC (configurável por usuário no onboarding)
- Transações armazenam: `currency` original + `amount` original + `amount_in_base_currency` + `exchange_rate`

---

## Design System — Referências

Landing page / Login: estética Solidroad.com (cream #FBF7EB, charcoal #2D2C29, neon #DBF400)  
Interior do app: XP Investimentos + Itaú (clean, profissional, foco em dados)  
Acento interno: verde-esmeralda `#00A878` (não usar neon #DBF400 dentro do app)  
Tipografia: Playfair Display (headings, landing) + Inter (body, app)  
Animações: Framer Motion  
Componentes base: shadcn/ui  
Ícones: Lucide React

---

## Roadmap Atual

Consulte `/docs/roadmap.md` para o detalhamento completo.

**MVP (em construção):**
1. Autenticação (email/senha via Supabase Auth)
2. Onboarding (parametrização inicial + plano)
3. Contas bancárias (cadastro manual)
4. Transações (receitas, despesas, transferências, parcelas)
5. Categorias (padrão + personalizadas)
6. Dashboard principal (widgets configuráveis)
7. Metas de poupança
8. Gamificação básica (conquistas)
9. IA financeira (plano Pro — Gemini 1.5 Flash)
10. Assinaturas (AbacatePay)

---

## Contexto para o Claude Code

Este projeto é desenvolvido por um fundador solo com suporte estratégico e arquitetural de um parceiro de IA. As decisões de produto, arquitetura, banco de dados e modelo de negócio já foram tomadas e estão documentadas em `/docs/`.

Antes de propor mudanças arquiteturais ou de modelo de dados, consulte os arquivos em `/docs/`. Se uma decisão importante não estiver documentada, pergunte antes de assumir.

O objetivo é um SaaS comercial real — não um projeto de portfólio. Cada decisão técnica deve considerar: custo de infraestrutura, segurança de dados financeiros, experiência do usuário e escalabilidade.
