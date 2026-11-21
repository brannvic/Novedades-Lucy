"use client";

// Restablecer contraseña (enlace que llega por correo desde Supabase)

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Estado = "verificando" | "formulario" | "error" | "hecho";

export default function RestablecerPage() {
  const [supabase] = useState(() => createClient());

  const [estado, setEstado] = useState<Estado>("verificando");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const busqueda = new URLSearchParams(window.location.search);

      if (hash.get("error_code") || busqueda.get("error_code")) {
        setEstado("error");
        return;
      }

      // 1) ¿Supabase ya abrió la sesión con el enlace?
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setEstado("formulario");
        return;
      }

      // 2) Enlace con tokens en el "#" (enviado desde el panel de Supabase)
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setEstado(error ? "error" : "formulario");
        return;
      }

      // 3) Enlace con ?code= (enviado desde "¿Olvidaste tu contraseña?")
      const codigo = busqueda.get("code");
      if (codigo) {
        const { error } = await supabase.auth.exchangeCodeForSession(codigo);
        setEstado(error ? "error" : "formulario");
        return;
      }

      setEstado("error");
    };

    verificar();
  }, [supabase]);

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");

    if (contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (contrasena !== confirmacion) {
      setError("Las dos contraseñas no son iguales.");
      return;
    }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: contrasena });
    setGuardando(false);

    if (error) {
      setError(
        error.message.includes("different")
          ? "Escribe una contraseña diferente a la anterior."
          : "No se pudo cambiar la contraseña. Intenta otra vez."
      );
      return;
    }

    const { data } = await supabase.rpc("es_admin");
    setEsAdmin(Boolean(data));
    window.history.replaceState(null, "", "/restablecer");
    setEstado("hecho");
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] px-5 py-10 text-[#4a2857]">
      <div className="mx-auto max-w-md">
        <p className="text-center text-6xl">🔑</p>
        <h1 className="mt-3 text-center text-3xl font-black text-[#70409a]">
          Nueva contraseña
        </h1>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          {estado === "verificando" && (
            <p className="text-center text-xl font-bold">Revisando el enlace...</p>
          )}

          {estado === "error" && (
            <div className="space-y-4 text-center">
              <p className="text-xl font-bold text-red-600">
                El enlace ya no sirve o ya se usó.
              </p>
              <p className="text-lg text-gray-600">
                Pide uno nuevo desde &quot;¿Olvidaste tu contraseña?&quot; y
                ábrelo en este mismo teléfono o computadora.
              </p>
              <Link
                href="/cuenta"
                className="block h-14 rounded-full bg-[#ef4b91] pt-3.5 text-xl font-bold text-white"
              >
                Pedir otro enlace
              </Link>
            </div>
          )}

          {estado === "formulario" && (
            <form onSubmit={guardar} className="space-y-5">
              <label className="block">
                <span className="text-xl font-bold">Contraseña nueva</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="mt-1 h-16 w-full rounded-2xl border-2 border-pink-200 px-4 text-xl"
                />
              </label>
              <label className="block">
                <span className="text-xl font-bold">Escríbela otra vez</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  className="mt-1 h-16 w-full rounded-2xl border-2 border-pink-200 px-4 text-xl"
                />
              </label>
              {error && (
                <p className="rounded-2xl bg-red-100 px-4 py-3 text-lg font-bold text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={guardando}
                className="h-16 w-full rounded-full bg-green-600 text-2xl font-black text-white disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "✓ Guardar contraseña"}
              </button>
            </form>
          )}

          {estado === "hecho" && (
            <div className="space-y-4 text-center">
              <p className="text-2xl font-black text-green-700">
                ✓ Contraseña cambiada
              </p>
              <p className="text-lg text-gray-600">
                Ya puedes entrar con tu contraseña nueva.
              </p>
              <Link
                href={esAdmin ? "/admin" : "/cuenta"}
                className="block h-16 rounded-full bg-[#ef4b91] pt-4 text-xl font-black text-white"
              >
                {esAdmin ? "💗 Ir al Panel de Lucy" : "Ir a mi cuenta"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
