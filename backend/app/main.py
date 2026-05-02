from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1 import auth, data_sources, qa, knowledge_graph, reports, intelligence


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.rag.embeddings import embedding_service
    embedding_service.load_model()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Multi-tenant AI-powered platform that transforms internal and external data into actionable enterprise intelligence",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(data_sources.router, prefix=api_prefix)
app.include_router(qa.router, prefix=api_prefix)
app.include_router(knowledge_graph.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(intelligence.router, prefix=api_prefix)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "env": settings.APP_ENV}
