"""
materials.py — Criação e gerenciamento de materiais reutilizáveis e procedurais

Todos os materiais usam nós do Blender (Principled BSDF, Brick Texture, Wave Texture, Noise).
Gera pisos com paginação/rejunte realistas, madeiras com veios orgânicos e imperfeições
de reflexo, 100% procedurais sem dependência de imagens externas.
"""

import bpy
from typing import Optional, Tuple
from utils.logging import log_info, log_material_created, log_section, log_section_end, log_warning


# =============================================================================
# UTILITÁRIOS DE NÓS
# =============================================================================

def _get_principled_bsdf(material: bpy.types.Material) -> Optional[bpy.types.Node]:
    """Retorna o nó Principled BSDF de um material, se existir."""
    if not material.node_tree:
        return None
    for node in material.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            return node
    return None


def _setup_material_base(material: bpy.types.Material) -> Tuple[bpy.types.NodeTree, bpy.types.Node, bpy.types.Node]:
    """Limpa e inicializa os nós básicos: Principled BSDF e Material Output."""
    material.use_nodes = True
    nt = material.node_tree
    nt.nodes.clear()

    bsdf = nt.nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    output = nt.nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (400, 0)

    nt.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return nt, bsdf, output


def _set_bsdf_input(bsdf: bpy.types.Node, candidate_names: Tuple[str, ...], value):
    """Define valor em um socket do Principled BSDF com compatibilidade de versões."""
    for name in candidate_names:
        if name in bsdf.inputs:
            bsdf.inputs[name].default_value = value
            return True
    return False


# =============================================================================
# SHADERS PROCEDURAIS AVANÇADOS
# =============================================================================

