"""
stores/doors.py — Portas das lojas (Conceito Loja Aberta)

Com o conceito de lojas abertas (Open Storefronts), o vão de entrada é livre,
dispensando portas fechadas no horário de funcionamento.
"""

import bpy

def create_store_door(
    store_name: str,
    center_x: float,
    center_y: float,
    collection: bpy.types.Collection,
    base_z: float = 0.0,
):
    """Retorna None já que o conceito atual adota lojas 100% abertas."""
    return None
