import "leaflet/dist/leaflet.css";
import "@/features/critica-pedidos/ui/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/ui/CriticaPedidosShell";
import { MapaDashboard } from "@/features/critica-pedidos/ui/dashboard/MapaDashboard";

export default function CriticaPedidosMapView() {
  return (
    <CriticaPedidosShell activeView="mapa">
      <MapaDashboard />
    </CriticaPedidosShell>
  );
}
