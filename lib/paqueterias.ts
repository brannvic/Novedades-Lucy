// Capítulo 8: paqueterías con las que trabaja Novedades Lucy y el enlace
// oficial de rastreo de cada una. Debe coincidir con la función
// url_rastreo() de Supabase (supabase/migrations/..._cap8_paqueterias.sql).

export type ClavePaqueteria = "estafeta" | "fedex" | "dhl";

export const PAQUETERIAS: {
  clave: ClavePaqueteria;
  nombre: string;
  ayuda: string;
}[] = [
  {
    clave: "estafeta",
    nombre: "Estafeta",
    ayuda: "Guía de 22 dígitos o código de rastreo de 10 dígitos",
  },
  {
    clave: "fedex",
    nombre: "FedEx",
    ayuda: "Número de rastreo de 12 a 22 dígitos",
  },
  {
    clave: "dhl",
    nombre: "DHL",
    ayuda: "Número de guía de 10 dígitos",
  },
];

export function nombrePaqueteria(clave: string | null | undefined) {
  return PAQUETERIAS.find((p) => p.clave === clave)?.nombre ?? "Paquetería";
}

export function urlRastreo(clave: ClavePaqueteria, numero: string) {
  const limpio = numero.replace(/[^A-Za-z0-9]/g, "");
  if (!limpio) return null;

  switch (clave) {
    case "estafeta":
      return limpio.length === 22
        ? `https://cs.estafeta.com/es/Tracking/searchByGet?wayBillType=1&isShipmentDetail=True&wayBill=${limpio}`
        : "https://www.estafeta.com/rastrear-envio";
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${limpio}`;
    case "dhl":
      return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${limpio}&submit=1`;
  }
}
