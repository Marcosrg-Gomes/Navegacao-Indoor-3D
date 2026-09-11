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
        "height": 9.2,          # Altura total do edifício (2 pavimentos)
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
    # Mezanino (segundo pavimento)
    # -------------------------------------------------------------------------
    "mezzanine": {
        "height": 4.2,          # Altura onde começa a laje (pé-direito térreo)
        "slab_thickness": 0.5,  # Espessura da laje estrutural
        "floor_z": 4.7,         # Z do piso caminhável (height + slab_thickness)
        "walkway_width": 3.5,   # Largura da passarela lateral do mezanino (cada lado)
        "atrium_opening": 5.0,  # Largura do vão central aberto (= corredor - 2*guarda-corpo)
        "guardrail_height": 1.1, # Altura do guarda-corpo de vidro
        "guardrail_thickness": 0.04, # Espessura do vidro do guarda-corpo
        "ceiling_height": 9.2,  # Teto do piso superior (= shopping.height)
        "count_per_side": 5,    # Lojas por lado no mezanino
    },

    # -------------------------------------------------------------------------
    # Lojas (térreo)
    # -------------------------------------------------------------------------
    "stores": {
        "count_per_side": 6,    # Quantidade de lojas em cada lado do corredor (térreo)
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
    # Praça de alimentação (agora no mezanino - piso superior)
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
    # Escada monumental (2 lances para o mezanino)
    # -------------------------------------------------------------------------
    "stairs": {
        "width": 3.5,           # Largura da escada
        "step_count": 26,       # Número total de degraus (13 por lance)
        "step_height": 0.18,    # Altura de cada degrau
        "step_depth": 0.28,     # Profundidade do degrau
        "landing_z": 2.35,      # Altura do patamar intermediário
        # Posição: lado direito do fundo
        "position_offset_x": 5.5,  # Deslocamento a partir do centro (eixo X)
        "position_offset_y": 6.0,  # Deslocamento a partir do fundo (eixo Y)
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
    # Quiosques no corredor térreo
    # -------------------------------------------------------------------------
    "kiosks": {
        "count": 3,             # Número de quiosques
        "width": 2.5,           # Largura do quiosque (eixo X)
        "depth": 2.0,           # Profundidade do quiosque (eixo Y)
        "height": 1.1,          # Altura do balcão
        "canopy_height": 0.08,  # Espessura da cobertura do quiosque
        "names": ["A Kombinha", "Açailand", "Acium"],
        "colors": [
            (1.0, 0.44, 0.26, 1.0),  # A Kombinha — Laranja Retrô
            (0.49, 0.34, 0.76, 1.0),  # Açailand — Roxo Açaí
            (0.50, 0.87, 0.92, 1.0),  # Acium — Azul Aço Prateado
        ],
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
        # Luzes gerais do corredor (térreo)
        "general_count": 10,        # Pontos de luz no corredor térreo
        "general_energy": 2500.0,   # Potência calibrada em Watts
        "general_size": 2.5,        # Área de emissão ampliada
        "general_height_offset": 0.15,
        # Luzes do mezanino
        "mezzanine_count": 8,       # Pontos de luz no corredor superior
        "mezzanine_energy": 2000.0,
        # Luzes das lojas
        "store_energy": 850.0,      # Potência de vitrine em Watts
        "store_light_type": "POINT",
        "store_height_offset": 0.4,
        # Sol zenital através da claraboia
        "sun_energy": 3.5,          # Intensidade do Sol
        "sun_angle": 0.5,
        # Pendentes esculturais (Halo Rings) no átrio
        "pendant_count": 5,         # Número de pendentes
        "pendant_energy": 500.0,    # Emissão dos pendentes
        # Fitas LED na laje do mezanino
        "led_strip_energy": 200.0,
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
                "location": (0.0, -35.0, 2.5),
                "rotation": (90.0, 0.0, 0.0),
            },
            "corredor": {
                "location": (0.0, -20.0, 1.7),
                "rotation": (90.0, 0.0, 0.0),
            },
            "aerea": {
                "location": (25.0, -40.0, 38.0),
                "rotation": (55.0, 0.0, 45.0),
                "focal_length": 28,
            },
            "praca": {
                # Câmera na praça de alimentação (agora no mezanino)
                "location": (0.0, 22.0, 6.7),
                "rotation": (90.0, 0.0, 180.0),
            },
            "mezanino": {
                # Vista do balcão do mezanino (Balcony View)
                "location": (-3.5, -5.0, 5.8),
                "rotation": (80.0, 0.0, -30.0),
            },
            "wormseye": {
                # Vista de baixo para cima no átrio
                "location": (0.0, 0.0, 0.4),
                "rotation": (0.0, 0.0, 0.0),
                "focal_length": 18,
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
        "MAT_Piso_Mezanino": {
            "color": (0.82, 0.78, 0.70, 1.0),  # Bege mais claro para o mezanino
            "roughness": 0.25,
            "metallic": 0.0,
            "specular": 0.55,
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
            "color": (0.92, 0.96, 1.0, 1.0),     # Cristalino límpido
            "roughness": 0.01,
            "metallic": 0.0,
            "specular": 0.85,
            "transmission": 0.98,               # Alta transmissão límpida
            "ior": 1.52,
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
        "MAT_Pendente": {
            "color": (1.0, 0.85, 0.5, 1.0),    # Dourado quente
            "roughness": 0.1,
            "emission": (1.0, 0.85, 0.5),
            "emission_strength": 5.0,
        },
        "MAT_LED": {
            "color": (0.9, 0.95, 1.0, 1.0),    # Branco frio LED
            "roughness": 0.5,
            "emission": (0.9, 0.95, 1.0),
            "emission_strength": 2.5,
        },
        "MAT_Escada_Rolante": {
            "color": (0.5, 0.5, 0.55, 1.0),    # Cinza aço
            "roughness": 0.2,
            "metallic": 0.9,
            "specular": 0.8,
        },
        "MAT_Elevador_Vidro": {
            "color": (0.75, 0.88, 1.0, 1.0),   # Azul vidro mais saturado
            "roughness": 0.0,
            "metallic": 0.0,
            "transmission": 0.90,
            "ior": 1.45,
        },
        "MAT_Laje_Mezanino": {
            "color": (0.80, 0.80, 0.80, 1.0),  # Cinza concreto
            "roughness": 0.85,
            "metallic": 0.0,
            "specular": 0.05,
        },
        "MAT_Quartzo": {
            "color": (0.92, 0.90, 0.86, 1.0),  # Quartzo claro
            "roughness": 0.12,
            "metallic": 0.0,
            "specular": 0.75,
        },
        "MAT_Marmore": {
            "color": (0.88, 0.86, 0.82, 1.0),  # Mármore polido
            "roughness": 0.08,
            "metallic": 0.0,
            "specular": 0.85,
        },
        "MAT_Aluminio_Escovado": {
            "color": (0.72, 0.73, 0.75, 1.0),  # Alumínio escovado
            "roughness": 0.35,
            "metallic": 1.0,
            "specular": 0.6,
        },
        "MAT_Vidro_Escurecido": {
            "color": (0.08, 0.08, 0.10, 1.0),  # Vidro fumê
            "roughness": 0.02,
            "metallic": 0.0,
            "specular": 0.9,
            "transmission": 0.55,
            "ior": 1.52,
            "alpha": 0.75,
        },
        "MAT_Acolchoado": {
            "color": (0.78, 0.72, 0.65, 1.0),  # Estofado bege
            "roughness": 0.85,
            "metallic": 0.0,
            "specular": 0.05,
        },
        "MAT_Louca": {
            "color": (0.96, 0.96, 0.95, 1.0),  # Louça sanitária
            "roughness": 0.08,
            "metallic": 0.0,
            "specular": 0.7,
        },
    },

    # -------------------------------------------------------------------------
    # Flags de controle de execução (o que gerar)
    # -------------------------------------------------------------------------
    "features": {
        "architecture": True,
        "entrance": True,
        "stairs": True,
        "mezzanine": True,       # Laje do mezanino e passarelas
        "guardrails": True,      # Guarda-corpo de vidro
        "vertical_circulation": True,  # Escadas rolantes + elevador
        "kiosks": True,          # Quiosques no corredor térreo
        "stores": True,
        "areas": True,           # Praça de alimentação + sanitários
        "furniture": True,       # Bancos, lixeiras, vasos
        "decoration": True,      # Letreiros 3D, marcas exclusivas
        "pendants": True,        # Pendentes esculturais no átrio
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
    mz = cfg["mezzanine"]

    half_l = s["length"] / 2.0
    half_w = s["width"] / 2.0

    store_side_width = (half_w - c["width"] / 2.0 - s["wall_thickness"])

    store_row_length = (st["count_per_side"] * st["width"]
                        + (st["count_per_side"] - 1) * st["wall_thickness"])

    mz_row_length = (mz["count_per_side"] * st["width"]
                     + (mz["count_per_side"] - 1) * st["wall_thickness"])

    return {
        "half_length": half_l,
        "half_width": half_w,
        "store_side_width": store_side_width,
        "store_row_length": store_row_length,
        "mz_row_length": mz_row_length,
        "corridor_center_x": 0.0,
        "left_store_inner_x": -(c["width"] / 2.0),
        "right_store_inner_x": (c["width"] / 2.0),
        "store_start_y": -half_l + cfg["entrance"]["depth"] + st["start_offset"],
        "back_wall_y": half_l - s["wall_thickness"],
        "front_wall_y": -half_l + s["wall_thickness"],
        # Mezanino
        "mz_floor_z": mz["floor_z"],
        "mz_slab_z": mz["height"],
        "mz_ceiling_z": mz["ceiling_height"],
        # Passarelas do mezanino: X dos centros
        "mz_left_center_x": -(c["width"] / 2.0 + mz["walkway_width"] / 2.0),
        "mz_right_center_x": +(c["width"] / 2.0 + mz["walkway_width"] / 2.0),
        # Inner X do corredor (face interna da passarela)
        "mz_corridor_left_x": -(c["width"] / 2.0),
        "mz_corridor_right_x": +(c["width"] / 2.0),
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
    "create_mezzanine": True,           # Laje e passarelas do mezanino
    "create_guardrails": True,          # Guarda-corpos de vidro
    "create_vertical_circulation": True, # Escadas rolantes + elevador
    "create_kiosks": True,              # Quiosques no corredor
    "create_stores": True,
    "create_areas": True,
    "create_furniture": True,
    "create_decoration": True,
    "create_pendants": True,            # Pendentes esculturais
    "create_lighting": True,
    "create_cameras": True,
}
