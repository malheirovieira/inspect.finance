# Architecture — inspect.finance

## Visão Geral

Arquitetura **Supabase-first** para o MVP e V1. Sem servidor dedicado (Spring Boot) até que a complexidade de negócio justifique. Toda a lógica de backend roda em Edge Functions do Supabase.

```
┌─────────────────────────────────────────────────────┐
│                     USUÁRIO                         │
│              (Browser / Mobile Web)                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                    VERCEL                           │
│         React + TypeScript + Vite                   │
│         Tailwind + shadcn/ui + Framer Motion        │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼──────┐  ┌───▼────┐  ┌────▼──────────┐
│   Supabase    │  │ Upstash│  │   AbacatePay  │
│  ┌──────────┐ │  │ Redis  │  │  (Pagamentos) │
│  │   Auth   │ │  │ (Rate  │  └───────────────┘
│  ├──────────┤ │  │ Limit) │
│  │PostgreSQL│ │  └────────┘
│  │  + RLS   │ │
│  ├──────────┤ │  ┌────────┐
│  │  Edge    │─┼─►│Gemini  │
│  │Functions │ │  │Flash   │
│  ├──────────┤ │  │(IA)    │
│  │ Storage  │ │  └────────┘
│  ├──────────┤ │
│  │Realtime  │ │  ┌────────┐
│  └──────────┘ │  │ Resend │
└───────────────┘  │(Email) │
                   └────────┘
```

---

## Frontend

### Stack
- **React 18** — UI library
- **TypeScript** — tipagem estática obrigatória
- **Vite** — build tool (rápido, HMR eficiente)
- **Tailwind CSS** — utilitários de estilização
- **shadcn/ui** — componentes base não-opinativos (instala código, não dependência)
- **Framer Motion** — animações declarativas
- **React Router v6** — roteamento client-side
- **React Query (TanStack Query)** — cache de estado servidor, loading/error states
- **Zustand** — estado global leve (apenas o necessário)

### Estrutura de Roteamento
```
/                    → Landing page (pública)
/login               → Login
/cadastro            → Cadastro
/app                 → Layout autenticado
/app/dashboard       → Dashboard principal
/app/transactions    → Transações
/app/accounts        → Contas
/app/goals           → Metas
/app/achievements    → Conquistas
/app/ai              → Chat IA (apenas Pro)
/app/reports         → Relatórios (apenas Pro)
/app/settings        → Configurações
/app/settings/plan   → Plano e assinatura
```

### Design System
- CSS Custom Properties para todos os tokens de cor (facilita dark mode futuro)
- Variáveis prefixadas com `--color-`, `--spacing-`, `--radius-`
- Componentes shadcn/ui customizados via `tailwind.config.ts`

---

## Backend — Supabase

### Auth
- Email + senha (nativo Supabase)
- Recuperação de senha via email (Resend)
- JWT automático — Supabase gerencia sessões
- RLS usa `auth.uid()` para isolamento de dados

### PostgreSQL + RLS
- Banco principal em São Paulo (region: sa-east-1)
- RLS ativo em todas as tabelas com dados de usuário
- Schema único (`public`)
- Migrations versionadas em `/supabase/migrations/`

### Edge Functions (Deno/TypeScript)
Funções serverless para lógica que não deve rodar no frontend:

| Função | Responsabilidade |
|---|---|
| `ai-financial-analysis` | Chama Gemini, valida rate limit via Upstash, retorna análise |
| `process-webhook-abacatepay` | Recebe webhook de pagamento, atualiza status da assinatura |
| `generate-recurring-transactions` | Cron diário: gera transações recorrentes do dia |
| `calculate-achievements` | Avalia conquistas após cada transação |
| `pluggy-sync` | Sincroniza transações via Pluggy (Pro — V1) |

### Storage
- Bucket `extratos` — arquivos OFX/CSV importados pelo usuário
- Bucket `avatars` — fotos de perfil
- Políticas: usuário só acessa arquivos próprios

### Realtime
- Canal por usuário para notificações em tempo real
- Eventos: nova conquista desbloqueada, meta atingida, assinatura atualizada

---

## IA — Gemini 1.5 Flash

