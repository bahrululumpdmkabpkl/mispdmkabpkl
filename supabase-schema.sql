create extension if not exists pgcrypto;

create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  pemakai text not null,
  acara text not null,
  created_at timestamptz not null default now()
);

alter table public.agenda enable row level security;

create policy "Agenda dapat dilihat semua pengguna"
  on public.agenda for select to anon using (true);

create policy "Agenda dapat ditambahkan semua pengguna"
  on public.agenda for insert to anon with check (true);

create policy "Agenda dapat diubah semua pengguna"
  on public.agenda for update to anon using (true) with check (true);

create policy "Agenda dapat dihapus semua pengguna"
  on public.agenda for delete to anon using (true);
