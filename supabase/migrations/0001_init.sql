-- Sem RLS por enquanto. TODO: habilitar quando autenticação for implementada.
-- Para aplicar: rode via Supabase CLI (supabase db push) ou cole no SQL Editor do dashboard.

create table cards (
  id int primary key,                  -- 0 a 77
  nome text not null,
  nome_pt text not null,
  arcano text not null check (arcano in ('maior', 'menor')),
  naipe text check (naipe in ('copas', 'espadas', 'ouros', 'paus')),
  numero int,
  imagem_path text not null
);

create table readings (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('1_carta', '3_cartas', 'celta')),
  num_cartas int not null,
  deck_order int[] not null,           -- ordem embaralhada das 78, FONTE DA VERDADE
  reverseds bool[] not null,           -- se cada posição sai invertida
  selected_positions int[] not null default '{}',
  status text not null default 'aguardando'
    check (status in ('aguardando', 'em_andamento', 'finalizada')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  constraint deck_order_complete check (array_length(deck_order, 1) = 78),
  constraint reverseds_complete check (array_length(reverseds, 1) = 78)
);

create index on readings (status, created_at desc);
