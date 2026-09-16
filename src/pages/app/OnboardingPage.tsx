import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompleteOnboarding } from '@/hooks/useProfile';

interface Step {
  key: string;
  question: string;
  options: string[];
}

const STEPS: Step[] = [
  {
    key: 'goal',
    question: 'Qual é o seu objetivo financeiro principal?',
    options: ['Economizar', 'Quitar dívidas', 'Investir', 'Organizar as finanças'],
  },
  {
    key: 'income_range',
    question: 'Qual é a sua renda mensal aproximada?',
    options: ['Até R$ 2.000', 'R$ 2.000 – R$ 5.000', 'R$ 5.000 – R$ 10.000', 'Acima de R$ 10.000'],
  },
  {
    key: 'accounts_count',
    question: 'Quantas contas bancárias você possui?',
    options: ['1', '2', '3', '4 ou mais'],
  },
  {
    key: 'focus_area',
    question: 'O que você mais quer controlar por aqui?',
    options: ['Despesas do dia a dia', 'Metas e investimentos', 'Contas fixas e assinaturas', 'Visão geral do orçamento'],
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  async function advance(nextAnswers: Record<string, string>) {
    if (isLastStep) {
      await completeOnboarding.mutateAsync(nextAnswers);
      navigate('/app/dashboard', { replace: true });
    } else {
      setAnswers(nextAnswers);
      setStepIndex((current) => current + 1);
    }
  }

  function selectOption(option: string) {
    advance({ ...answers, [step.key]: option });
  }

  function skip() {
    advance(answers);
  }

  return (
    <div className="page-view">
      <div className="form-card" style={{ flexDirection: 'column', alignItems: 'stretch', maxWidth: 560, margin: '40px auto' }}>
        <div className="panel-dots" style={{ marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <button key={s.key} className={i === stepIndex ? 'active' : ''} aria-label={`Etapa ${i + 1}`} disabled />
          ))}
        </div>
        <span className="eyebrow">
          ETAPA {stepIndex + 1} DE {STEPS.length}
        </span>
        <h2 style={{ margin: '10px 0 24px', fontSize: 24, fontWeight: 400 }}>{step.question}</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {step.options.map((option) => (
            <button
              key={option}
              type="button"
              className="account-balance-card"
              disabled={completeOnboarding.isPending}
              onClick={() => selectOption(option)}
              style={{ minHeight: 'auto', padding: '14px 16px' }}
            >
              <strong>{option}</strong>
            </button>
          ))}
        </div>
        <button type="button" className="history-toggle" style={{ marginTop: 24, alignSelf: 'center' }} onClick={skip} disabled={completeOnboarding.isPending}>
          {isLastStep ? 'Pular e ir para o painel' : 'Pular por agora'}
        </button>
      </div>
    </div>
  );
}
