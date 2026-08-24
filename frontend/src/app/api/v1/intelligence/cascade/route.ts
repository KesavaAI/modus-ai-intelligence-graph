import { NextResponse } from "next/server";
import graphData from "@/data/graph_db.json";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { target_id, target_type } = body;

    const node = graphData.nodes.find((n) => n.id === target_id);
    const domain = node?.data?.domain || node?.data?.department || "Finance";

    // Filter related roles in domain
    const relatedRoles = graphData.nodes.filter(
      (n) =>
        n.type === "Role" &&
        ((n.data?.department || n.data?.domain || "").toLowerCase().includes(domain.toLowerCase()) ||
          target_type === "Role")
    );

    const relatedSkills = graphData.nodes.filter(
      (n) =>
        n.type === "Skill" &&
        ((n.data?.department || n.data?.domain || "").toLowerCase().includes(domain.toLowerCase()) ||
          target_type === "Skill")
    );

    const totalHeadcount = relatedRoles.reduce(
      (acc, r) => acc + (Number(r.data?.headcount) || 4),
      0
    );

    const totalFinancialExposure = relatedRoles.reduce((acc, r) => {
      const hc = Number(r.data?.headcount) || 4;
      const salary = Number(r.data?.avg_salary) || 68000;
      const feas = Number(r.data?.automation_feasibility) || 0.82;
      return acc + hc * salary * feas;
    }, 0);

    const avgDisruption = Math.round(
      (node?.data?.overall_automation_potential ||
        node?.data?.automation_feasibility ||
        0.833) * 1000
    ) / 10;

    return NextResponse.json({
      target_id: target_id,
      target_type: target_type || "Process",
      composite_disruption_score: avgDisruption,
      financial_exposure_total: totalFinancialExposure,
      impacted_roles_count: relatedRoles.length,
      impacted_skills_count: relatedSkills.length,
      impacted_roles: relatedRoles.map((r) => ({
        id: r.id,
        name: r.data?.name || r.label,
        department: r.data?.department || domain,
        headcount: Number(r.data?.headcount) || 4,
        avg_salary: Number(r.data?.avg_salary) || 65000,
        automation_feasibility: Number(r.data?.automation_feasibility) || 0.82,
        financial_exposure: Math.round(
          (Number(r.data?.headcount) || 4) *
            (Number(r.data?.avg_salary) || 65000) *
            (Number(r.data?.automation_feasibility) || 0.82)
        ),
        transition_risk: r.data?.transition_risk || "High Risk",
      })),
      impacted_skills: relatedSkills.map((s) => ({
        id: s.id,
        name: s.data?.name || s.label,
        category: s.data?.category || "Execution",
        urgency_to_reskill: s.data?.urgency_to_reskill || "High",
        reskill_time_weeks: Number(s.data?.reskill_time_weeks) || 3,
        evolution_path: s.data?.evolution_path || "AI Oversight & Exception Management",
      })),
      reskilling_pathways: [
        {
          role_name: "Operations Specialist",
          current_skill: "Manual Data Entry & Document Routing",
          future_skill: "AI Exception Management & Schema Validation",
          estimated_timeline_weeks: 3,
          retention_probability_pct: 100,
        },
        {
          role_name: "Workflow Lead",
          current_skill: "Routine Queue Oversight",
          future_skill: "Agentic Systems & Human-in-the-Loop Governance",
          estimated_timeline_weeks: 4,
          retention_probability_pct: 100,
        },
      ],
      ai_recommendation:
        "Zero-layoff strategy: Transition routine workforce into AI Orchestrators & Exception Managers over 3.4 weeks.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
