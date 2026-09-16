# Billing — inspect.finance

## Modelo de Cobrança

### Planos

| Plano | Preço Mensal | Preço Anual | Usuários |
|---|---|---|---|
| Basic | R$19,90 | R$190,80 (~R$15,90/mês) | 1 |
| Pro | R$29,90 | R$287,04 (~R$23,92/mês) | 1 |
| Duo | R$39,90 | R$383,04 (~R$31,92/mês) | 2 vinculados |

Desconto anual: ~20% (equivale a pagar ~10 meses)

### Trial
- 7 dias grátis, exclusivo do plano Basic — **não exige cartão nem PIX**, ativado direto pelo cadastro
  (Edge Function `start-free-trial`, sem qualquer chamada à Asaas)
- Alternativa: o cliente pode pular o trial e assinar o Basic já pagando (cartão, com renovação
  automática, ou PIX)
- Planos Pro e Duo não têm trial — cobrança (cartão recorrente ou PIX mensal/anual à vista) é feita
  imediatamente na assinatura
- No plano mensal, cancelamento livre a qualquer momento, antes ou depois do trial
- Ao fim do trial sem conversão em plano pago: `plan_status` permanece `trial` com `trial_ends_at`
  vencido — acesso é bloqueado pelo front-end (`hasBillingAccess`), sem cobrança automática (não há
  cartão nem PIX associados ao trial gratuito)
- Sequência de e-mails via Resend (trial Basic) — pendente de implementação:
  - D+1 (dia 1 do trial): boas-vindas + dica de uso
  - D+4 (3 dias antes do fim): lembrete informativo
  - D+6 (1 dia antes): urgência — "amanhã seu trial acaba"
  - D+7 / expiração: CTA para assinar (cartão ou PIX)

---

## Gateway de Pagamento — Asaas

**Métodos:** Cartão de crédito (recorrente nativo) e PIX (cobrança avulsa)
**Checkout:** página hospedada pela Asaas (`POST /v3/checkouts`) — nunca recebemos dado de cartão
no nosso lado. Mesma chamada cobre cartão e PIX, variando `billingTypes`/`chargeTypes`.

### Fluxo de Assinatura (MVP)

```
1. Usuário escolhe plano + forma de pagamento (cartão ou PIX) em /completar-pagamento ou /app/assinatura
2. Frontend chama Edge Function: create-checkout
3. Edge Function cria o checkout na Asaas (cartão = RECURRENT, PIX = DETACHED)
4. Retorna o link do checkout hospedado pela Asaas
5. Usuário é redirecionado e completa o pagamento lá
6. Asaas dispara webhook: PAYMENT_CONFIRMED / PAYMENT_RECEIVED
7. Edge Function process-webhook-asaas atualiza subscriptions:
   status = 'active', current_period_end = hoje + 30 (ou 365) dias
8. profiles.plan_status = 'active'
9. Usuário tem acesso completo ao plano
```

### Renovação Mensal (MVP)

```
Dia do vencimento (assinatura via cartão, recorrente nativo da Asaas):
1. Asaas cobra automaticamente o cartão já cadastrado
2. Se pagar: webhook PAYMENT_CONFIRMED/PAYMENT_RECEIVED renova por mais um ciclo
3. Se não pagar: webhook PAYMENT_OVERDUE → plan_status = 'past_due', grace period de 3 dias
4. Se a Asaas cancelar a assinatura após tentativas falhas: webhook SUBSCRIPTION_DELETED/
   SUBSCRIPTION_INACTIVATED → plan_status = 'cancelled'

Assinatura via PIX é sempre avulsa — não há cobrança automática do lado da Asaas; o cliente
precisa pagar de novo manualmente a cada ciclo (mensal) ou já paga o valor cheio à vista (anual).
```

---

## Controle de Acesso por Plano

A tabela `profiles` determina o acesso via `plan` + `plan_status`.

### Lógica de guard no frontend
```typescript
// src/lib/plan-guard.ts

export function canUseFeature(
  plan: 'basic' | 'pro' | 'duo',
  planStatus: 'trial' | 'active' | 'cancelled' | 'past_due',
  feature: 'ai' | 'bank_integration' | 'reports' | 'duo_view'
): boolean {
  // Acesso bloqueado se cancelado ou expirado
  if (planStatus === 'cancelled') return false;

  const featureAccess: Record<string, ('pro' | 'duo')[]> = {
    ai: ['pro', 'duo'],
    bank_integration: ['pro', 'duo'],
    reports: ['pro', 'duo'],
    duo_view: ['duo'],
  };

  return featureAccess[feature]?.includes(plan as 'pro' | 'duo') ?? true;
}
```

### Past Due — Grace Period
- `past_due`: mantém acesso por 7 dias após vencimento
- Após 7 dias sem pagamento: `cancelled`, acesso bloqueado
- E-mail de inadimplência em D+1, D+3, D+7

---

## Upgrade e Downgrade

### Upgrade (Basic → Pro, Basic → Duo, Pro → Duo)
- Usuário paga diferença proporcional ao período restante (ou nova cobrança integral)
- `plan` e `plan_status` atualizados imediatamente após confirmação
- Acesso à nova funcionalidade liberado instantaneamente

### Downgrade (Pro → Basic, Duo → Pro, Duo → Basic)
- Downgrade entra em vigor no fim do período atual
- `cancel_at_period_end = TRUE` + novo plano registrado
- Usuário mantém acesso ao plano atual até a data de renovação
- E-mail confirmando o downgrade agendado

---

## Cancelamento

- Usuário cancela na área "Meu Plano" → configurações
- `cancel_at_period_end = TRUE`
- Acesso mantido até o fim do período pago
- E-mail de confirmação de cancelamento
- E-mail de oferta de retenção (desconto) no D-1 antes do cancelamento efetivo

---

## Eventos de Webhook (Asaas)

| Evento | Ação |
|---|---|
| `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` | Ativa/renova assinatura, atualiza `current_period_end` |
| `PAYMENT_OVERDUE` | Marca `past_due`, mantém acesso por grace period de 3 dias |
| `SUBSCRIPTION_DELETED` / `SUBSCRIPTION_INACTIVATED` | Cancela assinatura (imediatamente se pedido pelo usuário; ao fim do período se veio da Asaas por falha de pagamento) |

Autenticação do webhook: header `asaas-access-token`, comparado contra `ASAAS_WEBHOOK_TOKEN`.
Idempotência via tabela `webhook_events` (dedup por `event_id`).

---

## Métricas de Negócio (para monitorar)

- **MRR** (Monthly Recurring Revenue): receita recorrente mensal
- **Churn Rate**: % usuários que cancelaram no mês
- **Trial Conversion Rate**: % trials que viraram assinatura paga
- **Plan Distribution**: % Basic / Pro / Duo
- **ARPU** (Average Revenue per User): ticket médio

Fonte: PostHog + consultas no banco de dados via painel admin (V2).

---

## TODO — Refinamento Pendente

- [x] Gateway de pagamento — decidido: Asaas (cartão recorrente nativo + PIX avulso via checkout hospedado `/v3/checkouts`), substituindo a AbacatePay (cujo sandbox não liberava cartão)
- [x] Definir se trial requer cartão/PIX cadastrado — decidido: **não**, trial de 7 dias do Basic é livre de qualquer forma de pagamento (Edge Function `start-free-trial`); cartão/PIX ficam como alternativa pra quem quer assinar direto
- [ ] Definir política de reembolso
- [ ] Definir política de pausa de assinatura
