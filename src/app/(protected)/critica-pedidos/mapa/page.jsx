import "leaflet/dist/leaflet.css";
import "@/features/critica-pedidos/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/components/CriticaPedidosShell";
import { MapaDashboard } from "@/features/critica-pedidos/components/dashboard/MapaDashboard";

export const metadata = {
  title: "Mapa da critica",
};

export default function CriticaPedidosMapaRoutePage() {
  return (
    <CriticaPedidosShell activeView="mapa">
      <MapaDashboard />
    </CriticaPedidosShell>
  );
}
