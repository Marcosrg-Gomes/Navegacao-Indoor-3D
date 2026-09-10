"""
utils/logging.py — Sistema de log com prefixos padronizados

Todas as mensagens de progresso do projeto usam estas funções.
Saída vai para o console do Blender (Window > Toggle System Console).
"""

import time

# Prefixo padrão de todas as mensagens
_PREFIX = "[SHOPPING]"

# Timestamp de início (definido quando a seção começa)
_section_start: float = 0.0


def log_info(message: str) -> None:
    """Mensagem de progresso normal."""
    print(f"{_PREFIX} {message}", flush=True)


def log_warning(message: str) -> None:
    """Aviso não-crítico."""
    print(f"{_PREFIX} ⚠  AVISO: {message}", flush=True)


def log_error(message: str) -> None:
    """Erro crítico."""
    print(f"{_PREFIX} ✗  ERRO: {message}", flush=True)


def log_success(message: str) -> None:
    """Confirmação de sucesso."""
    print(f"{_PREFIX} ✓  {message}", flush=True)


def log_section(title: str) -> None:
    """
    Inicia uma nova seção de execução com separador visual.
    Registra o tempo de início para calcular a duração ao final.
    """
    global _section_start
    _section_start = time.time()
    separator = "─" * 50
    print(f"\n{_PREFIX} {separator}", flush=True)
    print(f"{_PREFIX}  {title.upper()}", flush=True)
    print(f"{_PREFIX} {separator}", flush=True)


def log_section_end(title: str) -> None:
    """Encerra uma seção e exibe o tempo decorrido."""
    elapsed = time.time() - _section_start
    print(f"{_PREFIX} ✓  {title} concluído em {elapsed:.2f}s", flush=True)


def log_divider() -> None:
    """Separador simples."""
    print(f"{_PREFIX} {'·' * 40}", flush=True)


def log_object_created(obj_name: str, obj_type: str = "") -> None:
    """Log padronizado para criação de objeto."""
    type_str = f" [{obj_type}]" if obj_type else ""
    print(f"{_PREFIX}   + Criado{type_str}: {obj_name}", flush=True)


def log_material_created(mat_name: str) -> None:
    """Log padronizado para criação de material."""
    print(f"{_PREFIX}   ~ Material: {mat_name}", flush=True)


def log_collection_created(col_name: str) -> None:
    """Log padronizado para criação de collection."""
    print(f"{_PREFIX}   ◆ Collection: {col_name}", flush=True)

