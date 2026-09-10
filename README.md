# Mini Shopping — Automação Procedural em Blender Python

Projeto acadêmico de geração procedural completa de um mini shopping center interno navegável, utilizando exclusivamente Python e a API `bpy` do Blender.

---

## 📁 Estrutura do Projeto

```text
mini_shopping/
├── main.py                    # Orquestrador central (execute este arquivo)
├── config.py                  # Dimensões, parâmetros e opções de execução
├── scene_setup.py             # Criação e limpeza seletiva de Collections
├── materials.py               # Materiais Principled BSDF reutilizáveis
│
├── utils/
│   ├── geometry.py            # Criação de malhas primitivas via bmesh
│   ├── helpers.py             # Utilitários de coleções, vínculos e rotações
│   └── logging.py             # Formatação de logs de progresso
│
├── architecture/
│   ├── floor.py               # Lajes de piso (geral, praça, lojas)
│   ├── walls.py               # Paredes externas com vão e divisórias
│   ├── ceiling.py             # Teto principal e forro rebaixado
│   ├── entrance.py            # Hall de entrada, colunas e marquise
│   └── stairs.py              # Escada decorativa com degraus e guarda-corpo
│
├── stores/
│   ├── store_builder.py       # Montagem modular das lojas (E01–E06 e D01–D06)
│   ├── storefront.py          # Vitrines em vidro e caixilhos metálicos
│   ├── doors.py               # Portas de alumínio
│   └── signs.py               # Letreiros luminosos frontais
│
├── areas/
│   ├── food_court.py          # Praça de alimentação (balcões, mesas e cadeiras)
│   └── restrooms.py           # Bloco de sanitários com divisórias e placas
│
├── furniture/
│   ├── benches.py             # Bancos de descanso (linked instances)
│   ├── bins.py                # Lixeiras de aço escovado
│   ├── planters.py            # Vasos de plantas com folhagem
│   └── tables.py              # Conjuntos de mesas/cadeiras
│
├── lighting/
│   ├── general.py             # Area Lights no teto do corredor e praça
│   └── store_lights.py        # Iluminação individual por loja
│
└── cameras/
    └── views.py               # Câmeras (Entrada, Corredor, Aérea 3/4, Praça)
```

---

## 🚀 Como Executar no Blender

1. Abra o **Blender** (3.6 LTS, 4.0, 4.1 ou superior).
2. Vá até a aba **Scripting** no topo da janela.
3. Clique em **Open** e navegue até:
   `mini_shopping/main.py`
4. Abra o Console do Sistema para acompanhar o progresso em tempo real:
   - Menu superior: **Window > Toggle System Console**
5. Clique no botão **Run Script** (ou pressione **Alt + P**).
6. Mude o Viewport Shading para **Material Preview** ou **Rendered** para ver os materiais e luzes.

---

## ⚙️ Customização

Para alterar dimensões, quantidades de lojas, ligar/desligar mobiliário ou letreiros, edite o arquivo [`config.py`](file:///c:/Users/Dev_2o_Ano/Documents/2°Semestre/Shopping Mini/mini_shopping/config.py):

```python
# Ativar mobiliário e letreiros (Fase 2):
CONFIG["features"]["furniture"] = True
CONFIG["features"]["decoration"] = True
```
