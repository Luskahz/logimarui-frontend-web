import { notFound, redirect } from "next/navigation";
import DpoPillarPage from "@/features/dpo/components/DpoPillarPage";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";

export default async function DpoPillarRoute({ params }) {
  const resolvedParams = await params;

  if (resolvedParams.pillar === "sustentabilidade") {
    redirect("/dpo");
  }

  const pillar = getDpoPillarBySlug(resolvedParams.pillar);

  if (!pillar) {
    notFound();
  }

  return <DpoPillarPage pillar={pillar} />;
}
