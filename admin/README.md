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
