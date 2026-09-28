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

export default function PagoPage() {
  const [producto, setProducto] =
    useState<ProductoCarrito | null>(null);

  const [metodoPago, setMetodoPago] =
    useState<MetodoPago>("");

  useEffect(() => {
    const carritoGuardado = localStorage.getItem(
      "novedades-lucy-carrito"
    );

    if (carritoGuardado) {
      setProducto(JSON.parse(carritoGuardado));
    }
  }, []);

  const confirmarPedido = () => {
    if (!metodoPago) {
      alert("Selecciona un método de pago para continuar.");
      return;
    }

    const pedido = {
      producto,
      metodoPago,
      fechaEntrega: localStorage.getItem(
        "novedades-lucy-fecha"
      ),
      datosEnvio: JSON.parse(
        localStorage.getItem(
          "novedades-lucy-envio"
        ) || "{}"
      ),
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

          <a href="/" className="flex items-center gap-2">
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
      <section className="mx-auto max-w-4xl px-6 py-10">

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

          {/* MÉTODOS DE PAGO */}
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

            <div className="space-y-4">

              {/* TARJETA / TRANSFERENCIA */}
              <button
                onClick={() =>
                  setMetodoPago("tarjeta")
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
                onClick={() =>
                  setMetodoPago("efectivo")
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
                      Realiza el pago en efectivo al recibir
                      tu pedido.
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

            {/* AVISO */}
            <div className="mt-6 rounded-2xl bg-purple-50 p-4">

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