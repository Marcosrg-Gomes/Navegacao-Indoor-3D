# Implementation Plan: Lote 1 — Navegação e Mapas (Norte para Cima)

## Overview
Corrigir a orientação dos mapas 2D e 3D para garantir que o norte esteja sempre para cima, sem rotação horizontal durante curvas. Melhorar o indicador de posição, direção e visualização da rota. Garantir coerência entre 2D e 3D.

## Architecture Decisions
- `mapRotationForHeading` sempre retorna 0 (sem rotação do mapa)
- `followPosition` não aplica rotação à planta
- A seta de posição indica o heading do usuário, mas o mapa fica fixo
- 3D mantém câmera fixa com norte para cima (sem inversão)

## Task List

### Phase 1: Corrigir orientação (norte para cima)
- [x] Task 1.1: Corrigir `mapViewport.ts` - `mapRotationForHeading` retorna sempre 0, `followPosition` sem rotação
- [x] Task 1.2: Corrigir `FloorMap.tsx` - remover rotação da planta SVG
- [x] Task 1.3: Corrigir `Map2D.tsx` - remover rotação do container View
- [x] Task 1.4: Corrigir `SceneControls.web.tsx` - não inverter câmera, norte fixo (useEffect de inversão removido)

### Checkpoint: Orientação corrigida
- [x] TypeScript compila sem erros
- [x] Mapa 2D não gira durante navegação
- [x] Mapa 3D não inverte câmera

### Phase 2: Melhorar indicador de posição e direção
- [x] Task 2.1: Melhorar seta de posição no FloorMap (aponta para heading)
- [x] Task 2.2: Melhorar indicador de próximo trecho na rota
- [x] Task 2.3: Adicionar rótulo "Norte" visível no mapa 2D (FloorMap.tsx)

### Checkpoint: Indicador de posição
- [x] Seta de posição mostra direção do usuário
- [x] Próximo trecho destacado na rota
- [x] Rótulo Norte visível

### Phase 3: Coerência 2D/3D e validação
- [x] Task 3.1: Verificar SceneRoute coerente com norte para cima
- [x] Task 3.2: Executar TypeScript check e build
- [x] Task 3.3: Executar testes relevantes

### Checkpoint: Completo
- [x] Todas as alterações validadas
- [x] Próximo lote recomendado

## Files Likely Touched
- `apps/visitor/components/mapViewport.ts`
- `apps/visitor/components/FloorMap.tsx`
- `apps/visitor/components/Map2D.tsx`
- `apps/visitor/components/SceneControls.web.tsx`
- `apps/visitor/components/SceneRoute.tsx`
- `apps/visitor/constants/colors.ts`

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Quebrar navegação existente | High | Testar com rotas existentes antes e depois |
| Inconsistência 2D/3D | Medium | Verificar ambos após cada alteração |
| Quebrar acessibilidade | Medium | Manter labels de acessibilidade |