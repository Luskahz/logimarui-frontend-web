"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatRoles } from "@/features/auth/lib/authFormatters";
import { buildGatewayUrl } from "@/features/app-shell/lib/gatewayUrl";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";
import { useHomeSession } from "@/features/home/hooks/useHomeSession";
import { useUiTheme } from "@/features/ui/hooks/useUiTheme";

const SIDEBAR_ITEMS = [
  {
    id: "favorites",
    label: "Favoritos",
    description: "Atalhos definidos pelo proprio usuario.",
    type: "panel",
    icon: "star",
  },
  {
    id: "dpo",
    label: "DPO",
    description: "Auditoria, casa de pilares e questionarios.",
    type: "link",
    href: "/dpo",
    icon: "house",
  },
  {
    id: "sustainability-kpis",
    label: "KPI's Sustentabilidade",
    description: "Indicadores e leitura da frente sustentavel.",
    type: "panel",
    icon: "chart",
  },
  {
    id: "meetings",
    label: "Reunioes",
    description: "Ritos, agendas e acompanhamento recorrente.",
    type: "panel",
    icon: "calendar",
  },
  {
    id: "action-plans",
    label: "Planos de Acao",
    description: "Registro e desdobramento das acoes operacionais.",
    type: "panel",
    icon: "clipboard",
  },
  {
    id: "services",
    label: "Servicos",
    description: "Acessos rapidos aos servicos internos.",
    type: "panel",
    icon: "service",
  },
];

const SERVICE_ITEMS = [
  {
    id: "gerenciador-extracao",
    label: "Gerenciador Extracao",
    href: "/gerenciador-extracao/",
  },
  {
    id: "gerenciador-database",
    label: "Gerenciador Database",
    description: "Monitoring e backup relacionados ao banco de dados.",
    children: [
      {
        id: "gerenciador-database-monitoring",
        label: "Monitoring",
        href: "/gerenciador-database/monitoring/",
      },
      {
        id: "gerenciador-database-backup",
        label: "Backup",
        href: "/gerenciador-database/backup/",
      },
    ],
  },
  {
    id: "n8n-interno",
    label: "N8N interno",
    href: "/n8n/",
  },
  {
    id: "evolution-interno",
    label: "Evolution Interno",
    href: "/evolution/",
  },
];

