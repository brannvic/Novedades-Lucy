"use client";

// Capítulo 6: "Mis pedidos" con datos reales de Supabase.
// · Con sesión: muestra los pedidos ligados a la cuenta (RLS).
// · Sin sesión: consulta un pedido con folio + teléfono.

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { nombrePaqueteria } from "@/lib/paqueterias";

type Item = {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

type Pedido = {
  id: number;
  folio: string;
  estado: string;
  modalidad: string;
  metodo_pago: string;
  tipo_entrega: "paqueteria" | "presencial";
  fecha_entrega: string;
  total: number;
  es_temporada: boolean;
  creado_en: string;
  items: Item[];
  envio: {
    direccion: string;
    ciudad: string;
    paqueteria: string | null;
    numero_rastreo: string | null;
    url_rastreo: string | null;
  } | null;
  entrega: {
    punto_entrega: string;
    fecha_recogida: string;
  } | null;
};

const ESTADOS: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "🟡 Pendiente", color: "bg-yellow-50 text-yellow-700" },
  preparando: { texto: "🔵 Preparando pedido", color: "bg-blue-50 text-blue-700" },
  listo: { texto: "🟣 Listo para entrega", color: "bg-purple-50 text-purple-700" },
  enviado: { texto: "📦 Enviado", color: "bg-indigo-50 text-indigo-700" },
  entregado: { texto: "🟢 Entregado", color: "bg-green-50 text-green-700" },
  cancelado: { texto: "🔴 Cancelado", color: "bg-red-50 text-red-700" },
  devolucion_solicitada: { texto: "🟠 Devolución solicitada", color: "bg-orange-50 text-orange-700" },
  devuelto: { texto: "⚪ Devuelto", color: "bg-gray-100 text-gray-600" },
};

const PASOS_ENVIO = [
  { id: "pendiente", titulo: "Pedido recibido" },
  { id: "preparando", titulo: "Preparando pedido" },
  { id: "listo", titulo: "Listo para envío" },
  { id: "enviado", titulo: "Enviado por paquetería" },
  { id: "entregado", titulo: "Entregado" },
];

const PASOS_RECOGIDA = [
  { id: "pendiente", titulo: "Pedido recibido" },
  { id: "preparando", titulo: "Preparando pedido" },
  { id: "listo", titulo: "Listo para recoger" },
  { id: "entregado", titulo: "Entregado" },
];

const METODOS: Record<string, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
};

function unoONulo<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

