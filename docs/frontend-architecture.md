# Arquitetura do frontend

O frontend Logimarui usa Feature-Sliced Design (FSD) como arquitetura macro:

```text
app
↓
views
↓
widgets
↓
features
↓
entities
↓
shared
```

Uma camada pode depender apenas das camadas abaixo dela. A ausência física de uma
camada é válida: a árvore deve representar responsabilidades existentes, não um
modelo vazio.

## Camadas

### `app`

Contém o App Router do Next.js, páginas, layouts, metadata, providers, bootstrap,
redirects, `notFound`, parâmetros de rota e configuração específica da aplicação.
Uma página deve ser fina: resolve o que pertence ao framework e renderiza uma View.

Não colocar em `app` regras de feature ou composição visual completa que possa ser
expressa por uma View.

### `views`

Contém a composição de telas completas. Views combinam widgets, features, entities
e shared, mas não são o lugar para esconder regras de negócio ou clientes HTTP.

Exemplos atuais: Auth, Home, Authorization, DPO, Extrator, Server Manager e Crítica
de Pedidos. Redirects puros e páginas exclusivamente ligadas ao framework não
precisam de uma View artificial.

### `widgets`

Contém grandes blocos reutilizáveis de interface e composição da aplicação. O
`widgets/app-shell` reúne shell autenticado, header, sidebar, breadcrumbs, menu de
perfil, loading e estado visual do shell.

Widgets não conhecem `views` nem `app`. Um componente pequeno ou uma primitive
genérica não deve ser promovido a widget somente por ter mais de um consumidor.

### `features`

Contém capacidades e casos de uso do produto. Para uma feature simples, usar
somente os segmentos que existirem de fato:

```text
ui/     componentes React específicos da feature
model/  hooks de orquestração, estado, stores, contextos e modelagem
api/    clientes HTTP, gateways, repositories e adapters de integração
lib/    regras puras, cálculos, transformações, formatadores e helpers
```

Não criar segmentos vazios. Features irmãs não importam módulos internos umas das
outras. Quando um contrato transversal for legítimo, a feature provedora pode
expor uma API pública seletiva no seu `index.ts`; o consumidor importa apenas a
raiz da slice. Atualmente Auth expõe o contrato mínimo de sessão/API usado por DPO
e Authorization.

### `entities`

É reservada para domínio concreto compartilhado por múltiplas slices. Não criar a
camada, uma entity ou arquivos placeholder apenas porque nomes como cliente,
pedido, produto ou KPI parecem entidades. Nesta versão a camada não existe porque
não há abstração compartilhada que justifique sua criação.

### `shared`

Contém UI, hooks, libs, configuração e infraestrutura técnica genérica, sem
conhecimento de negócio. `shared` não depende de entities, features, widgets,
views ou app.

Exemplos: primitives shadcn em `shared/ui`, `cn` em `shared/lib`, breakpoint mobile
em `shared/hooks`, paths globais em `shared/config` e resolução técnica do gateway
em `shared/network`.

## Direções permitidas

```text
app      -> views/widgets/features/entities/shared
views    -> widgets/features/entities/shared
widgets  -> features/entities/shared
features -> entities/shared
entities -> shared
shared   -> shared
```

Imports internos da própria slice são permitidos. Imports de módulos internos de
outra feature são proibidos; uma API pública explícita é a única exceção normal.

## FSD macro e Hexagonal micro

FSD organiza a aplicação inteira. Arquitetura Hexagonal é opcional dentro de uma
feature complexa e não substitui as camadas macro. Ela só deve ser considerada
quando existirem, de forma concreta:

- múltiplos casos de uso;
- integrações externas relevantes;
- regras de domínio significativas;
- necessidade de testar domínio sem React ou HTTP;
- estados ou processos complexos.

Auth/IAM é um candidato conhecido para avaliação futura. A estrutura atual não
antecipa essa migração. Nomes como `domain`, `ports` ou `repository` não devem ser
criados sem contratos e consumidores reais.

## TypeScript

A adoção é incremental:

```text
arquivo novo              -> TS/TSX
refactor relevante        -> avaliar conversão segura
arquivo apenas movimentado -> pode permanecer JS/JSX
migração Big Bang         -> proibida
```

Conversão de linguagem não deve ampliar o risco de uma mudança estrutural.

## Dados gerados da Crítica de Pedidos

`features/critica-pedidos/data` permanece como localização explícita de dados
estáticos generated/mock. Repositories e adapters ficam em `api`, regras puras em
`lib` e componentes em `ui`. Isso representa o código existente sem simular um
domínio Hexagonal e mantém `PdvLeaflet` disponível para decomposição futura.

## Guardrails

O ESLint aplica `no-restricted-imports` por camada para impedir dependências
ascendentes e, por slice existente, impedir acesso aos internals de features irmãs.
Ao criar uma nova slice em `features`, inclua seu nome em `featureSlices` no
`eslint.config.mjs` para ativar também o isolamento lateral específico.

Os guardrails automatizam fronteiras de import. Decisões semânticas — por exemplo,
se um componente é View, widget ou UI de feature — continuam exigindo revisão.
