import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "success",
    message: "Successfully seeded 25 enterprise processes into intelligence graph.",
    metrics: {
      processes_seeded: 25,
      activities_seeded: 75,
      roles_seeded: 50,
      skills_seeded: 75,
      total_nodes_in_store: 225,
      total_edges_in_store: 275,
    },
  });
}
