import "@/features/critica-pedidos/styles.css";
import CriticaPedidosShell from "@/features/critica-pedidos/components/CriticaPedidosShell";
import { CriticaDashboard } from "@/features/critica-pedidos/components/dashboard/CriticaDashboard";

export const metadata = {
  title: "Critica de pedidos",
};

export default function CriticaPedidosRoutePage() {
  return (
    <CriticaPedidosShell activeView="critica">
      <CriticaDashboard />
    </CriticaPedidosShell>
  );
}
