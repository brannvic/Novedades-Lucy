-- =====================================================================
--  NOVEDADES LUCY · Panel de administración para Lucy (/admin)
--  Lucy no usa SQL: todo lo hace desde su celular con estas funciones.
--  Cada función revisa primero que quien la llama sea administrador
--  (perfiles.es_admin = true). Los clientes no pueden usarlas.
--
--  · vendedores: Lucy y sus hijos (quién hizo cada venta en el local).
--  · admin_registrar_venta(): venta en el local; descuenta inventario.
--  · admin_cambiar_existencias / admin_guardar_producto: inventario diario.
--  · admin_pedidos(): pedidos en línea (en persona / paquetería).
--  · admin_confirmar_pago / admin_cambiar_estado / admin_guardar_guia.
--  · admin_corte(): cuánto vendió cada quien en el día.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ¿Es administrador?
-- ---------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false);
$$;

grant execute on function public.es_admin() to anon, authenticated;

create or replace function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
end $$;

revoke all on function public.exigir_admin() from public, anon;
grant execute on function public.exigir_admin() to authenticated;

-- Fecha de hoy en la Ciudad de México
create or replace function public.hoy_mx()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Mexico_City')::date; $$;

-- ---------------------------------------------------------------------
-- 2. Vendedores (Lucy y sus hijos)
-- ---------------------------------------------------------------------
create table if not exists public.vendedores (
  id         bigint generated always as identity primary key,
  nombre     text not null unique,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

alter table public.vendedores enable row level security;
drop policy if exists "admin vendedores" on public.vendedores;
create policy "admin vendedores" on public.vendedores
  for select to authenticated using (public.es_admin());
grant select on public.vendedores to authenticated;

insert into public.vendedores (nombre) values ('Lucy')
on conflict (nombre) do nothing;

-- Ventas en el local vs. tienda en línea
alter table public.pedidos add column if not exists canal text not null default 'en_linea';
alter table public.pedidos drop constraint if exists pedidos_canal_check;
alter table public.pedidos add constraint pedidos_canal_check
  check (canal in ('en_linea', 'mostrador'));
alter table public.pedidos add column if not exists vendedor_id bigint
  references public.vendedores (id);

create index if not exists idx_pedidos_canal_fecha on public.pedidos (canal, creado_en);

-- ---------------------------------------------------------------------
-- 3. Lucy puede ver todo (lectura) desde su cuenta de administradora
-- ---------------------------------------------------------------------
drop policy if exists "admin ve pedidos" on public.pedidos;
create policy "admin ve pedidos" on public.pedidos
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve items" on public.pedido_items;
create policy "admin ve items" on public.pedido_items
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve pagos" on public.pagos;
create policy "admin ve pagos" on public.pagos
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve envios" on public.envios;
create policy "admin ve envios" on public.envios
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve entregas" on public.entregas_presenciales;
create policy "admin ve entregas" on public.entregas_presenciales
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve productos" on public.productos;
create policy "admin ve productos" on public.productos
  for select to authenticated using (public.es_admin());

drop policy if exists "admin ve movimientos" on public.movimientos_inventario;
create policy "admin ve movimientos" on public.movimientos_inventario
  for select to authenticated using (public.es_admin());
grant select on public.movimientos_inventario to authenticated;

-- ---------------------------------------------------------------------
-- 4. Inventario
-- ---------------------------------------------------------------------
-- Lista completa (incluye productos ocultos) con precios del día
create or replace function public.admin_productos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_temporada boolean := public.es_temporada();
begin
  perform public.exigir_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id, 'nombre', p.nombre, 'categoria', p.categoria,
             'emoji', p.emoji, 'existencias', p.existencias, 'activo', p.activo,
             'precio_lista', p.precio_mayoreo,
             'precio_mayoreo', public.precio_pieza(p.precio_mayoreo, true,  v_temporada),
             'precio_menudeo', public.precio_pieza(p.precio_mayoreo, false, v_temporada))
           order by p.activo desc, p.categoria, p.nombre)
    from public.productos p), '[]'::jsonb);
end $$;

