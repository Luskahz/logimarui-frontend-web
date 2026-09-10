import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoDeliveryPage() {
  const pillar = getDpoPillarBySlug("entrega");

  return <DpoPillarPage pillar={pillar} />;
}
