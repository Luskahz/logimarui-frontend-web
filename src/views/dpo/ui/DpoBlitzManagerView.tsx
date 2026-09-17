"use client";

import DtoManagerDashboard from "@/features/dpo/ui/dto/DtoManagerDashboard";
import {
  BLITZ_MANAGER_CONFIG,
  FormManagerProvider,
} from "@/features/dpo/model/formManagerConfig";

export default function DpoBlitzManagerView() {
  return (
    <FormManagerProvider config={BLITZ_MANAGER_CONFIG}>
      <DtoManagerDashboard />
    </FormManagerProvider>
  );
}
