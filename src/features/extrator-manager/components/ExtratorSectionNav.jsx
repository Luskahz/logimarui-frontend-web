"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

export const EXTRATOR_TAB_ITEMS = [
  { id: "operacoes", label: "Extracao" },
  { id: "scheduler", label: "Scheduler" },
  { id: "destinos", label: "Destinos" },
  { id: "solicitacoes", label: "Solicitacoes" },
];

export function normalizeExtratorTabId(value) {
  const normalizedValue = String(value || "");

  return EXTRATOR_TAB_ITEMS.some((tabItem) => tabItem.id === normalizedValue)
    ? normalizedValue
    : EXTRATOR_TAB_ITEMS[0].id;
}

function buildTabHref(tabId) {
  if (tabId === EXTRATOR_TAB_ITEMS[0].id) {
    return APP_ROUTES.EXTRATOR_MANAGER;
  }

  return `${APP_ROUTES.EXTRATOR_MANAGER}?aba=${tabId}`;
}

function getItemClassName(active) {
  return `inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-[var(--shell-accent)] text-white"
      : "border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)]"
  }`;
}

export default function ExtratorSectionNav({
  activeSection = "manager",
  activeTab = EXTRATOR_TAB_ITEMS[0].id,
  onTabChange,
}) {
  const normalizedActiveTab = normalizeExtratorTabId(activeTab);
  const isGlobalQueueActive = activeSection === "globalQueue";

  return (
    <nav aria-label="Navegacao do extrator" className="mt-6 flex flex-wrap gap-2">
      {EXTRATOR_TAB_ITEMS.map((tabItem) => {
        const active = !isGlobalQueueActive && normalizedActiveTab === tabItem.id;

        if (typeof onTabChange === "function") {
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => onTabChange(tabItem.id)}
              className={getItemClassName(active)}
            >
              {tabItem.label}
            </button>
          );
        }

        return (
          <Link
            key={tabItem.id}
            href={buildTabHref(tabItem.id)}
            className={getItemClassName(active)}
          >
            {tabItem.label}
          </Link>
        );
      })}

      <Link
        href={APP_ROUTES.EXTRATOR_GLOBAL_QUEUE}
        className={getItemClassName(isGlobalQueueActive)}
      >
        Fila global
      </Link>
    </nav>
  );
}
