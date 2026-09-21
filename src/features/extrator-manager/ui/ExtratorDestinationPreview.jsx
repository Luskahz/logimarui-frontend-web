import { buildDestinationPreviewPath } from "@/features/extrator-manager/lib/extratorDestinations";

export default function ExtratorDestinationPreview({ form, templateKinds }) {
  const examples = templateKinds.map(({ label, templateKey }) => [
    label,
    buildDestinationPreviewPath(form, templateKey),
  ]);

  return (
    <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--shell-text)]">
        Exemplos de destino
      </p>
      <div className="mt-3 space-y-2">
        {examples.map(([label, path]) => (
          <p
            key={label}
            className="break-words rounded-xl bg-[var(--shell-surface-strong)] px-3 py-2 font-mono text-xs leading-5 text-[var(--shell-muted)]"
          >
            <span className="font-semibold text-[var(--shell-text)]">
              {label}:{" "}
            </span>
            {path}
          </p>
        ))}
      </div>
    </div>
  );
}
