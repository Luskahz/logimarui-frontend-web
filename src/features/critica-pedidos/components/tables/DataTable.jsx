"use client";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
export function DataTable({ title, data, columns, maxHeight = "24rem", compact = false, footer, }) {
    const [sort, setSort] = useState(null);
    const sortedData = useMemo(() => {
        if (!sort) {
            return data;
        }
        const column = columns.find((item) => item.key === sort.key);
        if (!column?.sortValue) {
            return data;
        }
        return [...data].sort((a, b) => {
            const left = column.sortValue?.(a);
            const right = column.sortValue?.(b);
            const multiplier = sort.direction === "asc" ? 1 : -1;
            if (typeof left === "number" && typeof right === "number") {
                return (left - right) * multiplier;
            }
            return String(left ?? "").localeCompare(String(right ?? ""), "pt-BR", { numeric: true }) * multiplier;
        });
    }, [columns, data, sort]);
    const toggleSort = (column) => {
        if (!column.sortValue) {
            return;
        }
        setSort((current) => current?.key === column.key
            ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
            : { key: column.key, direction: "desc" });
    };
    return (<section className="overflow-hidden rounded-[4px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex min-h-9 items-center justify-between border-b border-[var(--line-soft)] bg-[#08141d] px-2.5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--cyan)]">{title}</h2>
        <span className="font-mono text-[0.66rem] text-[var(--muted)]">Total: {data.length}</span>
      </div>
      <div className="dashboard-scroll overflow-auto" style={{ maxHeight }}>
        {data.length === 0 ? (<div className="grid min-h-36 place-items-center px-4 py-8 text-center text-sm text-[var(--muted)]">
            Nenhum registro encontrado para os filtros atuais.
          </div>) : (<table className="w-full min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {columns.map((column) => (<th className={[
                    "sticky top-0 z-10 whitespace-nowrap border-b border-[var(--line)] bg-[#0f1d27] px-2 text-[0.58rem] font-bold uppercase tracking-[0.05em] text-[var(--muted)]",
                    compact ? "py-1.5" : "py-2",
                    column.align === "right" ? "text-right" : "",
                    column.align === "center" ? "text-center" : "",
                ].join(" ")} key={column.key} style={{ width: column.width }}>
                    {column.sortValue ? (<button className={[
                        "inline-flex w-full items-center gap-1 text-current transition hover:text-white",
                        column.align === "right" ? "justify-end" : column.align === "center" ? "justify-center" : "justify-start",
                    ].join(" ")} onClick={() => toggleSort(column)} type="button">
                        <span>{column.header}</span>
                        {sort?.key === column.key ? (sort.direction === "asc" ? <ArrowUp size={11}/> : <ArrowDown size={11}/>) : (<ChevronsUpDown size={11}/>)}
                      </button>) : (column.header)}
                  </th>))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (<tr className="group" key={rowIndex}>
                  {columns.map((column) => (<td className={[
                        "whitespace-nowrap border-b border-[var(--line-soft)] px-2 text-[0.66rem] text-[var(--foreground)] transition group-hover:bg-[rgba(0,212,255,0.06)]",
                        compact ? "py-1.5" : "py-2",
                        column.align === "right" ? "text-right font-mono" : "",
                        column.align === "center" ? "text-center" : "",
                    ].join(" ")} key={column.key}>
                      {column.render(row, rowIndex)}
                    </td>))}
                </tr>))}
            </tbody>
            {footer ? <tfoot>{footer}</tfoot> : null}
          </table>)}
      </div>
    </section>);
}
