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
 * Conteúdo base de Termos de Uso — cobre o que o produto realmente faz hoje
 * (planos, trial, Asaas, Open Finance/OFX, IA). Os campos entre colchetes
 * (razão social, CNPJ, endereço, foro) precisam ser preenchidos com os dados
 * reais da empresa antes de publicar em produção — não é aconselhamento
 * jurídico, recomendável revisão por um advogado antes do lançamento oficial.
 */
export function TermsPage() {
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
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Última atualização: 16 de setembro de 2026.</p>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta ou usar o inspect.finance, você concorda com estes Termos de Uso e com nossa{' '}
            <Link to="/privacidade" className="font-medium text-[#1e2a0e] hover:underline">
              Política de Privacidade
            </Link>
            . Se você não concordar, não utilize a plataforma.
          </p>
        </Section>

        <Section title="2. O que é o inspect.finance">
          <p>
            O inspect.finance é uma plataforma de controle e organização financeira pessoal: dashboards, lançamentos
            de receitas e despesas, metas de poupança, importação de extratos (OFX/CSV), integração bancária via Open
            Finance (planos Pro e Duo) e análises geradas por inteligência artificial.
          </p>
          <p className="font-medium text-[var(--color-text-primary)]">
            O inspect.finance não é uma instituição financeira, não oferece consultoria de investimentos e não
            executa transações financeiras em seu nome. As análises e sugestões da IA são informativas e não
            substituem aconselhamento profissional.
          </p>
        </Section>

        <Section title="3. Cadastro e conta">
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na
            sua conta. Informe dados verdadeiros no cadastro. Contas podem ser suspensas em caso de uso fraudulento,
            violação destes termos ou tentativa de burlar os limites do seu plano.
          </p>
        </Section>

        <Section title="4. Planos, período de teste e pagamento">
          <ul className="list-disc space-y-2 pl-5">
            <li>O plano Basic tem 7 dias de teste grátis, sem necessidade de cartão ou PIX.</li>
            <li>Os planos Pro e Duo são cobrados imediatamente na assinatura, sem período de teste.</li>
            <li>
              Pagamentos são processados pela Asaas (cartão de crédito recorrente ou PIX). O inspect.finance não
              armazena dados completos de cartão de crédito.
            </li>
            <li>No plano mensal, você pode cancelar a qualquer momento; o acesso permanece até o fim do período já pago.</li>
            <li>No plano anual, o valor integral é cobrado no ato da assinatura.</li>
            <li>Alterações de preço são comunicadas com antecedência e não afetam ciclos já pagos.</li>
          </ul>
        </Section>

        <Section title="5. Integração bancária e importação de dados">
          <p>
            A integração bancária automática (quando disponível) é feita via Open Finance, regulado pelo Banco
            Central do Brasil, com acesso somente de leitura — nunca solicitamos ou armazenamos sua senha bancária. O
            acesso pode ser revogado por você a qualquer momento. Alternativamente, você pode importar extratos
            manualmente em formato OFX ou CSV.
          </p>
        </Section>

        <Section title="6. Uso aceitável">
          <p>Você concorda em não:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Usar a plataforma para fins ilegais ou fraudulentos;</li>
            <li>Tentar acessar dados de outros usuários ou burlar mecanismos de segurança;</li>
            <li>Fazer engenharia reversa, copiar ou revender a plataforma ou seu conteúdo;</li>
            <li>Automatizar acessos em volume que prejudique a disponibilidade do serviço para outros usuários.</li>
          </ul>
        </Section>

        <Section title="7. Propriedade intelectual">
          <p>
            A marca inspect.finance, o design, o código e os textos da plataforma são de propriedade de [razão social
            a definir]. Os dados financeiros que você insere continuam sendo seus — você pode exportá-los ou excluí-
            los a qualquer momento pela área de Parametrizações.
          </p>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            O inspect.finance é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de
            erros. Na máxima extensão permitida pela lei, não nos responsabilizamos por decisões financeiras tomadas
            com base nas informações ou análises da plataforma, nem por perdas indiretas decorrentes do uso ou da
            impossibilidade de uso do serviço.
          </p>
        </Section>

        <Section title="9. Cancelamento e exclusão de conta">
          <p>
            Você pode excluir sua conta a qualquer momento em Parametrizações → Excluir conta. Isso remove
            permanentemente seus dados financeiros e pessoais, conforme descrito na nossa{' '}
            <Link to="/privacidade" className="font-medium text-[#1e2a0e] hover:underline">
              Política de Privacidade
            </Link>
            . Também podemos suspender ou encerrar contas que violem estes termos.
          </p>
        </Section>

        <Section title="10. Alterações destes termos">
          <p>
            Podemos atualizar estes Termos de Uso periodicamente. Mudanças relevantes serão comunicadas por e-mail ou
            aviso na plataforma antes de entrarem em vigor.
          </p>
        </Section>

        <Section title="11. Lei aplicável e contato">
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil, foro da comarca de [cidade/UF a
            definir]. Dúvidas: contato@inspect.finance.
          </p>
        </Section>

        <p className="mt-14 text-center text-sm text-[var(--color-text-secondary)]">
          <Link to="/" className="font-medium text-[#1e2a0e] hover:underline">
            Voltar para o início
          </Link>
        </p>
      </main>
    </div>
  );
}
