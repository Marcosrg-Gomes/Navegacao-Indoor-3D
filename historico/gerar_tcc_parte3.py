# -*- coding: utf-8 -*-
"""Parte 3: Capítulos 3 e 4 - Desenvolvimento e Testes."""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn

FONTE = "Arial"
FONTE_TAMANHO = 12
COR_TEXTO = RGBColor(0, 0, 0)

doc = Document("TCC_Navegacao_Indoor_3D_Parte2.docx")


def paragrafo(texto="", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY,
              tamanho=FONTE_TAMANHO, negrito=False, italico=False,
              espaco_antes=0, espaco_depois=0, espacamento=1.5,
              recuo_primeira_linha=None, cor=None):
    p = doc.add_paragraph()
    p.alignment = alinhamento
    p.paragraph_format.space_after = Pt(espaco_depois)
    p.paragraph_format.space_before = Pt(espaco_antes)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = espacamento
    if recuo_primeira_linha is not None:
        p.paragraph_format.first_line_indent = Cm(recuo_primeira_linha)
    if texto:
        run = p.add_run(texto)
        run.font.name = FONTE
        run.font.size = Pt(tamanho)
        run.bold = negrito
        run.italic = italico
        run.font.color.rgb = cor if cor else COR_TEXTO
        rPr = run._element.get_or_add_rPr()
        rFonts = rPr.get_or_add_rFonts()
        rFonts.set(qn("w:ascii"), FONTE)
        rFonts.set(qn("w:hAnsi"), FONTE)
        rFonts.set(qn("w:cs"), FONTE)
    return p


def titulo_nivel1(texto, numero=None):
    texto_completo = f"{numero}. {texto}" if numero else texto
    return paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
                     tamanho=FONTE_TAMANHO, negrito=True,
                     espacamento=1.5, espaco_depois=12)


def titulo_nivel2(texto, numero=None):
    texto_completo = f"{numero}. {texto}" if numero else texto
    return paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                     tamanho=FONTE_TAMANHO, negrito=True,
                     espaco_depois=6, espaco_antes=12, recuo_primeira_linha=0)


def titulo_nivel3(texto, numero=None):
    texto_completo = f"{numero}. {texto}" if numero else texto
    return paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                     tamanho=FONTE_TAMANHO, negrito=True,
                     espaco_depois=6, espaco_antes=6, recuo_primeira_linha=0)


def pagina_quebra():
    from docx.enum.text import WD_BREAK
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    p.paragraph_format.space_after = Pt(0)
    return p


# ===========================================================================
# CAPÍTULO 3 - DESENVOLVIMENTO DO SISTEMA
# ===========================================================================
pagina_quebra()
titulo_nivel1("Desenvolvimento do Sistema", numero="3")

paragrafo(
    "Este capítulo apresenta a implementação do sistema Navegação Indoor 3D, "
    "descrevendo a arquitetura, o backend, o banco de dados, o aplicativo do "
    "visitante, o painel administrativo, a modelagem 3D e os mapas 2D/3D, com base "
    "no estado real do repositório. Nenhuma funcionalidade é afirmada como concluída "
    "sem evidência correspondente no código ou nos testes.",
    recuo_primeira_linha=1.25)

# --- 3.1 Arquitetura e Monorepo ---
titulo_nivel2("Arquitetura e Monorepo", numero="3.1")
paragrafo(
    "O projeto é organizado como um monorepo com as seguintes pastas principais:",
    recuo_primeira_linha=1.25)
estrutura = [
    ("apps/visitor", "Aplicativo do visitante (Expo / React Native / Expo Web)."),
    ("apps/admin", "Painel administrativo (React / Vite)."),
    ("services/api", "Backend FastAPI, SQLAlchemy, seed e testes."),
    ("packages/shopping-3d", "Gerador procedural Blender, histórico preservado."),
    ("packages/scene-contract", "Validador compartilhado sem dependências e JSON Schema."),
    ("assets/models/mini-shopping", "GLB, catálogo e plantas produzidos pelo gerador."),
    ("assets/qr", "Sete QR Codes portáteis (tokens) e folha para impressão."),
    ("docs", "Arquitetura, coordenadas, publicação, proveniência e validação."),
    ("evidence", "Evidências de testes e capturas."),
]
for pasta, desc in estrutura:
    paragrafo(f"• {pasta}: {desc}", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY,
              tamanho=FONTE_TAMANHO, espaco_depois=2, recuo_primeira_linha=0)

