-- =====================================================================
--  NOVEDADES LUCY · Capítulo 6 — Inicio de sesión y creación de cuenta
--  Mejora: "crear una pantalla de inicio de sesión y crear cuenta para
--  trackeo de pedidos o compras".
--
--  · Las cuentas las maneja Supabase Auth (correo + contraseña).
--  · perfiles: nombre y teléfono de cada cliente; se crea solo al registrarse.
--  · Los pedidos hechos con sesión iniciada quedan ligados a la cuenta
--    (crear_pedido() ya guarda auth.uid() desde el Capítulo 1) y las
--    reglas RLS hacen que cada cliente vea SOLO sus pedidos.
-- =====================================================================

create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text,
  telefono   text,
  es_admin   boolean not null default false,   -- para el panel de Lucy
  creado_en  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "mi perfil" on public.perfiles;
create policy "mi perfil" on public.perfiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "editar mi perfil" on public.perfiles;
create policy "editar mi perfil" on public.perfiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- El cliente puede ver su perfil y cambiar nombre/teléfono,
-- pero NO puede volverse administrador.
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, telefono) on public.perfiles to authenticated;

-- ---------------------------------------------------------------------
-- Crear el perfil automáticamente al registrarse
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono)
  values (new.id,
          new.raw_user_meta_data ->> 'nombre',
          new.raw_user_meta_data ->> 'telefono')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Perfiles para usuarios que ya existían
insert into public.perfiles (id, nombre, telefono)
select id, raw_user_meta_data ->> 'nombre', raw_user_meta_data ->> 'telefono'
from auth.users
on conflict (id) do nothing;

notify pgrst, 'reload schema';
