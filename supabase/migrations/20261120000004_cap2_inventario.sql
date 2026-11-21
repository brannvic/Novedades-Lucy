-- =====================================================================
--  NOVEDADES LUCY · Capítulo 2 — Disponibilidad conforme a inventario
--  Mejora: "crear una función que permita conocer si el artículo está
--  disponible o no conforme a un inventario".
--
--  · productos.existencias es el inventario de cada artículo.
--  · disponibilidad(): dice si hay piezas suficientes.
--  · crear_pedido(): ya no vende más de lo que hay y descuenta existencias.
--  · Al cancelar o devolver un pedido, las piezas regresan al inventario.
--  · movimientos_inventario: bitácora de entradas, ventas y cancelaciones.
--  · registrar_entrada(): para cuando llegan bultos del proveedor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BITÁCORA DE MOVIMIENTOS
-- ---------------------------------------------------------------------
create table if not exists public.movimientos_inventario (
  id            bigint generated always as identity primary key,
  producto_id   bigint not null references public.productos (id),
  tipo          text   not null
                check (tipo in ('entrada', 'venta', 'cancelacion', 'devolucion', 'ajuste')),
  cantidad      integer not null,          -- positiva entra, negativa sale
  existencia_resultante integer not null,
  pedido_id     bigint references public.pedidos (id) on delete set null,
  nota          text,
  creado_en     timestamptz not null default now()
);

create index if not exists idx_movimientos_producto
  on public.movimientos_inventario (producto_id, creado_en desc);

alter table public.movimientos_inventario enable row level security;
-- Sin políticas: solo Lucy (panel de Supabase) la consulta.

-- ---------------------------------------------------------------------
-- 2. ¿ESTÁ DISPONIBLE?
-- ---------------------------------------------------------------------
create or replace function public.disponibilidad(
  p_producto_id bigint,
  p_cantidad    integer default 1
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'producto_id', p.id,
           'existencias', p.existencias,
           'disponible',  p.activo and p.existencias >= p_cantidad,
           'estado',      case when not p.activo or p.existencias = 0 then 'agotado'
                               when p.existencias <= 3 then 'ultimas_piezas'
                               else 'disponible' end)
  from public.productos p
  where p.id = p_producto_id;
$$;

