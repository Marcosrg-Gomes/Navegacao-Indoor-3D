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
é atualizada por QR, seleção manual ou confirmação de chegada. Ao tocar em
**Cheguei ao destino**, a loja vira sua localização atual, o mapa abre o piso
correto e a rota concluída desaparece. A próxima rota parte desse local: por
exemplo, entrada → Natura → Anacapri. **Iniciar outra navegação** e **Cancelar
rota** preservam a última localização registrada durante a sessão.

O próximo passo aparece em destaque; **Ver instruções** abre os demais passos
sem repetir o atual. Avançar um passo altera a instrução exibida, sem atualizar
a posição. Nas trocas de piso, o guia identifica o acesso e permite abrir o
trecho seguinte. A localização mostra piso, horário e fonte da confirmação.
Durante o recálculo, o trajeto permanece visível. Se houver falha, um aviso
identifica a rota anterior e a chegada fica desabilitada até uma nova resposta.
**Rota sem escadas** ativa o modo acessível: só usa trechos cadastrados como
acessíveis, evita escadas e escadas rolantes e usa elevador entre pisos. Pode
produzir um caminho mais longo; se não houver alternativa disponível, informa
que não encontrou rota. **O que é acessível?** explica a opção dentro do app.

Na tela inicial, informe sua posição pelo QR Code ou por escolha manual e busque
uma loja ou serviço. Os quatro atalhos grandes abrem diretamente banheiros,
alimentação, elevadores e lojas. Em **Explorar**, a busca, as categorias mais
usadas e a ação **Ir** ficam visíveis; **Filtros** permite combinar piso/categoria e ordenar por nome,
categoria ou distância de percurso calculada pela API. A distância considera
corredores, bloqueios e a opção sem escadas; requer uma origem definida.
Toque no nome para abrir detalhes e em **Ir** para iniciar a navegação,
inclusive para pontos de referência sem loja cadastrada.
Locais fechados ou em manutenção exigem confirmar o aviso antes de traçar a rota.

No celular, o rodapé tem quatro destinos fixos: **Início** para buscar um lugar,
**Mapa** para abrir diretamente a planta, **Ler QR** para atualizar sua posição
e **Explorar** para consultar o diretório. O mapa começa em 2D nas telas web
estreitas; o botão **Mapa 3D** continua disponível. Após ler um QR pelo app,
o mapa abre com a posição atualizada. Uma rota ativa mostra no mapa um atalho
de volta às instruções, sem perder o trajeto.

A estrela salva favoritos; **Recentes** mostra os últimos oito destinos.
**Voltar para a entrada** usa a entrada registrada nesta sessão ou a primeira
entrada cadastrada no shopping. Favoritos, recentes e a dispensa da ajuda inicial
ficam neste aparelho via AsyncStorage (nova dependência compatível com Expo 52),
separados por código do shopping. A posição não é persistida entre sessões.
O botão **Ajuda** reabre as orientações a qualquer momento.

Para explorar os mapas, arraste com um dedo ou com o botão esquerdo do mouse.
Use pinça, roda do mouse ou os botões **+ / −** para aproximar; no 2D, o zoom
acompanha o ponto sob o cursor ou os dedos. É possível mover a planta mesmo em
1×, e a visualização escolhida permanece ao soltar o gesto ou recalcular a rota.
**Ver piso inteiro** restaura o enquadramento; **Minha posição** retorna ao piso
da origem e destaca o ponto registrado; **Centralizar rota** enquadra seu trecho
no piso selecionado. A posição não acompanha o deslocamento da pessoa em tempo real.

No 3D, abra **Mais controles** e use **Vista superior / Vista inclinada** para enxergar os espaços de cima,
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

### Interface e acessibilidade do visitante

O visitante começa por **Onde você quer ir?**, com busca, QR ou escolha do ponto
de partida, quatro categorias de acesso rápido e serviços próximos à posição
confirmada. **Explorar** usa um diretório
alfabético ou por categoria: código do espaço, nome, piso, funcionamento e
distância calculada pela API. No desktop, a lista destaca os locais na planta
ao receber foco ou passar o mouse; no celular, lista e mapa alternam preservando
os filtros. **Filtros** reúne perguntas sobre piso, tipo de local,
funcionamento e necessidade de evitar escadas. Os critérios podem ser removidos.

Logotipos cadastrados em `logo_url` aparecem na lista e nos detalhes. Sem imagem,
ou quando seu carregamento falha, aparecem códigos dos espaços ou símbolos de serviços.
Não são geradas imagens de fachadas: cadastre apenas imagens autorizadas e que
correspondam ao estabelecimento.

