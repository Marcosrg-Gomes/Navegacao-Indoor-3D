# Evidências — Auditoria de Acessibilidade (WCAG 2.2 AA)

## Testes automatizados executados

### 1. Suíte de acessibilidade automatizada (axe-core + Playwright)

**Comando:**
```powershell
$env:AUDIT_URL = 'http://127.0.0.1:8766'
$env:AUDIT_REPORT = '../../evidence/accessibility-final.json'
npx playwright test --project=chromium tests/accessibility.spec.ts --reporter=list
```

**Resultado:** 18 testes aprovados, 0 falhados.

**Arquivos de evidência gerados:**
- `evidence/accessibility-final.json` — relatório JSON dos testes Playwright
- `evidence/final-browser-artifacts/` — capturas de tela e traces de execução

### 2. Teste unitário de anúncios para leitores de tela

**Comando:**
```powershell
node services/accessibility.unit.test.mjs
```

**Resultado:** 14 passou, 0 falhou.

**Arquivo:** `apps/visitor/services/accessibility.unit.test.mjs`

### 3. Teste de layout/acessibilidade existente (pré-existente)

**Arquivo:** `apps/admin/tests/layout-accessibility.spec.ts`

**Resultado:** 5 casos aprovados (título único, resultados visíveis, foco/Tab/Escape, filtros removíveis, texto ampliado, contraste 4,5:1 amostrado).

## Violações antes e depois

### Antes da correção (18 testes, 14 falhados)

| Teste | Violações |
|-------|-----------|
| Visitante — Página inicial | `aria-progressbar-name`, `aria-prohibited-attr` (13 nós) |
| Admin — Lojas | `select-name` |
| Admin — Editor de Nós | `color-contrast` (42 nós), `select-name` (2 nós) |
| Admin — Arestas | `color-contrast` (48 nós), `select-name` |
| Admin — Validação | `color-contrast`, `select-name` |
| Admin — Cena 3D | `select-name` |

### Depois da correção (18 testes, 18 aprovados)

Todos os testes passaram com zero violações detectadas pelo axe-core.

## Exemplos de violações corrigidas (detalhes do axe)

### select-name (critical)
```
Ensure select element has an accessible name
Element does not have an implicit (wrapped) <label>
Element does not have an explicit <label>
aria-label attribute does not exist or is empty
Target: <select style="min-width: 260px;">
```

### color-contrast (serious)
```
Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
Target: <span style="color: rgb(22, 163, 74); font-weight: 600;">Disponível</span>
```

### aria-prohibited-attr (serious)
```
Ensure ARIA attributes are not prohibited for an element's role
aria-label attribute cannot be used on "g" elements with no valid role attribute.
Target: <g aria-label="ADIDAS">...</g>
```

### aria-progressbar-name (serious)
```
Ensure every ARIA progressbar node has an accessible name
aria-label attribute does not exist or is empty
Target: <div role="progressbar" aria-valuemax="1" aria-valuemin="0">
```

## Limites das evidências automatizadas

- Os relatórios do axe-core detectam violações estáticas de WCAG 2.2 AA, mas não substituem a validação com leitores de tela reais.
- O contraste foi medido em elementos HTML; não cobre cada pixel da cena 3D (GLB) ou plantas baixas SVG.
- A validação com NVDA (Windows) deve ser realizada manualmente conforme o [roteiro NVDA](roteiro-nvda.md).
- A validação em aparelhos físicos (TalkBack/VoiceOver, fonte ampliada do sistema, câmera real) deve ser realizada conforme o [roteiro físico](teste-fisico-visitante.md).

## Conformidade declarada

Após as correções, todos os 18 testes automatizados de acessibilidade (axe-core WCAG 2.2 AA) passam. Isso indica conformidade com os critérios verificáveis automaticamente, mas **não declara conformidade integral WCAG 2.2 AA sem evidências de validação manual com leitores de tela e aparelhos físicos.**
