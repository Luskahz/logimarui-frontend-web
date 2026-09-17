"use client";
import { BarChart3, Bell, CalendarDays, ChevronLeft, ClipboardList, FileText, Home, LayoutDashboard, MapPinned, Moon, Package, Route, Settings, Store, Truck, UserCircle, Users, } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navItems = [
    { href: "/critica-pedidos", label: "Visao geral", icon: Home },
    { href: "/critica-pedidos", label: "Critica", icon: ClipboardList },
    { href: "/critica-pedidos/mapa", label: "Mapa", icon: MapPinned },
    { href: "/critica-pedidos", label: "Painel de rotas", icon: Route },
    { href: "/critica-pedidos", label: "Pedidos", icon: FileText },
    { href: "/critica-pedidos/mapa", label: "PDVs", icon: Store },
    { href: "/critica-pedidos", label: "Clientes", icon: Users },
    { href: "/critica-pedidos", label: "Produtos", icon: Package },
    { href: "/critica-pedidos", label: "Analises", icon: BarChart3 },
    { href: "/critica-pedidos", label: "Relatorios", icon: LayoutDashboard },
    { href: "/critica-pedidos", label: "Alertas", icon: Bell, badge: "12" },
    { href: "/critica-pedidos", label: "Cadastros", icon: Truck },
    { href: "/critica-pedidos", label: "Configuracoes", icon: Settings },
];
export function DashboardShell({ title, lastUpdated, status, children, }) {
    const pathname = usePathname();
    const isMap = pathname.startsWith("/critica-pedidos/mapa");
    const badgeLabel = status.toLowerCase().includes("csv") ? "Dados mockados" : status;
    return (<div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[4.6rem] border-r border-[var(--line-soft)] bg-[#050b11]/96 shadow-[12px_0_35px_rgba(0,0,0,0.22)] md:flex md:flex-col">
        <div className="grid h-[3.15rem] place-items-center border-b border-[var(--line-soft)] px-2">
          <div className="leading-none">
            <p className="text-[0.76rem] font-black italic tracking-normal text-white">
              {isMap ? "LOGIMARUI" : "ambev"}
            </p>
            <p className="mt-0.5 text-[0.46rem] font-semibold uppercase tracking-[0.18em] text-[var(--cyan)]">
              {isMap ? "ANALITICA" : "LOGISTICA"}
            </p>
          </div>
        </div>
        <nav className="dashboard-scroll flex-1 space-y-1 overflow-y-auto px-1.5 py-2">
          {navItems.map((item) => {
            const active = item.label === "Mapa" ? isMap : !isMap && item.label === "Critica";
            const Icon = item.icon;
            return (<Link aria-label={item.label} className={[
                    "group relative flex h-8 items-center justify-center rounded-[3px] border border-transparent text-[var(--muted)] transition",
                    active
                        ? "border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.1)] text-[var(--accent)]"
                        : "hover:border-[var(--line-soft)] hover:bg-white/[0.035] hover:text-white",
                ].join(" ")} href={item.href} key={`${item.label}-${item.href}`} title={item.label}>
                <Icon size={15} strokeWidth={1.8}/>
                {active ? <span className="absolute left-[-0.38rem] h-5 w-[2px] rounded-r bg-[var(--accent)]"/> : null}
                {item.badge ? (<span className="absolute right-0.5 top-0.5 rounded-full bg-[var(--accent)] px-1 text-[0.5rem] font-bold leading-[0.72rem] text-[#061018]">
                    {item.badge}
                  </span>) : null}
              </Link>);
        })}
        </nav>
        <button className="m-1.5 flex h-8 items-center justify-center gap-1 rounded-[3px] border border-[var(--line-soft)] text-[0.55rem] font-semibold uppercase text-[var(--muted)]" type="button">
          <ChevronLeft size={12}/>
          Recolher
        </button>
      </aside>

      <section className="min-h-screen md:pl-[4.6rem]">
        <header className="sticky top-0 z-30 flex h-[3.15rem] items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[#061018]/95 px-3 shadow-[0_14px_35px_rgba(0,0,0,0.2)] backdrop-blur md:px-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="truncate text-[0.95rem] font-black uppercase leading-none text-[var(--accent)]">
                  {title}
                </h1>
                <nav className="hidden items-center gap-4 text-[0.63rem] font-bold uppercase tracking-[0.08em] md:flex">
                  <Link className={!isMap ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-white"} href="/critica-pedidos">
                    Critica
                  </Link>
                  <Link className={isMap ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-white"} href="/critica-pedidos/mapa">
                    Mapa
                  </Link>
                </nav>
              </div>
              <p className="mt-1 hidden text-[0.58rem] uppercase tracking-[0.16em] text-[var(--muted)] lg:block">
                Analise gerencial de PDVs e pedidos
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[0.62rem] text-[var(--muted-strong)]">
            <span className="hidden items-center gap-1.5 lg:flex">
              <CalendarDays size={12} className="text-[var(--muted)]"/>
              19/05/2026 - 23/05/2026
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Bell size={12} className="text-[var(--muted)]"/>
              Ultima atualizacao: {lastUpdated}
            </span>
            <span className="rounded border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.08)] px-2 py-1 font-semibold text-[var(--cyan)]">
              {badgeLabel}
            </span>
            <button aria-label="Alternar tema" className="hidden h-7 w-7 place-items-center rounded border border-[var(--line-soft)] text-[var(--muted)] md:grid" type="button">
              <Moon size={13}/>
            </button>
            <div className="hidden items-center gap-2 border-l border-[var(--line-soft)] pl-2 md:flex">
              <div className="text-right leading-tight">
                <p className="text-[0.62rem] font-semibold text-white">Carlos Lima</p>
                <p className="text-[0.52rem] text-[var(--muted)]">Operacao</p>
              </div>
              <UserCircle size={22} className="text-[var(--muted)]"/>
            </div>
          </div>
        </header>

        <div className="dashboard-scroll min-h-[calc(100vh-3.15rem)] overflow-auto">{children}</div>
      </section>
    </div>);
}