paragrafo(
    "A separação de responsabilidades segue o princípio de que a API é a fonte da "
    "navegação (identidades, disponibilidade, QR Codes, grafos, distâncias, "
    "bloqueios e rotas) e o Blender é a fonte da geometria publicada. O catálogo de "
    "cena é o único elo permitido entre API e modelo 3D; o aplicativo nunca possui "
    "coordenadas ou IDs físicos duplicados manualmente em componentes React.",
    recuo_primeira_linha=1.25)

# --- 3.2 Backend e APIs ---
titulo_nivel2("Backend e APIs (FastAPI)", numero="3.2")
paragrafo(
    "O backend é implementado em FastAPI com SQLAlchemy, servindo como fonte de "
    "verdade para a navegação. Os principais endpoints incluem:",
    recuo_primeira_linha=1.25)
endpoints = [
    ("GET /api/shoppings", "Lista os shoppings cadastrados."),
    ("GET /api/floors", "Lista os pisos de um shopping."),
    ("GET /api/nodes", "Lista os nós (pontos navegáveis) de um piso."),
    ("GET /api/edges", "Lista as arestas (conexões entre nós)."),
    ("POST /api/routes", "Calcula uma rota entre origem e destino usando Dijkstra, respeitando bloqueios e acessibilidade."),
    ("GET /api/routes/distances", "Retorna distâncias em metros a partir de uma origem."),
    ("GET /api/shoppings/{id}/scene", "Retorna o contrato de cena (modelo GLB, pisos, POIs, âncoras)."),
    ("GET /api/shoppings/{id}/scene/validation", "Valida a consistência entre banco, catálogo e modelo 3D."),
    ("GET /api/qr-codes/{token}", "Identifica o nó associado a um token de QR Code."),
    ("POST /api/diagnostics/events", "Registra eventos de diagnóstico anônimos."),
    ("GET /api/admin/audit", "Consulta o histórico de alterações administrativas."),
]
for endpoint, desc in endpoints:
    paragrafo(f"• {endpoint} — {desc}", tamanho=FONTE_TAMANHO,
              espaco_depois=2, recuo_primeira_linha=0)

paragrafo(
    "O cálculo de rotas utiliza o algoritmo de Dijkstra executado no servidor, "
    "percorrendo o grafo de nós ativos, respeitando o sentido das arestas, bloqueios "
    "temporários e preferência de acessibilidade (rotas sem escadas excluem escadas e "
    "escadas rolantes). A revisão do estado do shopping é consultada periodicamente pelo "
    "aplicativo ativo (a cada dois segundos, mais latência de rede) para detectar "
    "bloqueios, reaberturas e mudanças de cadastro, provocando recálculo automático da "
    "rota quando necessário.",
    recuo_primeira_linha=1.25)

# --- 3.3 Banco de Dados ---
titulo_nivel2("Banco de Dados e Modelo de Dados", numero="3.3")
paragrafo(
    "O banco de dados utiliza SQLAlchemy como ORM, com suporte a SQLite para "
    "demonstração isolada e MySQL para produção. As principais entidades são:",
    recuo_primeira_linha=1.25)
