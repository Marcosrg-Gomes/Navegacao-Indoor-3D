# -*- coding: utf-8 -*-
"""Parte 5: Inserir imagens de evidências no documento DOCX final."""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
import os

FONTE = "Arial"
FONTE_TAMANHO = 12
COR_TEXTO = RGBColor(0, 0, 0)
EVIDENCE_DIR = "evidence"

doc = Document("TCC_Navegacao_Indoor_3D_Final.docx")


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


def pagina_quebra():
    from docx.enum.text import WD_BREAK
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    p.paragraph_format.space_after = Pt(0)
    return p


def adicionar_figura(caminho_imagem, legenda, largura_cm=12):
    """Adiciona uma imagem com legenda centralizada."""
    if not os.path.exists(caminho_imagem):
        paragrafo(f"[Imagem não encontrada: {caminho_imagem}]",
                  alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
                  tamanho=10, italico=True, espaco_depois=6)
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(caminho_imagem, width=Cm(largura_cm))
    paragrafo(legenda, alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
              tamanho=10, espaco_depois=12, espacamento=1.0)


# ===========================================================================
# CAPÍTULO DOS RECURSOS VISUAIS (inserido antes das Referências)
# ===========================================================================
pagina_quebra()
titulo_nivel1("Recursos Visuais e Evidências", numero=None)

paragrafo(
    "Este capítulo apresenta capturas de tela e evidências reais do sistema "
    "Navegação Indoor 3D, extraídas diretamente da pasta evidence/ do repositório. "
    "Todas as imagens correspondem a estados válidos do aplicativo durante os testes "
    "automatizados e de integração.",
    recuo_primeira_linha=1.25, espaco_depois=12)

# Figura 1 - Explorar mobile
paragrafo("Figura 1 - Tela Explorar no celular (360 px)", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "visitor-explore-360.png"),
    "Tela de Explorar do aplicativo do visitante em largura de 360 px, mostrando busca, "
    "filtros e resultados de destinos.",
    largura_cm=8)

# Figura 2 - Explorar desktop
paragrafo("Figura 2 - Tela Explorar no desktop (1280 px)", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "visitor-explore-1280.png"),
    "Tela de Explorar em largura de 1280 px, com layout em duas colunas (diretório e planta).",
    largura_cm=14)

# Figura 3 - Rota térreo
paragrafo("Figura 3 - Mapa 2D com rota no térreo", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "visitor-ground-route.png"),
    "Planta 2D do térreo exibindo rota traçada entre origem e destino, com nós e arestas do grafo.",
    largura_cm=12)

# Figura 4 - Rota acessível mezanino
paragrafo("Figura 4 - Rota acessível no mezanino", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "visitor-upper-accessible.png"),
    "Mapa do mezanino mostrando rota acessível utilizando o elevador, sem escadas ou escadas rolantes.",
    largura_cm=12)

# Figura 5 - Validação painel
paragrafo("Figura 5 - Validação de cena no painel administrativo", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "admin-scene-validation.png"),
    "Painel administrativo exibindo o relatório de validação de integridade da cena 3D.",
    largura_cm=14)

# Figura 6 - Texto ampliado
paragrafo("Figura 6 - Texto ampliado (200%) no celular", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "visitor-large-text-360.png"),
    "Visualização do conteúdo com escala de fonte ampliada a 200% em tela de 360 px, "
    "sem overflow horizontal e com ação de rota disponível.",
    largura_cm=8)

# Figura 7 - Mapa final Chrome
paragrafo("Figura 7 - Mapa final no Chrome (360 px)", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "final-chrome-map-360.png"),
    "Estado final do mapa no navegador Chrome em largura de 360 px, após testes de navegação.",
    largura_cm=8)

# Figura 8 - Chegada final
paragrafo("Figura 8 - Tela de chegada (360 px)", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=12, negrito=True, espaco_depois=4)
adicionar_figura(
    os.path.join(EVIDENCE_DIR, "final-chrome-arrival-360.png"),
    "Tela de confirmação de chegada ao destino, exibindo localização resultante e próximas ações.",
    largura_cm=8)

doc.save("TCC_Navegacao_Indoor_3D_Com_Imagens.docx")
print("Documento com imagens salvo: TCC_Navegacao_Indoor_3D_Com_Imagens.docx")