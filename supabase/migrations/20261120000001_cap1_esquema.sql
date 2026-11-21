-- =====================================================================
--  NOVEDADES LUCY · Capítulo 1 — Base de datos
--  Mejora: "crear un database que guarde en una pestaña la info de los
--  envíos, en otra los pagos que se han recibido y en otra los pedidos
--  que se entregarán en persona".
--
--  Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
--  Es seguro volver a ejecutarlo (usa IF NOT EXISTS / OR REPLACE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. RESPALDO DE TABLAS ANTERIORES
--    Si ya existía una tabla con el mismo nombre pero con otra estructura
--    (p. ej. de la integración inicial), se RENOMBRA a <tabla>_respaldo_<fecha>
--    en lugar de borrarla. No se pierde información.
-- ---------------------------------------------------------------------
do $$
declare
  t record;
  hay_diferencias boolean := false;
  sufijo text := '_respaldo_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  tablas text[] := array['solicitudes','cotizaciones','entregas_presenciales','envios',
                         'pagos','pedido_items','pedidos','productos'];
  nombre text;
begin
  -- 1) ¿Alguna tabla existente no coincide con la estructura nueva?
  for t in
    select * from (values
      ('productos',             array['precio_mayoreo','existencias','categoria','activo']),
      ('pedidos',               array['folio','modalidad','metodo_pago','tipo_entrega','fecha_entrega']),
      ('pedido_items',          array['pedido_id','producto_id','precio_unitario','descripcion']),
      ('pagos',                 array['pedido_id','metodo','monto','estado']),
      ('envios',                array['pedido_id','nombre_destinatario','codigo_postal','estado_envio']),
      ('entregas_presenciales', array['pedido_id','fecha_recogida','recogido']),
      ('cotizaciones',          array['folio','producto_id','modalidad','vigente_hasta']),
      ('solicitudes',           array['pedido_id','tipo','estado'])
    ) as v(tabla, columnas)
  loop
    if to_regclass('public.' || t.tabla) is not null then
      -- columnas que faltan
      if exists (select 1 from unnest(t.columnas) c
                 where not exists (select 1 from information_schema.columns ic
                                   where ic.table_schema = 'public'
                                     and ic.table_name = t.tabla
                                     and ic.column_name = c)) then
        hay_diferencias := true;
      end if;
      -- ids que no son numéricos (p. ej. uuid de la versión anterior)
      if exists (select 1 from information_schema.columns ic
                 where ic.table_schema = 'public'
                   and ic.table_name = t.tabla
                   and ic.column_name in ('id', 'pedido_id', 'producto_id')
                   and ic.data_type <> 'bigint') then
        hay_diferencias := true;
      end if;
    end if;
  end loop;

  -- 2) Si algo no coincide, se respaldan TODAS las tablas existentes del conjunto
  if hay_diferencias then
    drop view if exists public.vista_envios;
    drop view if exists public.vista_pagos_recibidos;
    drop view if exists public.vista_entregas_presenciales;
    foreach nombre in array tablas loop
      if to_regclass('public.' || nombre) is not null then
        execute format('alter table public.%I rename to %I', nombre, nombre || sufijo);
        -- los índices propios también se renombran para no chocar con los nuevos
        for t in
          select i.indexname from pg_indexes i
          where i.schemaname = 'public' and i.tablename = nombre || sufijo
            and not exists (select 1 from pg_constraint c where c.conname = i.indexname)
        loop
          execute format('alter index public.%I rename to %I',
                         t.indexname, left(t.indexname, 40) || '_r' || to_char(now(), 'MMDDHH24MISS'));
        end loop;
        raise notice 'Tabla % respaldada como %', nombre, nombre || sufijo;
      end if;
    end loop;
  end if;
end $$;

-- Las vistas se recrean abajo; se quitan por si apuntaban a tablas renombradas
drop view if exists public.vista_envios;
drop view if exists public.vista_pagos_recibidos;
drop view if exists public.vista_entregas_presenciales;

