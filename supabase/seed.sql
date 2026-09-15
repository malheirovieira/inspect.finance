-- ============================================================================
-- inspect.finance — Seed: categorias padrão do sistema
-- Fonte: /docs/database.md → "Categorias Padrão do Sistema (seed)"
-- Categorias de sistema têm user_id = NULL e is_system = TRUE (leitura
-- pública para todos os usuários, conforme RLS de `categories`).
-- ============================================================================

INSERT INTO categories (name, type, icon, color, is_system) VALUES
  -- Despesas
  ('Alimentação', 'expense', 'utensils',     '#F97316', TRUE),
  ('Moradia',     'expense', 'home',         '#6366F1', TRUE),
  ('Transporte',  'expense', 'car',          '#0EA5E9', TRUE),
  ('Saúde',       'expense', 'heart-pulse',  '#EF4444', TRUE),
  ('Educação',    'expense', 'graduation-cap','#8B5CF6', TRUE),
  ('Lazer',       'expense', 'popcorn',      '#EC4899', TRUE),
  ('Vestuário',   'expense', 'shirt',        '#14B8A6', TRUE),
  ('Assinaturas', 'expense', 'repeat',       '#F59E0B', TRUE),
  ('Serviços',    'expense', 'wrench',       '#64748B', TRUE),
  ('Outros',      'expense', 'more-horizontal','#94A3B8', TRUE),

  -- Receitas
  ('Salário',       'income', 'briefcase',    '#00A878', TRUE),
  ('Freelance',      'income', 'laptop',       '#22C55E', TRUE),
  ('Investimentos',  'income', 'trending-up',  '#10B981', TRUE),
  ('Presente',       'income', 'gift',         '#A855F7', TRUE),
  ('Outros',         'income', 'more-horizontal','#94A3B8', TRUE),

  -- Transferências
  ('Transferência', 'transfer', 'arrow-left-right', '#64748B', TRUE);
