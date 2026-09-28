"use client";

import Link from "next/link";
import { useState } from "react";

type EstadoPedido =
  | "recibido"
  | "pago_confirmado"
  | "preparando"
  | "enviado"
  | "listo_para_recoger"
  | "entregado"
  | "cancelado"
  | "devolucion_solicitada"
  | "devuelto";

type TipoEntrega = "envio" | "recogida";

export default function PedidosPage() {
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(false);

  // Este estado después vendrá desde Supabase
  const [estado] = useState<EstadoPedido>("preparando");

  // Este valor después vendrá desde el pedido guardado
  const [tipoEntrega] = useState<TipoEntrega>("envio");

  const direccionRecogida =
    "Girón 33, Centro Histórico de la Cdad. de México, Centro, Cuauhtémoc, 06020 Ciudad de México, CDMX";

  const pasosEnvio = [
    {
      id: "recibido",
      titulo: "Pedido recibido",
      descripcion: "Hemos recibido correctamente tu pedido.",
    },
    {
      id: "pago_confirmado",
      titulo: "Pago confirmado",
      descripcion: "El pago de tu pedido ha sido confirmado.",
    },
    {
      id: "preparando",
      titulo: "Preparando pedido",
      descripcion: "Estamos preparando tus productos.",
    },
    {
      id: "enviado",
      titulo: "Pedido enviado",
      descripcion: "Tu pedido fue entregado a la paquetería.",
    },
    {
      id: "entregado",
      titulo: "Pedido entregado",
      descripcion: "Tu pedido ha sido entregado.",
    },
  ];

  const pasosRecogida = [
    {
      id: "recibido",
      titulo: "Pedido recibido",
      descripcion: "Hemos recibido correctamente tu pedido.",
    },
    {
      id: "pago_confirmado",
      titulo: "Pago confirmado",
      descripcion: "El pago de tu pedido ha sido confirmado.",
    },
    {
      id: "preparando",
      titulo: "Preparando pedido",
      descripcion: "Estamos preparando tus productos.",
    },
    {
      id: "listo_para_recoger",
      titulo: "Listo para recoger",
      descripcion: "Tu pedido está listo para recogerse.",
    },
    {
      id: "entregado",
      titulo: "Pedido entregado",
      descripcion: "El pedido fue entregado.",
    },
  ];

  const pasos =
    tipoEntrega === "envio" ? pasosEnvio : pasosRecogida;

  const obtenerPosicionEstado = () => {
    const posicion = pasos.findIndex((paso) => paso.id === estado);

    return posicion === -1 ? 0 : posicion;
  };

  const posicionActual = obtenerPosicionEstado();

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-3xl">💗</div>

            <div className="leading-none">
              <p className="text-sm font-bold text-[#70409a]">
                Novedades
              </p>

              <h1 className="text-2xl font-black text-[#ef4b91]">
                Lucy
              </h1>
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

      {/* CONTENIDO */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        {!pedidoSeleccionado ? (
          <>
            {/* TÍTULO */}
            <div className="mb-8">
              <p className="text-4xl">📦</p>

              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">
                Mis pedidos
              </h2>

              <p className="mt-2 text-gray-500">
                Consulta tus pedidos y revisa el estado en el que
                se encuentran.
              </p>
            </div>

            {/* PEDIDO */}
            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#70409a]">
                    Pedido
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#6d3b91]">
                    #PED-001
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    2 productos
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Fecha: 28/09/2026
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="text-2xl font-black text-[#ef4b91]">
                    $850
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-purple-50 px-4 py-1 text-sm font-bold text-[#70409a]">
                    {tipoEntrega === "envio"
                      ? "🚚 Envío"
                      : "🏪 Recogida presencial"}
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-pink-100" />

              {/* ESTADO ACTUAL */}
              <div className="rounded-2xl bg-[#fff7fb] p-5">
                <p className="text-sm font-bold text-gray-500">
                  Estado actual
                </p>

                <p className="mt-1 text-xl font-black text-[#70409a]">
                  {pasos[posicionActual]?.titulo}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {pasos[posicionActual]?.descripcion}
                </p>
              </div>

              <button
                onClick={() => setPedidoSeleccionado(true)}
                className="mt-6 w-full rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white transition hover:bg-[#df3d82]"
              >
                Ver seguimiento del pedido
              </button>
            </div>
          </>
        ) : (
          <>
            {/* DETALLE */}
            <div className="mb-8">
              <button
                onClick={() => setPedidoSeleccionado(false)}
                className="font-bold text-[#70409a] hover:underline"
              >
                ← Regresar a mis pedidos
              </button>

              <p className="mt-6 text-4xl">📦</p>

              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">
                Pedido #PED-001
              </h2>

              <p className="mt-2 text-gray-500">
                Seguimiento de tu pedido.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              {/* INFORMACIÓN */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#fff7fb] p-4">
                  <p className="text-sm text-gray-500">
                    Fecha del pedido
                  </p>

                  <p className="mt-1 font-bold text-[#70409a]">
                    28/09/2026
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff7fb] p-4">
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="mt-1 font-bold text-[#ef4b91]">
                    $850
                  </p>
                </div>
              </div>

              {/* TIPO DE ENTREGA */}
              <div className="mt-6 rounded-2xl bg-purple-50 p-5">
                <p className="font-bold text-[#70409a]">
                  {tipoEntrega === "envio"
                    ? "🚚 Método de entrega"
                    : "🏪 Método de entrega"}
                </p>

                <p className="mt-1 font-black text-[#6d3b91]">
                  {tipoEntrega === "envio"
                    ? "Envío por paquetería"
                    : "Recogida presencial"}
                </p>

                {tipoEntrega === "recogida" && (
                  <div className="mt-3 rounded-xl bg-white p-4">
                    <p className="text-sm font-bold text-[#70409a]">
                      📍 Dirección de recogida
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {direccionRecogida}
                    </p>
                  </div>
                )}
              </div>

              {/* SEGUIMIENTO */}
              <div className="mt-8">
                <h3 className="text-xl font-black text-[#70409a]">
                  Estado del pedido
                </h3>

                <div className="mt-6 space-y-0">
                  {pasos.map((paso, index) => {
                    const completado =
                      index < posicionActual;

                    const actual =
                      index === posicionActual;

                    return (
                      <div
                        key={paso.id}
                        className="relative flex gap-4"
                      >
                        {/* LÍNEA */}
                        {index < pasos.length - 1 && (
                          <div
                            className={`absolute left-[15px] top-8 h-full w-[2px] ${
                              index < posicionActual
                                ? "bg-[#ef4b91]"
                                : "bg-pink-100"
                            }`}
                          />
                        )}

                        {/* CÍRCULO */}
                        <div
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            completado
                              ? "bg-[#ef4b91] text-white"
                              : actual
                              ? "bg-[#70409a] text-white"
                              : "bg-pink-100 text-[#70409a]"
                          }`}
                        >
                          {completado
                            ? "✓"
                            : actual
                            ? "●"
                            : "○"}
                        </div>

                        {/* TEXTO */}
                        <div className="pb-8">
                          <p
                            className={`font-black ${
                              actual || completado
                                ? "text-[#6d3b91]"
                                : "text-gray-400"
                            }`}
                          >
                            {paso.titulo}
                          </p>

                          <p
                            className={`mt-1 text-sm ${
                              actual || completado
                                ? "text-gray-500"
                                : "text-gray-300"
                            }`}
                          >
                            {paso.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ENVÍO */}
              {tipoEntrega === "envio" &&
                (estado === "enviado" ||
                  estado === "entregado") && (
                  <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                    <p className="font-bold text-blue-700">
                      📦 Información de envío
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Tu pedido fue enviado mediante la
                      paquetería seleccionada.
                    </p>

                    <p className="mt-3 text-sm font-bold text-[#70409a]">
                      Número de guía
                    </p>

                    <p className="mt-1 font-black">
                      Pendiente de asignación
                    </p>
                  </div>
                )}

              {/* RECOGIDA */}
              {tipoEntrega === "recogida" &&
                estado === "listo_para_recoger" && (
                  <div className="mt-6 rounded-2xl bg-green-50 p-5">
                    <p className="font-bold text-green-700">
                      🏪 Tu pedido está listo para recoger
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Puedes recoger tu pedido en:
                    </p>

                    <p className="mt-2 font-bold text-[#70409a]">
                      {direccionRecogida}
                    </p>
                  </div>
                )}

              {/* CANCELADO */}
              {estado === "cancelado" && (
                <div className="mt-6 rounded-2xl bg-red-50 p-5">
                  <p className="font-bold text-red-700">
                    ❌ Pedido cancelado
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Este pedido ha sido cancelado.
                  </p>
                </div>
              )}

              {/* DEVOLUCIÓN */}
              {(estado === "devolucion_solicitada" ||
                estado === "devuelto") && (
                <div className="mt-6 rounded-2xl bg-yellow-50 p-5">
                  <p className="font-bold text-yellow-700">
                    ↩️ Devolución
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Tu solicitud de devolución se encuentra registrada.
                  </p>
                </div>
              )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-pink-100 bg-white py-6 text-center">
        <p className="text-sm text-gray-500">
          © 2026 Novedades Lucy · Tienda de muñecos artesanales
        </p>
      </footer>
    </main>
  );
}