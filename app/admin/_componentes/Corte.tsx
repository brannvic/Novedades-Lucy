"use client";

// Panel de Lucy · CORTE DEL DÍA: cuánto vendió cada quien

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Aviso,
  METODOS,
  Titulo,
  dinero,
  fechaBonita,
  hoyMx,
  mensajeError,
  type Vendedor,
} from "./comun";

type CorteVendedor = {
  vendedor: string;
  ventas: number;
  piezas: number;
  total: number;
  efectivo: number;
  transferencia: number;
  tarjeta: number;
  productos: { producto: string; cantidad: number; importe: number }[] | null;
  ventas_detalle:
    | { folio: string; total: number; metodo_pago: string; hora: string }[]
    | null;
};

type DatosCorte = {
  fecha: string;
  vendedores: CorteVendedor[];
  local: { total: number; efectivo: number; transferencia: number; tarjeta: number };
  en_linea: { pedidos: number; total: number; pagado: number };
};

export default function Corte() {
  const [supabase] = useState(() => createClient());

  const [fecha, setFecha] = useState(hoyMx());
  const [corte, setCorte] = useState<DatosCorte | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [nuevoVendedor, setNuevoVendedor] = useState("");

  const cargar = useCallback(async () => {
    const [{ data, error }, { data: vend }] = await Promise.all([
      supabase.rpc("admin_corte", { p_fecha: fecha }),
      supabase.from("vendedores").select("id, nombre, activo").order("id"),
    ]);
    if (error) setMensaje({ tipo: "error", texto: mensajeError(error) });
    else setCorte(data as DatosCorte);
    setVendedores((vend ?? []) as Vendedor[]);
  }, [supabase, fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const moverDia = (dias: number) => {
    const [y, m, d] = fecha.split("-").map(Number);
    const nueva = new Date(y, m - 1, d + dias);
    setFecha(nueva.toLocaleDateString("en-CA"));
  };

  const deshacerVenta = async (folio: string) => {
    if (!window.confirm(`¿Borrar la venta ${folio}? Las piezas regresan al inventario.`)) return;
    const { error } = await supabase.rpc("admin_cancelar_venta", { p_folio: folio });
    setMensaje(
      error
        ? { tipo: "error", texto: mensajeError(error) }
        : { tipo: "ok", texto: `Venta ${folio} borrada` }
    );
    cargar();
  };

  const guardarVendedor = async (nombre: string, activo: boolean) => {
    const { error } = await supabase.rpc("admin_guardar_vendedor", {
      p_nombre: nombre,
      p_activo: activo,
    });
    if (error) {
      setMensaje({ tipo: "error", texto: mensajeError(error) });
      return;
    }
    setNuevoVendedor("");
    setMensaje({ tipo: "ok", texto: activo ? `✓ ${nombre} puede vender` : `${nombre} ya no aparece en Vender` });
    cargar();
  };

  const esHoy = fecha === hoyMx();

  return (
    <div className="space-y-5 pb-6">
      <Titulo>💰 Corte del día</Titulo>

      {/* FECHA */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => moverDia(-1)}
          className="h-14 w-14 rounded-xl bg-pink-50 text-3xl font-black text-[#70409a]"
          aria-label="Día anterior"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-xl font-black capitalize text-[#4a2857]">
            {esHoy ? "Hoy" : fechaBonita(fecha)}
          </p>
          {esHoy && <p className="text-base capitalize text-gray-500">{fechaBonita(fecha)}</p>}
        </div>
        <button
          type="button"
          onClick={() => moverDia(1)}
          disabled={esHoy}
          className="h-14 w-14 rounded-xl bg-pink-50 text-3xl font-black text-[#70409a] disabled:opacity-30"
          aria-label="Día siguiente"
        >
          ›
        </button>
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {corte && (
        <>
          {/* TOTAL DEL LOCAL */}
          <div className="rounded-3xl bg-[#70409a] p-5 text-white shadow-md">
            <p className="text-xl font-bold">Vendido en el local</p>
            <p className="text-5xl font-black">{dinero(corte.local.total)}</p>
            <div className="mt-3 space-y-1 text-lg">
              {Object.entries(METODOS).map(([clave, m]) => (
                <div key={clave} className="flex justify-between">
                  <span>
                    {m.icono} {m.texto}
                  </span>
                  <b>{dinero(corte.local[clave as keyof DatosCorte["local"]])}</b>
                </div>
              ))}
            </div>
          </div>

          {/* POR VENDEDOR */}
          <Titulo>👨‍👩‍👧 ¿Cuánto vendió cada quien?</Titulo>
          {corte.vendedores.length === 0 ? (
            <Aviso tipo="info">Todavía no hay ventas en el local este día.</Aviso>
          ) : (
            corte.vendedores.map((v) => (
              <div key={v.vendedor} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-[#4a2857]">{v.vendedor}</p>
                  <p className="text-3xl font-black text-[#ef4b91]">{dinero(v.total)}</p>
                </div>
                <p className="text-lg text-gray-600">
                  {v.piezas} pieza{v.piezas !== 1 ? "s" : ""} en {v.ventas} venta{v.ventas !== 1 ? "s" : ""}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {Object.entries(METODOS).map(([clave, m]) => (
                    <div key={clave} className={`rounded-xl p-2 ${m.color}`}>
                      <p className="text-2xl">{m.icono}</p>
                      <p className="text-base font-black">
                        {dinero(v[clave as "efectivo" | "transferencia" | "tarjeta"])}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-pink-50 p-3">
                  {(v.productos ?? []).map((p) => (
                    <div key={p.producto} className="flex justify-between py-1 text-lg">
                      <span>
                        <b>{p.cantidad} ×</b> {p.producto}
                      </span>
                      <span>{dinero(p.importe)}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAbierto(abierto === v.vendedor ? null : v.vendedor)}
                  className="mt-3 text-lg font-bold text-[#70409a] underline"
                >
                  {abierto === v.vendedor ? "Ocultar ventas" : "Ver cada venta"}
                </button>
                {abierto === v.vendedor && (
                  <div className="mt-2 space-y-2">
                    {(v.ventas_detalle ?? []).map((d) => (
                      <div key={d.folio} className="flex items-center justify-between rounded-xl border border-pink-100 p-3 text-lg">
                        <span>
                          {d.hora} · {METODOS[d.metodo_pago]?.icono} {dinero(d.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deshacerVenta(d.folio)}
                          className="text-base font-bold text-red-600 underline"
                        >
                          Borrar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* TIENDA EN LÍNEA */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xl font-black text-[#4a2857]">🌐 Tienda en línea</p>
            <p className="mt-1 text-lg">
              {corte.en_linea.pedidos} pedido{corte.en_linea.pedidos !== 1 ? "s" : ""} ·{" "}
              {dinero(corte.en_linea.total)}
            </p>
            <p className="text-lg text-green-700">Ya pagado: {dinero(corte.en_linea.pagado)}</p>
          </div>
        </>
      )}

      {/* QUIÉNES VENDEN */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <Titulo>🙋 ¿Quiénes venden?</Titulo>
        <div className="space-y-2">
          {vendedores.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-lg">
              <span className={v.activo ? "font-bold" : "text-gray-400 line-through"}>{v.nombre}</span>
              <button
                type="button"
                onClick={() => guardarVendedor(v.nombre, !v.activo)}
                className="text-base font-bold text-[#70409a] underline"
              >
                {v.activo ? "Quitar" : "Volver a agregar"}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={nuevoVendedor}
            onChange={(e) => setNuevoVendedor(e.target.value)}
            placeholder="Nombre (ej. Juan)"
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-pink-200 px-4 text-xl"
          />
          <button
            type="button"
            disabled={!nuevoVendedor.trim()}
            onClick={() => guardarVendedor(nuevoVendedor.trim(), true)}
            className="h-14 rounded-2xl bg-[#70409a] px-5 text-xl font-bold text-white disabled:opacity-50"
          >
            ➕
          </button>
        </div>
      </div>
    </div>
  );
}
