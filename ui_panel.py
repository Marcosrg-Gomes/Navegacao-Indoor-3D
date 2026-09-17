"""
ui_panel.py — Painel de Interface Interativa no 3D Viewport (N-Panel)

Adiciona uma aba "Mini Shopping" na barra lateral (tecla N) do 3D Viewport
com controles interativos para gerar, limpar, animar, renderizar e customizar o projeto.
"""

import bpy
import os
from config import CONFIG, RUN_OPTIONS


# =============================================================================
# PROPRIEDADES DA CENA
# =============================================================================

class MiniShoppingProperties(bpy.types.PropertyGroup):
    shopping_width: bpy.props.FloatProperty(
        name="Largura (m)",
        description="Largura total do shopping (eixo X)",
        default=30.0,
        min=15.0,
        max=80.0,
    )
    shopping_length: bpy.props.FloatProperty(
        name="Comprimento (m)",
        description="Comprimento total do shopping (eixo Y)",
        default=60.0,
        min=30.0,
        max=150.0,
    )
    store_count: bpy.props.IntProperty(
        name="Lojas por Lado",
        description="Quantidade de lojas em cada lado do corredor",
        default=6,
        min=2,
        max=15,
    )
    include_furniture: bpy.props.BoolProperty(
        name="Incluir Mobiliário",
        description="Gera bancos, lixeiras e vasos no corredor",
        default=True,
    )
    include_signs: bpy.props.BoolProperty(
        name="Letreiros 3D",
        description="Gera marcas e letreiros 3D volumétricos",
        default=True,
    )


# =============================================================================
# OPERADORES
# =============================================================================

class SHOPPING_OT_build_all(bpy.types.Operator):
    """Gera ou reconstrói o Mini Shopping com os parâmetros atuais"""
    bl_idname = "shopping.build_all"
    bl_label = "Reconstruir Shopping"
    bl_icon = "MOD_BUILD"

    def execute(self, context):
        # O primeiro import pode recarregar config; aplique os valores depois dele.
        from main import run_project
        from config import CONFIG

        props = context.scene.mini_shopping_props

        # Atualizar CONFIG
        CONFIG["shopping"]["width"] = props.shopping_width
        CONFIG["shopping"]["length"] = props.shopping_length
        CONFIG["stores"]["count_per_side"] = props.store_count
        CONFIG["features"]["furniture"] = props.include_furniture
        CONFIG["features"]["decoration"] = props.include_signs

        success = run_project()

        if success:
            self.report({'INFO'}, "Mini Shopping gerado com sucesso!")
        else:
            self.report({'ERROR'}, "Ocorreu um erro durante a geração.")
        return {'FINISHED'} if success else {'CANCELLED'}


class SHOPPING_OT_cleanup(bpy.types.Operator):
    """Limpa todos os objetos e collections do projeto na cena"""
    bl_idname = "shopping.cleanup"
    bl_label = "Limpar Cena do Projeto"
    bl_icon = "TRASH"

    def execute(self, context):
        import scene_setup
        removed = scene_setup.cleanup_project(confirm=True)
        self.report({'INFO'}, f"{removed} objetos do projeto removidos.")
        return {'FINISHED'}


class SHOPPING_OT_play_walkthrough(bpy.types.Operator):
    """Define a câmera de passeio e inicia a animação no viewport"""
    bl_idname = "shopping.play_walkthrough"
    bl_label = "Iniciar Tour Virtual"
    bl_icon = "PLAY"

    def execute(self, context):
        cam = bpy.data.objects.get("CAM_Anim_Passeio")
        if cam:
            context.scene.camera = cam
            context.scene.frame_set(1)
            bpy.ops.screen.animation_play()
            self.report({'INFO'}, "Passeio virtual iniciado!")
        else:
            self.report({'WARNING'}, "Câmera animada não encontrada. Gere a cena primeiro.")
        return {'FINISHED'}


class SHOPPING_OT_render_batch(bpy.types.Operator):
    """Renderiza todas as vistas de apresentação em alta qualidade"""
    bl_idname = "shopping.render_batch"
    bl_label = "Renderizar Todas as Vistas (PNG)"
    bl_icon = "RENDER_STILL"

    def execute(self, context):
        from cameras.render_batch import render_all_cameras
        renders = render_all_cameras()
        self.report({'INFO'}, f"{len(renders)} imagens renderizadas e salvas na pasta 'renders'!")
        return {'FINISHED'}


# =============================================================================
# PAINEL NA BARRA LATERAL (N-PANEL)
# =============================================================================

class VIEW3D_PT_mini_shopping(bpy.types.Panel):
    """Painel de Controle do Mini Shopping no 3D Viewport"""
    bl_label = "Mini Shopping Procedural"
    bl_idname = "VIEW3D_PT_mini_shopping"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Mini Shopping"

    def draw(self, context):
        layout = self.layout
        props = context.scene.mini_shopping_props

        # Seção de Ações Principais
        box_main = layout.box()
        box_main.label(text="Geração & Controle", icon='SCENE_DATA')
        box_main.operator("shopping.build_all", icon='MOD_BUILD')
        box_main.operator("shopping.cleanup", icon='TRASH')

        # Seção de Parâmetros Arquitetônicos
        box_params = layout.box()
        box_params.label(text="Dimensões do Shopping", icon='PROPERTIES')
        box_params.prop(props, "shopping_width")
        box_params.prop(props, "shopping_length")
        box_params.prop(props, "store_count")

        # Opções de Mobiliário e Decoração
        box_opt = layout.box()
        box_opt.label(text="Elementos Opcionais", icon='OBJECT_DATAMODE')
        box_opt.prop(props, "include_furniture")
        box_opt.prop(props, "include_signs")

        # Seção de Apresentação e Render
        box_pres = layout.box()
        box_pres.label(text="Apresentação", icon='CAMERA_DATA')
        box_pres.operator("shopping.play_walkthrough", icon='PLAY')
        box_pres.operator("shopping.render_batch", icon='RENDER_STILL')


# =============================================================================
# REGISTRO
# =============================================================================

classes = (
    MiniShoppingProperties,
    SHOPPING_OT_build_all,
    SHOPPING_OT_cleanup,
    SHOPPING_OT_play_walkthrough,
    SHOPPING_OT_render_batch,
    VIEW3D_PT_mini_shopping,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.mini_shopping_props = bpy.props.PointerProperty(type=MiniShoppingProperties)


def unregister():
    if hasattr(bpy.types.Scene, "mini_shopping_props"):
        del bpy.types.Scene.mini_shopping_props
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
