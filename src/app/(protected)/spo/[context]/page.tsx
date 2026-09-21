import { notFound } from "next/navigation";
import { getSpoContextBySlug } from "@/features/spo/lib/spoConfig";
import SpoContextView from "@/views/spo/ui/SpoContextView";

type SpoContextRouteProps = {
  params: Promise<{ context: string }>;
};

export default async function SpoContextRoute({
  params,
}: SpoContextRouteProps) {
  const { context: contextSlug } = await params;
  const context = getSpoContextBySlug(contextSlug);

  if (!context) {
    notFound();
  }

  return <SpoContextView context={context} />;
}
