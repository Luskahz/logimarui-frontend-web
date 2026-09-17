"use client";

import DtoManagerDashboard from "@/features/dpo/components/dto/DtoManagerDashboard";
import {
  FormManagerProvider,
  SECURITY_TEMPLATES_MANAGER_CONFIG,
} from "@/features/dpo/lib/formManagerConfig";

export default function DpoSecurityTemplatesManagerView() {
  return (
    <FormManagerProvider config={SECURITY_TEMPLATES_MANAGER_CONFIG}>
      <DtoManagerDashboard />
    </FormManagerProvider>
  );
}
