"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// Las cotizaciones se guardan en Supabase (tabla cotizaciones).
// Este navegador recuerda los folios que pidió; con sesión iniciada
// también se muestran todas las cotizaciones de la cuenta.
const CLAVE_FOLIOS = "novedades-lucy-cotizaciones";

type Cotizacion = {
  folio: string;
  producto_id: number;
  nombre: string;
  modelo: string | null;
  emoji: string | null;
  imagen_url: string | null;
  cantidad: number;
  modalidad: "menudeo" | "mayoreo";
  precio_unitario: number;
  subtotal: number;
  total: number;
  estado: "pendiente" | "aceptada" | "rechazada";
  vigente_hasta: string;
  vencida: boolean;
  creado_en: string;
};

function leerFolios(): string[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_FOLIOS) ?? "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

function fecha(valor: string) {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function etiqueta(c: Cotizacion) {
  if (c.estado === "aceptada") return { texto: "Aceptada", clase: "bg-green-50 text-green-700" };
  if (c.estado === "rechazada") return { texto: "Rechazada", clase: "bg-gray-100 text-gray-600" };
  if (c.vencida) return { texto: "Vencida", clase: "bg-gray-100 text-gray-600" };
  return { texto: "Vigente", clase: "bg-yellow-50 text-yellow-700" };
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function cargar(abrir?: string | null) {
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("consultar_cotizaciones", {
      p_folios: leerFolios(),
    });
    if (error) {
      setError("No pudimos cargar tus cotizaciones. Intenta de nuevo en un momento.");
    } else {
      setCotizaciones((data ?? []) as Cotizacion[]);
      if (abrir) setSeleccionada(abrir);
    }
    setCargando(false);
  }

  useEffect(() => {
    // Si venimos del botón "Cotizar", abrimos la cotización recién creada
    const folio = new URLSearchParams(window.location.search).get("folio");
    cargar(folio);
  }, []);

  async function responder(aceptar: boolean) {
    const c = cotizaciones.find((x) => x.folio === seleccionada);
    if (!c) return;
    setProcesando(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("responder_cotizacion", {
      p_folio: c.folio,
      p_aceptar: aceptar,
    });
    setProcesando(false);
    if (error) {
      setError(
        error.message.includes("venció")
          ? "Esta cotización ya venció. Puedes pedir una nueva desde el producto."
          : "No se pudo guardar tu respuesta. Intenta de nuevo."
      );
      return;
    }
    if (aceptar) {
      // Pasa el producto al carrito con el precio cotizado
      localStorage.setItem(
        "novedades-lucy-carrito",
        JSON.stringify({
          id: c.producto_id,
          nombre: c.nombre,
          modelo: c.modelo,
          cantidad: c.cantidad,
          precioUnitario: Number(c.precio_unitario),
          subtotal: Number(c.subtotal),
          emoji: c.emoji,
        })
      );
      window.location.href = "/carrito";
      return;
    }
    cargar(c.folio);
  }

  const actual = cotizaciones.find((c) => c.folio === seleccionada) ?? null;

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-3xl">💗</div>
            <div className="leading-none">
              <p className="text-sm font-bold text-[#70409a]">Novedades</p>
              <h1 className="text-2xl font-black text-[#ef4b91]">Lucy</h1>
            </div>
          </Link>
          <Link
            href="/menu"
            className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50"
          >
            ☰ Menú
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">{error}</p>
        )}

        {!actual ? (
          <>
            <div className="mb-8">
              <p className="text-4xl">🧾</p>
              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">Mis cotizaciones</h2>
              <p className="mt-2 text-gray-500">
                Consulta las cotizaciones que has solicitado. Cada una respeta su precio durante 7 días.
              </p>
            </div>

            {cargando ? (
              <p className="font-bold text-[#70409a]">Cargando cotizaciones...</p>
            ) : cotizaciones.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
                <p className="text-5xl">📄</p>
                <p className="mt-4 text-lg font-bold text-[#70409a]">Todavía no tienes cotizaciones</p>
                <p className="mt-2 text-gray-500">
                  Entra a un producto, elige la cantidad y toca “📄 Cotizar”.
                </p>
                <Link
                  href="/catalogo"
                  className="mt-6 inline-block rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white hover:bg-[#df3d82]"
                >
                  Ir al catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {cotizaciones.map((c) => {
                  const e = etiqueta(c);
                  return (
                    <div key={c.folio} className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          {c.imagen_url ? (
                            <img src={c.imagen_url} alt={c.nombre} className="h-20 w-16 rounded-xl object-contain" />
                          ) : (
                            <span className="text-4xl">{c.emoji ?? "🧸"}</span>
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#70409a]">Cotización</p>
                            <h3 className="text-2xl font-black text-[#6d3b91]">#{c.folio}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {c.nombre} · {c.cantidad} pieza{c.cantidad !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-2xl font-black text-[#ef4b91]">${Number(c.total)}</p>
                          <span className={`mt-2 inline-block rounded-full px-4 py-1 text-sm font-bold ${e.clase}`}>
                            {e.texto}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSeleccionada(c.folio)}
                        className="mt-6 w-full rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white transition hover:bg-[#df3d82]"
                      >
                        Ver cotización
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => setSeleccionada(null)}
                className="font-bold text-[#70409a] hover:underline"
              >
                ← Regresar a mis cotizaciones
              </button>
              <p className="mt-6 text-4xl">🧾</p>
              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">Cotización #{actual.folio}</h2>
              <p className="mt-2 text-gray-500">Solicitada el {fecha(actual.creado_en)}.</p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-xl font-black text-[#70409a]">Producto</h3>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#fff7fb] p-4">
                <div className="flex items-center gap-4">
                  {actual.imagen_url ? (
                    <img src={actual.imagen_url} alt={actual.nombre} className="h-20 w-16 rounded-xl object-contain" />
                  ) : (
                    <span className="text-3xl">{actual.emoji ?? "🧸"}</span>
                  )}
                  <div>
                    <p className="font-bold">{actual.nombre}</p>
                    <p className="text-sm text-gray-500">
                      Cantidad: {actual.cantidad} · ${Number(actual.precio_unitario)} por pieza (
                      {actual.modalidad === "mayoreo" ? "mayoreo" : "menudeo"})
                    </p>
                  </div>
                </div>
                <p className="font-black text-[#70409a]">${Number(actual.subtotal)}</p>
              </div>

              <div className="my-7 border-t border-pink-100" />

              <div className="flex items-center justify-between">
                <p className="text-xl font-black text-[#6d3b91]">Total</p>
                <p className="text-3xl font-black text-[#ef4b91]">${Number(actual.total)}</p>
              </div>
              <p className="mt-2 text-sm text-gray-500">El costo de envío se calcula al hacer el pedido.</p>

              <div className="mt-6 rounded-2xl bg-purple-50 p-5">
                <p className="font-bold text-[#70409a]">📅 Vigencia de la cotización</p>
                <p className="mt-1 text-sm text-gray-600">
                  {actual.vencida
                    ? `Esta cotización venció el ${fecha(actual.vigente_hasta)}.`
                    : `Esta cotización es válida hasta el ${fecha(actual.vigente_hasta)}.`}
                </p>
              </div>

              {actual.estado !== "pendiente" && (
                <div
                  className={`mt-6 rounded-2xl p-5 ${
                    actual.estado === "aceptada" ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <p className={`font-bold ${actual.estado === "aceptada" ? "text-green-700" : "text-gray-700"}`}>
                    {actual.estado === "aceptada" ? "✅ Cotización aceptada" : "❌ Cotización rechazada"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {actual.estado === "aceptada"
                      ? "Puedes continuar con tu pedido desde el carrito."
                      : "Si cambias de opinión, pide una nueva cotización desde el producto."}
                  </p>
                </div>
              )}

              {actual.estado === "pendiente" && !actual.vencida && (
                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => responder(true)}
                    disabled={procesando}
                    className="rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white transition hover:bg-[#df3d82] disabled:opacity-50"
                  >
                    ✅ Aceptar y agregar al carrito
                  </button>
                  <button
                    onClick={() => responder(false)}
                    disabled={procesando}
                    className="rounded-full border border-pink-200 px-6 py-4 font-bold text-[#70409a] transition hover:bg-pink-50 disabled:opacity-50"
                  >
                    ❌ Rechazar cotización
                  </button>
                </div>
              )}

              {(actual.estado === "aceptada" || actual.vencida) && (
                <Link
                  href={actual.estado === "aceptada" ? "/carrito" : `/producto/${actual.producto_id}`}
                  className="mt-6 block w-full rounded-full bg-[#70409a] px-6 py-4 text-center font-bold text-white transition hover:bg-[#5f3383]"
                >
                  {actual.estado === "aceptada" ? "🛒 Ir al carrito" : "📄 Pedir una nueva cotización"}
                </Link>
              )}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-pink-100 bg-white py-6 text-center">
        <p className="text-sm text-gray-500">© 2026 Novedades Lucy · Tienda de muñecos artesanales</p>
      </footer>
    </main>
  );
}
