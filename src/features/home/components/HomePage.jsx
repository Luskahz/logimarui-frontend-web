"use client";

import AuthenticatedShell from "@/features/app-shell/components/AuthenticatedShell";
import HomeDashboard from "@/features/home/components/HomeDashboard";

export default function HomePage() {
  return (
    <AuthenticatedShell>
      {(shellState) => <HomeDashboard {...shellState} />}
    </AuthenticatedShell>
  );
}