-- Sumar o restar piezas (+ llegó mercancía, − se dañó / conteo)
create or replace function public.admin_cambiar_existencias(
  p_producto_id bigint,
  p_cambio      integer,
  p_nota        text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nueva integer;
begin
  perform public.exigir_admin();

  if p_cambio = 0 then
    select existencias into v_nueva from public.productos where id = p_producto_id;
    return v_nueva;
  end if;

  update public.productos
     set existencias = greatest(0, existencias + p_cambio)
   where id = p_producto_id
  returning existencias into v_nueva;

  if not found then
    raise exception 'Producto % no existe', p_producto_id;
  end if;

  insert into public.movimientos_inventario
    (producto_id, tipo, cantidad, existencia_resultante, nota)
  values (p_producto_id,
          case when p_cambio > 0 then 'entrada' else 'ajuste' end,
          p_cambio, v_nueva, coalesce(p_nota, 'Panel de Lucy'));

  return v_nueva;
end $$;

-- Crear producto nuevo o cambiar nombre / categoría / precio / visible
create or replace function public.admin_guardar_producto(
  p_id          bigint,     -- null = producto nuevo
  p_nombre      text,
  p_categoria   text,
  p_precio      numeric,    -- precio de lista (mayoreo, sin temporada)
  p_existencias integer default 0,
  p_activo      boolean default true
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_emoji text := case p_categoria
                    when 'Bebés' then '👶🏻' when 'Muñecas' then '👧🏻'
                    when 'Con sonido' then '🔊' when 'Personajes' then '🎀'
                    else '🧸' end;
begin
  perform public.exigir_admin();

  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'Escribe el nombre del producto';
  end if;
  if p_precio is null or p_precio <= 0 then
    raise exception 'Escribe un precio válido';
  end if;

  if p_id is null then
    insert into public.productos (nombre, categoria, precio_mayoreo, existencias, emoji, activo)
    values (trim(p_nombre), p_categoria, p_precio, greatest(0, coalesce(p_existencias, 0)),
            v_emoji, coalesce(p_activo, true))
    returning id into v_id;

    if coalesce(p_existencias, 0) > 0 then
      insert into public.movimientos_inventario
        (producto_id, tipo, cantidad, existencia_resultante, nota)
      values (v_id, 'entrada', p_existencias, p_existencias, 'Alta de producto');
    end if;
  else
    update public.productos
       set nombre = trim(p_nombre),
           categoria = p_categoria,
           precio_mayoreo = p_precio,
           activo = coalesce(p_activo, activo)
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Producto % no existe', p_id;
    end if;
  end if;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 5. Vendedores
-- ---------------------------------------------------------------------
create or replace function public.admin_guardar_vendedor(p_nombre text, p_activo boolean default true)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  perform public.exigir_admin();
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'Escribe el nombre';
  end if;
  insert into public.vendedores (nombre, activo)
  values (trim(p_nombre), coalesce(p_activo, true))
  on conflict (nombre) do update set activo = excluded.activo
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 6. VENTA EN EL LOCAL
--    p_items: [{"producto_id": 1, "cantidad": 2, "precio_unitario": 150 (opcional)}]
--    Si no se manda precio, se usa el del día (menudeo/mayoreo/temporada).
-- ---------------------------------------------------------------------
create or replace function public.admin_registrar_venta(
  p_vendedor_id bigint,
  p_metodo_pago text,
  p_items       jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item      record;
  v_prod      public.productos%rowtype;
  v_piezas    integer;
  v_mayoreo   boolean;
  v_temporada boolean := public.es_temporada();
  v_cfg       public.configuracion%rowtype;
  v_precio    numeric(10,2);
  v_total     numeric(10,2) := 0;
  v_pedido_id bigint;
  v_folio     text;
  v_vendedor  text;
begin
  perform public.exigir_admin();
  select * into v_cfg from public.configuracion limit 1;

  select nombre into v_vendedor from public.vendedores where id = p_vendedor_id and activo;
  if v_vendedor is null then
    raise exception 'Elige quién hizo la venta';
  end if;

  if p_metodo_pago not in ('efectivo', 'transferencia', 'tarjeta') then
    raise exception 'Elige cómo pagó el cliente';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Agrega al menos un producto';
  end if;

  select coalesce(sum((i ->> 'cantidad')::int), 0) into v_piezas
  from jsonb_array_elements(p_items) i;
  if v_piezas <= 0 then
    raise exception 'Cantidad inválida';
  end if;
  v_mayoreo := v_piezas >= v_cfg.piezas_mayoreo;

  -- Validar existencias
  for v_item in
    select (i ->> 'producto_id')::bigint as producto_id,
           sum((i ->> 'cantidad')::int)::int as cantidad
    from jsonb_array_elements(p_items) i group by 1 order by 1
  loop
    select * into v_prod from public.productos where id = v_item.producto_id for update;
    if not found then
      raise exception 'Producto no encontrado';
    end if;
    if v_prod.existencias < v_item.cantidad then
      raise exception 'SIN_EXISTENCIAS: % (quedan %)', v_prod.nombre, v_prod.existencias;
    end if;
  end loop;

  insert into public.pedidos (canal, vendedor_id, nombre_cliente, telefono,
                              modalidad, metodo_pago, tipo_entrega, fecha_entrega,
                              es_temporada, estado)
  values ('mostrador', p_vendedor_id, 'Venta en el local', '-',
          case when v_mayoreo then 'mayoreo' else 'menudeo' end,
          p_metodo_pago, 'presencial', public.hoy_mx(), v_temporada, 'entregado')
  returning id, folio into v_pedido_id, v_folio;

  for v_item in
    select (i ->> 'producto_id')::bigint as producto_id,
           (i ->> 'cantidad')::int as cantidad,
           nullif(i ->> 'precio_unitario', '')::numeric as precio
    from jsonb_array_elements(p_items) i
  loop
    select * into v_prod from public.productos where id = v_item.producto_id;
    v_precio := coalesce(v_item.precio,
                         public.precio_pieza(v_prod.precio_mayoreo, v_mayoreo, v_temporada));

    insert into public.pedido_items (pedido_id, producto_id, descripcion, cantidad, precio_unitario)
    values (v_pedido_id, v_prod.id, concat_ws(' — ', v_prod.nombre, v_prod.modelo),
            v_item.cantidad, v_precio);

    update public.productos set existencias = existencias - v_item.cantidad
     where id = v_prod.id
    returning existencias into v_prod.existencias;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, existencia_resultante, pedido_id, nota)
    values (v_prod.id, 'venta', -v_item.cantidad, v_prod.existencias, v_pedido_id,
            'Venta en local · ' || v_vendedor);

    v_total := v_total + v_precio * v_item.cantidad;
  end loop;

  update public.pedidos set subtotal = v_total, total = v_total where id = v_pedido_id;

  insert into public.pagos (pedido_id, metodo, monto, estado, fecha_pago)
  values (v_pedido_id, p_metodo_pago, v_total, 'aprobado', now());

  return jsonb_build_object('folio', v_folio, 'total', v_total, 'piezas', v_piezas,
                            'vendedor', v_vendedor);
end $$;

-- Deshacer una venta del local (por error): regresa las piezas
create or replace function public.admin_cancelar_venta(p_folio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.exigir_admin();
  -- El trigger trg_reponer_inventario (Capítulo 2) regresa las piezas
  update public.pedidos set estado = 'cancelado'
   where folio = upper(trim(p_folio)) and canal = 'mostrador' and estado <> 'cancelado';
  if not found then
    raise exception 'Venta % no encontrada', p_folio;
  end if;
  update public.pagos pg set estado = 'reembolsado'
    from public.pedidos p where p.id = pg.pedido_id and p.folio = upper(trim(p_folio));
end $$;

-- ---------------------------------------------------------------------
-- 7. PEDIDOS EN LÍNEA (para entregar)
--    p_abiertos = true → solo los que faltan por entregar
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
                       from public.envios e where e.pedido_id = p.id))
           order by p.fecha_entrega, p.creado_en)
    from public.pedidos p
    left join public.pagos pg on pg.pedido_id = p.id
    where p.canal = 'en_linea'
      and (not p_abiertos or p.estado in ('pendiente', 'preparando', 'listo', 'enviado'))
      and (p_abiertos or p.creado_en > now() - interval '30 days')
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_confirmar_pago(p_folio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.exigir_admin();
  update public.pagos pg
     set estado = 'aprobado', fecha_pago = coalesce(pg.fecha_pago, now())
    from public.pedidos p
   where p.id = pg.pedido_id and p.folio = upper(trim(p_folio));
  if not found then
    raise exception 'Pedido % no encontrado', p_folio;
  end if;
  update public.pedidos set estado = 'preparando'
   where folio = upper(trim(p_folio)) and estado = 'pendiente';
end $$;

create or replace function public.admin_cambiar_estado(p_folio text, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.exigir_admin();
  update public.pedidos set estado = p_estado where folio = upper(trim(p_folio));
  if not found then
    raise exception 'Pedido % no encontrado', p_folio;
  end if;
  if p_estado = 'entregado' then
    update public.entregas_presenciales ep set recogido = true, recogido_en = now()
      from public.pedidos p where p.id = ep.pedido_id and p.folio = upper(trim(p_folio));
    update public.envios e set estado_envio = 'entregado'
      from public.pedidos p where p.id = e.pedido_id and p.folio = upper(trim(p_folio));
  end if;
end $$;

create or replace function public.admin_guardar_guia(p_folio text, p_paqueteria text, p_numero text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.exigir_admin();
  return public.registrar_guia(p_folio, p_paqueteria, p_numero);
end $$;

-- ---------------------------------------------------------------------
-- 8. CORTE DEL DÍA: cuánto vendió cada quien
-- ---------------------------------------------------------------------
create or replace function public.admin_corte(p_fecha date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_fecha date := coalesce(p_fecha, public.hoy_mx());
begin
  perform public.exigir_admin();

  return jsonb_build_object(
    'fecha', v_fecha,
    'vendedores', coalesce((
      select jsonb_agg(x order by (x ->> 'total')::numeric desc) from (
        select jsonb_build_object(
          'vendedor', v.nombre,
          'ventas', count(distinct p.id),
          'piezas', coalesce(sum(i.cantidad), 0),
          'total', coalesce(sum(i.cantidad * i.precio_unitario), 0),
          'efectivo', coalesce(sum(i.cantidad * i.precio_unitario) filter (where p.metodo_pago = 'efectivo'), 0),
          'transferencia', coalesce(sum(i.cantidad * i.precio_unitario) filter (where p.metodo_pago = 'transferencia'), 0),
          'tarjeta', coalesce(sum(i.cantidad * i.precio_unitario) filter (where p.metodo_pago = 'tarjeta'), 0),
          'productos', (
            select jsonb_agg(jsonb_build_object('producto', d.descripcion,
                                                'cantidad', d.cantidad,
                                                'importe', d.importe) order by d.cantidad desc)
            from (select i2.descripcion, sum(i2.cantidad) as cantidad,
                         sum(i2.cantidad * i2.precio_unitario) as importe
                  from public.pedidos p2
                  join public.pedido_items i2 on i2.pedido_id = p2.id
                  where p2.canal = 'mostrador' and p2.vendedor_id = v.id
                    and p2.estado <> 'cancelado'
                    and (p2.creado_en at time zone 'America/Mexico_City')::date = v_fecha
                  group by i2.descripcion) d),
          'ventas_detalle', (
            select jsonb_agg(jsonb_build_object('folio', p3.folio, 'total', p3.total,
                                                'metodo_pago', p3.metodo_pago,
                                                'hora', to_char(p3.creado_en at time zone 'America/Mexico_City', 'HH24:MI'))
                             order by p3.creado_en desc)
            from public.pedidos p3
            where p3.canal = 'mostrador' and p3.vendedor_id = v.id
              and p3.estado <> 'cancelado'
              and (p3.creado_en at time zone 'America/Mexico_City')::date = v_fecha)
        ) as x
        from public.vendedores v
        join public.pedidos p on p.vendedor_id = v.id
             and p.canal = 'mostrador' and p.estado <> 'cancelado'
             and (p.creado_en at time zone 'America/Mexico_City')::date = v_fecha
        join public.pedido_items i on i.pedido_id = p.id
        group by v.id, v.nombre
      ) t), '[]'::jsonb),
    'local', (
      select jsonb_build_object(
        'total', coalesce(sum(p.total), 0),
        'efectivo', coalesce(sum(p.total) filter (where p.metodo_pago = 'efectivo'), 0),
        'transferencia', coalesce(sum(p.total) filter (where p.metodo_pago = 'transferencia'), 0),
        'tarjeta', coalesce(sum(p.total) filter (where p.metodo_pago = 'tarjeta'), 0))
      from public.pedidos p
      where p.canal = 'mostrador' and p.estado <> 'cancelado'
        and (p.creado_en at time zone 'America/Mexico_City')::date = v_fecha),
    'en_linea', (
      select jsonb_build_object(
        'pedidos', count(*),
        'total', coalesce(sum(p.total), 0),
        'pagado', coalesce(sum(p.total) filter (where pg.estado = 'aprobado'), 0))
      from public.pedidos p
      left join public.pagos pg on pg.pedido_id = p.id
      where p.canal = 'en_linea' and p.estado <> 'cancelado'
        and (p.creado_en at time zone 'America/Mexico_City')::date = v_fecha)
  );
end $$;

-- ---------------------------------------------------------------------
-- 9. Permisos: solo usuarios con sesión (y la función revisa es_admin)
-- ---------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'admin_productos()',
    'admin_cambiar_existencias(bigint, integer, text)',
    'admin_guardar_producto(bigint, text, text, numeric, integer, boolean)',
    'admin_guardar_vendedor(text, boolean)',
    'admin_registrar_venta(bigint, text, jsonb)',
    'admin_cancelar_venta(text)',
    'admin_pedidos(boolean)',
    'admin_confirmar_pago(text)',
    'admin_cambiar_estado(text, text)',
    'admin_guardar_guia(text, text, text)',
    'admin_corte(date)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
