# Plano de implementação — navegação indoor autônoma

**Estado:** proposta para execução incremental. **Base:** monorepo e documentação de 29/09/2026. **Objetivo:** transformar o Início em uma tela de navegação viva, com posição estimada durante a caminhada, instruções úteis, recálculo e recuperação quando a precisão cair. O mapa e as rotas existentes continuam sendo a base.

## 1. Ponto de partida e limites

Hoje o visitante tem busca, mapa 2D no app nativo, mapa 2D/3D na web, rota calculada pela API, leitura de QR, origem manual e chegada confirmada. A API controla o grafo, os bloqueios e as rotas. O Blender gera as coordenadas físicas e o catálogo. A posição só muda por QR, origem manual ou confirmação de chegada; avançar uma instrução não mede caminhada. Não existe posicionamento automático, direção do celular ou confirmação física da chegada.

O Mini Shopping é uma maquete de 30 × 60 m em dois pisos. Um piloto presencial exige levantamento do edifício real, consentimento do responsável, correspondência entre planta e passagens, inventário de pontos de acesso/beacons e instalação de equipamentos. Os critérios abaixo são metas de piloto propostas, não precisão já comprovada.

## 2. Experiência alvo no celular

No **Início**, o mapa ocupa a área principal. Uma busca simples fica no topo; piso e estado da posição aparecem perto dela. Com rota ativa, um cartão inferior mostra a próxima decisão, distância restante e o acesso entre pisos quando necessário. O marcador de posição mostra também uma área de incerteza. A aba **Mapa** serve para consulta livre; **Ler QR** corrige a posição; **Explorar** é o diretório. Selecionar **Ir** em Explorar abre o Início com a rota.

Arrastar ou ampliar o mapa interrompe o acompanhamento da câmera sem alterar a posição. **Minha posição** retoma o acompanhamento. O app só gira o mapa com a orientação do aparelho se a bússola estiver confiável; caso contrário, mantém o norte fixo. O padrão mobile é 2D por legibilidade, desempenho e equivalência entre Android e iOS. O 3D da web fica disponível como vista opcional, especialmente para entender a troca de piso.

Estados visíveis: **localizando**, **posição confiável**, **posição aproximada**, **posição incerta**, **sem permissão**, **sem sinal** e **fora do mapa**. Em baixa confiança, o app reduz a certeza visual, mantém a última rota útil e oferece confirmação por loja próxima, escolha no mapa ou QR. Ele nunca afirma que o usuário chegou ou mudou de piso apenas por um sinal isolado.

## 3. Requisitos verificáveis

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF01 | Início como navegação principal | Buscar destino, iniciar rota e ler o próximo passo sem sair da tela do mapa em larguras de 320–430 px. |
| RF02 | Posição estimada contínua | Durante a navegação em primeiro plano, o marcador recebe atualizações com origem, horário, piso, raio de incerteza e confiança; estado antigo é identificado. |
| RF03 | Início sem QR obrigatório | Com cobertura aprovada de localização, o visitante inicia sem escanear. QR e origem manual continuam como recuperação. |
| RF04 | Acompanhamento de câmera | Mapa acompanha a posição enquanto o modo seguir está ativo; gesto manual o pausa; **Minha posição** o reativa. |
| RF05 | Rota a partir da posição atual | Destino novo parte da posição validada mais recente; chegada à Natura seguida de Anacapri nunca volta à entrada. |
| RF06 | Recálculo automático | Desvio consistente, bloqueio do grafo ou troca de piso confirmada dispara nova rota; ruído isolado não dispara recálculos repetidos. |
| RF07 | Troca de piso segura | Piso muda após evidências coerentes com escada/elevador e grafo; em dúvida, o app pergunta onde a pessoa está. |
| RF08 | Chegada | O app sugere chegada perto da porta cadastrada, mas permite corrigir; confirmação automática só após precisão e permanência suficientes, validadas em campo. |
| RF09 | Preferência sem escadas | O cálculo continua respeitando arestas acessíveis e bloqueios; se elevador estiver indisponível, informa falta de rota. |
| RF10 | Recuperação | Perda de Bluetooth, Wi‑Fi, permissão ou rede não apaga destino, último ponto confiável ou rota já exibida; explicação e alternativa são oferecidas. |
| RF11 | Instruções multimodais | Texto curto e setas; voz e vibração configuráveis, com repetição manual e sem depender apenas de cor/áudio. |
| RF12 | Administração operacional | Gestor vê revisão do mapa, cobertura dos pontos de referência, estado de beacons/APs e bloqueios, sem rastrear visitantes individualmente. |
| RNF01 | Acessibilidade | Testes com TalkBack, VoiceOver, fonte ampliada, contraste, toque com uma mão e movimento reduzido em aparelhos reais. |
| RNF02 | Privacidade | Processar a posição no aparelho sempre que viável; transmitir à API só o nó/trecho necessário à rota; não persistir trajetos identificáveis por padrão. |
| RNF03 | Desempenho | Alvo de piloto: interação fluida e atualização perceptível durante a caminhada; medir latência, bateria e aquecimento em aparelhos de entrada e intermediários. |
| RNF04 | Integridade espacial | Posição, corredor, piso e destino usam o catálogo publicado; nenhuma coordenada física de loja é criada no front-end. |

