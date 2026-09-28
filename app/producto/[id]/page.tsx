"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const productos = [
  {
    id: 1,
    nombre: "Muñeca artesanal",
    modelo: "Modelo Lucy",
    categoria: "Muñecas",
    precioMenudeo: 350,
    precioMayoreo: 300,
    emoji: "👧🏻",
    descripcion:
      "Muñeca artesanal elaborada para acompañar diferentes ocasiones. Disponible para compra individual o por mayoreo.",
  },
  {
    id: 2,
    nombre: "Bebé artesanal",
    modelo: "Modelo Alex",
    categoria: "Bebés",
    precioMenudeo: 280,
    precioMayoreo: 240,
    emoji: "👶🏻",
    descripcion:
      "Bebé artesanal pensado para regalos y ocasiones especiales.",
  },
  {
    id: 3,
    nombre: "Muñeca con sonido",
    modelo: "Modelo Sofía",
    categoria: "Con sonido",
    precioMenudeo: 420,
    precioMayoreo: 360,
    emoji: "👧🏼",
    descripcion:
      "Muñeca artesanal con función de sonido para una experiencia diferente.",
  },
  {
    id: 4,
    nombre: "Bebé artesanal",
    modelo: "Modelo Emma",
    categoria: "Bebés",
    precioMenudeo: 300,
    precioMayoreo: 260,
    emoji: "👶🏼",
    descripcion:
      "Bebé artesanal disponible para compra individual y pedidos por volumen.",
  },
];

export default function ProductoPage() {
  const params = useParams();

  const id = Number(params.id);

  const producto = productos.find((p) => p.id === id);

  const [cantidad, setCantidad] = useState(1);

  if (!producto) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
        <div className="rounded-3xl bg-white p-10 text-center shadow-md">
          <div className="text-5xl">🔎</div>

          <h1 className="mt-4 text-2xl font-black text-[#70409a]">
            Producto no encontrado
          </h1>

          <a
            href="/catalogo"
            className="mt-6 inline-block rounded-full bg-[#ef4b91] px-6 py-3 font-bold text-white"
          >
            Volver al catálogo
          </a>
        </div>
      </main>
    );
  }

  const esMayoreo = cantidad >= 3;

  const precioUnitario = esMayoreo
    ? producto.precioMayoreo
    : producto.precioMenudeo;

  const subtotal = cantidad * precioUnitario;

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

          <div className="flex items-center gap-2">
            <a
              href="/catalogo"
              className="rounded-full px-4 py-2 text-sm font-bold text-[#70409a] hover:bg-pink-50"
            >
              ← Catálogo
            </a>

            <button className="rounded-full p-3 text-2xl hover:bg-pink-50">
              🛒
            </button>
          </div>
        </div>
      </header>

      {/* PRODUCTO */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-500">
          Catálogo / {producto.categoria} / {producto.nombre}
        </div>

        <div className="grid gap-8 rounded-[2rem] bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
          {/* IMAGEN */}
          <div className="flex min-h-[400px] items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#ffe1ef] to-[#eadcf5]">
            <span className="text-[10rem]">
              {producto.emoji}
            </span>
          </div>

          {/* INFORMACIÓN */}
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-pink-50 px-4 py-2 text-sm font-bold text-[#ef4b91]">
              {producto.categoria}
            </span>

            <h2 className="mt-4 text-4xl font-black text-[#70409a]">
              {producto.nombre}
            </h2>

            <p className="mt-1 text-lg text-gray-500">
              {producto.modelo}
            </p>

            <p className="mt-6 leading-7 text-gray-600">
              {producto.descripcion}
            </p>

            {/* PRECIOS */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-pink-100 p-4">
                <p className="text-sm text-gray-500">
                  Precio menudeo
                </p>

                <p className="mt-1 text-2xl font-black text-[#ef4b91]">
                  ${producto.precioMenudeo}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 transition ${
                  esMayoreo
                    ? "border-[#ef4b91] bg-pink-50"
                    : "border-purple-100"
                }`}
              >
                <p className="text-sm text-gray-500">
                  Precio mayoreo
                </p>

                <p className="mt-1 text-2xl font-black text-[#70409a]">
                  ${producto.precioMayoreo}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Desde 3 piezas
                </p>
              </div>
            </div>

            {/* CANTIDAD */}
            <div className="mt-8">
              <p className="mb-3 font-bold text-[#70409a]">
                Cantidad
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setCantidad((actual) =>
                      Math.max(1, actual - 1)
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-200 bg-white text-xl font-bold hover:bg-pink-50"
                >
                  −
                </button>

                <span className="flex h-11 min-w-14 items-center justify-center rounded-xl bg-pink-50 px-4 text-lg font-black text-[#70409a]">
                  {cantidad}
                </span>

                <button
                  onClick={() =>
                    setCantidad((actual) => actual + 1)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-200 bg-white text-xl font-bold hover:bg-pink-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* ESTADO MAYOREO */}
            {esMayoreo && (
              <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50 p-4">
                <p className="font-black text-[#ef4b91]">
                  🏷️ Precio de mayoreo aplicado
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Por comprar {cantidad} piezas se aplica el
                  precio de mayoreo de ${producto.precioMayoreo}
                  por pieza.
                </p>
              </div>
            )}

            {/* TOTAL */}
            <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
              <div>
                <p className="text-sm text-gray-500">
                  Subtotal
                </p>

                <p className="text-3xl font-black text-[#70409a]">
                  ${subtotal}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                {cantidad} pieza{cantidad !== 1 ? "s" : ""}
              </p>
            </div>

            {/* BOTONES */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#df3d82] hover:shadow-lg">
                🛒 Agregar al carrito
              </button>

              <button className="rounded-full border-2 border-[#70409a] px-6 py-4 font-bold text-[#70409a] transition hover:bg-purple-50">
                📄 Cotizar
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}