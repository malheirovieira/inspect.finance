import { Link } from 'react-router-dom';

const SERIF = "'Playfair Display', Georgia, serif";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 style={{ fontFamily: SERIF, fontWeight: 400 }} className="text-2xl text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">{children}</div>
    </section>
  );
}

/**
 * Política de Privacidade — descreve o tratamento de dados real do produto
 * (Supabase, Asaas, Gemini, Open Finance/OFX) sob a LGPD. Os campos entre
 * colchetes (razão social, CNPJ, encarregado/DPO) precisam ser preenchidos
 * com os dados reais da empresa antes de publicar em produção — recomendável
 * revisão por um advogado antes do lançamento oficial.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-white)]">
      <header className="border-b border-[var(--color-border)] px-6 py-5 sm:px-[10vw]">
        <Link to="/" style={{ fontFamily: SERIF }} className="text-xl text-[var(--color-text-primary)]">
          inspect.finance
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-0">
        <p className={"text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-label-green)]"}>Legal</p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 400 }} className="mt-2 text-4xl text-[var(--color-text-primary)]">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Última atualização: 16 de setembro de 2026 · Em conformidade com a Lei Geral de Proteção de Dados (LGPD).
        </p>

        <Section title="1. Quem controla seus dados">
          <p>
            O inspect.finance, operado por [razão social / CNPJ a definir], é o controlador dos dados pessoais
            tratados nesta plataforma, nos termos do art. 5º, VI da LGPD.
          </p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="font-medium text-[var(--color-text-primary)]">Cadastro:</strong> nome, e-mail, senha (armazenada com hash pelo Supabase Auth).</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Financeiros:</strong> contas, cartões, transações, metas e categorias que você cadastra ou importa (OFX/CSV) ou que sincronizamos via Open Finance.</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Pagamento:</strong> processado diretamente pela Asaas — não temos acesso ao número completo do seu cartão.</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Uso da IA:</strong> perguntas feitas à IA financeira e o contexto necessário para respondê-las (transações recentes, contas, metas).</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Uso da plataforma:</strong> dados técnicos básicos (dispositivo, navegador, páginas acessadas) para segurança e melhoria do produto.</li>
          </ul>
        </Section>

        <Section title="3. Para que usamos seus dados">
          <ul className="list-disc space-y-2 pl-5">
            <li>Fornecer as funcionalidades da plataforma (dashboards, metas, relatórios, IA);</li>
            <li>Processar pagamentos e gerenciar sua assinatura;</li>
            <li>Enviar comunicações essenciais (confirmação de conta, cobrança, avisos de segurança);</li>
            <li>Prevenir fraude e proteger a segurança da conta;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
          <p>
            Bases legais (LGPD art. 7º): execução de contrato (para prestar o serviço contratado), consentimento
            (para comunicações não essenciais) e cumprimento de obrigação legal.
          </p>
        </Section>

        <Section title="4. Com quem compartilhamos">
          <p>Nunca vendemos seus dados. Compartilhamos apenas o necessário com:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="font-medium text-[var(--color-text-primary)]">Supabase</strong> — hospedagem do banco de dados e autenticação;</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Asaas</strong> — processamento de pagamentos (cartão e PIX);</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Google Gemini</strong> — geração das respostas da IA financeira (plano Pro/Duo);</li>
            <li><strong className="font-medium text-[var(--color-text-primary)]">Provedores de Open Finance</strong> — apenas se você conectar um banco manualmente, com sua autorização explícita e revogável a qualquer momento.</li>
          </ul>
        </Section>

        <Section title="5. Segurança">
          <p>
            Aplicamos Row Level Security (RLS) no banco de dados — cada usuário só acessa seus próprios registros.
            Dados financeiros nunca são apagados fisicamente (soft delete) e todas as alterações em tabelas
            financeiras ficam registradas em log de auditoria. Senhas nunca são armazenadas em texto puro.
          </p>
        </Section>

        <Section title="6. Seus direitos como titular dos dados">
          <p>Conforme o art. 18 da LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Baixar uma cópia de todos os seus dados, em Parametrizações → "Baixar meus dados (JSON)";</li>
            <li>Corrigir dados incompletos ou desatualizados, diretamente na plataforma;</li>
            <li>Excluir permanentemente sua conta e seus dados, em Parametrizações → "Excluir minha conta";</li>
            <li>Revogar o consentimento de integração bancária, desconectando o banco a qualquer momento;</li>
            <li>Solicitar esclarecimentos sobre o tratamento dos seus dados pelo contato abaixo.</li>
          </ul>
        </Section>

        <Section title="7. Retenção de dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos
            permanentemente, exceto quando a lei exigir retenção por período específico (ex.: registros fiscais de
            pagamento).
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos cookies e armazenamento local essenciais para manter sua sessão logada e, na landing page,
            ferramentas de analytics para entender o uso do site (sem venda de dados a terceiros).
          </p>
        </Section>

        <Section title="9. Alterações desta política">
          <p>
            Podemos atualizar esta política periodicamente. Mudanças relevantes serão comunicadas por e-mail ou aviso
            na plataforma antes de entrarem em vigor.
          </p>
        </Section>

        <Section title="10. Encarregado de dados (DPO) e contato">
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre o tratamento dos seus dados, entre em contato pelo
            e-mail privacidade@inspect.finance ou com nosso encarregado de dados: [nome do DPO a definir].
          </p>
        </Section>

        <p className="mt-14 text-center text-sm text-[var(--color-text-secondary)]">
          <Link to="/" className="font-medium text-[#05132a] hover:underline">
            Voltar para o início
          </Link>
        </p>
      </main>
    </div>
  );
}