### Regras de negócio

1. A estimativa tem `shopping`, `piso`, coordenadas em metros, `accuracyM`, `confidence`, `source`, `observedAt` e `catalogRevision`. Posição desatualizada perde confiança.
2. O posicionador projeta estimativas plausíveis sobre trechos transitáveis do grafo, sem atravessar paredes. A distância do ponto bruto ao corredor também reduz confiança.
3. A seleção de destino não substitui a origem; iniciar outra rota usa a última posição confiável. Uma origem manual ou QR tem prioridade imediata sobre estimativa conflitante até que novos sinais coerentes a confirmem.
4. A rota e sua revisão vêm da API. O cliente pode acompanhar o progresso localmente, mas pede à API novo percurso quando muda de trecho, piso, destino, preferência ou revisão do grafo.
5. Para evitar oscilação, um desvio exige sucessivas observações válidas e tempo mínimo entre recálculos. Os limiares serão calibrados com trajetos medidos; não serão números arbitrários fixados antes do piloto.
6. O estado de chegada não depende de um único pacote BLE ou Wi‑Fi. Em dúvida, pede confirmação simples.
7. A preferência **sem escadas** permanece ativa em toda nova rota e não é desligada automaticamente.
8. Ao negar permissões, o app funciona com mapa, busca, origem manual e QR. A tela informa que a localização automática está indisponível.

## 4. Priorização MoSCoW

| Prioridade | Entrega | Razão e condição |
| --- | --- | --- |
| **Must** | Protótipo de Início com mapa vivo, busca e guia inferior | Corrige a principal dificuldade de uso sem esperar hardware. |
| **Must** | Modelo único de posição, confiança, tempo, piso e origem | Impede que uma estimativa fraca pareça posição exata. |
| **Must** | Simulador de caminhada e testes de rota/recálculo | Permite desenvolver e demonstrar o fluxo antes da instalação física. |
| **Must** | Integração de posicionamento BLE + sensores em app nativo, condicionada ao piloto | Caminho principal para Android e iOS sem QR repetido; requer beacons e calibração. |
| **Must** | Recuperação manual/QR, permissões claras, acessibilidade e rota sem escadas | Mantém o app utilizável quando o posicionamento falha. |
| **Must** | Validação presencial e critérios de aceite por piso/aparelho | Sem isso não se declara navegação autônoma funcional. |
| **Should** | Instruções por voz/vibração, visão do próximo acesso e ajuste de orientação | Melhora uso caminhando e com necessidades diferentes. |
| **Should** | Console de cobertura/calibração e diagnóstico de beacons | Facilita manter o sistema após mudanças no shopping. |
| **Should** | Persistência local da rota ativa durante perda breve de rede | Evita interromper a caminhada, sem substituir a API como fonte do grafo. |
| **Could** | Wi‑Fi RTT em Android compatível | Pode melhorar precisão se houver pontos de acesso FTM/802.11az; é opcional por capacidade do hardware. |
| **Could** | Fingerprinting Wi‑Fi em Android | Ajuda a identificar zonas; tem limite de frequência de varredura e precisa de levantamento contínuo. |
| **Could** | UWB em áreas críticas, 3D de navegação e AR | Dependem de investimento, aparelhos compatíveis e ganho demonstrado. |
| **Won't (nesta etapa)** | Exigir QR a cada trecho, rastreamento de visitantes em segundo plano, depender de varredura Wi‑Fi comum no iPhone | Contrariam autonomia, privacidade ou capacidade das plataformas. |

