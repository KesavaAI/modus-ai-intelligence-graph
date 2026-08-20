import json
import logging
import os
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.core.neo4j_client import graph_client
from app.models.schemas import (
    ProcessExtraction,
    ProcessIngestRequest,
    CascadeQuery,
    CascadeResult,
    GraphResponse,
)
from app.workflows.extraction_pipeline import run_extraction_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Enterprise AI Intelligence"])


@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """Health check verifying API operational status and database connection."""
    return {
        "status": "healthy",
        "neo4j_connected": graph_client.is_connected,
        "nodes_loaded": len(graph_client.node_store),
        "edges_loaded": len(graph_client.edge_store),
        "groq_configured": bool(settings.GROQ_API_KEY)
    }


@router.post("/process/ingest", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def ingest_process(request: ProcessIngestRequest):
    """
    Ingest an unstructured or semi-structured business process.
    Executes the two-step LangGraph extraction pipeline and persists multi-hop nodes & edges to Neo4j.
    """
    try:
        pipeline_result = run_extraction_pipeline(
            raw_text=request.process_description,
            process_name=request.process_name,
            domain=request.domain
        )

        if pipeline_result.get("error"):
            raise HTTPException(status_code=500, detail=f"Pipeline extraction error: {pipeline_result['error']}")

        process_data = pipeline_result["process_data"]
        return {
            "status": "success",
            "message": f"Successfully ingested and persisted process '{process_data.name}'",
            "process": process_data.model_dump(),
            "graph_delta": {
                "process_id": process_data.id,
                "activities_added": len(process_data.activities),
                "roles_added": len(process_data.roles),
                "skills_added": len(process_data.skills)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error during process ingestion: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intelligence/cascade", response_model=CascadeResult)
async def query_cascading_impact(query: CascadeQuery):
    """
    Execute multi-hop graph traversal to compute downstream workforce, role, and skill cascading disruption impacts.
    """
    try:
        result = graph_client.calculate_cascading_impact(
            target_type=query.target_type,
            target_id=query.target_id
        )
        return result
    except Exception as e:
        logger.error("Error calculating cascading impact: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph/all", response_model=GraphResponse)
async def get_entire_graph():
    """
    Retrieve the entire Process × Role × Skill Intelligence Graph with visual attributes and metadata stats.
    """
    try:
        return graph_client.get_all_graph()
    except Exception as e:
        logger.error("Error retrieving graph: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed", response_model=Dict[str, Any])
async def seed_enterprise_graph():
    """
    Seed the graph with the 25 rich enterprise processes from seed_data.json.
    """
    seed_path = settings.SEED_DATA_PATH
    if not os.path.exists(seed_path):
        # Fallback path if run from backend folder
        if os.path.exists("seed_data.json"):
            seed_path = "seed_data.json"
        elif os.path.exists("../backend/seed_data.json"):
            seed_path = "../backend/seed_data.json"
        elif os.path.exists(os.path.join(os.path.dirname(__file__), "../../seed_data.json")):
            seed_path = os.path.join(os.path.dirname(__file__), "../../seed_data.json")

    if not os.path.exists(seed_path):
        raise HTTPException(status_code=404, detail=f"Seed data file not found at '{seed_path}'")

    try:
        with open(seed_path, "r", encoding="utf-8") as f:
            raw_seed = json.load(f)

        seeded_count = 0
        total_acts = 0
        total_roles = 0
        total_skills = 0

        for item in raw_seed:
            proc_model = ProcessExtraction(**item)
            res = graph_client.persist_process(proc_model)
            seeded_count += 1
            total_acts += res["activities_count"]
            total_roles += res["roles_count"]
            total_skills += res["skills_count"]

        return {
            "status": "success",
            "message": f"Successfully seeded {seeded_count} enterprise processes into intelligence graph.",
            "metrics": {
                "processes_seeded": seeded_count,
                "activities_seeded": total_acts,
                "roles_seeded": total_roles,
                "skills_seeded": total_skills,
                "total_nodes_in_store": len(graph_client.node_store),
                "total_edges_in_store": len(graph_client.edge_store)
            }
        }
    except Exception as e:
        logger.error("Error during graph seeding: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
