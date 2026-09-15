# Decisions — inspect.finance (ADR Log)

Registro de decisões arquiteturais e de produto. Cada decisão documenta o contexto, opções avaliadas e a escolha feita.

---

## ADR-001 — Backend: Supabase vs Spring Boot

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Fundador tem experiência com Spring Boot. Precisa de backend para MVP com custo zero.

**Opções:**
- Spring Boot: custo de servidor (R$50-200/mês), semanas de setup
- Supabase: free tier generoso, Auth/DB/Storage/Realtime prontos, Edge Functions serverless

**Decisão:** Supabase-first. Spring Boot entra somente acima de 5.000 usuários ativos ou quando a complexidade de negócio superar Edge Functions.

---

## ADR-002 — Gateway de Pagamento: AbacatePay

**Data:** 2025-09  
**Status:** Decidido (revisar se não suportar recorrência nativa)

**Contexto:** SaaS brasileiro precisa de PIX como método primário. Stripe tem taxas mais altas e PIX é trabalhoso.

**Opções:**
- Stripe: melhor DX, mas taxa mais alta, PIX manual
- Asaas: completo para recorrência, robusto
- AbacatePay: nativo PIX, taxas baixas, desenvolvedor-friendly

**Decisão:** AbacatePay. Arquitetura isolada do gateway — trocar exige mudança mínima se necessário.

---

## ADR-003 — IA: Custo zero vs BYOK

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Usuário Pro precisa de análise financeira por IA. Custo deve ser mínimo no MVP.

**Opções:**
- BYOK (usuário traz a própria chave): zero custo, alta fricção (usuário precisa criar API key)
- Gemini 1.5 Flash free tier (app-level): 1M tokens/dia grátis, zero fricção

**Decisão:** Gemini 1.5 Flash free tier via Edge Function. Rate limit de 15 queries/dia por usuário via Upstash Redis. Quando escalar, trocar por Gemini pago ou Claude Haiku.

---

## ADR-004 — Plataforma: Web first vs App nativo

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Usuário quer acesso mobile e web. App nativo dobra o esforço de desenvolvimento.

**Decisão:** Web responsiva primeiro (React). App nativo (React Native) somente quando houver demanda comprovada de usuários. Design mobile-first desde o início.

---

## ADR-005 — Dark Mode

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Nubank tem dark mode forte. Construir dois temas dobra esforço no MVP.

**Decisão:** Light mode no MVP. CSS Custom Properties desde o início para que dark mode seja apenas redefinição de variáveis. Dark mode entra no V2.

---

## ADR-006 — Integração Bancária

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Integração direta com Open Finance requer certificação do BACEN — inviável para MVP.

**Opções:**
- Agregador (Pluggy/Belvo): certificado, API simples, custo por conexão
- Importação manual OFX/CSV: zero custo, fricção para usuário
- Direto Open Finance: inviável no curto prazo

**Decisão:** Importação OFX/CSV no plano Basic. Pluggy no plano Pro (V1 — pós-MVP). Pluggy no Basic seria custo operacional antes de ter receita.

---

## ADR-007 — Soft Delete em dados financeiros

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Dados financeiros não podem ser apagados permanentemente — auditoria, LGPD e integridade histórica.

**Decisão:** Todas as tabelas de dados financeiros têm `deleted_at TIMESTAMPTZ`. Queries sempre filtram `WHERE deleted_at IS NULL`. Registros nunca são deletados do banco.

---

## ADR-008 — Multi-moeda

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Usuários com investimentos internacionais ou receitas em outras moedas precisam de suporte.

**Decisão:** Usuário define moeda base no onboarding (padrão BRL). Transações armazenam: `currency` original + `amount` original + `amount_in_base_currency` + `exchange_rate` no momento do lançamento. Taxa de câmbio informada manualmente pelo usuário no MVP; automática via API no V1.

---

## ADR-009 — Parcelas de cartão

**Data:** 2025-09  
**Status:** Decidido

**Contexto:** Mercado brasileiro usa crédito parcelado extensivamente. Sistema precisa suportar.

**Opções:**
- A: Uma transação-mãe + N filhas geradas automaticamente (usuário define parcelas e valor)
- B: Usuário lança cada parcela manualmente
- C: Valor total, impacto mensal no dashboard

**Decisão:** Opção A. `parent_transaction_id` referencia a transação original. Edge Function ou lógica no frontend gera as parcelas filhas no momento do cadastro.

---

## ADR-010 — Plano Duo: modelo de vinculação

**Data:** 2025-09  
**Status:** Decidido

**Opções:**
- A: Duas contas individuais vinculadas. Dados pessoais privados, metas compartilhadas, visão consolidada opcional
- B: Uma conta com dois acessos (todos os dados compartilhados)
- C: Conta principal + convidado com acesso limitado

**Decisão:** Opção A. Cada pessoa mantém sua conta e privacidade. A tabela `duo_links` registra o vínculo. Metas com `duo_link_id` são compartilhadas. Visão consolidada via query que agrega as duas contas.
