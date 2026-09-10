"""
main.py — Orquestrador principal do Mini Shopping no Blender

Instruções de execução no Blender:
  1. Abra o Blender (versão 3.6 LTS, 4.x ou superior).
  2. Mude para a aba "Scripting" no topo.
  3. Clique em "Open" e selecione este arquivo `main.py`.
  4. Clique no botão "Run Script" (ou aperte Alt+P).
  5. Abra Window > Toggle System Console para acompanhar os logs detalhados.
"""

import sys
import os
import time
import importlib

# =============================================================================
# CONFIGURAÇÃO DE IMPORTS (Garante compatibilidade com Blender Text Editor)
# =============================================================================

import bpy

def _resolve_script_directory() -> str:
    """Detecta confiavelmente o diretório onde os scripts estão localizados."""
    candidates = []

    # 1. Se __file__ estiver definido com caminho real existente
    if "__file__" in globals() and __file__:
        f_dir = os.path.dirname(os.path.abspath(__file__))
        if os.path.exists(os.path.join(f_dir, "config.py")):
            return f_dir

    # 2. Text Editor ativo no Blender
    try:
        space = getattr(bpy.context, "space_data", None)
        if space and hasattr(space, "text") and space.text and space.text.filepath:
            p = os.path.dirname(bpy.path.abspath(space.text.filepath))
            if os.path.exists(os.path.join(p, "config.py")):
                return p
    except Exception:
        pass

    # 3. Textos abertos no Blender
    for t in bpy.data.texts:
        if t.filepath:
            try:
                p = os.path.dirname(bpy.path.abspath(t.filepath))
                if os.path.exists(os.path.join(p, "config.py")):
                    return p
            except Exception:
                continue

    # 4. Fallback para caminhos prováveis no workspace
    workspace_fallbacks = [
        r"c:\Users\Dev_2o_Ano\Documents\2°Semestre\Shopping Mini\mini_shopping",
        os.path.join(os.getcwd(), "mini_shopping"),
        os.getcwd(),
    ]
    for p in workspace_fallbacks:
        if os.path.exists(os.path.join(p, "config.py")):
            return p

    return None

script_dir = _resolve_script_directory()

if script_dir:
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)
else:
    print("[SHOPPING] ⚠ AVISO: Não foi possível detectar o diretório de scripts automaticamente.")


# =============================================================================
# CARREGAMENTO E RECARREGAMENTO DOS MÓDULOS (Hot Reload)
# =============================================================================

import config
import utils.logging as logging_module
import utils.geometry as geometry
import utils.helpers as helpers
import scene_setup
import materials
import architecture.floor as floor_module
import architecture.walls as walls_module
import architecture.ceiling as ceiling_module
import architecture.entrance as entrance_module
import architecture.stairs as stairs_module
import stores.storefront as storefront_module
import stores.doors as doors_module
import stores.store_builder as store_builder_module
import stores.signs as signs_module
import areas.food_court as food_court_module
import areas.restrooms as restrooms_module
import furniture.benches as benches_module
import furniture.bins as bins_module
import furniture.planters as planters_module
import lighting.general as lighting_gen_module
import lighting.store_lights as store_lights_module
import cameras.views as cameras_module
import cameras.render_batch as render_batch_module
import ui_panel

# Forçar recarregamento em execuções sucessivas
for mod in [
    config, logging_module, geometry, helpers, scene_setup, materials,
    floor_module, walls_module, ceiling_module, entrance_module, stairs_module,
    storefront_module, doors_module, store_builder_module, signs_module,
    food_court_module, restrooms_module, benches_module, bins_module,
    planters_module, lighting_gen_module, store_lights_module, cameras_module,
    render_batch_module, ui_panel,
]:
    importlib.reload(mod)

from config import CONFIG, RUN_OPTIONS
from utils.logging import (
    log_info, log_section, log_section_end, log_success,
    log_divider, log_warning, log_error
)


# =============================================================================
# EXECUÇÃO PRINCIPAL
# =============================================================================

