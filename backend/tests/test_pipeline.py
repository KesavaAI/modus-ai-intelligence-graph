import json
import os
import pytest
from app.models.schemas import (
    ProcessExtraction,
    ActivityImpact,
    RoleImpact,
    SkillImpact,
    CascadeQuery,
)
from app.core.neo4j_client import graph_client
from app.workflows.extraction_pipeline import run_extraction_pipeline


def test_schema_models():
    """Verify Pydantic schema validation for entities."""
    skill = SkillImpact(
        id="skill-test-ocr",
        name="Test OCR Processing",
        category="Technical",
        urgency_to_reskill="High",
        reskill_time_weeks=4
    )
    assert skill.id == "skill-test-ocr"
    assert skill.reskill_time_weeks == 4

    role = RoleImpact(
        id="role-test-specialist",
        name="Operations Specialist",
        department="Finance",
        headcount=10,
        avg_salary=60000.0,
        transition_risk="High"
    )
    assert role.headcount == 10

    activity = ActivityImpact(
        id="act-test-step-1",
        name="Capture Invoices",
        step_number=1,
        automation_feasibility=0.92,
        ai_disruption_potential="Critical",
        description="Extracting invoice fields",
        executing_roles=[role.id],
        required_skills=[skill.id]
    )
    assert activity.automation_feasibility == 0.92

    process = ProcessExtraction(
        id="proc-test-workflow",
        name="Test Workflow",
        domain="Finance",
        description="Automated testing workflow",
        cycle_time_days=2.0,
        frequency="Daily",
        overall_automation_potential=0.85,
        activities=[activity],
        roles=[role],
        skills=[skill]
    )
    assert len(process.activities) == 1
    assert len(process.roles) == 1
    assert len(process.skills) == 1


def test_extraction_pipeline_deterministic():
    """Verify unstructured extraction and persistence into graph client."""
    raw_text = """
    # Automated Employee Expense Auditing
    Employee submits travel and meals receipt images through mobile app.
    Vision AI extracts merchant, date, amount, and line item tax.
    System checks company travel policy guidelines and flags non-compliant receipts.
    Finance manager reviews exceptions and approves direct deposit reimbursement.
    """
    
    result = run_extraction_pipeline(raw_text, process_name="Automated Employee Expense Auditing", domain="Finance")
    assert result["error"] is None
    proc = result["process_data"]
    assert proc is not None
    assert "Expense" in proc.name or "Expense" in proc.id or len(proc.activities) > 0
    assert len(proc.activities) >= 1
    assert len(proc.roles) >= 1
    assert len(proc.skills) >= 1

    # Verify node store persistence
    assert proc.id in graph_client.node_store
    assert len(graph_client.node_store) >= 3


def test_surprise_record_ingestion():
    """Test dynamic ingestion of the specific Modus Challenge Surprise Record."""
    surprise_text = "Automated Invoice Matching & Exception Handling in Accounts Payable"
    result = run_extraction_pipeline(surprise_text, process_name=surprise_text, domain="Finance")
    assert result["error"] is None
    proc = result["process_data"]
    assert proc is not None
    
    # Check that AP specific roles and skills were dynamically structured
    role_ids = [r.id for r in proc.roles]
    skill_ids = [s.id for s in proc.skills]
    assert any("ap" in r_id or "clerk" in r_id for r_id in role_ids)
    assert any("invoice" in s_id or "matching" in s_id for s_id in skill_ids)
    assert len(proc.activities) >= 3


def test_cascading_impact_calculation():
    """Test multi-hop cascading traversal algorithm."""
    # Run cascade on the accounts payable invoice process
    graph_res = graph_client.get_all_graph()
    assert len(graph_res.nodes) > 0

    # Pick a process node
    proc_node = next((n for n in graph_res.nodes if n.type == "Process"), None)
    assert proc_node is not None

    cascade = graph_client.calculate_cascading_impact("Process", proc_node.id)
    assert cascade.target_id == proc_node.id
    assert cascade.composite_disruption_score > 0
    assert len(cascade.mitigation_strategies) > 0


def test_seed_data_integrity():
    """Verify all 25 enterprise processes in seed_data.json."""
    seed_file = "backend/seed_data.json"
    if not os.path.exists(seed_file):
        seed_file = "seed_data.json"

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) == 25
    for item in data:
        model = ProcessExtraction(**item)
        assert model.id.startswith("proc-")
        assert len(model.activities) >= 3
        assert len(model.roles) >= 2
        assert len(model.skills) >= 3
