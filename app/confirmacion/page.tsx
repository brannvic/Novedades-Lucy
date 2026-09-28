"use client";

import { useEffect, useState } from "react";

type Pedido = {
  producto: {
    nombre: string;
    modelo: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    emoji: string;
  };

  metodoPago: string;

  fechaEntrega: string;

  datosEnvio: {
    nombre: string;
    telefono: string;
    calle: string;
    numero: string;
    colonia: string;
    ciudad: string;
    codigoPostal: string;
  };

  fechaPedido: string;
};

export default function ConfirmacionPage() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    const pedidoGuardado = localStorage.getItem(
      "novedades-lucy-pedido"
    );

    if (pedidoGuardado) {
      setPedido(JSON.parse(pedidoGuardado));
    }
  }, []);

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "No especificada";

    const [year, month, day] = fecha.split("-");

    return `${day}/${month}/${year}`;
  };

    const [numeroPedido] = useState(
        () => "NL-" + Math.floor(1000 + Math.random() * 9000)
    );

  if (!pedido) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7fb] px-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">📦</div>

          <h1 className="mt-4 text-2xl font-black text-[#70409a]">
            No encontramos tu pedido
          </h1>

          <p className="mt-2 text-gray-500">
            Regresa al catálogo para comenzar una nueva compra.
          </p>

          <a
            href="/catalogo"
            className="mt-6 inline-block rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white"
          >
            Ir al catálogo
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">

      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">

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

        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-4xl px-6 py-12">

        {/* ÉXITO */}
        <div className="text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl">
            ✓
          </div>

          <p className="mt-6 font-bold text-[#ef4b91]">
            ¡Pedido realizado!
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#70409a]">
            ¡Gracias por tu compra!
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            Tu pedido fue registrado correctamente.
            A continuación puedes consultar el resumen de tu compra.
          </p>

        </div>

        {/* NUMERO DE PEDIDO */}
        <div className="mx-auto mt-8 max-w-md rounded-3xl border border-pink-100 bg-white p-6 text-center shadow-sm">

          <p className="text-sm font-bold text-gray-400">
            NÚMERO DE PEDIDO
          </p>

          <p className="mt-2 text-3xl font-black text-[#ef4b91]">
            {numeroPedido}
          </p>

        </div>

        {/* RESUMEN */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">

          {/* PRODUCTO */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black text-[#70409a]">
              Resumen del pedido
            </h2>

            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe1ef] to-[#eadcf5] text-4xl">
                {pedido.producto.emoji}
              </div>

              <div>

                <p className="font-black text-[#70409a]">
                  {pedido.producto.nombre}
                </p>

                <p className="text-sm text-gray-500">
                  {pedido.producto.modelo}
                </p>

                <p className="mt-1 text-sm font-bold text-[#ef4b91]">
                  {pedido.producto.cantidad} pieza(s)
                </p>

              </div>

            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Precio unitario
                </span>

                <span className="font-bold">
                  ${pedido.producto.precioUnitario}
                </span>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-bold">
                  ${pedido.producto.subtotal}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">

                <span className="font-black text-[#70409a]">
                  TOTAL
                </span>

                <span className="text-3xl font-black text-[#ef4b91]">
                  ${pedido.producto.subtotal}
                </span>

              </div>

            </div>

          </div>

          {/* ENTREGA */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black text-[#70409a]">
              Información de entrega
            </h2>

            <div className="mt-5 space-y-4">

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Recibe
                </p>

                <p className="mt-1 font-bold">
                  {pedido.datosEnvio.nombre}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Dirección
                </p>

                <p className="mt-1 font-bold">
                  {pedido.datosEnvio.calle}{" "}
                  {pedido.datosEnvio.numero}
                </p>

                <p className="text-sm text-gray-500">
                  {pedido.datosEnvio.colonia},{" "}
                  {pedido.datosEnvio.ciudad}
                </p>

                <p className="text-sm text-gray-500">
                  C.P. {pedido.datosEnvio.codigoPostal}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Teléfono
                </p>

                <p className="mt-1 font-bold">
                  {pedido.datosEnvio.telefono}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* FECHA Y PAGO */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-bold text-gray-400">
              FECHA DE ENTREGA
            </p>

            <p className="mt-2 text-2xl font-black text-[#70409a]">
              📅 {formatearFecha(pedido.fechaEntrega)}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-bold text-gray-400">
              MÉTODO DE PAGO
            </p>

            <p className="mt-2 text-2xl font-black text-[#70409a]">
              {pedido.metodoPago === "tarjeta"
                ? "💳 Tarjeta / Transferencia"
                : "💵 Efectivo"}
            </p>

          </div>

        </div>

        {/* ESTADO */}
        <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 text-center">

          <div className="text-3xl">
            📦
          </div>

          <h3 className="mt-2 text-xl font-black text-green-700">
            Pedido registrado correctamente
          </h3>

          <p className="mt-1 text-sm text-green-700">
            Puedes conservar tu número de pedido para futuras consultas.
          </p>

        </div>

        {/* BOTONES */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

          <a
            href="/catalogo"
            className="rounded-full border-2 border-[#70409a] px-7 py-4 text-center font-bold text-[#70409a] hover:bg-purple-50"
          >
            Seguir comprando
          </a>

          <a
            href="/"
            className="rounded-full bg-[#ef4b91] px-7 py-4 text-center font-bold text-white shadow-md transition hover:bg-[#df3d82]"
          >
            Volver al inicio
          </a>

        </div>

      </section>

    </main>
  );
}