"use client";
import { Filter, RotateCcw } from "lucide-react";
export function FilterPanel({ title = "Filtros", fields, filters, options, onChange, onClear, variant = "panel", }) {
    const setValue = (key, value) => {
        onChange((currentFilters) => ({
            ...currentFilters,
            [key]: value,
        }));
    };
    const renderField = (field) => {
        const values = field.optionsKey ? options[field.optionsKey] : [];
        const value = filters[field.key];
        return (<div className="grid min-w-0 gap-1" key={field.key}>
        <span className="truncate text-[0.57rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
          {field.label}
        </span>
        {field.type === "text" ? (<input aria-label={field.label} className="h-7 min-w-0 rounded-[3px] border border-[var(--line)] bg-[#071018] px-2 text-[0.66rem] text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--cyan)]" onChange={(event) => setValue(field.key, event.target.value)} placeholder={field.placeholder ?? field.label} type="text" value={typeof value === "string" ? value : ""}/>) : null}
        {field.type === "select" || field.type === "multiselect" ? (<select aria-label={field.label} className="h-7 min-w-0 rounded-[3px] border border-[var(--line)] bg-[#071018] px-2 text-[0.66rem] text-white outline-none transition focus:border-[var(--cyan)]" onChange={(event) => {
                    if (field.type === "multiselect") {
                        setValue(field.key, (event.target.value ? [event.target.value] : []));
                    }
                    else {
                        setValue(field.key, event.target.value);
                    }
                }} value={Array.isArray(value) ? value[0] ?? "" : typeof value === "string" ? value : ""}>
            <option value="">Todos</option>
            {values.map((option) => (<option key={option} value={option}>
                {option}
              </option>))}
          </select>) : null}
      </div>);
    };
    if (variant === "inline") {
        return (<section className="rounded-[4px] border border-[var(--line-soft)] bg-[var(--panel)] px-2.5 py-2 shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
        <div className="grid items-end gap-2 md:grid-cols-[repeat(2,minmax(9rem,14rem))_2rem]">
          {fields.map(renderField)}
          <button aria-label="Limpar filtros" className="grid h-7 w-7 place-items-center rounded-[3px] border border-[var(--line-soft)] text-[var(--muted)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]" onClick={onClear} type="button">
            <RotateCcw size={13}/>
          </button>
        </div>
      </section>);
    }
    return (<section className="rounded-[4px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[#08141d] px-2.5">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-[var(--muted)]"/>
          <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted-strong)]">{title}</h2>
        </div>
        <span className="text-[0.6rem] text-[var(--muted)]">{"<<"}</span>
      </div>
      <div className="dashboard-scroll grid max-h-[calc(100vh-7.5rem)] gap-2 overflow-auto p-2.5">{fields.map(renderField)}</div>
      <div className="border-t border-[var(--line-soft)] p-2.5">
        <button className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[3px] border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[var(--cyan)] transition hover:border-[var(--cyan)]" onClick={onClear} type="button">
          <RotateCcw size={12}/>
          Limpar filtros
        </button>
      </div>
    </section>);
}
