# AGENTS.md — Navegação Indoor

## Visão geral

Sistema de navegação em shopping centers, composto por API FastAPI, aplicativo
Expo/React Native e painel administrativo React/Vite. O produto usa QR Codes,
mapas 2D e roteamento por Dijkstra.

## Estrutura canônica

- `backend/`: API, modelos SQLAlchemy, migrations/seeds e testes Python.
- `mobile/`: experiência do visitante em Expo/React Native.
- `admin-panel/`: painel de manutenção de mapas, nós, pontos de interesse e QR
  Codes.
- `evidence/`: relatórios e artefatos de auditoria; não os remova nem altere
  fora de uma tarefa de validação.
- `indoor-wayfinder-main/`, `Waypoint-main/`, `QRNav-master/`,
  `indrz-be-main/` e `indoor-navigation-system-qrcode-augmented-reality-master/`:
  referências/upstreams. Não os trate como a implementação integrada sem uma
  solicitação explícita.

Leia `README.md`, `DECISOES.md` e `AUDITORIA_FASES_1-3.md` antes de mudanças
arquiteturais ou que afetem requisitos.

## Desenvolvimento

- Preserve os contratos da API em `/api`, os modelos/schemas e a compatibilidade
  entre backend, `mobile/` e `admin-panel/`.
- Para novas rotas, implemente validação Pydantic, tratamento de erros e testes
  de integração. Não exponha endpoints administrativos sem autenticação.
- Mantenha o roteamento determinístico e cubra cenários entre pisos, bloqueios
  e rota acessível quando alterar grafos ou cálculo de rotas.
- Use parâmetros/variáveis de ambiente para URLs, credenciais e chaves; nunca
  grave segredos no código, evidências ou arquivos versionados.
- Não modifique artefatos gerados em `backend/app/static/`; gere-os pelos builds
  de `mobile/` e `admin-panel/`.

## Comandos de validação

Execute somente o que for pertinente às alterações:

```powershell
cd backend; pytest tests/ -v
cd mobile; npm ci; npm run typecheck; npm run build:web
cd admin-panel; npm ci; npm run build
```

Os testes E2E e a execução de câmera/dispositivo devem ser reportados como não
executados quando não houver ambiente adequado. Testes SQLite não substituem a
homologação em MySQL.

## Regras de alteração

- Mantenha mudanças pequenas, tipadas e acompanhadas de testes quando houver
  comportamento novo ou corrigido.
- Atualize o README e a documentação de decisões ao mudar setup, contrato,
  arquitetura ou requisito.
- Não apague, reverta ou formate alterações locais que não pertençam à tarefa.
- Não faça commits, pushes, merges, resets ou operações destrutivas sem pedido
  explícito.
