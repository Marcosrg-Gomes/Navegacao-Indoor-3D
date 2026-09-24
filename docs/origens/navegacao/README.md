# Navegação Indoor

Sistema de navegação indoor para shopping centers baseado em QR Codes, mapas 2D e roteamento via Dijkstra.

## Implementação oficial e homologação

O produto integrado está exclusivamente em `backend/`, `mobile/` e
`admin-panel/`; as demais pastas de projetos são referências. Os gates de CI,
homologação MySQL e os requisitos que ainda dependem de dispositivos, rede e
participantes estão definidos em [IMPLEMENTACAO_OFICIAL.md](IMPLEMENTACAO_OFICIAL.md).

## Requisitos

- Python 3.11+
- MySQL 8.x
- Node.js e npm para mobile e painel admin (revisão executada com Node.js 24.12.0)

## Setup do Backend

1. Crie um ambiente virtual:

   ```bash
   python -m venv venv
   source venv/bin/activate      # Linux/macOS
   .\venv\Scripts\Activate.ps1  # Windows / PowerShell
   ```

2. Instale as dependências:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` com suas credenciais MySQL e a chave de admin.

4. Crie o banco de dados:

   ```sql
   CREATE DATABASE navegacao_indoor;
   ```

5. Popule com dados de exemplo:

   ```bash
   python seed.py
   ```

6. Inicie o servidor:

   ```bash
   uvicorn app.main:app --reload
   ```

7. Acesse a documentação interativa:

   [http://localhost:8000/docs](http://localhost:8000/docs)

## Testes

```bash
cd backend
pytest tests/ -v
```

Os testes Python usam SQLite em memória. Não comprovam a persistência em MySQL exigida para o ambiente de produção.

## Aplicativo e painel administrativo

Instale as dependências usando os lockfiles existentes, em cada diretório:

```bash
cd mobile
npm ci
npm run typecheck
npm run build:web
npm run build:native
cd ../admin-panel
npm ci
npm run build
```

`build:web` exporta o visitante para `backend/app/static/visitor`; o build do painel sai em `backend/app/static/admin`. Inicie ou reinicie o backend **depois** dos builds: visitante em `/`, painel em `/admin/`, API em `/api` e saúde em `/health`. `build:native` exporta bundles Android/iOS; não gera APK/IPA nem substitui execução em dispositivos.

Em desenvolvimento, execute `npm start` em `mobile` e `npm run dev` em `admin-panel`. Para dispositivo físico, configure `EXPO_PUBLIC_API_URL` com o endereço do backend acessível pela rede, conforme `mobile/.env.example`.

## Demonstração e testes ponta a ponta

Após os builds, em um terminal separado:

```bash
cd backend
python audit_server.py --port 8765
```

Esse servidor cria um SQLite temporário e dados de demonstração de dois pisos. Usa a chave administrativa de teste `audit-local-only`; destina-se apenas à auditoria local. Acesse `http://127.0.0.1:8765/?qr=ENTRADA-PRINCIPAL` e `/admin/`.

Em outro terminal:

```bash
cd admin-panel
npx playwright install chromium firefox webkit
```

A configuração inclui Chromium, Firefox e WebKit do Playwright, além dos canais `chrome` e `msedge`, que exigem os respectivos navegadores instalados. Se um canal não existir, registre a lacuna; não interprete teste não executado como aprovado. Para executar apenas um alvo, acrescente `--project=chromium` (ou outro nome).

Para preservar relatórios, screenshots e traces anteriores no PowerShell, use um identificador novo em cada execução:

```powershell
$env:AUDIT_PHASE = 'manual-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$env:AUDIT_REPORT = "../evidence/$env:AUDIT_PHASE-browser-tests.json"
$env:AUDIT_ARTIFACTS = "../evidence/$env:AUDIT_PHASE-browser-artifacts"
npm run test:e2e -- tests/navigation.spec.ts
```

A suíte de navegação não repete o RNF03. O teste de performance está em `tests/performance.spec.ts`; seu perfil e os resultados históricos estão descritos na auditoria. `tests/scanner.spec.ts` verifica a releitura ao retornar à aba com vídeo/decoder simulados apenas no Chromium.

Os testes E2E simulam entrada por link/token QR e confirmação manual de chegada. Leitura óptica com câmera e execução nativa requerem validação em dispositivos. A matriz das duas últimas versões de Chrome, Safari, Firefox e Edge e o teste com cinco usuários continuam pendentes.

## Exemplos de uso (curl)

**Listar shoppings**

```bash
curl http://localhost:8000/api/shoppings
```

**Calcular rota**

```bash
curl -X POST http://localhost:8000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"origem_no_id": 1, "destino_no_id": 15, "acessivel": false}'
```

**Admin: criar nó (com API Key)**

```bash
curl -X POST http://localhost:8000/api/admin/nodes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave-aqui" \
  -d '{"piso_id": 1, "coord_x": 0.5, "coord_y": 0.3, "tipo": "corredor"}'
```

**Resolver QR Code**

```bash
curl http://localhost:8000/api/qr-codes/ENTRADA-PRINCIPAL
```

## Estrutura do Projeto

```
navegacao-indoor/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   └── services/
│   ├── tests/
│   ├── seed.py
│   └── requirements.txt
├── mobile/          # Fase 2
├── admin-panel/     # Fase 3
├── DECISOES.md
└── README.md
```

## Tecnologias

- **FastAPI** — API REST
- **SQLAlchemy** — ORM
- **Pydantic** — validação de dados
- **MySQL** — banco de dados (via pymysql)
- **Uvicorn** — servidor ASGI

## Fases de Entrega

| Fase | Escopo | Status |
|------|--------|--------|
| 1 | Backend (CRUD, Dijkstra, seed, testes) | Implementada; testes SQLite aprovados, homologação MySQL pendente |
| 2 | Visitante web/mobile (React Native + Expo) | Implementada; validação nativa/câmera e RNF08/RNF09 incompletos |
| 3 | Painel admin (React + Vite) | Implementada; build e E2E, homologação de navegadores incompleta |
| 4 | Visualização 3D (opcional) | Fora desta entrega; não implementada |

As Fases 1–3 ainda não têm aceite integral para congelamento. Consulte a matriz de requisitos, resultados e pendências em [AUDITORIA_FASES_1-3.md](AUDITORIA_FASES_1-3.md) e as decisões técnicas em [DECISOES.md](DECISOES.md).

Consolidação de 12/09/2026: a última rodada registrada em 10/09 tem **88 testes Python aprovados** e **26 E2E aprovados, 4 pulados, 0 falhas**. Nesta retomada foram conferidas as evidências existentes, sem repetir testes/builds. Os anexos comprovam rota entre pisos e o ciclo bloquear → recalcular alternativa → reativar (61 → 85 → 61 m). RNF03 tem cinco amostras históricas em 4G simulado, máximos de 2222 ms para mapa e 756 ms para rota. RNF08 é parcial/pendente, nunca N/A; RNF09 permanece pendente.

O aviso de hook não foi atribuído ao pre-commit: não há hook Git ativo na raiz. Foram reproduzidas falhas do lançador de hooks do Token Optimizer sob PowerShell e do alias WSL sem distribuição. O vínculo com o evento original e a correção integrada no Codex permanecem não verificados. Veja o diagnóstico na auditoria e a reprodução `python evidence/verify_hook_launcher.py`, que registra stdout/stderr/exit codes sem alterar hooks ou configuração global.
