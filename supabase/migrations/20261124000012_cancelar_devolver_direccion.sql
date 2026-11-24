-- =====================================================================
--  NOVEDADES LUCY · Cancelaciones, devoluciones y dirección del local
--  · El cliente cancela o pide devolución de SUS pedidos reales
--    (con su cuenta, o con folio + teléfono si compró sin cuenta).
--  · Cancelar: el pedido pasa a "cancelado" y las piezas regresan
--    al inventario (lo hace el disparador del Capítulo 2).
--  · Devolución: el pedido pasa a "devolucion_solicitada" y Lucy la
--    acepta o la rechaza desde su panel.
--  · Dirección real de recogida: Callejón de Girón, local 72.
--  · Se puede correr varias veces.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DIRECCIÓN DEL LOCAL
-- ---------------------------------------------------------------------
alter table public.entregas_presenciales
  alter column punto_entrega set default
  'Callejón de Girón, local 72, Col. Centro, C.P. 06020, Cuauhtémoc, CDMX (también: Apartado 31, Col. Centro, C.P. 06020, Cuauhtémoc, CDMX)';

update public.entregas_presenciales
   set punto_entrega = 'Callejón de Girón, local 72, Col. Centro, C.P. 06020, Cuauhtémoc, CDMX (también: Apartado 31, Col. Centro, C.P. 06020, Cuauhtémoc, CDMX)'
 where not recogido
   and punto_entrega like 'Girón 33%';

