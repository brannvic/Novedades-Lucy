"use client";

// Panel de Lucy · PEDIDOS de la tienda en línea (en persona y paquetería)

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { PAQUETERIAS, type ClavePaqueteria } from "@/lib/paqueterias";
import {
  Aviso,
  METODOS,
  Titulo,
  dinero,
  fechaBonita,
  mensajeError,
} from "./comun";

type PedidoAdmin = {
  folio: string;
  cliente: string;
  telefono: string;
  estado: string;
  tipo_entrega: "presencial" | "paqueteria";
  metodo_pago: string;
  pago_estado: string | null;
  total: number;
  modalidad: string;
  fecha_entrega: string;
  piezas: number;
  items: { descripcion: string; cantidad: number; precio: number }[] | null;
  envio: {
    direccion: string;
    ciudad: string;
    estado: string;
    cp: string;
    paqueteria: string | null;
    numero_rastreo: string | null;
    url_rastreo: string | null;
  } | null;
};

const ESTADOS: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Nuevo", color: "bg-yellow-100 text-yellow-800" },
  preparando: { texto: "Preparando", color: "bg-blue-100 text-blue-800" },
  listo: { texto: "Listo", color: "bg-purple-100 text-purple-800" },
  enviado: { texto: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  entregado: { texto: "Entregado", color: "bg-green-100 text-green-800" },
  cancelado: { texto: "Cancelado", color: "bg-red-100 text-red-800" },
  devolucion_solicitada: { texto: "Pide devolución", color: "bg-orange-100 text-orange-800" },
  devuelto: { texto: "Devuelto", color: "bg-gray-200 text-gray-700" },
};

type Filtro = "todos" | "presencial" | "paqueteria";

function enlaceWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  const conLada = digitos.length === 10 ? `52${digitos}` : digitos;
  return `https://wa.me/${conLada}`;
}

