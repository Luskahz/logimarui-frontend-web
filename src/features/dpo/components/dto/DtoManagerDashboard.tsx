"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useDtoForms } from "@/features/dpo/hooks/useDtoForms";
import DtoFormAnalysis from "@/features/dpo/components/dto/DtoFormAnalysis";
import DtoFormCard from "@/features/dpo/components/dto/DtoFormCard";
import DtoManagerHeader from "@/features/dpo/components/dto/DtoManagerHeader";
import DtoOverview from "@/features/dpo/components/dto/DtoOverview";
import {
  DtoButton,
  DtoDashboardSkeleton,
  DtoStatePanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

export default function DtoManagerDashboard() {
  const manager = useDtoForms();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const selectedFormExists = manager.forms.some(
    (form) => form.id === selectedFormId,
  );
  const effectiveSelectedFormId = selectedFormExists ? selectedFormId : null;
  const selectedResource = effectiveSelectedFormId
    ? manager.resources[effectiveSelectedFormId]
    : null;

  return (
    <div className="space-y-4">
      <DtoManagerHeader
        cached={Boolean(manager.formsPayload?.cached)}
        lastUpdatedAt={manager.lastUpdatedAt}
        onRefresh={manager.refresh}
        refreshCompletedAt={manager.refreshCompletedAt}
        refreshError={manager.refreshError}
        refreshing={manager.refreshing}
      />

      {manager.status === "loading" && !manager.formsPayload ? (
        <DtoDashboardSkeleton />
      ) : manager.status === "error" && !manager.formsPayload ? (
        <DtoStatePanel
          tone="danger"
          title="Não foi possível descobrir as DTOs"
          description={manager.error || "O serviço de integração com o SAVI não respondeu."}
          action={
            <DtoButton tone="danger" onClick={() => void manager.retryDiscovery()}>
              <RefreshCw aria-hidden="true" />
              Tentar novamente
            </DtoButton>
          }
        />
      ) : manager.status === "empty" ? (
        <DtoStatePanel
          title="Nenhum formulário DTO encontrado"
          description="A descoberta foi concluída, mas nenhum formulário cujo nome começa com DTO foi localizado no SAVI. Use Atualizar depois que um novo formulário for criado."
        />
      ) : effectiveSelectedFormId && selectedResource?.data ? (
        <DtoFormAnalysis
          key={effectiveSelectedFormId}
          detail={selectedResource.data}
          resource={selectedResource}
          onBack={() => setSelectedFormId(null)}
          onRetry={() => manager.retryForm(effectiveSelectedFormId)}
        />
      ) : (
        <>
          <DtoOverview
            formsCount={manager.forms.length}
            onAnalyze={setSelectedFormId}
            resources={manager.resources}
          />

          <section aria-labelledby="dto-forms-title">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1 py-2">
              <div>
                <Typography variant="overline">Por formulário</Typography>
                <Typography id="dto-forms-title" as="h2" variant="sectionTitle" className="mt-2">
                  DTOs descobertas
                </Typography>
              </div>
              <p className="text-xs text-[var(--shell-muted)]">
                Cada falha é isolada e pode ser repetida individualmente.
              </p>
            </div>

            <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {manager.forms.map((form) => (
                <DtoFormCard
                  key={form.id}
                  form={form}
                  resource={manager.resources[form.id]}
                  onAnalyze={setSelectedFormId}
                  onRetry={manager.retryForm}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

