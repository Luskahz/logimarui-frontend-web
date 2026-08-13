  "use client";

  import {
    Card,
    CardContent,
    CardHeader,
  } from "@/shared/ui/card";
  import { Typography } from "@/shared/ui/typography";


  export default function HomeContent() {
    return (
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <CardHeader className="grid gap-0 p-0">
            <Typography
              as="p"
              variant="overline"
              className="text-[var(--shell-accent)]"
            >
              Home
            </Typography>

            <Typography as="h1" variant="pageTitle" className="mt-3">
              Título
            </Typography>

            <Typography as="p" variant="description" className="mt-3 max-w-2xl">
              Descrição
            </Typography>
          </CardHeader>

          <CardContent className="gap-0 p-0 pt-6">
            <div className="rounded-[28px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] p-5">
              <Typography
                as="h2"
                variant="itemTitle"
                className="text-[var(--shell-text)]"
              >
                Conteúdo da home em definição
              </Typography>

              <Typography as="p" variant="description" className="mt-2 max-w-3xl">
                Este bloco existe apenas para reservar o espaço principal da
                aplicação.
              </Typography>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
            <CardHeader className="p-0">
              <Typography
                as="h2"
                variant="cardTitle"
                className="text-[var(--shell-accent)]"
              >
                Sessão local
              </Typography>
            </CardHeader>

            <CardContent className="gap-0 p-0 pt-4">
              {/* informações da sessão */}
            </CardContent>
          </Card>

          <Card className="border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
            <CardHeader className="p-0">
              <Typography
                as="h2"
                variant="cardTitle"
                className="text-[var(--shell-accent)]"
              >
                Estado do token
              </Typography>
            </CardHeader>

            <CardContent className="gap-0 p-0 pt-4">
              {/* informações do token */}
            </CardContent>
          </Card>
        </aside>
      </div>
    );
  }
