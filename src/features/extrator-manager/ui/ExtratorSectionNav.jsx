"use client";

import { APP_ROUTES } from "@/shared/config/routes";
import { SectionTabs } from "@/shared/ui/section-tabs";

export const EXTRATOR_TAB_ITEMS = [
  { id: "operacoes", label: "Extracao" },
  { id: "scheduler", label: "Scheduler" },
  { id: "destinos", label: "Destinos" },
  { id: "solicitacoes", label: "Solicitacoes" },
  { id: "globalQueue", label: "Fila global" },
];

export function normalizeExtratorTabId(value, items = EXTRATOR_TAB_ITEMS) {
  const normalizedValue = String(value || "");

  return items.some((tabItem) => tabItem.id === normalizedValue)
    ? normalizedValue
    : items[0].id;
}

function buildTabHref(tabId) {
  if (tabId === EXTRATOR_TAB_ITEMS[0].id) {
    return APP_ROUTES.EXTRATOR_MANAGER;
  }

  return `${APP_ROUTES.EXTRATOR_MANAGER}?aba=${tabId}`;
}

export default function ExtratorSectionNav({
  activeTab = EXTRATOR_TAB_ITEMS[0].id,
  onTabChange,
  items = EXTRATOR_TAB_ITEMS,
  ariaLabel = "Navegacao do extrator",
  className = "mt-6 flex flex-wrap gap-2",
}) {
  const normalizedActiveTab = normalizeExtratorTabId(activeTab, items);

  return (
    <SectionTabs
      activeValue={normalizedActiveTab}
      ariaLabel={ariaLabel}
      className={className}
      getHref={typeof onTabChange === "function" ? undefined : buildTabHref}
      items={items}
      onValueChange={onTabChange}
    />
  );
}
