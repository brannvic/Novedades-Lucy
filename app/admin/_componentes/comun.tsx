"use client";

// Panel de Lucy: utilidades compartidas

export type ProductoAdmin = {
  id: number;
  nombre: string;
  categoria: string;
  emoji: string | null;
  existencias: number;
  activo: boolean;
  precio_lista: number;
  precio_mayoreo: number;
  precio_menudeo: number;
};

export type Vendedor = {
  id: number;
  nombre: string;
  activo: boolean;
};

export const CATEGORIAS_ADMIN = [
  "Bebés",
  "Muñecas",
  "Con sonido",
  "Personajes",
  "Accesorios",
];

export const METODOS: Record<
  string,
  { texto: string; icono: string; color: string }
> = {
  efectivo: {
    texto: "Efectivo",
    icono: "💵",
    color: "bg-green-100 text-green-800",
  },
  transferencia: {
    texto: "Transferencia",
    icono: "🏦",
    color: "bg-blue-100 text-blue-800",
  },
  tarjeta: {
    texto: "Tarjeta",
    icono: "💳",
    color: "bg-purple-100 text-purple-800",
  },
};

export function dinero(valor: number | string | null | undefined) {
  const n = Number(valor ?? 0);
  return `$${n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function hoyMx() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
}

export function fechaBonita(fecha: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function mensajeError(error: { message?: string } | null) {
  const texto = error?.message ?? "";
  if (texto.includes("NO_AUTORIZADO")) {
    return "Tu cuenta no tiene permiso para hacer esto.";
  }
  if (texto.includes("SIN_EXISTENCIAS")) {
    return (
      "No alcanzan las piezas: " +
      texto.replace(/.*SIN_EXISTENCIAS:\s*/, "")
    );
  }
  if (texto.includes("Failed to fetch")) {
    return "No hay internet. Revisa tu conexión e intenta otra vez.";
  }
  return texto || "Algo salió mal. Intenta otra vez.";
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: "ok" | "error" | "info";
  children: React.ReactNode;
}) {
  const estilos = {
    ok: "bg-green-100 text-green-900 border-green-300",
    error: "bg-red-100 text-red-900 border-red-300",
    info: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return (
    <div
      className={`rounded-2xl border-2 px-4 py-3 text-lg font-bold ${estilos[tipo]}`}
    >
      {children}
    </div>
  );
}

export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-2xl font-black text-[#70409a]">{children}</h2>
  );
}
