import type { AccountType } from '@/types/database';

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'cash', label: 'Carteira' },
  { value: 'investment', label: 'Investimento' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'digital_wallet', label: 'Carteira digital' },
];

export function accountTypeLabel(type: AccountType) {
  return ACCOUNT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
