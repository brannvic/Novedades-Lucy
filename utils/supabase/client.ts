import { createBrowserClient } from "@supabase/ssr";

// Valores públicos del proyecto Supabase "novedades Lucy".
// La llave publishable está diseñada para usarse en el navegador;
// los datos los protegen las reglas RLS de la base de datos.
// Se usan como respaldo si las variables de entorno no están configuradas
// (por ejemplo, en Vercel).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vbrzgbzoagpaeuvvmnfg.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_6qV_EQVFeangnXi-h2K6Aw_8IjLsD0v";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );