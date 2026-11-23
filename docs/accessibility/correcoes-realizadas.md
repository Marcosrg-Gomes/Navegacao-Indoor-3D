# Correções Realizadas — Auditoria de Acessibilidade (WCAG 2.2 AA)

Este documento registra todas as correções aplicadas para resolver os problemas identificados na auditoria inicial.

## Correções no Visitante (apps/visitor)

### C1 — FloorMap: role="img" em elementos SVG <g> com aria-label
- **Arquivo:** `apps/visitor/components/FloorMap.tsx`
- **Problema:** `<G accessibilityLabel={...}>` renderizava `<g aria-label="...">` sem role válido (violação `aria-prohibited-attr`, 13 nós).
- **Correção:** Adicionado `role="img"` aos elementos `<G>` dos nós do mapa e do `NavigationMarker`, e `aria-label` em vez de `accessibilityLabel`.
- **Antes:** `<G key={node.id} onPress={...} accessibilityLabel={node.nome || node.tipo}>`
- **Depois:** `<G key={node.id} onPress={...} role="img" aria-label={node.nome || node.tipo}>`

### C2 — SceneControls.web: role="img" no canvas do mapa 3D
- **Arquivo:** `apps/visitor/components/SceneControls.web.tsx`
- **Problema:** `<canvas>` com `aria-label` mas sem `role` válido (violação `aria-prohibited-attr`).
- **Correção:** Adicionado `canvas.setAttribute("role", "img")` antes de definir `aria-label`.

### C3 — WazeNavigationPanel: aria-label no progressbar
- **Arquivo:** `apps/visitor/components/WazeNavigationPanel.tsx`
- **Problema:** `<View accessibilityRole="progressbar" accessibilityLabel="...">` não expunha nome acessível para leitores de tela (violação `aria-progressbar-name`).
- **Correção:** Adicionado `aria-label="Progresso do percurso"` explicitamente ao elemento.

### C4 — DirectorySkeleton: aria-label no progressbar
- **Arquivo:** `apps/visitor/components/DirectorySkeleton.tsx`
- **Problema:** Mesmo problema de C3 no skeleton de carregamento do diretório.
- **Correção:** Adicionado `aria-label="Carregando lojas e serviços"` explicitamente.

## Correções no Painel Administrativo (apps/admin)

### C5 — Field: associação de label via useId() + htmlFor/id
- **Arquivo:** `apps/admin/src/ui.tsx`
- **Problema:** O componente `Field` envolvia inputs em `<label>` mas não associava via `htmlFor`/`id`, deixando `<select>` sem nome acessível.
- **Correção:** Adicionado `useId()` para gerar um ID único, `htmlFor` no `<label>` e `id` no elemento filho (via `cloneElement`).

### C6 — FormField: associação de label via useId() + htmlFor/id
- **Arquivo:** `apps/admin/src/components/FormField.tsx`
- **Problema:** Mesmo problema do `Field` para selects dentro de formulários modais.
- **Correção:** Mesma abordagem de C5 (`useId()`, `htmlFor`, `id` no filho).

### C7 — Stores: label para select de filtro de categorias
- **Arquivo:** `apps/admin/src/pages/Stores.tsx`
- **Problema:** `<select value={filtro}>` no toolbar não tinha label (violação `select-name`).
- **Correção:** Adicionado `<label htmlFor="filtro-categoria">` e `id="filtro-categoria"` ao select.

### C8 — Nodes: htmlFor/id nos selects de piso e tipo
- **Arquivo:** `apps/admin/src/pages/Nodes.tsx`
- **Problema:** `<label>Piso:</label>` e `<label>Tipo:</label>` não estavam associados aos selects (violação `select-name`, 2 nós).
- **Correção:** Adicionado `htmlFor="filtro-piso"`/`id="filtro-piso"` e `htmlFor="filtro-tipo"`/`id="filtro-tipo"`.

### C9 — Nodes: contraste do badge de tipo de nó
- **Arquivo:** `apps/admin/src/pages/Nodes.tsx`
- **Problema:** Texto do badge usava a cor pura do tipo (ex: âmbar `#e8a54b`) sobre fundo 20% opacidade, contraste 1.94:1 (violação `color-contrast`, 42 nós).
- **Correção:** Cor do texto do badge mudou para `var(--primary-dark)` (verde escuro), garantindo contraste ≥ 4,5:1.

### C10 — Edges: htmlFor/id no select de piso
- **Arquivo:** `apps/admin/src/pages/Edges.tsx`
- **Problema:** `<label>Piso:</label>` não associado ao select (violação `select-name`).
- **Correção:** Adicionado `htmlFor="filtro-piso-arestas"`/`id="filtro-piso-arestas"`.

### C11 — Edges: contraste do status de aresta
- **Arquivo:** `apps/admin/src/pages/Edges.tsx`
- **Problema:** Texto "Disponível" usava verde `#16a34a` sobre fundo branco, contraste 3.29:1 (violação `color-contrast`, 48 nós).
- **Correção:** Cor mudou de `#16a34a` para `#0f763e` (verde mais escuro), garantindo contraste ≥ 4,5:1.

### C12 — Validation: htmlFor/id no select de escopo
- **Arquivo:** `apps/admin/src/pages/Validation.tsx`
- **Problema:** `<label>Escopo:</label>` não associado ao select (violação `select-name`).
- **Correção:** Adicionado `htmlFor="escopo-piso"`/`id="escopo-piso"`.

### C13 — Validation: contraste de texto em cards de sucesso/erro
- **Arquivo:** `apps/admin/src/pages/Validation.tsx`
- **Problema:** Texto `var(--muted)` (#5e736e) sobre fundo `var(--success-soft)` (#e3f2e5), contraste 4.35:1 (violação `color-contrast`, 1 nó).
- **Correção:** Cor do texto mudou para `var(--success)` no card de sucesso e `var(--danger)` no card de erro.

### C14 — SceneValidation: htmlFor/id no select de shopping
- **Arquivo:** `apps/admin/src/pages/SceneValidation.tsx`
- **Problema:** `<label>Shopping</label>` não associado ao select (violação `select-name`).
- **Correção:** Adicionado `htmlFor="shopping-select"`/`id="shopping-select"`.

## Builds regenerados

- `npm run build --prefix apps/admin` — build estático do admin servido em `/admin/`
- `npm run build:web --prefix apps/visitor` — build estático do visitante servido em `/`

## Verificação de regressões

- `npx tsc --noEmit` (admin): aprovado (sem erros)
- `npm run typecheck --prefix apps/visitor`: erro pré-existente em `explore.tsx` (não relacionado a estas correções)
- `node services/accessibility.unit.test.mjs`: 14 passou, 0 falhou
- Testes Playwright de acessibilidade: 18 passou, 0 falhou

## Testes executados

| Suíte | Resultado |
|-------|-----------|
| `apps/admin/tests/accessibility.spec.ts` (axe-core WCAG 2.2 AA) | 18/18 aprovado |
| `apps/visitor/services/accessibility.unit.test.mjs` (anúncios leitores de tela) | 14/14 aprovado |
| `apps/admin/tests/layout-accessibility.spec.ts` (layout/acessibilidade existente) | 5/5 aprovado (pré-existente) |