function IconButton({
  active = false,
  children,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 hover:border-[color:var(--shell-text)] hover:text-[var(--shell-text)] ${
        active
          ? "border-[color:var(--shell-contrast)] bg-[var(--shell-contrast)] text-[var(--shell-contrast-ink)]"
          : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function MenuActionButton({
  children,
  disabled = false,
  label,
  onClick,
  tone = "default",
  trailing,
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--shell-danger)] hover:bg-[var(--shell-danger-bg)]"
      : "text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${toneClass}`}
    >
      <span className="inline-flex items-center gap-3">
        {children}
        {label}
      </span>
      {trailing}
    </button>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
      <circle cx="11" cy="11" r="6.5" strokeWidth="1.8" />
      <path d="m16 16 4 4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m9 6 6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <rect x="4" y="6" width="16" height="14" rx="2.5" strokeWidth="1.8" />
      <path d="M8 4v4M16 4v4M4 10h16" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M5 19V11M12 19V7M19 19V4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19h16" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <rect x="6" y="5" width="12" height="15" rx="2.5" strokeWidth="1.8" />
      <path d="M9 5.5h6a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 5.5Z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 10h6M9 14h6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BreadcrumbSeparator() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current">
      <path d="m9 6 6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path
        d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.5l-5.3 2.8 1.01-5.9L3.42 9.23l5.93-.86L12 3Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M4 11.5 12 5l8 6.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5V19h11v-8.5" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 19v-4.5h4V19" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <rect x="5" y="4" width="14" height="6" rx="2" strokeWidth="1.8" />
      <rect x="5" y="14" width="14" height="6" rx="2" strokeWidth="1.8" />
      <path d="M9 7h.01M9 17h.01" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m14 8 4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 fill-none stroke-current ${spinning ? "animate-spin" : ""}`}
    >
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M20 4v6h-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path
        d="M20 15.5A7.5 7.5 0 0 1 10.5 6a8 8 0 1 0 9.5 9.5Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildAvatarLabel(profile) {
  const nameSource = [
    profile?.username,
    profile?.name,
    profile?.displayName,
    profile?.fullName,
  ].find((value) => typeof value === "string" && value.trim());

  if (nameSource) {
    return nameSource.trim().slice(0, 2).toUpperCase();
  }

  return "LG";
}

function resolveProfileName(profile) {
  const nameSource = [
    profile?.username,
    profile?.name,
    profile?.displayName,
    profile?.fullName,
  ].find((value) => typeof value === "string" && value.trim());

  return nameSource ? nameSource.trim() : "Conta Logimarui";
}

function resolveAvatarUrl(profile) {
  const imageSource = [
    profile?.avatarUrl,
    profile?.photoUrl,
    profile?.imageUrl,
    profile?.profileImageUrl,
  ].find((value) => typeof value === "string" && value.trim());

  return imageSource ? imageSource.trim() : "";
}

function getSidebarPanelContent(itemId) {
  switch (itemId) {
    case "favorites":
      return {
        eyebrow: "Favoritos",
        title: "Escolha futura",
        body:
          "Este espaco vai receber a selecao das telas favoritas do usuario. Por enquanto, nao existe nenhuma aba configurada.",
      };
    case "sustainability-kpis":
      return {
        eyebrow: "KPI's Sustentabilidade",
        title: "Modulo em definicao",
        body:
          "Este espaco vai concentrar os indicadores e a leitura operacional da frente de sustentabilidade.",
      };
    case "meetings":
      return {
        eyebrow: "Reunioes",
        title: "Modulo em definicao",
        body:
          "Aqui vao entrar os ritos, agendas e registros recorrentes acompanhados pela operacao.",
      };
    case "action-plans":
      return {
        eyebrow: "Planos de Acao",
        title: "Modulo em definicao",
        body:
          "Este bloco vai receber os planos de acao e os desdobramentos que hoje ainda nao estao modelados.",
      };
    case "services":
      return {
        eyebrow: "Servicos",
        title: "Acessos internos",
        body:
          "Os links abaixo vao centralizar o acesso rapido aos servicos internos da operacao.",
      };
    default:
      return null;
  }
}

function renderSidebarItemIcon(icon) {
  switch (icon) {
    case "star":
      return <StarIcon />;
    case "house":
      return <HouseIcon />;
    case "chart":
      return <ChartIcon />;
    case "calendar":
      return <CalendarIcon />;
    case "clipboard":
      return <ClipboardIcon />;
    case "service":
      return <ServiceIcon />;
    default:
      return <ChevronRightIcon />;
  }
}

function formatBreadcrumbLabel(segment) {
  return String(segment ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBreadcrumbs(pathname) {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean);
  const items = [
    {
      href: "/home",
      label: "Home",
    },
  ];

  if (segments.length === 0 || segments[0] === "home") {
    return items;
  }

  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;

    if (segment === "dpo") {
      items.push({
        href: currentPath,
        label: "DPO",
      });
      continue;
    }

    if (segments[0] === "dpo") {
      const pillar = getDpoPillarBySlug(segment);

      items.push({
        href: currentPath,
        label: pillar?.label || formatBreadcrumbLabel(segment),
      });
      continue;
    }

    items.push({
      href: currentPath,
      label: formatBreadcrumbLabel(segment),
    });
  }

  return items;
}

function Avatar({
  imageUrl,
  label,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
}) {
  if (imageUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--shell-surface-muted)] ${sizeClassName}`}
      >
        {/* Origem da foto ainda e dinamica; manter img evita acoplar next/image a hosts nao definidos. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[var(--shell-contrast)] font-semibold text-[var(--shell-contrast-ink)] ${sizeClassName} ${textClassName}`}
    >
      {label}
    </span>
  );
}

function ShellLoadingState() {
  return (
    <div className="home-shell">
      <div className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-[72px] animate-pulse rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] shadow-[0_18px_60px_rgba(20,32,43,0.08)]" />
        </div>
      </div>

      <main className="min-h-screen px-4 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-32">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-5 shadow-[0_18px_60px_rgba(20,32,43,0.08)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="h-72 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
              <div className="h-32 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  active = false,
  children,
  description,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-[22px] border px-3.5 py-3 text-left transition ${
        active
          ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
          : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
      }`}
    >
      <span className="min-w-0">
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--shell-text)]">
          {children}
          {label}
        </span>
        <span className="mt-1.5 block text-[13px] leading-5 text-[var(--shell-muted)]">
          {description}
        </span>
      </span>
      <span className="mt-0.5 shrink-0 text-[var(--shell-muted)]">
        <ChevronRightIcon />
      </span>
    </button>
  );
}

function ServicePanelLink({
  description,
  href,
  label,
}) {
  return (
    <a
      href={buildGatewayUrl(href)}
      className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3.5 py-3 text-sm font-semibold text-[var(--shell-text)] transition hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface)]"
    >
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="mt-1 block text-[12px] font-normal leading-5 text-[var(--shell-muted)]">
            {description}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-[var(--shell-muted)]">
        <ChevronRightIcon />
      </span>
    </a>
  );
}

export default function AuthenticatedShell({ children }) {
  const pathname = usePathname();
  const {
    error,
    isLoggingOut,
    isRefreshing,
    logout,
    profile,
    refreshSession,
    roles,
    session,
    status,
  } = useHomeSession();
  const { isDark, toggleTheme } = useUiTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState("");
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  const avatarLabel = useMemo(() => buildAvatarLabel(profile), [profile]);
  const avatarUrl = useMemo(() => resolveAvatarUrl(profile), [profile]);
  const profileHeading = useMemo(() => resolveProfileName(profile), [profile]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const roleSummary = useMemo(() => formatRoles(roles), [roles]);
  const showHeader = !headerHidden || sidebarOpen || profileMenuOpen;
  const isDpoRoute = pathname.startsWith("/dpo");
  const overlayZClass = sidebarOpen ? "z-[55]" : "z-30";
  const sidebarPanelContent = useMemo(
    () => getSidebarPanelContent(activeSidebarPanel),
    [activeSidebarPanel],
  );

  const shellState = useMemo(() => ({
    error,
    isDark,
    isLoggingOut,
    isRefreshing,
    logout,
    profile,
    profileHeading,
    refreshSession,
    roleSummary,
    roles,
    session,
    status,
  }), [
    error,
    isDark,
    isLoggingOut,
    isRefreshing,
    logout,
    profile,
    profileHeading,
    refreshSession,
    roleSummary,
    roles,
    session,
    status,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const scrollDelta = currentScrollY - previousScrollY;

      if (currentScrollY <= 24) {
        setHeaderHidden(false);
      } else if (scrollDelta > 8) {
        setHeaderHidden(true);
      } else if (scrollDelta < -8) {
        setHeaderHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (status === "loading") {
    return <ShellLoadingState />;
  }

  const closePanels = () => {
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    setActiveSidebarPanel("");
  };

  const renderedChildren = typeof children === "function"
    ? children(shellState)
    : children;

  return (
    <div className="home-shell">
      {(sidebarOpen || profileMenuOpen) ? (
        <button
          type="button"
          aria-label="Fechar paineis"
          onClick={closePanels}
          className={`fixed inset-0 bg-[var(--shell-overlay)] backdrop-blur-[1px] ${overlayZClass}`}
        />
      ) : null}

      <header
        className={`fixed inset-x-0 top-0 z-50 px-4 py-4 transition-transform duration-300 sm:px-6 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] px-4 py-4 shadow-[0_18px_60px_rgba(20,32,43,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <IconButton
                active={sidebarOpen}
                label="Abrir menu lateral"
                onClick={() => {
                  setSidebarOpen((current) => !current);
                  setProfileMenuOpen(false);
                }}
              >
                <MenuIcon />
              </IconButton>

              <Link
                href="/home"
                onClick={closePanels}
                className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-2 transition hover:border-[color:var(--shell-line-strong)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--shell-muted)]">
                  Logimarui
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--shell-text)]">
                  Home operacional
                </p>
              </Link>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
              <nav
                aria-label="Migalhas de pao"
                className="min-w-0 overflow-x-auto rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-2"
              >
                <ol className="flex min-w-max items-center gap-2 text-sm">
                  {breadcrumbs.map((item, index) => {
                    const isCurrent = index === breadcrumbs.length - 1;

                    return (
                      <li key={item.href} className="inline-flex items-center gap-2">
                        {index > 0 ? (
                          <span className="text-[var(--shell-muted)]">
                            <BreadcrumbSeparator />
                          </span>
                        ) : null}

                        {isCurrent ? (
                          <span className="font-semibold text-[var(--shell-text)]">
                            {item.label}
                          </span>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={closePanels}
                            className="text-[var(--shell-muted)] transition hover:text-[var(--shell-text)]"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <IconButton label="Busca">
                <SearchIcon />
              </IconButton>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((current) => !current);
                    setSidebarOpen(false);
                    setActiveSidebarPanel("");
                  }}
                  aria-label="Abrir menu de perfil"
                  className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-1.5 text-left transition hover:border-[color:var(--shell-text)]"
                >
                  <Avatar
                    imageUrl={avatarUrl}
                    label={avatarLabel}
                  />
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 z-40 mt-3 w-[min(88vw,340px)] rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4 shadow-[0_24px_80px_rgba(20,32,43,0.18)]">
                    <div className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          imageUrl={avatarUrl}
                          label={avatarLabel}
                          sizeClassName="h-12 w-12"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                            {profileHeading}
                          </p>
                          <p className="mt-1 text-sm text-[var(--shell-muted)]">
                            Perfil do dispositivo atual
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[color:var(--shell-line)] pt-4">
                        <MenuActionButton
                          onClick={refreshSession}
                          disabled={isRefreshing}
                          label={isRefreshing ? "Atualizando sessao" : "Atualizar sessao"}
                          trailing={<ChevronRightIcon />}
                        >
                          <RefreshIcon spinning={isRefreshing} />
                        </MenuActionButton>

                        <MenuActionButton
                          onClick={toggleTheme}
                          label={isDark ? "Usar modo claro" : "Ativar modo escuro"}
                          trailing={
                            <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                              {isDark ? "Escuro" : "Claro"}
                            </span>
                          }
                        >
                          <MoonIcon />
                        </MenuActionButton>

                        <div className="mt-1 rounded-2xl px-3 py-3 text-sm text-[var(--shell-text)]">
                          <span className="inline-flex items-center gap-3">
                            <UserIcon />
                            Sessao atual
                          </span>
                          <p className="mt-2 pl-7 text-sm text-[var(--shell-muted)]">
                            #{profile?.sessionId ?? profile?.userId ?? session?.profile?.sessionId ?? "-"}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-[color:var(--shell-line)] pt-4">
                          <MenuActionButton
                            onClick={logout}
                            disabled={isLoggingOut}
                            label={isLoggingOut ? "Saindo..." : "Sair"}
                            tone="danger"
                            trailing={<ChevronRightIcon />}
                          >
                            <LogoutIcon />
                          </MenuActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="w-full lg:hidden">
              <nav
                aria-label="Migalhas de pao"
                className="overflow-x-auto rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-3"
              >
                <ol className="flex min-w-max items-center gap-2 text-sm">
                  {breadcrumbs.map((item, index) => {
                    const isCurrent = index === breadcrumbs.length - 1;

                    return (
                      <li key={item.href} className="inline-flex items-center gap-2">
                        {index > 0 ? (
                          <span className="text-[var(--shell-muted)]">
                            <BreadcrumbSeparator />
                          </span>
                        ) : null}

                        {isCurrent ? (
                          <span className="font-semibold text-[var(--shell-text)]">
                            {item.label}
                          </span>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={closePanels}
                            className="whitespace-nowrap text-[var(--shell-muted)] transition hover:text-[var(--shell-text)]"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen ? (
        <aside className="fixed bottom-4 left-4 top-4 z-[60] flex w-[min(88vw,330px)] flex-col rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-5 shadow-[0_24px_80px_rgba(20,32,43,0.22)] sm:bottom-6 sm:left-6 sm:top-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
                Navegacao
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
                Modulos iniciais
              </h2>
            </div>

            <IconButton
              label="Fechar menu"
              onClick={closePanels}
            >
              <ChevronRightIcon />
            </IconButton>
          </div>

          <div className="relative mt-5 min-h-0 flex-1">
            <div className="shell-scrollbar h-full space-y-2.5 overflow-x-hidden overflow-y-auto pr-2 pb-2">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.id === "dpo"
                  ? isDpoRoute
                  : activeSidebarPanel === item.id;

                if (item.type === "panel") {
                  return (
                    <SidebarItem
                      key={item.id}
                      active={isActive}
                      label={item.label}
                      description={item.description}
                      onClick={() => {
                        setActiveSidebarPanel((current) =>
                          current === item.id ? "" : item.id,
                        );
                      }}
                    >
                      {renderSidebarItemIcon(item.icon)}
                    </SidebarItem>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setSidebarOpen(false);
                      setActiveSidebarPanel("");
                    }}
                    className={`flex items-start justify-between gap-3 rounded-[22px] border px-3.5 py-3 text-left transition ${
                      isActive
                        ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                        : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--shell-text)]">
                        {renderSidebarItemIcon(item.icon)}
                        {item.label}
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-5 text-[var(--shell-muted)]">
                        {item.description}
                      </span>
                    </span>
                    <span className="mt-0.5 shrink-0 text-[var(--shell-muted)]">
                      <ChevronRightIcon />
                    </span>
                  </Link>
                );
              })}
            </div>

            {sidebarPanelContent ? (
              <div className="absolute left-0 top-full z-[61] mt-3 w-full rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 shadow-[0_18px_60px_rgba(20,32,43,0.16)] sm:left-full sm:top-0 sm:ml-4 sm:mt-0 sm:w-[290px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
                  {sidebarPanelContent.eyebrow}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
                  {sidebarPanelContent.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
                  {sidebarPanelContent.body}
                </p>

                {activeSidebarPanel === "services" ? (
                  <div className="mt-4 space-y-2">
                    {SERVICE_ITEMS.map((serviceItem) =>
                      serviceItem.children ? (
                        <div
                          key={serviceItem.id}
                          className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-3.5"
                        >
                          <p className="text-sm font-semibold text-[var(--shell-text)]">
                            {serviceItem.label}
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-[var(--shell-muted)]">
                            {serviceItem.description}
                          </p>

                          <div className="mt-3 space-y-2">
                            {serviceItem.children.map((childItem) => (
                              <ServicePanelLink
                                key={childItem.id}
                                href={childItem.href}
                                label={childItem.label}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <ServicePanelLink
                          key={serviceItem.id}
                          href={serviceItem.href}
                          label={serviceItem.label}
                        />
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main className="min-h-screen px-4 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-32">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4 shadow-[0_18px_60px_rgba(20,32,43,0.08)] sm:p-6">
          {renderedChildren}
        </div>
      </main>
    </div>
  );
}