-- ---------------------------------------------------------------------
-- 1. PRODUCTOS (catálogo)
-- ---------------------------------------------------------------------
create table if not exists public.productos (
  id              bigint generated always as identity primary key,
  nombre          text        not null,
  modelo          text,
  categoria       text        not null,
  descripcion     text,
  -- Regla del negocio: en mayoreo se respeta el precio,
  -- en menudeo la pieza sube $10.
  precio_mayoreo  numeric(10,2) not null check (precio_mayoreo > 0),
  precio_menudeo  numeric(10,2) generated always as (precio_mayoreo + 10) stored,
  existencias     integer     not null default 0 check (existencias >= 0),
  emoji           text,                       -- usado por el prototipo actual
  imagen_url      text,                       -- Capítulo 3 (imágenes reales)
  modelo_3d_url   text,                       -- Capítulo 3 (vista 360° / RV)
  activo          boolean     not null default true,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Ajustes idempotentes (por si la tabla ya existía de una versión anterior)
alter table public.productos alter column modelo drop not null;
alter table public.productos drop constraint if exists productos_categoria_check;
alter table public.productos add constraint productos_categoria_check
  check (categoria in ('Bebés', 'Muñecas', 'Con sonido', 'Personajes', 'Accesorios'));
create unique index if not exists productos_nombre_modelo_unico
  on public.productos (nombre, modelo) nulls not distinct;

-- ---------------------------------------------------------------------
-- 2. PEDIDOS (encabezado — equivale a la "nota" de papel)
-- ---------------------------------------------------------------------
create sequence if not exists public.pedidos_folio_seq;

create table if not exists public.pedidos (
  id              bigint generated always as identity primary key,
  folio           text not null unique
                  default ('NL-' || lpad(nextval('public.pedidos_folio_seq')::text, 4, '0')),
  usuario_id      uuid references auth.users (id) on delete set null, -- Capítulo 6
  nombre_cliente  text not null,
  telefono        text not null,
  correo          text,
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'preparando', 'listo', 'enviado',
                                    'entregado', 'cancelado',
                                    'devolucion_solicitada', 'devuelto')),
  modalidad       text not null check (modalidad in ('menudeo', 'mayoreo')),
  metodo_pago     text not null check (metodo_pago in ('transferencia', 'tarjeta', 'efectivo')),
  tipo_entrega    text not null check (tipo_entrega in ('paqueteria', 'presencial')),
  fecha_entrega   date not null,
  es_temporada    boolean not null default false,     -- octubre a enero (Capítulo 5)
  subtotal        numeric(10,2) not null default 0,
  costo_envio     numeric(10,2) not null default 0,
  recargo_temporada numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  -- Regla del negocio: el efectivo solo se acepta en entrega presencial.
  constraint efectivo_solo_presencial
    check (metodo_pago <> 'efectivo' or tipo_entrega = 'presencial')
);

-- ---------------------------------------------------------------------
-- 3. DETALLE DEL PEDIDO (renglones de la nota)
-- ---------------------------------------------------------------------
create table if not exists public.pedido_items (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null references public.pedidos (id) on delete cascade,
  producto_id      bigint not null references public.productos (id),
  descripcion      text   not null,                 -- nombre + modelo al momento de comprar
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(10,2) not null,
  importe          numeric(10,2) generated always as (cantidad * precio_unitario) stored
);