grant execute on function public.disponibilidad(bigint, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. CATÁLOGO: se agregan columnas de disponibilidad
--    (se agregan al final para poder usar CREATE OR REPLACE VIEW)
-- ---------------------------------------------------------------------
create or replace view public.vista_catalogo
with (security_invoker = true) as
select p.id, p.nombre, p.modelo, p.categoria, p.descripcion,
       p.existencias, p.emoji, p.imagen_url, p.modelo_3d_url, p.activo,
       p.precio_mayoreo                                          as precio_lista,
       t.temporada                                               as es_temporada,
       public.precio_pieza(p.precio_mayoreo, true,  t.temporada) as precio_mayoreo,
       public.precio_pieza(p.precio_mayoreo, false, t.temporada) as precio_menudeo,
       p.existencias > 0                                         as disponible,
       case when p.existencias = 0 then 'agotado'
            when p.existencias <= 3 then 'ultimas_piezas'
            else 'disponible' end                                as estado_stock
from public.productos p
cross join (select public.es_temporada() as temporada) t
where p.activo;

grant select on public.vista_catalogo to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. ENTRADA DE MERCANCÍA (llegó un bulto del proveedor)
--    Uso en SQL Editor:  select registrar_entrada(5, 12, 'Bulto proveedor 1');
-- ---------------------------------------------------------------------
create or replace function public.registrar_entrada(
  p_producto_id bigint,
  p_cantidad    integer,
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
  if p_cantidad = 0 then
    raise exception 'La cantidad no puede ser 0';
  end if;

  update public.productos
     set existencias = existencias + p_cantidad
   where id = p_producto_id
  returning existencias into v_nueva;

  if not found then
    raise exception 'Producto % no existe', p_producto_id;
  end if;

  insert into public.movimientos_inventario
    (producto_id, tipo, cantidad, existencia_resultante, nota)
  values (p_producto_id,
          case when p_cantidad > 0 then 'entrada' else 'ajuste' end,
          p_cantidad, v_nueva, p_nota);

  return v_nueva;
end $$;

revoke all on function public.registrar_entrada(bigint, integer, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. crear_pedido(): valida y descuenta existencias
--    Si no alcanza, responde con el error SIN_EXISTENCIAS y no guarda nada.
-- ---------------------------------------------------------------------
create or replace function public.crear_pedido(datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items        jsonb := datos -> 'items';
  v_item         record;
  v_prod         public.productos%rowtype;
  v_cfg          public.configuracion%rowtype;
  v_piezas       integer;
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

  if exists (select 1 from jsonb_array_elements(v_items) i
             where coalesce((i ->> 'cantidad')::int, 0) <= 0) then
    raise exception 'Cantidad inválida';
  end if;

  -- 1) Validar existencias, bloqueando las filas para que dos clientes
  --    no compren la última pieza al mismo tiempo
  for v_item in select (i ->> 'producto_id')::bigint as producto_id,
                         sum((i ->> 'cantidad')::int)::int as cantidad
                  from jsonb_array_elements(v_items) i
                  group by 1 order by 1 loop
    select * into v_prod from public.productos
     where id = v_item.producto_id and activo
     for update;
    if not found then
      raise exception 'Producto % no existe o no está activo', v_item.producto_id;
    end if;
    if v_prod.existencias < v_item.cantidad then
      raise exception 'SIN_EXISTENCIAS: % (quedan %)', v_prod.nombre, v_prod.existencias
        using errcode = 'P0001';
    end if;
  end loop;

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

  -- 2) Registrar renglones y descontar inventario
  for v_item in select (i ->> 'producto_id')::bigint as producto_id,
                         sum((i ->> 'cantidad')::int)::int as cantidad
                  from jsonb_array_elements(v_items) i
                  group by 1 order by 1 loop
    select * into v_prod from public.productos where id = v_item.producto_id;

    v_precio := public.precio_pieza(v_prod.precio_mayoreo, v_mayoreo, v_temporada);

    insert into public.pedido_items (pedido_id, producto_id, descripcion, cantidad, precio_unitario)
    values (v_pedido_id, v_prod.id, concat_ws(' — ', v_prod.nombre, v_prod.modelo),
            v_item.cantidad, v_precio);

    update public.productos
       set existencias = existencias - v_item.cantidad
     where id = v_prod.id;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, existencia_resultante, pedido_id)
    values (v_prod.id, 'venta', -v_item.cantidad,
            v_prod.existencias - v_item.cantidad, v_pedido_id);

    v_subtotal := v_subtotal + v_precio * v_item.cantidad;
    if v_temporada then
      v_recargo := v_recargo + v_cfg.recargo_temporada * v_item.cantidad;
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

-- ---------------------------------------------------------------------
-- 6. CANCELACIÓN / DEVOLUCIÓN: las piezas regresan al inventario
--    Se dispara cuando Lucy cambia pedidos.estado a 'cancelado' o 'devuelto'.
-- ---------------------------------------------------------------------
create or replace function public.reponer_inventario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_nueva integer;
begin
  if new.estado in ('cancelado', 'devuelto')
     and old.estado not in ('cancelado', 'devuelto') then
    for v_item in
      select producto_id, sum(cantidad) as cantidad
      from public.pedido_items where pedido_id = new.id
      group by producto_id
    loop
      update public.productos
         set existencias = existencias + v_item.cantidad
       where id = v_item.producto_id
      returning existencias into v_nueva;

      insert into public.movimientos_inventario
        (producto_id, tipo, cantidad, existencia_resultante, pedido_id)
      values (v_item.producto_id,
              case when new.estado = 'cancelado' then 'cancelacion' else 'devolucion' end,
              v_item.cantidad, v_nueva, new.id);
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_reponer_inventario on public.pedidos;
create trigger trg_reponer_inventario
  after update of estado on public.pedidos
  for each row execute function public.reponer_inventario();

-- ---------------------------------------------------------------------
-- 7. VISTA PARA LUCY: inventario bajo
-- ---------------------------------------------------------------------
create or replace view public.vista_inventario_bajo
with (security_invoker = true) as
select id, nombre, categoria, existencias
from public.productos
where activo and existencias <= 3
order by existencias, nombre;

notify pgrst, 'reload schema';
