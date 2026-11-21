-- =====================================================================
--  NOVEDADES LUCY · Capítulo 4 — Permisos para la API de Supabase
--  Da acceso a la app (roles anon y authenticated) a las tablas nuevas.
--  Lo que cada quien puede ver o escribir lo siguen limitando las
--  reglas RLS del Capítulo 1.
-- =====================================================================
grant usage on schema public to anon, authenticated;

grant select on public.productos to anon, authenticated;

grant select on public.pedidos, public.pedido_items, public.pagos,
                public.envios, public.entregas_presenciales
  to authenticated;

grant select, insert on public.cotizaciones to anon, authenticated;
grant insert on public.solicitudes to anon, authenticated;
grant usage on sequence public.cotizaciones_folio_seq to anon, authenticated;

grant execute on function public.crear_pedido(jsonb) to anon, authenticated;
grant execute on function public.consultar_pedido(text, text) to anon, authenticated;

-- Que la API vuelva a leer la estructura de la base
notify pgrst, 'reload schema';
