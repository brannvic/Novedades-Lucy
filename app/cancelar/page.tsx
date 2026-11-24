import SolicitudPedido from "@/app/_componentes/SolicitudPedido";

// Cancelar un pedido real del cliente (con cuenta o con folio + teléfono).
export default function CancelarPage() {
  return <SolicitudPedido tipo="cancelacion" />;
}
