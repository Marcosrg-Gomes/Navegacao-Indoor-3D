# -*- coding: utf-8 -*-
"""Gerador do documento DOCX do TCC - Navegacao-Indoor-3D (normas ABNT)."""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ---------------------------------------------------------------------------
# Configuração de estilo ABNT
# ---------------------------------------------------------------------------
FONTE = "Arial"
FONTE_TAMANHO = 12
COR_TEXTO = RGBColor(0, 0, 0)
MARGEM = Cm(3)  # superior e esquerda (encadernação)
MARGEM_LADO = Cm(2)  # inferior e direita

doc = Document()

# Configura a seção (margens, tamanho A4)
secao = doc.sections[0]
secao.page_width = Cm(21)
secao.page_height = Cm(29.7)
secao.top_margin = MARGEM
secao.bottom_margin = MARGEM_LADO
secao.left_margin = MARGEM
secao.right_margin = MARGEM_LADO

# Estilo Normal
normal = doc.styles["Normal"]
normal.font.name = FONTE
normal.font.size = Pt(FONTE_TAMANHO)
normal.font.color.rgb = COR_TEXTO
pf = normal.paragraph_format
pf.space_after = Pt(0)
pf.space_before = Pt(0)
pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE  # 1,5 espaçamento

# Força a fonte em todos os runs (correção para documentos Word)
rpr = normal.element.get_or_add_rPr()
rfonts = rpr.get_or_add_rFonts()
rfonts.set(qn("w:ascii"), FONTE)
rfonts.set(qn("w:hAnsi"), FONTE)
rfonts.set(qn("w:cs"), FONTE)


def paragrafo(texto="", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY,
              tamanho=FONTE_TAMANHO, negrito=False, italico=False,
              espaco_antes=0, espaco_depois=0, espacamento=1.5,
              recuo_primeira_linha=None, cor=None):
    """Cria um parágrafo com formatação padronizada."""
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
        # força fonte também no run
        rPr = run._element.get_or_add_rPr()
        rFonts = rPr.get_or_add_rFonts()
        rFonts.set(qn("w:ascii"), FONTE)
        rFonts.set(qn("w:hAnsi"), FONTE)
        rFonts.set(qn("w:cs"), FONTE)
    return p


def titulo_nivel1(texto, numero=None):
    """Título de capítulo (nível 1), centralizado, negrito."""
    texto_completo = f"{numero}. {texto}" if numero else texto
    p = paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
                  tamanho=FONTE_TAMANHO, negrito=True, espacamento=1.5,
                  espaco_depois=12)
    return p


def titulo_nivel2(texto, numero=None):
    """Subtítulo (nível 2), alinhado à esquerda, negrito."""
    texto_completo = f"{numero}. {texto}" if numero else texto
    p = paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                  tamanho=FONTE_TAMANHO, negrito=True, espaco_depois=6,
                  espaco_antes=12, recuo_primeira_linha=0)
    return p


def titulo_nivel3(texto, numero=None):
    """Subtítulo (nível 3), alinhado à esquerda, negrito."""
    texto_completo = f"{numero}. {texto}" if numero else texto
    p = paragrafo(texto_completo, alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
                  tamanho=FONTE_TAMANHO, negrito=True, espaco_depois=6,
                  espaco_antes=6, recuo_primeira_linha=0)
    return p


def pagina_quebra():
    """Insere quebra de página."""
    from docx.enum.text import WD_BREAK
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    p.paragraph_format.space_after = Pt(0)
    return p


def linha_tracada():
    """Linha horizontal simples."""
    p = doc.add_paragraph()
    pPr = p._element.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "000000")
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


# ---------------------------------------------------------------------------
# CAPA
# ---------------------------------------------------------------------------
paragrafo("", espacamento=1.0, espaco_depois=0)
for _ in range(8):
    paragrafo("", espacamento=1.0)

