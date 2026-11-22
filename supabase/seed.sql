-- =====================================================================
--  NOVEDADES LUCY · Catálogo real (proporcionado por Lucy)
--  · El precio de la lista es el precio de MAYOREO (a partir de 3 piezas).
--    El precio de menudeo se calcula solo: +$10.
--  · Existencias = 10 provisional para todos; se ajustan en el Capítulo 2.
--  · Si se vuelve a ejecutar, actualiza precio y categoría sin duplicar.
-- =====================================================================

-- Quitar los 4 productos de prueba del prototipo (solo si no tienen pedidos)
delete from public.productos p
where p.modelo in ('Modelo Lucy', 'Modelo Alex', 'Modelo Sofía', 'Modelo Emma')
  and not exists (select 1 from public.pedido_items i where i.producto_id = p.id)
  and not exists (select 1 from public.cotizaciones c where c.producto_id = p.id);

insert into public.productos (nombre, categoria, precio_mayoreo, existencias, emoji)
values
  -- Bebés
  ('Bebé "Mateo"',            'Bebés',       100.00, 10, '👶🏻'),
  ('Bola',                    'Bebés',        60.00, 10, '👶🏻'),
  ('Bola con cabello',        'Bebés',        70.00, 10, '👶🏼'),
  ('Bebé reborn',             'Bebés',       200.00, 10, '👶🏼'),
  ('Bebé "Toñito"',           'Bebés',       300.00, 10, '👶🏼'),
  ('Bebé "Chucho"',           'Bebés',       300.00, 10, '👶🏻'),
  -- Con sonido
  ('Bebé llorón',             'Con sonido',  150.00, 10, '👶🏻'),
  -- Muñecas
  ('Muñeca "Boquita"',        'Muñecas',     110.00, 10, '👧🏻'),
  ('Muñeca cabello chino',    'Muñecas',     160.00, 10, '👧🏽'),
  ('Muñeca "Chaparra casual"','Muñecas',     140.00, 10, '👧🏻'),
  ('Muñeca vestido de fiesta','Muñecas',     150.00, 10, '👧🏼'),
  ('Muñeca con chupón',       'Muñecas',     150.00, 10, '👧🏻'),
  ('Muñeca cabello largo',    'Muñecas',     180.00, 10, '👧🏼'),
  ('Muñeca cabello alta',     'Muñecas',     180.00, 10, '👧🏻'),
  -- Personajes
  ('Doctora juguete',         'Personajes',  140.00, 10, '👩🏻‍⚕️'),
  ('Masha',                   'Personajes',  140.00, 10, '👧🏼'),
  ('Oso (de Masha y el oso)', 'Personajes',  140.00, 10, '🐻'),
  ('Princesas',               'Personajes',  200.00, 10, '👸🏻'),
  ('Quinceañeras',            'Personajes',  180.00, 10, '👗'),
  ('Lady Bug',                'Personajes',  180.00, 10, '🐞'),
  ('Merlina',                 'Personajes',  220.00, 10, '🖤'),
  -- Accesorios
  ('Cobija',                  'Accesorios',  100.00, 10, '🧸')
on conflict (nombre, modelo) do update
  set categoria      = excluded.categoria,
      precio_mayoreo = excluded.precio_mayoreo,
      emoji          = excluded.emoji;
