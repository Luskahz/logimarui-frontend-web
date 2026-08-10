"use client";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import HomeDashboard from "@/features/home/components/HomeDashboard";

export default function HomePage() {
  return (
    <AuthenticatedShell>
      <HomeDashboard />
    </AuthenticatedShell>
  );
}
