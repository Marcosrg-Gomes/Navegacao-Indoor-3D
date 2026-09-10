"""
cameras/render_batch.py — Sistema de Render em Lote Automático

Renderiza as vistas de apresentação em alta qualidade e salva em imagens PNG.
Configura automaticamente Color Management (AgX / Filmic High Contrast).
"""

import bpy
import os
from utils.logging import log_info, log_section, log_section_end, log_success, log_warning


def setup_color_management():
    """Configura o gerenciamento de cores para estética arquitetônica de alto contraste."""
    scene = bpy.context.scene

    # Blender 4.x usa AgX por padrão; versões anteriores usam Filmic
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'High Contrast'
    except Exception:
        try:
            scene.view_settings.view_transform = 'Filmic'
            scene.view_settings.look = 'Medium High Contrast'
        except Exception:
            pass

    scene.view_settings.exposure = 0.2
    scene.view_settings.gamma = 1.0


def render_all_cameras(output_dir: str = None, resolution_x: int = 1920, resolution_y: int = 1080) -> list:
    """
    Itera por todas as câmeras estáticas da cena e renderiza para disco.

    Args:
        output_dir: Diretório de destino (se None, salva na pasta 'renders' do projeto).
        resolution_x: Largura em pixels.
        resolution_y: Altura em pixels.

    Returns:
        Lista de caminhos dos arquivos renderizados.
    """
    log_section("Iniciando Render em Lote das Vistas")

    scene = bpy.context.scene
    scene.render.resolution_x = resolution_x
    scene.render.resolution_y = resolution_y
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    setup_color_management()

    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "renders")

    os.makedirs(output_dir, exist_ok=True)

    # Coletar câmeras estáticas
    cameras_to_render = [
        obj for obj in bpy.data.objects
        if obj.type == 'CAMERA' and not obj.name.startswith("CAM_Anim")
    ]

    if not cameras_to_render:
        log_warning("Nenhuma câmera estática encontrada para renderizar.")
        return []

    saved_files = []
    original_cam = scene.camera

    for cam in cameras_to_render:
        scene.camera = cam
        filename = f"{cam.name.lower()}.png"
        filepath = os.path.join(output_dir, filename)
        scene.render.filepath = filepath

        log_info(f"Renderizando vista: {cam.name} -> {filename}")
        bpy.ops.render.render(write_still=True)
        saved_files.append(filepath)

    scene.camera = original_cam
    log_section_end(f"Render em Lote ({len(saved_files)} imagens salvas em {output_dir})")
    return saved_files
