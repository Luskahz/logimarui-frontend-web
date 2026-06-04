## Getting Started

Defina as variaveis em `.env.local`:

```bash
FRONTEND_PORT=8091
NEXT_PUBLIC_CORE_API_URL=http://127.0.0.1:81
```

No workspace `LogImarui-dev`, o gateway Java deve responder em `81`.
Ao promover esse snapshot para `LogImarui`, troque `NEXT_PUBLIC_CORE_API_URL` para `http://127.0.0.1:80`.

Depois execute:

```bash
npm run dev
```

Abra `http://localhost:8091`.

Para producao local do frontend standalone:

```bash
npm run build
npm run start
```
