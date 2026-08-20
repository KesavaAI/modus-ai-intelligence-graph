from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SkillImpact(BaseModel):
    id: str = Field(..., description="Unique skill identifier (e.g. skill-invoice-matching)")
    name: str = Field(..., description="Name of the skill")
    category: str = Field(default="Operational", description="Category: Technical, Domain, Cognitive, Operational, Leadership")
    urgency_to_reskill: str = Field(default="Medium", description="Reskilling urgency: Low, Medium, High, Critical")
    reskill_time_weeks: int = Field(default=4, description="Estimated time to reskill in weeks")
    description: Optional[str] = Field(default="", description="Detailed description of the skill")
    evolution_path: Optional[str] = Field(default=None, description="Future AI-augmented skill transition path")


class RoleImpact(BaseModel):
    id: str = Field(..., description="Unique role identifier (e.g. role-ap-clerk)")
    name: str = Field(..., description="Name of the role")
    department: str = Field(..., description="Department or business unit (e.g. Finance, HR, IT)")
    headcount: int = Field(default=10, description="Estimated organizational headcount")
    avg_salary: float = Field(default=65000.0, description="Annual average salary per employee (USD)")
    transition_risk: str = Field(default="Medium", description="Workforce transition risk: Low, Medium, High, Critical")
    description: Optional[str] = Field(default="", description="Role summary and primary responsibilities")


class ActivityImpact(BaseModel):
    id: str = Field(..., description="Unique activity identifier (e.g. act-ocr-scan)")
    name: str = Field(..., description="Descriptive name of the activity")
    step_number: int = Field(default=1, description="Sequential position in the process workflow")
    automation_feasibility: float = Field(default=0.7, description="Automation feasibility score from 0.0 to 1.0")
    ai_disruption_potential: str = Field(default="High", description="AI disruption severity: Low, Medium, High, Critical")
    description: str = Field(default="", description="Activity narrative and failure points")
    executing_roles: List[str] = Field(default_factory=list, description="IDs or names of executing roles")
    required_skills: List[str] = Field(default_factory=list, description="IDs or names of required skills")
    ai_tools_recommended: List[str] = Field(default_factory=list, description="AI agent tools or solutions applicable")


class ProcessExtraction(BaseModel):
    id: str = Field(..., description="Unique process ID (e.g. proc-ap-invoice-matching)")
    name: str = Field(..., description="Official title of the business process")
    domain: str = Field(..., description="Enterprise domain (Finance, Supply Chain, HR, IT, Legal, etc.)")
    description: str = Field(..., description="Detailed description of the end-to-end workflow")
    cycle_time_days: float = Field(default=3.5, description="Average process cycle time in days")
    frequency: str = Field(default="Daily", description="Execution frequency: Real-time, Daily, Weekly, Monthly, Quarterly")
    overall_automation_potential: float = Field(default=0.75, description="Composite automation potential from 0.0 to 1.0")
    activities: List[ActivityImpact] = Field(default_factory=list)
    roles: List[RoleImpact] = Field(default_factory=list)
    skills: List[SkillImpact] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)


class ProcessIngestRequest(BaseModel):
    process_description: str = Field(..., min_length=15, description="Unstructured or structured text describing the business process")
    process_name: Optional[str] = Field(default=None, description="Optional custom process name")
    domain: Optional[str] = Field(default=None, description="Optional business domain")


class CascadeQuery(BaseModel):
    target_type: str = Field(..., description="Entity type: Process, Activity, Role, or Skill")
    target_id: str = Field(..., description="Identifier of the target entity")


class ImpactedRole(BaseModel):
    role_id: str
    role_name: str
    department: str
    headcount: int
    avg_salary: float
    automation_exposure_pct: float
    transition_risk: str
    financial_exposure: float
    impacted_activities: List[str] = Field(default_factory=list)


class ImpactedSkill(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    urgency_to_reskill: str
    reskill_time_weeks: int
    evolution_path: Optional[str] = None
    affected_roles: List[str] = Field(default_factory=list)


class MultiHopPathway(BaseModel):
    process: str
    activity: str
    role: str
    skill: str
    automation_feasibility: float
    urgency: str


class CascadeResult(BaseModel):
    target_id: str
    target_name: str
    target_type: str
    composite_disruption_score: float
    avg_automation_feasibility: float
    financial_exposure_total: float
    total_headcount_impacted: int
    impacted_roles: List[ImpactedRole] = Field(default_factory=list)
    impacted_skills: List[ImpactedSkill] = Field(default_factory=list)
    mitigation_strategies: List[str] = Field(default_factory=list)
    multi_hop_pathways: List[MultiHopPathway] = Field(default_factory=list)


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # Process, Activity, Role, Skill
    data: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # CONTAINS_ACTIVITY, EXECUTES, REQUIRES, IMPACTS, EVOLVES_TO
    label: str
    data: Optional[Dict[str, Any]] = None


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any] = Field(default_factory=dict)
