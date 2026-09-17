interface CardPreviewProps {
  holderName: string;
  /** Vem do select real de bandeira do formulário — não é mais adivinhado por dígitos digitados. */
  brand: string;
  closingDay?: number | null;
  dueDay?: number | null;
}

/**
 * Prévia puramente ilustrativa de um cartão — não representa número/CVV reais (o cadastro real
 * não pede esses dados, só apelido, bandeira, limite e datas de fatura).
 */
export function CardPreview({ holderName, brand, closingDay, dueDay }: CardPreviewProps) {
  const billingLabel = closingDay && dueDay ? `Fecha dia ${closingDay} · Vence dia ${dueDay}` : 'Fatura';

  return (
    <div className="card-preview-scene">
      <div className="card-preview">
        <div className="card-preview-face card-preview-front">
          <div className="card-preview-top">
            <span className="card-preview-chip" aria-hidden="true" />
            <span className="card-preview-brand">{brand || 'Bandeira'}</span>
          </div>
          <div className="card-preview-number">•••• •••• •••• ••••</div>
          <div className="card-preview-bottom">
            <div>
              <span>Nome no cartão</span>
              <strong>{holderName ? holderName.toUpperCase() : 'SEU NOME AQUI'}</strong>
            </div>
            <div>
              <span>{billingLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
