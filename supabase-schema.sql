-- Execute este SQL no Supabase (SQL Editor) para criar a tabela de dieta.
-- Dashboard Supabase → SQL Editor → New query → Cole e execute.

-- Tabela de refeições (dieta)
create table if not exists public.diet_entries (
  id uuid primary key default gen_random_uuid(),
  meal_date date not null,
  meal_type text not null check (meal_type in (
    'cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'
  )),
  description text not null,
  calories integer,
  created_at timestamptz default now()
);

-- Habilitar RLS (Row Level Security)
alter table public.diet_entries enable row level security;

-- Política: permitir todas as operações para anon (você pode restringir depois com auth)
-- Para uso pessoal sem login, isso permite ler/escrever com a chave anon.
create policy "Permitir tudo para anon"
  on public.diet_entries
  for all
  to anon
  using (true)
  with check (true);

-- Índice para filtrar por data
create index if not exists idx_diet_entries_meal_date on public.diet_entries (meal_date desc);
