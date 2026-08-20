import logging
import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.neo4j_client import graph_client
from app.api.routes import router as api_router
from app.models.schemas import ProcessExtraction

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Neo4j & Auto-seed default enterprise dataset
    logger.info("Initializing Enterprise AI Intelligence Graph Backend...")
    graph_client.connect()

    # Auto-seed if graph is currently empty
    if len(graph_client.node_store) == 0:
        seed_paths = [
            settings.SEED_DATA_PATH,
            "seed_data.json",
            "backend/seed_data.json",
            os.path.join(os.path.dirname(__file__), "../seed_data.json")
        ]
        for p in seed_paths:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        seed_data = json.load(f)
                    for item in seed_data:
                        proc = ProcessExtraction(**item)
                        graph_client.persist_process(proc)
                    logger.info("Auto-seeded %d enterprise processes into intelligence graph.", len(seed_data))
                    break
                except Exception as e:
                    logger.warning("Auto-seed error from path %s: %s", p, e)

    yield

    # Shutdown: Close DB connections
    logger.info("Shutting down Intelligence Graph Backend...")
    graph_client.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Intelligence Graph: Process × Role × Skill Ontology with Cascading Impact Analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "health": f"{settings.API_V1_STR}/health",
            "graph_all": f"{settings.API_V1_STR}/graph/all",
            "process_ingest": f"{settings.API_V1_STR}/process/ingest",
            "cascade_impact": f"{settings.API_V1_STR}/intelligence/cascade",
            "seed": f"{settings.API_V1_STR}/seed"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
