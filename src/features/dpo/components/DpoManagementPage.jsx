import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoManagementPage() {
  const pillar = getDpoPillarBySlug("gestao");

  return <DpoPillarPage pillar={pillar} />;
}
