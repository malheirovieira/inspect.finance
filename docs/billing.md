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
- 7 dias grátis, exclusivo do plano Basic
- Requer cartão cadastrado no ato do cadastro para liberar o teste (não é cobrado se cancelar antes do fim)
- Planos Pro e Duo não têm trial — cobrança (mensal ou 12x no anual) é feita imediatamente na assinatura
- No plano mensal (Basic), cancelamento livre a qualquer momento, antes ou depois do trial
- Sequência de e-mails via Resend (trial Basic):
  - D+1 (dia 1 do trial): boas-vindas + dica de uso
  - D+4 (3 dias antes do fim): lembrete informativo
  - D+6 (1 dia antes): urgência — "amanhã seu trial acaba"
  - D+7 / expiração: cobrança automática (mensal) ou CTA de confirmação (anual)
- Se cancelado antes do fim do trial: `plan_status = 'cancelled'`, acesso bloqueado sem cobrança
- Se não cancelado: cobrança processada normalmente ao fim do trial

---

## Gateway de Pagamento — AbacatePay

**Método primário:** PIX (taxa mais baixa, aprovação instantânea)
**Métodos futuros:** Cartão de crédito, boleto

### Fluxo de Assinatura (MVP)

```
1. Usuário escolhe plano na tela de upgrade/cadastro
2. Frontend chama Edge Function: create-subscription
3. Edge Function cria cobrança no AbacatePay
4. Retorna link/QR Code PIX para o usuário
5. Usuário realiza pagamento
6. AbacatePay dispara webhook: payment.confirmed
7. Edge Function process-webhook atualiza subscriptions:
   status = 'active', current_period_end = hoje + 30 dias
8. profiles.plan_status = 'active'
9. E-mail de confirmação enviado via Resend
10. Usuário tem acesso completo ao plano
```

### Renovação Mensal (MVP)

```
Dia do vencimento:
1. AbacatePay gera nova cobrança automaticamente (se configurado)
   OU Edge Function cron gera nova cobrança no D-3
2. Usuário recebe e-mail com link de pagamento
3. Se pagar: renova por mais 30 dias
4. Se não pagar em 3 dias: plan_status = 'past_due' (acesso mantido)
5. Se não pagar em 7 dias: plan_status = 'cancelled' (acesso bloqueado)
```

> **Nota:** O fluxo exato de recorrência depende do suporte nativo do AbacatePay a assinaturas. Se não suportado, a geração de cobranças recorrentes será implementada via Edge Function cron (Supabase).

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

## Eventos de Webhook (AbacatePay)

| Evento | Ação |
|---|---|
| `payment.confirmed` | Ativa/renova assinatura, atualiza `current_period_end` |
| `payment.overdue` | Marca `past_due`, mantém acesso por grace period |
| `payment.cancelled` | Cancela assinatura ao fim do período |
| `subscription.updated` | Atualiza dados do plano |

Todos os webhooks validam assinatura HMAC antes de processar.

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

- [ ] Confirmar suporte a recorrência nativa no AbacatePay
- [x] Definir se trial requer cartão/PIX cadastrado — decidido: sim, cartão obrigatório, trial exclusivo do Basic
- [ ] Definir política de reembolso
- [ ] Definir política de pausa de assinatura
