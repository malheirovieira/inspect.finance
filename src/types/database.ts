/**
 * Tipos do schema Supabase (ver /docs/database.md).
 * Mantido manualmente até a geração automática via `supabase gen types typescript`
 * ser configurada (requer projeto Supabase criado — ver README de setup).
 */

export type Plan = 'basic' | 'pro' | 'duo';
export type PlanStatus = 'trial' | 'active' | 'cancelled' | 'past_due';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'digital_wallet';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'transfer';
export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due' | 'expired';
export type BillingCycle = 'monthly' | 'annual';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  base_currency: string;
  plan: Plan;
  plan_status: PlanStatus;
  trial_ends_at: string | null;
  onboarding_completed_at: string | null;
  ai_queries_today: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  balance: number;
  credit_limit: number | null;
  color: string;
  icon: string;
  is_active: boolean;
  pluggy_account_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  parent_transaction_id: string | null;
  type: TransactionType;
  description: string;
  amount: number;
  currency: string;
  amount_in_base_currency: number;
  exchange_rate: number;
  date: string;
  is_paid: boolean;
  is_recurring: boolean;
  recurring_transaction_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  transfer_to_account_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  duo_link_id: string | null;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  color: string;
  icon: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      accounts: { Row: Account; Insert: Partial<Account>; Update: Partial<Account> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> };
      goals: { Row: Goal; Insert: Partial<Goal>; Update: Partial<Goal> };
    };
  };
}
