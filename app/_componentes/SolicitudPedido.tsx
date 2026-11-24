"use client";

// Cancelar pedido / Solicitar devolución con los pedidos REALES del cliente.
// · Con sesión: lista TODOS los pedidos de la cuenta que se pueden cancelar
//   (o devolver), sin límite.
// · Sin sesión: el cliente escribe su folio y su teléfono.
// La regla (qué estados se pueden cancelar, regresar piezas al inventario)
// vive en Supabase: cancelar_pedido_cliente / solicitar_devolucion_cliente.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type Tipo = "cancelacion" | "devolucion";

type PedidoCorto = {
  folio: string;
  total: number;
  estado: string;
  creado_en: string;
};

const CONFIG = {
  cancelacion: {
    icono: "❌",
    titulo: "Cancelar pedido",
    subtitulo: "Elige el pedido que deseas cancelar e indica el motivo.",
    estados: ["pendiente", "preparando", "listo"],
    vacio: "No tienes pedidos que se puedan cancelar. Solo se cancelan los que todavía no salen.",
    motivos: [
      "Ya no deseo realizar la compra",
      "Realicé el pedido por error",
      "Necesito modificar mi pedido",
      "Otro motivo",
    ],
    aviso:
      "Puedes cancelar mientras tu pedido no haya salido. Las piezas regresan al inventario. Si ya fue enviado o entregado, solicita una devolución.",
    boton: "❌ Confirmar cancelación",
    rpc: "cancelar_pedido_cliente",
  },
  devolucion: {
    icono: "↩️",
    titulo: "Solicitar devolución",
    subtitulo: "Elige el pedido entregado que quieres devolver y cuéntanos qué pasó.",
    estados: ["entregado"],
    vacio: "No tienes pedidos entregados para devolver.",
    motivos: [
      "El producto llegó dañado",
      "Recibí un producto diferente",
      "El producto no corresponde a lo solicitado",
      "Otro motivo",
    ],
    aviso:
      "Novedades Lucy revisará tu solicitud y te contactará para indicarte los siguientes pasos.",
    boton: "↩️ Enviar solicitud",
    rpc: "solicitar_devolucion_cliente",
  },
} as const;

const ESTADOS: Record<string, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo para entrega",
  enviado: "Enviado",
  entregado: "Entregado",
};

