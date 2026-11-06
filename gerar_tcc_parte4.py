# -*- coding: utf-8 -*-
"""Parte 4: Capítulos 5, 6, 7, Referências e Anexos."""

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn

FONTE = "Arial"
FONTE_TAMANHO = 12
COR_TEXTO = RGBColor(0, 0, 0)

doc = Document("TCC_Navegacao_Indoor_3D_Parte3.docx")


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


# ===========================================================================
# CAPÍTULO 5 - RESULTADOS OBTIDOS
# ===========================================================================
pagina_quebra()
titulo_nivel1("Resultados Obtidos", numero="5")

paragrafo(
    "O sistema Navegação Indoor 3D foi implementado conforme planejado, entregando um "
    "aplicativo do visitante com mapas 2D e 3D, cálculo de rotas sobre grafo de nós, "
    "identificação de origem por QR Code, simulação de navegação e um painel "
    "administrativo para gerenciamento e validação. Os principais resultados são:",
    recuo_primeira_linha=1.25)

resultados = [
    ("Sistema funcional", "Backend FastAPI, aplicativo Expo (Web/Android/iOS) e painel React/Vite integrados e executando em ambiente local."),
    ("Mapas 2D e 3D", "Renderização de planta 2D (SVG) e cena 3D (GLB) com origem, destino, rota e marcador de posição."),
    ("Rotas entre pisos", "Rotas comuns e acessíveis entre térreo e mezanino, utilizando elevador para acessibilidade e excluindo escadas/escadas rolantes em rotas acessíveis."),
    ("Simulação", "Modo demonstração com marcador percorrendo o trajeto da API, explicitamente identificado como simulação, sem rastreamento físico."),
    ("Painel administrativo", "Cadastro de shoppings, pisos, nós, arestas, lojas, categorias e QR Codes, com validação de integridade do grafo e auditoria de alterações."),
    ("Contrato de cena", "Catálogo JSON e modelo GLB versionados, publicados pelo Blender e validados pelo publicador da API."),
    ("Testes automatizados", "129 testes de backend aprovados, 24 testes E2E do visitante, 8 de regressão, 34 cenários de layout/acessibilidade e 29 verificações de regras de negócio."),
]
for item, desc in resultados:
    paragrafo(f"• {item}: {desc}", tamanho=FONTE_TAMANHO, espaco_depois=4,
              recuo_primeira_linha=0)

# --- 5.1 Exemplo de rota ---
titulo_nivel2("Exemplo de Rota", numero="5.1")
paragrafo(
    "Um cenário reproduzível é: Entrada → NATURA (confirmação de chegada) → ANACAPRI. "
    "Após a confirmação de chegada na NATURA, o nó da loja torna-se a origem da próxima "
    "rota, o trajeto concluído desaparece e o mapa abre o piso correto para o novo "
    "destino. Rota acessível do térreo ao mezanino utiliza o elevador panorâmico, com "
    "instrução de acesso entre pisos identificada no painel de navegação.",
    recuo_primeira_linha=1.25)

# ===========================================================================
# CAPÍTULO 6 - LIMITAÇÕES
# ===========================================================================
pagina_quebra()
titulo_nivel1("Limitações", numero="6")

paragrafo(
    "O sistema apresenta as seguintes limitações, identificadas com base nas "
    "evidências e documentação do projeto:",
    recuo_primeira_linha=1.25)

limitacoes = [
    "Validação física pendente: leitura óptica de QR Codes, câmera real, teste com "
    "visitantes, TalkBack/VoiceOver, rede móvel e desempenho em aparelho físico não "
    "foram executados (roteiro preparado em docs/teste-fisico-visitante.md).",
    "MySQL não executado localmente; a validação utiliza banco SQLite temporário. A "
    "matriz SQLite/MySQL está configurada no CI, mas não foi executada neste ambiente.",
    "Nenhuma instalação em emulador ou aparelho físico Android/iOS foi realizada; as "
    "exportações nativas validam apenas a compilação, não a experiência de uso.",
    "Navegadores Firefox, WebKit, Chrome instalado e Edge não foram testados; os testes "
    "E2E utilizam Chromium do Playwright.",
    "Vulnerabilidades nas cadeias de dependências (29 no visitante e 4 no painel) não "
    "foram tratadas com atualização ampla de Expo/Vite; o hardening deve preceder a "
    "implantação pública.",
    "Hospedagem, domínio e credenciais de produção não estão definidos no repositório.",
    "A localização é atualizada apenas por QR Code, seleção manual ou confirmação de "
    "chegada; não existe rastreamento contínuo do deslocamento físico do visitante.",
    "A simulação não mede posição física real; o marcador percorre o trajeto da API em "
    "modo demonstração explícito.",
]
for lim in limitacoes:
    paragrafo(f"• {lim}", tamanho=FONTE_TAMANHO, espaco_depois=4,
              recuo_primeira_linha=0)

