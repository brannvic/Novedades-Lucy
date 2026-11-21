import { createClient } from "@/utils/supabase/client";

// Capítulo 4: el catálogo ya no está escrito en el código, se lee de Supabase.
// Capítulo 5: se lee de `vista_catalogo`, que ya trae los precios del día
// (menudeo +$10 y recargo de temporada +$20 de octubre a enero).
// Capítulo 2: también trae la disponibilidad según el inventario.

export type Producto = {
  id: number;
  nombre: string;
  modelo: string | null;
  categoria: string;
  descripcion: string | null;
  precioMenudeo: number;
  precioMayoreo: number;
  precioLista: number;
  esTemporada: boolean;
  existencias: number;
  disponible: boolean;
  estadoStock: "disponible" | "ultimas_piezas" | "agotado";
  emoji: string;
  imagenUrl: string | null;
};

export const CATEGORIAS = [
  "Todos",
  "Bebés",
  "Muñecas",
  "Con sonido",
  "Personajes",
  "Accesorios",
];

type FilaProducto = {
  id: number;
  nombre: string;
  modelo: string | null;
  categoria: string;
  descripcion: string | null;
  precio_menudeo: number | string;
  precio_mayoreo: number | string;
  precio_lista: number | string;
  es_temporada: boolean;
  existencias: number;
  disponible: boolean;
  estado_stock: "disponible" | "ultimas_piezas" | "agotado";
  emoji: string | null;
  imagen_url: string | null;
};

const COLUMNAS =
  "id, nombre, modelo, categoria, descripcion, precio_menudeo, precio_mayoreo, precio_lista, es_temporada, existencias, disponible, estado_stock, emoji, imagen_url";

function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    modelo: fila.modelo,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    precioMenudeo: Number(fila.precio_menudeo),
    precioMayoreo: Number(fila.precio_mayoreo),
    precioLista: Number(fila.precio_lista),
    esTemporada: fila.es_temporada,
    existencias: fila.existencias,
    disponible: fila.disponible,
    estadoStock: fila.estado_stock,
    emoji: fila.emoji ?? "🧸",
    imagenUrl: fila.imagen_url,
  };
}

export async function obtenerProductos(): Promise<Producto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_catalogo")
    .select(COLUMNAS)
    .order("categoria")
    .order("nombre");

  if (error) {
    console.error("Error al cargar productos de Supabase:", error);
    throw error;
  }
  return (data as FilaProducto[]).map(aProducto);
}

export async function obtenerProducto(id: number): Promise<Producto | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_catalogo")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? aProducto(data as FilaProducto) : null;
}
