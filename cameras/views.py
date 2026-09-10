"""
cameras/views.py — Criação, posicionamento e animação de câmeras

Gera:
  - Câmera da Entrada (visão frontal do exterior)
  - Câmera do Corredor (ponto de vista de pedestre no corredor)
  - Câmera Aérea / Isométrica (visão geral 3/4 do shopping)
  - Câmera da Praça de Alimentação
  - Câmera Animada de Passeio (Walkthrough) com keyframes pelo corredor
"""

import bpy
import math
from config import CONFIG, DERIVED
from utils.helpers import link_to_collection, set_object_rotation
from utils.logging import log_object_created, log_section, log_section_end, log_info


def create_camera(
    name: str,
    location: tuple,
    rotation_deg: tuple,
    focal_length: float = 35.0,
    clip_end: float = 200.0,
    collection: bpy.types.Collection = None,
) -> bpy.types.Object:
    """Cria uma câmera e posiciona com rotação em graus."""
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length
    cam_data.clip_end = clip_end

    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    cam_obj.location = location

    set_object_rotation(cam_obj, *rotation_deg, degrees=True)

    if collection:
        link_to_collection(cam_obj, collection)

    log_object_created(name, f"Câmera ({focal_length}mm)")
    return cam_obj


def create_walkthrough_animation(
    collection: bpy.types.Collection,
    duration_frames: int = 250,
) -> bpy.types.Object:
    """
    Cria uma câmera animada que realiza um tour virtual em primeira pessoa
    caminhando pela entrada, percorrendo todo o corredor central observando
    as vitrines e finalizando na praça de alimentação.
    """
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = duration_frames
    scene.render.fps = 30

    name = "CAM_Anim_Passeio"
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = 28.0  # Lente grande-angular suave para passeio imersivo
    cam_data.clip_end = 200.0

    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    link_to_collection(cam_obj, collection)

    # Roteiro de keyframes (frame, (X, Y, Z), (RotX, RotY, RotZ em graus))
    half_l = DERIVED["half_length"]
    keyframes = [
        # Frame 1: Entrada do shopping
        (1, (0.0, -half_l + 2.0, 1.7), (90.0, 0.0, 0.0)),
        # Frame 60: Caminhando no início das lojas, olhando levemente para as lojas da esquerda
        (60, (-0.6, -half_l + 12.0, 1.7), (90.0, 0.0, 15.0)),
        # Frame 120: Meio do corredor, olhando para o centro e bancos
        (120, (0.0, 0.0, 1.7), (90.0, 0.0, 0.0)),
        # Frame 180: Caminhando para o fundo, olhando para as lojas da direita
        (180, (0.6, half_l - 16.0, 1.7), (90.0, 0.0, -15.0)),
        # Frame 250: Chegando na Praça de Alimentação e escada
        (250, (0.0, half_l - 8.0, 1.8), (85.0, 0.0, 0.0)),
    ]

    for frame, loc, rot_deg in keyframes:
        scene.frame_set(frame)
        cam_obj.location = loc
        set_object_rotation(cam_obj, *rot_deg, degrees=True)
        cam_obj.keyframe_insert(data_path="location", frame=frame)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Suavizar curvas de interpolação dos keyframes (Bézier com compatibilidade Blender 3.x, 4.x, 5.x)
    try:
        act = getattr(cam_obj.animation_data, "action", None)
        if act:
            fcurves = getattr(act, "fcurves", None)
            if fcurves is None and hasattr(act, "curves"):
                fcurves = act.curves
            if fcurves:
                for fcurve in fcurves:
                    for kfp in getattr(fcurve, "keyframe_points", []):
                        kfp.interpolation = 'BEZIER'
                        kfp.easing = 'AUTO'
    except Exception:
        pass


    scene.frame_set(1)
    log_object_created(name, f"Câmera Animada ({duration_frames} frames)")
    return cam_obj


def build_cameras(collections: dict) -> dict:
    """Ponto de entrada do módulo de câmeras."""
    log_section("Criando Câmeras e Animação de Passeio")

    col_cams = collections.get("07_CAMERAS")
    if not col_cams:
        raise ValueError("Collection '07_CAMERAS' não encontrada.")

    cam_cfg = CONFIG.get("cameras", {})
    views = cam_cfg.get("views", {})
    default_focal = cam_cfg.get("focal_length", 35.0)
    clip_end = cam_cfg.get("clip_end", 200.0)

    created_cameras = {}

    for view_key, view_data in views.items():
        cam_name = f"CAM_{view_key.capitalize()}"
        loc = view_data.get("location", (0.0, 0.0, 2.0))
        rot = view_data.get("rotation", (90.0, 0.0, 0.0))
        focal = view_data.get("focal_length", default_focal)

        cam_obj = create_camera(
            name=cam_name,
            location=loc,
            rotation_deg=rot,
            focal_length=focal,
            clip_end=clip_end,
            collection=col_cams,
        )
        created_cameras[view_key] = cam_obj

    # Criar câmera de animação de passeio virtual
    anim_cam = create_walkthrough_animation(col_cams, duration_frames=250)
    created_cameras["animated_walkthrough"] = anim_cam

    # Definir câmera ativa padrão
    if "corridor" in created_cameras:
        bpy.context.scene.camera = created_cameras["corridor"]
        log_info(f"Câmera ativa: {created_cameras['corridor'].name}")

    log_section_end(f"Câmeras ({len(created_cameras)} configuradas com animação)")
    return created_cameras
