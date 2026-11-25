"""Servidor MySQL para testes E2E; usa variáveis de ambiente do .env."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega .env explicitamente
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path, override=False)

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8766, http="h11", limit_concurrency=2000, backlog=4096)
