# Roadmap — inspect.finance

## MVP — Lançar e cobrar do primeiro cliente

**Objetivo:** Ter um produto funcional que uma pessoa pague para usar.
**Prazo estimado:** 8-12 semanas de desenvolvimento solo

### Fase 1 — Fundação (Semanas 1-2)
- [ ] Inicializar projeto React + TypeScript + Vite
- [ ] Configurar Tailwind CSS + shadcn/ui + Framer Motion
- [ ] Configurar Supabase (projeto, auth, banco de dados)
- [ ] Aplicar migration inicial (schema completo)
- [ ] Configurar Vercel + deploy contínuo
- [ ] Configurar variáveis de ambiente
- [ ] Landing page — estilo Solidroad (seções: hero, features, preços, CTA)
- [ ] Página de login e cadastro
- [ ] Fluxo de autenticação completo (email + senha, recuperação, logout)

### Fase 2 — Onboarding e Contas (Semanas 3-4)
- [ ] Onboarding guiado (parametrização: nome, moeda base, primeira conta)
- [ ] CRUD de contas bancárias (manual)
- [ ] Página de listagem de contas com saldo
- [ ] Categorias padrão carregadas via seed
- [ ] CRUD de categorias personalizadas

### Fase 3 — Transações (Semanas 4-6)
- [ ] Formulário de nova transação (receita / despesa / transferência)
- [ ] Suporte a parcelas (define número de parcelas e valor)
- [ ] Listagem de transações com filtros (período, conta, categoria, tipo)
- [ ] Edição e exclusão de transações (soft delete)
- [ ] Contas recorrentes (templates + geração automática via Edge Function cron)
- [ ] Importação OFX/CSV (parser + validação + preview)

### Fase 4 — Dashboard e Metas (Semanas 6-8)
- [ ] Dashboard configurável com widgets:
  - [ ] Saldo total consolidado
  - [ ] Receitas vs despesas do mês
  - [ ] Gráfico de gastos por categoria
  - [ ] Últimas transações
  - [ ] Progresso das metas
- [ ] CRUD de metas de poupança
- [ ] Barra de progresso de metas com aporte manual
- [ ] Score de saúde financeira (cálculo no backend)

### Fase 5 — Gamificação e IA (Semanas 8-10)
- [ ] Sistema de conquistas (catálogo seed + Edge Function de avaliação)
- [ ] Página de perfil com títulos e badges
- [ ] Edge Function `ai-financial-analysis` com Gemini 1.5 Flash
- [ ] Rate limiting via Upstash Redis (15 queries/dia por usuário Pro)
- [ ] Interface de chat com IA (apenas plano Pro)
- [ ] Guard de acesso por plano (bloqueia IA no Basic)

### Fase 6 — Assinaturas e Lançamento (Semanas 10-12)
- [x] Integração Asaas (checkout cartão + PIX via `create-checkout`)
- [x] Edge Function `process-webhook-asaas`
- [ ] Página de planos e upgrade
- [ ] Trial de 7 dias (plano Basic) com contador regressivo
- [ ] E-mails transacionais via Resend (boas-vindas, trial, pagamento)
- [ ] PostHog instalado com eventos principais
- [ ] Testes manuais end-to-end
- [ ] **LANÇAMENTO MVP**

---

## V1 — Após primeiros pagantes (3-6 meses pós-lançamento)

### Funcionalidades
- [ ] Plano Duo — vinculação de casais (contas, metas compartilhadas)
- [ ] Integração bancária automática via Pluggy (plano Pro)
- [ ] Relatórios avançados:
  - [ ] Gráficos por período (mensal, trimestral, anual)
  - [ ] Comparativo mês a mês por categoria
  - [ ] Exportação PDF
- [ ] Notificações inteligentes:
  - [ ] Gasto acima do orçamento da categoria
  - [ ] Meta próxima de ser atingida
  - [ ] Conta recorrente vencendo
- [ ] Orçamento mensal por categoria (limite de gasto)
- [ ] Digest semanal por e-mail com resumo financeiro

### Infraestrutura
- [ ] Monitoramento de Edge Functions (alertas de erro)
- [ ] Backup strategy documentada e testada
- [ ] Testes automatizados (Vitest + Testing Library)

---

## V2 — Escala (6-18 meses pós-lançamento)

### Funcionalidades
- [ ] App nativo iOS e Android (React Native)
- [ ] Visualização de carteira de investimentos (manual ou via integração)
- [ ] IA avançada com contexto histórico acumulado (conversa contínua)
- [ ] Planejamento financeiro anual com projeções
- [ ] Dark mode
- [ ] Multi-idioma (pt-BR + en-US)
- [ ] Painel de administração (métricas de SaaS: MRR, churn, DAU)

### Infraestrutura
- [ ] Avaliar migração parcial para Spring Boot (se necessário)
- [ ] Pipeline de CI/CD formal (GitHub Actions)
- [ ] Monitoramento avançado (Sentry para erros de frontend)
- [ ] Internacionalização de pagamentos (Stripe para mercados fora do Brasil)

---

## Funcionalidades Futuras (Backlog)

- Modo família (múltiplos usuários, perfis infantis)
- Integração com corretoras de investimento (B3 API)
- Consultor financeiro humano via plataforma (marketplace)
- Análise preditiva (previsão de gastos para o próximo mês)
- Importação de notas fiscais / faturas via OCR
- Assinatura com número de cartão (para usuários sem PIX)
