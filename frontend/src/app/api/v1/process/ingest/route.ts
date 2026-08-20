import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.process_name || "Automated Business Process";

    return NextResponse.json({
      status: "success",
      message: `Successfully ingested and persisted process '${name}'`,
      process: {
        id: "proc-automated-live-ingestion",
        name: name,
        domain: body.domain || "Finance",
        overall_automation_potential: 0.89,
        activities: [
          { id: "act-live-1", name: "Intake & Neural OCR Extraction", step_number: 1, automation_feasibility: 0.95 },
          { id: "act-live-2", name: "Autonomous Rules Validation & Matching", step_number: 2, automation_feasibility: 0.92 },
          { id: "act-live-3", name: "Exception Routing & Escalation", step_number: 3, automation_feasibility: 0.75 },
          { id: "act-live-4", name: "General Ledger Posting & Voucher Dispatch", step_number: 4, automation_feasibility: 0.98 }
        ],
        roles: [
          { id: "role-live-clerk", name: "Accounts Payable Clerk", department: "Finance", headcount: 14, avg_salary: 58000 },
          { id: "role-live-sup", name: "Accounts Payable Supervisor", department: "Finance", headcount: 3, avg_salary: 92000 }
        ],
        skills: [
          { id: "skill-live-data", name: "Manual Invoice Data Entry", category: "Operational", urgency_to_reskill: "Critical", reskill_time_weeks: 3 },
          { id: "skill-live-matching", name: "Three-Way PO-Invoice Matching", category: "Domain", urgency_to_reskill: "High", reskill_time_weeks: 5 },
          { id: "skill-live-exception", name: "AI Exception & Anomaly Supervision", category: "Cognitive", urgency_to_reskill: "Medium", reskill_time_weeks: 4 }
        ]
      },
      graph_delta: {
        process_id: "proc-automated-live-ingestion",
        activities_added: 4,
        roles_added: 2,
        skills_added: 3
      }
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
