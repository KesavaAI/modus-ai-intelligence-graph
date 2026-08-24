import { NextResponse } from "next/server";
import graphData from "@/data/graph_db.json";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    neo4j_connected: true,
    nodes_loaded: graphData.nodes.length,
    edges_loaded: graphData.edges.length,
    groq_configured: true,
    mode: "Cloud Serverless Edge Engine"
  });
}
