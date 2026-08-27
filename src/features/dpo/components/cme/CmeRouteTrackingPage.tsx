import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import CmeRouteTrackingDashboard from "@/features/dpo/components/cme/CmeRouteTrackingDashboard";

export default function CmeRouteTrackingPage() {
  return (
    <AuthenticatedShell mainClassName="min-h-screen px-4 pb-6 pt-72 min-[440px]:pt-52 sm:px-6 sm:pb-8 lg:pt-32">
      <CmeRouteTrackingDashboard />
    </AuthenticatedShell>
  );
}