**Decisão técnica:** não planejar Wi‑Fi fingerprinting como núcleo único multiplataforma. O iOS não oferece API geral para varrer redes próximas; no Android a varredura exige permissões e sofre limitação de frequência. Wi‑Fi RTT é apenas uma melhoria possível em Android e pontos de acesso compatíveis. BLE e sensores são a primeira hipótese de cobertura comum, a confirmar no local.

## 5. Arquitetura e dados

```text
Sinais do aparelho (BLE, passos, movimento; Wi‑Fi RTT opcional no Android)
  → provedores nativos de observação
  → fusão + piso + confiança + projeção no grafo, no aparelho
  → PositionState
  → sessão de navegação no visitante
  → API FastAPI calcula/recalcula rota a partir do nó/trecho validado
  → mapa 2D, cartão de instrução, voz/vibração, feedback de precisão

Blender → catálogo/versionamento espacial → API/validação → visitante
Admin → bloqueios, publicação e diagnóstico de infraestrutura
```

**Contrato proposto:** `PositionObservation` é a medição bruta de cada provedor; `PositionEstimate` é a estimativa fundida; `NavigationSession` guarda destino, rota, revisão, progresso, modo seguir e última posição confiável. IDs estáveis e coordenadas seguem o catálogo. O contrato novo deve ser versionado e validado com a cena e a API; não editar GLB ou builds estáticos manualmente.

**Algoritmo inicial:** BLE estima zona e piso; pedômetro e orientação estimam deslocamento entre âncoras; o grafo limita posições a passagens válidas. Um filtro simples com pesos por precisão/idade do sinal pode iniciar o piloto. Só avançar para filtro de partículas/Kalman se a medição real mostrar benefício. Recalcular na API quando a posição validada muda o trecho provável ou um bloqueio altera a rota. O app usa histerese para evitar saltos entre corredores e pisos.

**Dependência física:** inventariar pontos de acesso e beacons, marcar sua posição no mesmo referencial do catálogo, medir cobertura em horários com e sem movimento, identificar áreas de sombra e trocar baterias/manter equipamentos. Um shopping real pode exigir ajustar o grafo e publicar nova versão da cena.

## 6. Tecnologias

| Camada | Manter | Adicionar apenas quando necessário |
| --- | --- | --- |
| App | Expo 52, React Native, Expo Router, TypeScript, SVG; Three.js/R3F somente na web | `expo-sensors` na versão compatível; módulo nativo BLE para Android/iOS em development build; módulo Kotlin de Wi‑Fi RTT opcional; APIs nativas de voz/vibração conforme prova de conceito. |
| API | FastAPI, SQLAlchemy, MySQL em produção, SQLite de demonstração, Pydantic, Dijkstra | Contratos de posição/telemetria agregada, endpoints de recálculo por nó/trecho e cadastro da infraestrutura se o piloto exigir. |
| Mapa | Blender 4.5.14 LTS, GLB, catálogo, `scene-contract` | Âncoras BLE/APs e versões de cobertura associadas ao catálogo; validação de referencial e piso. |
| Admin | React, Vite, TypeScript | Painel de cobertura, estado de infraestrutura e versão do levantamento. |
| Testes | Pytest, Playwright, validação Blender, typecheck e builds | Simulador determinístico de caminhada, trilhas de referência coletadas com consentimento e testes em Android/iPhone físicos. |

Módulos nativos BLE/Wi‑Fi exigirão **development builds**, pois o Expo Go não inclui código nativo adicionado ao projeto. Não escolher fornecedor de beacon nem biblioteca antes de medir compatibilidade, manutenção e custo.

## 7. Estrutura de pastas proposta

