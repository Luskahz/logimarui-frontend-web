"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  formatDtoNumber,
  formatDtoPercentage,
  formatPercentagePointDelta,
} from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoTimelinePoint,
  DtoTrend,
} from "@/features/dpo/lib/dtoTypes";
import {
  DtoBadge,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

interface TooltipEntry {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number | string | null;
}

function DtoChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-44 rounded-2xl border border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] p-3 text-xs shadow-xl">
      <p className="font-semibold text-[var(--shell-text)]">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((item) => (
          <p
            key={item.dataKey || item.name}
            className="flex items-center justify-between gap-4 text-[var(--shell-muted)]"
          >
            <span>{item.name}</span>
            <strong className="text-[var(--shell-text)]">
              {item.dataKey === "adherence"
                ? formatDtoPercentage(
                    item.value === null || item.value === undefined
                      ? null
                      : Number(item.value),
                  )
                : formatDtoNumber(
                    item.value === null || item.value === undefined
                      ? null
                      : Number(item.value),
                  )}
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function DtoTrendChart({
  hasDateColumn,
  timeline,
  trend,
}: {
  hasDateColumn: boolean;
  timeline: DtoTimelinePoint[];
  trend: DtoTrend | null;
}) {
  return (
    <DtoPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="overline">Evolução</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Aderência e volume por período
          </Typography>
          <Typography variant="caption" className="mt-1">
            A granularidade muda entre dia, semana e mês conforme o intervalo
            disponível.
          </Typography>
        </div>

        {trend ? (
          <DtoBadge
            tone={
              trend.direction === "worsening"
                ? "danger"
                : trend.direction === "improving"
                  ? "accent"
                  : "default"
            }
          >
            {trend.direction === "worsening" ? (
              <TrendingDown aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            ) : trend.direction === "improving" ? (
              <TrendingUp aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            ) : (
              <Minus aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            )}
            {formatPercentagePointDelta(trend.delta)}
          </DtoBadge>
        ) : null}
      </div>

      {timeline.length > 0 ? (
        <div
          role="img"
          aria-label="Gráfico temporal de aderência e quantidade de aplicações"
          className="mt-5 h-72 min-w-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              accessibilityLayer
              data={timeline}
              margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--shell-line)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                minTickGap={18}
                tick={{ fill: "var(--shell-muted)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="adherence"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                width={42}
                tick={{ fill: "var(--shell-muted)", fontSize: 11 }}
              />
              <YAxis
                yAxisId="applications"
                orientation="right"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={30}
                tick={{ fill: "var(--shell-muted)", fontSize: 11 }}
              />
              <Tooltip content={<DtoChartTooltip />} />
              <Bar
                yAxisId="applications"
                dataKey="applications"
                name="Aplicações"
                fill="var(--shell-accent-soft)"
                stroke="var(--shell-accent)"
                radius={[6, 6, 0, 0]}
                maxBarSize={34}
              />
              <Line
                yAxisId="adherence"
                type="monotone"
                dataKey="adherence"
                name="Aderência"
                connectNulls={false}
                stroke="var(--shell-accent)"
                strokeWidth={3}
                dot={{ r: 3, fill: "var(--shell-surface)", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-4 py-8 text-center text-sm leading-6 text-[var(--shell-muted)]">
          {hasDateColumn
            ? "Não há datas válidas suficientes para montar a evolução temporal deste recorte."
            : "O campo de data não foi identificado com segurança; nenhum gráfico temporal foi fabricado."}
        </div>
      )}
    </DtoPanel>
  );
}
