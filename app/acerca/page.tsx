import Link from "next/link";

export default function AcercaPage() {
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
            href="/"
            className="rounded-full px-5 py-2 font-bold text-[#70409a] hover:bg-pink-50"
          >
            🏠 Inicio
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-12">

          <div className="text-center">
            <div className="text-6xl">💗</div>

            <h2 className="mt-4 text-4xl font-black text-[#6d3b91]">
              Acerca de nosotros
            </h2>

            <p className="mt-3 text-lg text-[#684d70]">
              Novedades Lucy
            </p>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mt-10">
            <h3 className="text-2xl font-black text-[#70409a]">
              ¿Quiénes somos?
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Novedades Lucy es una tienda dedicada a la venta de muñecas,
              bebés y productos artesanales. Nuestra propuesta busca facilitar
              el proceso de consulta y realización de pedidos mediante una
              experiencia digital sencilla.
            </p>
          </div>

          {/* UBICACIÓN */}
          <div className="mt-8 rounded-3xl bg-[#fff7fb] p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📍</div>

              <div>
                <h3 className="font-black text-[#70409a]">
                  Nuestra ubicación
                </h3>

                <p className="mt-2 leading-6 text-gray-600">
                  Girón 33, Centro Histórico de la Cdad. de México,
                  Centro, Cuauhtémoc, 06020 Ciudad de México, CDMX
                </p>
              </div>
            </div>
          </div>

          {/* COMPRA */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-pink-100 p-5">
              <div className="text-3xl">🧸</div>
              <h3 className="mt-3 font-bold text-[#70409a]">
                Productos
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Muñecas y bebés artesanales para diferentes ocasiones.
              </p>
            </div>

            <div className="rounded-3xl border border-pink-100 p-5">
              <div className="text-3xl">🛒</div>
              <h3 className="mt-3 font-bold text-[#70409a]">
                Pedidos
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Selecciona tus productos y realiza tu pedido de manera
                sencilla.
              </p>
            </div>

            <div className="rounded-3xl border border-pink-100 p-5">
              <div className="text-3xl">📦</div>
              <h3 className="mt-3 font-bold text-[#70409a]">
                Entrega
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Puedes seleccionar envío o recoger tu pedido de manera
                presencial.
              </p>
            </div>
          </div>

          {/* REGRESAR */}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-[#ef4b91] px-7 py-3 font-bold text-white shadow-md transition hover:bg-[#df3d82]"
            >
              ← Regresar al inicio
            </Link>
          </div>

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