# ===========================================================================
# CAPÍTULO 7 - CONCLUSÃO E TRABALHOS FUTUROS
# ===========================================================================
pagina_quebra()
titulo_nivel1("Conclusão e Trabalhos Futuros", numero="7")

paragrafo(
    "O Navegação Indoor 3D foi desenvolvido como sistema integrado de orientação "
    "interna para shopping centers, com foco no Mini Shopping como estudo de caso. O "
    "sistema atende aos requisitos funcionais definidos: identificação de origem por "
    "QR Code, busca de destinos, cálculo de rotas sobre grafo de nós pelo backend, "
    "visualização em mapas 2D e 3D, simulação de navegação, troca de pisos e painel "
    "administrativo com validação de integridade do grafo. Os testes automatizados "
    "realizados cobrem backend, frontend, integração, layout, acessibilidade e regras "
    "de negócio, com resultados aprovados nas suítes executadas.",
    recuo_primeira_linha=1.25)

paragrafo(
    "As principais contribuições deste trabalho são: (i) a separação clara entre API "
    "como fonte de verdade da navegação e Blender como fonte da geometria, mediada pelo "
    "contrato de cena versionado; (ii) o uso de QR Codes como mecanismo de baixo custo "
    "para identificação de origem, sem necessidade de beacons ou sensores físicos; e "
    "(iii) a orientação consistente dos mapas 2D e 3D, com norte sempre para cima e "
    "inversão de 180° apenas quando o próximo trecho da rota está atrás do usuário.",
    recuo_primeira_linha=1.25)

titulo_nivel2("Trabalhos Futuros", numero="7.1")
trabalhos_futuros = [
    "Execução do roteiro de teste físico em aparelhos Android e iOS, incluindo leitura "
    "óptica de QR Codes impressos, TalkBack/VoiceOver e uso caminhando.",
    "Homologação do banco de dados MySQL em ambiente de produção.",
    "Tratamento das vulnerabilidades de dependências (Expo/Vite) antes de implantação "
    "pública.",
    "Definição de hospedagem, domínio e credenciais de produção.",
    "Possível substituição do gerenciamento de banco por Alembic para migrations "
    "estruturadas, registrada como dívida técnica no plano de integração.",
    "Avaliação de acessibilidade normativa de edificação real (não certificada por este "
    "trabalho, que valida apenas o modelo virtual).",
]
for tf in trabalhos_futuros:
    paragrafo(f"• {tf}", tamanho=FONTE_TAMANHO, espaco_depois=4,
              recuo_primeira_linha=0)

# ===========================================================================
# REFERÊNCIAS
# ===========================================================================
pagina_quebra()
titulo_nivel1("Referências", numero=None)

referencias = [
    "BRASIL. Associação Brasileira de Normas Técnicas. NBR 14724:2011: Informação e "
    "documentação – Trabalhos acadêmicos – Apresentação. Rio de Janeiro: ABNT, 2011.",
    "BRASIL. Associação Brasileira de Normas Técnicas. NBR 6023:2018: Informação e "
    "documentação – Referências bibliográficas – Elaboração. Rio de Janeiro: ABNT, "
    "2018.",
    "BRASIL. Associação Brasileira de Normas Técnicas. NBR 6022:2003: Documentação – "
    "Tese, dissertação e outros trabalhos acadêmicos – Apresentação. Rio de Janeiro: "
    "ABNT, 2003.",
    "React Three Fiber. Documentação de instalação e versões de React. Disponível em: "
    "https://r3f.docs.pmnd.rs/getting-started/installation. Acesso em: 2026.",
    "Three.js. GLTFLoader e Draco. Disponível em: https://threejs.org/docs/pages/"
    "GLTFLoader.html. Acesso em: 2026.",
    "Blender. Operadores de exportação. Disponível em: https://docs.blender.org/api/"
    "main/bpy.ops.export_scene.html. Acesso em: 2026.",
    "Navegação Indoor 3D. Repositório do projeto. Disponível em: https://github.com/"
    "Marcosrg-Gomes/Navegacao-Indoor-3D. Acesso em: 2026.",
    "Projeto Navegação Indoor 3D – Documentação interna (docs/). Disponível no "
    "repositório local do TCC. Acesso em: 2026.",
]
for i, ref in enumerate(referencias, 1):
    paragrafo(f"{i}. {ref}", alinhamento=WD_ALIGN_PARAGRAPH.LEFT,
              tamanho=FONTE_TAMANHO, espaco_depois=6,
              recuo_primeira_linha=0)