-- ---------------------------------------------------------------------
-- 4. PESTAÑA "PAGOS RECIBIDOS"
-- ---------------------------------------------------------------------
create table if not exists public.pagos (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null references public.pedidos (id) on delete cascade,
  metodo           text   not null check (metodo in ('transferencia', 'tarjeta', 'efectivo')),
  monto            numeric(10,2) not null check (monto >= 0),
  estado           text   not null default 'pendiente'
                   check (estado in ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  referencia       text,      -- folio de transferencia o id de Mercado Pago (Capítulo 7)
  comprobante_url  text,      -- foto del comprobante de transferencia
  fecha_pago       timestamptz,
  creado_en        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. PESTAÑA "ENVÍOS" (paquetería nacional / Centroamérica)
-- ---------------------------------------------------------------------
create table if not exists public.envios (
  id                   bigint generated always as identity primary key,
  pedido_id            bigint not null unique references public.pedidos (id) on delete cascade,
  nombre_destinatario  text not null,
  telefono             text not null,
  direccion            text not null,
  ciudad               text not null,
  estado_region        text not null,
  codigo_postal        text not null,
  pais                 text not null default 'México',
  tipo                 text not null default 'nacional'
                       check (tipo in ('nacional', 'internacional')),
  paqueteria           text,      -- Capítulo 8
  numero_rastreo       text,      -- Capítulo 8
  url_rastreo          text,      -- Capítulo 8
  estado_envio         text not null default 'por_enviar'
                       check (estado_envio in ('por_enviar', 'en_transito', 'entregado', 'incidencia')),
  fecha_envio          timestamptz,
  creado_en            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. PESTAÑA "ENTREGAS EN PERSONA" (recogida en el local)
-- ---------------------------------------------------------------------
create table if not exists public.entregas_presenciales (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null unique references public.pedidos (id) on delete cascade,
  fecha_recogida   date   not null,
  punto_entrega    text   not null default
    'Girón 33, Centro Histórico de la Cdad. de México, Centro, Cuauhtémoc, 06020 Ciudad de México, CDMX',
  recogido         boolean not null default false,
  recogido_en      timestamptz,
  creado_en        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. COTIZACIONES
-- ---------------------------------------------------------------------
create sequence if not exists public.cotizaciones_folio_seq;

create table if not exists public.cotizaciones (
  id               bigint generated always as identity primary key,
  folio            text not null unique
                   default ('COT-' || lpad(nextval('public.cotizaciones_folio_seq')::text, 3, '0')),
  usuario_id       uuid references auth.users (id) on delete set null,
  producto_id      bigint not null references public.productos (id),
  cantidad         integer not null check (cantidad > 0),
  modalidad        text not null check (modalidad in ('menudeo', 'mayoreo')),
  destino          text,
  tipo_envio       text check (tipo_envio in ('nacional', 'internacional')),
  subtotal         numeric(10,2) not null,
  costo_envio      numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  vigente_hasta    date not null default (current_date + 7),
  creado_en        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. CANCELACIONES Y DEVOLUCIONES
-- ---------------------------------------------------------------------
create table if not exists public.solicitudes (
  id           bigint generated always as identity primary key,
  pedido_id    bigint not null references public.pedidos (id) on delete cascade,
  tipo         text not null check (tipo in ('cancelacion', 'devolucion')),
  motivo       text,     -- 'defectuoso' | 'incorrecto' | 'otro'
  comentario   text,
  estado       text not null default 'pendiente'
               check (estado in ('pendiente', 'aceptada', 'rechazada')),
  creado_en    timestamptz not null default now()
);

-- Índices para las búsquedas más comunes
create index if not exists idx_pedidos_estado        on public.pedidos (estado);
create index if not exists idx_pedidos_usuario       on public.pedidos (usuario_id);
create index if not exists idx_pedido_items_pedido   on public.pedido_items (pedido_id);
create index if not exists idx_pagos_pedido          on public.pagos (pedido_id);
create index if not exists idx_solicitudes_pedido    on public.solicitudes (pedido_id);

-- ---------------------------------------------------------------------
-- 9. "actualizado_en" automático
-- ---------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists trg_productos_actualizado on public.productos;
create trigger trg_productos_actualizado before update on public.productos
  for each row execute function public.tocar_actualizado_en();

drop trigger if exists trg_pedidos_actualizado on public.pedidos;
create trigger trg_pedidos_actualizado before update on public.pedidos
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------
-- 10. LAS TRES "PESTAÑAS" PEDIDAS, COMO VISTAS LISTAS PARA CONSULTAR
-- ---------------------------------------------------------------------
create or replace view public.vista_envios
with (security_invoker = true) as
select p.folio, p.fecha_entrega, p.estado as estado_pedido,
       e.nombre_destinatario, e.telefono, e.direccion, e.ciudad,
       e.estado_region, e.codigo_postal, e.pais, e.tipo,
       e.paqueteria, e.numero_rastreo, e.estado_envio, p.total
from public.envios e
join public.pedidos p on p.id = e.pedido_id;

create or replace view public.vista_pagos_recibidos
with (security_invoker = true) as
select p.folio, p.nombre_cliente, pg.metodo, pg.monto, pg.estado,
       pg.referencia, pg.fecha_pago, pg.creado_en
from public.pagos pg
join public.pedidos p on p.id = pg.pedido_id;

create or replace view public.vista_entregas_presenciales
with (security_invoker = true) as
select p.folio, p.nombre_cliente, p.telefono, ep.fecha_recogida,
       ep.punto_entrega, ep.recogido, p.metodo_pago, p.total, p.estado
from public.entregas_presenciales ep
join public.pedidos p on p.id = ep.pedido_id;

-- ---------------------------------------------------------------------
-- 11. CREAR UN PEDIDO COMPLETO EN UNA SOLA LLAMADA
--     La app llama: supabase.rpc('crear_pedido', { datos: {...} })
--     El precio SIEMPRE se toma de la tabla productos (no del navegador).
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
  v_piezas       integer;
  v_modalidad    text;
  v_precio       numeric(10,2);
  v_subtotal     numeric(10,2) := 0;
  v_pedido_id    bigint;
  v_folio        text;
  v_metodo       text := datos ->> 'metodo_pago';
  v_entrega      text := datos ->> 'tipo_entrega';
  v_fecha        date := (datos ->> 'fecha_entrega')::date;
begin
  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  -- Mayoreo a partir de 3 piezas en total
  select coalesce(sum((i ->> 'cantidad')::int), 0) into v_piezas
  from jsonb_array_elements(v_items) i;
  v_modalidad := case when v_piezas >= 3 then 'mayoreo' else 'menudeo' end;

  insert into public.pedidos (usuario_id, nombre_cliente, telefono, correo,
                              modalidad, metodo_pago, tipo_entrega, fecha_entrega)
  values (auth.uid(),
          datos -> 'cliente' ->> 'nombre',
          datos -> 'cliente' ->> 'telefono',
          datos -> 'cliente' ->> 'correo',
          v_modalidad, v_metodo, v_entrega, v_fecha)
  returning id, folio into v_pedido_id, v_folio;

  for v_item in select * from jsonb_array_elements(v_items) loop
    select * into v_prod from public.productos
    where id = (v_item ->> 'producto_id')::bigint and activo;
    if not found then
      raise exception 'Producto % no existe o no está activo', v_item ->> 'producto_id';
    end if;

    v_precio := case when v_modalidad = 'mayoreo'
                     then v_prod.precio_mayoreo else v_prod.precio_menudeo end;

    insert into public.pedido_items (pedido_id, producto_id, descripcion, cantidad, precio_unitario)
    values (v_pedido_id, v_prod.id, concat_ws(' — ', v_prod.nombre, v_prod.modelo),
            (v_item ->> 'cantidad')::int, v_precio);

    v_subtotal := v_subtotal + v_precio * (v_item ->> 'cantidad')::int;
  end loop;

  update public.pedidos
     set subtotal = v_subtotal,
         total    = v_subtotal + costo_envio + recargo_temporada
   where id = v_pedido_id;

  -- Pestaña "pagos": queda pendiente hasta que Lucy valide la transferencia/efectivo
  insert into public.pagos (pedido_id, metodo, monto)
  values (v_pedido_id, v_metodo, v_subtotal);

  -- Pestaña "envíos" o pestaña "entregas en persona"
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

  return jsonb_build_object('folio', v_folio, 'modalidad', v_modalidad,
                            'subtotal', v_subtotal, 'total', v_subtotal);
end $$;

-- Consultar un pedido por folio + teléfono (sin cuenta, para "Mis pedidos")
create or replace function public.consultar_pedido(p_folio text, p_telefono text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'pedido', to_jsonb(p) - 'usuario_id',
    'items',  coalesce((select jsonb_agg(to_jsonb(i)) from pedido_items i where i.pedido_id = p.id), '[]'),
    'envio',  (select to_jsonb(e) from envios e where e.pedido_id = p.id),
    'entrega_presencial', (select to_jsonb(ep) from entregas_presenciales ep where ep.pedido_id = p.id)
  )
  from pedidos p
  where p.folio = p_folio and p.telefono = p_telefono;
$$;

-- ---------------------------------------------------------------------
-- 12. SEGURIDAD (Row Level Security)
--   · Cualquiera puede ver el catálogo activo.
--   · El cliente NO escribe directo en las tablas: usa crear_pedido().
--   · Con cuenta (Capítulo 6) cada cliente ve solo sus pedidos.
--   · Lucy administra desde el panel de Supabase (que salta el RLS).
-- ---------------------------------------------------------------------
alter table public.productos             enable row level security;
alter table public.pedidos               enable row level security;
alter table public.pedido_items          enable row level security;
alter table public.pagos                 enable row level security;
alter table public.envios                enable row level security;
alter table public.entregas_presenciales enable row level security;
alter table public.cotizaciones          enable row level security;
alter table public.solicitudes           enable row level security;

drop policy if exists "catalogo publico" on public.productos;
create policy "catalogo publico" on public.productos
  for select to anon, authenticated using (activo);

drop policy if exists "mis pedidos" on public.pedidos;
create policy "mis pedidos" on public.pedidos
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "mis items" on public.pedido_items;
create policy "mis items" on public.pedido_items
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid()));

drop policy if exists "mis pagos" on public.pagos;
create policy "mis pagos" on public.pagos
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid()));

drop policy if exists "mis envios" on public.envios;
create policy "mis envios" on public.envios
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid()));

drop policy if exists "mis entregas" on public.entregas_presenciales;
create policy "mis entregas" on public.entregas_presenciales
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid()));

drop policy if exists "crear cotizacion" on public.cotizaciones;
create policy "crear cotizacion" on public.cotizaciones
  for insert to anon, authenticated
  with check (usuario_id is null or usuario_id = auth.uid());

drop policy if exists "mis cotizaciones" on public.cotizaciones;
create policy "mis cotizaciones" on public.cotizaciones
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "crear solicitud" on public.solicitudes;
create policy "crear solicitud" on public.solicitudes
  for insert to anon, authenticated with check (true);

revoke all on function public.crear_pedido(jsonb) from public;
grant execute on function public.crear_pedido(jsonb) to anon, authenticated;
revoke all on function public.consultar_pedido(text, text) from public;
grant execute on function public.consultar_pedido(text, text) to anon, authenticated;
