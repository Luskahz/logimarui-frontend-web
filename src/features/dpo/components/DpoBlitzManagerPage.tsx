"use client";

import DtoManagerDashboard from "@/features/dpo/components/dto/DtoManagerDashboard";
import {
  BLITZ_MANAGER_CONFIG,
  FormManagerProvider,
} from "@/features/dpo/lib/formManagerConfig";

export default function DpoBlitzManagerPage() {
  return (
    <FormManagerProvider config={BLITZ_MANAGER_CONFIG}>
      <DtoManagerDashboard />
    </FormManagerProvider>
  );
}
