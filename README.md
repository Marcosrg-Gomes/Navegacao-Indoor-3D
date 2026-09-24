# Mini Shopping — navegação indoor 2D e 3D

Aplicação integrada do TCC: FastAPI como fonte de verdade para destinos, QR Codes,
grafo e rotas; Blender como fonte da geometria; catálogo versionado como contrato
entre os dois. O visitante usa Expo Web com Three.js/React Three Fiber ou mapa SVG.
Android/iOS usam apenas o mapa 2D. O painel React valida a cena e administra a navegação.

## Estrutura

- `apps/visitor`: Expo / React Native / web.
- `apps/admin`: React / Vite, servido em `/admin/`.
- `services/api`: FastAPI, SQLAlchemy, seed e testes.
- `packages/shopping-3d`: gerador procedural Blender, histórico preservado.
- `packages/scene-contract`: validador compartilhado sem dependências e JSON Schema.
- `assets/models/mini-shopping`: GLB, catálogo e plantas produzidos pelo gerador.
- `assets/qr`: sete QR Codes portáteis (tokens) e folha para impressão.
- `docs`: arquitetura, coordenadas, publicação, proveniência e validação.
- `evidence`: evidências de testes e capturas; bancos e segredos não são versionados.

## Ambiente

Python 3.11+, Node.js 22+ e Blender **4.5.14 LTS** para regenerar o modelo.
Produção usa MySQL; a demonstração abaixo usa SQLite temporário e isolado.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/api/requirements.txt ruff
npm ci --prefix apps/visitor
npm ci --prefix apps/admin
npm run build:web --prefix apps/visitor
npm run build --prefix apps/admin
.\.venv\Scripts\python.exe services/api/mini_server.py --port 8766
```

Abra [o visitante com QR da entrada](http://127.0.0.1:8766/?qr=MINI-ENTRADA-PRINCIPAL)
ou [o painel](http://127.0.0.1:8766/admin/). Na demonstração isolada, a chave do
painel é `audit-local-only`. O servidor escuta apenas no computador local.
Cada execução usa um banco novo; não utiliza `.env` nem modifica bancos existentes.

O Mini Shopping contém 22 lojas, quatro banheiros e entrada principal, distribuídos
em térreo e mezanino. Leia um QR ou escolha uma origem, busque um destino e trace
a rota. O seletor Automático tenta o 3D e retorna ao 2D quando necessário. A posição
é atualizada por QR; chegada e recálculo são ações explícitas do visitante.

Para explorar os mapas, arraste com um dedo ou com o botão esquerdo do mouse.
Use pinça, roda do mouse ou os botões **+ / −** para aproximar; no 2D, o zoom
acompanha o ponto sob o cursor ou os dedos. É possível mover a planta mesmo em
1×, e a visualização escolhida permanece ao soltar o gesto ou recalcular a rota.
**Ver piso inteiro** restaura o enquadramento; **Minha posição** retorna ao piso
da origem e destaca o ponto registrado; **Centralizar rota** enquadra seu trecho
no piso selecionado. A posição não acompanha o deslocamento da pessoa em tempo real.

No 3D, use **Vista superior / Vista inclinada** para enxergar os espaços de cima,
e as setas de rotação ou o botão direito do mouse para mudar o ângulo. Nomes dos
locais aparecem ao aproximar. Verde indica origem, vermelho destino, azul rota
e roxo os acessos entre pisos. A seta **N** mostra a orientação, e o 2D inclui
uma escala em metros. As setas do teclado também movem o mapa quando ele tem foco.

## Banco persistente e desenvolvimento

Em `services/api`, copie `.env.example` para `.env` e configure `DATABASE_URL`,
`ADMIN_API_KEY` e `SECRET_KEY` com valores próprios. Nunca versione esse arquivo.
Execute, nessa pasta:

```powershell
..\..\.venv\Scripts\python.exe seed_mini_shopping.py
..\..\.venv\Scripts\python.exe publish_scene.py ../../assets/models/mini-shopping/scene-catalog-v1.json
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

A seed é aditiva: não apaga registros, não reativa bloqueios e não sobrescreve
alterações administrativas. `seed.py` continua sendo a demonstração antiga e
nunca é usada para construir o Mini Shopping. A publicação valida os vínculos e
a conectividade comum/acessível antes de ativar o catálogo. Ajustes posteriores
no banco são verificados pelo endpoint da cena e pelo painel.

Para desenvolver as interfaces: `npm start --prefix apps/visitor` e
`npm run dev --prefix apps/admin`. O Vite encaminha `/api` e `/static` para a
API em `127.0.0.1:8000`. `EXPO_PUBLIC_API_URL` em `apps/visitor/.env` permite
selecionar uma API acessível pela rede; o arquivo de exemplo documenta a variável.

## Validação

```powershell
.\.venv\Scripts\python.exe -m pytest services/api/tests -q
npm run typecheck --prefix apps/visitor
npm run build:web --prefix apps/visitor
npm run build:native --prefix apps/visitor
npm run build --prefix apps/admin
```

Em `packages/shopping-3d`:

```powershell
..\..\.venv\Scripts\python.exe -m unittest discover -s tests -v
..\..\.venv\Scripts\python.exe -m ruff check tests scripts utils/mesh_data.py config.py utils/geometry.py navigation.py
..\..\.venv\Scripts\python.exe -m ruff format --check tests scripts utils/mesh_data.py
blender --background --factory-startup --python-exit-code 1 --python scripts/validate_navigation_geometry.py
```

Com `mini_server.py` rodando, em `apps/admin`:

```powershell
npx playwright install chromium
$env:AUDIT_URL = 'http://127.0.0.1:8766'
$env:AUDIT_REPORT = '../../evidence/integration-browser-tests.json'
$env:AUDIT_ARTIFACTS = '../../evidence/integration-browser-artifacts'
npm run test:e2e -- --project=chromium tests/scene.spec.ts tests/map-interactions.spec.ts
```

Os testes E2E antigos usam `services/api/audit_server.py --port 8765` e a fixture
antiga. São mantidos no CI junto aos novos fluxos. Uma exportação Android/iOS
nunca equivale à execução em dispositivo físico.

## Documentação

- [Arquitetura e decisões](docs/arquitetura-integracao.md)
- [Coordenadas, passarelas e âncoras](docs/coordenadas-e-ancoras.md)
- [Geração e publicação do GLB](docs/publicacao-modelo-3d.md)
- [Origem dos módulos e referências](docs/referencias.md)
- [Evidências e limitações da validação](docs/validacao-integracao.md)
- [Plano fornecido](docs/plano-integracao.md)
