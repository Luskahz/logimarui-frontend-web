import type { DtoPlanningCalendarEntry, DtoPlanningOccurrenceStatus } from "@/features/dpo/lib/dtoPlanning";

const STATUS_LABELS: Record<DtoPlanningOccurrenceStatus, string> = {
  completed: "Realizado",
  pending: "Pendente",
  missed: "Não realizado",
  upcoming: "Programado",
};

const STATUS_COLORS: Record<DtoPlanningOccurrenceStatus, string> = {
  completed: "#2dd4bf",
  pending: "#fbbf24",
  missed: "#fb7185",
  upcoming: "#94a3b8",
};

function dayKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function fitText(context: CanvasRenderingContext2D, value: string, width: number): string {
  if (context.measureText(value).width <= width) return value;
  let result = value;
  while (result.length > 1 && context.measureText(`${result}…`).width > width) result = result.slice(0, -1);
  return `${result}…`;
}

export function startOfPlanningWeek(value: Date): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function exportPlanningWeekPng({
  entries,
  formName,
  weekStart,
}: {
  entries: DtoPlanningCalendarEntry[];
  formName: string;
  weekStart: Date;
}) {
  const width = 1600;
  const height = 900;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem do calendário.");

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEnd = days[6];
  const periodEntries = entries.filter((entry) => entry.occurrence.date >= weekStart && entry.occurrence.date < addDays(weekEnd, 1));

  context.fillStyle = "#0b1420";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#f8fafc";
  context.font = "700 34px Arial";
  context.fillText(formName, 56, 62);
  context.fillStyle = "#5eead4";
  context.font = "700 17px Arial";
  context.fillText("PLANEJAMENTO DE APLICAÇÕES", 56, 94);
  context.fillStyle = "#94a3b8";
  context.font = "18px Arial";
  context.fillText(`${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`, 56, 124);

  const calendarX = 56;
  const calendarY = 154;
  const calendarWidth = width - 112;
  const calendarHeight = 300;
  const columnWidth = calendarWidth / 7;
  days.forEach((day, index) => {
    const x = calendarX + index * columnWidth;
    context.fillStyle = "#142131";
    context.fillRect(x + 2, calendarY, columnWidth - 4, calendarHeight);
    context.fillStyle = "#94a3b8";
    context.font = "700 15px Arial";
    context.fillText(day.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase(), x + 16, calendarY + 28);
    context.fillStyle = "#f8fafc";
    context.font = "700 25px Arial";
    context.fillText(String(day.getDate()), x + 16, calendarY + 62);

    const dayEntries = periodEntries.filter((entry) => dayKey(entry.occurrence.date) === dayKey(day));
    dayEntries.slice(0, 5).forEach((entry, entryIndex) => {
      const rowY = calendarY + 94 + entryIndex * 38;
      context.fillStyle = STATUS_COLORS[entry.status];
      context.beginPath();
      context.arc(x + 22, rowY - 5, 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#e2e8f0";
      context.font = "16px Arial";
      context.fillText(fitText(context, entry.targetName, columnWidth - 48), x + 38, rowY);
    });
    if (dayEntries.length > 5) {
      context.fillStyle = "#94a3b8";
      context.font = "14px Arial";
      context.fillText(`+${dayEntries.length - 5} planejamento(s)`, x + 16, calendarY + 284);
    }
  });

  context.fillStyle = "#f8fafc";
  context.font = "700 23px Arial";
  context.fillText("Planejamento da semana", 56, 500);
  context.fillStyle = "#64748b";
  context.fillRect(56, 520, width - 112, 1);
  context.fillStyle = "#94a3b8";
  context.font = "700 14px Arial";
  context.fillText("DIA", 72, 550);
  context.fillText("COLABORADOR / ALVO", 230, 550);
  context.fillText("APLICADOR", 760, 550);
  context.fillText("SITUAÇÃO", 1320, 550);

  periodEntries.slice(0, 8).forEach((entry, index) => {
    const y = 592 + index * 36;
    context.fillStyle = index % 2 ? "#101c2a" : "#142131";
    context.fillRect(56, y - 25, width - 112, 34);
    context.fillStyle = "#e2e8f0";
    context.font = "15px Arial";
    context.fillText(entry.occurrence.date.toLocaleDateString("pt-BR"), 72, y - 3);
    context.fillText(fitText(context, entry.targetName, 480), 230, y - 3);
    context.fillText(fitText(context, entry.plan.title, 500), 760, y - 3);
    context.fillStyle = STATUS_COLORS[entry.status];
    context.fillText(STATUS_LABELS[entry.status], 1320, y - 3);
  });
  if (periodEntries.length > 8) {
    context.fillStyle = "#94a3b8";
    context.font = "14px Arial";
    context.fillText(`Mais ${periodEntries.length - 8} item(ns) nesta semana.`, 56, 886);
  }

  const link = document.createElement("a");
  link.download = `planejamento-${dayKey(weekStart)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