-- ---------------------------------------------------------------------
-- 2. ENCONTRAR EL PEDIDO DEL CLIENTE (cuenta, o folio + teléfono)
-- ---------------------------------------------------------------------
create or replace function public.pedido_del_cliente(p_folio text, p_telefono text)
returns public.pedidos
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.pedidos p
  where p.folio = upper(trim(p_folio))
    and p.canal = 'en_linea'
    and (
      (auth.uid() is not null and p.usuario_id = auth.uid())
      or (coalesce(p_telefono, '') <> ''
          and regexp_replace(p.telefono, '\D', '', 'g') = regexp_replace(p_telefono, '\D', '', 'g'))
    )
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 3. CANCELAR (antes de que el pedido salga)
-- ---------------------------------------------------------------------
create or replace function public.cancelar_pedido_cliente(
  p_folio    text,
  p_telefono text,
  p_motivo   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ped    public.pedidos;
  v_pagado boolean;
begin
  v_ped := public.pedido_del_cliente(p_folio, p_telefono);
  if v_ped.id is null then
    raise exception 'No encontramos ese pedido con esos datos';
  end if;
  if v_ped.estado = 'cancelado' then
    raise exception 'Este pedido ya está cancelado';
  end if;
  if v_ped.estado not in ('pendiente', 'preparando', 'listo') then
    raise exception 'Este pedido ya salió o se entregó; puedes solicitar una devolución';
  end if;

  select coalesce(bool_or(estado = 'aprobado'), false) into v_pagado
    from public.pagos where pedido_id = v_ped.id;

  -- El disparador reponer_inventario regresa las piezas
  update public.pedidos set estado = 'cancelado', actualizado_en = now()
   where id = v_ped.id;

  insert into public.solicitudes (pedido_id, tipo, motivo, estado)
  values (v_ped.id, 'cancelacion', left(p_motivo, 200), 'aceptada');

  return jsonb_build_object('folio', v_ped.folio, 'estado', 'cancelado', 'pagado', v_pagado);
end $$;

-- ---------------------------------------------------------------------
-- 4. SOLICITAR DEVOLUCIÓN (pedido ya entregado)
-- ---------------------------------------------------------------------
create or replace function public.solicitar_devolucion_cliente(
  p_folio      text,
  p_telefono   text,
  p_motivo     text,
  p_comentario text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ped public.pedidos;
begin
  v_ped := public.pedido_del_cliente(p_folio, p_telefono);
  if v_ped.id is null then
    raise exception 'No encontramos ese pedido con esos datos';
  end if;
  if v_ped.estado = 'devolucion_solicitada' then
    raise exception 'Ya solicitaste la devolución de este pedido';
  end if;
  if v_ped.estado <> 'entregado' then
    raise exception 'Solo se puede pedir devolución de un pedido ya entregado';
  end if;

  update public.pedidos set estado = 'devolucion_solicitada', actualizado_en = now()
   where id = v_ped.id;

  insert into public.solicitudes (pedido_id, tipo, motivo, comentario, estado)
  values (v_ped.id, 'devolucion', left(p_motivo, 200), left(p_comentario, 1000), 'pendiente');

  return jsonb_build_object('folio', v_ped.folio, 'estado', 'devolucion_solicitada');
end $$;

-- ---------------------------------------------------------------------
-- 5. PANEL DE LUCY: ver y atender las devoluciones pedidas
-- ---------------------------------------------------------------------
create or replace function public.admin_pedidos(p_abiertos boolean default true)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.exigir_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'folio', p.folio, 'cliente', p.nombre_cliente, 'telefono', p.telefono,
             'estado', p.estado, 'tipo_entrega', p.tipo_entrega,
             'metodo_pago', p.metodo_pago, 'pago_estado', pg.estado,
             'total', p.total, 'modalidad', p.modalidad,
             'fecha_entrega', p.fecha_entrega, 'creado_en', p.creado_en,
             'piezas', (select coalesce(sum(i.cantidad), 0) from public.pedido_items i where i.pedido_id = p.id),
             'items', (select jsonb_agg(jsonb_build_object('descripcion', i.descripcion,
                                                           'cantidad', i.cantidad,
                                                           'precio', i.precio_unitario) order by i.id)
                       from public.pedido_items i where i.pedido_id = p.id),
             'envio', (select jsonb_build_object('direccion', e.direccion, 'ciudad', e.ciudad,
                                                 'estado', e.estado_region, 'cp', e.codigo_postal,
                                                 'paqueteria', e.paqueteria,
                                                 'numero_rastreo', e.numero_rastreo,
                                                 'url_rastreo', e.url_rastreo)
                       from public.envios e where e.pedido_id = p.id),
             'solicitud', (select jsonb_build_object('motivo', s.motivo, 'comentario', s.comentario)
                           from public.solicitudes s
                           where s.pedido_id = p.id and s.tipo = 'devolucion'
                           order by s.creado_en desc limit 1))
           order by p.fecha_entrega, p.creado_en)
    from public.pedidos p
    left join public.pagos pg on pg.pedido_id = p.id
    where p.canal = 'en_linea'
      and (not p_abiertos or p.estado in ('pendiente', 'preparando', 'listo', 'enviado', 'devolucion_solicitada'))
      and (p_abiertos or p.creado_en > now() - interval '30 days')
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_cambiar_estado(p_folio text, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     bigint;
  v_antes  text;
begin
  perform public.exigir_admin();
  select id, estado into v_id, v_antes from public.pedidos where folio = upper(trim(p_folio));
  if v_id is null then
    raise exception 'Pedido % no encontrado', p_folio;
  end if;

  update public.pedidos set estado = p_estado, actualizado_en = now() where id = v_id;

  if p_estado = 'entregado' and v_antes <> 'devolucion_solicitada' then
    update public.entregas_presenciales set recogido = true, recogido_en = now() where pedido_id = v_id;
    update public.envios set estado_envio = 'entregado' where pedido_id = v_id;
  end if;

  -- Respuesta de Lucy a una devolución
  if v_antes = 'devolucion_solicitada' then
    update public.solicitudes
       set estado = case when p_estado = 'devuelto' then 'aceptada' else 'rechazada' end
     where pedido_id = v_id and tipo = 'devolucion' and estado = 'pendiente';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 6. PERMISOS
-- ---------------------------------------------------------------------
revoke all on function public.pedido_del_cliente(text, text) from public, anon, authenticated;
revoke all on function public.cancelar_pedido_cliente(text, text, text) from public;
revoke all on function public.solicitar_devolucion_cliente(text, text, text, text) from public;
grant execute on function public.cancelar_pedido_cliente(text, text, text) to anon, authenticated;
grant execute on function public.solicitar_devolucion_cliente(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
