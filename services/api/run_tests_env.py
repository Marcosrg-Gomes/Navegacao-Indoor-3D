#!/usr/bin/env python
"""Script para executar testes com ambiente correto."""
import os
import sys
import tempfile

# Criar diretório temporário dedicado para pytest
pytest_temp = tempfile.mkdtemp(prefix="pytest-navegacao-")
os.environ["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"

# Configurar variáveis de ambiente para testes
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["ADMIN_API_KEY"] = "audit-local-admin-key-with-32-characters"
os.environ["SECRET_KEY"] = "audit-local-only"
os.environ["ADMIN_API_KEYS"] = "{}"
os.environ["DIAGNOSTICS_RATE_LIMIT"] = "600"
os.environ["DIAGNOSTICS_RATE_WINDOW_SECONDS"] = "60"
os.environ["ROUTES_RATE_LIMIT"] = "600"
os.environ["ROUTES_RATE_WINDOW_SECONDS"] = "60"
os.environ["ROUTE_DISTANCES_RATE_LIMIT"] = "600"
os.environ["ROUTE_DISTANCES_RATE_WINDOW_SECONDS"] = "60"
os.environ["DEBUG"] = "True"
os.environ["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"

print(f"Diretório temporário do pytest: {pytest_temp}")
print("Variáveis de ambiente configuradas para teste.")
print("Execute: pytest services/api/tests -v --basetemp=" + pytest_temp)