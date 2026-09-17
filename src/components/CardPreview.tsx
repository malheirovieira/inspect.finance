interface CardPreviewProps {
  holderName: string;
  /** Apenas dígitos — usado só para renderizar a prévia, nunca enviado ao backend. */
  cardNumber: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
}

function detectBrand(digits: string): string {
  const first = digits.charAt(0);
  if (first === '4') return 'VISA';
  if (first === '5') return 'Mastercard';
  if (first === '3') return 'AMEX';
  return '';
}

function maskNumber(digits: string): string {
  const last4 = digits.slice(-4);
  const lastGroup = last4.length > 0 ? last4.padStart(4, '•') : '••••';
  return `•••• •••• •••• ${lastGroup}`;
}

/**
 * Prévia puramente ilustrativa de um cartão — não persiste nem envia número/CVV a lugar nenhum,
 * existe só pra dar feedback visual em tempo real enquanto o usuário cadastra um cartão.
 */
export function CardPreview({ holderName, cardNumber, expiry, cvv, flipped }: CardPreviewProps) {
  const brand = detectBrand(cardNumber);

  return (
    <div className="card-preview-scene">
      <div className={`card-preview ${flipped ? 'is-flipped' : ''}`}>
        <div className="card-preview-face card-preview-front">
          <div className="card-preview-top">
            <span className="card-preview-chip" aria-hidden="true" />
            <span className="card-preview-brand">{brand}</span>
          </div>
          <div className="card-preview-number">{maskNumber(cardNumber)}</div>
          <div className="card-preview-bottom">
            <div>
              <span>Nome no cartão</span>
              <strong>{holderName ? holderName.toUpperCase() : 'SEU NOME AQUI'}</strong>
            </div>
            <div>
              <span>Validade</span>
              <strong>{expiry || 'MM/AA'}</strong>
            </div>
          </div>
        </div>
        <div className="card-preview-face card-preview-back">
          <div className="card-preview-stripe" />
          <div className="card-preview-cvv-row">
            <span className="card-preview-cvv-band">{cvv ? cvv.replace(/./g, '•') : ''}</span>
            <span className="card-preview-cvv-label">CVV</span>
          </div>
          <span className="card-preview-brand card-preview-brand-back">{brand}</span>
        </div>
      </div>
    </div>
  );
}
