"use client";
import Link from "next/link";

import { useState } from "react";

const productos = [
  {
    id: 1,
    nombre: "Muñeca artesanal",
    modelo: "Modelo Lucy",
    categoria: "Muñecas",
    precioMenudeo: 350,
    precioMayoreo: 300,
    emoji: "👧🏻",
  },
  {
    id: 2,
    nombre: "Bebé artesanal",
    modelo: "Modelo Alex",
    categoria: "Bebés",
    precioMenudeo: 280,
    precioMayoreo: 240,
    emoji: "👶🏻",
  },
  {
    id: 3,
    nombre: "Muñeca con sonido",
    modelo: "Modelo Sofía",
    categoria: "Con sonido",
    precioMenudeo: 420,
    precioMayoreo: 360,
    emoji: "👧🏼",
  },
  {
    id: 4,
    nombre: "Bebé artesanal",
    modelo: "Modelo Emma",
    categoria: "Bebés",
    precioMenudeo: 300,
    precioMayoreo: 260,
    emoji: "👶🏼",
  },
];

const categorias = ["Todos", "Bebés", "Muñecas", "Con sonido"];

export default function Catalogo() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const [busqueda, setBusqueda] = useState("");

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaSeleccionada === "Todos" ||
      producto.categoria === categoriaSeleccionada;

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.modelo.toLowerCase().includes(busqueda.toLowerCase());

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
            href="/catalogo"
            className="rounded-full p-3 text-2xl transition hover:bg-pink-50"
            aria-label="Ver catálogo"
          >
            ☰
          </Link>

          {/* Carrito → Carrito */}
          <Link
            href="/carrito"
            className="rounded-full p-3 text-2xl transition hover:bg-pink-50"
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
          {categorias.map((categoria) => {
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
        {productosFiltrados.length === 0 ? (
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
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#ffe5f0] to-[#eadcf5] text-7xl">
                  {producto.emoji}
                </div>

                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#ef4b91]">
                    {producto.categoria}
                  </p>

                  <h3 className="mt-2 text-lg font-black text-[#70409a]">
                    {producto.nombre}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {producto.modelo}
                  </p>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Desde
                    </p>

                    <p className="text-2xl font-black text-[#ef4b91]">
                      ${producto.precioMenudeo}
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