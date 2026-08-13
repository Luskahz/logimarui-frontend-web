"use client";

import { useState } from "react";
import {
  formatDtoNumber,
  formatDtoPercentage,
} from "@/features/dpo/lib/dtoFormatters";
import type { DtoCollaboratorStat } from "@/features/dpo/lib/dtoTypes";
import {
  DtoButton,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

const PAGE_SIZE = 8;

export default function DtoCollaborators({
  collaborators,
}: {
  collaborators: DtoCollaboratorStat[] | null;
}) {
  const [page, setPage] = useState(1);

  if (collaborators === null) {
    return (
      <DtoPanel className="p-5 sm:p-6">
        <Typography variant="overline">Colaboradores</Typography>
        <Typography as="h2" variant="cardTitle" className="mt-2">
          Campo não identificado
        </Typography>
        <Typography variant="supportingText" className="mt-3">
          O SAVI não forneceu um campo que pudesse ser associado com segurança
          ao colaborador avaliado. Esta análise ficou indisponível, sem inferir
          nomes por campos ambíguos.
        </Typography>
      </DtoPanel>
    );
  }

  const totalPages = Math.max(1, Math.ceil(collaborators.length / PAGE_SIZE));
  const normalizedPage = Math.min(page, totalPages);
  const startIndex = (normalizedPage - 1) * PAGE_SIZE;
  const visibleCollaborators = collaborators.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <DtoPanel className="p-5 sm:p-6">
      <Typography variant="overline">Colaboradores com recorrência</Typography>
      <Typography as="h2" variant="cardTitle" className="mt-2">
        Acompanhamento para treinamento e fidelização
      </Typography>
      <Typography variant="caption" className="mt-1">
        A leitura não representa ranking punitivo. Ela mostra repetição de gaps
        para apoiar atuação da gestão.
      </Typography>

      {visibleCollaborators.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleCollaborators.map((collaborator) => (
            <article
              key={collaborator.name}
              className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
            >
              <h3 className="break-words text-sm font-semibold text-[var(--shell-text)]">
                {collaborator.name}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-[var(--shell-muted)]">DTOs aplicadas</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoNumber(collaborator.applications)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Respostas NOK</dt><dd className="mt-1 font-semibold text-[var(--shell-danger)]">{formatDtoNumber(collaborator.nok)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Aplicações com NOK</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoNumber(collaborator.applicationsWithNok)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Aderência</dt><dd className="mt-1 font-semibold text-[var(--shell-accent)]">{formatDtoPercentage(collaborator.adherence)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-4 py-8 text-center text-sm text-[var(--shell-muted)]">
          Nenhum colaborador identificado nas aplicações deste recorte.
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--shell-surface-muted)] px-4 py-3">
          <p className="text-xs text-[var(--shell-muted)]">
            Página {normalizedPage} de {totalPages} · {collaborators.length} colaborador(es)
          </p>
          <div className="flex gap-2">
            <DtoButton size="sm" disabled={normalizedPage <= 1} onClick={() => setPage(normalizedPage - 1)}>Anterior</DtoButton>
            <DtoButton size="sm" disabled={normalizedPage >= totalPages} onClick={() => setPage(normalizedPage + 1)}>Próxima</DtoButton>
          </div>
        </div>
      ) : null}
    </DtoPanel>
  );
}