paragrafo("UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espacamento=1.5)
paragrafo("Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas",
          alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espacamento=1.5)

pagina_quebra()
paragrafo("", espacamento=1.0, espaco_depois=0)
for _ in range(10):
    paragrafo("", espacamento=1.0)

paragrafo("NAVEGAÇÃO INDOOR 3D", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=16, negrito=True, espacamento=1.5)
paragrafo("", tamanho=12, espacamento=1.5)
paragrafo("Sistema de orientação interna para shopping centers com mapas 2D e 3D, "
          "cálculo de rotas e painel administrativo integrado",
          alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espacamento=1.5)

pagina_quebra()
paragrafo("", espacamento=1.0, espaco_depois=0)
for _ in range(12):
    paragrafo("", espacamento=1.0)

paragrafo("Trabalho de Conclusão de Curso apresentado à Universidade Tecnológica "
          "Federal do Paraná, como requisito parcial para obtenção do título de "
          "Tecnólogo em Análise e Desenvolvimento de Sistemas.",
          alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espacamento=1.5)

paragrafo("", tamanho=12, espaco_depois=18, espacamento=1.5)
paragrafo("Autor: Nome do Autor", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, espacamento=1.5)
paragrafo("Orientador: Nome do Orientador", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, espacamento=1.5)
paragrafo("Local / Data", alinhamento=WD_ALIGN_PARAGRAPH.CENTER, tamanho=12, espacamento=1.5)

# ---------------------------------------------------------------------------
# ELEMENTOS PRÉ-TEXTUAIS
# ---------------------------------------------------------------------------
pagina_quebra()
titulo_nivel1("RESUMO", numero=None)
paragrafo("Este trabalho apresenta o desenvolvimento do sistema Navegação Indoor 3D, "
          "uma aplicação para orientação de visitantes em ambientes internos de shopping "
          "centers, com mapas bidimensionais e tridimensionais, cálculo de rotas sobre "
          "grafo de nós, leitura de QR Codes para definição da origem, simulação de "
          "navegação e painel administrativo para gerenciamento de dados e validação "
          "da integridade do grafo. O sistema utiliza FastAPI como backend, Expo "
          "(React Native) para o aplicativo do visitante, React com Vite para o painel "
          "administrativo e Blender para a modelagem 3D do ambiente. Os resultados dos "
          "testes realizados indicam que o sistema atende aos requisitos funcionais e "
          "não funcionais definidos, com validação de rotas comum e acessível entre "
          "pisos, mas com validação física em ambiente real ainda pendente.",
          recuo_primeira_linha=1.25, espacamento=1.5)

paragrafo("", espacamento=1.0)
paragrafo("Palavras-chave: navegação indoor; shopping center; mapa 2D; mapa 3D; QR Code; "
          "sistema de orientação; TCC.",
          alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY, tamanho=12, espacamento=1.5)

pagina_quebra()
titulo_nivel1("SUMÁRIO", numero=None)
sumario_itens = [
    ("1. Introdução", 1),
    ("1.1. Problema e Justificativa", 2),
    ("1.2. Objetivos", 2),
    ("1.3. Metodologia", 2),
    ("2. Fundamentação Teórica", 1),
    ("2.1. Navegação Indoor", 2),
    ("2.2. Tecnologias Utilizadas", 2),
    ("2.3. Trabalhos Relacionados", 2),
    ("3. Desenvolvimento do Sistema", 1),
    ("3.1. Arquitetura e Monorepo", 2),
    ("3.2. Backend e APIs (FastAPI)", 2),
    ("3.3. Banco de Dados e Modelo de Dados", 2),
    ("3.4. Aplicativo do Visitante (Expo)", 2),
    ("3.5. Painel Administrativo (React/Vite)", 2),
    ("3.6. Modelagem 3D e Contrato de Cena (Blender)", 2),
    ("3.7. Mapas 2D e 3D, Rota e Simulação", 2),
    ("4. Testes e Validação", 1),
    ("4.1. Testes Automatizados", 2),
    ("4.2. Validação de Integração", 2),
    ("4.3. Limites da Validação", 2),
    ("5. Resultados Obtidos", 1),
    ("6. Limitações", 1),
    ("7. Conclusão e Trabalhos Futuros", 1),
    ("Referências", 1),
    ("Anexos", 1),
]
for texto, nivel in sumario_itens:
    recuo = 0 if nivel == 1 else 0.5
    alinh = WD_ALIGN_PARAGRAPH.LEFT
    p = paragrafo(texto, alinhamento=alinh, tamanho=12, espacamento=1.0,
                  recuo_primeira_linha=recuo, espaco_depois=2)

pagina_quebra()
titulo_nivel1("LISTA DE FIGURAS", numero=None)
figuras = [
    ("Figura 1 - Estrutura do monorepo", 1),
    ("Figura 2 - Diagrama de arquitetura do sistema", 1),
    ("Figura 3 - Fluxo de navegação do visitante", 1),
    ("Figura 4 - Fluxo de leitura do QR Code", 1),
    ("Figura 5 - Modelo conceitual do banco de dados", 1),
    ("Figura 6 - Tela inicial do aplicativo do visitante", 1),
    ("Figura 7 - Mapa 2D do piso", 1),
    ("Figura 8 - Mapa 3D da cena", 1),
    ("Figura 9 - Painel de navegação Waze", 1),
    ("Figura 10 - Painel administrativo - Login", 1),
    ("Figura 11 - Painel administrativo - Dashboard", 1),
    ("Figura 12 - Capturas de evidências de teste", 1),
]
for texto, nivel in figuras:
    paragrafo(texto, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, tamanho=12, espacamento=1.0,
              recuo_primeira_linha=0.5, espaco_depois=2)

pagina_quebra()
titulo_nivel1("LISTA DE TABELAS", numero=None)
tabelas = [
    ("Tabela 1 - Tecnologias utilizadas", 1),
    ("Tabela 2 - Requisitos funcionais implementados", 1),
    ("Tabela 3 - Regras de negócio", 1),
    ("Tabela 4 - Pisos do Mini Shopping", 1),
    ("Tabela 5 - QR Codes iniciais", 1),
    ("Tabela 6 - Resultados dos testes", 1),
]
for texto, nivel in tabelas:
    paragrafo(texto, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, tamanho=12, espacamento=1.0,
              recuo_primeira_linha=0.5, espaco_depois=2)

pagina_quebra()
titulo_nivel1("LISTA DE ABREVIATURAS E SIGLAS", numero=None)
abreviaturas = [
    ("API", "Application Programming Interface"),
    ("CRUD", "Create, Read, Update, Delete"),
    ("E2E", "End-to-End"),
    ("GLB", "Formato de arquivo binário glTF"),
    ("GUI", "Graphical User Interface"),
    ("HTML", "HyperText Markup Language"),
    ("HTTP", "HyperText Transfer Protocol"),
    ("JSON", "JavaScript Object Notation"),
    ("QR Code", "Quick Response Code"),
    ("REST", "Representational State Transfer"),
    ("SQL", "Structured Query Language"),
    ("TCC", "Trabalho de Conclusão de Curso"),
    ("UI", "User Interface"),
    ("UX", "User Experience"),
    ("WCAG", "Web Content Accessibility Guidelines"),
]
for sigla, significado in abreviaturas:
    paragrafo(f"{sigla}: {significado}", alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
              tamanho=12, espacamento=1.0, recuo_primeira_linha=0.5, espaco_depois=2)

doc.save("TCC_Navegacao_Indoor_3D_Parte1.docx")
print("Parte 1 salva: capa, pré-textuais, sumário, listas de figuras/tabelas/abreviaturas")