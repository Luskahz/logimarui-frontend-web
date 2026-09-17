import "@/features/critica-pedidos/ui/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/ui/CriticaPedidosShell";
import { CriticaDashboard } from "@/features/critica-pedidos/ui/dashboard/CriticaDashboard";

export default function CriticaPedidosView() {
  return (
    <CriticaPedidosShell activeView="critica">
      <CriticaDashboard />
    </CriticaPedidosShell>
  );
}
