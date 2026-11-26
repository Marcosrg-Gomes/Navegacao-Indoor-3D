# -*- coding: utf-8 -*-
"""Parte 2: Capítulos 1 e 2 - Introdução e Fundamentação Teórica."""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING

FONTE = "Arial"
FONTE_TAMANHO = 12
COR_TEXTO = RGBColor(0, 0, 0)

doc = Document("TCC_Navegacao_Indoor_3D_Parte1.docx")


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
        rFonts.set(qn if False else "w:ascii", FONTE)
    return p


# precisa importar qn
from docx.oxml.ns import qn

def paragrafo_com_fonte(texto="", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY,
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
    return paragrafo_com_fonte(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
                               tamanho=FONTE_TAMANHO, negrito=True,
                               espacamento=1.5, espaco_depois=12)


def titulo_nivel2(texto, numero=None):
    texto_completo = f"{numero}. {texto}" if numero else texto
    return paragrafo_com_fonte(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                               tamanho=FONTE_TAMANHO, negrito=True,
                               espaco_depois=6, espaco_antes=12, recuo_primeira_linha=0)


def titulo_nivel3(texto, numero=None):
    texto_completo = f"{numero}. {texto}" if numero else texto
    return paragrafo_com_fonte(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                               tamanho=FONTE_TAMANHO, negrito=True,
                               espaco_depois=6, espaco_antes=6, recuo_primeira_linha=0)


def pagina_quebra():
    from docx.enum.text import WD_BREAK
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    p.paragraph_format.space_after = Pt(0)
    return p


# ===========================================================================
# CAPÍTULO 1 - INTRODUÇÃO
# ===========================================================================
pagina_quebra()
titulo_nivel1("Introdução", numero="1")

paragrafo_com_fonte(
    "A navegação em ambientes internos de grandes edifícios, como shopping centers, "
    "hospitais e aeroportos, apresenta desafios distintos da navegação ao ar livre. "
    "O Sistema de Posicionamento Global (GPS) não funciona de forma confiável em "
    "espaços fechados devido à atenuação do sinal por estruturas de concreto, vidro e "
    "metal, além da impossibilidade de recepção de sinais de satélite em áreas "
    "subterrâneas ou cobertas. Nesse contexto, sistemas de navegação indoor (navegação "
    "interna) tornam-se relevantes para orientar visitantes em locais de grande fluxo e "
    "complexidade espacial.",
    recuo_primeira_linha=1.25)

paragrafo_com_fonte(
    "Shopping centers, em particular, combinam múltiplos pisos, corredores extensos, "
    "lojas distribuídas, banheiros, praças de alimentação e acessos verticais (escadas, "
    "escadas rolantes e elevadores). A ausência de sinalização adequada ou a "
    "dificuldade de localizar rapidamente um estabelecimento pode gerar desconforto, "
    "perda de tempo e redução da experiência do visitante. Para pessoas com mobilidade "
    "reduzida, a barreira é ainda maior, pois é necessário identificar rotas "
    "acessíveis que evitem escadas e utilizem elevadores ou rampas.",
    recuo_primeira_linha=1.25)

paragrafo_com_fonte(
    "O presente trabalho descreve o desenvolvimento do sistema Navegação Indoor 3D, "
    "concebido como Trabalho de Conclusão de Curso (TCC). O sistema oferece ao "
    "visitante ferramentas para se localizar dentro de um shopping center modelo "
    "(Mini Shopping), buscar estabelecimentos e serviços, calcular rotas sobre um grafo "
    "de nós, visualizar o trajeto em mapas bidimensionais (2D) e tridimensionais (3D), "
    "e acompanhar uma simulação de navegação. Um painel administrativo permite a "
    "gestão de lojas, nós, arestas, pisos, categorias, QR Codes e a validação da "
    "integridade do grafo de navegação.",
    recuo_primeira_linha=1.25)

# --- 1.1 Problema e Justificativa ---
titulo_nivel2("Problema e Justificativa", numero="1.1")

paragrafo_com_fonte(
    "Ambientes internos de grande porte carecem de sistemas de orientação que unam, "
    "em uma única aplicação: (i) identificação da posição do visitante por meio de QR "
    "Codes fixos no ambiente; (ii) cálculo de rotas sobre um grafo de nós que respeite "
    "a conectividade real dos corredores, acessos verticais e bloqueios temporários; "
    "(iii) visualização do trajeto em mapas 2D e 3D; e (iv) painel administrativo para "
    "operadores validarem a consistência entre o banco de dados, o grafo de navegação e "
    "o modelo 3D publicado. Soluções comerciais existentes frequentemente dependem de "
    "beacons Bluetooth, varredura de Wi-Fi ou sensores físicos, que elevam o custo de "
    "implantação e manutenção, além de exigirem infraestrutura adicional no local.",
    recuo_primeira_linha=1.25)

paragrafo_com_fonte(
    "A justificativa deste trabalho reside em oferecer uma alternativa de baixo custo, "
    "baseada em QR Codes impressos e um grafo de navegação mantido por uma API, sem "
    "necessidade de hardware de posicionamento instalado no ambiente. O Mini Shopping "
    "utilizado como estudo de caso possui dois pisos (térreo e mezanino), 22 lojas, "
    "quatro banheiros, entrada principal, escadas rolantes e elevador, representando um "
    "cenário suficiente para validar rotas comuns e acessíveis entre pisos. A solução "
    "se destina a ser demonstrada em ambiente controlado, com validação física presencial "
    "pendente de execução em aparelhos reais.",
    recuo_primeira_linha=1.25)

# --- 1.2 Objetivos ---
titulo_nivel2("Objetivos", numero="1.2")

titulo_nivel3("Objetivo Geral", numero="1.2.1")
paragrafo_com_fonte(
    "Desenvolver um sistema integrado de navegação indoor para shopping centers, "
    "com mapas 2D e 3D, cálculo de rotas sobre grafo de nós, identificação de origem "
    "por QR Code, simulação de navegação e painel administrativo de gerenciamento e "
    "validação, atendendo aos requisitos de acessibilidade e usabilidade para o Mini "
    "Shopping utilizado como estudo de caso.",
    recuo_primeira_linha=1.25)

titulo_nivel3("Objetivos Específicos", numero="1.2.2")
objetivos = [
    "Implementar uma API REST (FastAPI) como fonte de verdade para shoppings, pisos, "
    "nós, arestas, lojas, categorias, QR Codes e cálculo de rotas por algoritmo de "
    "Dijkstra, respeitando bloqueios, acessibilidade e hierarquia de dados.",
    "Criar um contrato de cena versionado (catálogo JSON e modelo GLB gerado pelo "
    "Blender) que estabeleça a correspondência entre os dados da API e a geometria 3D "
    "do ambiente.",
    "Desenvolver um aplicativo do visitante (Expo/React Native) com leitura de QR Code, "
    "busca de destinos, cálculo e visualização de rotas em mapas 2D e 3D, simulação de "
    "navegação, troca de pisos e painel de instruções.",
    "Desenvolver um painel administrativo (React/Vite) para cadastro de pisos, nós, "
    "arestas, lojas e QR Codes, além da validação da consistência da cena 3D e auditoria "
    "de alterações.",
    "Validar o sistema por meio de testes automatizados (backend, frontend, E2E) e "
    "documentar os limites da validação, incluindo a validação física pendente em "
    "aparelhos reais.",
]
for obj in objetivos:
    paragrafo_com_fonte(obj, alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY,
                        tamanho=FONTE_TAMANHO, espaco_depois=4,
                        recuo_primeira_linha=1.25)

# --- 1.3 Metodologia ---
titulo_nivel2("Metodologia", numero="1.3")
paragrafo_com_fonte(
    "O desenvolvimento seguiu uma abordagem organizada em fases, com repositório "
    "monolítico (monorepo) contendo o backend, os dois frontends, os pacotes de modelagem "
    "3D e o contrato de cena. As principais etapas foram: (i) levantamento de requisitos "
    "e definição da arquitetura; (ii) implementação do backend FastAPI com banco de dados "
    "e seed do Mini Shopping; (iii) modelagem 3D do ambiente no Blender e exportação do "
    "GLB e catálogo de cena; (iv) desenvolvimento do aplicativo do visitante em Expo; "
    "(v) desenvolvimento do painel administrativo em React/Vite; e (vi) execução de testes "
    "automatizados e de integração, com registro de evidências. Nenhuma funcionalidade foi "
    "declarada como concluída sem evidência correspondente no código ou nos testes.",
    recuo_primeira_linha=1.25)

# ===========================================================================
# CAPÍTULO 2 - FUNDAMENTAÇÃO TEÓRICA
# ===========================================================================
pagina_quebra()
titulo_nivel1("Fundamentação Teórica", numero="2")

# --- 2.1 Navegação Indoor ---
titulo_nivel2("Navegação Indoor", numero="2.1")
paragrafo_com_fonte(
    "A navegação indoor refere-se ao conjunto de técnicas e tecnologias utilizadas para "
    "localizar pessoas ou objetos dentro de edifícios, onde os sinais de satélite (GPS) "
    "não estão disponíveis ou são imprecisos. Diferentemente da navegação externa, que "
    "pode confiar em coordenadas geográficas absolutas, a navegação interna depende de "
    "referências locais, como pontos de acesso Wi-Fi, beacons Bluetooth, tags NFC, QR "
    "Codes, sensores inerciais ou mapas pré-estabelecidos do ambiente.",
    recuo_primeira_linha=1.25)
paragrafo_com_fonte(
    "No contexto deste trabalho, a navegação é baseada em um grafo de nós que representa "
    "os pontos navegáveis do ambiente (entradas, corredores, acessos a lojas, banheiros, "
    "escadas, elevadores). O cálculo de rota utiliza o algoritmo de Dijkstra, executado "
    "no backend, garantindo que o trajeto respeite a conectividade real do grafo, "
    "bloqueios de arestas e restrições de acessibilidade (exclusão de escadas e escadas "
    "rolantes em rotas acessíveis). A posição do visitante é identificada por leitura de "
    "QR Code, escolha manual ou confirmação de chegada, não havendo rastreamento contínuo "
    "ou medição de deslocamento físico em tempo real.",
    recuo_primeira_linha=1.25)

# --- 2.2 Tecnologias Utilizadas ---
titulo_nivel2("Tecnologias Utilizadas", numero="2.2")
paragrafo_com_fonte(
    "A Tabela 1 resume as principais tecnologias utilizadas no sistema, com a justificativa "
    "de sua escolha para este projeto.",
    recuo_primeira_linha=1.25)

# Tabela 1
from docx.shared import Inches
tabela = doc.add_table(rows=1, cols=3)
tabela.style = "Table Grid"
tabela.alignment = WD_ALIGN_PARAGRAPH.CENTER
cabecalho = tabela.rows[0].cells
for i, texto in enumerate(["Tecnologia", "Componente", "Justificativa"]):
    cabecalho[i].text = texto
    for run in cabecalho[i].paragraphs[0].runs:
        run.font.name = FONTE
        run.font.size = Pt(10)
        run.bold = True

linhas_tabela = [
    ("FastAPI", "Backend / API REST", "Alta performance, tipagem automática com Pydantic, documentação interativa (Swagger/OpenAPI) e integração simples com SQLAlchemy."),
    ("SQLAlchemy / SQLite (demo) ou MySQL (produção)", "Banco de dados", "ORM maduro, suporte a migrations e portabilidade entre SQLite para demonstração e MySQL para produção."),
    ("Expo / React Native", "Aplicativo do visitante", "Permite desenvolvimento para Web, Android e iOS a partir de uma única base de código TypeScript, com suporte a mapas, gestos e AsyncStorage."),
    ("React / Vite", "Painel administrativo", "Build rápido, componente-based, fácil integração com API REST e tipos TypeScript."),
    ("Three.js / React Three Fiber", "Visualização 3D (web)", "Renderização de modelo GLB em navegador, câmera ortográfica, controles de órbita e isolamento de materiais por objeto."),
    ("Blender 4.5.14 LTS", "Modelagem 3D", "Geração procedural da geometria do Mini Shopping, exportação GLB com compressão Draco e geração do catálogo de cena."),
    ("TypeScript", "Linguagem de programação", "Tipagem estática que reduz erros em tempo de execução e melhora a manutenibilidade do código frontend."),
    ("QR Code", "Identificação de origem", "Custo baixo, impressão simples e leitura por câmera de dispositivos móveis para definir a posição inicial do visitante."),
]
for tech, comp, just in linhas_tabela:
    linha = tabela.add_row().cells
    for i, texto in enumerate([tech, comp, just]):
        linha[i].text = texto
        for run in linha[i].paragraphs[0].runs:
            run.font.name = FONTE
            run.font.size = Pt(10)

paragrafo_com_fonte(
    "Tabela 1 - Tecnologias utilizadas no sistema Navegação Indoor 3D.",
    alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espaco_antes=6, espaco_depois=12)

paragrafo_com_fonte(
    "A escolha por não adicionar serviços externos, beacons ou sensores físicos segue a "
    "diretriz do projeto de manter a solução de baixo custo e de fácil implantação, "
    "limitando a navegação ao ambiente modelado e publicado. O uso do Blender como fonte "
    "da geometria e da API como fonte da navegação mantém a separação de responsabilidades "
    "entre dados e representação visual.",
    recuo_primeira_linha=1.25)

# --- 2.3 Trabalhos Relacionados ---
titulo_nivel2("Trabalhos Relacionados", numero="2.3")
paragrafo_com_fonte(
    "A documentação de proveniência do repositório (docs/referencias.md) registra a "
    "importação de módulos de navegação indoor de repositórios externos por meio de "
    "git subtree, sem squash, preservando autores, datas e mensagens. Os módulos de "
    "referência incluem sistemas de wayfinding offline, checkpoints e navegação por "
    "QR Code, mas não foram importados como aplicação do monorepo. Suas licenças foram "
    "documentadas quando localizadas, e nenhuma licença foi acrescida ao código próprio "
    "do TCC, cuja titularidade e distribuição devem ser definidas pelo autor.",
    recuo_primeira_linha=1.25)
paragrafo_com_fonte(
    "Nenhum dos trabalhos relacionados foi utilizado como base direta para a "
    "implementação do Navegação Indoor 3D. O sistema foi desenvolvido de forma "
    "independente, com foco no Mini Shopping como estudo de caso, utilizando QR Codes "
    "como mecanismo de identificação de origem e um grafo de nós mantido pela API para "
    "cálculo de rotas.",
    recuo_primeira_linha=1.25)

doc.save("TCC_Navegacao_Indoor_3D_Parte2.docx")
print("Parte 2 salva: capítulos 1 e 2")