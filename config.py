"""
config.py — Configuração Central do Mini Shopping

Este é o único arquivo que o usuário precisa editar para personalizar o projeto.
Todas as dimensões estão em metros (1 unidade Blender = 1 metro).
"""

# =============================================================================
# CONFIGURAÇÃO CENTRAL
# =============================================================================

CONFIG = {

    # -------------------------------------------------------------------------
    # Dimensões gerais do shopping
    # -------------------------------------------------------------------------
    "shopping": {
        "width": 30.0,          # Largura total (eixo X)
        "length": 60.0,         # Comprimento total (eixo Y)
        "height": 5.0,          # Pé-direito (eixo Z)
        "wall_thickness": 0.3,  # Espessura das paredes externas
        "floor_thickness": 0.2, # Espessura da laje do piso
        "ceiling_thickness": 0.2, # Espessura do teto
    },

    # -------------------------------------------------------------------------
    # Corredor central
    # -------------------------------------------------------------------------
    "corridor": {
        "width": 8.0,           # Largura do corredor (eixo X)
    },

    # -------------------------------------------------------------------------
    # Lojas
    # -------------------------------------------------------------------------
    "stores": {
        "count_per_side": 6,    # Quantidade de lojas em cada lado do corredor
        "width": 4.5,           # Largura da fachada de cada loja (eixo Y)
        "depth": 8.0,           # Profundidade de cada loja (eixo X)
        "wall_thickness": 0.15, # Espessura das paredes divisórias entre lojas
        "storefront_height": 3.0,  # Altura da vitrine de vidro
        "door_width": 1.4,      # Largura da porta da loja
        "door_height": 2.6,     # Altura da porta da loja
        "sign_height": 0.8,     # Altura do letreiro acima da vitrine
        # Offset de início das lojas a partir da entrada (eixo Y)
        "start_offset": 6.0,
    },

    # -------------------------------------------------------------------------
    # Praça de alimentação (fundo do shopping)
    # -------------------------------------------------------------------------
    "food_court": {
        "width": 20.0,          # Largura da praça de alimentação (eixo X)
        "depth": 10.0,          # Profundidade (eixo Y)
        "table_count": 8,       # Número de mesas
        "table_spacing": 2.0,   # Espaçamento entre mesas
        # Posição Y: calculada automaticamente a partir do fundo
        "offset_from_back": 2.0,
    },

    # -------------------------------------------------------------------------
    # Entrada principal (frente do shopping)
    # -------------------------------------------------------------------------
    "entrance": {
        "width": 6.0,           # Largura da abertura da entrada
        "height": 3.5,          # Altura da abertura da entrada
        "depth": 3.0,           # Profundidade do hall de entrada
        "canopy_depth": 2.0,    # Profundidade da marquise externa
        "canopy_height": 0.15,  # Espessura da marquise
    },

    # -------------------------------------------------------------------------
    # Escada decorativa
    # -------------------------------------------------------------------------
    "stairs": {
        "width": 4.0,           # Largura da escada
        "step_count": 12,       # Número de degraus
        "step_height": 0.18,    # Altura de cada degrau (norma ABNT: 16-18 cm)
        "step_depth": 0.28,     # Profundidade do degrau (norma ABNT: 28-30 cm)
        # Posição relativa: lado direito do fundo
        "position_offset_x": 6.0,  # Deslocamento a partir do centro (eixo X)
        "position_offset_y": 8.0,  # Deslocamento a partir do fundo (eixo Y)
    },

    # -------------------------------------------------------------------------
    # Sanitários
    # -------------------------------------------------------------------------
    "restrooms": {
        "width": 8.0,           # Largura total (masc + fem)
        "depth": 5.0,           # Profundidade
        "wall_thickness": 0.15, # Paredes internas
        "door_width": 1.2,      # Porta dos sanitários
        "door_height": 2.4,     # Altura da porta
        # Posição: lado esquerdo do fundo
        "position_offset_x": -6.0,
        "position_offset_y": 8.0,
    },

    # -------------------------------------------------------------------------
    # Mobiliário do corredor
    # -------------------------------------------------------------------------
    "furniture": {
        "bench_count": 6,       # Bancos no corredor
        "bench_length": 2.0,    # Comprimento de cada banco
        "bench_width": 0.5,     # Largura do banco
        "bench_height": 0.45,   # Altura do assento
        "bin_count": 8,         # Lixeiras
        "bin_radius": 0.2,      # Raio da lixeira
        "bin_height": 0.9,      # Altura da lixeira
        "planter_count": 6,     # Vasos de plantas
        "planter_radius": 0.35, # Raio do vaso
        "planter_height": 0.5,  # Altura do vaso
        "plant_height": 0.8,    # Altura da planta acima do vaso
    },

    # -------------------------------------------------------------------------
    # Mesas da praça de alimentação
    # -------------------------------------------------------------------------
    "tables": {
        "table_width": 0.9,     # Largura da mesa
        "table_length": 0.9,    # Comprimento da mesa
        "table_height": 0.75,   # Altura da mesa
        "chair_size": 0.45,     # Tamanho do assento da cadeira
        "chair_height": 0.45,   # Altura do assento
        "chairs_per_table": 4,  # Cadeiras por mesa
    },

    # -------------------------------------------------------------------------
    # Iluminação
    # -------------------------------------------------------------------------
    "lighting": {
        # Luzes gerais do corredor
        "general_count": 10,        # Mais pontos de luz uniformes
        "general_energy": 2500.0,   # Potência calibrada em Watts
        "general_size": 2.5,        # Área de emissão ampliada
        "general_height_offset": 0.15,
        # Luzes das lojas
        "store_energy": 850.0,      # Potência de vitrine em Watts
        "store_light_type": "POINT",
        "store_height_offset": 0.4,
        # Sol zenital através da claraboia
        "sun_energy": 3.5,          # Intensidade do Sol
        "sun_angle": 0.5,
        # Luz ambiente (World)
        "world_strength": 0.8,
        "world_color": (0.85, 0.90, 0.98), # Azul celeste suave
    },

    # -------------------------------------------------------------------------
    # Câmeras
    # -------------------------------------------------------------------------
    "cameras": {
        "focal_length": 35,         # Distância focal padrão (mm)
        "clip_end": 200.0,          # Distância máxima de visão
        "views": {
            "entrada": {
                # Câmera externa olhando para a entrada
                "location": (0.0, -35.0, 2.5),
                "rotation": (90.0, 0.0, 0.0),
            },
            "corredor": {
                # Câmera dentro do corredor olhando para o fundo
                "location": (0.0, -20.0, 1.7),
                "rotation": (90.0, 0.0, 0.0),
            },
            "aerea": {
                # Vista aérea de 3/4
                "location": (20.0, -35.0, 30.0),
                "rotation": (55.0, 0.0, 45.0),
                "focal_length": 28,
            },
            "praca": {
                # Câmera na praça de alimentação
                "location": (0.0, 22.0, 2.0),
                "rotation": (90.0, 0.0, 180.0),
            },
        },
    },


    # -------------------------------------------------------------------------
    # Materiais — Cores base em RGB linear (0.0–1.0)
    # -------------------------------------------------------------------------
    "materials": {
        "MAT_Piso_Shopping": {
            "color": (0.76, 0.72, 0.63, 1.0),  # Bege claro
            "roughness": 0.3,
            "metallic": 0.0,
            "specular": 0.5,
        },
        "MAT_Piso_Loja": {
            "color": (0.45, 0.45, 0.45, 1.0),  # Cinza médio
            "roughness": 0.4,
            "metallic": 0.0,
            "specular": 0.3,
        },
        "MAT_Piso_Praca": {
            "color": (0.64, 0.38, 0.22, 1.0),  # Terracota
            "roughness": 0.6,
            "metallic": 0.0,
            "specular": 0.1,
        },
        "MAT_Parede": {
            "color": (0.88, 0.88, 0.88, 1.0),  # Branco off-white
            "roughness": 0.8,
            "metallic": 0.0,
            "specular": 0.1,
        },
        "MAT_Teto": {
            "color": (0.95, 0.95, 0.95, 1.0),  # Branco quase puro
            "roughness": 0.9,
            "metallic": 0.0,
            "specular": 0.05,
        },
        "MAT_Vidro": {
            "color": (0.8, 0.9, 1.0, 1.0),     # Azul-transparente
            "roughness": 0.0,
            "metallic": 0.0,
            "transmission": 0.95,               # Alta transmissão
            "ior": 1.45,
        },
        "MAT_Metal": {
            "color": (0.6, 0.6, 0.6, 1.0),     # Cinza metálico
            "roughness": 0.15,
            "metallic": 1.0,
            "specular": 0.9,
        },
        "MAT_Madeira": {
            "color": (0.42, 0.26, 0.07, 1.0),  # Marrom madeira
            "roughness": 0.7,
            "metallic": 0.0,
            "specular": 0.1,
        },
        "MAT_Banco_Madeira": {
            "color": (0.55, 0.32, 0.17, 1.0),  # Marrom claro
            "roughness": 0.65,
            "metallic": 0.0,
            "specular": 0.1,
        },
        "MAT_Planta": {
            "color": (0.10, 0.30, 0.08, 1.0),  # Verde escuro
            "roughness": 0.9,
            "metallic": 0.0,
            "specular": 0.0,
        },
        "MAT_Vaso": {
            "color": (0.55, 0.28, 0.12, 1.0),  # Terracota escuro
            "roughness": 0.7,
            "metallic": 0.0,
            "specular": 0.1,
        },
        "MAT_Lixeira": {
            "color": (0.15, 0.15, 0.15, 1.0),  # Cinza escuro
            "roughness": 0.4,
            "metallic": 0.5,
            "specular": 0.4,
        },
        "MAT_Letreiro": {
            "color": (1.0, 1.0, 1.0, 1.0),     # Branco emissor
            "roughness": 0.5,
            "emission": (1.0, 0.95, 0.8),       # Emissão levemente quente
            "emission_strength": 3.0,
        },
        "MAT_Porta": {
            "color": (0.30, 0.30, 0.32, 1.0),  # Cinza escuro (alumínio anodizado)
            "roughness": 0.2,
            "metallic": 0.8,
            "specular": 0.7,
        },
        "MAT_Fachada_Loja": {
            "color": (0.20, 0.20, 0.22, 1.0),  # Cinza muito escuro
            "roughness": 0.3,
            "metallic": 0.6,
            "specular": 0.6,
        },
    },

    # -------------------------------------------------------------------------
    # Flags de controle de execução (o que gerar)
    # -------------------------------------------------------------------------
    "features": {
        "architecture": True,
        "entrance": True,
        "stairs": True,
        "stores": True,
        "areas": True,       # Praça de alimentação + sanitários
        "furniture": True,   # Bancos, lixeiras, vasos
        "decoration": True,  # Letreiros 3D, marcas exclusivas
        "lighting": True,
        "cameras": True,
    },
}

