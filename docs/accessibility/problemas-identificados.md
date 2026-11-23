# Problemas Identificados — Auditoria de Acessibilidade (WCAG 2.2 AA)

Esta lista registra todos os problemas encontrados durante a auditoria inicial, antes das correções.

## Visitante — público (apps/visitor)

### P1 — Progressbar sem nome acessível (aria-progressbar-name)
- **Severidade:** Serious
- **Critério WCAG:** 4.1.2 (Nome, papel, valor)
- **Elemento:** `<div role="progressbar" aria-valuemin="0" aria-valuemax="1">` sem `aria-label`
- **Local:** `WazeNavigationPanel.tsx` e `DirectorySkeleton.tsx`
- **Descrição:** Elementos com `role="progressbar"` não possuem nome acessível, impedindo que leitores de tela identifiquem o propósito do indicador de progresso.

### P2 — Uso proibido de ARIA em elementos SVG sem role (aria-prohibited-attr)
- **Severidade:** Serious
- **Critério WCAG:** 4.1.2 (Nome, papel, valor)
- **Elemento:** `<g aria-label="...">` e `<div ... aria-label="...">` sem `role` válido
- **Local:** `FloorMap.tsx` (13 nós: nós de lojas, NavigationMarker) e `SceneControls.web.tsx` (canvas)
- **Descrição:** O atributo `aria-label` não pode ser usado em elementos `<g>` SVG sem um role válido (ex: `role="img"`), tampouco em `<div>` sem role. Isso causa announciation incorreta ou silenciosa em leitores de tela.

## Painel Administrativo (apps/admin)

### P3 — Select sem label acessível (select-name)
- **Severidade:** Critical
- **Critério WCAG:** 1.3.1 (Informação e relações) / 4.1.2 (Nome, papel, valor)
- **Elemento:** `<select>` sem `<label>` associado via `htmlFor`/`id`
- **Local:**
  - `Stores.tsx` — filtro de categorias no toolbar
  - `Nodes.tsx` — selects de piso e tipo no toolbar
  - `Edges.tsx` — select de piso no toolbar
  - `Validation.tsx` — select de escopo no toolbar
  - `SceneValidation.tsx` — select de shopping
  - Múltiplos selects dentro de `Field` e `FormField` (componentes compartilhados)
- **Descrição:** Elementos `<select>` não possuem um label programaticamente associado, tornando-os inacessíveis para usuários de leitores de tela.

### P4 — Contraste de cor insuficiente (color-contrast)
- **Severidade:** Serious
- **Critério WCAG:** 1.4.3 (Contraste mínimo)
- **Elemento:** Texto com cor de destaque sobre fundo claro
- **Local:**
  - `Nodes.tsx` — texto âmbar `#e8a54b` sobre fundo `#fcf4e9` (contraste 1.94:1, esperado 4.5:1) — 42 nós
  - `Edges.tsx` — texto verde `#16a34a` sobre fundo branco `#ffffff` (contraste 3.29:1, esperado 4.5:1) — 48 nós
  - `Validation.tsx` — texto `#5e736e` sobre fundo `#e3f2e5` (contraste 4.35:1, esperado 4.5:1) — 1 nó
- **Descrição:** Texto com cores de destaque não atinge o contraste mínimo de 4,5:1 exigido para nível AA, dificultando a leitura por usuários com baixa visão.

## Resumo de gravidade

| Severidade | Quantidade | Critérios WCAG afetados |
|------------|------------|-------------------------|
| Critical | 7 | 1.3.1, 4.1.2 (select sem label) |
| Serious | 4 | 1.4.3 (contraste), 4.1.2 (ARIA/progressbar) |
| **Total** | **11** | |
