# Painel administrativo

Interface web para cadastrar shoppings, pisos, o grafo de navegação, lojas e QR Codes.

## Requisitos

- Node.js 18+
- Backend FastAPI em `http://localhost:8000`

## Setup

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) e entre com a mesma `ADMIN_API_KEY` do arquivo `backend/.env`.

O Vite encaminha `/api` para o backend, então não é necessário configurar CORS no dia a dia.

## Telas

- Dashboard com totais e atalho para a validação do grafo
- CRUD de shoppings, pisos, lojas e categorias
- Editor visual: planta baixa, nós arrastáveis, arestas por dois cliques, autosave
- QR Codes com imagem e impressão
- Relatório de validação (`/api/admin/graph/validate`)

A URL gravada no QR aponta para `VITE_PUBLIC_APP_URL` (navegador do visitante, ainda a ser publicado).

## Testes E2E (Playwright)

Execute a partir de `apps/admin`, com a API disponível em `AUDIT_URL`:

```powershell
$env:AUDIT_URL = 'http://127.0.0.1:8001'
npx playwright test --project=chromium
```

Sem `VISITOR_URL`, a configuração inicia o Expo web temporariamente em
`http://127.0.0.1:8081` e aponta `EXPO_PUBLIC_API_URL` para `AUDIT_URL`. Assim,
os testes exercitam o código-fonte atual do visitante, enquanto páginas e
requisições administrativas usam o backend informado. Defina `VISITOR_URL` para
usar um visitante já hospedado; nesse caso, o Playwright não inicia o Expo.
