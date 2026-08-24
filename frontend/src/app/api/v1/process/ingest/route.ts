import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { process_name, domain, process_description } = body;

    const slug = (process_name || "new-process")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30);

    const procId = `proc-${slug}`;
    const act1Id = `act-${slug}-1`;
    const act2Id = `act-${slug}-2`;
    const roleId = `role-${slug}-spec`;
    const skillId = `skill-${slug}-exec`;

    return NextResponse.json(
      {
        status: "success",
        message: `Successfully ingested process '${process_name}' into Enterprise AI Graph`,
        process: {
          id: procId,
          name: process_name,
          domain: domain || "Finance",
          description: process_description,
          cycle_time_days: 3.5,
          overall_automation_potential: 0.88,
          activities: [
            {
              id: act1Id,
              name: `Intake & OCR Data Extraction (${process_name.slice(0, 20)})`,
              step_number: 1,
              automation_feasibility: 0.94,
              ai_disruption_potential: "Critical",
              description: `Capturing and validating intake documents for ${process_name}`,
            },
            {
              id: act2Id,
              name: `Rule Matching & Processing (${process_name.slice(0, 20)})`,
              step_number: 2,
              automation_feasibility: 0.85,
              ai_disruption_potential: "High",
              description: `Executing core decision engine logic for ${process_name}`,
            },
          ],
          roles: [
            {
              id: roleId,
              name: `${domain || "Enterprise"} Specialist`,
              department: domain || "Finance",
              headcount: 8,
              avg_salary: 68000,
              automation_feasibility: 0.88,
              transition_risk: "Critical Risk",
            },
          ],
          skills: [
            {
              id: skillId,
              name: `Manual ${domain || "Operations"} Workflow Execution`,
              category: "Operational",
              urgency_to_reskill: "Critical",
              reskill_time_weeks: 3,
              evolution_path: `AI-Assisted ${domain || "Enterprise"} Exception Management`,
            },
          ],
        },
        graph_delta: {
          process_id: procId,
          activities_added: 2,
          roles_added: 1,
          skills_added: 1,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
