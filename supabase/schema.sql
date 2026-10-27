-- supabase/schema.sql
-- TravelMap : tables des comptes. À coller dans Supabase > SQL Editor, puis « Run ».
-- Le script peut être relancé sans risque (il ne recrée que ce qui manque).
--
-- Chaque ligne appartient à un utilisateur (user_id). La RLS (Row Level Security) garantit
-- qu'un compte ne lit et n'écrit que ses propres lignes, même avec la clé publique « anon ».

-- 1. Statuts des pays : un statut par pays et par compte.
--    updated_at sert à la règle « la modification la plus récente gagne » entre deux appareils.
create table if not exists public.pays (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code text not null,
  statut text not null check (statut in ('home', 'visited', 'wish')),
  updated_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- 2. Voyages : le voyage entier en JSON (étapes, checklist, budget, notes).
create table if not exists public.voyages (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 3. Conversations du planificateur : la conversation entière en JSON.
create table if not exists public.conversations (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 4. RLS : activée sur les trois tables, avec une politique par opération.
alter table public.pays enable row level security;
alter table public.voyages enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "pays : lire les siens" on public.pays;
drop policy if exists "pays : ajouter les siens" on public.pays;
drop policy if exists "pays : modifier les siens" on public.pays;
drop policy if exists "pays : supprimer les siens" on public.pays;
create policy "pays : lire les siens" on public.pays for select to authenticated using (auth.uid() = user_id);
create policy "pays : ajouter les siens" on public.pays for insert to authenticated with check (auth.uid() = user_id);
create policy "pays : modifier les siens" on public.pays for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pays : supprimer les siens" on public.pays for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "voyages : lire les siens" on public.voyages;
drop policy if exists "voyages : ajouter les siens" on public.voyages;
drop policy if exists "voyages : modifier les siens" on public.voyages;
drop policy if exists "voyages : supprimer les siens" on public.voyages;
create policy "voyages : lire les siens" on public.voyages for select to authenticated using (auth.uid() = user_id);
create policy "voyages : ajouter les siens" on public.voyages for insert to authenticated with check (auth.uid() = user_id);
create policy "voyages : modifier les siens" on public.voyages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "voyages : supprimer les siens" on public.voyages for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "conversations : lire les siennes" on public.conversations;
drop policy if exists "conversations : ajouter les siennes" on public.conversations;
drop policy if exists "conversations : modifier les siennes" on public.conversations;
drop policy if exists "conversations : supprimer les siennes" on public.conversations;
create policy "conversations : lire les siennes" on public.conversations for select to authenticated using (auth.uid() = user_id);
create policy "conversations : ajouter les siennes" on public.conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "conversations : modifier les siennes" on public.conversations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations : supprimer les siennes" on public.conversations for delete to authenticated using (auth.uid() = user_id);

-- 5. Conflits : la modification la plus récente gagne, même si deux appareils écrivent en même temps.
--    Une mise à jour plus ancienne que la ligne enregistrée est ignorée (la ligne reste telle quelle).
create or replace function public.garder_le_plus_recent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists pays_plus_recent on public.pays;
drop trigger if exists voyages_plus_recent on public.voyages;
drop trigger if exists conversations_plus_recent on public.conversations;
create trigger pays_plus_recent before update on public.pays for each row execute function public.garder_le_plus_recent();
create trigger voyages_plus_recent before update on public.voyages for each row execute function public.garder_le_plus_recent();
create trigger conversations_plus_recent before update on public.conversations for each row execute function public.garder_le_plus_recent();
