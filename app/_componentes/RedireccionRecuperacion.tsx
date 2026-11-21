"use client";

// Si el enlace de "restablecer contraseña" de Supabase llega a cualquier
// página (por ejemplo al inicio), lo manda a /restablecer conservando el
// código o los tokens del enlace.

import { useEffect } from "react";

export default function RedireccionRecuperacion() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname.startsWith("/restablecer")) return;

    const parametros = new URLSearchParams(search);
    const esRecuperacion =
      hash.includes("type=recovery") ||
      hash.includes("error_code=otp_expired") ||
      parametros.get("type") === "recovery" ||
      (pathname === "/" && parametros.has("code"));

    if (esRecuperacion) {
      window.location.replace(`/restablecer${search}${hash}`);
    }
  }, []);

  return null;
}