# =============================================================================
# CONSTANTES DERIVADAS (calculadas automaticamente a partir do CONFIG)
# Não edite esta seção — é calculada automaticamente.
# =============================================================================

def get_derived(cfg: dict) -> dict:
    """
    Calcula dimensões derivadas para evitar repetição de cálculos nos módulos.
    Retorna um dicionário com valores prontos para uso.
    """
    s = cfg["shopping"]
    c = cfg["corridor"]
    st = cfg["stores"]

    half_l = s["length"] / 2.0
    half_w = s["width"] / 2.0

    store_side_width = (half_w - c["width"] / 2.0 - s["wall_thickness"])

    store_row_length = (st["count_per_side"] * st["width"]
                        + (st["count_per_side"] - 1) * st["wall_thickness"])

    return {
        "half_length": half_l,
        "half_width": half_w,
        "store_side_width": store_side_width,
        "store_row_length": store_row_length,
        "corridor_center_x": 0.0,
        "left_store_inner_x": -(c["width"] / 2.0),
        "right_store_inner_x": (c["width"] / 2.0),
        "store_start_y": -half_l + cfg["entrance"]["depth"] + st["start_offset"],
        "back_wall_y": half_l - s["wall_thickness"],
        "front_wall_y": -half_l + s["wall_thickness"],
    }


DERIVED = get_derived(CONFIG)


# =============================================================================
# OPÇÕES DE EXECUÇÃO
# Controla o que será gerado quando o main.py for executado.
# =============================================================================

RUN_OPTIONS = {
    "clear_project_collections": True,  # Limpar coleções antes de recriar
    "setup_scene": True,                # Configurar unidades e engine
    "create_materials": True,
    "create_architecture": True,
    "create_entrance": True,
    "create_stairs": True,
    "create_stores": True,
    "create_areas": True,
    "create_furniture": True,
    "create_decoration": True,
    "create_lighting": True,
    "create_cameras": True,
}

