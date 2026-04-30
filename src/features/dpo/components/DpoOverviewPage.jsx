import AuthenticatedShell from "@/features/app-shell/components/AuthenticatedShell";
import DpoHouse from "@/features/dpo/components/DpoHouse";

export default function DpoOverviewPage() {
  return (
    <AuthenticatedShell>
      <DpoHouse />
    </AuthenticatedShell>
  );
}
