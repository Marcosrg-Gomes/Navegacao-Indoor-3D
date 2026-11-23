# Auditoria Inicial de Acessibilidade — WCAG 2.2 Nível AA

## Contexto

Esta auditoria inicial foi executada sobre o repositório `Navegacao-Indoor-3D` (branch `casa/integracao-mobile`), antes de qualquer correção. O projeto é um sistema de navegação indoor para shopping centers composto por:

- **apps/visitor**: Expo / React Native Web (Three.js / React Three Fiber + mapa SVG) — interface do visitante.
- **apps/admin**: React / Vite — painel administrativo.
- **services/api**: FastAPI — fonte de verdade da navegação (destinos, QR Codes, grafo, rotas).
- **packages/shopping-3d / packages/scene-contract**: geometria Blender e contrato espacial.

## Metodologia

- Testes automatizados com **Playwright + @axe-core/playwright** (WCAG 2.2 AA: `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`).
- Teste unitário de anúncios para leitores de tela (`services/accessibility.unit.test.mjs`).
- Inspeção manual de componentes de acessibilidade (`AccessibleSheet`, `DesignSystem`, `useAccessibilityAnnouncer`, `FloorMap`, etc.).

## Resultado da auditoria inicial

A suíte de testes de acessibilidade (`apps/admin/tests/accessibility.spec.ts`) foi executada contra a aplicação rodando localmente (`mini_server.py` na porta 8766, banco SQLite descartável).

**Antes das correções: 18 testes, 14 falharam, 4 passaram.**

### Violações encontradas (antes da correção)

#### Visitante — público

| Teste | Violação | Impacto | Elemento afetado |
|-------|----------|---------|------------------|
| Página inicial (QR da entrada) | `aria-progressbar-name` | serious | `<div role="progressbar">` sem nome acessível |
| Página inicial (QR da entrada) | `aria-prohibited-attr` (13 nós) | serious | `<g aria-label="...">` sem `role` válido (FloorMap) |

#### Admin — autenticado

| Página | Violação | Impacto | Elemento afetado |
|--------|----------|---------|------------------|
| Lojas | `select-name` | critical | `<select>` sem label acessível (filtro de categorias) |
| Editor de Nós | `color-contrast` (42 nós) | serious | Texto âmbar #e8a54b sobre fundo claro (1.94:1) |
| Editor de Nós | `select-name` (2 nós) | critical | `<select>` sem label associado |
| Arestas | `color-contrast` (48 nós) | serious | Verde #16a34a sobre branco (3.29:1) |
| Arestas | `select-name` | critical | `<select>` de piso sem label |
| Validação | `color-contrast` | serious | Texto #5e736e sobre #e3f2e5 (4.35:1) |
| Validação | `select-name` | critical | `<select>` de escopo sem label |
| Cena 3D | `select-name` | critical | `<select>` de shopping sem label |

## Testes existentes antes desta auditoria

- `apps/visitor/services/accessibility.unit.test.mjs`: 14 testes de anúncios para leitores de tela (todos passando).
- `apps/admin/tests/layout-accessibility.spec.ts`: 5 casos de layout/acessibilidade (título único, foco/Tab/Escape, filtros, texto ampliado, contraste de 4,5:1 amostrado).

## Conclusão inicial

O projeto já possuía boas práticas de acessibilidade (componentes AccessibleSheet, DesignSystem com ARIA, anúncios para leitores de tela, foco visível, diálogos operáveis por teclado), mas apresentava violações concretas de WCAG 2.2 AA que precisavam ser corrigidas, especialmente em:
- Associação de labels a elementos `<select>` (Critério 1.3.1 / 4.1.2)
- Contraste de cores mínimo 4,5:1 (Critério 1.4.3)
- Uso correto de ARIA em elementos SVG (Critério 4.1.2)
- Nomes acessíveis para elementos `role="progressbar"` (Critério 4.1.2)
