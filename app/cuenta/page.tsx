"use client";

// Capítulo 6: inicio de sesión y creación de cuenta (Supabase Auth)

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type Modo = "entrar" | "registro";

type Perfil = {
  nombre: string | null;
  telefono: string | null;
};

function traducirError(mensaje: string) {
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("already registered")) {
    return "Ese correo ya tiene una cuenta. Inicia sesión.";
  }
  if (mensaje.includes("Email not confirmed")) {
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
  }
  if (mensaje.toLowerCase().includes("password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  return "Ocurrió un error. Intenta de nuevo.";
}

export default function CuentaPage() {
  const [supabase] = useState(() => createClient());

  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [modo, setModo] = useState<Modo>("entrar");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    contrasena: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
      setCargando(false);
    });

    const { data: suscripcion } = supabase.auth.onAuthStateChange(
      (_evento, sesion) => {
        setUsuario(sesion?.user ?? null);
      }
    );

    return () => suscripcion.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    supabase
      .from("perfiles")
      .select("nombre, telefono")
      .eq("id", usuario.id)
      .maybeSingle()
      .then(({ data }) => setPerfil(data));

    supabase.rpc("es_admin").then(({ data }) => setEsAdmin(Boolean(data)));
  }, [supabase, usuario]);

  const actualizarCampo = (campo: string, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");
    setMensaje("");

    const correo = formulario.correo.trim();
    const contrasena = formulario.contrasena;

    if (!correo || !contrasena) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }

    setEnviando(true);

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      setEnviando(false);

      if (error) {
        setError(traducirError(error.message));
      }
      return;
    }

    if (!formulario.nombre.trim() || !formulario.telefono.trim()) {
      setEnviando(false);
      setError("Escribe tu nombre y tu teléfono.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: {
          nombre: formulario.nombre.trim(),
          telefono: formulario.telefono.trim(),
        },
        emailRedirectTo: `${window.location.origin}/cuenta`,
      },
    });

    setEnviando(false);

    if (error) {
      setError(traducirError(error.message));
      return;
    }

    if (!data.session) {
      setMensaje(
        "¡Cuenta creada! Te enviamos un correo para confirmarla. Después inicia sesión aquí."
      );
      setModo("entrar");
    }
  };

  const olvideContrasena = async () => {
    setError("");
    setMensaje("");
    const correo = formulario.correo.trim();
    if (!correo) {
      setError("Escribe tu correo arriba y vuelve a tocar \"¿Olvidaste tu contraseña?\".");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    if (error) {
      setError("No pudimos enviar el correo. Espera un momento e intenta otra vez.");
      return;
    }
    setMensaje(
      "Te enviamos un correo con un enlace para cambiar tu contraseña. Ábrelo en este mismo teléfono o computadora."
    );
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      {/* HEADER */}
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

      <section className="mx-auto max-w-md px-6 py-12">
        {cargando ? (
          <p className="text-center font-bold text-[#70409a]">Cargando...</p>
        ) : usuario ? (
          /* ---------- CON SESIÓN ---------- */
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <p className="text-5xl">👋</p>

            <h2 className="mt-3 text-3xl font-black text-[#70409a]">
              Hola{perfil?.nombre ? `, ${perfil.nombre}` : ""}
            </h2>

            <div className="mt-6 space-y-2 rounded-2xl bg-pink-50 p-5 text-sm">
              <p>
                <span className="font-bold">Correo:</span> {usuario.email}
              </p>
              {perfil?.telefono && (
                <p>
                  <span className="font-bold">Teléfono:</span>{" "}
                  {perfil.telefono}
                </p>
              )}
            </div>

            <p className="mt-5 text-sm text-gray-500">
              Los pedidos que hagas con tu sesión iniciada aparecerán en
              &quot;Mis pedidos&quot; para que sigas su estado.
            </p>

            <div className="mt-6 grid gap-3">
              {esAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full bg-[#70409a] px-6 py-4 text-center text-lg font-black text-white shadow-md"
                >
                  💗 Abrir Panel de Lucy
                </Link>
              )}

              <Link
                href="/pedidos"
                className="rounded-full bg-[#ef4b91] px-6 py-4 text-center font-bold text-white shadow-md hover:bg-[#df3d82]"
              >
                📦 Ver mis pedidos
              </Link>

              <Link
                href="/catalogo"
                className="rounded-full border-2 border-[#70409a] px-6 py-4 text-center font-bold text-[#70409a] hover:bg-purple-50"
              >
                🛍️ Ir al catálogo
              </Link>

              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-full px-6 py-3 font-bold text-gray-500 hover:bg-gray-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          /* ---------- SIN SESIÓN ---------- */
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black text-[#70409a]">Mi cuenta</h2>

            <p className="mt-2 text-gray-500">
              Inicia sesión para dar seguimiento a tus compras.
            </p>

            {/* PESTAÑAS */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-pink-50 p-1">
              {(["entrar", "registro"] as Modo[]).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    setModo(opcion);
                    setError("");
                  }}
                  className={`rounded-full py-2.5 text-sm font-bold transition ${
                    modo === opcion
                      ? "bg-[#ef4b91] text-white shadow"
                      : "text-[#70409a]"
                  }`}
                >
                  {opcion === "entrar" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>

            <form onSubmit={enviar} className="mt-6 space-y-4">
              {modo === "registro" && (
                <>
                  <Campo
                    etiqueta="Nombre"
                    valor={formulario.nombre}
                    onChange={(v) => actualizarCampo("nombre", v)}
                    autoComplete="name"
                  />
                  <Campo
                    etiqueta="Teléfono (WhatsApp)"
                    tipo="tel"
                    valor={formulario.telefono}
                    onChange={(v) => actualizarCampo("telefono", v)}
                    autoComplete="tel"
                  />
                </>
              )}

              <Campo
                etiqueta="Correo electrónico"
                tipo="email"
                valor={formulario.correo}
                onChange={(v) => actualizarCampo("correo", v)}
                autoComplete="email"
              />

              <Campo
                etiqueta="Contraseña"
                tipo="password"
                valor={formulario.contrasena}
                onChange={(v) => actualizarCampo("contrasena", v)}
                autoComplete={
                  modo === "entrar" ? "current-password" : "new-password"
                }
              />

              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </p>
              )}

              {mensaje && (
                <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  {mensaje}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-[#ef4b91] px-6 py-4 font-bold text-white shadow-md transition hover:bg-[#df3d82] disabled:cursor-wait disabled:opacity-60"
              >
                {enviando
                  ? "Un momento..."
                  : modo === "entrar"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
              </button>
            </form>

            {modo === "entrar" && (
              <button
                type="button"
                onClick={olvideContrasena}
                className="mt-4 block w-full text-center text-sm font-bold text-[#70409a] underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              ¿Compraste sin cuenta?{" "}
              <Link href="/pedidos" className="font-bold text-[#ef4b91]">
                Consulta tu pedido con tu folio
              </Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = "text",
  autoComplete,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#70409a]">
        {etiqueta}
      </span>
      <input
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none transition focus:border-[#ef4b91] focus:ring-2 focus:ring-pink-100"
      />
    </label>
  );
}
