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
  onboarding_completed: boolean;
  onboarding_answers: Record<string, unknown> | null;
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

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  transaction_id: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  currency: string;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  last_generated_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DuoLinkStatus = 'pending' | 'active' | 'rejected' | 'cancelled';

export interface DuoLink {
  id: string;
  primary_user_id: string;
  partner_user_id: string | null;
  invite_email: string | null;
  status: DuoLinkStatus;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  payment_provider: string;
  external_id: string | null;
  amount_cents: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  grace_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingProduct {
  id: string;
  plan: Plan;
  billing_cycle: BillingCycle;
  abacatepay_product_id: string;
  price_cents: number;
  created_at: string;
}

export type FeatureKey =
  | 'dashboard_basic'
  | 'dashboard_advanced'
  | 'transactions'
  | 'financial_agenda'
  | 'goals_basic'
  | 'goals_advanced'
  | 'economy_tracking'
  | 'ai_insights'
  | 'bank_integration'
  | 'reports_basic'
  | 'reports_advanced'
  | 'duo_view';

export interface PlanRow {
  id: string;
  name: Plan;
  display_name: string;
  features: FeatureKey[];
  is_active: boolean;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed_at: string;
}

type Table<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: Table<Profile>;
      accounts: Table<Account>;
      categories: Table<Category>;
      transactions: Table<Transaction>;
      recurring_transactions: Table<RecurringTransaction>;
      goals: Table<Goal>;
      goal_contributions: Table<GoalContribution>;
      duo_links: Table<DuoLink>;
      subscriptions: Table<Subscription>;
      billing_products: Table<BillingProduct>;
      plans: Table<PlanRow>;
      webhook_events: Table<WebhookEvent>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
