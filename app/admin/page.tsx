"use client";

// =====================================================================
//  Panel de Lucy (/admin)
//  Pensado para usarse desde el celular: letras grandes, botones grandes.
//  Solo entra quien tenga perfiles.es_admin = true.
// =====================================================================

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import Vender from "./_componentes/Vender";
import Inventario from "./_componentes/Inventario";
import Pedidos from "./_componentes/Pedidos";
import Corte from "./_componentes/Corte";
import { Aviso } from "./_componentes/comun";

type Pestana = "vender" | "inventario" | "pedidos" | "corte";

const PESTANAS: { clave: Pestana; icono: string; texto: string }[] = [
  { clave: "vender", icono: "🛒", texto: "Vender" },
  { clave: "inventario", icono: "📦", texto: "Inventario" },
  { clave: "pedidos", icono: "🚚", texto: "Pedidos" },
  { clave: "corte", icono: "💰", texto: "Corte" },
];

const CLAVE_PESTANA = "novedades-lucy-pestana-admin";

export default function PanelLucy() {
  const [supabase] = useState(() => createClient());

  const [usuario, setUsuario] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>("vender");

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    const revisar = async () => {
      const { data } = await supabase.auth.getUser();
      setUsuario(data.user);
      if (data.user) {
        const { data: admin } = await supabase.rpc("es_admin");
        setEsAdmin(Boolean(admin));
      }
      setCargando(false);
    };
    revisar();

    const guardada = localStorage.getItem(CLAVE_PESTANA) as Pestana | null;
    if (guardada && PESTANAS.some((p) => p.clave === guardada)) {
      setPestana(guardada);
    }
  }, [supabase]);

  const cambiarPestana = (p: Pestana) => {
    setPestana(p);
    localStorage.setItem(CLAVE_PESTANA, p);
    window.scrollTo({ top: 0 });
  };

  const entrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError("");
    setEntrando(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    });
    if (error || !data.user) {
      setEntrando(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }
    const { data: admin } = await supabase.rpc("es_admin");
    setUsuario(data.user);
    setEsAdmin(Boolean(admin));
    setEntrando(false);
  };

  const salir = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setEsAdmin(false);
  };

  // ---------- CARGANDO ----------
  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
        <p className="text-2xl font-bold text-[#70409a]">Cargando...</p>
      </main>
    );
  }

  // ---------- SIN SESIÓN ----------
  if (!usuario) {
    return (
      <main className="min-h-screen bg-[#fff7fb] px-5 py-10 text-[#4a2857]">
        <div className="mx-auto max-w-md">
          <p className="text-center text-6xl">💗</p>
          <h1 className="mt-3 text-center text-4xl font-black text-[#ef4b91]">
            Panel de Lucy
          </h1>
          <form onSubmit={entrar} className="mt-8 space-y-5 rounded-3xl bg-white p-6 shadow-sm">
            <label className="block">
              <span className="text-xl font-bold">Correo</span>
              <input
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="mt-1 h-16 w-full rounded-2xl border-2 border-pink-200 px-4 text-xl"
              />
            </label>
            <label className="block">
              <span className="text-xl font-bold">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="mt-1 h-16 w-full rounded-2xl border-2 border-pink-200 px-4 text-xl"
              />
            </label>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <button
              type="submit"
              disabled={entrando}
              className="h-16 w-full rounded-full bg-[#ef4b91] text-2xl font-black text-white disabled:opacity-60"
            >
              {entrando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ---------- SIN PERMISO ----------
  if (!esAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7fb] px-5">
        <div className="max-w-md space-y-5 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-5xl">🔒</p>
          <p className="text-2xl font-black text-[#70409a]">
            Esta cuenta no es de administradora
          </p>
          <p className="text-lg text-gray-600">
            Entraste como {usuario.email}. Solo la cuenta de Lucy puede usar
            este panel.
          </p>
          <button
            type="button"
            onClick={salir}
            className="h-14 w-full rounded-full bg-[#ef4b91] text-xl font-bold text-white"
          >
            Salir
          </button>
          <Link href="/" className="block text-lg font-bold text-[#70409a] underline">
            Ir a la tienda
          </Link>
        </div>
      </main>
    );
  }

  // ---------- PANEL ----------
  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4a2857]">
      <header className="sticky top-0 z-30 border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <p className="text-2xl font-black text-[#ef4b91]">💗 Panel de Lucy</p>
          <button
            type="button"
            onClick={salir}
            className="rounded-full px-3 py-2 text-base font-bold text-gray-500"
          >
            Salir
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-lg px-4 pb-32 pt-5">
        {pestana === "vender" && <Vender />}
        {pestana === "inventario" && <Inventario />}
        {pestana === "pedidos" && <Pedidos />}
        {pestana === "corte" && <Corte />}
      </section>

      {/* NAVEGACIÓN INFERIOR (pulgar) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-pink-100 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              type="button"
              onClick={() => cambiarPestana(p.clave)}
              className={`flex h-20 flex-col items-center justify-center text-base font-bold ${
                pestana === p.clave ? "bg-pink-50 text-[#ef4b91]" : "text-[#70409a]"
              }`}
            >
              <span className="text-3xl">{p.icono}</span>
              {p.texto}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