### Fluxo
```
Frontend → Edge Function (ai-financial-analysis)
               ↓
        Upstash Redis: verifica rate limit (15/dia)
               ↓ (se dentro do limite)
        Busca contexto financeiro do usuário no PostgreSQL
        (transações dos últimos 90 dias, contas, metas)
               ↓
        Monta prompt estruturado com dados anonimizados
               ↓
        Chama Gemini 1.5 Flash API
               ↓
        Salva resposta em ai_messages
               ↓
        Retorna resposta ao frontend
```

### Contexto Enviado ao Gemini (System Prompt)
Cada chamada à Edge Function monta automaticamente um contexto rico com:
1. **Transações dos últimos 90 dias** — categorizadas, com totais por categoria
2. **Contas ativas** — nomes, tipos, saldos atuais
3. **Metas ativas** — nome, valor alvo, progresso atual, data-alvo
4. **Perfil financeiro** — moeda base, nome do usuário

O modelo responde como "consultor de saúde financeira pessoal", não como consultor de investimentos (evita regulação CVM). Foco em: padrões de gasto, eficiência de categorias, progresso de metas, alertas de comportamento.

### Rate Limiting (Upstash)
- Chave: `ai_limit:<user_id>:<YYYY-MM-DD>`
- Incrementa a cada chamada, expira à meia-noite UTC
- Limite: 15 chamadas/dia por usuário Pro
- Retorna erro 429 com mensagem amigável quando atingido

### Resumo Semanal Automático (Pro)
Edge Function cron dispara todo domingo à meia-noite:
- Gera análise financeira da semana para usuários Pro ativos (`plan_status = 'active' OR 'trial'`)
- Salva como mensagem especial em `ai_messages` com `role = 'assistant'` e metadado `type = 'weekly_digest'`
- Exibido no dashboard Pro na seção "Inteligência IA — Resumo da Semana"
- **Não consome quota das 15 queries diárias** do usuário — usa key da app

---

## Pagamentos — AbacatePay

### Fluxo de Assinatura
```
Usuário escolhe plano
    ↓
Frontend chama Edge Function: cria cobrança no AbacatePay
    ↓
Retorna link de pagamento → usuário paga via PIX
    ↓
AbacatePay dispara webhook → Edge Function process-webhook-abacatepay
    ↓
Atualiza tabela subscriptions: status = 'active'
    ↓
Usuário recebe acesso ao plano
```

### Eventos de Webhook tratados
- `payment.confirmed` → ativa/renova assinatura
- `payment.overdue` → marca como `past_due`, mantém acesso por grace period (3 dias)
- `payment.cancelled` → cancela assinatura ao fim do período

---

## Email — Resend

### Templates transacionais
- Boas-vindas (após cadastro)
- Confirmação de e-mail
- Trial iniciado
- Trial expirando (D-3 e D-1)
- Pagamento confirmado
- Falha de pagamento
- Assinatura cancelada
- Nova conquista desbloqueada (semanal digest)
- Relatório mensal (Pro)

---

## Rate Limiting e Proteção — Upstash

Além do rate limit de IA, Upstash protege:
- Login: max 10 tentativas por IP por hora
- Cadastro: max 5 por IP por hora
- Import OFX/CSV: max 20/dia por usuário

---

## Analytics — PostHog

### Eventos rastreados
- `user_signed_up`
- `plan_selected`
- `trial_started`
- `transaction_created`
- `goal_created`
- `goal_completed`
- `achievement_unlocked`
- `ai_query_sent`
- `plan_upgraded`
- `subscription_cancelled`

---

## Deploy

### Frontend — Vercel
- Deploy automático no push para `main`
- Preview deployments em PRs
- Variáveis de ambiente no Vercel Dashboard
- Edge Network global (CDN automático)

### Backend — Supabase Cloud
- Projeto na região `sa-east-1` (São Paulo)
- Migrations aplicadas via `supabase db push` ou MCP
- Edge Functions deployadas via `supabase functions deploy`

---

## Quando adicionar Spring Boot (decisão futura)

Spring Boot NÃO é necessário no MVP nem no V1. Avaliar apenas quando:
- Edge Functions chegarem ao limite de 150ms de execução frequentemente
- Lógica de negócio se tornar muito complexa para Deno/TypeScript
- Necessidade de processamento batch pesado (conciliação, relatórios grandes)
- Time crescer e precisar de separação clara de responsabilidades

**Estimativa:** acima de 5.000 usuários ativos ou quando houver equipe técnica dedicada.

---

## Decisões Arquiteturais

Ver `/docs/decisions.md` para o histórico completo de ADRs.
