import Link from "next/link";
import { ChevronRightIcon } from "@/widgets/app-shell/ui/ShellIcons";

export default function AppBreadcrumbs({ items, mobile = false, onNavigate }) {
  return (
    <nav
      aria-label="Migalhas de pao"
      className={
        mobile
          ? "overflow-x-auto rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-3"
          : "min-w-0 overflow-x-auto rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-2"
      }
    >
      <ol className="flex min-w-max items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.href} className="inline-flex items-center gap-2">
              {index > 0 ? (
                <span className="text-[var(--shell-muted)]">
                  <ChevronRightIcon />
                </span>
              ) : null}

              {isCurrent ? (
                <span className="font-semibold text-[var(--shell-text)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`${mobile ? "whitespace-nowrap " : ""}text-[var(--shell-muted)] transition hover:text-[var(--shell-text)]`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
