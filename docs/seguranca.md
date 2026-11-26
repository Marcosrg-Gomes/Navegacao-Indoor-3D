# Segurança — verificação e riscos remanescentes

## Verificações realizadas

### `.env` e bancos não estão versionados
- `.gitignore` ignora `.env`, `.env.*`, `*.db`, `*.sqlite*`, `__pycache__/`, `node_modules/`, `.venv/`.
- `git ls-files` confirma que só existem `.env.example` (raiz, `apps/admin`, `apps/visitor`, `services/api`) e nenhum `.env` nem banco de dados versionado.
- Cada execução da demonstração usa um banco novo e isolado; não modifica bancos existentes (README).

### Chaves padrão e de demonstração (README)
- A chave de demonstração `audit-local-admin-key-with-32-characters` aparece no README apenas como chave do painel na demonstração isolada local (servidor só no computador local).
- `app/config.py` rejeita valores de exemplo inseguros conhecidos (`INSECURE_EXAMPLE_VALUES`) e exige `ADMIN_API_KEY` com ao menos 32 caracteres.
- `ADMIN_API_KEYS` permite chaves individuais (≥16 caracteres, identificadores distintos); a chave legada `ADMIN_API_KEY` é identificada como `administrador-compartilhado` (compartilhada, não atribuída a uma pessoa).

### CORS
- `app/main.py`: `allow_origins=["*"]`, `allow_credentials=False`, `allow_methods=["*"]`, `allow_headers=["*"]`, `expose_headers=["X-Error-Code"]`.
- Clientes autenticam chamadas administrativas via `X-API-Key`, não cookies; credenciais desabilitadas por não combinar com origem curinga.

### Rate limit
- `app/routers/public.py`: `SlidingWindowRateLimiter` para rotas, distâncias e diagnósticos, por endereço da conexão direta e por processo da API.
- Configurável via `ROUTES_RATE_LIMIT`, `ROUTES_RATE_WINDOW_SECONDS`, `ROUTE_DISTANCES_RATE_LIMIT`, `ROUTE_DISTANCES_RATE_WINDOW_SECONDS`, `DIAGNOSTICS_RATE_LIMIT`, `DIAGNOSTICS_RATE_WINDOW_SECONDS`.
- 429 com `Retry-After`. Não é quota global entre múltiplos workers/instâncias.

### `python-jose` e `passlib`
- Estavam declarados em `services/api/requirements.txt` mas **não são importados em nenhum código** do projeto (grep sem correspondência).
- Removidos de `requirements.txt` (higiene de dependências não usadas). Nenhum modelo, contrato de API ou ID de requisito foi alterado com isso.

### Dado pessoal armazenado
- Não há dado pessoal armazenado. Diagnósticos guardam somente contadores por tipo e código de falha, sem identidade, trajeto ou token.
- Auditoria registra usuário autenticado, UTC, motivo e antes/depois de forma atômica; **tokens de QR são omitidos** e não são restaurados.
- Preferências ficam no aparelho (AsyncStorage); nenhuma trilha de localização é persistida. A posição não é persistida entre sessões.

## Riscos remanescentes (lista curta)

1. **CORS com origem curinga (`*`)**: expõe endpoints públicos a qualquer origem. Aceitável para o app público, pois a autenticação administrativa é por `X-API-Key` (não cookies) e `credentials` está desabilitado. Reavaliar se o expôr público for restrito a origens específicas.
2. **Rate limit em memória por processo**: não é global entre múltiplos workers ou instâncias da API. Um cliente distribuído entre instâncias pode exceder a cota efetiva.
3. **Chave legada compartilhada (`ADMIN_API_KEY`)**: identificada como `administrador-compartilhado`, não atribuída a uma pessoa. Preferir `ADMIN_API_KEYS` com chaves individuais em produção.
4. **Logs HTTP do servidor/proxy**: configuração independente da API; devem seguir a política de retenção do ambiente (não são controlados pela API).
5. **Homologação MySQL não configurada localmente**: suíte `test_mysql_homologation` pula sem servidor; a execução contra MySQL só ocorre no CI.
6. **Testes em aparelho físico pendentes**: câmera com placas reais, caminhada no shopping, TalkBack/VoiceOver, rede móvel, desempenho no aparelho-alvo.
