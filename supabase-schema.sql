-- ============================================================
-- Execute este SQL no Supabase → SQL Editor → New query
-- ============================================================

-- 1. Tabela de diário alimentar (FatSecret integrado)
create table if not exists public.food_diary (
  id                  uuid primary key default gen_random_uuid(),
  diary_date          date not null,
  meal_type           text not null check (meal_type in (
                        'cafe','lanche_manha','almoco','lanche_tarde','jantar','ceia'
                      )),
  food_id             text,
  food_name           text not null,
  serving_description text,
  quantity            numeric not null default 1,
  calories            numeric,
  protein             numeric,
  carbs               numeric,
  fat                 numeric,
  created_at          timestamptz default now()
);

alter table public.food_diary enable row level security;

create policy "Permitir tudo para anon"
  on public.food_diary for all to anon
  using (true) with check (true);

create index if not exists idx_food_diary_date on public.food_diary (diary_date desc);

-- 2. Tabela de entradas manuais (legado — pode manter ou ignorar)
create table if not exists public.diet_entries (
  id          uuid primary key default gen_random_uuid(),
  meal_date   date not null,
  meal_type   text not null check (meal_type in (
                'cafe','lanche_manha','almoco','lanche_tarde','jantar','ceia'
              )),
  description text not null,
  calories    integer,
  created_at  timestamptz default now()
);

alter table public.diet_entries enable row level security;

create policy "Permitir tudo para anon"
  on public.diet_entries for all to anon
  using (true) with check (true);

create index if not exists idx_diet_entries_date on public.diet_entries (meal_date desc);
