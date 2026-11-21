-- =====================================================================
--  NOVEDADES LUCY · Capítulo 8 — Paqueterías y rastreo
--  Mejora: "conectar las paqueterías donde se trabaja para que redirija
--  al cliente al rastreo de su paquete".
--  Paqueterías de Lucy: Estafeta, FedEx y DHL.
--
--  · Lucy registra la paquetería y el número de guía (registrar_guia o
--    directo en la tabla envios).
--  · La base de datos arma sola el enlace oficial de rastreo, marca el
--    envío "en tránsito" y el pedido como "enviado".
--  · El cliente ve el botón "Rastrear envío" en Mis pedidos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Paqueterías válidas
-- ---------------------------------------------------------------------
update public.envios set paqueteria = lower(trim(paqueteria)) where paqueteria is not null;

alter table public.envios drop constraint if exists envios_paqueteria_check;
alter table public.envios add constraint envios_paqueteria_check
  check (paqueteria is null or paqueteria in ('estafeta', 'fedex', 'dhl'));

-- ---------------------------------------------------------------------
-- 2. Enlace oficial de rastreo de cada paquetería
-- ---------------------------------------------------------------------
create or replace function public.url_rastreo(p_paqueteria text, p_numero text)
returns text
language plpgsql
immutable
as $$
declare
  v_num text := regexp_replace(coalesce(p_numero, ''), '[^A-Za-z0-9]', '', 'g');
begin
  if v_num = '' or p_paqueteria is null then
    return null;
  end if;

  case lower(p_paqueteria)
    when 'estafeta' then
      -- Guía de 22 dígitos → enlace directo; código de 10 dígitos → página de rastreo
      if length(v_num) = 22 then
        return 'https://cs.estafeta.com/es/Tracking/searchByGet?wayBillType=1&isShipmentDetail=True&wayBill=' || v_num;
      end if;
      return 'https://www.estafeta.com/rastrear-envio';
    when 'fedex' then
      return 'https://www.fedex.com/fedextrack/?trknbr=' || v_num;
    when 'dhl' then
      return 'https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=' || v_num || '&submit=1';
    else
      return null;
  end case;
end $$;

grant execute on function public.url_rastreo(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Al capturar la guía: enlace + envío en tránsito
-- ---------------------------------------------------------------------
create or replace function public.preparar_rastreo()
returns trigger
language plpgsql
as $$
begin
  new.paqueteria := lower(trim(new.paqueteria));
  new.numero_rastreo := nullif(trim(new.numero_rastreo), '');
  new.url_rastreo := public.url_rastreo(new.paqueteria, new.numero_rastreo);

  if new.numero_rastreo is not null and new.estado_envio = 'por_enviar' then
    new.estado_envio := 'en_transito';
    new.fecha_envio  := coalesce(new.fecha_envio, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_preparar_rastreo on public.envios;
create trigger trg_preparar_rastreo
  before insert or update of paqueteria, numero_rastreo on public.envios
  for each row execute function public.preparar_rastreo();

-- El pedido pasa a "enviado" cuando ya tiene guía
create or replace function public.marcar_pedido_enviado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_rastreo is not null then
    update public.pedidos
       set estado = 'enviado'
     where id = new.pedido_id
       and estado in ('pendiente', 'preparando', 'listo');
  end if;
  if new.estado_envio = 'entregado' then
    update public.pedidos
       set estado = 'entregado'
     where id = new.pedido_id
       and estado = 'enviado';
  end if;
  return null;
end $$;

drop trigger if exists trg_marcar_pedido_enviado on public.envios;
create trigger trg_marcar_pedido_enviado
  after insert or update of numero_rastreo, estado_envio on public.envios
  for each row execute function public.marcar_pedido_enviado();

-- ---------------------------------------------------------------------
-- 4. Para Lucy: registrar la guía con el folio del pedido
--    select registrar_guia('NL-0005', 'dhl', '1234567890');
-- ---------------------------------------------------------------------
create or replace function public.registrar_guia(
  p_folio      text,
  p_paqueteria text,
  p_numero     text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
begin
  update public.envios e
     set paqueteria     = lower(trim(p_paqueteria)),
         numero_rastreo = p_numero
    from public.pedidos p
   where p.id = e.pedido_id
     and p.folio = upper(trim(p_folio))
  returning e.url_rastreo into v_url;

  if not found then
    raise exception 'El pedido % no existe o no es por paquetería', p_folio;
  end if;
  return v_url;
end $$;

revoke all on function public.registrar_guia(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Vista de envíos con paquetería y enlace (para Lucy)
-- ---------------------------------------------------------------------
drop view if exists public.vista_envios;
create view public.vista_envios
with (security_invoker = true) as
select p.folio, p.fecha_entrega, p.estado as estado_pedido,
       e.nombre_destinatario, e.telefono, e.direccion, e.ciudad,
       e.estado_region, e.codigo_postal, e.pais, e.tipo,
       e.paqueteria, e.numero_rastreo, e.url_rastreo,
       e.estado_envio, e.fecha_envio, p.total
from public.envios e
join public.pedidos p on p.id = e.pedido_id;

notify pgrst, 'reload schema';
