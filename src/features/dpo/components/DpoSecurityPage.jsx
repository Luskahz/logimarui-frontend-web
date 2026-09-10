import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default function DpoSecurityPage() {
  const pillar = getDpoPillarBySlug("seguranca");

  return <DpoPillarPage pillar={pillar} />;
}
