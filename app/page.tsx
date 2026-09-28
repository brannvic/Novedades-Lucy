import Link from "next/link";

const categorias = [
  {
    icono: "👶",
    nombre: "Bebés",
  },
  {
    icono: "👧",
    nombre: "Muñecas",
  },
  {
    icono: "🔊",
    nombre: "Con sonido",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">

      {/* HEADER */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-3xl">💗</div>

            <div className="leading-none">
              <p className="text-sm font-bold text-[#70409a]">
                Novedades
              </p>

              <h1 className="text-2xl font-black tracking-tight text-[#ef4b91]">
                Lucy
              </h1>
            </div>
          </Link>
            
            {/* Menú y carrito */}
            <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => window.location.assign("/catalogo")}
              className="rounded-full p-3 text-2xl transition hover:bg-pink-50 cursor-pointer"
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/carrito")}
              className="rounded-full p-3 text-2xl transition hover:bg-pink-50 cursor-pointer"
              aria-label="Ver carrito"
            >
              🛒
            </button>

          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">

        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ffe1ef] via-[#ffd4e8] to-[#ead7f7] shadow-sm">

          <div className="grid items-center gap-8 px-7 py-10 md:grid-cols-2 md:px-12 md:py-14">

            {/* Texto */}
            <div>

              <span className="inline-block rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[#70409a]">
                ✨ Tienda de muñecos artesanales
              </span>

              <h2 className="mt-5 text-4xl font-black leading-tight text-[#6d3b91] md:text-5xl">
                Muñecas artesanales
                <br />
                <span className="text-[#ef4b91]">
                  para cada ocasión
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-[#684d70] md:text-lg">
                Descubre nuestra colección de muñecas y bebés artesanales,
                selecciona tus productos y realiza tu pedido de manera
                sencilla.
              </p>

              <Link
                href="/catalogo"
                className="mt-7 inline-block rounded-full bg-[#ef4b91] px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#df3d82] hover:shadow-lg"
              >
                Ver catálogo →
              </Link>

            </div>

            {/* Ilustración */}
            <div className="flex justify-center">

              <div className="flex h-64 w-full max-w-md items-center justify-center rounded-[2rem] bg-white/60 text-8xl shadow-inner md:h-80">
                🧸 🎀 🧸
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-6xl px-6 pb-12">

        <div className="grid grid-cols-3 gap-4 md:max-w-xl md:gap-6">

          {categorias.map((categoria) => (

            <Link
              key={categoria.nombre}
              href="/catalogo"
              className="group flex flex-col items-center rounded-3xl border border-pink-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <span className="text-4xl transition group-hover:scale-110">
                {categoria.icono}
              </span>

              <span className="mt-3 text-sm font-bold text-[#70409a] md:text-base">
                {categoria.nombre}
              </span>

            </Link>

          ))}

        </div>

      </section>

      {/* INFORMACIÓN */}
      <section className="mx-auto max-w-6xl px-6 pb-16">

        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

          <div className="grid gap-6 md:grid-cols-3">

            <div>
              <p className="text-2xl">🎀</p>

              <h3 className="mt-2 font-bold text-[#70409a]">
                Productos artesanales
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Muñecas y bebés para diferentes ocasiones.
              </p>
            </div>

            <div>
              <p className="text-2xl">📦</p>

              <h3 className="mt-2 font-bold text-[#70409a]">
                Compra sencilla
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Consulta productos, cantidades y cotizaciones.
              </p>
            </div>

            <div>
              <p className="text-2xl">💗</p>

              <h3 className="mt-2 font-bold text-[#70409a]">
                Novedades Lucy
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Una experiencia digital para facilitar tus pedidos.
              </p>
            </div>

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