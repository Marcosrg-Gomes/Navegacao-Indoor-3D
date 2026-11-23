# Fase B — Plano de Correções Front-End

## Objetivo
Corrigir os 36 testes que falham no "Integrated 3D E2E" do CI, que são problemas de front-end (Expo/React Native).

## Problemas identificados

### 1. Timeouts de 45s — elementos não aparecem
Testes afetados: business-rules, visitor-experience, visitor-journey, wayfinding, waze-navigation, layout-accessibility, map-interactions, scene

### 2. Tamanho mínimo de alvo de toque (44x44dp) — CORRIGIDO
- SceneMap.web.tsx: minHeight 40 → 44 ✅ (commit 3dbf8ea)
- SceneCanvas.web.tsx: minHeight 42 → 44 ✅ (commit 4d130af)

### 3. AccessibilityLabel e texto — CORRIGIDO
- explore.tsx: accessibilityLabel "Abrir filtros e ordenação" → "Filtrar e ordenar" ✅ (commit 3dbf8ea)
- explore.tsx: "Encontre seu lugar" → "Encontre seu lugar." ✅ (commit 031909f)

### 4. Itens pendentes
- [ ] 1. Investigar por que "Filtrar e ordenar" não aparece (layout-accessibility.spec.ts) — label foi corrigido, verificar se resolve
- [ ] 2. Investigar por que "NATURA, Aberto" não aparece (múltiplos testes) — possível desalinhamento de label entre teste e componente
- [ ] 3. Investigar por que "Rota acessível" não aparece (map-interactions, visitor-experience, visitor-journey, wayfinding)
- [ ] 4. Investigar por que "Encontre seu lugar." não aparece (wayfinding.spec.ts:19) — texto corrigido, verificar se resolve
- [ ] 5. Corrigir resolução dupla de QR (visitor-journey.spec.ts:253, 300, 337)
- [ ] 6. Corrigir "falha simulada" não aparece (visitor-journey.spec.ts:269)
- [ ] 7. Corrigir distância não diminui (waze-navigation.spec.ts:67)
- [ ] 8. Botão "Salvar" 40px < 44px (visitor-experience.spec.ts:145) — verificar se existe outro componente com 40px

## Resumo de commits pushados (Fase B)
- 3dbf8ea: fix(frontend): corrige tamanho mínimo de alvo e accessibilityLabel de filtros
- 4d130af: fix(frontend): corrige minHeight 42 para 44 em SceneCanvas.web.tsx
- 031909f: fix(frontend): corrige heading Encontre seu lugar para bater com teste
