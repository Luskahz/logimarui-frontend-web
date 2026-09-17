import "leaflet/dist/leaflet.css";
import "@/features/critica-pedidos/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/components/CriticaPedidosShell";
import { MapaDashboard } from "@/features/critica-pedidos/components/dashboard/MapaDashboard";

export default function CriticaPedidosMapView() {
  return (
    <CriticaPedidosShell activeView="mapa">
      <MapaDashboard />
    </CriticaPedidosShell>
  );
}
