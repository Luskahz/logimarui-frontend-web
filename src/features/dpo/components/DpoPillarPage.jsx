"use client";

import AuthenticatedShell from "@/features/app-shell/components/AuthenticatedShell";
import DpoHouse from "@/features/dpo/components/DpoHouse";
import { DPO_QUESTION_GROUPS } from "@/features/dpo/lib/dpoConfig";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="m6 9 6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DpoPillarPage({ pillar }) {
  return (
    <AuthenticatedShell>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Pilar DPO
          </p>
          <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
            {pillar.label}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--shell-muted)]">
            {pillar.description} Esta pagina ja nasce com a estrutura de perguntas expansivel para que a pontuacao futura entre sem troca de layout.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Blocos
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">10</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                De <code>1.0</code> ate <code>10.0</code>.
              </p>
            </article>

            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Perguntas
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">100</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                De <code>x.1</code> ate <code>x.10</code> em cada bloco.
              </p>
            </article>

            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Pontuacao futura
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">0 / 1 / 3</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                Escala prevista para calcular media por bloco e por pilar.
              </p>
            </article>
          </div>

          <div className="mt-6 space-y-3">
            {DPO_QUESTION_GROUPS.map((group, index) => (
              <details
                key={group.code}
                open={index === 0}
                className="group overflow-hidden rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
                      {group.code}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-[var(--shell-text)]">
                      {group.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--shell-muted)]">
                      {group.description}
                    </p>
                  </div>

                  <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-muted)] transition group-open:rotate-180">
                    <ChevronDownIcon />
                  </span>
                </summary>

                <div className="border-t border-[color:var(--shell-line)] px-5 py-4">
                  <div className="space-y-2">
                    {group.questions.map((question) => (
                      <div
                        key={question.code}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--shell-text)]">
                            {question.code}
                          </p>
                          <p className="mt-1 text-sm text-[var(--shell-muted)]">
                            {question.label}
                          </p>
                        </div>

                        <span className="rounded-full border border-dashed border-[color:var(--shell-line-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                          pontos depois
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <DpoHouse activeSlug={pillar.slug} />

          <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
              Leitura desta pagina
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--shell-muted)]">
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                Cada bloco <code>x.0</code> sera a media das perguntas internas quando a pontuacao for ativada.
              </li>
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                A media geral do pilar tambem sera calculada a partir dos blocos visiveis aqui.
              </li>
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                Nesta etapa, a estrutura ja esta pronta para receber perguntas reais e resultados coloridos.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AuthenticatedShell>
  );
}
