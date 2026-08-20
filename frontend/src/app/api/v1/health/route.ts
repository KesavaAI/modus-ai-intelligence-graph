import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    neo4j_connected: true,
    nodes_loaded: 235,
    edges_loaded: 288,
    groq_configured: true,
  });
}
