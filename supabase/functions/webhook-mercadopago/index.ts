// =====================================================================
//  NOVEDADES LUCY · Capítulo 7 — Edge Function "webhook-mercadopago"
//  Mercado Pago avisa aquí cada vez que se crea o actualiza un pago.
//  La función consulta el pago directamente en la API de Mercado Pago
//  (así no se confía en lo que diga la notificación) y actualiza la
//  tabla pagos con mp_registrar_pago().
//
//  Secretos (Supabase → Edge Functions → Secrets):
//    MP_ACCESS_TOKEN     (obligatorio)
//    MP_WEBHOOK_SECRET   (opcional) clave secreta de Webhooks de
//                        "Tus integraciones" para validar x-signature
//  IMPORTANTE: desactivar "Verify JWT" en esta función, porque
//  Mercado Pago no envía el token de Supabase.
// =====================================================================

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
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") ?? "";

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

// Validación de la firma x-signature (solo si se configuró MP_WEBHOOK_SECRET)
async function firmaValida(req: Request, dataId: string) {
  if (!MP_WEBHOOK_SECRET) return true;

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  let ts = "";
  let v1 = "";
  for (const parte of xSignature.split(",")) {
    const [clave, valor] = parte.split("=").map((t) => t.trim());
    if (clave === "ts") ts = valor;
    if (clave === "v1") v1 = valor;
  }
  if (!ts || !v1) return false;

  let manifiesto = `id:${dataId.toLowerCase()};`;
  if (xRequestId) manifiesto += `request-id:${xRequestId};`;
  manifiesto += `ts:${ts};`;

  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    llave,
    new TextEncoder().encode(manifiesto)
  );
  const hex = Array.from(new Uint8Array(firma))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === v1;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
    let pagoId =
      url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

    if (req.method === "POST") {
      try {
        const cuerpo = await req.json();
        tipo = cuerpo.type ?? cuerpo.topic ?? tipo;
        pagoId = String(cuerpo.data?.id ?? pagoId);
      } catch {
        // notificación sin cuerpo JSON
      }
    }

    // Solo interesan las notificaciones de pagos
    if (tipo !== "payment" || !pagoId) {
      return responder({ ignorado: true });
    }

    const idParaFirma = url.searchParams.get("data.id") ?? pagoId;
    if (!(await firmaValida(req, idParaFirma))) {
      return responder({ error: "Firma inválida" }, 401);
    }

    // Consultar el pago real en Mercado Pago
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });

    if (!r.ok) {
      console.error("No se pudo consultar el pago", pagoId, await r.text());
      return responder({ error: "Pago no encontrado" });
    }

    const pago = await r.json();

    if (!pago.external_reference) {
      return responder({ ignorado: true, motivo: "sin folio" });
    }

    const estado = await rpc<string>("mp_registrar_pago", {
      p_folio: pago.external_reference,
      p_payment_id: String(pago.id),
      p_status: pago.status,
      p_status_detail: pago.status_detail ?? null,
      p_monto: pago.transaction_amount ?? null,
    });

    console.log(`Pago ${pago.id} del pedido ${pago.external_reference}: ${estado}`);
    return responder({ ok: true, folio: pago.external_reference, estado });
  } catch (error) {
    console.error(error);
    // 500 para que Mercado Pago reintente la notificación
    return responder({ error: String(error) }, 500);
  }
});