function formatearFecha(fecha: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function PedidosPage() {
  const [supabase] = useState(() => createClient());

  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);

  const [folio, setFolio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  // Sesión + pedidos de la cuenta
  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.auth.getUser();
      setUsuario(data.user);

      if (data.user) {
        const { data: filas } = await supabase
          .from("pedidos")
          .select(
            "id, folio, estado, modalidad, metodo_pago, tipo_entrega, fecha_entrega, total, es_temporada, creado_en, pedido_items(descripcion, cantidad, precio_unitario), envios(direccion, ciudad, paqueteria, numero_rastreo, url_rastreo), entregas_presenciales(punto_entrega, fecha_recogida)"
          )
          .order("creado_en", { ascending: false });

        setPedidos(
          (filas ?? []).map((f) => ({
            ...(f as unknown as Pedido),
            total: Number(f.total),
            items: (f.pedido_items ?? []) as Item[],
            envio: unoONulo(f.envios as Pedido["envio"] | Pedido["envio"][]),
            entrega: unoONulo(
              f.entregas_presenciales as Pedido["entrega"] | Pedido["entrega"][]
            ),
          }))
        );
      } else {
        // Precargar el último pedido hecho en este navegador
        try {
          const guardado = JSON.parse(
            localStorage.getItem("novedades-lucy-pedido") || "{}"
          );
          if (guardado.folio) setFolio(guardado.folio);
          if (guardado.datosEnvio?.telefono) {
            setTelefono(guardado.datosEnvio.telefono);
          }
        } catch {
          // sin pedido previo
        }
      }

      setCargando(false);
    };

    cargar();
  }, [supabase]);

  const buscarPorFolio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");

    if (!folio.trim() || !telefono.trim()) {
      setError("Escribe tu folio y tu teléfono.");
      return;
    }

    setBuscando(true);
    const { data, error } = await supabase.rpc("consultar_pedido", {
      p_folio: folio.trim().toUpperCase(),
      p_telefono: telefono.trim(),
    });
    setBuscando(false);

    if (error || !data) {
      setError("No encontramos un pedido con ese folio y teléfono.");
      return;
    }

    const r = data as {
      pedido: Omit<Pedido, "items" | "envio" | "entrega">;
      items: Item[];
      envio: Pedido["envio"];
      entrega_presencial: Pedido["entrega"];
    };

    setSeleccionado({
      ...r.pedido,
      total: Number(r.pedido.total),
      items: r.items,
      envio: r.envio,
      entrega: r.entrega_presencial,
    });
  };

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

          <div className="flex items-center gap-2">
            <Link
              href="/cuenta"
              className="rounded-full px-4 py-2 text-sm font-bold text-[#70409a] hover:bg-pink-50"
            >
              👤 {usuario ? "Mi cuenta" : "Iniciar sesión"}
            </Link>
            <Link
              href="/menu"
              className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50"
            >
              ☰ Menú
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {seleccionado ? (
          <DetallePedido
            pedido={seleccionado}
            onVolver={() => setSeleccionado(null)}
          />
        ) : (
          <>
            <div className="mb-8">
              <p className="text-4xl">📦</p>
              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">
                Mis pedidos
              </h2>
              <p className="mt-2 text-gray-500">
                Consulta tus pedidos y revisa el estado en el que se encuentran.
              </p>
            </div>

            {cargando ? (
              <p className="font-bold text-[#70409a]">Cargando pedidos...</p>
            ) : usuario ? (
              pedidos.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                  <p className="text-5xl">🛍️</p>
                  <p className="mt-4 font-bold text-[#70409a]">
                    Aún no tienes pedidos con esta cuenta.
                  </p>
                  <Link
                    href="/catalogo"
                    className="mt-6 inline-block rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white"
                  >
                    Ir al catálogo
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSeleccionado(p)}
                      className="block w-full rounded-3xl border border-pink-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xl font-black text-[#70409a]">
                          #{p.folio}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            ESTADOS[p.estado]?.color ?? "bg-gray-100"
                          }`}
                        >
                          {ESTADOS[p.estado]?.texto ?? p.estado}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {p.items
                          .map((i) => `${i.descripcion} x${i.cantidad}`)
                          .join(" · ")}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                        <span>
                          {p.tipo_entrega === "paqueteria"
                            ? "📦 Envío"
                            : "🏪 Recogida"}{" "}
                          · {formatearFecha(p.fecha_entrega)}
                        </span>
                        <span className="font-black text-[#ef4b91]">
                          ${p.total}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* CONSULTA POR FOLIO */}
                <form
                  onSubmit={buscarPorFolio}
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xl font-black text-[#70409a]">
                    Consultar con mi folio
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    El folio aparece en tu confirmación (ej. NL-0001).
                  </p>

                  <input
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    placeholder="Folio"
                    className="mt-4 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91]"
                  />
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Teléfono con el que compraste"
                    type="tel"
                    className="mt-3 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91]"
                  />

                  {error && (
                    <p className="mt-3 text-sm font-bold text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={buscando}
                    className="mt-4 w-full rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white disabled:opacity-60"
                  >
                    {buscando ? "Buscando..." : "Consultar pedido"}
                  </button>
                </form>

                {/* INVITACIÓN A CUENTA */}
                <div className="rounded-3xl bg-gradient-to-br from-[#ffe5f0] to-[#eadcf5] p-6">
                  <h3 className="text-xl font-black text-[#70409a]">
                    ¿Compras seguido?
                  </h3>
                  <p className="mt-2 text-sm text-[#4a2857]">
                    Crea tu cuenta y todos tus pedidos aparecerán aquí
                    automáticamente, sin buscar folios.
                  </p>
                  <Link
                    href="/cuenta"
                    className="mt-6 inline-block rounded-full bg-[#70409a] px-6 py-3 font-bold text-white"
                  >
                    👤 Iniciar sesión / Crear cuenta
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function DetallePedido({
  pedido,
  onVolver,
}: {
  pedido: Pedido;
  onVolver: () => void;
}) {
  const pasos =
    pedido.tipo_entrega === "paqueteria" ? PASOS_ENVIO : PASOS_RECOGIDA;
  const posicion = Math.max(
    0,
    pasos.findIndex((p) => p.id === pedido.estado)
  );
  const fueraDeFlujo = [
    "cancelado",
    "devolucion_solicitada",
    "devuelto",
  ].includes(pedido.estado);

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
      <button
        type="button"
        onClick={onVolver}
        className="text-sm font-bold text-[#70409a] hover:underline"
      >
        ← Volver a mis pedidos
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-black text-[#70409a]">
          Pedido #{pedido.folio}
        </h2>
        <span
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            ESTADOS[pedido.estado]?.color ?? "bg-gray-100"
          }`}
        >
          {ESTADOS[pedido.estado]?.texto ?? pedido.estado}
        </span>
      </div>

      {/* SEGUIMIENTO */}
      {!fueraDeFlujo && (
        <ol className="mt-8 space-y-4">
          {pasos.map((paso, i) => (
            <li key={paso.id} className="flex items-center gap-4">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                  i <= posicion
                    ? "bg-[#ef4b91] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < posicion ? "✓" : i + 1}
              </span>
              <span
                className={
                  i <= posicion ? "font-bold text-[#70409a]" : "text-gray-400"
                }
              >
                {paso.titulo}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* PRODUCTOS */}
      <div className="mt-8 rounded-2xl bg-pink-50 p-5">
        {pedido.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1 text-sm">
            <span>
              {item.descripcion} x{item.cantidad}
            </span>
            <span className="font-bold">
              ${Number(item.precio_unitario) * item.cantidad}
            </span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-pink-200 pt-3">
          <span className="font-black">TOTAL</span>
          <span className="text-xl font-black text-[#ef4b91]">
            ${pedido.total}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {pedido.modalidad === "mayoreo" ? "Precio de mayoreo" : "Precio de menudeo"}
          {pedido.es_temporada ? " · incluye precio de temporada" : ""}
        </p>
      </div>

      {/* ENTREGA Y PAGO */}
      <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-pink-100 p-5">
          <p className="font-black text-[#70409a]">
            {pedido.tipo_entrega === "paqueteria"
              ? "📦 Envío por paquetería"
              : "🏪 Recogida presencial"}
          </p>
          {pedido.tipo_entrega === "paqueteria" ? (
            <>
              <p className="mt-2">
                {pedido.envio?.direccion}, {pedido.envio?.ciudad}
              </p>
              {pedido.envio?.paqueteria && (
                <p className="mt-2">
                  Paquetería:{" "}
                  <span className="font-bold">
                    {nombrePaqueteria(pedido.envio.paqueteria)}
                  </span>
                </p>
              )}
              <p className="mt-2">
                Número de guía:{" "}
                <span className="font-bold">
                  {pedido.envio?.numero_rastreo ?? "Pendiente"}
                </span>
              </p>
              {!pedido.envio?.numero_rastreo && (
                <p className="mt-1 text-xs text-gray-500">
                  Cuando Lucy envíe tu paquete aparecerá aquí el botón de rastreo.
                </p>
              )}
              {pedido.envio?.url_rastreo && (
                <a
                  href={pedido.envio.url_rastreo}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-full bg-[#70409a] px-5 py-2 font-bold text-white"
                >
                  Rastrear en {nombrePaqueteria(pedido.envio.paqueteria)} →
                </a>
              )}
            </>
          ) : (
            <p className="mt-2">📍 {pedido.entrega?.punto_entrega}</p>
          )}
          <p className="mt-2">
            📅 {formatearFecha(pedido.fecha_entrega)}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 p-5">
          <p className="font-black text-[#70409a]">💳 Pago</p>
          <p className="mt-2">
            {METODOS[pedido.metodo_pago] ?? pedido.metodo_pago}
          </p>
          <p className="mt-2 text-gray-500">
            Pedido realizado el {formatearFecha(pedido.creado_en)}
          </p>
        </div>
      </div>

      {/* ACCIONES */}
      {!fueraDeFlujo && pedido.estado !== "entregado" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cancelar?folio=${encodeURIComponent(pedido.folio)}`}
            className="rounded-full border-2 border-red-300 px-5 py-2 font-bold text-red-600 hover:bg-red-50"
          >
            Cancelar pedido
          </Link>
        </div>
      )}
      {pedido.estado === "entregado" && (
        <div className="mt-6">
          <Link
            href={`/devolucion?folio=${encodeURIComponent(pedido.folio)}`}
            className="rounded-full border-2 border-[#70409a] px-5 py-2 font-bold text-[#70409a] hover:bg-purple-50"
          >
            Solicitar devolución
          </Link>
        </div>
      )}
    </div>
  );
}
