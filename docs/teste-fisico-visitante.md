# Roteiro de teste do visitante em aparelhos

Status: **pendente de execução presencial**. Testes automatizados e exportações
não comprovam leitura óptica, acessibilidade com leitor de tela ou usabilidade
caminhando. O Mini Shopping é um modelo: confirme a correspondência entre seus
pontos e o local de ensaio antes de usar as instruções como orientação física.

## Preparação

- Usar Android e iPhone; registrar modelo, sistema, navegador/app e data.
- Instalar o app Expo compatível ou servir o web por HTTPS. A câmera web exige
  contexto seguro: um endereço HTTP da rede local não equivale a localhost no celular.
- Configurar a API acessível ao aparelho conforme o README. `mini_server.py`
  escuta apenas localhost e usa banco temporário; não abrir a chave administrativa
  da demonstração em uma rede pública.
- Imprimir os QR de `assets/qr`, verificar o token de cada ponto e anotar iluminação,
  distância de leitura e rede utilizada. Não mover um QR sem atualizar seu vínculo.
- Fazer o percurso com um observador. Registrar erros e hesitações sem orientar
  a pessoa durante a primeira tentativa. Usar dados e destinos de teste.

## Tarefas e critérios

| Tarefa | Resultado esperado | Evidência a registrar |
| --- | --- | --- |
| Primeiro acesso e ajuda | Entender como definir origem; Entendi permanece após reabrir; Ajuda reabre | Tempo, dúvida e quantidade de toques |
| QR da entrada, válido, inválido e sem permissão | Origem/piso corretos; mensagem acionável; entrada manual disponível | Token, tempo, permissão, resultado |
| Entrada → Natura → confirmar → Anacapri | A segunda rota começa na Natura e o marcador acompanha a confirmação | Origem mostrada antes/depois |
| Troca para mezanino | Instrução indica escada/elevador e piso; visualizar outro piso não muda a posição | Correspondência com cada bifurcação |
| Rota sem escadas | Passa pelo elevador; bloquear o acesso informa falta de rota | Trecho escolhido e aviso |
| Arrastar/zoom 2D e 3D web | Pinça e arraste não recentralizam ao soltar; Minha posição recupera o ponto | Acionamentos involuntários, fluidez |
| Uso com uma mão | Busca, próximo passo, chegada e abas alcançáveis; não acionar botões vizinhos | Mão usada, toques errados, desconforto |
| Explorar e favoritos | Encontrar por nome/categoria, piso e proximidade; favoritos/recentes persistem | Tempo, ordenação e compreensão de distância |
| Retornar à entrada | Rota parte da última posição confirmada e vai à entrada da sessão | Pontos e piso mostrados |
| Perda de rede no recálculo | Trajeto anterior continua visível com aviso; repetir recupera; origem preservada | Mensagens e recuperação |
| Texto grande / orientação do aparelho | Textos e botões legíveis, sem cortar ações; modais podem rolar | Capturas com escala normal e máxima |
| TalkBack / VoiceOver / teclado web | Nomes, estado dos filtros e sequência de foco compreensíveis; modal pode fechar | Ordem de leitura, foco ao fechar, ações inacessíveis |

Nos testes caminhando, conferir cada instrução no ponto em que a decisão deve
ser tomada. Anotar quando a pessoa para, volta, interpreta um acesso errado ou
precisa procurar uma referência. Avançar uma instrução não confirma deslocamento:
a posição só muda por QR, seleção manual ou chegada informada.

## Registro por tentativa

| Campo | Preenchimento |
| --- | --- |
| Aparelho / sistema / navegador ou app | |
| Versão testada / data / responsável | |
| Tarefa / origem / destino / modo sem escadas | |
| QR / iluminação / distância / rede | |
| Tempo / toques / hesitações / erros | |
| Resultado esperado / observado | |
| Captura ou vídeo autorizado | |
| Correção necessária / prioridade / repetição | |

Só marcar um cenário como aprovado após executá-lo. Repetir no segundo aparelho
e após corrigir qualquer falha que impeça concluir a tarefa.
