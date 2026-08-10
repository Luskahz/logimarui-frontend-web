"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, ClipboardList, MapPinned } from "lucide-react";
import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import { dashboardMetadata } from "@/features/critica-pedidos/services/generatedDashboardRepository";

const tabs = [
  { href: "/critica-pedidos", label: "Critica", icon: ClipboardList, view: "critica" },
  { href: "/critica-pedidos/mapa", label: "Mapa", icon: MapPinned, view: "mapa" },
];

export default function CriticaPedidosShell({ activeView, children }) {
  const pathname = usePathname();
  const badgeLabel = dashboardMetadata.status.toLowerCase().includes("csv")
    ? "Dados mockados"
    : dashboardMetadata.status;

  return (
    <AuthenticatedShell
      contentClassName="mx-auto max-w-none"
      mainClassName="min-h-screen px-2 pb-4 pt-24 sm:px-4 sm:pb-6 sm:pt-28"
    >
      <section className="critica-pedidos-shell overflow-hidden rounded-[18px] border border-[var(--line-soft)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_24px_80px_rgba(2,6,23,0.22)]">
        <header className="sticky top-0 z-30 flex min-h-[3.15rem] items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[#061018]/95 px-3 shadow-[0_14px_35px_rgba(0,0,0,0.2)] backdrop-blur md:px-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="truncate text-[0.95rem] font-black uppercase leading-none text-[var(--accent)]">
                  Critica de pedidos
                </h1>
                <nav className="hidden items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.08em] md:flex">
                  {tabs.map((tab) => {
                    const active = activeView === tab.view || pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                      <Link
                        className={`inline-flex h-7 items-center gap-1.5 rounded-[3px] border px-2 transition ${
                          active
                            ? "border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.1)] text-[var(--accent)]"
                            : "border-transparent text-[var(--muted)] hover:border-[var(--line-soft)] hover:text-white"
                        }`}
                        href={tab.href}
                        key={tab.href}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <p className="mt-1 hidden text-[0.58rem] uppercase tracking-[0.16em] text-[var(--muted)] lg:block">
                Analise gerencial de PDVs e pedidos
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[0.62rem] text-[var(--muted-strong)]">
            <span className="hidden items-center gap-1.5 lg:flex">
              <CalendarDays size={12} className="text-[var(--muted)]" />
              19/05/2026 - 23/05/2026
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Bell size={12} className="text-[var(--muted)]" />
              Ultima atualizacao: {dashboardMetadata.lastUpdated}
            </span>
            <span className="rounded border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.08)] px-2 py-1 font-semibold text-[var(--cyan)]">
              {badgeLabel}
            </span>
          </div>
        </header>

        <div className="dashboard-scroll min-h-[calc(100vh-10.4rem)] overflow-auto">
          {children}
        </div>
      </section>
    </AuthenticatedShell>
  );
}
