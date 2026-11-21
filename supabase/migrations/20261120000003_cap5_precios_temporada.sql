-- =====================================================================
--  NOVEDADES LUCY · Capítulo 5 — Precios reales y recargo de temporada
--  Reglas del negocio (Lucy):
--    · Mayoreo a partir de 3 piezas: se respeta el precio de lista.
--    · Menudeo (1 o 2 piezas): +$10 por pieza.
--    · Temporada (octubre a enero): +$20 por pieza, en menudeo y mayoreo.
--      Ej. lista $150 → temporada: mayoreo $170, menudeo $180.
--  Los precios de lista ya se cargaron con supabase/seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN EDITABLE (Lucy puede cambiarla desde Table Editor)
-- ---------------------------------------------------------------------
create table if not exists public.configuracion (
  id                  boolean primary key default true check (id), -- una sola fila
  recargo_temporada   numeric(10,2) not null default 20,
  incremento_menudeo  numeric(10,2) not null default 10,
  piezas_mayoreo      integer not null default 3,
  meses_temporada     integer[] not null default array[10, 11, 12, 1],
  actualizado_en      timestamptz not null default now()
);

insert into public.configuracion (id) values (true)
on conflict (id) do nothing;

alter table public.configuracion enable row level security;
drop policy if exists "configuracion publica" on public.configuracion;
create policy "configuracion publica" on public.configuracion
  for select to anon, authenticated using (true);
grant select on public.configuracion to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. ¿ESTAMOS EN TEMPORADA? (hora de la Ciudad de México)
-- ---------------------------------------------------------------------
create or replace function public.es_temporada(
  p_fecha date default (now() at time zone 'America/Mexico_City')::date
)
returns boolean
language sql
stable
as $$
  select extract(month from p_fecha)::int = any (c.meses_temporada)
  from public.configuracion c;
$$;

-- ---------------------------------------------------------------------
-- 3. PRECIO POR PIEZA según modalidad y temporada
-- ---------------------------------------------------------------------
create or replace function public.precio_pieza(
  p_precio_lista numeric,
  p_mayoreo      boolean,
  p_temporada    boolean
)
returns numeric
language sql
stable
as $$
  select p_precio_lista
       + case when p_mayoreo   then 0 else c.incremento_menudeo end
       + case when p_temporada then c.recargo_temporada else 0 end
  from public.configuracion c;
$$;

-- ---------------------------------------------------------------------
-- 4. CATÁLOGO CON PRECIOS DEL DÍA (lo que lee la tienda)
-- ---------------------------------------------------------------------
create or replace view public.vista_catalogo
with (security_invoker = true) as
select p.id, p.nombre, p.modelo, p.categoria, p.descripcion,
       p.existencias, p.emoji, p.imagen_url, p.modelo_3d_url, p.activo,
       p.precio_mayoreo                                      as precio_lista,
       t.temporada                                           as es_temporada,
       public.precio_pieza(p.precio_mayoreo, true,  t.temporada) as precio_mayoreo,
       public.precio_pieza(p.precio_mayoreo, false, t.temporada) as precio_menudeo
from public.productos p
cross join (select public.es_temporada() as temporada) t
where p.activo;

grant select on public.vista_catalogo to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. crear_pedido() con temporada
--    · El precio unitario guardado YA incluye el recargo de temporada.
--    · pedidos.recargo_temporada guarda cuánto del total fue por temporada
--      (informativo, para reportes); no se vuelve a sumar.
-- ---------------------------------------------------------------------
create or replace function public.crear_pedido(datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items        jsonb := datos -> 'items';
  v_item         jsonb;
  v_prod         public.productos%rowtype;
  v_cfg          public.configuracion%rowtype;
  v_piezas       integer;
  v_cantidad     integer;
  v_mayoreo      boolean;
  v_temporada    boolean := public.es_temporada();
  v_precio       numeric(10,2);
  v_subtotal     numeric(10,2) := 0;
  v_recargo      numeric(10,2) := 0;
  v_pedido_id    bigint;
  v_folio        text;
  v_metodo       text := datos ->> 'metodo_pago';
  v_entrega      text := datos ->> 'tipo_entrega';
  v_fecha        date := (datos ->> 'fecha_entrega')::date;
begin
  select * into v_cfg from public.configuracion limit 1;

  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  select coalesce(sum((i ->> 'cantidad')::int), 0) into v_piezas
  from jsonb_array_elements(v_items) i;
  v_mayoreo := v_piezas >= v_cfg.piezas_mayoreo;

  insert into public.pedidos (usuario_id, nombre_cliente, telefono, correo,
                              modalidad, metodo_pago, tipo_entrega, fecha_entrega,
                              es_temporada)
  values (auth.uid(),
          datos -> 'cliente' ->> 'nombre',
          datos -> 'cliente' ->> 'telefono',
          datos -> 'cliente' ->> 'correo',
          case when v_mayoreo then 'mayoreo' else 'menudeo' end,
          v_metodo, v_entrega, v_fecha, v_temporada)
  returning id, folio into v_pedido_id, v_folio;

  for v_item in select * from jsonb_array_elements(v_items) loop
    select * into v_prod from public.productos
    where id = (v_item ->> 'producto_id')::bigint and activo;
    if not found then
      raise exception 'Producto % no existe o no está activo', v_item ->> 'producto_id';
    end if;

    v_cantidad := (v_item ->> 'cantidad')::int;
    v_precio   := public.precio_pieza(v_prod.precio_mayoreo, v_mayoreo, v_temporada);

    insert into public.pedido_items (pedido_id, producto_id, descripcion, cantidad, precio_unitario)
    values (v_pedido_id, v_prod.id, concat_ws(' — ', v_prod.nombre, v_prod.modelo),
            v_cantidad, v_precio);

    v_subtotal := v_subtotal + v_precio * v_cantidad;
    if v_temporada then
      v_recargo := v_recargo + v_cfg.recargo_temporada * v_cantidad;
    end if;
  end loop;

  update public.pedidos
     set subtotal          = v_subtotal,
         recargo_temporada = v_recargo,
         total             = v_subtotal + costo_envio
   where id = v_pedido_id;

  insert into public.pagos (pedido_id, metodo, monto)
  values (v_pedido_id, v_metodo, v_subtotal);

  if v_entrega = 'paqueteria' then
    insert into public.envios (pedido_id, nombre_destinatario, telefono, direccion,
                               ciudad, estado_region, codigo_postal, pais, tipo)
    values (v_pedido_id,
            datos -> 'cliente' ->> 'nombre',
            datos -> 'cliente' ->> 'telefono',
            datos -> 'envio' ->> 'direccion',
            datos -> 'envio' ->> 'ciudad',
            datos -> 'envio' ->> 'estado',
            datos -> 'envio' ->> 'codigo_postal',
            coalesce(datos -> 'envio' ->> 'pais', 'México'),
            case when coalesce(datos -> 'envio' ->> 'pais', 'México') = 'México'
                 then 'nacional' else 'internacional' end);
  else
    insert into public.entregas_presenciales (pedido_id, fecha_recogida)
    values (v_pedido_id, v_fecha);
  end if;

  return jsonb_build_object('folio', v_folio,
                            'modalidad', case when v_mayoreo then 'mayoreo' else 'menudeo' end,
                            'es_temporada', v_temporada,
                            'recargo_temporada', v_recargo,
                            'subtotal', v_subtotal,
                            'total', v_subtotal);
end $$;

revoke all on function public.crear_pedido(jsonb) from public;
grant execute on function public.crear_pedido(jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
