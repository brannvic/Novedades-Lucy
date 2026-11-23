-- =====================================================================
--  NOVEDADES LUCY · Capítulo 3 — Catálogo real con fotos y giro 360°
--  · Nombres, precios y descripciones dados por Lucy (22-nov-2026).
--  · precio_mayoreo = precio de lista; el menudeo suma $10 solo;
--    en temporada (oct–ene) se suman $20 más automáticamente.
--  · Las fotos viven en public/productos/ y public/360/<producto>/.
--  · Se puede correr varias veces sin duplicar nada.
--  · No borra productos: los que se quitan quedan con activo = false
--    para no perder ventas ni pedidos ya registrados.
-- =====================================================================

alter table public.productos add column if not exists carpeta_360 text;
alter table public.productos add column if not exists fotos_360 integer not null default 0;

do $$
declare
  r   record;
  pid bigint;
  txt text;
begin
  for r in
    select * from (values
-- Muñecas
 (array['Muñeca "Boquita"'], 'Muñeca "Boquita"', 'Muñecas', 110, '👧🏻', 'boquita', 20, null),
 (array['Muñeca "Mariana"'], 'Muñeca "Mariana"', 'Muñecas', 280, '👧🏽', 'mariana', 20,
    'Cabello chino con moño y vestido rosa de satín con tul brillante.'),
 (array['Muñeca vestido casual','Muñeca "Chaparra casual"'], 'Muñeca "Chaparra casual"', 'Muñecas', 140, '👧🏻', 'chaparra-casual', 18, null),
 (array['Muñeca cabello largo'], 'Muñeca "Chaparra cabello largo"', 'Muñecas', 180, '👧🏼', 'chaparra-cabello-largo', 16, null),
 (array['Muñeca cabello alta'], 'Muñeca "Valeria"', 'Muñecas', 180, '👧🏻', 'valeria', 15, null),
 (array['Muñeca vestido de fiesta'], 'Muñeca "Chaparra fiesta"', 'Muñecas', 160, '👧🏼', 'chaparra-fiesta', 15, null),
 (array['Muñeca cabello chino'], 'Muñeca "China"', 'Muñecas', 160, '👧🏽', 'china', 14, null),
 (array['Muñeca con chupón'], 'Muñeca "Chupón"', 'Muñecas', 160, '👧🏻', 'chupon', 14, null),
 -- Bebés
 (array['Bebé "Mateo"'], 'Bebé "Mateo"', 'Bebés', 110, '👶🏻', 'mateo', 15, null),
 (array['Bola'], 'Bola', 'Bebés', 60, '👶🏻', 'bola', 11,
    'También hay gateador al mismo precio (estilo Mateo) y Bola con cabello (niña).'),
 (array['Bola con cabello'], 'Bola con cabello', 'Bebés', 70, '👶🏼', null, 0,
    'Versión niña de Bola.'),
 (array['Bebé reborn'], 'Bebé reborn', 'Bebés', 140, '👶🏼', 'bebe-reborn', 13, null),
 (array['Bebé reborn de cabello'], 'Bebé reborn de cabello', 'Bebés', 160, '👶🏼', 'reborn-cabello', 16, null),
 (array['Bebé reborn ojo abierto'], 'Bebé reborn ojo abierto', 'Bebés', 110, '👶🏻', 'reborn-ojo-abierto', 14, null),
 (array['Bebé reborn grande','Bebé "Toñito"'], 'Bebé "Toñito"', 'Bebés', 300, '👶🏼', 'tonito', 13, null),
 (array['Bebé "Chucho"'], 'Bebé "Chucho"', 'Bebés', 320, '👶🏻', 'chucho', 15, null),
 -- Con sonido
 (array['Bebé llorón'], 'Bebé llorón', 'Con sonido', 140, '👶🏻', 'lloron', 15, null),
 -- Personajes
 (array['Masha'], 'Masha', 'Personajes', 140, '👧🏼', 'masha', 14, null),
 (array['Oso (de Masha y el oso)'], 'Oso (de Masha y el oso)', 'Personajes', 140, '🐻', 'oso', 14, null),
 (array['Lady Bug'], 'Lady Bug', 'Personajes', 180, '🐞', 'ladybug', 16, null),
 (array['Princesas','Princesa'], 'Princesa', 'Personajes', 200, '👸🏻', 'princesa', 13,
    'Disponible en: Ariel, Bella, Elsa, Ana, Blancanieves, Aurora, Valiente, Moana, Pocahontas, Sofía, Mulán y Cenicienta.'),
 (array['Quinceañeras','Quinceañera'], 'Quinceañera', 'Personajes', 210, '👗', 'quinceanera', 14,
    'Hay vestidos de diferentes colores y se pueden personalizar con tiempo de anticipación.'),
 (array['Merlina','Boo'], 'Boo', 'Personajes', 180, '👧🏻', 'boo', 0, null),
 -- Accesorios
 (array['Cobija'], 'Cobija', 'Accesorios', 100, '🧸', 'cobija', 0,
    'Cobija para bebé con forro de borrega y moño de satín.')
    ) as v(viejos, nombre, categoria, precio, emoji, foto, vistas, extra)
  loop
    -- 1) ¿Ya existe con el nombre nuevo?  2) ¿Existe con un nombre viejo?
    select id into pid from public.productos where nombre = r.nombre limit 1;
    if pid is null then
      select id into pid from public.productos
       where nombre = any(r.viejos) order by id limit 1;
    end if;
    -- 3) Si no existe, es producto nuevo
    if pid is null then
      insert into public.productos (nombre, categoria, precio_mayoreo, existencias, emoji)
      values (r.nombre, r.categoria, r.precio, 10, r.emoji)
      returning id into pid;
    end if;

    -- Descripción que se muestra en la tienda
    txt := concat_ws(' ',
      r.extra,
      case r.categoria
        when 'Muñecas'    then 'Los estampados de los vestidos cambian a diario.'
        when 'Bebés'      then 'Los estampados de los mamelucos cambian a diario.'
        when 'Con sonido' then 'Los estampados de los mamelucos cambian a diario.'
      end,
      case when r.categoria <> 'Accesorios'
        then 'Hecho de vinil. Incluye calceta, calzón, zapato y arete.' end);

    update public.productos
       set nombre         = r.nombre,
           categoria      = r.categoria,
           precio_mayoreo = r.precio,
           emoji          = r.emoji,
           descripcion    = txt,
           imagen_url     = case when r.foto is null then null
                                 else '/productos/' || r.foto || '.webp' end,
           carpeta_360    = case when r.vistas > 0 then '/360/' || r.foto end,
           fotos_360      = r.vistas,
           activo         = true
     where id = pid;
  end loop;
end $$;

-- Bola con cabello: agotada por ahora
update public.productos set existencias = 0 where nombre = 'Bola con cabello';

-- Se quita de la tienda (sin borrar historial)
update public.productos set activo = false where nombre = 'Doctora juguete';

-- El catálogo entrega también los datos del giro 360°
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
            else 'disponible' end                                as estado_stock,
       p.carpeta_360,
       p.fotos_360
from public.productos p
cross join (select public.es_temporada() as temporada) t
where p.activo;

grant select on public.vista_catalogo to anon, authenticated;

notify pgrst, 'reload schema';
