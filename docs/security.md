# Security — inspect.finance

> ⚠️ Dado financeiro é dado sensível. Segurança é requisito desde o início, não um item de backlog.

---

## Autenticação (Supabase Auth)

### Cadastro e Login
- Email + senha (mínimo 8 caracteres, 1 maiúscula, 1 número)
- **Google Social Login** via Supabase Auth OAuth (MVP) — perfil criado automaticamente no primeiro acesso social
- Confirmação de e-mail obrigatória antes do primeiro acesso (apenas para cadastro email/senha)
- Rate limit no frontend + Upstash: max 10 tentativas de login por IP por hora
- Rate limit cadastro: max 5 cadastros por IP por hora (Upstash)
- Bcrypt via Supabase (nunca armazenar senha em texto claro — Supabase gerencia)

### MFA (Multi-Factor Authentication)
- **MVP:** não implementado
- **V1:** opcional, ativado pelo usuário nas configurações da conta
- Tipo: TOTP (Google Authenticator / Authy)
- Supabase Auth suporta nativamente — implementação via `supabase.auth.mfa.*`

### Sessões
- JWT com expiração de 1 hora (Supabase padrão)
- Refresh token com expiração de 7 dias
- Logout invalida refresh token no servidor
- Sessão persiste via localStorage (Supabase SDK padrão)

### Recuperação de Senha
- Link temporário via e-mail (Resend)
- Token expira em 1 hora
- Link de uso único (invalidado após uso)

---

## Isolamento de Dados (Row Level Security)

**Princípio:** Cada usuário acessa SOMENTE seus próprios dados. RLS é a segunda camada de defesa — a primeira é sempre filtrar por `user_id` na query.

### Políticas aplicadas
- Todas as tabelas com dados de usuário têm RLS ativo
- Política base: `user_id = auth.uid()`
- Exceções documentadas:
  - `categories` onde `is_system = true`: leitura pública
  - `achievements`: leitura pública
  - `duo_links` + metas compartilhadas: acesso para `primary_user_id` OR `partner_user_id`

### Service Role
- Nunca exposta no frontend
- Usada apenas em Edge Functions para operações privilegiadas (webhooks, cron jobs)
- Edge Functions autenticam internamente com `SUPABASE_SERVICE_ROLE_KEY` via secret

---

## Proteção de APIs

### Edge Functions
- Validação de JWT em todas as funções que recebem dados de usuário
- Webhook da Asaas: validação via header `asaas-access-token` comparado contra `ASAAS_WEBHOOK_TOKEN`
- Inputs sempre sanitizados e validados com Zod antes de qualquer processamento

### Frontend → Supabase
- Apenas `anon key` exposta no frontend (não eleva permissões por si só)
- Toda elevação de permissão depende de RLS + JWT válido

---

## Secrets e Variáveis de Ambiente

- `.env.local` nunca commitado (`.gitignore` configurado na inicialização)
- Chaves de API de Edge Functions no Supabase Dashboard → Edge Function Secrets
- Chaves do frontend no Vercel Environment Variables
- Rotação de chaves: documentar processo quando necessário

---

## Proteção contra Abuso

| Vetor | Proteção |
|---|---|
| Brute force login | Rate limit 10/h por IP (Upstash) |
| Spam de cadastro | Rate limit 5/h por IP (Upstash) |
| Abuso de IA | Rate limit 15 queries/dia por usuário (Upstash) |
| Import excessivo | Rate limit 20 imports/dia por usuário (Upstash) |
| SQL Injection | Parametrização automática do Supabase SDK |
| XSS | React escapa por padrão; inputs sanitizados |
| CSRF | Não aplicável (SPA com JWT em localStorage) |

---

## LGPD — Conformidade

- [ ] Política de Privacidade clara e acessível antes do cadastro
- [ ] Termos de Uso com linguagem simples
- [ ] Consentimento explícito para coleta de dados financeiros
- [ ] Usuário pode exportar todos os seus dados (funcionalidade V1)
- [ ] Usuário pode solicitar exclusão de conta (soft delete de dados, hard delete de credenciais)
- [ ] Dados não são vendidos ou compartilhados com terceiros (exceto processamento de pagamento)
- [ ] Logs de auditoria acessíveis ao próprio usuário

---

## Dados em Trânsito

- HTTPS obrigatório em todos os endpoints (Vercel + Supabase garantem)
- Certificados TLS gerenciados automaticamente

---

## Dados em Repouso

- Supabase criptografa dados em repouso (AES-256)
- Backups automáticos com PITR (Point in Time Recovery) no plano Supabase Pro
- Arquivos de extrato no Storage com acesso privado (apenas usuário dono)

---

## Auditoria

- Tabela `audit_log` registra INSERT/UPDATE/DELETE em tabelas financeiras
- Implementada via triggers PostgreSQL ou chamada explícita nas Edge Functions
- Retida por mínimo 12 meses
- Usuário pode ver seu próprio log na área de configurações (V1)

---

## Checklist de Segurança — Antes do Lançamento MVP

- [ ] RLS ativo e testado em todas as tabelas
- [ ] Nenhum `service_role` key no código frontend
- [ ] `.env.local` no `.gitignore`
- [ ] Rate limiting funcionando (testar manualmente)
- [ ] Webhook da Asaas com validação de `asaas-access-token`
- [ ] Confirmação de e-mail ativa no Supabase
- [ ] HTTPS funcionando em produção (Vercel)
- [ ] Política de Privacidade publicada
- [ ] Termos de Uso publicados
- [ ] Consentimento LGPD no cadastro
- [ ] Soft delete funcionando (transação deletada não some do banco)
- [ ] Audit log funcionando para transações

---

## TODO — Etapas 7-10 (Pendentes de refinamento)

Esta seção será expandida após a conclusão da entrevista de descoberta completa.
