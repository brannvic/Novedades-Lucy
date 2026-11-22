"use client";

// Capítulo 3: vista 360° del producto.
// Muestra una secuencia de fotos tomadas alrededor del muñeco; el cliente
// arrastra con el dedo o el mouse para girarlo, o toca "Girar".

import { useEffect, useRef, useState } from "react";

type Props = {
  carpeta: string; // por ejemplo "/360/boquita"
  total: number; // número de fotos (01.webp, 02.webp, ...)
  nombre: string;
};

const PIXELES_POR_FOTO = 14;

function rutaFoto(carpeta: string, indice: number) {
  return `${carpeta}/${String(indice + 1).padStart(2, "0")}.webp`;
}

export default function Visor360({ carpeta, total, nombre }: Props) {
  const [indice, setIndice] = useState(0);
  const [cargadas, setCargadas] = useState(0);
  const [girando, setGirando] = useState(false);
  const [usado, setUsado] = useState(false);

  const arrastre = useRef<{ x: number; indice: number } | null>(null);

  // Precargar todas las fotos para que el giro sea fluido
  useEffect(() => {
    let activo = true;
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (activo) setCargadas((n) => n + 1);
      };
      img.src = rutaFoto(carpeta, i);
    }
    return () => {
      activo = false;
    };
  }, [carpeta, total]);

  // Giro automático
  useEffect(() => {
    if (!girando) return;
    const id = window.setInterval(() => {
      setIndice((i) => (i + 1) % total);
    }, 130);
    return () => window.clearInterval(id);
  }, [girando, total]);

  const listo = cargadas >= total;

  const mover = (pasos: number) => {
    setIndice((i) => (((i + pasos) % total) + total) % total);
  };

  const alPresionar = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, indice };
    setGirando(false);
    setUsado(true);
  };

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastre.current) return;
    const pasos = Math.round(
      (e.clientX - arrastre.current.x) / PIXELES_POR_FOTO
    );
    const nuevo =
      (((arrastre.current.indice - pasos) % total) + total) % total;
    setIndice(nuevo);
  };

  const alSoltar = () => {
    arrastre.current = null;
  };

  return (
    <div className="relative flex min-h-[400px] w-full flex-col items-center justify-center rounded-[2rem] bg-white">
      <div
        role="img"
        aria-label={`Vista 360° de ${nombre}. Arrastra para girar.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") mover(1);
          if (e.key === "ArrowRight") mover(-1);
        }}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        className="relative w-full max-w-[420px] cursor-grab select-none outline-none active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rutaFoto(carpeta, indice)}
          alt={nombre}
          draggable={false}
          className="pointer-events-none aspect-[4/5] w-full object-contain"
        />

        {!listo && (
          <div className="absolute inset-x-0 bottom-3 text-center text-sm font-bold text-[#70409a]">
            Cargando vista 360°… {Math.round((cargadas / total) * 100)}%
          </div>
        )}

        {listo && !usado && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
            <span className="rounded-full bg-[#70409a]/90 px-4 py-2 text-sm font-bold text-white">
              ↔ Arrastra para girar
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setGirando(false);
            mover(1);
          }}
          className="h-11 w-11 rounded-full border border-pink-200 bg-white text-xl font-bold text-[#70409a] hover:bg-pink-50"
          aria-label="Girar a la izquierda"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => {
            setUsado(true);
            setGirando((g) => !g);
          }}
          className="h-11 rounded-full bg-[#70409a] px-5 text-sm font-bold text-white hover:bg-[#5e3485]"
        >
          {girando ? "⏸ Pausar" : "▶ Girar 360°"}
        </button>
        <button
          type="button"
          onClick={() => {
            setGirando(false);
            mover(-1);
          }}
          className="h-11 w-11 rounded-full border border-pink-200 bg-white text-xl font-bold text-[#70409a] hover:bg-pink-50"
          aria-label="Girar a la derecha"
        >
          ›
        </button>
      </div>
    </div>
  );
}
