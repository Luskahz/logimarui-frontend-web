import { APP_ROUTES } from "@/app/_config/routes";
import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import DpoPillarShortcuts from "@/features/dpo/components/DpoPillarShortcuts";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

const BLOCK_FOUR_SHORTCUTS = [
  {
    href: APP_ROUTES.DPO_DELIVERY_ROUTE_CME,
    label: "Acompanhamento de rota CME",
  },
];

export default function DpoDeliveryPage() {
  const pillar = getDpoPillarBySlug("entrega");

  return (
    <DpoPillarPage
      pillar={pillar}
      initialOpenGroupCode="4.0"
      questionGroupLeadByCode={{
        "4.0": (
          <DpoPillarShortcuts
            title="Ferramentas do bloco 4.0"
            items={BLOCK_FOUR_SHORTCUTS}
          />
        ),
      }}
    />
  );
}
