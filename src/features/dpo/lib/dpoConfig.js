export const DPO_PILLARS = [
  {
    slug: "gente",
    label: "Gente",
    shortLabel: "Base",
    description: "Base cultural e operacional da auditoria.",
  },
  {
    slug: "seguranca",
    label: "Seguranca",
    shortLabel: "Seguranca",
    description: "Padroes e disciplina de seguranca.",
  },
  {
    slug: "planejamento",
    label: "Planejamento",
    shortLabel: "Planejamento",
    description: "Preparacao e previsibilidade da operacao.",
  },
  {
    slug: "entrega",
    label: "Entrega",
    shortLabel: "Entrega",
    description: "Execucao, atendimento e consistencia da entrega.",
  },
  {
    slug: "frota",
    label: "Frota",
    shortLabel: "Frota",
    description: "Disponibilidade, uso e controle da frota.",
  },
  {
    slug: "armazem",
    label: "Armazem",
    shortLabel: "Armazem",
    description: "Fluxo, armazenagem e sustentacao fisica da operacao.",
  },
  {
    slug: "gestao",
    label: "Gestao",
    shortLabel: "Gestao",
    description: "Camada de coordenacao e governanca da auditoria.",
  },
];

export const DPO_PILLAR_MAP = Object.fromEntries(
  DPO_PILLARS.map((pillar) => [pillar.slug, pillar]),
);

export function getDpoPillarBySlug(slug) {
  return DPO_PILLAR_MAP[slug] || null;
}

export const DPO_INTRO_SUMMARY = [
  {
    label: "Gente",
    slug: "gente",
    summary: "Base cultural e operacional que sustenta a leitura do DPO.",
  },
  {
    label: "Seguranca",
    slug: "seguranca",
    summary: "Disciplina, padroes e protecao na rotina da operacao.",
  },
  {
    label: "Planejamento",
    slug: "planejamento",
    summary: "Preparacao e previsibilidade para reduzir variacao na execucao.",
  },
  {
    label: "Entrega",
    slug: "entrega",
    summary: "Atendimento, consistencia e execucao da ponta operacional.",
  },
  {
    label: "Frota",
    slug: "frota",
    summary: "Disponibilidade e controle dos ativos moveis da operacao.",
  },
  {
    label: "Armazem",
    slug: "armazem",
    summary: "Fluxo e sustentacao fisica dos processos de armazenagem.",
  },
  {
    label: "Gestao",
    slug: "gestao",
    summary: "Coordenacao, governanca e acompanhamento dos demais pilares.",
  },
];

export const DPO_TOOL_SCOPES = {
  PILLAR: "PILLAR",
  BLOCK: "BLOCK",
  ITEM: "ITEM",
};

// Cada ferramenta precisa declarar onde pertence para aparecer no catalogo do pilar.
// A lista pode crescer sem criar blocos ou perguntas artificiais para preencher a tela.
export const DPO_TOOL_DEFINITIONS = [
  {
    id: "dto-manager",
    pillarSlug: "gestao",
    scope: DPO_TOOL_SCOPES.PILLAR,
    locationLabel: "Geral do pilar",
    href: "/dpo/gestao/gerenciador-dto",
    label: "Gerenciador de DTOs",
    description: "Analise, configuracao e acompanhamento dos formularios DTO.",
  },
  {
    id: "blitz-manager",
    pillarSlug: "seguranca",
    scope: DPO_TOOL_SCOPES.PILLAR,
    locationLabel: "Geral do pilar",
    href: "/dpo/seguranca/gerenciador-blitz",
    label: "Gerenciador de Blitz",
    description: "Analise, configuracao e acompanhamento das Blitz de seguranca.",
  },
  {
    id: "security-templates-manager",
    pillarSlug: "seguranca",
    scope: DPO_TOOL_SCOPES.PILLAR,
    locationLabel: "Geral do pilar",
    href: "/dpo/seguranca/gerenciador-gabaritos-seguranca",
    label: "Gerenciador de Gabaritos de Seguranca",
    description: "Analise, configuracao e acompanhamento dos gabaritos de seguranca.",
  },
  {
    id: "cme-route-tracking",
    pillarSlug: "entrega",
    scope: DPO_TOOL_SCOPES.BLOCK,
    blockCode: "4.0",
    locationLabel: "Bloco 4.0",
    href: "/dpo/entrega/acompanhamento-rota-cme",
    label: "Acompanhamento de rota CME",
    description: "Consulta operacional das rotas e ocorrencias de devolucao.",
  },
];

export function getDpoToolsForPillar(pillarSlug) {
  return DPO_TOOL_DEFINITIONS.filter((tool) => tool.pillarSlug === pillarSlug);
}
