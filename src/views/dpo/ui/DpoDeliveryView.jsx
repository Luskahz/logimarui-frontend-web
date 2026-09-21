import DpoPillarView from "@/views/dpo/ui/DpoPillarView";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoDeliveryView() {
  const pillar = getDpoPillarBySlug("entrega");

  return <DpoPillarView pillar={pillar} />;
}
