# Perguntas Possíveis da Banca e Respostas Técnicas

**Apresentação:** 26/11/2026 | **Tempo para perguntas:** 10 minutos

---

## Perguntas sobre Arquitetura

### Q1: Por que usar FastAPI em vez de outro framework?
**R:** FastAPI foi escolhido por ser assíncrono, rápido, com validação automática de dados via Pydantic e geração automática de documentação OpenAPI. É adequado para APIs REST que servem como fonte de verdade de navegação, com baixo overhead e boa performance para cálculo de rotas.

### Q2: Por que separar a API do Blender? Não poderia ser tudo em um só lugar?
**R:** A separação segue o princípio de responsabilidade única. A API é a fonte da navegação (identidades, disponibilidade, grafos, rotas, bloqueios). O Blender é a fonte da geometria publicada (modelo 3D, plantas, posições). O contrato de cena (scene-catalog-v1.json) é o elo único entre os dois. Isso evita que coordenadas físicas fiquem duplicadas no frontend e permite que cada camada evolua independentemente.

### Q3: Por que um monorepo?
**R:** O monorepo facilita o versionamento conjunto de backend, frontends, contrato de cena e modelo 3D. Alterações no contrato de cena afetam simultaneamente API e frontend, garantindo consistência. Também simplifica o compartilhamento de tipos e validadores.

### Q4: Por que não usar WebSocket para atualização em tempo real da posição?
**R:** O sistema não faz rastreamento contínuo. A posição é atualizada apenas por QR Code, seleção manual ou confirmação de chegada. HTTP com polling de revisão (a cada 2 segundos no app ativo) é suficiente para detectar mudanças no grafo sem a complexidade de WebSockets.

---

## Perguntas sobre Tecnologias

### Q5: Por que Expo e não React Native puro?
**R:** Expo simplifica o desenvolvimento para Web, Android e iOS a partir de uma única base de código. Fornece ferramentas de build, gestão de assets e suporte a módulos nativos sem a necessidade de configurar manualmente o ambiente React Native. Para o TCC, permite demonstrar em web com mínimo esforço de configuração.

### Q6: Por que Three.js e React Three Fiber para o 3D?
**R:** Three.js é o padrão de fato para renderização 3D na web. React Three Fiber permite integrar Three.js com React de forma declarativa. O carregamento sob demanda (importação dinâmica apenas na web) evita carregar a biblioteca pesada em Android/iOS, que usam mapa 2D.

### Q7: Por que SQLite para demonstração e MySQL para produção?
**R:** SQLite permite uma demonstração local isolada, sem necessidade de instalar ou configurar um servidor de banco de dados. Cada execução cria um banco temporário, não alterando bancos existentes. MySQL é usado em produção por ser um banco relacional robusto, com suporte a concorrência e integração institucional.

---

## Perguntas sobre Funcionalidades

### Q8: O sistema faz rastreamento em tempo real do visitante?
**R:** Não. A posição é atualizada apenas por três mecanismos: leitura de QR Code, seleção manual da origem ou confirmação de chegada. Não há rastreamento contínuo, não usa GPS, Bluetooth, Wi-Fi ou sensores físicos. A simulação de navegação é explicitamente identificada como "modo demonstração — posição simulada".

### Q9: Como funciona a rota acessível?
**R:** A rota sem escadas exclui escadas e escadas rolantes do grafo de cálculo. Usa apenas arestas marcadas como acessíveis, incluindo o elevador para transição entre pisos. Pode produzir um caminho mais longo. Se não houver alternativa disponível, o sistema informa que não encontrou rota. Isso não é certificação de acessibilidade do edifício real.

### Q10: E se o QR Code for movido fisicamente?
**R:** O sistema não detecta deslocamentos físicos de QR Codes. O token do QR Code está vinculado a um nó no banco. Se uma placa for movida, é necessário atualizar o vínculo no cadastro. A leitura óptica depende da câmera do dispositivo e condições de iluminação, que não foram validadas em ambiente físico.

### Q11: Como o sistema lida com bloqueios?
**R:** Arestas podem ser bloqueadas no cadastro. O algoritmo de Dijkstra respeita arestas inativas/bloqueadas. A revisão do shopping é consultada a cada 2 segundos pelo app ativo; mudanças provocam recálculo automático. Se o recálculo falhar, o trajeto anterior permanece visível, mas a confirmação de chegada fica bloqueada até nova validação.

### Q12: O que acontece se o modelo 3D (GLB) falhar ao carregar?
**R:** O sistema tem fallback para o mapa 2D. Se o GLB não responder dentro de 20 segundos, o mapa 2D é mostrado com destino e instruções, com opção de nova tentativa. WebGL indisponível também preserva a origem por QR e mostra mapa 2D.

