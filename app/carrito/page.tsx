"use client";

import { useEffect, useState } from "react";

type ProductoCarrito = {
  id: number;
  nombre: string;
  modelo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  emoji: string;
};

export default function CarritoPage() {
  const [producto, setProducto] = useState<ProductoCarrito | null>(null);

  useEffect(() => {
    const carritoGuardado = localStorage.getItem("novedades-lucy-carrito");

    if (carritoGuardado) {
      setProducto(JSON.parse(carritoGuardado));
    }
  }, []);

  const eliminarProducto = () => {
    localStorage.removeItem("novedades-lucy-carrito");
    setProducto(null);
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

          <a
            href="/catalogo"
            className="rounded-full px-4 py-2 text-sm font-bold text-[#70409a] hover:bg-pink-50"
          >
            ← Seguir comprando
          </a>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="font-bold text-[#ef4b91]">
            Tu pedido
          </p>

          <h2 className="mt-1 text-4xl font-black text-[#70409a]">
            Carrito
          </h2>
        </div>

        {!producto ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">🛒</div>

            <h3 className="mt-5 text-2xl font-black text-[#70409a]">
              Tu carrito está vacío
            </h3>

            <p className="mt-2 text-gray-500">
              Agrega un producto desde nuestro catálogo.
            </p>

            <a
              href="/catalogo"
              className="mt-6 inline-block rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white"
            >
              Ver catálogo
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_350px]">
            {/* PRODUCTO */}
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe1ef] to-[#eadcf5] text-6xl">
                  {producto.emoji}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-[#ef4b91]">
                    Producto
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#70409a]">
                    {producto.nombre}
                  </h3>

                  <p className="text-gray-500">
                    {producto.modelo}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span className="rounded-full bg-pink-50 px-4 py-2 font-bold text-[#70409a]">
                      Cantidad: {producto.cantidad}
                    </span>

                    <span className="rounded-full bg-purple-50 px-4 py-2 font-bold text-[#70409a]">
                      ${producto.precioUnitario} por pieza
                    </span>
                  </div>
                </div>

                <button
                  onClick={eliminarProducto}
                  className="rounded-full px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>

              {producto.cantidad >= 3 && (
                <div className="mt-6 rounded-2xl border border-pink-200 bg-pink-50 p-4">
                  <p className="font-black text-[#ef4b91]">
                    🏷️ Precio de mayoreo aplicado
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Tu pedido cumple con la cantidad mínima
                    para precio de mayoreo.
                  </p>
                </div>
              )}
            </div>

            {/* RESUMEN */}
            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-[#70409a]">
                Resumen del pedido
              </h3>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Producto
                  </span>

                  <span className="font-bold">
                    {producto.nombre}
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

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-bold">
                    ${producto.subtotal}
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

              <a
                href="/envio"
                className="mt-7 block rounded-full bg-[#ef4b91] px-6 py-4 text-center font-bold text-white shadow-md transition hover:bg-[#df3d82]"
              >
                Continuar pedido →
              </a>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}