def run_project(options: dict = None) -> bool:
    """
    Executa a geração procedural completa ou parcial do Mini Shopping.

    Args:
        options: Dicionário de opções (padrão usa RUN_OPTIONS do config.py).

    Returns:
        True se concluído com sucesso, False se houver erro crítico.
    """
    if options is None:
        options = RUN_OPTIONS

    start_total_time = time.time()

    print("\n" + "=" * 60)
    print("   [SHOPPING] INICIANDO GERAÇÃO PROCEDURAL DO MINI SHOPPING   ")
    print("=" * 60)

    try:
        # 1. Limpeza do Projeto
        if options.get("clear_project_collections", True):
            scene_setup.cleanup_project(confirm=True)

        # 2. Configurações da Cena (Unidades, Engine, World Nishita)
        if options.get("setup_scene", True):
            scene_setup.setup_scene()
            world_cfg = CONFIG.get("lighting", {})
            scene_setup.setup_world(
                world_color=world_cfg.get("world_color", (0.9, 0.9, 1.0)),
                strength=world_cfg.get("world_strength", 0.8),
                use_physical_sky=True,
            )

        # 3. Criação da Hierarquia de Collections
        collections = scene_setup.create_collections()

        # 4. Materiais Procedurais
        if options.get("create_materials", True):
            materials.create_all_materials(CONFIG)

        # 5. Arquitetura (Piso, Paredes, Teto com Claraboia)
        if options.get("create_architecture", True) and CONFIG["features"].get("architecture", True):
            floor_module.build_floors(collections)
            walls_module.build_walls(collections)
            ceiling_module.build_ceiling(collections)

        # 6. Entrada Principal
        if options.get("create_entrance", True) and CONFIG["features"].get("entrance", True):
            entrance_module.build_entrance(collections)

        # 7. Escada Decorativa
        if options.get("create_stairs", True) and CONFIG["features"].get("stairs", True):
            stairs_module.build_stairs(collections)

        # 8. Lojas
        if options.get("create_stores", True) and CONFIG["features"].get("stores", True):
            store_builder_module.build_stores(collections)

        # 9. Áreas Especiais (Praça de Alimentação e Sanitários)
        if options.get("create_areas", True) and CONFIG["features"].get("areas", True):
            food_court_module.build_food_court(collections)
            restrooms_module.build_restrooms(collections)

        # 10. Mobiliário (Bancos, Lixeiras, Vasos com Folhagem)
        if options.get("create_furniture", True) and CONFIG["features"].get("furniture", True):
            benches_module.build_benches(collections)
            bins_module.build_bins(collections)
            planters_module.build_planters(collections)

        # 11. Decoração e Letreiros 3D
        if options.get("create_decoration", True) and CONFIG["features"].get("decoration", True):
            signs_module.build_store_signs(collections)

        # 12. Iluminação
        if options.get("create_lighting", True) and CONFIG["features"].get("lighting", True):
            lighting_gen_module.build_general_lighting(collections)
            store_lights_module.build_store_lighting(collections)

        # 13. Câmeras e Animação de Passeio
        if options.get("create_cameras", True) and CONFIG["features"].get("cameras", True):
            cameras_module.build_cameras(collections)

        # 14. Registrar Painel N-Panel no Viewport do Blender
        try:
            ui_panel.register()
            log_info("Painel 'Mini Shopping' registrado na barra lateral N do 3D Viewport.")
        except Exception:
            pass

        # 15. Alternar 3D Viewport para o Modo Rendered Automaticamente
        try:
            scene_setup.switch_viewport_to_rendered('RENDERED', to_camera=True)
        except Exception:
            pass

        # 16. Renderizar uma imagem de demonstração (PNG) quando executado interativamente
        if not bpy.app.background:
            try:
                cam_obj = bpy.data.objects.get("CAM_Corredor") or bpy.data.objects.get("CAM_Corridor")
                if not cam_obj:
                    for obj in bpy.data.objects:
                        if obj.type == 'CAMERA':
                            cam_obj = obj
                            break

                if cam_obj:
                    bpy.context.scene.camera = cam_obj
                    renders_dir = os.path.join(script_dir or ".", "renders")
                    os.makedirs(renders_dir, exist_ok=True)
                    out_path = os.path.join(renders_dir, "preview_corredor.png")
                    bpy.context.scene.render.filepath = out_path
                    log_info(f"Renderizando imagem de demonstração ({cam_obj.name}) em: {out_path}")
                    bpy.ops.render.render(write_still=True)
                    log_success("Imagem de demonstração renderizada com sucesso: preview_corredor.png")
            except Exception as e:
                log_warning(f"Aviso ao renderizar imagem de demonstração: {e}")
        else:
            log_info("Modo background detectado. A cena 3D e todos os objetos foram montados com sucesso.")



        total_elapsed = time.time() - start_total_time
        print("\n" + "=" * 60)
        log_success(f"PROCESSO CONCLUÍDO COM SUCESSO EM {total_elapsed:.2f}s!")
        print("=" * 60 + "\n")
        return True

    except Exception as e:
        log_error(f"Falha na geração do shopping: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    run_project()


