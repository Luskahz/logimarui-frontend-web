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
  {
    slug: "sustentabilidade",
    label: "Sustentabilidade",
    shortLabel: "Sustentabilidade 2026",
    description: "Direcao superior do modelo, simbolizada pelo telhado da casa.",
  },
];

export const DPO_PILLAR_MAP = Object.fromEntries(
  DPO_PILLARS.map((pillar) => [pillar.slug, pillar]),
);

export function getDpoPillarBySlug(slug) {
  return DPO_PILLAR_MAP[slug] || null;
}

export const DPO_QUESTION_GROUPS = Array.from({ length: 10 }, (_, groupIndex) => {
  const groupNumber = groupIndex + 1;
  const groupCode = `${groupNumber}.0`;

  return {
    code: groupCode,
    title: `Bloco ${groupCode}`,
    description: "Media, cores e escala 0/1/3 entram na proxima etapa.",
    questions: Array.from({ length: 10 }, (_, questionIndex) => {
      const questionNumber = questionIndex + 1;
      const questionCode = `${groupNumber}.${questionNumber}`;

      return {
        code: questionCode,
        label: `Pergunta ${questionCode} em definicao.`,
      };
    }),
  };
});
