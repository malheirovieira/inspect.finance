# Product — inspect.finance

## Visão do Produto

**inspect.finance** resolve a incapacidade das pessoas de saberem para onde seu dinheiro vai quando usam múltiplos bancos, cartões e contas.

A proposta é unificar toda a vida financeira em um único lugar: simples, intuitivo, moderno — e que faça o usuário ter prazer em acompanhar suas finanças.

---

## Problema Central

O usuário típico:
- Tem 2-4 contas em bancos diferentes
- Usa múltiplos cartões de crédito
- Não sabe quanto entra por mês
- Não sabe quais contas fixas tem ativas
- Gasta sem controle e descobre no fim do mês que o dinheiro acabou
- Não tem visão estratégica com dados para tomar decisões

**A dor:** "As torneiras estão abertas — o dinheiro escorre e eu não sei de onde."

---

## Público-Alvo

**Perfil primário:** Pessoa física brasileira com renda formal ou informal, 20-40 anos, que usa múltiplos bancos e cartões e quer ter controle real das finanças sem usar planilhas complexas.

**Contexto de uso:** Acessa principalmente pelo celular (web responsiva / futuramente app nativo) e eventualmente via computador.

**Nível de maturidade financeira:** Intermediário — sabe que precisa de controle, mas ainda não tem disciplina ou ferramenta adequada.

---

## Diferencial

1. **Unificação multi-banco:** visão consolidada de todas as contas em um lugar
2. **Gamificação motivacional:** títulos, badges e conquistas por bom comportamento financeiro — transforma poupança em algo prazeroso
3. **IA conservadora:** análise da saúde financeira com linguagem simples (sem jargão, sem recomendações de investimento reguladas)
4. **Plano Duo:** controle financeiro conjunto para casais com privacidade individual
5. **UX moderna e jovem:** referência visual de bancos digitais (Nubank, XP), não de apps arcaicos

---

## Planos e Preços

### Basic — R$19,90/mês
- 1 usuário
- Cadastro manual de contas e transações
- Importação de extrato OFX/CSV
- Categorias personalizadas ilimitadas
- Dashboard configurável (widgets)
- Metas de poupança com progresso visual
- Gamificação completa (títulos e conquistas)
- Contas e despesas recorrentes
- Trial de 14 dias

### Pro — R$29,90/mês
- Tudo do Basic
- Integração bancária automática via Pluggy (Open Finance)
- IA financeira: análise de saúde + conselhos (15 consultas/dia)
- Relatórios avançados com gráficos e histórico
- Trial de 14 dias

### Duo — R$39,90/mês
- Tudo do Pro
- 2 usuários vinculados (casal)
- Visão consolidada do casal
- Metas compartilhadas com progresso conjunto
- Cada pessoa mantém privacidade dos próprios dados
- Trial de 14 dias

**Desconto anual:** 20% (equivale a pagar ~10 meses em vez de 12)

---

## Funcionalidades por Versão

### MVP — Lançar e validar

| # | Funcionalidade |
|---|---|
| 1 | Landing page + cadastro + login |
| 2 | Onboarding guiado (parametrização inicial, moeda base, contas) |
| 3 | Cadastro de contas bancárias (manual) |
| 4 | Lançamento de receitas e despesas |
| 5 | Suporte a parcelas de cartão (usuário define nº e valor) |
| 6 | Categorias padrão + personalizadas |
| 7 | Transferências entre contas |
| 8 | Contas recorrentes (boletos, assinaturas fixas) |
| 9 | Dashboard com widgets configuráveis |
| 10 | Metas de poupança com barra de progresso |
| 11 | Gamificação: conquistas e títulos por comportamento |
| 12 | IA financeira — análise de saúde (Pro) |
| 13 | Assinatura via AbacatePay + trial 14 dias |
| 14 | E-mail transacional (Resend): boas-vindas, confirmação, fatura |

### V1 — Após primeiros pagantes

