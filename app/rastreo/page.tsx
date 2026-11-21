"use client";

// Capítulo 8: rastreo de envíos. Redirige al cliente a la página oficial
// de rastreo de Estafeta, FedEx o DHL con su número de guía.

import Link from "next/link";
import { useState } from "react";
import {
  PAQUETERIAS,
  urlRastreo,
  type ClavePaqueteria,
} from "@/lib/paqueterias";

export default function RastreoPage() {
  const [paqueteria, setPaqueteria] = useState<ClavePaqueteria>("estafeta");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState("");

  const ayuda = PAQUETERIAS.find((p) => p.clave === paqueteria)?.ayuda;

  const rastrear = (evento: React.FormEvent) => {
    evento.preventDefault();
    const url = urlRastreo(paqueteria, numero);

    if (!url) {
      setError("Escribe tu número de guía.");
      return;
    }

    setError("");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-3xl">💗</div>
            <div className="leading-none">
              <p className="text-sm font-bold text-[#70409a]">Novedades</p>
              <h1 className="text-2xl font-black text-[#ef4b91]">Lucy</h1>
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

      <section className="mx-auto max-w-xl px-6 py-12">
        <p className="text-4xl">🚚</p>
        <h2 className="mt-3 text-3xl font-black text-[#70409a]">
          Rastrear mi envío
        </h2>
        <p className="mt-2 text-gray-500">
          Elige la paquetería y escribe tu número de guía. Te llevaremos a la
          página oficial de rastreo.
        </p>

        <form
          onSubmit={rastrear}
          className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm"
        >
          <p className="mb-3 font-bold text-[#70409a]">Paquetería</p>
          <div className="grid grid-cols-3 gap-3">
            {PAQUETERIAS.map((p) => (
              <button
                key={p.clave}
                type="button"
                onClick={() => setPaqueteria(p.clave)}
                className={`rounded-2xl border-2 px-3 py-4 font-black transition ${
                  paqueteria === p.clave
                    ? "border-[#ef4b91] bg-pink-50 text-[#ef4b91]"
                    : "border-pink-100 text-[#70409a] hover:bg-pink-50"
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="mb-1 block font-bold text-[#70409a]">
              Número de guía
            </span>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
            />
            <span className="mt-1 block text-xs text-gray-500">{ayuda}</span>
          </label>

          {error && (
            <p className="mt-3 text-sm font-bold text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md hover:bg-[#df3d82]"
          >
            Rastrear envío →
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes tu guía? Consúltala en{" "}
          <Link href="/pedidos" className="font-bold text-[#ef4b91]">
            Mis pedidos
          </Link>
          . Lucy también te la envía por WhatsApp.
        </p>
      </section>
    </main>
  );
}
