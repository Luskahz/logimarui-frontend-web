"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function DtoEChart({
  ariaLabel,
  className = "h-72",
  option,
}: {
  ariaLabel: string;
  className?: string;
  option: EChartsOption;
}) {
  return (
    <div role="img" aria-label={ariaLabel} className={className}>
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        opts={{ renderer: "svg" }}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
