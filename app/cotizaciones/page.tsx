"use client";

import { useState } from "react";
import Link from "next/link";

export default function CotizacionesPage() {
  const [cotizacionSeleccionada, setCotizacionSeleccionada] =
    useState(false);

  const [estado, setEstado] = useState("Pendiente");

  function aceptarCotizacion() {
    setEstado("Aceptada");
  }

  function rechazarCotizacion() {
    setEstado("Rechazada");
  }

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

        {!cotizacionSeleccionada ? (
          <>
            {/* TÍTULO */}
            <div className="mb-8">
              <p className="text-4xl">🧾</p>

              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">
                Mis cotizaciones
              </h2>

              <p className="mt-2 text-gray-500">
                Consulta las cotizaciones que has solicitado.
              </p>
            </div>

            {/* COTIZACIÓN */}
            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div>
                  <p className="text-sm font-bold text-[#70409a]">
                    Cotización
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#6d3b91]">
                    #COT-001
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    2 productos
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="text-2xl font-black text-[#ef4b91]">
                    $850
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-yellow-50 px-4 py-1 text-sm font-bold text-yellow-700">
                    {estado}
                  </span>
                </div>

              </div>

              <div className="my-6 border-t border-pink-100" />

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-2xl bg-[#fff7fb] p-4">
                  <p className="text-sm text-gray-500">
                    Fecha de solicitud
                  </p>

                  <p className="mt-1 font-bold text-[#70409a]">
                    28/09/2026
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff7fb] p-4">
                  <p className="text-sm text-gray-500">
                    Vigencia
                  </p>

                  <p className="mt-1 font-bold text-[#70409a]">
                    30/09/2026
                  </p>
                </div>

              </div>

              <button
                onClick={() => setCotizacionSeleccionada(true)}
                className="mt-6 w-full rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white transition hover:bg-[#df3d82]"
              >
                Ver cotización
              </button>

            </div>
          </>
        ) : (
          <>
            {/* DETALLE */}
            <div className="mb-8">
              <button
                onClick={() => setCotizacionSeleccionada(false)}
                className="font-bold text-[#70409a] hover:underline"
              >
                ← Regresar a mis cotizaciones
              </button>

              <p className="mt-6 text-4xl">🧾</p>

              <h2 className="mt-3 text-3xl font-black text-[#6d3b91]">
                Cotización #COT-001
              </h2>

              <p className="mt-2 text-gray-500">
                Detalle de la cotización solicitada.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">

              {/* PRODUCTOS */}
              <h3 className="text-xl font-black text-[#70409a]">
                Productos
              </h3>

              <div className="mt-5 space-y-4">

                <div className="flex items-center justify-between rounded-2xl bg-[#fff7fb] p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🧸</span>

                    <div>
                      <p className="font-bold">
                        Bebé artesanal
                      </p>

                      <p className="text-sm text-gray-500">
                        Cantidad: 1
                      </p>
                    </div>
                  </div>

                  <p className="font-black text-[#70409a]">
                    $500
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#fff7fb] p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">👧</span>

                    <div>
                      <p className="font-bold">
                        Muñeca artesanal
                      </p>

                      <p className="text-sm text-gray-500">
                        Cantidad: 1
                      </p>
                    </div>
                  </div>

                  <p className="font-black text-[#70409a]">
                    $350
                  </p>
                </div>

              </div>

              {/* TOTAL */}
              <div className="my-7 border-t border-pink-100" />

              <div className="flex items-center justify-between">
                <p className="text-xl font-black text-[#6d3b91]">
                  Total
                </p>

                <p className="text-3xl font-black text-[#ef4b91]">
                  $850
                </p>
              </div>

              {/* VIGENCIA */}
              <div className="mt-6 rounded-2xl bg-purple-50 p-5">
                <p className="font-bold text-[#70409a]">
                  📅 Vigencia de la cotización
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Esta cotización es válida hasta el 30/09/2026.
                </p>
              </div>

              {/* ESTADO */}
              {estado !== "Pendiente" && (
                <div className="mt-6 rounded-2xl bg-green-50 p-5">
                  <p className="font-bold text-green-700">
                    {estado === "Aceptada"
                      ? "✅ Cotización aceptada"
                      : "❌ Cotización rechazada"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {estado === "Aceptada"
                      ? "Puedes continuar con el proceso de pedido."
                      : "La cotización ha sido marcada como rechazada."}
                  </p>
                </div>
              )}

              {/* ACCIONES */}
              {estado === "Pendiente" && (
                <div className="mt-8 grid gap-3 md:grid-cols-2">

                  <button
                    onClick={aceptarCotizacion}
                    className="rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white transition hover:bg-[#df3d82]"
                  >
                    ✅ Aceptar cotización
                  </button>

                  <button
                    onClick={rechazarCotizacion}
                    className="rounded-full border border-pink-200 px-6 py-4 font-bold text-[#70409a] transition hover:bg-pink-50"
                  >
                    ❌ Rechazar cotización
                  </button>

                </div>
              )}

              {/* CONTINUAR PEDIDO */}
              {estado === "Aceptada" && (
                <Link
                  href="/carrito"
                  className="mt-4 block w-full rounded-full bg-[#70409a] px-6 py-4 text-center font-bold text-white transition hover:bg-[#5f3383]"
                >
                  🛒 Continuar con mi pedido
                </Link>
              )}

            </div>
          </>
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