# Relatório de Preparação e Correção da Parte Prática — TCC Navegação Indoor 3D

## 1. Diagnóstico Inicial

Ao inspecionar o ambiente de execução e a solicitação do projeto:
- **Python / Uvicorn:** Falhava ao iniciar a API devido ao erro:
  `pymysql.err.OperationalError: (1049, "Unknown database 'navegacao_indoor'")`
- **Servidor MySQL:** Executando localmente em `127.0.0.1:3306`, contendo diversos bancos de outros projetos e o banco `navegacao_indoor_homologacao_20261105` (que continha 0 tabelas e não deve ser modificado). O banco de dados alvo `navegacao_indoor` não existia no servidor.
- **Frontend Admin (`apps/admin`):** React + Vite + TypeScript. Código e builds configurados para saída em `services/api/app/static/admin`.
- **Frontend Visitante (`apps/visitor`):** Expo + React Native for Web + Three.js + React Three Fiber. Possuía um erro de tipagem TypeScript no componente `WazeNavigationPanel.tsx` introduzido em edições locais anteriores.
- **Mecanismo de Persistência e Dados:** O projeto possui scripts idempotentes `seed_mini_shopping.py` e `publish_scene.py` integrados ao contrato de cena espacial do Blender (`assets/models/mini-shopping/scene-catalog-v1.json`).

---

## 2. Problemas Encontrados e Causas

1. **Banco de Dados Inexistente (`navegacao_indoor`):**
   - *Causa:* O banco configurado na variável `DATABASE_URL` do `.env` ainda não havia sido criado no MySQL local.
2. **Ausência de Carga Inicial e Esquema no Banco:**
   - *Causa:* Com a ausência do banco, as tabelas e dados das lojas, andares, nós e arestas ainda não estavam instanciados.
3. **Erro de Tipagem TypeScript no App Visitante:**
   - *Causa:* No arquivo `apps/visitor/components/WazeNavigationPanel.tsx`, a propriedade `nav.route.destino_no_id` estava sendo referenciada, mas ela pertence ao contexto `nav.destinationNodeId` e não ao tipo `RotaResponse`. Isso impedia a checagem de tipos (`tsc --noEmit`).

---

## 3. Ações Realizadas e Modificações

1. **Criação Segura do Banco de Dados:**
   - Foi criado exclusivamente o banco de dados `navegacao_indoor` com charset `utf8mb4` e collation `utf8mb4_unicode_ci`.
   - Nenhum outro banco de dados do servidor foi alterado ou apagado, preservando integralmente o banco `navegacao_indoor_homologacao_20261105`.
2. **Estruturação do Esquema e Migrações:**
   - Executados `Base.metadata.create_all()` e `upgrade_schema()`.
   - Todas as 9 tabelas foram criadas com seus relacionamentos e índices: `shoppings`, `pisos`, `nos`, `arestas`, `lojas`, `categorias`, `qr_codes`, `auditoria` e `diagnosticos`.
3. **Carga Inicial dos Dados do Mini Shopping:**
   - Executado `services/api/seed_mini_shopping.py`, populando:
     - 1 Shopping ("Mini Shopping")
     - 2 Pisos (Térreo e Mezanino)
     - 8 Categorias
     - 27 Lojas / POIs
     - 79 Nós de navegação
     - 87 Arestas direcionadas e ponderadas
     - 7 Tokens de QR Code
4. **Publicação e Validação do Cenário 3D:**
   - Executado `services/api/publish_scene.py`, validando a integridade dos artefatos:
     - GLB: `mini-shopping-v1.glb` (3,48 MB)
     - Plantas baixas vetoriais: `terreo-v1.svg` e `mezanino-v1.svg`
     - Catálogo de release: `published-scenes.json`
5. **Correção do Bug de Tipagem no Visitante:**
   - Ajustado [WazeNavigationPanel.tsx](file:///c:/Users/Dev_2o_Ano/Documents/Marcos/Navegacao-Indoor-3D/apps/visitor/components/WazeNavigationPanel.tsx#L47) para utilizar `nav.destinationNodeId`, eliminando o erro TS2339.
6. **Compilação das Aplicações Web:**
   - `apps/admin`: `npm run build` gerou o bundle de produção em `services/api/app/static/admin`.
   - `apps/visitor`: `npm run build:web` gerou o bundle web exportado em `services/api/app/static/visitor`.

---

## 4. Testes e Evidências de Validação

- **Testes Automatizados Backend (`pytest`):**
  - **174 testes aprovados** (1 teste pulado condicionalmente de homologação externa MySQL).
- **Testes de Endpoints da API:**
  - `GET /health` -> 200 OK (`{"status": "ok", "versao": "1.0.0"}`)
  - `GET /api/shoppings` -> 200 OK (retorna Mini Shopping)
  - `GET /api/shoppings/1/floors` -> 200 OK (Térreo e Mezanino)
  - `GET /api/shoppings/1/scene` -> 200 OK (aponta para o GLB publicado)
  - `GET /api/pois?shopping_id=1` -> 200 OK (27 destinos disponíveis)
  - `GET /api/qr-codes/MINI-ENTRADA-PRINCIPAL` -> 200 OK (resolve origem Nó 45)
  - `POST /api/routes` -> 200 OK (calculou percurso da Entrada Principal até ADIDAS com 14.5m, passos textuais e coordenadas)
- **Entrega Estática dos Frontends via FastAPI:**
  - `GET /` -> 200 OK (Visitante HTML entregue)
  - `GET /admin/` -> 200 OK (Admin HTML entregue)
  - `GET /static/models/mini-shopping/mini-shopping-v1.glb` -> 200 OK (3.488.904 bytes entregues com sucesso)
- **Verificação de Tipos e Build:**
  - `apps/admin`: `npm run build` concluído com sucesso.
  - `apps/visitor`: `npx tsc --noEmit` concluído sem erros.
  - `apps/visitor`: `npm run build:web` concluído com sucesso.

---

## 5. Documentação Entregue

- Arquivo criado: [docs/COMO_EXECUTAR_PARTE_PRATICA.md](file:///c:/Users/Dev_2o_Ano/Documents/Marcos/Navegacao-Indoor-3D/docs/COMO_EXECUTAR_PARTE_PRATICA.md)
  - Contém pré-requisitos, instruções de terminal, comandos de execução, endereços de acesso local, roteiro de demonstração para banca e guia de solução de problemas.
