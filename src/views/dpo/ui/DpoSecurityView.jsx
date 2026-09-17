import DpoPillarView from "@/views/dpo/ui/DpoPillarView";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoSecurityView() {
  const pillar = getDpoPillarBySlug("seguranca");

  return <DpoPillarView pillar={pillar} />;
}
