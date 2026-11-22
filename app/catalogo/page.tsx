"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { CATEGORIAS, obtenerProductos, type Producto } from "@/lib/productos";


export default function Catalogo() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const [busqueda, setBusqueda] = useState("");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    obtenerProductos()
      .then(setProductos)
      .catch(() =>
        setErrorCarga("No pudimos cargar el catálogo. Intenta de nuevo más tarde.")
      )
      .finally(() => setCargando(false));
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaSeleccionada === "Todos" ||
      producto.categoria === categoriaSeleccionada;

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.modelo ?? "").toLowerCase().includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

return (
  <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">

    {/* HEADER */}
    <header className="border-b border-pink-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Ir al inicio"
        >
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

        {/* Menú y carrito */}
        <div className="flex items-center gap-2">

          {/* Menú → Catálogo */}
          <Link
            href="/menu"
            className="rounded-full p-3 text-2xl hover:bg-pink-50"
            aria-label="Abrir menú"
          >
            ☰
          </Link>

          {/* Carrito → Carrito */}
          <Link
            href="/carrito"
            className="rounded-full p-3 text-2xl hover:bg-pink-50"
            aria-label="Ver carrito"
          >
            🛒
          </Link>

        </div>
      </div>
    </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="font-bold text-[#ef4b91]">
            Novedades Lucy
          </p>

          <h2 className="mt-1 text-4xl font-black text-[#70409a]">
            Catálogo
          </h2>

          <p className="mt-2 text-gray-500">
            Encuentra el producto artesanal que estás buscando.
          </p>
        </div>

        {productos.some((p) => p.esTemporada) && (
          <div className="mb-5 rounded-2xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-bold text-[#70409a]">
            🎄 Temporada alta (octubre a enero): los precios incluyen +$20 por pieza.
            Mayoreo a partir de 3 piezas.
          </div>
        )}

        {/* BUSCADOR */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-5 py-4 outline-none transition focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* FILTROS */}
        <div className="mb-8 flex flex-wrap gap-3">
          {CATEGORIAS.map((categoria) => {
            const activa = categoriaSeleccionada === categoria;

            return (
              <button
                key={categoria}
                onClick={() => setCategoriaSeleccionada(categoria)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  activa
                    ? "bg-[#ef4b91] text-white shadow-md"
                    : "bg-white text-[#70409a] border border-pink-100 hover:bg-pink-50"
                }`}
              >
                {categoria}
              </button>
            );
          })}
        </div>

        {/* PRODUCTOS */}
        {cargando ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🧸</div>
            <p className="mt-4 font-bold text-[#70409a]">Cargando catálogo...</p>
          </div>
        ) : errorCarga ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">⚠️</div>
            <p className="mt-4 font-bold text-[#70409a]">{errorCarga}</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🔎</div>

            <h3 className="mt-4 text-xl font-bold text-[#70409a]">
              No encontramos productos
            </h3>

            <p className="mt-2 text-gray-500">
              Intenta con otra búsqueda o categoría.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productosFiltrados.map((producto) => (
              <article
                key={producto.id}
                className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* IMAGEN PROVISIONAL */}
                <div className={`relative flex h-56 items-center justify-center bg-gradient-to-br from-[#ffe5f0] to-[#eadcf5] text-7xl ${producto.disponible ? "" : "opacity-50 grayscale"}`}>
                  {producto.imagenUrl ? (
                    <img
                      src={producto.imagenUrl}
                      alt={producto.nombre}
                      loading="lazy"
                      className="h-full w-full bg-white object-contain p-2"
                    />
                  ) : (
                    producto.emoji
                  )}

                  {/* VISTA 360° (Capítulo 3) */}
                  {producto.fotos360 > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#70409a] px-3 py-1 text-xs font-bold text-white">
                      360°
                    </span>
                  )}

                  {/* DISPONIBILIDAD (Capítulo 2) */}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                      producto.estadoStock === "agotado"
                        ? "bg-gray-700 text-white"
                        : producto.estadoStock === "ultimas_piezas"
                        ? "bg-amber-400 text-[#4a2857]"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {producto.estadoStock === "agotado"
                      ? "Agotado"
                      : producto.estadoStock === "ultimas_piezas"
                      ? `¡Últimas ${producto.existencias}!`
                      : "Disponible"}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#ef4b91]">
                    {producto.categoria}
                  </p>

                  <h3 className="mt-2 text-lg font-black text-[#70409a]">
                    {producto.nombre}
                  </h3>

                  {producto.modelo && (
                    <p className="text-sm text-gray-500">
                      {producto.modelo}
                    </p>
                  )}

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Pieza: ${producto.precioMenudeo} · Mayoreo (3+): ${producto.precioMayoreo}
                    </p>

                    <p className="text-2xl font-black text-[#ef4b91]">
                      Desde ${producto.precioMayoreo}
                    </p>
                  </div>

                  <a
                    href={`/producto/${producto.id}`}
                    className="mt-4 block w-full rounded-full bg-[#ef4b91] px-4 py-3 text-center font-bold text-white transition hover:bg-[#df3d82]"
                >
                    Ver producto
                </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}