# ===========================================================================
# ANEXOS
# ===========================================================================
pagina_quebra()
titulo_nivel1("Anexos", numero=None)

titulo_nivel2("Anexo A – Estrutura do Monorepo", numero="A")
paragrafo(
    "A estrutura do repositório monorepo é a seguinte:",
    recuo_primeira_linha=1.25)
estrutura_anexo = [
    "apps/visitor/          Aplicativo do visitante (Expo / React Native / Expo Web)",
    "apps/admin/            Painel administrativo (React / Vite)",
    "services/api/          Backend FastAPI, SQLAlchemy, seed e testes",
    "packages/shopping-3d/  Gerador procedural Blender",
    "packages/scene-contract/ Validador compartilhado e JSON Schema",
    "assets/models/mini-shopping/  GLB, catálogo e plantas",
    "assets/qr/             QR Codes e folha para impressão",
    "docs/                  Documentação técnica e acadêmica",
    "evidence/              Evidências de testes e capturas",
]
for linha in estrutura_anexo:
    paragrafo(f"• {linha}", tamanho=FONTE_TAMANHO, espaco_depois=2,
              recuo_primeira_linha=0)

titulo_nivel2("Anexo B – Pisos e QR Codes do Mini Shopping", numero="B")
paragrafo("Tabela A1 - Pisos cadastrados", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=FONTE_TAMANHO, espaco_depois=6)

from docx.shared import Inches
tabela_anexo = doc.add_table(rows=1, cols=4)
tabela_anexo.style = "Table Grid"
cab = tabela_anexo.rows[0].cells
for i, texto in enumerate(["Código", "Nome", "Nível", "Dimensões"]):
    cab[i].text = texto
    for run in cab[i].paragraphs[0].runs:
        run.font.name = FONTE
        run.font.size = Pt(10)
        run.bold = True

pisos = [
    ("TERREO", "Térreo", "0", "30 × 60 m"),
    ("MEZANINO", "Mezanino", "1", "30 × 60 m"),
]
for p in pisos:
    linha = tabela_anexo.add_row().cells
    for i, texto in enumerate(p):
        linha[i].text = texto
        for run in linha[i].paragraphs[0].runs:
            run.font.name = FONTE
            run.font.size = Pt(10)

paragrafo("Tabela A2 - QR Codes iniciais", alinhamento=WD_ALIGN_PARAGRAPH.CENTER,
          tamanho=FONTE_TAMANHO, espaco_antes=12, espaco_depois=6)

tabela_qr = doc.add_table(rows=1, cols=2)
tabela_qr.style = "Table Grid"
cab = tabela_qr.rows[0].cells
for i, texto in enumerate(["Token", "Local"]):
    cab[i].text = texto
    for run in cab[i].paragraphs[0].runs:
        run.font.name = FONTE
        run.font.size = Pt(10)
        run.bold = True

qrs = [
    ("MINI-ENTRADA-PRINCIPAL", "Entrada principal"),
    ("MINI-TERREO-CENTRAL", "Corredor central térreo"),
    ("MINI-ESCADA-TERREO", "Base da escada rolante"),
    ("MINI-ELEVADOR-TERREO", "Elevador térreo"),
    ("MINI-MEZANINO-CENTRAL", "Passarela do mezanino"),
    ("MINI-ESCADA-MEZANINO", "Desembarque da escada rolante"),
    ("MINI-ELEVADOR-MEZANINO", "Elevador mezanino"),
]
for token, local in qrs:
    linha = tabela_qr.add_row().cells
    linha[0].text = token
    linha[1].text = local
    for i in range(2):
        for run in linha[i].paragraphs[0].runs:
            run.font.name = FONTE
            run.font.size = Pt(10)

titulo_nivel2("Anexo C – Evidências de Teste", numero="C")
paragrafo(
    "As evidências de teste estão disponíveis na pasta evidence/ do repositório, "
    "incluindo relatórios JSON dos testes E2E, capturas de tela dos mapas 2D e 3D, "
    "relatórios de layout e acessibilidade, e relatórios de regras de negócio. As "
    "capturas incluem telas do visitante em 360 px e 1280 px, mapa com rota no térreo, "
    "rota acessível no mezanino e validação no painel administrativo.",
    recuo_primeira_linha=1.25)

doc.save("TCC_Navegacao_Indoor_3D_Final.docx")
print("Parte 4 salva: capítulos 5, 6, 7, Referências e Anexos. Documento final gerado.")