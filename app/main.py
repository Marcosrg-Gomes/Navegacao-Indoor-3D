from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
from app.routers import public, admin
from app.static_spa import SPAStaticFiles
from app.migrations import upgrade_schema

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida da aplicação FastAPI.
    """
    # Cria todas as tabelas na inicialização
    Base.metadata.create_all(bind=engine)
    upgrade_schema(engine)
    yield

app = FastAPI(
    title=settings.APP_TITLE,
    description="Sistema de navegação indoor para shopping centers",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Adicionando CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # The clients authenticate administrative calls with an X-API-Key header,
    # not browser cookies.  Credentials therefore are unnecessary and cannot
    # be combined safely with a wildcard origin in browsers.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluindo os routers
app.include_router(public.router, prefix="/api", tags=["public"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Montagem de arquivos estáticos (plantas baixas e painel admin)
import os
from fastapi.staticfiles import StaticFiles

static_dir = os.path.join(os.path.dirname(__file__), "static")
plantas_dir = os.path.join(static_dir, "plantas")
admin_dist = os.path.join(static_dir, "admin")

os.makedirs(plantas_dir, exist_ok=True)
os.makedirs(admin_dist, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/admin", SPAStaticFiles(directory=admin_dist, html=True), name="admin")

@app.get("/health")
def health_check():
    """
    Root endpoint para checagem de saúde da API.
    """
    return {"status": "ok", "versao": settings.APP_VERSION}


visitor_dist = os.path.join(static_dir, "visitor")
if os.path.isfile(os.path.join(visitor_dist, "index.html")):
    app.mount("/", SPAStaticFiles(directory=visitor_dist, html=True), name="visitor")
else:
    app.add_api_route("/", health_check, methods=["GET"])

