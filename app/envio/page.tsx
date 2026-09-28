"use client";

import { useState } from "react";

export default function EnvioPage() {
  const [formulario, setFormulario] = useState({
    nombre: "",
    telefono: "",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    codigoPostal: "",
  });

  const actualizarCampo = (
    campo: string,
    valor: string
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const continuar = () => {
    const datosLimpios = {
      nombre: formulario.nombre.trim(),
      telefono: formulario.telefono.trim(),
      calle: formulario.calle.trim(),
      numero: formulario.numero.trim(),
      colonia: formulario.colonia.trim(),
      ciudad: formulario.ciudad.trim(),
      codigoPostal: formulario.codigoPostal.trim(),
    };

    const hayCampoVacio = Object.values(datosLimpios).some(
      (campo) => campo === ""
    );

    if (hayCampoVacio) {
      alert("Por favor completa todos los campos para continuar.");
      return;
    }

    localStorage.setItem(
      "novedades-lucy-envio",
      JSON.stringify(datosLimpios)
    );

    window.location.href = "/fecha";
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
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
            Paso 1 de 3
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">

        {/* PROGRESO */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-[#ef4b91]">
              1. Envío
            </span>

            <span className="text-gray-400">
              2. Fecha
            </span>

            <span className="text-gray-400">
              3. Pago
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 rounded-full bg-[#ef4b91]" />
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">

          <div className="mb-8">
            <p className="font-bold text-[#ef4b91]">
              Información de entrega
            </p>

            <h2 className="mt-1 text-3xl font-black text-[#70409a]">
              ¿Dónde entregamos tu pedido?
            </h2>

            <p className="mt-2 text-gray-500">
              Completa todos los datos para continuar.
            </p>
          </div>

          <div className="space-y-5">

            {/* NOMBRE */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#70409a]">
                Nombre completo
              </label>

              <input
                type="text"
                required
                value={formulario.nombre}
                onChange={(e) =>
                  actualizarCampo("nombre", e.target.value)
                }
                placeholder="Ej. María López"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* TELEFONO */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#70409a]">
                Teléfono
              </label>

              <input
                type="tel"
                required
                value={formulario.telefono}
                onChange={(e) =>
                  actualizarCampo("telefono", e.target.value)
                }
                placeholder="Ej. 555 123 4567"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* CALLE Y NUMERO */}
            <div className="grid gap-5 sm:grid-cols-[1fr_150px]">

              <div>
                <label className="mb-2 block text-sm font-bold text-[#70409a]">
                  Calle
                </label>

                <input
                  type="text"
                  required
                  value={formulario.calle}
                  onChange={(e) =>
                    actualizarCampo("calle", e.target.value)
                  }
                  placeholder="Nombre de la calle"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#70409a]">
                  Número
                </label>

                <input
                  type="text"
                  required
                  value={formulario.numero}
                  onChange={(e) =>
                    actualizarCampo("numero", e.target.value)
                  }
                  placeholder="123"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
                />
              </div>

            </div>

            {/* COLONIA */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#70409a]">
                Colonia
              </label>

              <input
                type="text"
                required
                value={formulario.colonia}
                onChange={(e) =>
                  actualizarCampo("colonia", e.target.value)
                }
                placeholder="Nombre de la colonia"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* CIUDAD Y CP */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-bold text-[#70409a]">
                  Ciudad
                </label>

                <input
                  type="text"
                  required
                  value={formulario.ciudad}
                  onChange={(e) =>
                    actualizarCampo("ciudad", e.target.value)
                  }
                  placeholder="Ciudad"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#70409a]">
                  Código postal
                </label>

                <input
                  type="text"
                  required
                  value={formulario.codigoPostal}
                  onChange={(e) =>
                    actualizarCampo(
                      "codigoPostal",
                      e.target.value
                    )
                  }
                  placeholder="00000"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
                />
              </div>

            </div>

          </div>

          {/* BOTONES */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <a
              href="/carrito"
              className="flex-1 rounded-full border-2 border-[#70409a] px-6 py-4 text-center font-bold text-[#70409a] hover:bg-purple-50"
            >
              ← Volver al carrito
            </a>

            <button
              onClick={continuar}
              className="flex-1 rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#df3d82]"
            >
              Continuar →
            </button>

          </div>

        </div>
      </section>
    </main>
  );
}