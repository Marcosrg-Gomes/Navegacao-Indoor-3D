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
    camera_collection = bpy.data.collections.get("08_CAMERAS")
    cameras_to_render = sorted((
        obj for obj in (camera_collection.all_objects if camera_collection else [])
        if obj.type == 'CAMERA' and obj.name in scene.objects
        and not obj.name.startswith("CAM_Anim")
    ), key=lambda obj: obj.name)
    if not cameras_to_render:
        log_warning("Nenhuma câmera estática do projeto encontrada para renderizar.")
        return []

    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "renders")
    output_dir = bpy.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    render = scene.render
    original_cam = scene.camera
    original_render = {key: getattr(render, key) for key in (
        "resolution_x", "resolution_y", "resolution_percentage", "filepath",
        "use_file_extension",
    )}
    original_image = {key: getattr(render.image_settings, key)
                      for key in ("file_format", "color_mode")}
    original_view = {key: getattr(scene.view_settings, key)
                     for key in ("view_transform", "look", "exposure", "gamma")}
    saved_files = []
    try:
        render.resolution_x = resolution_x
        render.resolution_y = resolution_y
        render.resolution_percentage = 100
        render.use_file_extension = True
        render.image_settings.file_format = 'PNG'
        render.image_settings.color_mode = 'RGBA'
        setup_color_management()
        for cam in cameras_to_render:
            scene.camera = cam
            filename = f"{cam.name.lower()}.png"
            filepath = os.path.join(output_dir, filename)
            render.filepath = filepath
            log_info(f"Renderizando vista: {cam.name} -> {filename}")
            bpy.ops.render.render(write_still=True)
            saved_files.append(filepath)
    finally:
        scene.camera = original_cam
        for key, value in original_render.items():
            setattr(render, key, value)
        for key, value in original_image.items():
            setattr(render.image_settings, key, value)
        for key, value in original_view.items():
            setattr(scene.view_settings, key, value)

    log_section_end(f"Render em Lote ({len(saved_files)} imagens salvas em {output_dir})")
    return saved_files
