import SolicitudPedido from "@/app/_componentes/SolicitudPedido";

// Solicitar la devolución de un pedido entregado (con cuenta o con folio + teléfono).
export default function DevolucionPage() {
  return <SolicitudPedido tipo="devolucion" />;
}