```text
apps/visitor/
  app/(tabs)/index.tsx                # Início: mapa e navegação principal
  app/(tabs)/map.tsx                  # consulta livre
  components/navigation/             # busca, status, próximo passo, chegada
  components/map/                    # marcador, incerteza, câmera e piso
  context/NavigationContext.tsx      # adaptação gradual ao novo estado
  positioning/
    types.ts                         # observações e estimativas
    PositionEngine.ts                # fusão, confiança e regras de piso
    MapMatcher.ts                    # projeção no grafo
    providers/                       # BLE, sensores, manual, QR, RTT opcional
    simulator/                       # percursos repetíveis sem hardware
  modules/indoor-positioning/        # código nativo, se o piloto aprovar
services/api/app/
  schemas/positioning.py             # contrato compartilhado com o cliente
  services/navigation.py             # fonte da rota e recálculo
  models/                             # cadastro de infraestrutura, se necessário
apps/admin/src/pages/                # cobertura e diagnósticos
packages/scene-contract/             # validação de âncoras/versionamento
packages/shopping-3d/                # geração/publicação do catálogo
docs/positioning/                    # levantamento, calibração, privacidade, testes
```

Os nomes são pontos de organização previstos; a implementação deve aproveitar componentes e contratos existentes, evitando duplicações.

## 8. Fases e portões de decisão

| Fase | Esforço preliminar* | Entrega | Saída para a próxima fase |
| --- | --- | --- | --- |
| 0. Levantamento | 1–2 semanas | Escolher local piloto, planta validada, corredores e acessos, modelos de celular, inventário Wi‑Fi e autorização de instalação/teste | Escopo físico e aparelhos representativos definidos. |
| 1. UX mobile | 1–2 semanas | Protótipo funcional do Início com mapa, busca, cartão de passo, modo seguir, precisão e recuperação | Teste com diferentes idades e fonte ampliada; tarefas sem orientação externa. |
| 2. Motor simulado | 1–2 semanas | `PositionState`, simulador, progresso e recálculo com dados reproduzíveis | Entrada → Natura → Anacapri, desvio e troca de piso passam em testes. |
| 3. Prova de localização | 2–4 semanas | Development build, BLE + sensores, comparação Android/iPhone e levantamento de sinal | Cobertura e erro medidos por corredor/piso; decisão de continuar, reposicionar beacons ou mudar tecnologia. |
| 4. Integração real | 2–4 semanas | Fusão com grafo, confiança, recálculo, fallback, voz opcional e revisão da API | Percursos completos com diferentes pessoas e condições. |
| 5. Operação e lançamento piloto | 1–2 semanas | Admin de infraestrutura, documentação, monitoramento agregado, testes de acessibilidade e bateria | Critérios de campo aprovados; limitações publicadas. |

\* Faixas de planejamento, não prazo fechado. Dependem de acesso ao local, compra/instalação de equipamentos, quantidade de aparelhos e pessoas para ensaio. As fases 0 e 1 podem ocorrer em paralelo; o restante requer os resultados anteriores. O custo deve separar: beacons e reposição de bateria, eventual atualização de APs, horas de levantamento/calibração, aparelhos de teste, instalação e manutenção.

**Ordem de execução por mim:** fases 1 e 2 podem começar no repositório atual. A fase 0 precisa de dados do espaço real e pode correr em paralelo. A fase 3 depende de aparelhos e infraestrutura física; a fase 4 usa seus resultados medidos. Não se deve declarar a fase 5 concluída apenas por testes automatizados.

### Métricas de aceite propostas para o piloto

- Pelo menos 90% dos percursos de teste terminam no destino correto, medidos separadamente por piso e aparelho; nenhum trajeto sem escadas pode sugerir uma escada.
- Medir erro mediano e percentil 90 entre posição mostrada e pontos físicos marcados; meta inicial a validar: mediana até 5 m no corredor e identificação correta do piso em 95% das observações. Portas de lojas podem exigir meta mais estrita depois do levantamento.
- Medir tempo entre desvio real e rota corrigida; alvo inicial: até 10 s em trechos com cobertura aprovada. Recálculos falsos devem ser registrados e reduzidos antes da liberação.
- Em cada dispositivo, medir consumo de bateria por 30 min de navegação e aquecimento; estabelecer limite após linha de base, sem prometer autonomia sem ensaio.
- Em teste de uso, registrar conclusão sem ajuda, tempo, hesitações, toques errados e entendimento de “posição aproximada” com pessoas de idades e habilidades diferentes.