---

## Perguntas sobre Banco de Dados e Persistência

### Q13: Que dados são persistidos no dispositivo do visitante?
**R:** Apenas favoritos (até 100 por shopping), destinos recentes (até 8 por shopping) e dispensa da ajuda inicial, via AsyncStorage. Usam códigos estáveis de shopping e identificadores de nó/POI. Nenhuma posição física, credencial ou dado pessoal é persistido. A posição não é mantida entre sessões.

### Q14: Como funciona a auditoria administrativa?
**R:** Toda escrita administrativa requer o cabeçalho X-Audit-Reason (3-240 caracteres). A alteração e seu histórico são gravados na mesma transação, registrando autor autenticado, data/hora UTC, motivo e estado antes/depois. Restaurações de edições usam validadores atuais e recusam conflitos com alterações posteriores.

### Q15: Por que não usar Alembic para migrations?
**R:** A migração para Alembic foi registrada como dívida técnica documentada no plano de integração. Atualmente, o esquema é criado via Base.metadata.create_all() e upgrade_schema(). Não há necessidade de apagar o banco para evoluir o esquema.

---

## Perguntas sobre Testes e Validação

### Q16: Quais testes foram realmente executados?
**R:** 129 testes de backend (1 ignorado por MySQL), 9 testes de Blender/Python, TypeScript e build do visitante e painel, 7 testes E2E integrados no Chromium, 8 testes de regressão, 34 cenários de layout/acessibilidade e 29 verificações de regras de negócio. Total de 174 testes aprovados na suíte backend.

### Q17: O que NÃO foi testado?
**R:** Validação física em aparelhos reais (Android/iPhone), leitura óptica de QR Codes com câmera real, TalkBack/VoiceOver, MySQL executado localmente, navegadores Firefox/WebKit/Chrome instalado/Edge, instalação em emulador ou aparelho físico, vulnerabilidades de dependências (29 visitor, 4 painel), hospedagem e credenciais de produção.

### Q18: Como validar a correção das rotas?
**R:** Os testes de integração verificam fluxos ponta a ponta no navegador: QR da entrada → busca → rota → GLB real → mesmos nós em 3D e SVG → confirmação de chegada. Os testes calculam rota comum e acessível da entrada a cada um dos 27 destinos. Rotas acessíveis para o mezanino usam elevador; bloqueio desse acesso retorna indisponibilidade.

---

## Perguntas sobre QR Codes e Localização

### Q19: Quantos QR Codes existem e onde ficam?
**R:** Existem 7 QR Codes portáteis em assets/qr/, cada um associado a um nó do Mini Shopping (entrada, corredores, elevador, escadas, pontos estratégicos). Cada código tem um token único vinculado a um nó na hierarquia ativa.

### Q20: O visitante pode definir origem sem ler QR Code?
**R:** Sim. O sistema oferece opção de código manual e seleção manual da origem na tela de leitura de QR Code. Isso permite usar o sistema mesmo sem câmera ou se o QR Code não estiver disponível.

---

## Perguntas sobre Limitações e Trabalhos Futuros

### Q21: Qual é a maior limitação do sistema atualmente?
**R:** A validação física em ambiente real ainda não foi executada. Isso inclui leitura óptica de QR Codes, câmera real, teste com visitantes, TalkBack/VoiceOver, rede móvel e desempenho em aparelho físico. Um roteiro de teste físico está preparado em docs/teste-fisico-visitante.md, mas depende de execução presencial.

### Q22: O sistema está pronto para produção?
**R:** Não. Ainda há vulnerabilidades de dependências não tratadas (29 no visitante, 4 no painel), não há hospedagem, domínio ou credenciais de produção definidas, e MySQL não foi homologado localmente. O hardening de dependências deve preceder qualquer implantação pública.

### Q23: Quais são os próximos passos após o TCC?
**R:** Execução do roteiro de teste físico, homologação MySQL em produção, tratamento de vulnerabilidades de dependências, definição de hospedagem e credenciais, possível migração para Alembic, e avaliação de acessibilidade normativa de edifício real.

---

## Como Responder Perguntas que Você Não Sabe

1. **Seja honesto:** "Essa informação não está disponível no estado atual do projeto."
2. **Aponte para documentação:** "Isso está detalhado em docs/[arquivo].md."
3. **Marque como trabalho futuro:** "Isso está nos trabalhos futuros e depende de [condição]."
4. **Não invente:** Nunca crie funcionalidades, tecnologias ou resultados que não existam no código.
5. **Redirecione para evidências:** "Os resultados de teste estão em evidence/ e podem ser verificados."
