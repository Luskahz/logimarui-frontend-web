import "@/features/critica-pedidos/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/components/CriticaPedidosShell";
import { CriticaDashboard } from "@/features/critica-pedidos/components/dashboard/CriticaDashboard";

export default function CriticaPedidosView() {
  return (
    <CriticaPedidosShell activeView="critica">
      <CriticaDashboard />
    </CriticaPedidosShell>
  );
}