## 9. Riscos e respostas

| Risco | Probabilidade / impacto | Sinal de alerta | Resposta |
| --- | --- | --- | --- |
| Não há acesso ao shopping/APs ou permissão para beacons | Alta / alta | Levantamento não autorizado | Limitar TCC a simulação reproduzível; demonstrar autonomia como protótipo, sem alegar validação física. |
| iPhone não fornece varredura Wi‑Fi geral | Certa / alta para plano Wi‑Fi puro | Abordagem depende de fingerprints no iOS | Usar BLE + sensores como base comum; Wi‑Fi só como melhoria compatível. |
| Reflexões e pessoas distorcem RSSI BLE | Alta / alta | Posição salta entre corredores | Calibração por zona, suavização, confiança, comparação por horário e fallback explícito. |
| Piso errado perto de escada/elevador | Média / alta | Alternância repetida de piso | Combinar grafo, tempo de deslocamento e sinais do novo piso; pedir confirmação quando ambíguo. |
| Mapa físico diverge do catálogo | Média / alta | Rota atravessa barreira ou loja | Revisar levantamento, validar geometria e publicar release espacial antes de uso. |
| Permissões negadas ou Bluetooth desligado | Alta / média | Sem observações recentes | Busca/mapa continuam; oferecer origem manual/QR e explicação curta. |
| Bateria ou desempenho ruim | Média / média | Aquecimento, queda de quadros | Ajustar frequência de leitura, pausar fora da navegação e priorizar 2D. |
| Internet indisponível | Média / média | Recalcular falha | Manter rota/revisão anterior visível, sinalizar que pode estar desatualizada e recuperar ao reconectar. |
| Dados de localização sensíveis | Média / alta | Logs ou histórico guardam trajetos | Minimização, processamento local, métricas agregadas, revisão de retenção e consentimento antes do piloto. |
| Confusão visual ao caminhar | Média / alta | Usuários param ou seguem direção errada | Uma instrução principal, referências reais, voz opcional, teste com público diverso e correção iterativa. |

## 10. Produtos de referência

- **Waze:** referência de comportamento de navegação: destino, orientação atual e recálculo quando a rota muda. Não copiar marca, telas ou linguagem visual.
- **Google Maps Indoor:** referência de mapa de shopping, seletor de piso, pontos de interesse e marcador de posição.
- **Apple Maps Indoor:** referência de exploração de shopping, categorias e troca de piso no iPhone.
- **MazeMap:** referência de marcador que acompanha o visitante e arquitetura que aceita diferentes provedores de posição.
- **Pointr:** referência de navegação em shopping com mapa interativo, múltiplos pisos e orientação até lojas.

Fontes oficiais consultadas para esta proposta:

- [Android Wi‑Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt) e [limites de varredura Wi‑Fi](https://developer.android.com/develop/connectivity/wifi/wifi-scan).
- [Apple: APIs Wi‑Fi disponíveis no iOS](https://developer.apple.com/documentation/technotes/tn3111-ios-wifi-api-overview) e [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth/).
- [Expo: development builds](https://docs.expo.dev/develop/development-builds/introduction/) e [sensores](https://docs.expo.dev/versions/latest/sdk/sensors/). Conferir a versão compatível com o Expo instalado antes de adicionar pacotes.
- [Waze](https://www.waze.com/waze), [Google Maps Indoor](https://maps.google.com/help/maps/indoormaps/faqs.html), [Apple Maps Indoor](https://support.apple.com/guide/iphone/explore-airports-or-malls-iphd3705ff4e/ios), [MazeMap](https://www.mazemap.com/solutions/indoor-positioning) e [Pointr](https://www.pointr.tech/sectors/retail).

## 11. Decisões que precisam de dados reais

Para sair da simulação e entregar autonomia no shopping, registrar: planta e dimensões reais, quantidade/pisos/áreas de cobertura, localização e capacidades dos APs, possibilidade de instalar beacons, modelos de Android/iPhone disponíveis, quantidade de usuários esperada, acesso à internet no local e orçamento/manutenção da infraestrutura. A equipe pode avançar no layout e no motor simulado enquanto esses dados são levantados.
