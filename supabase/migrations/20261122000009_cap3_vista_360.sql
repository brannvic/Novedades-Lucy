-- =====================================================================
--  NOVEDADES LUCY · Capítulo 3 — Imágenes reales y vista 360°
--  Mejora: "agregar imágenes de realidad virtual de los productos".
--
--  · Las fotos viven en la carpeta public/ del proyecto (Vercel las sirve):
--      public/productos/<producto>.webp   → foto principal
--      public/360/<producto>/01..NN.webp  → vistas para el giro 360°
--  · productos.imagen_url  → foto principal (catálogo y detalle)
--  · productos.carpeta_360 / fotos_360 → giro 360° en el detalle
-- =====================================================================

alter table public.productos add column if not exists carpeta_360 text;
alter table public.productos add column if not exists fotos_360 integer not null default 0;

-- Nombres y precios actualizados por Lucy (precio de lista = mayoreo;
-- el menudeo suma $10 automáticamente)
update public.productos
   set nombre = 'Muñeca "Chaparra casual"'
 where nombre = 'Muñeca vestido casual';

update public.productos
   set nombre = 'Bebé "Toñito"'
 where nombre = 'Bebé reborn grande';

-- Muñeca "Boquita": $110 / $120 · foto principal + giro 360° con 20 vistas
update public.productos
   set precio_mayoreo = 110,
       imagen_url  = '/productos/boquita.webp',
       carpeta_360 = '/360/boquita',
       fotos_360   = 20
 where nombre = 'Muñeca "Boquita"';

-- Muñeca "Chaparra casual": $140 / $150 · foto principal
update public.productos
   set precio_mayoreo = 140,
       imagen_url = '/productos/chaparra-casual.webp'
 where nombre = 'Muñeca "Chaparra casual"';

-- Bebé "Toñito": $300 / $310 · foto principal
update public.productos
   set precio_mayoreo = 300,
       imagen_url = '/productos/tonito.webp'
 where nombre = 'Bebé "Toñito"';

-- El catálogo ahora también entrega los datos de la vista 360°
-- (columnas nuevas al final para poder usar CREATE OR REPLACE VIEW)
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
