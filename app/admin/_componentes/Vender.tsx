"use client";

// Panel de Lucy · VENDER: registrar una venta hecha en el local

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Aviso,
  CATEGORIAS_ADMIN,
  METODOS,
  Titulo,
  dinero,
  mensajeError,
  type ProductoAdmin,
  type Vendedor,
} from "./comun";

const CLAVE_VENDEDOR = "novedades-lucy-ultimo-vendedor";

export default function Vender() {
  const [supabase] = useState(() => createClient());

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [vendedorId, setVendedorId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [ticket, setTicket] = useState<Record<number, number>>({});
  const [precioManual, setPrecioManual] = useState<Record<number, string>>({});
  const [editandoPrecio, setEditandoPrecio] = useState<number | null>(null);
  const [metodo, setMetodo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState<{
    folio: string;
    total: number;
    vendedor: string;
    piezas: number;
  } | null>(null);

  const cargar = useCallback(async () => {
    const [{ data: vend }, { data: prods }] = await Promise.all([
      supabase
        .from("vendedores")
        .select("id, nombre, activo")
        .eq("activo", true)
        .order("id"),
      supabase.rpc("admin_productos"),
    ]);
    setVendedores((vend ?? []) as Vendedor[]);
    setProductos(
      ((prods ?? []) as ProductoAdmin[]).filter((p) => p.activo)
    );
  }, [supabase]);

  useEffect(() => {
    cargar();
    const guardado = Number(localStorage.getItem(CLAVE_VENDEDOR));
    if (guardado) setVendedorId(guardado);
  }, [cargar]);

  const piezas = Object.values(ticket).reduce((a, b) => a + b, 0);
  const esMayoreo = piezas >= 3;

  const renglones = useMemo(
    () =>
      Object.entries(ticket)
        .map(([id, cantidad]) => {
          const p = productos.find((x) => x.id === Number(id));
          if (!p) return null;
          const automatico = esMayoreo ? p.precio_mayoreo : p.precio_menudeo;
          const manual = Number(precioManual[p.id]);
          const precio = manual > 0 ? manual : Number(automatico);
          return { producto: p, cantidad, precio, manual: manual > 0 };
        })
        .filter((r) => r !== null),
    [ticket, productos, esMayoreo, precioManual]
  );

  const total = renglones.reduce((s, r) => s + r.precio * r.cantidad, 0);

  const visibles = productos.filter(
    (p) =>
      (categoria === "Todos" || p.categoria === categoria) &&
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = (p: ProductoAdmin) => {
    setError("");
    const actual = ticket[p.id] ?? 0;
    if (actual >= p.existencias) {
      setError(`Solo hay ${p.existencias} de ${p.nombre}.`);
      return;
    }
    setTicket({ ...ticket, [p.id]: actual + 1 });
  };

  const cambiarCantidad = (id: number, cambio: number) => {
    const p = productos.find((x) => x.id === id);
    const nueva = (ticket[id] ?? 0) + cambio;
    const copia = { ...ticket };
    if (nueva <= 0) {
      delete copia[id];
    } else if (p && nueva > p.existencias) {
      setError(`Solo hay ${p.existencias} de ${p.nombre}.`);
      return;
    } else {
      copia[id] = nueva;
    }
    setTicket(copia);
  };

  const elegirVendedor = (id: number) => {
    setVendedorId(id);
    localStorage.setItem(CLAVE_VENDEDOR, String(id));
  };

  const registrar = async () => {
    setError("");
    if (!vendedorId) return setError("Primero elige quién vendió.");
    if (piezas === 0) return setError("Toca los productos que se vendieron.");
    if (!metodo) return setError("Elige cómo pagó el cliente.");

    setEnviando(true);
    const { data, error } = await supabase.rpc("admin_registrar_venta", {
      p_vendedor_id: vendedorId,
      p_metodo_pago: metodo,
      p_items: renglones.map((r) => ({
        producto_id: r.producto.id,
        cantidad: r.cantidad,
        ...(r.manual ? { precio_unitario: r.precio } : {}),
      })),
    });
    setEnviando(false);

    if (error) {
      setError(mensajeError(error));
      return;
    }

    setListo(data as typeof listo);
    setTicket({});
    setPrecioManual({});
    setMetodo("");
    cargar();
  };

  if (listo) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-6xl">
          ✓
        </div>
        <p className="text-3xl font-black text-green-700">
          ¡Venta registrada!
        </p>
        <div className="rounded-3xl bg-white p-6 text-xl shadow-sm">
          <p>
            <b>{listo.vendedor}</b> vendió {listo.piezas} pieza
            {listo.piezas !== 1 ? "s" : ""}
          </p>
          <p className="mt-2 text-4xl font-black text-[#ef4b91]">
            {dinero(listo.total)}
          </p>
          <p className="mt-2 text-base text-gray-500">Folio {listo.folio}</p>
        </div>
        <button
          type="button"
          onClick={() => setListo(null)}
          className="h-16 w-full rounded-full bg-[#ef4b91] text-2xl font-black text-white shadow-md"
        >
          ➕ Nueva venta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6">
      {/* 1. QUIÉN */}
      <section>
        <Titulo>1. ¿Quién vendió?</Titulo>
        <div className="grid grid-cols-2 gap-3">
          {vendedores.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => elegirVendedor(v.id)}
              className={`min-h-16 rounded-2xl border-4 px-3 text-xl font-black transition ${
                vendedorId === v.id
                  ? "border-[#ef4b91] bg-[#ef4b91] text-white"
                  : "border-pink-100 bg-white text-[#70409a]"
              }`}
            >
              {v.nombre}
            </button>
          ))}
        </div>
        {vendedores.length <= 1 && (
          <p className="mt-2 text-base text-gray-500">
            Para agregar a tus hijos ve a la pestaña 💰 Corte.
          </p>
        )}
      </section>

      {/* 2. QUÉ */}
      <section>
        <Titulo>2. ¿Qué se vendió?</Titulo>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar producto"
          className="mb-3 h-14 w-full rounded-2xl border-2 border-pink-100 bg-white px-4 text-xl outline-none focus:border-[#ef4b91]"
        />
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {["Todos", ...CATEGORIAS_ADMIN].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-lg font-bold ${
                categoria === c
                  ? "bg-[#70409a] text-white"
                  : "bg-white text-[#70409a]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {visibles.map((p) => {
            const agotado = p.existencias === 0;
            const enTicket = ticket[p.id] ?? 0;
            return (
              <button
                key={p.id}
                type="button"
                disabled={agotado}
                onClick={() => agregar(p)}
                className={`relative rounded-2xl border-4 bg-white p-3 text-left transition active:scale-95 ${
                  enTicket
                    ? "border-[#ef4b91]"
                    : "border-transparent shadow-sm"
                } ${agotado ? "opacity-40" : ""}`}
              >
                {enTicket > 0 && (
                  <span className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#ef4b91] text-lg font-black text-white">
                    {enTicket}
                  </span>
                )}
                <span className="text-4xl">{p.emoji ?? "🧸"}</span>
                <p className="mt-1 text-lg font-black leading-tight text-[#4a2857]">
                  {p.nombre}
                </p>
                <p className="text-lg font-bold text-[#ef4b91]">
                  {dinero(p.precio_menudeo)}
                </p>
                <p className="text-sm text-gray-500">
                  {agotado ? "Agotado" : `Quedan ${p.existencias}`}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* TICKET */}
      {renglones.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <Titulo>🧾 Cuenta</Titulo>
          <div className="space-y-4">
            {renglones.map((r) => (
              <div key={r.producto.id} className="border-b border-pink-50 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-bold">
                    {r.producto.emoji} {r.producto.nombre}
                  </p>
                  <p className="text-lg font-black">
                    {dinero(r.precio * r.cantidad)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(r.producto.id, -1)}
                      className="h-12 w-12 rounded-full bg-pink-100 text-2xl font-black text-[#ef4b91]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-2xl font-black">
                      {r.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(r.producto.id, 1)}
                      className="h-12 w-12 rounded-full bg-pink-100 text-2xl font-black text-[#ef4b91]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditandoPrecio(
                        editandoPrecio === r.producto.id ? null : r.producto.id
                      )
                    }
                    className="text-base font-bold text-[#70409a] underline"
                  >
                    {dinero(r.precio)} c/u ✏️
                  </button>
                </div>
                {editandoPrecio === r.producto.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg">Precio por pieza: $</span>
                    <input
                      inputMode="decimal"
                      value={precioManual[r.producto.id] ?? ""}
                      placeholder={String(r.precio)}
                      onChange={(e) =>
                        setPrecioManual({
                          ...precioManual,
                          [r.producto.id]: e.target.value.replace(/[^0-9.]/g, ""),
                        })
                      }
                      className="h-12 w-28 rounded-xl border-2 border-pink-200 px-3 text-xl"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-base text-gray-500">
            {piezas} pieza{piezas !== 1 ? "s" : ""} ·{" "}
            {esMayoreo ? "precio de mayoreo" : "precio de menudeo"}
          </p>
        </section>
      )}

      {/* 3. CÓMO PAGÓ */}
      <section>
        <Titulo>3. ¿Cómo pagó?</Titulo>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(METODOS).map(([clave, m]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setMetodo(clave)}
              className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-4 text-lg font-black ${
                metodo === clave
                  ? "border-[#ef4b91] bg-pink-50 text-[#ef4b91]"
                  : "border-transparent bg-white text-[#70409a] shadow-sm"
              }`}
            >
              <span className="text-4xl">{m.icono}</span>
              {m.texto}
            </button>
          ))}
        </div>
      </section>

      {error && <Aviso tipo="error">{error}</Aviso>}

      {/* TOTAL Y BOTÓN */}
      <div className="sticky bottom-24 rounded-3xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-xl font-bold">Total</span>
          <span className="text-4xl font-black text-[#ef4b91]">
            {dinero(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={registrar}
          disabled={enviando}
          className="h-16 w-full rounded-full bg-green-600 text-2xl font-black text-white shadow-md disabled:opacity-60"
        >
          {enviando ? "Guardando..." : "✓ Registrar venta"}
        </button>
      </div>
    </div>
  );
}
