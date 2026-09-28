"use client";

import { useState } from "react";

export default function FechaPage() {
  const [fecha, setFecha] = useState("");

  const hoy = new Date();

  const fechaMinima = hoy.toISOString().split("T")[0];

  const continuar = () => {
    if (!fecha) {
      alert("Selecciona una fecha de entrega.");
      return;
    }

    localStorage.setItem(
      "novedades-lucy-fecha",
      fecha
    );

    window.location.href = "/pago";
  };

  const formatearFecha = (fechaSeleccionada: string) => {
    if (!fechaSeleccionada) return "";

    const [year, month, day] =
      fechaSeleccionada.split("-");

    return `${day}/${month}/${year}`;
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="text-3xl">💗</div>

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
            Paso 2 de 3
          </span>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-3xl px-6 py-10">

        {/* PROGRESO */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-green-500">
              ✓ Envío
            </span>

            <span className="text-[#ef4b91]">
              2. Fecha
            </span>

            <span className="text-gray-400">
              3. Pago
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-2/3 rounded-full bg-[#ef4b91]" />
          </div>
        </div>

        {/* CALENDARIO */}
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">

          <div className="mb-8">
            <p className="font-bold text-[#ef4b91]">
              Entrega
            </p>

            <h2 className="mt-1 text-3xl font-black text-[#70409a]">
              Selecciona la fecha de entrega
            </h2>

            <p className="mt-2 text-gray-500">
              Elige el día en que deseas recibir tu pedido.
            </p>
          </div>

          {/* CALENDARIO */}
          <div className="rounded-3xl border border-pink-100 bg-[#fff7fb] p-6">

            <label
              htmlFor="fecha"
              className="mb-3 block text-sm font-bold text-[#70409a]"
            >
              Fecha de entrega
            </label>

            <input
              id="fecha"
              type="date"
              min={fechaMinima}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full cursor-pointer rounded-2xl border-2 border-pink-100 bg-white px-5 py-4 text-lg font-bold text-[#70409a] outline-none transition focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
            />

            {fecha && (
              <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50 p-5">
                <p className="text-sm text-gray-500">
                  Fecha seleccionada
                </p>

                <p className="mt-1 text-2xl font-black text-[#ef4b91]">
                  {formatearFecha(fecha)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Tu selección se guardará con el pedido.
                </p>
              </div>
            )}
          </div>

          {/* INFORMACIÓN */}
          <div className="mt-6 rounded-2xl bg-purple-50 p-4">
            <p className="font-bold text-[#70409a]">
              📦 Información de entrega
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Selecciona una fecha a partir de hoy. La fecha
              quedará asociada a tu pedido antes de confirmar
              el pago.
            </p>
          </div>

          {/* BOTONES */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <a
              href="/envio"
              className="flex-1 rounded-full border-2 border-[#70409a] px-6 py-4 text-center font-bold text-[#70409a] hover:bg-purple-50"
            >
              ← Volver
            </a>

            <button
              onClick={continuar}
              className="flex-1 rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#df3d82]"
            >
              Continuar al pago →
            </button>

          </div>

        </div>
      </section>
    </main>
  );
}