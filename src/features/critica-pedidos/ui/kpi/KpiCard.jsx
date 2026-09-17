export function KpiCard({ label, value, unit, tone = "amber", icon, subtitle, }) {
    const toneClass = {
        amber: "text-[var(--accent)]",
        cyan: "text-[var(--cyan)]",
        green: "text-[var(--green)]",
        danger: "text-[var(--danger)]",
    }[tone];
    return (<article className="min-h-[4.25rem] rounded-[4px] border border-[var(--line-soft)] bg-[linear-gradient(145deg,#101d27,#08121a_66%,#071018)] p-2.5 shadow-[0_14px_35px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.55rem] font-bold uppercase leading-tight tracking-[0.06em] text-[var(--muted)]">
          {label}
        </p>
        {icon ? <div className="text-[var(--cyan)]">{icon}</div> : null}
      </div>
      <div className="mt-1.5 flex items-end gap-1.5">
        <strong className={`font-mono text-[1.08rem] font-black leading-none tracking-normal ${toneClass}`}>
          {value}
        </strong>
        {unit ? <span className="pb-0.5 text-xs font-medium text-[var(--muted)]">{unit}</span> : null}
      </div>
      <p className="mt-1 text-[0.55rem] leading-tight text-[var(--muted)]">{subtitle ?? "vs periodo ant."}</p>
    </article>);
}
