"use client";

import { SelectInput } from "@/features/extrator-manager/components/ExtratorManagerControls";
import { ExtratorActionButton as ActionButton } from "@/features/extrator-manager/components/ExtratorPageShell";

export const EXTRATOR_PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ExtratorPagination({
  itemLabel = "itens",
  onPageChange,
  onPageSizeChange,
  page = 1,
  pageSize = 10,
  showPageSize = true,
  totalItems = 0,
  totalPages = 1,
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
      <div className="text-sm text-[var(--shell-muted)]">
        <p>
          Pagina {page} de {Math.max(1, totalPages)}
        </p>
        <p className="mt-1 text-xs">
          {totalItems} {itemLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {showPageSize ? (
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-[var(--shell-muted)]">
              Cards por pagina
            </span>
            <SelectInput
              value={String(pageSize)}
              onChange={(event) =>
                onPageSizeChange?.(Number.parseInt(event.target.value, 10))
              }
              className="min-w-24 py-2"
            >
              {EXTRATOR_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </label>
        ) : null}
        <ActionButton
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Anterior
        </ActionButton>
        <ActionButton
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Proxima
        </ActionButton>
      </div>
    </div>
  );
}