function fecha(valor: string) {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function dinero(n: number) {
  return `$${Number(n).toLocaleString("es-MX")}`;
}

export default function SolicitudPedido({ tipo }: { tipo: Tipo }) {
  const cfg = CONFIG[tipo];
  const [supabase] = useState(() => createClient());

  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoCorto[]>([]);

  const [folio, setFolio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState<{ folio: string; pagado?: boolean } | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const desdeUrl = new URLSearchParams(window.location.search).get("folio") ?? "";
      const { data } = await supabase.auth.getUser();
      setUsuario(data.user);

      if (data.user) {
        const { data: filas } = await supabase
          .from("pedidos")
          .select("folio, total, estado, creado_en")
          .eq("canal", "en_linea")
          .in("estado", [...cfg.estados])
          .order("creado_en", { ascending: false });
        const lista = (filas ?? []) as PedidoCorto[];
        setPedidos(lista);
        if (desdeUrl && lista.some((p) => p.folio === desdeUrl)) setFolio(desdeUrl);
      } else {
        let guardadoFolio = "";
        try {
          const guardado = JSON.parse(localStorage.getItem("novedades-lucy-pedido") || "{}");
          guardadoFolio = guardado.folio ?? "";
          if (guardado.datosEnvio?.telefono) setTelefono(guardado.datosEnvio.telefono);
        } catch {
          // sin pedido previo en este navegador
        }
        setFolio(desdeUrl || guardadoFolio);
      }
      setCargando(false);
    };
    cargar();
  }, [supabase, cfg.estados]);

  const listo =
    folio.trim() !== "" &&
    motivo !== "" &&
    (usuario !== null || telefono.trim() !== "") &&
    (tipo === "cancelacion" || comentario.trim() !== "");

  const enviar = async () => {
    if (!listo) return;
    if (
      tipo === "cancelacion" &&
      !window.confirm(`¿Seguro que deseas cancelar el pedido ${folio.trim().toUpperCase()}?`)
    ) {
      return;
    }
    setEnviando(true);
    setError("");
    const params: Record<string, string | null> = {
      p_folio: folio.trim().toUpperCase(),
      p_telefono: usuario ? null : telefono.trim(),
      p_motivo: motivo,
    };
    if (tipo === "devolucion") params.p_comentario = comentario.trim();

    const { data, error } = await supabase.rpc(cfg.rpc, params);
    setEnviando(false);
    if (error) {
      const m = error.message || "";
      setError(
        m.includes("No encontramos") ||
          m.includes("ya está cancelado") ||
          m.includes("ya salió") ||
          m.includes("Ya solicitaste") ||
          m.includes("Solo se puede")
          ? m
          : "No pudimos registrar tu solicitud. Intenta de nuevo en un momento."
      );
      return;
    }
    const r = (data ?? {}) as { folio?: string; pagado?: boolean };
    setHecho({ folio: r.folio ?? folio.trim().toUpperCase(), pagado: r.pagado });
  };

  const encabezado = (
    <header className="border-b border-pink-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-3xl">💗</div>
          <div className="leading-none">
            <p className="text-sm font-bold text-[#70409a]">Novedades</p>
            <h1 className="text-2xl font-black text-[#ef4b91]">Lucy</h1>
          </div>
        </Link>
        <Link href="/pedidos" className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50">
          📦 Mis pedidos
        </Link>
      </div>
    </header>
  );

  if (hecho) {
    return (
      <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
        {encabezado}
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-12">
            <div className="text-6xl">✅</div>
            <h2 className="mt-5 text-3xl font-black text-[#6d3b91]">
              {tipo === "cancelacion" ? "Pedido cancelado" : "Solicitud de devolución enviada"}
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              {tipo === "cancelacion" ? (
                <>El pedido <strong>{hecho.folio}</strong> quedó cancelado y las piezas regresaron al inventario.</>
              ) : (
                <>Recibimos tu solicitud para el pedido <strong>{hecho.folio}</strong>. Novedades Lucy la revisará y te contactará.</>
              )}
            </p>
            {tipo === "cancelacion" && hecho.pagado && (
              <p className="mt-4 rounded-2xl bg-purple-50 p-4 text-sm text-gray-600">
                💳 Como ya estaba pagado, Novedades Lucy te contactará para el reembolso.
              </p>
            )}
            <div className="mt-6 rounded-2xl bg-[#fff7fb] p-5 text-left">
              <p className="text-sm font-bold text-[#70409a]">Motivo</p>
              <p className="mt-2 text-gray-600">{motivo}</p>
              {tipo === "devolucion" && (
                <>
                  <p className="mt-4 text-sm font-bold text-[#70409a]">Detalles</p>
                  <p className="mt-2 text-gray-600">{comentario}</p>
                </>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/pedidos" className="rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white hover:bg-[#df3d82]">
                📦 Ver mis pedidos
              </Link>
              <Link href="/" className="rounded-full border border-pink-200 px-7 py-3 font-bold text-[#70409a] hover:bg-pink-50">
                🏠 Inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const campo =
    "mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 outline-none focus:border-[#ef4b91]";

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      {encabezado}

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <div className="text-center">
            <div className="text-5xl">{cfg.icono}</div>
            <h2 className="mt-4 text-3xl font-black text-[#6d3b91]">{cfg.titulo}</h2>
            <p className="mt-3 leading-6 text-gray-500">{cfg.subtitulo}</p>
          </div>

          {cargando ? (
            <p className="mt-10 text-center font-bold text-[#70409a]">Cargando tus pedidos...</p>
          ) : (
            <>
              {/* PEDIDO */}
              <div className="mt-10">
                {usuario ? (
                  <>
                    <label className="font-bold text-[#70409a]">Selecciona tu pedido</label>
                    {pedidos.length === 0 ? (
                      <p className="mt-2 rounded-2xl bg-[#fff7fb] p-4 text-gray-600">{cfg.vacio}</p>
                    ) : (
                      <select value={folio} onChange={(e) => setFolio(e.target.value)} className={campo}>
                        <option value="">Selecciona un pedido</option>
                        {pedidos.map((p) => (
                          <option key={p.folio} value={p.folio}>
                            Pedido #{p.folio} — {dinero(p.total)} · {fecha(p.creado_en)} · {ESTADOS[p.estado] ?? p.estado}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                ) : (
                  <>
                    <p className="rounded-2xl bg-purple-50 p-4 text-sm text-gray-600">
                      Escribe el folio de tu pedido y el teléfono con el que lo hiciste.{" "}
                      <Link href="/cuenta" className="font-bold text-[#70409a] underline">
                        Inicia sesión
                      </Link>{" "}
                      para ver todos tus pedidos.
                    </p>
                    <label className="mt-5 block font-bold text-[#70409a]">Folio del pedido</label>
                    <input
                      value={folio}
                      onChange={(e) => setFolio(e.target.value)}
                      placeholder="Ej. NL-0007"
                      className={campo}
                    />
                    <label className="mt-4 block font-bold text-[#70409a]">Teléfono</label>
                    <input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 55 1234 5678"
                      inputMode="tel"
                      className={campo}
                    />
                  </>
                )}
              </div>

              {/* MOTIVO */}
              <div className="mt-6">
                <label className="font-bold text-[#70409a]">
                  {tipo === "cancelacion" ? "Motivo de cancelación" : "Motivo de la devolución"}
                </label>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}>
                  <option value="">Selecciona un motivo</option>
                  {cfg.motivos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {tipo === "devolucion" && (
                <div className="mt-6">
                  <label className="font-bold text-[#70409a]">Detalles</label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Describe brevemente el motivo de tu solicitud..."
                    className={campo}
                  />
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-[#fff7fb] p-5">
                <p className="text-sm leading-6 text-gray-600">⚠️ {cfg.aviso}</p>
              </div>

              {error && (
                <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>
              )}

              <button
                onClick={enviar}
                disabled={!listo || enviando}
                className={`mt-8 w-full rounded-full px-6 py-4 font-bold text-white transition ${
                  listo && !enviando ? "bg-[#ef4b91] hover:bg-[#df3d82]" : "cursor-not-allowed bg-gray-300"
                }`}
              >
                {enviando ? "Enviando..." : cfg.boton}
              </button>
            </>
          )}

          <Link href="/pedidos" className="mt-4 block text-center font-bold text-[#70409a] hover:underline">
            ← Regresar a mis pedidos
          </Link>
        </div>
      </section>

      <footer className="border-t border-pink-100 bg-white py-6 text-center">
        <p className="text-sm text-gray-500">© 2026 Novedades Lucy · Tienda de muñecos artesanales</p>
      </footer>
    </main>
  );
}
