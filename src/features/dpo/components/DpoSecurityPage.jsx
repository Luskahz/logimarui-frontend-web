import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import DpoPillarShortcuts from "@/features/dpo/components/DpoPillarShortcuts";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";
import { APP_ROUTES } from "@/app/_config/routes";

const SECURITY_SHORTCUTS = [
  {
    href: APP_ROUTES.DPO_BLITZ_MANAGER,
    label: "Gerenciador de Blitz",
  },
];

export default function DpoSecurityPage() {
  const pillar = getDpoPillarBySlug("seguranca");

  return (
    <DpoPillarPage
      pillar={pillar}
      beforeQuestionGroups={
        <DpoPillarShortcuts
          title="Ferramentas de segurança"
          items={SECURITY_SHORTCUTS}
        />
      }
    />
  );
}
