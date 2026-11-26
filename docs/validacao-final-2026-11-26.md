# Validação final — linha de base (2026-11-26)

## Resumo

Execução da linha de base da entrega final do TCC sobre a branch `fix/tcc-final`
(estado do HEAD `2af8c43`). Nenhuma funcionalidade nova foi adicionada.

## Ambiente

- Python 3.14.3 (`.venv`)
- Node.js v24.22.0, npm 11.19.1
- FastAPI 0.115.0, uvicorn 0.30.0, SQLAlchemy 2.0.35, pytest 8.3.3
- TypeScript (visitor ~5.3.3, admin ~5.6.3), Vite 5.4.10, Playwright 1.63.0

## Comandos e resultados

### API — pytest

```
.venv\Scripts\python.exe -m pytest services/api/tests -q
```

Comando: `.venv\Scripts\python.exe -m pytest services/api/tests -q`

Versões: Python 3.14.3, pytest 8.3.3

Resultado: **202 passed, 1 skipped, 0 failed** em 27,57s

- 1 skipped: `test_mysql_homologation_database_is_active` (marcado `mysql`; pulado porque não há servidor MySQL configurado localmente — veja tarefa 2).

### Visitante — typecheck

```
npm run typecheck --prefix apps/visitor
```

Comando: `npm run typecheck` (working-directory `apps/visitor`)

Versões: Node 24.22.0, TypeScript ~5.3.3

Resultado: **aprovado** (0 erros, `tsc --noEmit` sem saída de erro).

### Visitante — build:web

```
npm run build:web --prefix apps/visitor
```

Comando: `npm run build:web` (working-directory `apps/visitor`)

Resultado: **aprovado** (exportado para `services/api/app/static/visitor`, não versionado).

### Visitante — build:native

```
npm run build:native --prefix apps/visitor
```

Comando: `npm run build:native` (working-directory `apps/visitor`)

Resultado: **aprovado** (bundles Android e iOS gerados em `dist-native`, isolamento nativo OK).

### Painel — build

```
npm run build --prefix apps/admin
```

Comando: `npm run build` (working-directory `apps/admin`)

Versões: TypeScript ~5.6.3, Vite 5.4.10

Resultado: **aprovado** (`tsc --noEmit` + `vite build`, built in ~1,5s).

### Specs Playwright (CI — .github/workflows/integration.yml)

**Não executado localmente.** Os specs do CI exigem subir o `mini_server` da API e o servidor web do visitante (Expo/Metro), além dos browsers do Playwright (Chromium) com dependências do sistema. Essa infraestrutura não está pronta localmente e rodá-la equivale a recriar o job `frontends` do CI fora dele. Os specs são executados no CI a cada push/PR; não há registro de falha no estado atual da branch `main`.

Specs do CI listados em `.github/workflows/integration.yml`:
- Regressão existente: `tests/navigation.spec.ts`, `tests/scanner.spec.ts`, `tests/admin-crud.spec.ts`, `tests/multiuser.spec.ts`
- Integrado 3D: `tests/scene.spec.ts`, `tests/map-interactions.spec.ts`, `tests/visitor-journey.spec.ts`, `tests/visitor-experience.spec.ts`, `tests/business-rules.spec.ts`, `tests/layout-accessibility.spec.ts`, `tests/wayfinding.spec.ts`, `tests/waze-navigation.spec.ts`, `tests/simulation-engine.spec.ts`, `tests/simulation-rerouting.spec.ts`
- Acessibilidade (axe-core WCAG 2.2 AA): `tests/accessibility.spec.ts`

### API — MySQL (banco principal e único)

Comando: `TEST_DATABASE_URL=mysql+pymysql://root:...@127.0.0.1:3306/navegacao_indoor_test .venv\Scripts\python.exe -m pytest services/api/tests -q`

Versões: Python 3.14.3, pytest 8.3.3, MySQL 8.0.40

Resultado: **203 passed, 0 failed** em 414,63s (6m 54s)

- MySQL configurado como banco principal e único (senha do root via variável de ambiente `MYSQL_ROOT_PASSWORD`).
- Banco de teste: `navegacao_indoor_test`.
- Nenhum teste pulado; todos executados contra MySQL.

## Pendências

- Testes em aparelho físico (Android/iOS, TalkBack/VoiceOver, câmera real): pendentes, conforme regra do repositório. (O usuário está corrigindo um erro ainda.)
- Specs Playwright do CI: executados apenas no CI (não executado localmente por falta de infraestrutura de servidores e browsers).
