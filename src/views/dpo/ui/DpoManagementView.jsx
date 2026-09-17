import DpoPillarView from "@/views/dpo/ui/DpoPillarView";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoManagementView() {
  const pillar = getDpoPillarBySlug("gestao");

  return <DpoPillarView pillar={pillar} />;
}
