"use client";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import DtoManagerDashboard from "@/features/dpo/components/dto/DtoManagerDashboard";
import {
  BLITZ_MANAGER_CONFIG,
  FormManagerProvider,
} from "@/features/dpo/lib/formManagerConfig";

export default function DpoBlitzManagerPage() {
  return (
    <FormManagerProvider config={BLITZ_MANAGER_CONFIG}>
      <AuthenticatedShell mainClassName="min-h-screen px-4 pb-6 pt-72 min-[440px]:pt-52 sm:px-6 sm:pb-8 lg:pt-32">
        <DtoManagerDashboard />
      </AuthenticatedShell>
    </FormManagerProvider>
  );
}
