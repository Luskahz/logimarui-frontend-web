import Link from "next/link";
import AuthenticatedShell from "@/features/app-shell/components/AuthenticatedShell";
import DpoHouse from "@/features/dpo/components/DpoHouse";
import { DPO_INTRO_SUMMARY } from "@/features/dpo/lib/dpoConfig";

export default function DpoOverviewPage() {
  return (
    <AuthenticatedShell>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Introducao DPO
          </p>
          <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
            Sustentabilidade
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--shell-muted)]">
            Sustentabilidade nao entra como pilar com questionario. Ela representa a leitura superior da casa: gente, os cinco pilares operacionais e a gestao sustentam esse resultado e esta pagina concentra o resumo dos atingimentos das frentes que formam a base do DPO.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Base da casa
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">7 frentes</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                Gente, cinco pilares operacionais e gestao.
              </p>
            </article>

            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Leitura atual
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">Resumo por frente</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                Cada card abaixo resume o eixo e leva para a pagina detalhada dele.
              </p>
            </article>

            <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                Pontuacao futura
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--shell-text)]">Depois</p>
              <p className="mt-2 text-sm text-[var(--shell-muted)]">
                A consolidacao de sustentabilidade nasce da media dos pilares sustentadores.
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DPO_INTRO_SUMMARY.map((item) => (
              <Link
                key={item.slug}
                href={`/dpo/${item.slug}`}
                className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
                      Pilar base
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-[var(--shell-text)]">
                      {item.label}
                    </h2>
                  </div>

                  <span className="rounded-full border border-dashed border-[color:var(--shell-line-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                    detalhes
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
                  {item.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <DpoHouse activeSlug="dpo" />

          <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
              Leitura desta pagina
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--shell-muted)]">
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                O telhado representa sustentabilidade e funciona como a introducao do DPO, nao como um pilar com perguntas.
              </li>
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                Gente, seguranca, planejamento, entrega, frota, armazem e gestao formam a sustentacao da casa.
              </li>
              <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                Os resultados consolidados de sustentabilidade entram aqui quando os pilares passarem a ter pontuacao real.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AuthenticatedShell>
  );
}
