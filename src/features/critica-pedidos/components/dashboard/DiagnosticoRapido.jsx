"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatNumber, formatWeight } from "@/features/critica-pedidos/utils/formatters";
export function DiagnosticoRapido({ data }) {
    const chartData = data.map((item) => ({
        nome: item.label.length > 16 ? `${item.label.slice(0, 15)}...` : item.label,
        peso: Math.round(item.pesoClienteKg),
        caixas: item.caixas,
        valor: item.valor,
    }));
    return (<section className="rounded-lg border border-[var(--line-soft)] bg-[var(--panel)] p-3 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
          Diagnostico rapido
        </h2>
        <span className="text-xs text-[var(--muted)]">maiores ofensores</span>
      </div>
      {data.length === 0 ? (<div className="grid h-44 place-items-center text-sm text-[var(--muted)]">
          Nenhum ofensor para os filtros atuais.
        </div>) : (<div className="mt-2 grid gap-3 xl:grid-cols-[1fr_16rem]">
          <div className="h-52 min-w-0">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false}/>
                <XAxis dataKey="nome" fontSize={10} stroke="#9ca8a6" tickLine={false}/>
                <YAxis fontSize={10} stroke="#9ca8a6" tickFormatter={(value) => `${Number(value) / 1000}t`} width={34}/>
                <Tooltip contentStyle={{
                background: "#091014",
                border: "1px solid rgba(70,211,200,0.35)",
                borderRadius: 8,
                color: "#fff",
            }} formatter={(value, name) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                const metricName = String(name ?? "");
                return [
                    metricName === "valor"
                        ? formatCurrency(numericValue)
                        : metricName === "peso"
                            ? formatWeight(numericValue)
                            : formatNumber(numericValue),
                    metricName,
                ];
            }}/>
                <Bar dataKey="peso" fill="#f2a900" radius={[5, 5, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ol className="grid gap-2">
            {data.slice(0, 4).map((item) => (<li className="rounded-md border border-[var(--line-soft)] bg-[var(--panel-soft)] px-3 py-2" key={item.clienteId}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white">{item.label}</span>
                  <span className="font-mono text-xs text-[var(--accent)]">{formatWeight(item.pesoClienteKg)}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.cidade} · {formatNumber(item.caixas)} cx · {formatCurrency(item.valor)}
                </p>
              </li>))}
          </ol>
        </div>)}
    </section>);
}
