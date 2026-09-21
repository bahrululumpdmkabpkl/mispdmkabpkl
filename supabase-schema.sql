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

insert into storage.buckets (id, name, public)
values ('surat-masuk', 'surat-masuk', true)
on conflict (id) do update set public = true;

create table if not exists public.surat_masuk (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  pengirim text not null,
  perihal text not null,
  file_path text,
  file_name text,
  created_at timestamptz not null default now()
);

alter table public.surat_masuk enable row level security;

drop policy if exists "Surat masuk dapat dilihat semua pengguna" on public.surat_masuk;
drop policy if exists "Surat masuk dapat ditambahkan semua pengguna" on public.surat_masuk;
drop policy if exists "Surat masuk dapat diubah semua pengguna" on public.surat_masuk;
drop policy if exists "Surat masuk dapat dihapus semua pengguna" on public.surat_masuk;

create policy "Surat masuk dapat dilihat semua pengguna" on public.surat_masuk for select to anon using (true);
create policy "Surat masuk dapat ditambahkan semua pengguna" on public.surat_masuk for insert to anon with check (true);
create policy "Surat masuk dapat diubah semua pengguna" on public.surat_masuk for update to anon using (true) with check (true);
create policy "Surat masuk dapat dihapus semua pengguna" on public.surat_masuk for delete to anon using (true);

drop policy if exists "PDF surat dapat dilihat semua pengguna" on storage.objects;
drop policy if exists "PDF surat dapat diunggah semua pengguna" on storage.objects;
drop policy if exists "PDF surat dapat diubah semua pengguna" on storage.objects;
drop policy if exists "PDF surat dapat dihapus semua pengguna" on storage.objects;

create policy "PDF surat dapat dilihat semua pengguna" on storage.objects for select to anon using (bucket_id = 'surat-masuk');
create policy "PDF surat dapat diunggah semua pengguna" on storage.objects for insert to anon with check (bucket_id = 'surat-masuk');
create policy "PDF surat dapat diubah semua pengguna" on storage.objects for update to anon using (bucket_id = 'surat-masuk') with check (bucket_id = 'surat-masuk');
create policy "PDF surat dapat dihapus semua pengguna" on storage.objects for delete to anon using (bucket_id = 'surat-masuk');
