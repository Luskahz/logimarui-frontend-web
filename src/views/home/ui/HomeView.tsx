"use client";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import HomeContent from "@/views/home/ui/HomeContent";

export default function HomeView() {
  return (
    <AuthenticatedShell>
      <HomeContent />
    </AuthenticatedShell>
  );
}
