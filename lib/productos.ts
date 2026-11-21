import { createClient } from "@/utils/supabase/client";

// Capítulo 4: el catálogo ya no está escrito en el código,
// se lee de la tabla `productos` en Supabase.

export type Producto = {
  id: number;
  nombre: string;
  modelo: string | null;
  categoria: string;
  descripcion: string | null;
  precioMenudeo: number;
  precioMayoreo: number;
  existencias: number;
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
  existencias: number;
  emoji: string | null;
  imagen_url: string | null;
};

const COLUMNAS =
  "id, nombre, modelo, categoria, descripcion, precio_menudeo, precio_mayoreo, existencias, emoji, imagen_url";

function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    modelo: fila.modelo,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    precioMenudeo: Number(fila.precio_menudeo),
    precioMayoreo: Number(fila.precio_mayoreo),
    existencias: fila.existencias,
    emoji: fila.emoji ?? "🧸",
    imagenUrl: fila.imagen_url,
  };
}

export async function obtenerProductos(): Promise<Producto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("productos")
    .select(COLUMNAS)
    .order("categoria")
    .order("nombre");

  if (error) throw error;
  return (data as FilaProducto[]).map(aProducto);
}

export async function obtenerProducto(id: number): Promise<Producto | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("productos")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? aProducto(data as FilaProducto) : null;
}
