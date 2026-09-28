"use client";
import Link from "next/link";

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">

      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link href="/" className="flex items-center gap-2">
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
          </Link>

          <Link
            href="/"
            className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50"
          >
            ✕ Cerrar
          </Link>

        </div>
      </header>

      {/* MENÚ */}
      <section className="mx-auto max-w-xl px-6 py-10">

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">

          <h2 className="mb-6 text-2xl font-black text-[#6d3b91]">
            Menú
          </h2>

          {/* PRINCIPAL */}

          <div className="space-y-2">

            <Link
              href="/"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">🏠</span>
              <span>Inicio</span>
            </Link>

            <Link
              href="/catalogo"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">🛍️</span>
              <span>Catálogo</span>
            </Link>

            <Link
              href="/cotizaciones"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">🧾</span>
              <span>Mis cotizaciones</span>
            </Link>

            <Link
              href="/carrito"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">🛒</span>
              <span>Mi carrito</span>
            </Link>

            <Link
              href="/pedidos"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">📦</span>
              <span>Mis pedidos</span>
            </Link>

          </div>

          {/* SEPARADOR */}

          <div className="my-6 border-t border-pink-100" />

          {/* GESTIÓN DE PEDIDOS */}

          <div className="space-y-2">

            <Link
              href="/cancelar"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">❌</span>
              <span>Cancelar pedido</span>
            </Link>

            <Link
              href="/devolucion"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
            >
              <span className="text-2xl">↩️</span>
              <span>Solicitar devolución</span>
            </Link>

          </div>

          {/* SEPARADOR */}

          <div className="my-6 border-t border-pink-100" />

          {/* INFORMACIÓN */}

          <Link
            href="/acerca"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition hover:bg-pink-50"
          >
            <span className="text-2xl">ℹ️</span>
            <span>Acerca de nosotros</span>
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