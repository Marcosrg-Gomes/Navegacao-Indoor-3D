# Sincronização do TCC

- Repositório: https://github.com/Marcosrg-Gomes/Navegacao-Indoor-3D.git
- Commit: 93c8c4dc96054145dd5fd3898348f1266c7354e6 (93c8c4d)
- Data do commit: 2026-11-26 13:39:03 -0300
- Gerado em: 2026-11-26T16:39:46.799380+00:00
- Branch: fix/tcc-final

## Tabelas e campos da API

### shoppings
- codigo: VARCHAR(80) NOT NULL
- id: INTEGER NOT NULL (PK)
- nome: VARCHAR(200) NOT NULL
- endereco: TEXT nullable
- latitude: NUMERIC(10, 8) nullable
- longitude: NUMERIC(11, 8) nullable
- ativo: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### pisos
- codigo: VARCHAR(80) NOT NULL
- id: INTEGER NOT NULL (PK)
- shopping_id: INTEGER NOT NULL
- nome: VARCHAR(100) NOT NULL
- nivel: INTEGER NOT NULL
- imagem_planta_url: VARCHAR(500) nullable
- largura_metros: NUMERIC(8, 2) nullable
- altura_metros: NUMERIC(8, 2) nullable
- ativo: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### nos
- codigo: VARCHAR(80) NOT NULL
- id: INTEGER NOT NULL (PK)
- piso_id: INTEGER NOT NULL
- coord_x: NUMERIC(10, 6) NOT NULL
- coord_y: NUMERIC(10, 6) NOT NULL
- tipo: VARCHAR(20) NOT NULL
- nome: VARCHAR(200) nullable
- ativo: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### arestas
- id: INTEGER NOT NULL (PK)
- no_origem_id: INTEGER NOT NULL
- no_destino_id: INTEGER NOT NULL
- distancia: NUMERIC(10, 2) NOT NULL
- bidirecional: BOOLEAN NOT NULL
- acessivel: BOOLEAN NOT NULL
- ativa: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### lojas
- codigo: VARCHAR(80) NOT NULL
- id: INTEGER NOT NULL (PK)
- no_id: INTEGER NOT NULL
- nome: VARCHAR(200) NOT NULL
- descricao: TEXT nullable
- categoria_id: INTEGER NOT NULL
- horario_funcionamento: VARCHAR(200) nullable
- telefone: VARCHAR(20) nullable
- logo_url: VARCHAR(500) nullable
- status_operacional: VARCHAR(20) NOT NULL
- ativo: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### categorias
- id: INTEGER NOT NULL (PK)
- nome: VARCHAR(100) NOT NULL
- icone: VARCHAR(100) nullable
- criado_em: DATETIME NOT NULL

### qr_codes
- id: INTEGER NOT NULL (PK)
- no_id: INTEGER NOT NULL
- token: VARCHAR(100) NOT NULL
- ativo: BOOLEAN NOT NULL
- criado_em: DATETIME NOT NULL
- atualizado_em: DATETIME nullable

### auditoria
- id: INTEGER NOT NULL (PK)
- usuario: VARCHAR(80) NOT NULL
- motivo: VARCHAR(240) NOT NULL
- entidade: VARCHAR(40) NOT NULL
- registro_id: INTEGER NOT NULL
- acao: VARCHAR(20) NOT NULL
- antes: JSON nullable
- depois: JSON nullable
- criado_em: DATETIME NOT NULL

### diagnosticos
- tipo: VARCHAR(20) NOT NULL (PK)
- codigo: VARCHAR(20) NOT NULL (PK)
- ocorrencias: INTEGER NOT NULL
- atualizado_em: DATETIME NOT NULL

## Endpoints da API

-  
-  /admin
- GET /admin
- GET /api/admin/audit
- POST /api/admin/audit/{audit_id}/restore
- GET /api/admin/categories
- POST /api/admin/categories
- DELETE /api/admin/categories/{id}
- GET /api/admin/categories/{id}
- PUT /api/admin/categories/{id}
- GET /api/admin/diagnostics
- GET /api/admin/edges
- POST /api/admin/edges
- DELETE /api/admin/edges/{id}
- GET /api/admin/edges/{id}
- PUT /api/admin/edges/{id}
- GET /api/admin/floors
- POST /api/admin/floors
- DELETE /api/admin/floors/{id}
- GET /api/admin/floors/{id}
- PUT /api/admin/floors/{id}
- POST /api/admin/floors/{id}/upload-planta
- GET /api/admin/graph/validate
- GET /api/admin/nodes
- POST /api/admin/nodes
- DELETE /api/admin/nodes/{id}
- GET /api/admin/nodes/{id}
- PUT /api/admin/nodes/{id}
- GET /api/admin/qr-codes
- POST /api/admin/qr-codes
- DELETE /api/admin/qr-codes/{id}
- GET /api/admin/qr-codes/{id}
- PUT /api/admin/qr-codes/{id}
- GET /api/admin/session
- GET /api/admin/shoppings
- POST /api/admin/shoppings
- DELETE /api/admin/shoppings/{id}
- GET /api/admin/shoppings/{id}
- PUT /api/admin/shoppings/{id}
- GET /api/admin/shoppings/{shopping_id}/scene/validation
- GET /api/admin/stores
- POST /api/admin/stores
- DELETE /api/admin/stores/{id}
- GET /api/admin/stores/{id}
- PUT /api/admin/stores/{id}
- POST /api/diagnostics/events
- GET /api/floors/{piso_id}/graph
- GET /api/pois
- GET /api/pois/{loja_id}
- GET /api/qr-codes/{token}
- POST /api/routes
- GET /api/routes/distances
- GET /api/shoppings
- GET /api/shoppings/{shopping_id}
- GET /api/shoppings/{shopping_id}/floors
- GET /api/shoppings/{shopping_id}/navigation-state
- GET /api/shoppings/{shopping_id}/scene
- GET, HEAD /docs
- GET, HEAD /docs/oauth2-redirect
- GET /health
- GET, HEAD /openapi.json
- GET, HEAD /redoc
-  /static

## Seed (Mini Shopping)

- Pisos: 2
- POIs/lojas: 27
- Tokens QR: 7

## Testes da API por suíte

- test_api.py: 20 teste(s) definido(s)
- test_audit.py: 15 teste(s) definido(s)
- test_business_rules.py: 9 teste(s) definido(s)
- test_config.py: 8 teste(s) definido(s)
- test_diagnostics_rate_limit.py: 4 teste(s) definido(s)
- test_integracao_admin_visitante.py: 9 teste(s) definido(s)
- test_integracao_funcional.py: 10 teste(s) definido(s)
- test_mysql_homologation.py: 1 teste(s) definido(s)
- test_navigation.py: 13 teste(s) definido(s)
- test_public_rate_limit.py: 9 teste(s) definido(s)
- test_scene.py: 11 teste(s) definido(s)
- test_seguranca_estabilidade.py: 8 teste(s) definido(s)
- test_wayfinding.py: 5 teste(s) definido(s)

- Total pytest: 202 aprovados, 1 ignorados, 0 falhos
