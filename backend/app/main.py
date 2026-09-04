from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
from app.routers import public, admin

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida da aplicação FastAPI.
    """
    # Cria todas as tabelas na inicialização
    Base.metadata.create_all(bind=engine)
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluindo os routers
app.include_router(public.router, prefix="/api", tags=["public"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def health_check():
    """
    Root endpoint para checagem de saúde da API.
    """
    return {"status": "ok", "versao": settings.APP_VERSION}
