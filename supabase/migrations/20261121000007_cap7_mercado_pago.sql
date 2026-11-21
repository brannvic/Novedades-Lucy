-- =====================================================================
--  NOVEDADES LUCY · Capítulo 7 — Cobros en línea con Mercado Pago
--  Mejora: "conectar la API de Mercado Pago para hacer cobros en línea".
--
--  Flujo (Checkout Pro):
--   1. La tienda crea el pedido (crear_pedido) con método "tarjeta".
--   2. Edge Function crear-preferencia → pide a Mercado Pago un enlace
--      de pago con los productos del pedido y redirige al cliente.
--   3. El cliente paga en Mercado Pago y regresa a /confirmacion.
--   4. Mercado Pago avisa a la Edge Function webhook-mercadopago, que
--      consulta el pago y actualiza la tabla pagos.
--  Estas funciones SOLO las puede llamar el servidor (service_role).
-- =====================================================================

alter table public.pagos add column if not exists mp_preference_id text;
alter table public.pagos add column if not exists mp_status        text;
alter table public.pagos add column if not exists mp_status_detail text;

-- ---------------------------------------------------------------------
-- 1. Datos del pedido para armar la preferencia de pago
-- ---------------------------------------------------------------------
create or replace function public.mp_datos_preferencia(p_folio text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'folio',  p.folio,
    'total',  p.total,
    'nombre', p.nombre_cliente,
    'correo', p.correo,
    'items',  (select jsonb_agg(jsonb_build_object(
                        'id',          i.producto_id::text,
                        'title',       i.descripcion,
                        'quantity',    i.cantidad,
                        'unit_price',  i.precio_unitario,
                        'currency_id', 'MXN') order by i.id)
               from public.pedido_items i where i.pedido_id = p.id)
  )
  from public.pedidos p
  join public.pagos pg on pg.pedido_id = p.id
  where p.folio = upper(trim(p_folio))
    and p.metodo_pago = 'tarjeta'
    and p.estado not in ('cancelado', 'devuelto')
    and pg.estado = 'pendiente'
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 2. Guardar el id de la preferencia creada
-- ---------------------------------------------------------------------
create or replace function public.mp_guardar_preferencia(p_folio text, p_preference_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.pagos pg
     set mp_preference_id = p_preference_id
    from public.pedidos p
   where p.id = pg.pedido_id and p.folio = upper(trim(p_folio));
$$;

-- ---------------------------------------------------------------------
-- 3. Registrar el resultado del pago (lo llama el webhook)
-- ---------------------------------------------------------------------
create or replace function public.mp_registrar_pago(
  p_folio         text,
  p_payment_id    text,
  p_status        text,
  p_status_detail text,
  p_monto         numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado    text;
  v_pedido_id bigint;
begin
  v_estado := case p_status
                when 'approved'     then 'aprobado'
                when 'authorized'   then 'pendiente'
                when 'pending'      then 'pendiente'
                when 'in_process'   then 'pendiente'
                when 'in_mediation' then 'pendiente'
                when 'rejected'     then 'rechazado'
                when 'cancelled'    then 'rechazado'
                when 'refunded'     then 'reembolsado'
                when 'charged_back' then 'reembolsado'
                else 'pendiente'
              end;

  update public.pagos pg
     set estado           = v_estado,
         referencia       = p_payment_id,
         mp_status        = p_status,
         mp_status_detail = p_status_detail,
         monto            = coalesce(p_monto, pg.monto),
         fecha_pago       = case when v_estado = 'aprobado'
                                 then coalesce(pg.fecha_pago, now())
                                 else pg.fecha_pago end
    from public.pedidos p
   where p.id = pg.pedido_id
     and p.folio = upper(trim(p_folio))
  returning p.id into v_pedido_id;

  if v_pedido_id is null then
    raise exception 'Pedido % no encontrado', p_folio;
  end if;

  -- Pago aprobado: el pedido pasa a preparación
  if v_estado = 'aprobado' then
    update public.pedidos
       set estado = 'preparando'
     where id = v_pedido_id and estado = 'pendiente';
  end if;

  return v_estado;
end $$;

-- Nadie desde la tienda puede llamar estas funciones; solo el servidor
revoke all on function public.mp_datos_preferencia(text)                          from public, anon, authenticated;
revoke all on function public.mp_guardar_preferencia(text, text)                  from public, anon, authenticated;
revoke all on function public.mp_registrar_pago(text, text, text, text, numeric)  from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.mp_datos_preferencia(text)                         to service_role;
    grant execute on function public.mp_guardar_preferencia(text, text)                 to service_role;
    grant execute on function public.mp_registrar_pago(text, text, text, text, numeric) to service_role;
  end if;
end $$;

-- Vista de pagos con datos de Mercado Pago (para Lucy)
drop view if exists public.vista_pagos_recibidos;
create view public.vista_pagos_recibidos
with (security_invoker = true) as
select p.folio, p.nombre_cliente, pg.metodo, pg.monto, pg.estado,
       pg.referencia, pg.mp_status, pg.mp_status_detail,
       pg.fecha_pago, pg.creado_en
from public.pagos pg
join public.pedidos p on p.id = pg.pedido_id;

notify pgrst, 'reload schema';
