import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useProfile } from '@/hooks/useProfile';
import { hasProAccess } from '@/lib/planAccess';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Olá. Sou a Finance IA. Posso analisar sua renda, despesas, metas e ajudar você a tomar decisões financeiras mais conscientes.',
  },
];

export function FinanceIAPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!profileLoading && !hasProAccess(profile?.plan)) {
    return (
      <div className="page-view">
        <SectionPageTitle title="Finance IA" />
        <div className="couple-plan-note">
          <strong>Recurso exclusivo dos planos Pro e Casal</strong>
          <span>Faça upgrade do seu plano para liberar a Finance IA e receber análises automáticas das suas finanças.</span>
        </div>
        <button className="primary-button" onClick={() => navigate('/app/assinatura')}>
          Ver planos
        </button>
      </div>
    );
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/finance-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: 'assistant', text: data.text ?? data.error ?? 'Não consegui responder agora.' }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'Não consegui conectar à Finance IA agora. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="page-view">
      <SectionPageTitle title="Finance IA" />
      <section className="ai-chat">
        <div className="ai-chat-header">
          <div className="ai-icon">
            <Sparkles />
          </div>
          <div>
            <h3>Seu copiloto financeiro</h3>
            <p>Conselhos baseados nos seus dados da plataforma</p>
          </div>
          <button className="chat-clear" onClick={() => setMessages([{ role: 'assistant', text: 'Conversa limpa. Como posso ajudar com suas finanças?' }])}>
            Limpar
          </button>
        </div>

        <div className="chat-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              <span>{message.role === 'assistant' ? 'Finance IA' : 'Você'}</span>
              <p>{message.text}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <span>Finance IA</span>
              <p className="typing">Analisando seu contexto financeiro...</p>
            </div>
          )}
        </div>

        <div className="chat-suggestions">
          <button onClick={() => setInput('Como posso economizar este mês?')}>Como economizar este mês?</button>
          <button onClick={() => setInput('Como devo priorizar minhas metas?')}>Priorizar minhas metas</button>
          <button onClick={() => setInput('Analise minhas despesas recorrentes')}>Analisar despesas</button>
        </div>

        <div className="chat-composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo sobre suas finanças..."
            rows={2}
          />
          <button className="chat-send-button" onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Enviar mensagem" title="Enviar mensagem">
            <Send />
          </button>
        </div>
        <small className="ai-disclaimer">A Finance IA oferece orientação educacional e não substitui um profissional financeiro.</small>
      </section>
    </div>
  );
}
