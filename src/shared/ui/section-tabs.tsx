"use client";

import Link from "next/link";

export type SectionTabItem = {
  id: string;
  label: string;
};

type SectionTabsProps = {
  activeValue: string;
  ariaLabel: string;
  className?: string;
  getHref?: (value: string) => string;
  items: readonly SectionTabItem[];
  onValueChange?: (value: string) => void;
};

function getItemClassName(active: boolean) {
  return `inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-[var(--shell-accent)] text-white"
      : "border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)]"
  }`;
}

export function SectionTabs({
  activeValue,
  ariaLabel,
  className = "flex flex-wrap gap-2",
  getHref,
  items,
  onValueChange,
}: SectionTabsProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map((item) => {
        const classNames = getItemClassName(activeValue === item.id);

        if (onValueChange) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onValueChange(item.id)}
              className={classNames}
            >
              {item.label}
            </button>
          );
        }

        if (getHref) {
          return (
            <Link key={item.id} href={getHref(item.id)} className={classNames}>
              {item.label}
            </Link>
          );
        }

        return null;
      })}
    </nav>
  );
}
