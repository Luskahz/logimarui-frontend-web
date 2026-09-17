import { StatusPill } from "@/features/extrator-manager/ui/ExtratorManagerControls";
import { formatDateTime } from "@/features/extrator-manager/lib/extratorFormat";

export default function ExtratorStatusOverview({ lastUpdatedAt, statusPayload }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatusPill
        label="Executando"
        value={statusPayload?.executando ? "Sim" : "Nao"}
        note={`${statusPayload?.workers_ativos || 0}/${statusPayload?.workers_maximos || 0} worker(s) ativo(s).`}
        tone={statusPayload?.executando ? "accent" : "default"}
      />
      <StatusPill
        label="Ultima tarefa"
        value={statusPayload?.ultima_tarefa || "Nenhuma"}
        note={
          lastUpdatedAt
            ? `Painel atualizado em ${formatDateTime(lastUpdatedAt)}.`
            : ""
        }
      />
      <StatusPill
        label="Na fila"
        value={statusPayload?.fila_tamanho || 0}
        note="Tarefas aguardando processamento."
        tone={statusPayload?.fila_tamanho ? "accent" : "default"}
      />
      <StatusPill
        label="Scheduler"
        value={statusPayload?.scheduler_enabled_count || 0}
        note={`${statusPayload?.scheduler_rules_count || 0} regra(s) cadastrada(s).`}
        tone={statusPayload?.scheduler_enabled_count ? "accent" : "default"}
      />
    </div>
  );
}
