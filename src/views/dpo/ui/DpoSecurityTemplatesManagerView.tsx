"use client";

import DtoManagerDashboard from "@/features/dpo/ui/dto/DtoManagerDashboard";
import {
  FormManagerProvider,
  SECURITY_TEMPLATES_MANAGER_CONFIG,
} from "@/features/dpo/model/formManagerConfig";

export default function DpoSecurityTemplatesManagerView() {
  return (
    <FormManagerProvider config={SECURITY_TEMPLATES_MANAGER_CONFIG}>
      <DtoManagerDashboard />
    </FormManagerProvider>
  );
}
