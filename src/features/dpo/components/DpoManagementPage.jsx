import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import DpoPillarShortcuts from "@/features/dpo/components/DpoPillarShortcuts";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";
import { APP_ROUTES } from "@/app/_config/routes";

const MANAGEMENT_SHORTCUTS = [
  {
    href: APP_ROUTES.DPO_DTO_MANAGER,
    label: "Gerenciador de DTOs",
  },
];

export default function DpoManagementPage() {
  const pillar = getDpoPillarBySlug("gestao");

  return (
    <DpoPillarPage
      pillar={pillar}
      beforeQuestionGroups={
        <DpoPillarShortcuts
          title="Ferramentas de gestao"
          items={MANAGEMENT_SHORTCUTS}
        />
      }
    />
  );
}
