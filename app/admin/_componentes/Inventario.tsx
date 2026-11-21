"use client";

// Panel de Lucy · INVENTARIO: conteo diario, precios y productos nuevos

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Aviso,
  CATEGORIAS_ADMIN,
  Titulo,
  dinero,
  mensajeError,
  type ProductoAdmin,
} from "./comun";

type Formulario = {
  id: number | null;
  nombre: string;
  categoria: string;
  precio: string;
  existencias: string;
  activo: boolean;
};

const FORMULARIO_VACIO: Formulario = {
  id: null,
  nombre: "",
  categoria: "Muñecas",
  precio: "",
  existencias: "",
  activo: true,
};

export default function Inventario() {
  const [supabase] = useState(() => createClient());

  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [cambios, setCambios] = useState<Record<number, number>>({});
  const [busqueda, setBusqueda] = useState("");
  const [soloPocos, setSoloPocos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_productos");
    if (error) {
      setMensaje({ tipo: "error", texto: mensajeError(error) });
      return;
    }
    setProductos((data ?? []) as ProductoAdmin[]);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (p: ProductoAdmin, delta: number) => {
    setMensaje(null);
    const actual = cambios[p.id] ?? 0;
    const nuevo = actual + delta;
    if (p.existencias + nuevo < 0) return;
    const copia = { ...cambios };
    if (nuevo === 0) delete copia[p.id];
    else copia[p.id] = nuevo;
    setCambios(copia);
  };

  const pendientes = Object.keys(cambios).length;

  const guardarCambios = async () => {
    setGuardando(true);
    for (const [id, delta] of Object.entries(cambios)) {
      const { error } = await supabase.rpc("admin_cambiar_existencias", {
        p_producto_id: Number(id),
        p_cambio: delta,
        p_nota: delta > 0 ? "Llegó mercancía (panel)" : "Ajuste de conteo (panel)",
      });
      if (error) {
        setGuardando(false);
        setMensaje({ tipo: "error", texto: mensajeError(error) });
        return;
      }
    }
    setGuardando(false);
    setCambios({});
    setMensaje({ tipo: "ok", texto: "✓ Inventario guardado" });
    cargar();
  };

  const guardarProducto = async () => {
    if (!formulario) return;
    setGuardando(true);
    const { error } = await supabase.rpc("admin_guardar_producto", {
      p_id: formulario.id,
      p_nombre: formulario.nombre,
      p_categoria: formulario.categoria,
      p_precio: Number(formulario.precio),
      p_existencias: Number(formulario.existencias || 0),
      p_activo: formulario.activo,
    });
    setGuardando(false);
    if (error) {
      setMensaje({ tipo: "error", texto: mensajeError(error) });
      return;
    }
    setMensaje({
      tipo: "ok",
      texto: formulario.id ? "✓ Producto actualizado" : "✓ Producto agregado",
    });
    setFormulario(null);
    cargar();
  };

  const visibles = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      (!soloPocos || p.existencias <= 3)
  );

  // ---------- FORMULARIO DE PRODUCTO ----------
  if (formulario) {
    return (
      <div className="space-y-5">
        <Titulo>{formulario.id ? "✏️ Cambiar producto" : "➕ Producto nuevo"}</Titulo>

        <label className="block">
          <span className="text-xl font-bold">Nombre</span>
          <input
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
            className="mt-1 h-14 w-full rounded-2xl border-2 border-pink-200 px-4 text-xl"
          />
        </label>

        <div>
          <span className="text-xl font-bold">Tipo</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CATEGORIAS_ADMIN.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormulario({ ...formulario, categoria: c })}
                className={`h-14 rounded-2xl border-4 text-lg font-bold ${
                  formulario.categoria === c
                    ? "border-[#ef4b91] bg-pink-50 text-[#ef4b91]"
                    : "border-transparent bg-white text-[#70409a]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xl font-bold">Precio (mayoreo)</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black">$</span>
            <input
              inputMode="decimal"
              value={formulario.precio}
              onChange={(e) =>
                setFormulario({ ...formulario, precio: e.target.value.replace(/[^0-9.]/g, "") })
              }
              className="h-14 w-full rounded-2xl border-2 border-pink-200 px-4 text-2xl"
            />
          </div>
          <span className="mt-1 block text-base text-gray-500">
            La tienda suma sola $10 en menudeo y $20 en temporada.
          </span>
        </label>

        {!formulario.id && (
          <label className="block">
            <span className="text-xl font-bold">¿Cuántas piezas tienes?</span>
            <input
              inputMode="numeric"
              value={formulario.existencias}
              onChange={(e) =>
                setFormulario({ ...formulario, existencias: e.target.value.replace(/\D/g, "") })
              }
              className="mt-1 h-14 w-full rounded-2xl border-2 border-pink-200 px-4 text-2xl"
            />
          </label>
        )}

        <button
          type="button"
          onClick={() => setFormulario({ ...formulario, activo: !formulario.activo })}
          className={`h-16 w-full rounded-2xl text-xl font-bold ${
            formulario.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
          }`}
        >
          {formulario.activo ? "👁️ Se muestra en la tienda" : "🙈 Oculto en la tienda"}
        </button>

        {mensaje?.tipo === "error" && <Aviso tipo="error">{mensaje.texto}</Aviso>}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setFormulario(null);
              setMensaje(null);
            }}
            className="h-16 rounded-full border-4 border-gray-300 text-xl font-bold text-gray-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarProducto}
            disabled={guardando}
            className="h-16 rounded-full bg-green-600 text-xl font-black text-white disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "✓ Guardar"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- LISTA DE INVENTARIO ----------
  return (
    <div className="space-y-4 pb-28">
      <Titulo>📦 Mi inventario</Titulo>

      <button
        type="button"
        onClick={() => {
          setMensaje(null);
          setFormulario({ ...FORMULARIO_VACIO });
        }}
        className="h-14 w-full rounded-2xl bg-[#70409a] text-xl font-bold text-white"
      >
        ➕ Agregar producto nuevo
      </button>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="🔍 Buscar producto"
        className="h-14 w-full rounded-2xl border-2 border-pink-100 bg-white px-4 text-xl outline-none focus:border-[#ef4b91]"
      />

      <button
        type="button"
        onClick={() => setSoloPocos(!soloPocos)}
        className={`rounded-full px-4 py-2 text-lg font-bold ${
          soloPocos ? "bg-amber-400 text-[#4a2857]" : "bg-white text-[#70409a]"
        }`}
      >
        ⚠️ Solo los que se están acabando
      </button>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <p className="text-base text-gray-500">
        Usa <b>+</b> cuando llegue mercancía y <b>−</b> si cuentas menos.
        Al final toca <b>Guardar</b>.
      </p>

      <div className="space-y-3">
        {visibles.map((p) => {
          const delta = cambios[p.id] ?? 0;
          const cantidad = p.existencias + delta;
          return (
            <div
              key={p.id}
              className={`rounded-2xl bg-white p-4 shadow-sm ${
                p.activo ? "" : "opacity-60"
              } ${delta ? "ring-4 ring-amber-300" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xl font-black text-[#4a2857]">
                    {p.emoji} {p.nombre}
                  </p>
                  <p className="text-base text-gray-500">
                    {p.categoria} · {dinero(p.precio_lista)}
                    {!p.activo && " · oculto"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormulario({
                      id: p.id,
                      nombre: p.nombre,
                      categoria: p.categoria,
                      precio: String(p.precio_lista),
                      existencias: "",
                      activo: p.activo,
                    })
                  }
                  className="rounded-full bg-pink-50 px-3 py-2 text-base font-bold text-[#70409a]"
                >
                  ✏️ Cambiar
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => cambiar(p, -1)}
                  className="h-16 w-16 rounded-2xl bg-pink-100 text-4xl font-black text-[#ef4b91]"
                  aria-label={`Quitar una pieza de ${p.nombre}`}
                >
                  −
                </button>
                <div className="text-center">
                  <p
                    className={`text-4xl font-black ${
                      cantidad === 0
                        ? "text-red-600"
                        : cantidad <= 3
                        ? "text-amber-600"
                        : "text-[#4a2857]"
                    }`}
                  >
                    {cantidad}
                  </p>
                  <p className="text-sm text-gray-500">
                    {delta === 0
                      ? "piezas"
                      : `${delta > 0 ? "+" : ""}${delta} sin guardar`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cambiar(p, 1)}
                  className="h-16 w-16 rounded-2xl bg-green-100 text-4xl font-black text-green-700"
                  aria-label={`Agregar una pieza de ${p.nombre}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pendientes > 0 && (
        <div className="fixed inset-x-0 bottom-24 z-20 mx-auto max-w-lg px-4">
          <button
            type="button"
            onClick={guardarCambios}
            disabled={guardando}
            className="h-16 w-full rounded-full bg-green-600 text-xl font-black text-white shadow-xl disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : `✓ Guardar cambios (${pendientes} producto${pendientes !== 1 ? "s" : ""})`}
          </button>
        </div>
      )}
    </div>
  );
}
