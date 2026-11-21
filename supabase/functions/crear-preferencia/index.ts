// =====================================================================
//  NOVEDADES LUCY · Capítulo 7 — Edge Function "crear-preferencia"
//  Recibe { folio } desde la tienda, arma la preferencia de pago de
//  Mercado Pago (Checkout Pro) con los productos del pedido y devuelve
//  el enlace (init_point) al que se redirige al cliente.
//
//  Secretos necesarios (Supabase → Edge Functions → Secrets):
//    MP_ACCESS_TOKEN  Access Token de Mercado Pago (de prueba o producción)
//    SITE_URL         https://novedades-lucy.vercel.app   (opcional)
//  SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// =====================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// Llave de servidor: sistema anterior (service_role) o nuevo (sb_secret_...)
function obtenerLlaveServidor() {
  const anterior = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (anterior) return anterior;
  try {
    const nuevas = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    const primera = Object.values(nuevas)[0];
    if (typeof primera === "string") return primera;
  } catch {
    // sin llaves nuevas
  }
  return Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
}
const SERVICE_KEY = obtenerLlaveServidor();

// Las llaves nuevas (sb_secret_...) no son JWT: van solo en "apikey"
function encabezadosSupabase(): Record<string, string> {
  const encabezados: Record<string, string> = {
    apikey: SERVICE_KEY,
    "Content-Type": "application/json",
  };
  if (!SERVICE_KEY.startsWith("sb_")) {
    encabezados.Authorization = `Bearer ${SERVICE_KEY}`;
  }
  return encabezados;
}
const MP_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const SITE_URL = (
  Deno.env.get("SITE_URL") ?? "https://novedades-lucy.vercel.app"
).replace(/\/$/, "");

type ItemMP = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number | string;
  currency_id: string;
};

type DatosPedido = {
  folio: string;
  total: number;
  nombre: string | null;
  correo: string | null;
  items: ItemMP[];
};

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Llama una función SQL de Supabase con permisos de servidor
async function rpc<T>(funcion: string, argumentos: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: encabezadosSupabase(),
    body: JSON.stringify(argumentos),
  });
  if (!r.ok) {
    throw new Error(`${funcion}: ${r.status} ${await r.text()}`);
  }
  const texto = await r.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MP_TOKEN) {
      return responder({ error: "Falta el secreto MP_ACCESS_TOKEN" }, 500);
    }

    const { folio } = await req.json();
    if (!folio) {
      return responder({ error: "Falta el folio del pedido" }, 400);
    }

    const pedido = await rpc<DatosPedido | null>("mp_datos_preferencia", {
      p_folio: folio,
    });

    if (!pedido) {
      return responder(
        { error: "El pedido no existe, no es con tarjeta o ya fue pagado" },
        404
      );
    }

    const preferencia = {
      items: pedido.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
      external_reference: pedido.folio,
      back_urls: {
        success: `${SITE_URL}/confirmacion`,
        pending: `${SITE_URL}/confirmacion`,
        failure: `${SITE_URL}/confirmacion`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
      statement_descriptor: "NOVEDADES LUCY",
    };

    const respuesta = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(preferencia),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Mercado Pago rechazó la preferencia:", datos);
      return responder(
        { error: "Mercado Pago rechazó la preferencia", detalle: datos },
        502
      );
    }

    await rpc("mp_guardar_preferencia", {
      p_folio: pedido.folio,
      p_preference_id: datos.id,
    });

    // Con un Access Token "TEST-..." se usa el enlace de sandbox
    const enlace = MP_TOKEN.startsWith("TEST-")
      ? datos.sandbox_init_point ?? datos.init_point
      : datos.init_point;

    return responder({ id: datos.id, init_point: enlace });
  } catch (error) {
    console.error(error);
    return responder({ error: String(error) }, 500);
  }
});
