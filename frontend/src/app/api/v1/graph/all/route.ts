import { NextResponse } from "next/server";
import graphData from "./graph_db.json";

export async function GET() {
  return NextResponse.json(graphData);
}