| # | Funcionalidade |
|---|---|
| 1 | Integração bancária automática via Pluggy (Pro) |
| 2 | Importação de extrato OFX/CSV |
| 3 | Plano Duo — vinculação de casais |
| 4 | Relatórios avançados: gráficos por período, categoria, conta |
| 5 | Notificações inteligentes (gasto acima do esperado, meta próxima) |
| 6 | Controle de limites de gasto por categoria (orçamento mensal) |
| 7 | Comparativo mês a mês |
| 8 | Exportação de relatório PDF |

### V2 — Escala

| # | Funcionalidade |
|---|---|
| 1 | App nativo iOS e Android (React Native) |
| 2 | Visualização de carteira de investimentos (ações, FIIs, tesouro) |
| 3 | IA avançada com contexto histórico acumulado |
| 4 | Planejamento financeiro anual com projeções |
| 5 | Integração com corretoras (apenas visualização) |
| 6 | Dark mode |
| 7 | Multi-idioma (pt-BR + en) |

---

## Onboarding

1. Usuário se cadastra (email + senha)
2. Confirma e-mail
3. Escolhe plano + inicia trial de 14 dias
4. Aceita termos (LGPD + Termos de Uso)
5. Parametriza conta: nome, moeda base, foto de perfil
6. Cadastra primeira conta bancária
7. Define orçamento mensal (opcional, pode pular)
8. Chega ao dashboard — vídeo curto de apresentação do CEO (link externo ou modal)
9. Opção de agendar call com o fundador para onboarding personalizado (link Calendly)

---

## Gamificação — Títulos e Conquistas

O sistema de recompensas é visível em todos os planos. Objetivo: motivar comportamento financeiro saudável.

### Exemplos de Conquistas

| Código | Nome | Gatilho |
|---|---|---|
| FIRST_TRANSACTION | Primeiro Passo | Registrar primeira transação |
| FIRST_GOAL | Sonhador Realista | Criar primeira meta |
| GOAL_COMPLETED | Meta Batida | Completar uma meta |
| SAVING_STREAK_30 | Constância | Poupar por 30 dias seguidos |
| SAVING_STREAK_90 | Disciplinado | Poupar por 90 dias seguidos |
| BUDGET_KEEPER | Controlado | Não ultrapassar orçamento por 1 mês |
| SENIOR_ECONOMIST | Economista Sênior | Poupar mais de 30% da renda por 3 meses |
| MULTI_GOALS | Ambicioso | Ter 3 metas ativas simultaneamente |
| EARLY_BIRD | Pioneiro | Um dos primeiros 100 usuários |

### Títulos (exibidos no perfil)
Substituem o título padrão conforme evolução: Iniciante → Organizado → Disciplinado → Investidor → Economista Sênior → Mestre Financeiro

---

## IA Financeira (Plano Pro)

### O que faz
- Analisa o padrão de gastos do usuário
- Identifica categorias onde gasta mais do que deveria
- Calcula saúde financeira (score 0-100)
- Dá conselhos práticos e conservadores em linguagem simples
- Responde perguntas sobre os dados do próprio usuário

### O que NÃO faz (por design e compliance)
- Não recomenda ativos específicos (ações, fundos, criptos)
- Não dá previsões de mercado
- Não substitui assessor financeiro certificado

### Exemplos de análises
- "Você gastou 42% da renda com lazer em outubro. A média saudável é 10-15%."
- "Sua reserva de emergência cobre 0,8 meses. O recomendado é 6 meses."
- "Com base nos últimos 3 meses, você tem margem de R$340/mês para investir."
- "Você tem 7 contas recorrentes que somam R$1.890/mês. Revise se todas ainda fazem sentido."

### Limites técnicos
- 15 consultas/dia por usuário Pro
- Rate limiting via Upstash Redis
- Modelo: Gemini 1.5 Flash (free tier Google AI Studio)
- Contexto enviado: últimas transações do usuário (anonimizadas de IDs externos)
