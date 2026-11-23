# Auditoria Final de Acessibilidade — WCAG 2.2 Nível AA

## Contexto

Esta auditoria final foi executada após a implementação das correções identificadas na auditoria inicial. O escopo cobre a interface pública do visitante e o painel administrativo.

## Metodologia

- Testes automatizados com **Playwright + @axe-core/playwright** (WCAG 2.2 AA).
- Teste unitário de anúncios para leitores de tela.
- Execução contra a aplicação rodando localmente (`mini_server.py` na porta 8766, banco SQLite descartável).

## Resultado da auditoria final

**Após as correções: 18 testes, 18 passaram, 0 falharam.**

### Testes de acessibilidade automatizada (axe-core)

| Grupo | Teste | Resultado |
|-------|-------|-----------|
| Visitante — público | Página inicial (QR da entrada) | ✓ Aprovado |
| Visitante — público | Explorar — busca de destinos | ✓ Aprovado |
| Visitante — público | Explorar móvel (360px) | ✓ Aprovado |
| Visitante — público | Filtros e ordenação (dialog) | ✓ Aprovado |
| Visitante — público | Texto ampliado (200%) | ✓ Aprovado |
| Visitante — teclado | Navegação pelo Explorar (Tab/Enter/Esc) | ✓ Aprovado |
| Visitante — teclado | Mapa aceita setas do teclado | ✓ Aprovado |
| Admin — autenticado | Página de login | ✓ Aprovado |
| Admin — autenticado | Dashboard | ✓ Aprovado |
| Admin — autenticado | Lojas | ✓ Aprovado |
| Admin — autenticado | Categorias | ✓ Aprovado |
| Admin — autenticado | Pisos | ✓ Aprovado |
| Admin — autenticado | Editor de Nós | ✓ Aprovado |
| Admin — autenticado | Arestas | ✓ Aprovado |
| Admin — autenticado | QR Codes | ✓ Aprovado |
| Admin — autenticado | Validação | ✓ Aprovado |
| Admin — autenticado | Cena 3D | ✓ Aprovado |
| Admin — autenticado | Auditoria (Histórico e falhas) | ✓ Aprovado |

### Teste unitário de anúncios (leitores de tela)

`apps/visitor/services/accessibility.unit.test.mjs`: **14 passou, 0 falhou**.

## Matriz de correções

Todas as violações identificadas na auditoria inicial foram corrigidas:

| Página/Componente | Violação (antes) | Correção aplicada | Arquivo |
|-------------------|------------------|-------------------|---------|
| Visitante — FloorMap | `aria-prohibited-attr` (13 nós `<g>` sem role) | Adicionado `role="img"` e `aria-label` nos `<G>` de nós e NavigationMarker | `apps/visitor/components/FloorMap.tsx` |
| Visitante — SceneControls | `aria-prohibited-attr` (canvas sem role) | Adicionado `role="img"` ao canvas do mapa 3D | `apps/visitor/components/SceneControls.web.tsx` |
| Visitante — WazeNavigationPanel | `aria-progressbar-name` (progressbar sem nome) | Adicionado `aria-label` explícito ao progressbar | `apps/visitor/components/WazeNavigationPanel.tsx` |
| Visitante — DirectorySkeleton | `aria-progressbar-name` (progressbar sem nome) | Adicionado `aria-label` explícito ao skeleton | `apps/visitor/components/DirectorySkeleton.tsx` |
| Admin — Lojas | `select-name` (filtro sem label) | Adicionado `<label htmlFor>` + `id` ao select | `apps/admin/src/pages/Stores.tsx` |
| Admin — Nodes | `select-name` (piso/tipo sem associação) | Adicionado `htmlFor`/`id` aos selects de piso e tipo | `apps/admin/src/pages/Nodes.tsx` |
| Admin — Nodes | `color-contrast` (42 nós, 1.94:1) | Texto do badge de tipo mudou para `var(--primary-dark)` | `apps/admin/src/pages/Nodes.tsx` |
| Admin — Arestas | `select-name` (piso sem label) | Adicionado `htmlFor`/`id` ao select de piso | `apps/admin/src/pages/Edges.tsx` |
| Admin — Arestas | `color-contrast` (48 nós, 3.29:1) | Verde do status mudou de `#16a34a` para `#0f763e` | `apps/admin/src/pages/Edges.tsx` |
| Admin — Validação | `select-name` (escopo sem label) | Adicionado `htmlFor`/`id` ao select de escopo | `apps/admin/src/pages/Validation.tsx` |
| Admin — Validação | `color-contrast` (4.35:1) | Texto mudou de `var(--muted)` para `var(--success)` / `var(--danger)` | `apps/admin/src/pages/Validation.tsx` |
| Admin — Cena 3D | `select-name` (shopping sem label) | Adicionado `htmlFor`/`id` ao select de shopping | `apps/admin/src/pages/SceneValidation.tsx` |
| Admin — Field (compartilhado) | `select-name` (múltiplos selects) | Componente `Field` agora associa label via `useId()` + `htmlFor`/`id` | `apps/admin/src/ui.tsx` |
| Admin — FormField (compartilhado) | `select-name` (múltiplos selects) | Componente `FormField` agora associa label via `useId()` + `htmlFor`/`id` | `apps/admin/src/components/FormField.tsx` |

## Builds regenerados

- `npm run build --prefix apps/admin` (servido em `/admin/` pela API)
- `npm run build:web --prefix apps/visitor` (servido em `/` pela API)

## Limites da verificação

- Os testes automatizados cobrem violações detectáveis pelo axe-core (WCAG 2.2 AA). Não substituem a validação manual com leitores de tela (NVDA/VoiceOver/TalkBack).
- O contraste foi medido em elementos HTML; não cobre cada pixel do GLB/cena 3D.
- A validação em aparelhos físicos (TalkBack/VoiceOver, câmera real, fonte ampliada do sistema) ainda depende do [roteiro físico](teste-fisico-visitante.md).
