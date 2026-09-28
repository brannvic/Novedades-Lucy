"use client";

import { useState } from "react";
import Link from "next/link";

export default function CancelarPage() {
  const [pedido, setPedido] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const puedeCancelar = pedido !== "" && motivo !== "";

  function cancelarPedido() {
    if (!puedeCancelar) return;

    setConfirmado(true);
  }

  if (confirmado) {
    return (
      <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
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
          </div>
        </header>

        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-12">
            <div className="text-6xl">✅</div>

            <h2 className="mt-5 text-3xl font-black text-[#6d3b91]">
              Solicitud de cancelación registrada
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Hemos recibido tu solicitud para cancelar el pedido{" "}
              <strong>{pedido}</strong>.
            </p>

            <div className="mt-6 rounded-2xl bg-[#fff7fb] p-5 text-left">
              <p className="text-sm font-bold text-[#70409a]">
                Motivo seleccionado
              </p>

              <p className="mt-2 text-gray-600">
                {motivo}
              </p>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              La solicitud quedará registrada para su revisión.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/pedidos"
                className="rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white hover:bg-[#df3d82]"
              >
                📦 Ver mis pedidos
              </Link>

              <Link
                href="/"
                className="rounded-full border border-pink-200 px-7 py-3 font-bold text-[#70409a] hover:bg-pink-50"
              >
                🏠 Inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
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
            href="/pedidos"
            className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50"
          >
            📦 Mis pedidos
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <div className="text-center">
            <div className="text-5xl">❌</div>

            <h2 className="mt-4 text-3xl font-black text-[#6d3b91]">
              Cancelar pedido
            </h2>

            <p className="mt-3 leading-6 text-gray-500">
              Selecciona el pedido que deseas cancelar e indica el motivo.
            </p>
          </div>

          {/* PEDIDO */}
          <div className="mt-10">
            <label className="font-bold text-[#70409a]">
              Selecciona tu pedido
            </label>

            <select
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 outline-none focus:border-[#ef4b91]"
            >
              <option value="">
                Selecciona un pedido
              </option>

              <option value="NL-001">
                Pedido #NL-001 — $850
              </option>

              <option value="NL-002">
                Pedido #NL-002 — $1,250
              </option>

              <option value="NL-003">
                Pedido #NL-003 — $650
              </option>
            </select>
          </div>

          {/* MOTIVO */}
          <div className="mt-6">
            <label className="font-bold text-[#70409a]">
              Motivo de cancelación
            </label>

            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 outline-none focus:border-[#ef4b91]"
            >
              <option value="">
                Selecciona un motivo
              </option>

              <option value="Ya no deseo realizar la compra">
                Ya no deseo realizar la compra
              </option>

              <option value="Realicé el pedido por error">
                Realicé el pedido por error
              </option>

              <option value="Necesito modificar mi pedido">
                Necesito modificar mi pedido
              </option>

              <option value="Otro motivo">
                Otro motivo
              </option>
            </select>
          </div>

          {/* AVISO */}
          <div className="mt-6 rounded-2xl bg-[#fff7fb] p-5">
            <p className="text-sm leading-6 text-gray-600">
              ⚠️ La cancelación estará sujeta al estado actual del pedido.
              Si el pedido ya fue enviado, podría ser necesario solicitar una
              devolución.
            </p>
          </div>

          {/* BOTÓN */}
          <button
            onClick={cancelarPedido}
            disabled={!puedeCancelar}
            className={`mt-8 w-full rounded-full px-6 py-4 font-bold text-white transition ${
              puedeCancelar
                ? "bg-[#ef4b91] hover:bg-[#df3d82]"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            ❌ Confirmar cancelación
          </button>

          <Link
            href="/pedidos"
            className="mt-4 block text-center font-bold text-[#70409a] hover:underline"
          >
            ← Regresar a mis pedidos
          </Link>
        </div>
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