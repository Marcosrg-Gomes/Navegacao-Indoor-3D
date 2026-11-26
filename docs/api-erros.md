# Erros da API — códigos HTTP e X-Error-Code

Extraídos do código em `services/api/app/routers/public.py`,
`services/api/app/routers/admin.py`, `services/api/app/auth.py` e
`services/api/app/main.py`. O cliente deve ler o cabeçalho `X-Error-Code` (exposto
pelo CORS em `main.py`) para distinguir a causa do erro além do status HTTP.

## Erros públicos (`/api/*`)

| Código HTTP | X-Error-Code | Contexto | Detalhe típico | Endpoint |
|-------------|--------------|----------|----------------|----------|
| `403` | — | Chave de API admin inválida ou ausente | "Chave de API inválida" | `/api/admin/*` (todos) |
| `404` | — | Shopping não encontrado ou inativo | "Shopping não encontrado ou inativo" | `GET /api/shoppings/{id}` |
| `404` | — | Piso não encontrado ou inativo | "Piso não encontrado ou inativo" | `GET /api/floors/{piso_id}/graph` |
| `404` | — | POI não encontrado ou inativo | "POI não encontrado ou inativo" | `GET /api/pois/{loja_id}` |
| `404` | — | QR Code não encontrado ou inativo | "QR Code não encontrado ou inativo" | `GET /api/qr-codes/{token}` |
| `404` | `SEM_ROTA` (ou código do motor) | Rota não encontrada / sem caminho | "Rota não encontrada" | `POST /api/routes` |
| `404` | — | Origem não encontrada ou inativa | "Origem não encontrada ou inativa" | `GET /api/routes/distances` |
| `409` | `DESTINO_INDISPONIVEL` | Destino fechado ou não publicado | "Destino indisponível..." / "Destino não publicado ou inativo." | `POST /api/routes` |
| `422` | — | Erro de validação do corpo (Pydantic) | campo ausente/tipo inválido | qualquer `POST/PUT` público |
| `429` | — | Limite de requisições de rotas excedido | "Limite de requisições excedido" + `Retry-After` | `POST /api/routes` |
| `429` | — | Limite de diagnósticos excedido | "Limite de diagnósticos excedido" | `POST /api/diagnostics/events` |

Notas:
- `409 DESTINO_INDISPONIVEL` é retornado quando o destino está fechado/em manutenção
  sem confirmação (`confirmar_indisponivel=false`) ou quando não está publicado
  (`ativo=false`). O cliente deve exigir confirmação explícita antes de traçar a rota.
- `404 SEM_ROTA` (ou outro código do motor de navegação) indica que não há caminho
  entre origem e destino, considerando bloqueios e preferência de acessibilidade.
- Os limites `429` são por endereço da conexão direta e por processo da API; não são
  quota global entre múltiplos workers/instâncias.

## Erros administrativos (`/api/admin/*`)

Toda escrita administrativa exige `X-Audit-Reason` (3–240 caracteres, URL-encoded).

| Código HTTP | Contexto | Detalhe típico | Endpoint |
|-------------|----------|----------------|----------|
| `403` | Chave de API admin inválida | "Chave de API inválida" | todos os endpoints admin |
| `400` | Nó/piso/aresta/categoria inválido, conectores incompatíveis, distância entre pisos não informada, etc. | varia | `POST/PUT` admin |
| `404` | Registro não encontrado (shopping, piso, nó, aresta, loja, categoria, QR) | "... não encontrado" | `GET/PUT/DELETE` admin |
| `409` | Código/vínculo já utilizado (IntegrityError); nó já vinculado a loja; categoria já existe; token QR já em uso; novo nó já vinculado | varia | `POST/PUT` admin |
| `422` | Distância em metros não informada para conexão entre pisos; nós coincidentes precisam de distância positiva | varia | `POST/PUT /api/admin/edges` |

## Observações de segurança

- `403` protege todas as escritas/leituras administrativas (`verify_api_key` em `auth.py`).
- O CORS permite qualquer origem (`allow_origins=["*"]`) com `allow_credentials=False` e expõe `X-Error-Code`; os clientes autenticam via cabeçalho `X-API-Key`, não cookies.
- Nenhum texto livre é registrado em diagnósticos: `POST /api/diagnostics/events` aceita somente `tipo` e `codigo` de enum definido no schema; campos adicionais são rejeitados (`extra="forbid"`).
