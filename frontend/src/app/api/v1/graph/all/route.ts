import { NextResponse } from "next/server";
import graphData from "@/data/graph_db.json";

export async function GET() {
  return NextResponse.json(graphData);
}
