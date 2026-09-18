"""
main.py — Orquestrador principal do Mini Shopping no Blender (Dois Pavimentos)

Instruções de execução no Blender:
  1. Abra o Blender (versão 3.6 LTS, 4.x, 5.x ou superior).
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
    if "__file__" in globals() and __file__:
        f_dir = os.path.dirname(os.path.abspath(__file__))
        if os.path.exists(os.path.join(f_dir, "config.py")):
            return f_dir

    try:
        space = getattr(bpy.context, "space_data", None)
        if space and hasattr(space, "text") and space.text and space.text.filepath:
            p = os.path.dirname(bpy.path.abspath(space.text.filepath))
            if os.path.exists(os.path.join(p, "config.py")):
                return p
    except Exception:
        pass

    for t in bpy.data.texts:
        if t.filepath:
            try:
                p = os.path.dirname(bpy.path.abspath(t.filepath))
                if os.path.exists(os.path.join(p, "config.py")):
                    return p
            except Exception:
                continue

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
import architecture.guardrails as guardrails_module
import architecture.vertical_circulation as vertical_circ_module
import stores.storefront as storefront_module
import stores.doors as doors_module
import stores.store_builder as store_builder_module
import stores.signs as signs_module
import stores.interior_builder as interior_builder_module
import areas.food_court as food_court_module
import areas.restrooms as restrooms_module
import furniture.benches as benches_module
import furniture.bins as bins_module
import furniture.planters as planters_module
import furniture.kiosks as kiosks_module
import furniture.totems as totems_module
import lighting.general as lighting_gen_module
import lighting.store_lights as store_lights_module
import cameras.views as cameras_module
import cameras.render_batch as render_batch_module
import ui_panel

for mod in [
    config, logging_module, geometry, helpers, scene_setup, materials,
    floor_module, walls_module, ceiling_module, entrance_module, stairs_module,
    guardrails_module, vertical_circ_module, storefront_module, doors_module,
    store_builder_module, signs_module, interior_builder_module, food_court_module,
    restrooms_module, benches_module, bins_module, planters_module, kiosks_module,
    totems_module, lighting_gen_module, store_lights_module, cameras_module,
    render_batch_module, ui_panel,
]:
    importlib.reload(mod)

from config import CONFIG, RUN_OPTIONS
from utils.logging import (
    log_info, log_section, log_section_end, log_success,
    log_warning, log_error
)


# =============================================================================
# EXECUÇÃO PRINCIPAL
# =============================================================================

def run_project(options: dict = None) -> bool:
    """
    Executa a geração procedural completa do Mini Shopping de Dois Pavimentos.
    """
    if options is None:
        options = RUN_OPTIONS

    start_total_time = time.time()

    print("\n" + "=" * 65)
    print("   [SHOPPING] GERAÇÃO PROCEDURAL DO MINI SHOPPING (2 ANDARES)   ")
    print("=" * 65)

    try:
        # Preservar a referência importada pelos construtores ao atualizar o layout.
        derived = config.get_derived(CONFIG)
        config.DERIVED.clear()
        config.DERIVED.update(derived)

        # 1. Limpeza do Projeto
        if options.get("clear_project_collections", True):
            scene_setup.cleanup_project(confirm=True)

        # 2. Configurações da Cena (Unidades, Eevee, World Nishita)
        if options.get("setup_scene", True):
            scene_setup.setup_scene()
            world_cfg = CONFIG.get("lighting", {})
            scene_setup.setup_world(
                world_color=world_cfg.get("world_color", (0.85, 0.90, 0.98)),
                strength=world_cfg.get("world_strength", 0.8),
                use_physical_sky=True,
            )

        # 3. Criação da Hierarquia de Collections
        collections = scene_setup.create_collections()

        # 4. Materiais Procedurais
        if options.get("create_materials", True):
            materials.create_all_materials(CONFIG)

        # 5. Arquitetura (Piso, Lajes Mezanino, Paredes, Teto Claraboia)
        if options.get("create_architecture", True) and CONFIG["features"].get("architecture", True):
            floor_module.build_floors(collections)
            walls_module.build_walls(collections)
            ceiling_module.build_ceiling(collections)

        # 6. Guarda-corpos Panorâmicos de Vidro do Mezanino
        if options.get("create_guardrails", True) and CONFIG["features"].get("guardrails", True):
            guardrails_module.build_guardrails(collections)

        # 7. Circulação Vertical (Escadas Rolantes e Elevador Panorâmico)
        if options.get("create_vertical_circulation", True) and CONFIG["features"].get("vertical_circulation", True):
            vertical_circ_module.build_vertical_circulation(collections)

        # 8. Entrada Principal
        if options.get("create_entrance", True) and CONFIG["features"].get("entrance", True):
            entrance_module.build_entrance(collections)

        # 9. Escada Monumental Funcional
        if options.get("create_stairs", True) and CONFIG["features"].get("stairs", True):
            stairs_module.build_stairs(collections)

        # 10. Lojas Abertas (22 lojas: 12 no térreo + 10 no mezanino)
        if options.get("create_stores", True) and CONFIG["features"].get("stores", True):
            store_builder_module.build_stores(collections)

        # 11. Áreas Especiais (Praça de Alimentação no Mezanino + 4 Sanitários)
        if options.get("create_areas", True) and CONFIG["features"].get("areas", True):
            food_court_module.build_food_court(collections)
            restrooms_module.build_restrooms(collections)

        # 12. Mobiliário do Corredor (Bancos, Lixeiras, Vasos e Jardineiras Suspensas)
        if options.get("create_furniture", True) and CONFIG["features"].get("furniture", True):
            benches_module.build_benches(collections)
            bins_module.build_bins(collections)
            planters_module.build_planters(collections)

        # 13. Quiosques Ilha no Corredor Térreo
        if options.get("create_kiosks", True) and CONFIG["features"].get("kiosks", True):
            kiosks_module.build_kiosks(collections)

        # 14. Totens Digitais Interativos / Mapa do Shopping
        totems_module.build_totems(collections)

        # 15. Decoração e Letreiros 3D Volumétricos (22 Lojas Reais)
        if options.get("create_decoration", True) and CONFIG["features"].get("decoration", True):
            signs_module.build_store_signs(collections)

        # 16. Mobiliário e Ambientação Interna Temática das 22 Lojas Abertas
        interior_builder_module.build_store_interiors(collections)

        # 17. Iluminação Geral, Pendentes do Átrio, Fitas LED, Spots em Trilho e Luzes de Lojas
        if options.get("create_lighting", True) and CONFIG["features"].get("lighting", True):
            lighting_gen_module.build_general_lighting(collections)
            store_lights_module.build_store_lighting(collections)

        # 18. Câmeras e Animação de Passeio nos 2 Andares (350 Frames)
        if options.get("create_cameras", True) and CONFIG["features"].get("cameras", True):
            cameras_module.build_cameras(collections)

        # 19. Registrar Painel N-Panel no Viewport
        try:
            ui_panel.register()
            log_info("Painel 'Mini Shopping' registrado na barra lateral N do 3D Viewport.")
        except Exception:
            pass

        # 20. Alternar 3D Viewport para o Modo Rendered
        try:
            scene_setup.switch_viewport_to_rendered('RENDERED', to_camera=True)
        except Exception:
            pass

        # 21. Renderizar preview interativo se não estiver em background
        if not bpy.app.background:
            try:
                cam_obj = bpy.data.objects.get("CAM_Mezanino") or bpy.data.objects.get("CAM_Corredor")
                if not cam_obj:
                    for obj in bpy.data.objects:
                        if obj.type == 'CAMERA':
                            cam_obj = obj
                            break

                if cam_obj:
                    bpy.context.scene.camera = cam_obj
                    renders_dir = os.path.join(script_dir or ".", "renders")
                    os.makedirs(renders_dir, exist_ok=True)
                    out_path = os.path.join(renders_dir, "preview_mezanino.png")
                    bpy.context.scene.render.filepath = out_path
                    log_info(f"Renderizando preview ({cam_obj.name}) em: {out_path}")
                    bpy.ops.render.render(write_still=True)
                    log_success("Preview renderizado com sucesso: preview_mezanino.png")
            except Exception as e:
                log_warning(f"Aviso ao renderizar preview: {e}")
        else:
            log_info("Modo background detectado. Estrutura completa de 2 andares gerada com sucesso.")

        total_elapsed = time.time() - start_total_time
        print("\n" + "=" * 65)
        log_success(f"PROCESSO CONCLUÍDO COM SUCESSO EM {total_elapsed:.2f}s!")
        print("=" * 65 + "\n")
        return True

    except Exception as e:
        log_error(f"Falha na geração do shopping de 2 andares: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    run_project()
