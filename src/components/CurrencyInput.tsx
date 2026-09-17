import type { ChangeEvent } from 'react';

interface CurrencyInputProps {
  /** Valor decimal já formatado em pt-BR (ex.: "115,00" ou "1.500,00" acima de mil —
   * use `parseCurrencyInput` para converter de volta em número, nunca `Number(value.replace(',', '.'))`,
   * que quebra no separador de milhar). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  autoFocus?: boolean;
}

/** Converte o valor formatado em pt-BR (ex.: "1.500,00") de volta em número (1500). */
export function parseCurrencyInput(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function digitsToDecimalString(digits: string): string {
  if (!digits) return '';
  const cents = Number(digits);
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Campo de valor monetário com máscara "de trás pra frente" (cada dígito digitado entra nos
 * centavos, como em caixas eletrônicos/apps de banco) — elimina a necessidade do usuário
 * digitar vírgula manualmente e evita erros de formatação (ex.: "11500" virando R$11.500 sem
 * querer em vez de R$115,00).
 */
export function CurrencyInput({ value, onChange, placeholder = '0,00', id, className, autoFocus }: CurrencyInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '');
    onChange(digitsToDecimalString(digits));
  }

  return (
    <input
      id={id}
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