def create_tile_floor_material(
    name: str,
    tile_color_1: Tuple[float, float, float, float] = (0.78, 0.74, 0.66, 1.0),
    tile_color_2: Tuple[float, float, float, float] = (0.74, 0.70, 0.62, 1.0),
    mortar_color: Tuple[float, float, float, float] = (0.35, 0.35, 0.35, 1.0),
    scale: float = 1.25, # ~80x80cm por placa
    roughness_base: float = 0.25,
) -> bpy.types.Material:
    """
    Cria material procedural de porcelanato/piso com placas e rejunte (Brick Texture).
    Inclui mapa de rugosidade com leve ruído para reflexos naturais.
    """
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    nt, bsdf, output = _setup_material_base(mat)

    # Coordenadas de textura
    tex_coord = nt.nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    # Brick Texture para paginação do piso
    brick = nt.nodes.new(type='ShaderNodeTexBrick')
    brick.location = (-550, 150)
    brick.inputs['Color1'].default_value = tile_color_1
    brick.inputs['Color2'].default_value = tile_color_2
    brick.inputs['Mortar'].default_value = mortar_color
    brick.inputs['Scale'].default_value = scale
    brick.inputs['Mortar Size'].default_value = 0.006
    brick.inputs['Mortar Smooth'].default_value = 0.2
    brick.inputs['Bias'].default_value = 0.0
    brick.inputs['Brick Width'].default_value = 0.5
    brick.inputs['Row Height'].default_value = 0.5

    nt.links.new(tex_coord.outputs['Object'], brick.inputs['Vector'])
    nt.links.new(brick.outputs['Color'], bsdf.inputs['Base Color'])

    # Noise Texture para imperfeições de rugosidade / reflexo
    noise = nt.nodes.new(type='ShaderNodeTexNoise')
    noise.location = (-550, -200)
    noise.inputs['Scale'].default_value = 15.0
    noise.inputs['Detail'].default_value = 3.0

    color_ramp = nt.nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (-300, -200)
    color_ramp.color_ramp.elements[0].position = 0.2
    color_ramp.color_ramp.elements[0].color = (roughness_base, roughness_base, roughness_base, 1.0)
    color_ramp.color_ramp.elements[1].position = 0.8
    color_ramp.color_ramp.elements[1].color = (roughness_base + 0.15, roughness_base + 0.15, roughness_base + 0.15, 1.0)

    nt.links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
    nt.links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])
    nt.links.new(color_ramp.outputs['Color'], bsdf.inputs['Roughness'])

    # Bump leve no rejunte
    bump = nt.nodes.new(type='ShaderNodeBump')
    bump.location = (-250, 200)
    bump.inputs['Strength'].default_value = 0.15
    bump.inputs['Distance'].default_value = 0.05
    nt.links.new(brick.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    _set_bsdf_input(bsdf, ('Specular IOR Level', 'Specular'), 0.6)
    log_material_created(name)
    return mat


def create_procedural_wood_material(
    name: str,
    color_dark: Tuple[float, float, float, float] = (0.28, 0.14, 0.05, 1.0),
    color_light: Tuple[float, float, float, float] = (0.52, 0.30, 0.12, 1.0),
    scale: float = 4.0,
    roughness: float = 0.45,
) -> bpy.types.Material:
    """
    Cria material procedural de madeira com veios orgânicos (Wave + Noise Texture).
    """
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    nt, bsdf, output = _setup_material_base(mat)

    tex_coord = nt.nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    # Wave texture para anéis e fibras da madeira
    wave = nt.nodes.new(type='ShaderNodeTexWave')
    wave.location = (-550, 0)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.inputs['Scale'].default_value = scale
    wave.inputs['Distortion'].default_value = 6.0
    wave.inputs['Detail'].default_value = 4.0
    wave.inputs['Detail Scale'].default_value = 1.5

    color_ramp = nt.nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (-300, 0)
    color_ramp.color_ramp.elements[0].color = color_dark
    color_ramp.color_ramp.elements[0].position = 0.0
    color_ramp.color_ramp.elements[1].color = color_light
    color_ramp.color_ramp.elements[1].position = 1.0

    nt.links.new(tex_coord.outputs['Object'], wave.inputs['Vector'])
    nt.links.new(wave.outputs['Color'], color_ramp.inputs['Fac'])
    nt.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])

    # Bump suave nas fibras
    bump = nt.nodes.new(type='ShaderNodeBump')
    bump.location = (-150, -200)
    bump.inputs['Strength'].default_value = 0.08
    nt.links.new(wave.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    bsdf.inputs['Roughness'].default_value = roughness
    _set_bsdf_input(bsdf, ('Specular IOR Level', 'Specular'), 0.3)
    log_material_created(name)
    return mat


def create_principled_material(
    name: str,
    color: Tuple[float, float, float, float] = (0.8, 0.8, 0.8, 1.0),
    roughness: float = 0.5,
    metallic: float = 0.0,
    specular: float = 0.5,
    transmission: float = 0.0,
    ior: float = 1.45,
    emission: Optional[Tuple[float, float, float]] = None,
    emission_strength: float = 1.0,
    alpha: float = 1.0,
) -> bpy.types.Material:
    """Cria material Principled BSDF genérico."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    nt, bsdf, output = _setup_material_base(mat)

    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    _set_bsdf_input(bsdf, ('Specular IOR Level', 'Specular'), specular)
    _set_bsdf_input(bsdf, ('Transmission Weight', 'Transmission'), transmission)

    if 'IOR' in bsdf.inputs:
        bsdf.inputs['IOR'].default_value = ior
    if 'Alpha' in bsdf.inputs:
        bsdf.inputs['Alpha'].default_value = alpha

    if emission:
        _set_bsdf_input(bsdf, ('Emission Color', 'Emission'), (*emission, 1.0))
    if transmission > 0.01 or alpha < 0.99:
        try:
            mat.blend_method = 'BLEND'
        except Exception:
            pass
        try:
            if hasattr(mat, 'shadow_method'):
                mat.shadow_method = 'NONE'
        except Exception:
            pass
        try:
            mat.use_backface_culling = False
        except Exception:
            pass
        try:
            if hasattr(mat, 'use_screen_refraction'):
                mat.use_screen_refraction = True
        except Exception:
            pass

    log_material_created(name)
    return mat



# =============================================================================
# CRIAÇÃO CENTRALIZADA
# =============================================================================

def create_all_materials(config: dict) -> dict:
    """Cria todos os materiais da cena com shaders procedurais de alta qualidade."""
    log_section("Criando materiais e shaders procedurais")

    registry = {}

    # 1. Pisos procedurais com paginação e rejunte
    registry[MatNames.PISO_SHOPPING] = create_tile_floor_material(
        name=MatNames.PISO_SHOPPING,
        tile_color_1=(0.78, 0.74, 0.66, 1.0),
        tile_color_2=(0.72, 0.68, 0.60, 1.0),
        mortar_color=(0.32, 0.32, 0.32, 1.0),
        scale=1.2, # Placas grandes de porcelanato
        roughness_base=0.22,
    )

    registry[MatNames.PISO_MEZANINO] = create_tile_floor_material(
        name=MatNames.PISO_MEZANINO,
        tile_color_1=(0.82, 0.78, 0.70, 1.0),
        tile_color_2=(0.76, 0.72, 0.64, 1.0),
        mortar_color=(0.30, 0.30, 0.30, 1.0),
        scale=1.2,
        roughness_base=0.20,
    )

    registry[MatNames.PISO_PRACA] = create_tile_floor_material(
        name=MatNames.PISO_PRACA,
        tile_color_1=(0.65, 0.36, 0.20, 1.0),
        tile_color_2=(0.58, 0.30, 0.15, 1.0),
        mortar_color=(0.25, 0.22, 0.20, 1.0),
        scale=2.0, # Ladrilhos menores
        roughness_base=0.55,
    )

    registry[MatNames.PISO_LOJA] = create_tile_floor_material(
        name=MatNames.PISO_LOJA,
        tile_color_1=(0.42, 0.42, 0.44, 1.0),
        tile_color_2=(0.38, 0.38, 0.40, 1.0),
        mortar_color=(0.20, 0.20, 0.20, 1.0),
        scale=1.5,
        roughness_base=0.35,
    )

    # 2. Madeiras procedurais
    registry[MatNames.BANCO_MADEIRA] = create_procedural_wood_material(
        name=MatNames.BANCO_MADEIRA,
        color_dark=(0.32, 0.18, 0.08, 1.0),
        color_light=(0.58, 0.36, 0.18, 1.0),
        scale=6.0,
        roughness=0.4,
    )

    registry[MatNames.MADEIRA] = create_procedural_wood_material(
        name=MatNames.MADEIRA,
        color_dark=(0.22, 0.12, 0.04, 1.0),
        color_light=(0.45, 0.26, 0.10, 1.0),
        scale=5.0,
        roughness=0.5,
    )

    # 3. Materiais estruturais e acabamentos
    materials_config = config.get("materials", {})
    for name, props in materials_config.items():
        if name in registry:
            continue
        mat = create_principled_material(
            name=name,
            color=props.get("color", (0.8, 0.8, 0.8, 1.0)),
            roughness=props.get("roughness", 0.5),
            metallic=props.get("metallic", 0.0),
            specular=props.get("specular", 0.5),
            transmission=props.get("transmission", 0.0),
            ior=props.get("ior", 1.45),
            emission=props.get("emission", None),
            emission_strength=props.get("emission_strength", 1.0),
            alpha=props.get("alpha", 1.0),
        )
        registry[name] = mat

    log_section_end(f"Materiais ({len(registry)} criados)")
    return registry


class MatNames:
    PISO_SHOPPING   = "MAT_Piso_Shopping"
    PISO_LOJA       = "MAT_Piso_Loja"
    PISO_PRACA      = "MAT_Piso_Praca"
    PISO_MEZANINO   = "MAT_Piso_Mezanino"
    PAREDE          = "MAT_Parede"
    TETO            = "MAT_Teto"
    VIDRO           = "MAT_Vidro"
    METAL           = "MAT_Metal"
    MADEIRA         = "MAT_Madeira"
    BANCO_MADEIRA   = "MAT_Banco_Madeira"
    PLANTA          = "MAT_Planta"
    VASO            = "MAT_Vaso"
    LIXEIRA         = "MAT_Lixeira"
    LETREIRO        = "MAT_Letreiro"
    PORTA           = "MAT_Porta"
    FACHADA_LOJA    = "MAT_Fachada_Loja"
    PENDENTE        = "MAT_Pendente"
    LED             = "MAT_LED"
    ESCADA_ROLANTE  = "MAT_Escada_Rolante"
    ELEVADOR_VIDRO  = "MAT_Elevador_Vidro"
    LAJE_MEZANINO   = "MAT_Laje_Mezanino"
    QUARTZO         = "MAT_Quartzo"
    MARMORE         = "MAT_Marmore"
    ALUMINIO        = "MAT_Aluminio_Escovado"
    VIDRO_ESCURO    = "MAT_Vidro_Escurecido"
    ACOLCHOADO      = "MAT_Acolchoado"
    LOUCA           = "MAT_Louca"
