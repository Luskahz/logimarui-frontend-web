export default function AuthResultPanel({ result }) {
  if (!result?.items?.length) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_10px_30px_rgba(20,32,43,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        {result.title}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-black/6 bg-[var(--panel)] px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
