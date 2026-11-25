# Evidências para a Banca — Navegacao-Indoor-3D

## Status do Projeto

- **Branch:** `casa/integracao-mobile`
- **Commit-base:** `ab63b7a` (feat: orientação 0°/180° dos mapas, redesign e acessibilidade)
- **178 testes aprovados, 0 reprovados, 1 skip** (suíte de backend, exceto test_scene.py com erro de ambiente Windows)
- **Banco MySQL original:** preservado, sem modificações destrutivas

## Evidências Disponíveis

### 1. Painel Administrativo
- Endpoints CRUD: `/api/admin/{shoppings,floors,nodes,edges,stores,categories,qr-codes}`
- Auditoria: `/api/admin/audit` com antes/depois, usuário, motivo
- Validação de cena: `/api/admin/shoppings/{id}/scene/validation`
- Autenticação: `X-API-Key` obrigatória (403 sem chave)

### 2. Cadastro de Lojas (POIs)
- Endpoint: `POST /api/admin/stores`
- Campos: nome, categoria, status operacional, horário, telefone, logo
- Reflexo no visitante: `GET /api/pois` lista lojas cadastradas

### 3. Cadastro e Resolução de QR Code
- Endpoint: `POST /api/admin/qr-codes` + `GET /api/qr-codes/{token}`
- QR Codes de exemplo: `MINI-ENTRADA-PRINCIPAL`, `MINI-ELEVADOR-TERREO`, etc.
- Resolve token → nó com piso e shopping

### 4. Mapa 2D
- Endpoint: `GET /api/floors/{piso_id}/graph`
- Retorna nós, arestas e conexões entre pisos

### 5. Mapa 3D
- Endpoint: `GET /api/shoppings/{id}/scene`
- Retorna floors, pois, anchors com coordenadas e versão do catálogo

### 6. Rota Calculada
- Endpoint: `POST /api/routes`
- Retorna nós, distância total, instruções, etapas, resumo (elevadores, escadas, metros)

### 7. Rota Acessível
- Parâmetro: `acessivel=true` em `POST /api/routes`
- Exclui escadas e escadas rolantes, usa elevador entre pisos
- Mensagem explícita quando não há caminho acessível

### 8. Bloqueio de Passagem
- Admin desativa aresta: `PUT /api/admin/edges/{id}` com `ativa: false`
- Visitante recebe rota alternativa ou `SEM_ROTA`
- Revisão de navegação muda após alteração

### 9. Recálculo de Rota
- Mesmo endpoint `POST /api/routes` após mudança de dados
- Grafo reconstruído a cada requisição (sem cache obsoleto)

### 10. Confirmação de Chegada
- Gerenciado pelo visitante (nó destino vira origem da próxima rota)
- Loja fechada exige `confirmar_indisponivel: true` para calcular rota

## Evidências Pendentes (Validação Presencial - SENAI)

| Item | Motivo |
|---|---|
| Leitura óptica de QR Code físico | Requer câmera de dispositivo real |
| Navegação em Android/iOS | Requer dispositivo móvel |
| TalkBack / VoiceOver | Leitores de tela nativos |
| Caminhada presencial no shopping | Infraestrutura física do SENAI |
| MySQL institucional | Requer servidor configurado pelo SENAI |
| Navegadores adicionais (Edge, Safari móvel) | Disponibilidade de dispositivos |
| Desempenho no aparelho-alvo | Hardware específico |

## Comandos para Reproduzir a Demonstração

```powershell
# 1. Iniciar a API (SQLite temporário, isolado)
.\.venv\Scripts\python.exe services/api/mini_server.py --port 8766

# 2. Acessar visitante
http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL

# 3. Acessar painel administrativo
http://127.0.0.1:8766/admin/

# 4. Validar testes de backend
.\.venv\Scripts\python.exe -m pytest services/api/tests -q --ignore=services/api/tests/test_scene.py
```

## Arquivos Modificados Neste Lote

- `Rodar.md` — adicionada seção de validação rápida da API
- `docs/COMO_EXECUTAR_PARTE_PRATICA.md` — adicionada seção de validação rápida da API
- `EVIDENCIAS_BANCA.md` — **novo** — lista de evidências para a banca

## Limitação do Frontend

Os builds do frontend (`npm run build` para admin e visitor) falham devido à
dependência ausente `@fontsource/ibm-plex-sans` no ambiente local. Isso é de
responsabilidade do frontend (Claude Code) e não afeta a API. A demonstração
do backend funciona completamente via endpoints REST.
