"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatRoles } from "@/features/auth/lib/authFormatters";
import { buildGatewayUrl } from "@/features/app-shell/lib/gatewayUrl";
import { getDpoPillarBySlug } from "@/features/dpo/lib/dpoConfig";
import { useHomeSession } from "@/features/home/hooks/useHomeSession";
import {
  APP_ROUTES,
  getRouteSegment,
  matchesRoute,
} from "@/features/navigation/lib/appRoutes";
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
    href: APP_ROUTES.DPO,
    icon: "house",
  },
  {
    id: "authorization-roles",
    label: "Autorizacao",
    description: "Controle de roles e acessos dos usuarios.",
    type: "link",
    href: APP_ROUTES.AUTHORIZATION_ROLES,
    icon: "service",
  },
  {
    id: "server-manager",
    label: "Servidor",
    description: "Status do gateway e controle dos processos gerenciados.",
    type: "link",
    href: APP_ROUTES.SERVER_MANAGER,
    icon: "service",
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
