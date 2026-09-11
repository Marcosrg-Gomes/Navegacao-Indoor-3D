"""
cameras/views.py — Criação, posicionamento e animação de câmeras nos 2 pavimentos

Gera:
  - Câmera da Entrada (CAM_Entrada)
  - Câmera do Corredor Térreo (CAM_Corredor)
  - Câmera Aérea / Isométrica (CAM_Aerea)
  - Câmera da Praça de Alimentação Superior (CAM_Praca)
  - Câmera Balcão Mezanino (CAM_Mezanino) — Balcony View
  - Câmera Visão de Baixo (CAM_Wormseye) — Vão do Átrio e Claraboia
  - Câmera Animada de Passeio (CAM_Anim_Passeio) em 350 frames (Térreo -> Escada Rolante -> Mezanino)
"""

import bpy
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
    duration_frames: int = 350,
) -> bpy.types.Object:
    """
    Cria uma câmera animada em 350 frames que realiza um tour imersivo nos dois andares:
    Entrada térreo -> Corredor e quiosques -> Sobe a escada rolante -> Passarela do mezanino com vista do átrio -> Praça superior.
    """
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = duration_frames
    scene.render.fps = 30

    name = "CAM_Anim_Passeio"
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = 26.0
    cam_data.clip_end = 200.0

    cam_obj = bpy.data.objects.new(name=name, object_data=cam_data)
    link_to_collection(cam_obj, collection)

    half_l = DERIVED["half_length"]
    keyframes = [
        # Frame 1: Entrada do shopping (térreo)
        (1, (0.0, -half_l + 2.0, 1.7), (90.0, 0.0, 0.0)),
        # Frame 60: Caminhando no térreo entre os quiosques e vitrines
        (60, (-0.8, -12.0, 1.7), (90.0, 0.0, 20.0)),
        # Frame 110: Chegando no pé da escada rolante no átrio
        (110, (-0.75, -4.5, 1.7), (85.0, 0.0, 0.0)),
        # Frame 170: Subindo a escada rolante, olhando para o átrio e pendentes
        (170, (-0.75, 0.0, 3.8), (65.0, 0.0, 10.0)),
        # Frame 230: Chegando no mezanino (piso superior em Z=4.7m)
        (230, (-1.5, 4.5, 6.4), (90.0, 0.0, -35.0)),
        # Frame 290: Caminhando pela passarela lateral do mezanino contemplando o vão central
        (290, (-3.5, 10.0, 6.4), (85.0, 0.0, -45.0)),
        # Frame 350: Finalizando na Praça de Alimentação no pavimento superior
        (350, (0.0, 20.0, 6.4), (85.0, 0.0, 180.0)),
    ]

    for frame, loc, rot_deg in keyframes:
        scene.frame_set(frame)
        cam_obj.location = loc
        set_object_rotation(cam_obj, *rot_deg, degrees=True)
        cam_obj.keyframe_insert(data_path="location", frame=frame)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Interpolação Bézier suave
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
    log_section("Criando Câmeras e Animação de Passeio (2 Andares)")

    col_cams = collections.get("08_CAMERAS") or collections.get("07_CAMERAS") or collections.get("CAMERAS")
    if not col_cams:
        for k, v in collections.items():
            if "CAM" in k.upper():
                col_cams = v
                break
    if not col_cams:
        raise ValueError("Collection de Câmeras não encontrada.")

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

    # Câmera animada em 350 frames
    anim_cam = create_walkthrough_animation(col_cams, duration_frames=350)
    created_cameras["animated_walkthrough"] = anim_cam

    # Câmera padrão ativa
    if "corredor" in created_cameras:
        bpy.context.scene.camera = created_cameras["corridor"] if "corridor" in created_cameras else created_cameras.get("corredor")
        if bpy.context.scene.camera:
            log_info(f"Câmera ativa: {bpy.context.scene.camera.name}")

    log_section_end(f"Câmeras ({len(created_cameras)} configuradas com animação 2 andares)")
    return created_cameras
