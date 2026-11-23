-- =====================================================================
--  NOVEDADES LUCY · Cotizaciones reales
--  · El botón "Cotizar" del producto guarda la cotización en Supabase.
--  · El precio se calcula AQUÍ (servidor) con las reglas de precio:
--    mayoreo desde 3 piezas, menudeo +$10 y temporada +$20.
--  · "Mis cotizaciones" consulta por folio (o por cuenta, si hay sesión)
--    y permite aceptar o rechazar.
--  · Se puede correr varias veces.
-- =====================================================================

alter table public.cotizaciones
  add column if not exists precio_unitario numeric(10,2);
alter table public.cotizaciones
  add column if not exists estado text not null default 'pendiente';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cotizaciones_estado_check') then
    alter table public.cotizaciones
      add constraint cotizaciones_estado_check
      check (estado in ('pendiente', 'aceptada', 'rechazada'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. CREAR COTIZACIÓN
-- ---------------------------------------------------------------------
create or replace function public.crear_cotizacion(
  p_producto_id bigint,
  p_cantidad    integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prod    public.productos%rowtype;
  v_mayoreo boolean := p_cantidad >= 3;
  v_precio  numeric(10,2);
  v_folio   text;
begin
  if p_cantidad is null or p_cantidad < 1 or p_cantidad > 500 then
    raise exception 'Cantidad no válida';
  end if;

  select * into v_prod from public.productos
   where id = p_producto_id and activo;
  if not found then
    raise exception 'Producto no disponible';
  end if;

  v_precio := public.precio_pieza(v_prod.precio_mayoreo, v_mayoreo, public.es_temporada());

  insert into public.cotizaciones
    (usuario_id, producto_id, cantidad, modalidad, precio_unitario, subtotal, costo_envio, total)
  values
    (auth.uid(), v_prod.id, p_cantidad,
     case when v_mayoreo then 'mayoreo' else 'menudeo' end,
     v_precio, v_precio * p_cantidad, 0, v_precio * p_cantidad)
  returning folio into v_folio;

  return v_folio;
end $$;

-- ---------------------------------------------------------------------
-- 2. CONSULTAR COTIZACIONES (por folios guardados en el navegador
--    y, si hay sesión, todas las de la cuenta)
-- ---------------------------------------------------------------------
create or replace function public.consultar_cotizaciones(p_folios text[])
returns table (
  folio           text,
  producto_id     bigint,
  nombre          text,
  modelo          text,
  emoji           text,
  imagen_url      text,
  cantidad        integer,
  modalidad       text,
  precio_unitario numeric,
  subtotal        numeric,
  total           numeric,
  estado          text,
  vigente_hasta   date,
  vencida         boolean,
  creado_en       timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.folio, c.producto_id, p.nombre, p.modelo, p.emoji, p.imagen_url,
         c.cantidad, c.modalidad,
         coalesce(c.precio_unitario, round(c.subtotal / c.cantidad, 2)),
         c.subtotal, c.total, c.estado, c.vigente_hasta,
         c.vigente_hasta < (now() at time zone 'America/Mexico_City')::date,
         c.creado_en
  from public.cotizaciones c
  join public.productos p on p.id = c.producto_id
  where c.folio = any (coalesce(p_folios, '{}'))
     or (auth.uid() is not null and c.usuario_id = auth.uid())
  order by c.creado_en desc
  limit 50;
$$;

-- ---------------------------------------------------------------------
-- 3. ACEPTAR O RECHAZAR
-- ---------------------------------------------------------------------
create or replace function public.responder_cotizacion(p_folio text, p_aceptar boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado text;
  v_vence  date;
begin
  select estado, vigente_hasta into v_estado, v_vence
    from public.cotizaciones where folio = p_folio;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;
  if v_estado <> 'pendiente' then
    return v_estado;
  end if;
  if p_aceptar and v_vence < (now() at time zone 'America/Mexico_City')::date then
    raise exception 'La cotización ya venció';
  end if;

  update public.cotizaciones
     set estado = case when p_aceptar then 'aceptada' else 'rechazada' end
   where folio = p_folio
  returning estado into v_estado;
  return v_estado;
end $$;

revoke all on function public.crear_cotizacion(bigint, integer) from public;
revoke all on function public.consultar_cotizaciones(text[]) from public;
revoke all on function public.responder_cotizacion(text, boolean) from public;
grant execute on function public.crear_cotizacion(bigint, integer) to anon, authenticated;
grant execute on function public.consultar_cotizaciones(text[]) to anon, authenticated;
grant execute on function public.responder_cotizacion(text, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
