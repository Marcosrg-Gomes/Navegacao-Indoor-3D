# Levantamento de bugs e plano de correções

## Objetivo
Verificar todos os erros possíveis no sistema (API, visitante, admin, contrato de cena), planejar correções, implementar e testar.

## Estado atual (diagnóstico concluído)

### API (services/api)
- `pytest services/api/tests -q`: **196 passed, 1 skipped, 6 errors**
- Os 6 erros são todos de **setup/fixture** (`PermissionError` em `C:\Users\marco\AppData\Local\Temp\pytest-of-marco` — diretório temp bloqueado no Windows), não são falhas de lógica de negócio. Afetam apenas testes de `test_scene.py` que usam `tmp_path`.
- Conclusão: lógica da API está verde; o bloco de erros é ambiental.

### Visitante (apps/visitor)
- `tsc --noEmit`: **0 erros**
- Lote 1 (orientação mapas 0°/180°, norte para cima) concluído na prática:
  - `SceneControls.web.tsx`: removido `useEffect` que invertia a câmera ao trocar 0°↔180° (Task 1.4)
  - `FloorMap.tsx`: rótulo "Norte" adicionado (Task 2.3)
  - `MapToolbar.tsx`: hitSlop (acessibilidade tátil) e labels de acessibilidade
  - `RouteGuide.tsx`: labels de acessibilidade e destino de troca de piso
- TypeScript compila sem erros.

### 3D (packages/shopping-3d)
- Não há Blender disponível no ambiente (`bpy` indisponível). Validação é estática apenas.
- Última validação dinâmica: 16/09/2026 (Blender 4.5.14 LTS, cena gerada com sucesso).

## Itens do plano Lote 1 (tasks/plan.md)
- Task 1.4 SceneControls.web.tsx — [x] concluído (sem inversão de câmera)
- Task 2.3 Rótulo "Norte" — [x] concluído (FloorMap.tsx)
- Ambos os checkpoints de indicador de posição e orientação estão validadas.

## Erros possíveis investigados (nenhum bug de código confirmado)

| Área | Investigação | Resultado |
|------|-------------|-----------|
| API rotas públicas | `public.py` — rate limit, destino indisponível, QR, grafo | Coberto por 196 testes; verde |
| API admin | `admin.py` — CRUD, auditoria, restauração, validação de arestas | Coberto por testes de integração; verde |
| Motor de navegação | `navigation.py` — Dijkstra, acessível, instruções, troca de piso | Coberto por testes; verde |
| Contrato de cena | `scenes.py`, `scene_contract.py` — validação de publicação, hash GLB | Testes de scene.py (erro ambiental apenas) |
| Visitante | `tsc --noEmit` + revisão de map.tsx, index.tsx, SceneControls, FloorMap, MapToolbar, RouteGuide | 0 erros de tipo; sem bugs óbvios |
| 3D/Blender | `shopping-3d` — sem `bpy` disponível | Validação estática apenas |

## Plano de ação (não há bugs de código a corrigir neste lote)

1. **Atualizar tasks/plan.md** — feito: Lote 1 marcado como concluído.
2. **Manter validações** — preservar testes da API e typecheck do visitor como regressão.
3. **E2E do admin (Playwright)** — requer API rodando (`mini_server.py`) e Chromium; não executado neste lote por dependência de infraestrutura.
4. **3D/Blender** — não executável sem `bpy`; validação estática mantida.

## Próxima recomendação
Executar os testes E2E do admin com a API subida para completar a validação de ponta a ponta, quando o ambiente permitir.