Durante a rota, a sinalização destaca **Agora**, **Depois** e **Em seguida**, com
botões imediatos para abrir o mapa e corrigir a posição. A composição e os pisos
do percurso ficam em **Detalhes do percurso**, preservando as informações sem
alongar a tela principal.
**Estou perdido** permite ler QR ou confirmar a entrada de um local reconhecido,
recalculando o destino atual. A chegada aparece antes do mapa e oferece próxima
rota, lugares próximos e correção da posição. **Meus lugares** fixa favoritos na
planta e permite selecionar várias paradas em ordem; cada chegada inicia a próxima
rota a partir do local confirmado. Avisos de proximidade são opcionais e usam
a última posição confirmada, sem rastreamento contínuo.

Na web, **Ver o que encontrarei** abre uma prévia 3D à altura dos olhos usando a
maquete publicada; ela não representa câmera ao vivo. Android/iOS continuam com
a planta 2D. Horários no formato `Diariamente 10:00-22:00 [UTC-03:00]` permitem
mostrar abertura e fechamento e exigir confirmação de trajeto fora do expediente.
Texto livre continua legível sem inferir um horário. Consulte a
[matriz das 20 melhorias](docs/wayfinding-ux.md) para uso, cobertura e limites.
As orientações de design usadas neste ajuste estão instaladas no projeto em
[`.agents/skills/frontend-design`](.agents/skills/frontend-design/SKILL.md).

Os diálogos de detalhes, filtros, ajuda e origem recebem o foco ao abrir, mantêm
Tab dentro do conteúdo, fecham com Escape e devolvem o foco ao acionador na web.
Há foco visível, anúncios de resultados, estados com texto e símbolos e suporte
à preferência de movimento reduzido. Origem e destino têm formas distintas no
mapa 2D. Consulte a [validação de layout e acessibilidade](docs/validacao-layout-acessibilidade.md)
para a cobertura e os testes que ainda dependem de aparelhos físicos.

### Regras de navegação e administração

O visitante verifica a revisão do mapa a cada dois segundos enquanto o aplicativo
está ativo (mais o tempo de resposta da rede). Bloqueios, reaberturas e mudanças de
cadastro provocam atualização dos dados e recálculo da rota. O trajeto anterior
continua legível se o recálculo falhar, mas a confirmação de chegada fica bloqueada.
A chegada consulta novamente a revisão antes de atualizar sua posição. Não existe
rastreamento contínuo: apenas QR, seleção manual e chegada confirmada mudam a origem.

O Explorar permite filtrar estabelecimentos abertos, fechados ou em manutenção e
locais com percurso sem escadas a partir da origem informada. As distâncias e a
disponibilidade desses percursos vêm da API. Esse filtro não certifica as instalações
internas de cada estabelecimento. Destinos fechados exigem confirmação explícita;
registros inativos não são destinos públicos.

O painel **Histórico e falhas** mostra autor autenticado, data, motivo e alterações.
Toda escrita administrativa exige `X-Audit-Reason` com 3 a 240 caracteres (UTF-8
codificado com `encodeURIComponent`); o painel solicita esse motivo antes de salvar.
Integrações que usam a API administrativa também devem enviar o cabeçalho.
A alteração e seu histórico são gravados na mesma transação. Restaurações de edições
usam as validações atuais e recusam conflitos com alterações posteriores. Exclusões
exigem recriação pelo cadastro; tokens de QR são omitidos e não são restaurados.

Para identificar administradores individualmente, configure `ADMIN_API_KEYS` no
`.env` da API como um objeto JSON que associa identificadores a chaves diferentes
de pelo menos 16 caracteres. A chave legada `ADMIN_API_KEY` continua aceita e aparece
como `administrador-compartilhado`, sem atribuição a uma pessoa. Reinicie a API ao
alterar credenciais. Nunca coloque valores reais na documentação ou no Git.
As tabelas aditivas `auditoria` e `diagnosticos` são criadas na inicialização da API.

Os diagnósticos guardam somente contadores por tipo e código de falha, sem identidade,
trajeto ou token. Falhas de rede no visitante ficam em memória e são enviadas quando
a conexão retorna; fechar a sessão descarta os eventos pendentes. Esses contadores
são indicativos, não uma contagem de visitantes. Logs HTTP do servidor/proxy têm
configuração independente e devem seguir a política de retenção do ambiente.

Consulte a [matriz de requisitos e regras](docs/requisitos-e-regras.md) para os
critérios verificáveis e as limitações de validação em aparelhos físicos.

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
npm run test:e2e -- --project=chromium tests/scene.spec.ts tests/map-interactions.spec.ts tests/visitor-journey.spec.ts tests/visitor-experience.spec.ts tests/business-rules.spec.ts tests/layout-accessibility.spec.ts tests/wayfinding.spec.ts
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
- [Validação da chegada e da interface do visitante](docs/validacao-ux-visitante.md)
- [Roteiro de teste em aparelhos e no local](docs/teste-fisico-visitante.md)
- [Plano fornecido](docs/plano-integracao.md)
- [Requisitos, regras e critérios de aceite](docs/requisitos-e-regras.md)
- [Validação das regras de negócio](docs/validacao-regras-negocio.md)