export default function Pedidos() {
  const [supabase] = useState(() => createClient());

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verCerrados, setVerCerrados] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [guia, setGuia] = useState<{ folio: string; paqueteria: ClavePaqueteria; numero: string } | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_pedidos", {
      p_abiertos: !verCerrados,
    });
    if (error) {
      setMensaje({ tipo: "error", texto: mensajeError(error) });
    } else {
      setPedidos((data ?? []) as PedidoAdmin[]);
    }
    setCargando(false);
  }, [supabase, verCerrados]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutar = async (
    folio: string,
    funcion: string,
    argumentos: Record<string, unknown>,
    exito: string
  ) => {
    setOcupado(folio);
    setMensaje(null);
    const { error } = await supabase.rpc(funcion, argumentos);
    setOcupado(null);
    if (error) {
      setMensaje({ tipo: "error", texto: mensajeError(error) });
      return;
    }
    setMensaje({ tipo: "ok", texto: exito });
    setGuia(null);
    cargar();
  };

  const visibles = pedidos.filter(
    (p) =>
      (filtro === "todos" || p.tipo_entrega === filtro) &&
      (filtroPago === "todos" || p.metodo_pago === filtroPago)
  );

  const cuenta = (tipo: string) => pedidos.filter((p) => p.tipo_entrega === tipo).length;
  const totalPorMetodo = (metodo: string) =>
    visibles
      .filter((p) => p.metodo_pago === metodo)
      .reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="space-y-4 pb-6">
      <Titulo>🚚 Pedidos de la tienda en línea</Titulo>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-4xl font-black text-[#70409a]">{cuenta("presencial")}</p>
          <p className="text-lg font-bold">🏪 Recogen en el local</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-4xl font-black text-[#70409a]">{cuenta("paqueteria")}</p>
          <p className="text-lg font-bold">📦 Por paquetería</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-3 gap-2">
        {([
          ["todos", "Todos"],
          ["presencial", "🏪 Local"],
          ["paqueteria", "📦 Envío"],
        ] as [Filtro, string][]).map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setFiltro(clave)}
            className={`h-14 rounded-2xl text-lg font-bold ${
              filtro === clave ? "bg-[#ef4b91] text-white" : "bg-white text-[#70409a]"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["todos", ...Object.keys(METODOS)].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setFiltroPago(m)}
            className={`shrink-0 rounded-full px-4 py-2 text-lg font-bold ${
              filtroPago === m ? "bg-[#70409a] text-white" : "bg-white text-[#70409a]"
            }`}
          >
            {m === "todos" ? "Todo pago" : `${METODOS[m].icono} ${METODOS[m].texto}`}
          </button>
        ))}
      </div>

      {/* TOTALES POR MÉTODO */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {Object.entries(METODOS).map(([clave, m]) => (
          <div key={clave} className="flex justify-between py-1 text-lg">
            <span>
              {m.icono} {m.texto}
            </span>
            <b>{dinero(totalPorMetodo(clave))}</b>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setVerCerrados(!verCerrados)}
        className="text-lg font-bold text-[#70409a] underline"
      >
        {verCerrados ? "Ver solo los que faltan por entregar" : "Ver también los ya entregados (30 días)"}
      </button>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {cargando ? (
        <p className="text-xl font-bold text-[#70409a]">Cargando pedidos...</p>
      ) : visibles.length === 0 ? (
        <Aviso tipo="info">No hay pedidos aquí. 🎉</Aviso>
      ) : (
        <div className="space-y-4">
          {visibles.map((p) => {
            const metodo = METODOS[p.metodo_pago];
            const pagado = p.pago_estado === "aprobado";
            const abierto = ["pendiente", "preparando", "listo", "enviado"].includes(p.estado);
            const esEnvio = p.tipo_entrega === "paqueteria";
            return (
              <article key={p.folio} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-black text-gray-500">{p.folio}</span>
                  <span className={`rounded-full px-3 py-1 text-base font-bold ${ESTADOS[p.estado]?.color}`}>
                    {ESTADOS[p.estado]?.texto ?? p.estado}
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black text-[#4a2857]">
                  {esEnvio ? "📦 Envío" : "🏪 Recoge"} · {fechaBonita(p.fecha_entrega)}
                </p>

                <p className="mt-1 text-xl font-bold">{p.cliente}</p>
                <div className="mt-2 flex gap-2">
                  <a
                    href={`tel:${p.telefono}`}
                    className="flex h-12 flex-1 items-center justify-center rounded-xl bg-pink-50 text-lg font-bold text-[#70409a]"
                  >
                    📞 Llamar
                  </a>
                  <a
                    href={enlaceWhatsApp(p.telefono)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 flex-1 items-center justify-center rounded-xl bg-green-50 text-lg font-bold text-green-700"
                  >
                    💬 WhatsApp
                  </a>
                </div>

                {/* PRODUCTOS */}
                <div className="mt-4 rounded-2xl bg-pink-50 p-4">
                  {(p.items ?? []).map((i, n) => (
                    <div key={n} className="flex justify-between py-1 text-lg">
                      <span>
                        <b>{i.cantidad} ×</b> {i.descripcion}
                      </span>
                      <span>{dinero(i.cantidad * i.precio)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t-2 border-pink-200 pt-2 text-xl">
                    <span className="font-bold">
                      {p.piezas} pieza{p.piezas !== 1 ? "s" : ""}
                    </span>
                    <span className="font-black text-[#ef4b91]">{dinero(p.total)}</span>
                  </div>
                </div>

                {/* PAGO */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-lg font-bold ${metodo?.color}`}>
                    {metodo?.icono} {metodo?.texto}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-lg font-bold ${
                      pagado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {pagado ? "✓ Pagado" : "⏳ Falta pago"}
                  </span>
                </div>

                {/* ENVÍO */}
                {esEnvio && p.envio && (
                  <div className="mt-3 text-lg">
                    <p>
                      📍 {p.envio.direccion}, {p.envio.ciudad}, {p.envio.estado}, CP {p.envio.cp}
                    </p>
                    {p.envio.numero_rastreo && (
                      <p className="mt-1">
                        🚚 {p.envio.paqueteria?.toUpperCase()} · <b>{p.envio.numero_rastreo}</b>
                      </p>
                    )}
                  </div>
                )}

                {/* ACCIONES */}
                {abierto && (
                  <div className="mt-4 grid gap-2">
                    {!pagado && p.metodo_pago !== "tarjeta" && (
                      <button
                        type="button"
                        disabled={ocupado === p.folio}
                        onClick={() =>
                          ejecutar(p.folio, "admin_confirmar_pago", { p_folio: p.folio }, `✓ Pago de ${p.folio} confirmado`)
                        }
                        className="h-14 rounded-2xl bg-green-600 text-xl font-black text-white disabled:opacity-60"
                      >
                        💰 Ya me pagó
                      </button>
                    )}

                    {(p.estado === "pendiente" || p.estado === "preparando") && (
                      <button
                        type="button"
                        disabled={ocupado === p.folio}
                        onClick={() =>
                          ejecutar(p.folio, "admin_cambiar_estado", { p_folio: p.folio, p_estado: "listo" }, `✓ ${p.folio} está listo`)
                        }
                        className="h-14 rounded-2xl bg-[#70409a] text-xl font-black text-white disabled:opacity-60"
                      >
                        🎀 Ya está listo
                      </button>
                    )}

                    {esEnvio && !p.envio?.numero_rastreo && (
                      guia?.folio === p.folio ? (
                        <div className="space-y-2 rounded-2xl border-2 border-[#70409a] p-3">
                          <p className="text-lg font-bold">¿Con qué paquetería?</p>
                          <div className="grid grid-cols-3 gap-2">
                            {PAQUETERIAS.map((q) => (
                              <button
                                key={q.clave}
                                type="button"
                                onClick={() => setGuia({ ...guia, paqueteria: q.clave })}
                                className={`h-12 rounded-xl text-lg font-bold ${
                                  guia.paqueteria === q.clave ? "bg-[#ef4b91] text-white" : "bg-pink-50 text-[#70409a]"
                                }`}
                              >
                                {q.nombre}
                              </button>
                            ))}
                          </div>
                          <input
                            inputMode="numeric"
                            value={guia.numero}
                            onChange={(e) => setGuia({ ...guia, numero: e.target.value })}
                            placeholder="Número de guía"
                            className="h-14 w-full rounded-xl border-2 border-pink-200 px-3 text-xl"
                          />
                          <button
                            type="button"
                            disabled={!guia.numero.trim() || ocupado === p.folio}
                            onClick={() =>
                              ejecutar(
                                p.folio,
                                "admin_guardar_guia",
                                { p_folio: p.folio, p_paqueteria: guia.paqueteria, p_numero: guia.numero },
                                `✓ Guía guardada. ${p.folio} quedó como enviado`
                              )
                            }
                            className="h-14 w-full rounded-xl bg-green-600 text-xl font-black text-white disabled:opacity-50"
                          >
                            ✓ Guardar guía
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setGuia({ folio: p.folio, paqueteria: "estafeta", numero: "" })}
                          className="h-14 rounded-2xl bg-indigo-600 text-xl font-black text-white"
                        >
                          🚚 Ya lo envié (poner guía)
                        </button>
                      )
                    )}

                    {((!esEnvio && p.estado === "listo") || p.estado === "enviado") && (
                      <button
                        type="button"
                        disabled={ocupado === p.folio}
                        onClick={() =>
                          ejecutar(p.folio, "admin_cambiar_estado", { p_folio: p.folio, p_estado: "entregado" }, `✓ ${p.folio} entregado`)
                        }
                        className="h-14 rounded-2xl bg-green-600 text-xl font-black text-white disabled:opacity-60"
                      >
                        ✅ Ya lo entregué
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={ocupado === p.folio}
                      onClick={() => {
                        if (window.confirm(`¿Seguro que quieres cancelar el pedido ${p.folio}? Las piezas regresan al inventario.`)) {
                          ejecutar(p.folio, "admin_cambiar_estado", { p_folio: p.folio, p_estado: "cancelado" }, `${p.folio} cancelado`);
                        }
                      }}
                      className="mt-1 text-lg font-bold text-red-600 underline"
                    >
                      Cancelar pedido
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