entidades = [
    ("Shopping", "Identificação e código estável do shopping (ex.: MINI_SHOPPING)."),
    ("Piso", "Andar do shopping (térreo, mezanino), com nível, dimensões e planta."),
    ("No", "Ponto navegável com coordenadas normalizadas (0 a 1), tipo e status ativo."),
    ("Aresta", "Conexão entre dois nós, com distância, sentido, acessibilidade e status."),
    ("Loja", "Estabelecimento vinculado a um nó, com categoria, horário e status operacional."),
    ("Categoria", "Agrupamento de lojas (alimentação, moda, serviços, etc.)."),
    ("QRCode", "Token vinculado a um nó, para identificação de origem."),
    ("Auditoria", "Registro atômico de alterações administrativas (autor, UTC, motivo, antes/depois)."),
]
for ent, desc in entidades:
    paragrafo(f"• {ent}: {desc}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

paragrafo(
    "Todas as escritas administrativas exigem o cabeçalho X-Audit-Reason (3 a 240 "
    "caracteres, codificado em URL), registrando identificação autenticada, data/hora "
    "UTC, motivo e estado antes/depois de forma atômica. As tabelas aditivas auditoria "
    "e diagnósticos são criadas na inicialização da API.",
    recuo_primeira_linha=1.25)

# --- 3.4 Aplicativo do Visitante ---
titulo_nivel2("Aplicativo do Visitante (Expo)", numero="3.4")
paragrafo(
    "O aplicativo do visitante é desenvolvido em Expo (React Native) com suporte a Web, "
    "Android e iOS. As principais telas e funcionalidades são:",
    recuo_primeira_linha=1.25)
funcionalidades_visitor = [
    ("Tela inicial", "Busca de destino, informação de posição (piso, origem da confirmação e horário) e ação principal de navegação."),
    ("Explorar", "Busca por nome, categoria e tipo; filtros por piso, categoria, funcionamento e percurso sem escadas; ordenação por nome, categoria, piso atual ou distância do grafo."),
    ("Leitura de QR Code", "Identificação da origem por token de QR Code, com opção de código manual e seleção manual da origem."),
    ("Mapa 2D", "Planta do piso com nós, rota, marcador de posição, zoom, pan e escala em metros."),
    ("Mapa 3D", "Visualização aérea guiada do modelo GLB (web apenas), com origem, destino e rota destacados."),
    ("Navegação", "Painel de instruções (próximo passo, distância restante, piso), simulação de caminhada, pausa, continuação e encerramento."),
    ("Simulação", "Marcador percorre o trajeto da API; modo demonstração explicitamente identificado; não equivale a geolocalização real."),
    ("Favoritos e recentes", "Até 100 favoritos e 8 destinos recentes por shopping, persistidos localmente via AsyncStorage."),
    ("Acessibilidade", "Rota sem escadas usa elevador; alvos de toque com pelo menos 44 px; suporte a teclado e leitores de tela (validação física pendente)."),
]
for func, desc in funcionalidades_visitor:
    paragrafo(f"• {func}: {desc}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

paragrafo(
    "O aplicativo resolve SceneMap.web.tsx no navegador e SceneMap.native.tsx em "
    "Android/iOS. O módulo Three.js é carregado sob demanda por importação dinâmica "
    "somente no web. O render usa câmera ortográfica inclinada, com ocultação de "
    "coberturas e isolamento de materiais de objetos para que o destaque de uma loja "
    "não afete outras.",
    recuo_primeira_linha=1.25)

# --- 3.5 Painel Administrativo ---
titulo_nivel2("Painel Administrativo (React/Vite)", numero="3.5")
paragrafo(
    "O painel administrativo permite ao operador gerenciar os dados de navegação e "
    "validar a consistência do sistema. As telas implementadas são:",
    recuo_primeira_linha=1.25)
telas_admin = [
    ("Login", "Autenticação com chave de API administrativa."),
    ("Dashboard", "Visão geral de estatísticas (shoppings, pisos, nós, arestas, lojas, categorias, QR Codes) e integridade do grafo."),
    ("Shoppings", "Cadastro, edição e exclusão de shoppings."),
    ("Pisos", "Gerenciamento de andares, dimensões métricas e plantas baixas."),
    ("Editor de Nós", "Criação, edição, exclusão e repositionamento de nós sobre a planta."),
    ("Arestas", "Cadastro de conexões entre nós, com distância, sentido e acessibilidade."),
    ("Lojas", "Cadastro de estabelecimentos vinculados a nós e categorias."),
    ("Categorias", "Gerenciamento de categorias de lojas."),
    ("QR Codes", "Geração e gestão de tokens vinculados a nós."),
    ("Validação", "Análise de integridade do grafo (nós isolados, arestas inválidas, referências órfãs)."),
    ("Cena 3D", "Validação da correspondência entre catálogo, banco e rotas (sem edição geométrica)."),
    ("Auditoria", "Histórico de alterações administrativas e falhas de navegação."),
]
for tela, desc in telas_admin:
    paragrafo(f"• {tela}: {desc}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

# --- 3.6 Modelagem 3D e Contrato de Cena ---
titulo_nivel2("Modelagem 3D e Contrato de Cena (Blender)", numero="3.6")
paragrafo(
    "O ambiente 3D é modelado no Blender 4.5.14 LTS. O Mini Shopping possui dois pisos "
    "(térreo e mezanino) de 30 × 60 m, com elevação de 4,7 m para o mezanino. O térreo "
    "está em z = 0 e o mezanino em z = 4,7. O modelo inclui 22 lojas, quatro banheiros, "
    "entrada principal, escadas rolantes e elevador panorâmico.",
    recuo_primeira_linha=1.25)
paragrafo(
    "O exportador Blender gera o GLB (com compressão Draco, orçamento de até 25 MiB) e "
    "o catálogo de cena (scene-catalog-v1.json), que contém transforms por piso, POIs, "
    "âncoras, arestas físicas e tokens QR. O publicador valida o catálogo contra a API, "
    "verificando hash, tamanho, cabeçalho e nomes dentro do GLB, e publica os ativos "
    "estáticos para consumo do frontend. Nenhum GLB é substituído silenciosamente; cada "
    "publicação recebe versão explícita.",
    recuo_primeira_linha=1.25)

# --- 3.7 Mapas 2D, 3D, Rota e Simulação ---
titulo_nivel2("Mapas 2D, 3D, Rota e Simulação", numero="3.7")
paragrafo(
    "O mapa 2D (SVG) é renderizado sobre a planta do piso, com nós, arestas, rota, "
    "marcador de origem (verde), destino (vermelho) e posição do visitante (azul). Os "
    "rótulos de lojas são posicionados para evitar colisões, priorizando origem, destino "
    "e acessos entre pisos. O mapa inclui escala em metros e indicação de norte.",
    recuo_primeira_linha=1.25)
paragrafo(
    "O mapa 3D utiliza o modelo GLB publicado, com câmera ortográfica inclinada. A rota "
    "é desenhada elevada 8 cm acima do solo, com segmentos separados por piso. O "
    "marcador de posição sempre aponta para a parte superior da tela (0° ou 180°), sem "
    "rotação lateral durante curvas. O mapa inverte 180° apenas quando o próximo trecho "
    "da rota está atrás do usuário, garantindo que o trajeto fique sempre à frente da "
    "seta. A câmera 3D fica atrás do usuário normalmente, ou na frente quando o mapa "
    "está invertido, preservando inclinação, perspectiva, zoom e troca de andares.",
    recuo_primeira_linha=1.25)
paragrafo(
    "A simulação de navegação percorre as arestas do grafo, não uma linha livre sobre a "
    "planta. Cada quadro interpola entre dois nós consecutivos do mesmo piso; a mudança "
    "de piso ocorre somente em uma ligação vertical válida (escada, escada rolante ou "
    "elevador). O simulador é explicitamente identificado como 'modo demonstração — "
    "posição simulada' e não solicita Bluetooth, localização do aparelho ou novas "
    "permissões.",
    recuo_primeira_linha=1.25)

# ===========================================================================
# CAPÍTULO 4 - TESTES E VALIDAÇÃO
# ===========================================================================
pagina_quebra()
titulo_nivel1("Testes e Validação", numero="4")

paragrafo(
    "Este capítulo apresenta os resultados dos testes realizados, com base nas "
    "evidências existentes no repositório. Nenhum resultado é afirmado sem evidência "
    "correspondente.",
    recuo_primeira_linha=1.25)

# --- 4.1 Testes Automatizados ---
titulo_nivel2("Testes Automatizados", numero="4.1")
paragrafo(
    "Os testes automatizados abrangem o backend, o frontend e a integração entre ambos. "
    "Os resultados observados são resumidos na Tabela 2.",
    recuo_primeira_linha=1.25)

from docx.shared import Inches
tabela2 = doc.add_table(rows=1, cols=3)
tabela2.style = "Table Grid"
tabela2.alignment = WD_ALIGN_PARAGRAPH.CENTER
cab = tabela2.rows[0].cells
for i, texto in enumerate(["Camada", "Resultado observado", "Observações"]):
    cab[i].text = texto
    for run in cab[i].paragraphs[0].runs:
        run.font.name = FONTE
        run.font.size = Pt(10)
        run.bold = True

resultados = [
    ("API (backend)", "129 aprovados, 1 ignorado (MySQL sem configuração)", "Inclui distâncias contra rotas com bloqueios e etapas entre pisos."),
    ("Blender/Python", "9 testes aprovados; lint, formatação e compilação aprovados", "Geometria e catálogo não alterados."),
    ("Geometria real", "1.149 amostras, sem obstáculos nem falta de piso no grafo horizontal", "Verifica linha central do trajeto."),
    ("Exportação headless", "1.909 objetos, GLB de 3.488.904 bytes", "Orçamento de 25 MiB respeitado."),
    ("Visitante web", "TypeScript e exportação Expo aprovados; Draco servido localmente", "Sem Three.js/Fiber nos bundles nativos."),
    ("Android/iOS", "Exportações Hermes aprovadas", "Isolamento de componentes web verificado."),
    ("Painel", "TypeScript e build Vite aprovados", ""),
    ("E2E integrados", "7 testes Chromium passaram", "Fluxos de QR, rota, chegada e mapa."),
    ("Regressão existente", "8 testes Chromium passaram", "Cenários de navegação e interação."),
    ("Visitante (E2E)", "24 testes integrados + 8 de regressão passaram", "Suítes visitor-journey e visitor-experience."),
    ("Layout/Acessibilidade", "34 cenários distintos aprovados", "Inclui texto ampliado a 200% e contraste mínimo 4,5:1."),
    ("Regras de negócio", "29 verificações integradas + 8 legadas/de concorrência", "Inclui cenário de divergência espacial."),
]
for camada, resultado, obs in resultados:
    linha = tabela2.add_row().cells
    for i, texto in enumerate([camada, resultado, obs]):
        linha[i].text = texto
        for run in linha[i].paragraphs[0].runs:
            run.font.name = FONTE
            run.font.size = Pt(10)

paragrafo(
    "Tabela 2 - Resultados dos testes automatizados realizados.",
    alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espaco_antes=6, espaco_depois=12)

# --- 4.2 Validação de Integração ---
titulo_nivel2("Validação de Integração", numero="4.2")
paragrafo(
    "A validação de integração verificou fluxos ponta a ponta no navegador, incluindo:",
    recuo_primeira_linha=1.25)
fluxos = [
    "QR da entrada → busca ADIDAS → rota → GLB real retornado pela API → mesmos nós em 3D e na linha SVG → confirmação de chegada.",
    "QR da entrada → BURGER KING → rota acessível pelo elevador → troca para o mezanino → bloqueio → indisponibilidade clara → restauração da aresta.",
    "Falha do GLB → mapa 2D com destino e instruções → nova tentativa 3D bem-sucedida.",
    "WebGL indisponível → preservação da origem por QR e mapa 2D.",
    "GLB sem resposta → limite de 20 segundos → mapa 2D e opção de nova tentativa.",
    "Clique na geometria de ADIDAS → detalhes de ADIDAS, ignorando a loja no piso oculto.",
    "Painel autenticado → inventário e diagnóstico → links dos pisos.",
]
for fluxo in fluxos:
    paragrafo(f"• {fluxo}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

paragrafo(
    "O inventário inclui dois pisos de 30 × 60 m, 22 lojas, quatro banheiros, entrada "
    "principal e sete QR Codes. Os testes calculam rota comum e acessível da entrada a "
    "cada um dos 27 destinos. As rotas acessíveis para o mezanino usam elevador; o "
    "bloqueio desse acesso retorna indisponibilidade. As escadas rolantes mantêm "
    "sentido único e instruções de subida/descida.",
    recuo_primeira_linha=1.25)

# --- 4.3 Limites da Validação ---
titulo_nivel2("Limites da Validação", numero="4.3")
paragrafo(
    "Os seguintes itens não foram validados e permanecem como pendências:",
    recuo_primeira_linha=1.25)
limites = [
    "MySQL não foi executado localmente; a matriz SQLite/MySQL está configurada no CI.",
    "Android/iOS foram exportados, sem instalação em emulador ou aparelho físico.",
    "Leitura óptica de QR Codes, câmera real e teste com visitantes pendentes.",
    "Firefox, WebKit, Chrome instalado e Edge não foram executados nesta integração.",
    "TalkBack/VoiceOver, foco nativo, fonte ampliada no sistema e leitura dos mapas "
    "dentro do shopping dependem do roteiro físico.",
    "O teste de cinco visitantes registrou 1045 ms para uma rota (limite de 1000 ms) "
    "em uma execução com concorrência; repetido sem concorrência, passou integralmente.",
    "Vulnerabilidades nas cadeias de dependências (29 no visitante e 4 no painel) não "
    "foram tratadas com atualização ampla de Expo/Vite neste trabalho.",
    "Hospedagem, domínio e credenciais de produção não foram definidos.",
]
for limite in limites:
    paragrafo(f"• {limite}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

doc.save("TCC_Navegacao_Indoor_3D_Parte3.docx")
print("Parte 3 salva: capítulos 3 e 4")