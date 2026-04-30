"use client";

import { useRouter } from "next/navigation";
import { DPO_PILLARS } from "@/features/dpo/lib/dpoConfig";

const PILLAR_LAYOUT = [
  { slug: "seguranca", x: 164 },
  { slug: "planejamento", x: 256 },
  { slug: "entrega", x: 348 },
  { slug: "frota", x: 440 },
  { slug: "armazem", x: 532 },
];

const BLOCK_X = 142;
const BLOCK_WIDTH = 476;
const BLOCK_HEIGHT = 68;

function Segment({
  active = false,
  children,
  label,
  onClick,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <g
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer transition-transform duration-200 ${active ? "scale-[1.01]" : "hover:scale-[1.01]"}`}
    >
      {children}
    </g>
  );
}

function BlockShadowRect({
  x,
  y,
  width,
  height,
  rx = 8,
}) {
  return (
    <rect
      x={x + 10}
      y={y + 10}
      width={width}
      height={height}
      rx={rx}
      fill="var(--dpo-house-shadow)"
      opacity="0.9"
    />
  );
}

export default function DpoHouse({ activeSlug = "" }) {
  const router = useRouter();

  const pillarMap = Object.fromEntries(
    DPO_PILLARS.map((pillar) => [pillar.slug, pillar]),
  );

  const goToPillar = (slug) => {
    router.push(`/dpo/${slug}`);
  };

  return (
    <div className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Casa DPO
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[var(--shell-text)]">
            DPO - pilares
          </h2>
        </div>
      </div>

      <div className="mt-6 px-2 py-1">
        <svg viewBox="0 0 760 690" className="w-full overflow-visible">
          <Segment
            active={activeSlug === "sustentabilidade"}
            label="Abrir pilar Sustentabilidade"
            onClick={() => goToPillar("sustentabilidade")}
          >
            <polygon
              points="120,246 390,96 660,246"
              fill="var(--dpo-house-shadow)"
              opacity="0.9"
            />
            <polygon
              points="108,234 378,84 648,234"
              fill="var(--dpo-house-fill)"
              stroke={activeSlug === "sustentabilidade" ? "var(--shell-accent)" : "var(--dpo-outline)"}
              strokeWidth="4"
            />
            <text
              x="378"
              y="178"
              textAnchor="middle"
              fill="var(--dpo-house-ink)"
              fontSize="20"
              fontWeight="700"
              letterSpacing="2"
            >
              SUSTENTABILIDADE
            </text>
            <text
              x="378"
              y="208"
              textAnchor="middle"
              fill="var(--dpo-house-ink)"
              fontSize="14"
              fontWeight="700"
              letterSpacing="4"
            >
              2026
            </text>
          </Segment>

          <Segment
            active={activeSlug === "gestao"}
            label="Abrir pilar Gestao"
            onClick={() => goToPillar("gestao")}
          >
            <BlockShadowRect
              x={BLOCK_X}
              y={250}
              width={BLOCK_WIDTH}
              height={BLOCK_HEIGHT}
              rx={10}
            />
            <rect
              x={BLOCK_X}
              y="250"
              width={BLOCK_WIDTH}
              height={BLOCK_HEIGHT}
              rx="10"
              fill="var(--dpo-house-fill)"
              stroke={activeSlug === "gestao" ? "var(--shell-accent)" : "var(--dpo-outline)"}
              strokeWidth="4"
            />
            <text
              x="380"
              y="293"
              textAnchor="middle"
              fill="var(--dpo-house-ink)"
              fontSize="24"
              fontWeight="700"
              letterSpacing="4"
            >
              GESTAO
            </text>
          </Segment>

          {PILLAR_LAYOUT.map((pillar) => {
            const isActive = activeSlug === pillar.slug;
            const data = pillarMap[pillar.slug];
            const textX = pillar.x + 32;
            const textY = 434;

            return (
              <Segment
                key={pillar.slug}
                active={isActive}
                label={`Abrir pilar ${data.label}`}
                onClick={() => goToPillar(pillar.slug)}
              >
                <rect
                  x={pillar.x + 10}
                  y="342"
                  width="64"
                  height="210"
                  rx="8"
                  fill="var(--dpo-house-shadow)"
                  opacity="0.9"
                />
                <rect
                  x={pillar.x}
                  y="332"
                  width="64"
                  height="210"
                  rx="8"
                  fill="var(--dpo-house-fill)"
                  stroke={isActive ? "var(--shell-accent)" : "var(--dpo-outline)"}
                  strokeWidth="4"
                />
                <text
                  x={textX}
                  y={textY}
                  transform={`rotate(-90 ${textX} ${textY})`}
                  textAnchor="middle"
                  fill="var(--dpo-house-ink)"
                  fontSize="16"
                  fontWeight="700"
                  letterSpacing="1.5"
                >
                  {data.label.toUpperCase()}
                </text>
              </Segment>
            );
          })}

          <Segment
            active={activeSlug === "gente"}
            label="Abrir pilar Gente"
            onClick={() => goToPillar("gente")}
          >
            <BlockShadowRect
              x={BLOCK_X}
              y={564}
              width={BLOCK_WIDTH}
              height={BLOCK_HEIGHT}
              rx={10}
            />
            <rect
              x={BLOCK_X}
              y="564"
              width={BLOCK_WIDTH}
              height={BLOCK_HEIGHT}
              rx="10"
              fill="var(--dpo-house-fill)"
              stroke={activeSlug === "gente" ? "var(--shell-accent)" : "var(--dpo-outline)"}
              strokeWidth="4"
            />
            <text
              x="380"
              y="607"
              textAnchor="middle"
              fill="var(--dpo-house-ink)"
              fontSize="24"
              fontWeight="700"
              letterSpacing="5"
            >
              GENTE
            </text>
          </Segment>
        </svg>
      </div>
    </div>
  );
}
