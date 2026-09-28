"use client";

import { useEffect, useState } from "react";

type ProductoCarrito = {
  nombre: string;
  modelo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  emoji: string;
};

type MetodoPago = "tarjeta" | "efectivo" | "";

type TipoEntrega = "envio" | "fisica" | "";

export default function PagoPage() {
  const [producto, setProducto] =
    useState<ProductoCarrito | null>(null);

  const [metodoPago, setMetodoPago] =
    useState<MetodoPago>("");

  const [tipoEntrega, setTipoEntrega] =
    useState<TipoEntrega>("");

  const [fechaEntrega, setFechaEntrega] =
    useState("");

  useEffect(() => {
    const carritoGuardado = localStorage.getItem(
      "novedades-lucy-carrito"
    );

    if (carritoGuardado) {
      setProducto(JSON.parse(carritoGuardado));
    }

    const fechaGuardada = localStorage.getItem(
      "novedades-lucy-fecha"
    );

    if (fechaGuardada) {
      setFechaEntrega(fechaGuardada);
    }
  }, []);

  const seleccionarMetodoPago = (
    metodo: MetodoPago
  ) => {
    setMetodoPago(metodo);

    /*
     * El efectivo solamente permite
     * entrega física.
     */
    if (metodo === "efectivo") {
      setTipoEntrega("fisica");
    } else {
      setTipoEntrega("");
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "No seleccionada";

    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const confirmarPedido = () => {
    if (!metodoPago) {
      alert("Selecciona un método de pago para continuar.");
      return;
    }

    if (!tipoEntrega) {
      alert("Selecciona cómo deseas recibir tu pedido.");
      return;
    }

    const datosEnvio = JSON.parse(
      localStorage.getItem(
        "novedades-lucy-envio"
      ) || "{}"
    );

    const pedido = {
      producto,
      metodoPago,
      tipoEntrega,
      fechaEntrega,
      datosEnvio,
      fechaPedido: new Date().toISOString(),
    };

    localStorage.setItem(
      "novedades-lucy-pedido",
      JSON.stringify(pedido)
    );

    window.location.href = "/confirmacion";
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">

      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <a
            href="/"
            className="flex items-center gap-2"
          >
            <div className="text-3xl">
              💗
            </div>

            <div className="leading-none">

              <p className="text-sm font-bold text-[#70409a]">
                Novedades
              </p>

              <h1 className="text-2xl font-black text-[#ef4b91]">
                Lucy
              </h1>

            </div>
          </a>

          <span className="text-sm font-bold text-[#70409a]">
            Paso 3 de 3
          </span>

        </div>

      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-5xl px-6 py-10">

        {/* PROGRESO */}
        <div className="mb-8">

          <div className="flex items-center justify-between text-sm font-bold">

            <span className="text-green-500">
              ✓ Envío
            </span>

            <span className="text-green-500">
              ✓ Fecha
            </span>

            <span className="text-[#ef4b91]">
              3. Pago
            </span>

          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

            <div className="h-full w-full rounded-full bg-[#ef4b91]" />

          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_350px]">

          {/* PAGOS */}
          <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <p className="font-bold text-[#ef4b91]">
                Finalizar pedido
              </p>

              <h2 className="mt-1 text-3xl font-black text-[#70409a]">
                Método de pago
              </h2>

              <p className="mt-2 text-gray-500">
                Selecciona cómo deseas realizar tu pago.
              </p>

            </div>

            {/* MÉTODOS */}
            <div className="space-y-4">

              {/* TARJETA / TRANSFERENCIA */}
              <button
                type="button"
                onClick={() =>
                  seleccionarMetodoPago("tarjeta")
                }
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  metodoPago === "tarjeta"
                    ? "border-[#ef4b91] bg-pink-50"
                    : "border-gray-100 hover:border-pink-200"
                }`}
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                    💳
                  </div>

                  <div className="flex-1">

                    <p className="font-black text-[#70409a]">
                      Transferencia bancaria / Pago con tarjeta
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Realiza tu pago mediante transferencia
                      o tarjeta bancaria.
                    </p>

                  </div>

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      metodoPago === "tarjeta"
                        ? "border-[#ef4b91] bg-[#ef4b91] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {metodoPago === "tarjeta" && "✓"}
                  </div>

                </div>

              </button>

              {/* EFECTIVO */}
              <button
                type="button"
                onClick={() =>
                  seleccionarMetodoPago("efectivo")
                }
                className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                  metodoPago === "efectivo"
                    ? "border-[#ef4b91] bg-pink-50"
                    : "border-gray-100 hover:border-pink-200"
                }`}
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                    💵
                  </div>

                  <div className="flex-1">

                    <p className="font-black text-[#70409a]">
                      Pago en efectivo
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Disponible únicamente para entrega física.
                    </p>

                  </div>

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      metodoPago === "efectivo"
                        ? "border-[#ef4b91] bg-[#ef4b91] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {metodoPago === "efectivo" && "✓"}
                  </div>

                </div>

              </button>

            </div>

            {/* EFECTIVO */}
            {metodoPago === "efectivo" && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                <div className="flex gap-4">

                  <div className="text-3xl">
                    🏪
                  </div>

                  <div>

                    <p className="font-black text-green-700">
                      Entrega física
                    </p>

                    <p className="mt-1 text-sm leading-6 text-green-700">
                      El pago en efectivo únicamente está
                      disponible para pedidos que serán
                      recogidos físicamente.
                    </p>

                    <p className="mt-3 font-bold text-green-800">
                      📅 Fecha seleccionada:{" "}
                      {formatearFecha(fechaEntrega)}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* TARJETA / TRANSFERENCIA */}
            {metodoPago === "tarjeta" && (
              <div className="mt-6">

                <h3 className="text-xl font-black text-[#70409a]">
                  ¿Cómo deseas recibir tu pedido?
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Selecciona una opción.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  {/* ENVÍO */}
                  <button
                    type="button"
                    onClick={() =>
                      setTipoEntrega("envio")
                    }
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      tipoEntrega === "envio"
                        ? "border-[#ef4b91] bg-pink-50"
                        : "border-gray-100 hover:border-pink-200"
                    }`}
                  >

                    <div className="text-3xl">
                      📦
                    </div>

                    <p className="mt-3 font-black text-[#70409a]">
                      Envío a domicilio
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Recibe tu pedido mediante paquetería.
                    </p>

                    {tipoEntrega === "envio" && (
                      <p className="mt-3 text-sm font-bold text-[#ef4b91]">
                        ✓ Seleccionado
                      </p>
                    )}

                  </button>

                  {/* ENTREGA FÍSICA */}
                  <button
                    type="button"
                    onClick={() =>
                      setTipoEntrega("fisica")
                    }
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      tipoEntrega === "fisica"
                        ? "border-[#ef4b91] bg-pink-50"
                        : "border-gray-100 hover:border-pink-200"
                    }`}
                  >

                    <div className="text-3xl">
                      🏪
                    </div>

                    <p className="mt-3 font-black text-[#70409a]">
                      Entrega física
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Recoge tu pedido físicamente.
                    </p>

                    {tipoEntrega === "fisica" && (
                      <p className="mt-3 text-sm font-bold text-[#ef4b91]">
                        ✓ Seleccionado
                      </p>
                    )}

                  </button>

                </div>

              </div>
            )}

            {/* INFORMACIÓN DE ENVÍO */}
            {metodoPago === "tarjeta" &&
              tipoEntrega === "envio" && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <div className="flex gap-4">

                    <div className="text-3xl">
                      📱
                    </div>

                    <div>

                      <p className="font-black text-blue-800">
                        Seguimiento por WhatsApp
                      </p>

                      <p className="mt-1 text-sm leading-6 text-blue-700">
                        Lucy enviará por WhatsApp el código
                        de rastreo proporcionado por la
                        paquetería para que puedas consultar
                        el estado de tu pedido.
                      </p>

                    </div>

                  </div>

                </div>
              )}

            {/* INFORMACIÓN ENTREGA FÍSICA */}
            {tipoEntrega === "fisica" && (
              <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">

                <div className="flex gap-4">

                  <div className="text-3xl">
                    📅
                  </div>

                  <div>

                    <p className="font-black text-[#70409a]">
                      Fecha de entrega física
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Tu pedido estará disponible para
                      entrega física en la fecha que
                      seleccionaste anteriormente.
                    </p>

                    <p className="mt-3 font-black text-[#ef4b91]">
                      {formatearFecha(fechaEntrega)}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* AVISO */}
            <div className="mt-6 rounded-2xl bg-gray-50 p-4">

              <p className="font-bold text-[#70409a]">
                🔒 Pago seguro
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                En esta demostración el proceso de pago es
                simulado. No se realizará ningún cargo real.
              </p>

            </div>

            {/* BOTONES */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <a
                href="/fecha"
                className="flex-1 rounded-full border-2 border-[#70409a] px-6 py-4 text-center font-bold text-[#70409a] hover:bg-purple-50"
              >
                ← Volver
              </a>

              <button
                type="button"
                onClick={confirmarPedido}
                className="flex-1 rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#df3d82]"
              >
                Confirmar pedido
              </button>

            </div>

          </div>

          {/* RESUMEN */}
          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">

            <h3 className="text-xl font-black text-[#70409a]">
              Resumen del pedido
            </h3>

            {producto ? (
              <div className="mt-6">

                <div className="flex items-center gap-4">

                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe1ef] to-[#eadcf5] text-4xl">
                    {producto.emoji}
                  </div>

                  <div>

                    <p className="font-black text-[#70409a]">
                      {producto.nombre}
                    </p>

                    <p className="text-sm text-gray-500">
                      Cantidad: {producto.cantidad}
                    </p>

                  </div>

                </div>

                <div className="mt-6 space-y-3 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Precio unitario
                    </span>

                    <span className="font-bold">
                      ${producto.precioUnitario}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Cantidad
                    </span>

                    <span className="font-bold">
                      {producto.cantidad}
                    </span>

                  </div>

                  <div className="border-t border-gray-100 pt-4">

                    <div className="flex items-end justify-between">

                      <span className="font-bold text-[#70409a]">
                        TOTAL
                      </span>

                      <span className="text-3xl font-black text-[#ef4b91]">
                        ${producto.subtotal}
                      </span>

                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <p className="mt-6 text-sm text-gray-500">
                No se encontró información del carrito.
              </p>
            )}

          </aside>

        </div>

      </section>

    </main>
  );
}