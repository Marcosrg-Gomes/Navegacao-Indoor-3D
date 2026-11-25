# Plano de Correção dos Testes E2E

## Root causes identificados e corrigidos

1. **`api.ts` `getBaseUrl()`**: Priorizava `EXPO_PUBLIC_API_URL` (hardcoded `:8766`) sobre `window.location.origin`, causando CORS no Firefox. Corrigido para usar `window.location.origin` primeiro no web.
2. **`apps/visitor/.env`**: Tinha `EXPO_PUBLIC_API_URL=http://127.0.0.1:8766` (porta errada). Corrigido para vazio (usa `window.location.origin`).
3. **`evidence.spec.ts`**: Usava `localhost:8081` (porta errada). Corrigido para usar `visitorQrUrl()`.
4. **`visitor-experience.spec.ts`**: `start()` usava `:8766` (porta errada). Corrigido para usar `visitorQrUrl()`.
5. **Build do visitor**: Reconstruído com o código corrigido (sem URL hardcoded no bundle).

## Problemas restantes nos specs

### a) `admin-crud.spec.ts` - Muito lento (1.5m+ no Chrome)
O teste cria/edita/remove registros via UI admin. Pode precisar de otimização ou timeout maior.

### b) Specs que falham devido a servidor caindo
O `audit_server.py` (uvicorn single-threaded) cai quando múltiplos testes fazem requisições concorrentes. Solução: rodar navegador por navegador.

### c) Specs com `waitForTimeout(2000)` excessivo
Muitos specs usam `waitForTimeout(2000)` que pode ser insuficiente em navegadores mais lentos.

### d) `simulation-catalog.spec.ts` e `simulation-context.spec.ts` falhavam
Esses usam `request` diretamente à API. Podem ter falhado devido ao servidor caindo ou porta errada.

## Estratégia de execução
1. Rodar testes navegador por navegador (chrome, firefox, webkit)
2. Reiniciar o servidor antes de cada navegador
3. Corrigir specs que ainda falharem
4. Repetir até TUDO passar nos 3 navegadores
