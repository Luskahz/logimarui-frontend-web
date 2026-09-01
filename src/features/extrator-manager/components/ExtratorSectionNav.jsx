"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/app/_config/routes";

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

function getItemClassName(active) {
  return `inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-[var(--shell-accent)] text-white"
      : "border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)]"
  }`;
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
    <nav aria-label={ariaLabel} className={className}>
      {items.map((tabItem) => {
        const active = normalizedActiveTab === tabItem.id;

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

        if (items !== EXTRATOR_TAB_ITEMS) {
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => onTabChange?.(tabItem.id)}
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
    </nav>
  );
}
