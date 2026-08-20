import logging
from typing import Dict, Any, List, Optional
import networkx as nx
from neo4j import GraphDatabase, Driver
from app.core.config import settings
from app.models.schemas import (
    ProcessExtraction,
    CascadeResult,
    ImpactedRole,
    ImpactedSkill,
    MultiHopPathway,
    GraphResponse,
    GraphNode,
    GraphEdge,
)

logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self):
        self.driver: Optional[Driver] = None
        self.is_connected: bool = False
        
        # Resilient in-memory graph mirror (NetworkX) for offline/embedded fallback
        self.nx_graph = nx.MultiDiGraph()
        self.node_store: Dict[str, Dict[str, Any]] = {}
        self.edge_store: List[Dict[str, Any]] = []

    def connect(self):
        """Establish connection to Neo4j database with instant socket pre-check."""
        import socket
        try:
            # Fast socket probe
            with socket.create_connection(("localhost", 7687), timeout=0.5):
                pass
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            self.driver.verify_connectivity()
            self.is_connected = True
            logger.info("Successfully connected to Neo4j at %s", settings.NEO4J_URI)
            self.init_schema_constraints()
        except Exception as e:
            self.is_connected = False
            logger.info("Neo4j port 7687 offline or not responding. Resilient In-Memory Graph mode ACTIVE.")

    def close(self):
        if self.driver:
            self.driver.close()

    def init_schema_constraints(self):
        """Create uniqueness constraints on entity IDs."""
        if not self.is_connected or not self.driver:
            return

        constraint_queries = [
            "CREATE CONSTRAINT process_id_unique IF NOT EXISTS FOR (p:Process) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT activity_id_unique IF NOT EXISTS FOR (a:Activity) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT role_id_unique IF NOT EXISTS FOR (r:Role) REQUIRE r.id IS UNIQUE",
            "CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
        ]

        with self.driver.session() as session:
            for query in constraint_queries:
                try:
                    session.run(query)
                except Exception as e:
                    logger.debug("Constraint creation notice: %s", e)

    def persist_process(self, process_data: ProcessExtraction) -> Dict[str, Any]:
        """Persist a ProcessExtraction model with its Activities, Roles, Skills, and Edges."""
        # 1. Update In-Memory Graph Mirror
        self._persist_to_in_memory(process_data)

        # 2. Update Neo4j if live connection is active
        if self.is_connected and self.driver:
            try:
                self._persist_to_neo4j_db(process_data)
            except Exception as e:
                logger.error("Failed to write to Neo4j DB: %s. In-memory mirror remains intact.", e)

        return {
            "status": "success",
            "process_id": process_data.id,
            "activities_count": len(process_data.activities),
            "roles_count": len(process_data.roles),
            "skills_count": len(process_data.skills)
        }

    def _persist_to_in_memory(self, p: ProcessExtraction):
        # Add Process Node
        self.node_store[p.id] = {
            "id": p.id,
            "label": p.name,
            "type": "Process",
            "data": {
                "name": p.name,
                "domain": p.domain,
                "description": p.description,
                "cycle_time_days": p.cycle_time_days,
                "frequency": p.frequency,
                "overall_automation_potential": p.overall_automation_potential,
                "activities_count": len(p.activities),
                "roles_count": len(p.roles),
            }
        }
        self.nx_graph.add_node(p.id, **self.node_store[p.id])

        # Add Activities
        for act in p.activities:
            self.node_store[act.id] = {
                "id": act.id,
                "label": act.name,
                "type": "Activity",
                "data": {
                    "name": act.name,
                    "step_number": act.step_number,
                    "automation_feasibility": act.automation_feasibility,
                    "ai_disruption_potential": act.ai_disruption_potential,
                    "description": act.description,
                    "ai_tools_recommended": act.ai_tools_recommended,
                    "process_id": p.id
                }
            }
            self.nx_graph.add_node(act.id, **self.node_store[act.id])

            # Process -> Activity Edge
            edge_id = f"edge-{p.id}-contains-{act.id}"
            edge_data = {"id": edge_id, "source": p.id, "target": act.id, "type": "CONTAINS_ACTIVITY", "label": "CONTAINS", "data": {"order": act.step_number}}
            self._add_or_update_edge(edge_data)

        # Add Roles
        for role in p.roles:
            self.node_store[role.id] = {
                "id": role.id,
                "label": role.name,
                "type": "Role",
                "data": {
                    "name": role.name,
                    "department": role.department,
                    "headcount": role.headcount,
                    "avg_salary": role.avg_salary,
                    "transition_risk": role.transition_risk,
                    "description": role.description
                }
            }
            self.nx_graph.add_node(role.id, **self.node_store[role.id])

        # Add Skills
        for skill in p.skills:
            self.node_store[skill.id] = {
                "id": skill.id,
                "label": skill.name,
                "type": "Skill",
                "data": {
                    "name": skill.name,
                    "category": skill.category,
                    "urgency_to_reskill": skill.urgency_to_reskill,
                    "reskill_time_weeks": skill.reskill_time_weeks,
                    "description": skill.description,
                    "evolution_path": skill.evolution_path
                }
            }
            self.nx_graph.add_node(skill.id, **self.node_store[skill.id])

        # Add explicit or inferred multi-hop relationships
        for act in p.activities:
            # Roles executing activity
            for role_ref in act.executing_roles:
                role_id = role_ref if role_ref.startswith("role-") else f"role-{role_ref.lower().replace(' ', '-')}"
                if role_id in self.node_store:
                    edge_id = f"edge-{role_id}-executes-{act.id}"
                    edge_data = {"id": edge_id, "source": role_id, "target": act.id, "type": "EXECUTES", "label": "EXECUTES", "data": {"allocation_pct": 0.5}}
                    self._add_or_update_edge(edge_data)

            # Activity requiring skills
            for skill_ref in act.required_skills:
                skill_id = skill_ref if skill_ref.startswith("skill-") else f"skill-{skill_ref.lower().replace(' ', '-')}"
                if skill_id in self.node_store:
                    edge_id = f"edge-{act.id}-requires-{skill_id}"
                    edge_data = {"id": edge_id, "source": act.id, "target": skill_id, "type": "REQUIRES", "label": "REQUIRES", "data": {"proficiency": "Standard"}}
                    self._add_or_update_edge(edge_data)

        # Additional relationships list
        for rel in p.relationships:
            src = rel.get("source")
            tgt = rel.get("target")
            rel_type = rel.get("type", "RELATES_TO")
            if src in self.node_store and tgt in self.node_store:
                edge_id = f"edge-{src}-{rel_type.lower()}-{tgt}"
                edge_data = {"id": edge_id, "source": src, "target": tgt, "type": rel_type, "label": rel_type, "data": rel.get("data", {})}
                self._add_or_update_edge(edge_data)

    def _add_or_update_edge(self, edge_data: Dict[str, Any]):
        for i, existing in enumerate(self.edge_store):
            if existing["source"] == edge_data["source"] and existing["target"] == edge_data["target"] and existing["type"] == edge_data["type"]:
                self.edge_store[i] = edge_data
                return
        self.edge_store.append(edge_data)
        self.nx_graph.add_edge(edge_data["source"], edge_data["target"], key=edge_data["type"], **edge_data)

    def _persist_to_neo4j_db(self, p: ProcessExtraction):
        """Execute parameterized Cypher MERGE queries against live Neo4j."""
        with self.driver.session() as session:
            # 1. Merge Process
            session.run("""
                MERGE (p:Process {id: $id})
                SET p.name = $name,
                    p.domain = $domain,
                    p.description = $description,
                    p.cycle_time_days = $cycle_time_days,
                    p.frequency = $frequency,
                    p.overall_automation_potential = $overall_automation_potential
            """, id=p.id, name=p.name, domain=p.domain, description=p.description,
               cycle_time_days=p.cycle_time_days, frequency=p.frequency,
               overall_automation_potential=p.overall_automation_potential)

            # 2. Merge Activities & Connect to Process
            for act in p.activities:
                session.run("""
                    MERGE (a:Activity {id: $id})
                    SET a.name = $name,
                        a.step_number = $step_number,
                        a.automation_feasibility = $automation_feasibility,
                        a.ai_disruption_potential = $ai_disruption_potential,
                        a.description = $description,
                        a.ai_tools_recommended = $ai_tools_recommended
                    WITH a
                    MATCH (p:Process {id: $process_id})
                    MERGE (p)-[r:CONTAINS_ACTIVITY {order: $step_number}]->(a)
                """, id=act.id, name=act.name, step_number=act.step_number,
                   automation_feasibility=act.automation_feasibility,
                   ai_disruption_potential=act.ai_disruption_potential,
                   description=act.description,
                   ai_tools_recommended=act.ai_tools_recommended,
                   process_id=p.id)

            # 3. Merge Roles
            for role in p.roles:
                session.run("""
                    MERGE (r:Role {id: $id})
                    SET r.name = $name,
                        r.department = $department,
                        r.headcount = $headcount,
                        r.avg_salary = $avg_salary,
                        r.transition_risk = $transition_risk,
                        r.description = $description
                """, id=role.id, name=role.name, department=role.department,
                   headcount=role.headcount, avg_salary=role.avg_salary,
                   transition_risk=role.transition_risk, description=role.description)

            # 4. Merge Skills
            for skill in p.skills:
                session.run("""
                    MERGE (s:Skill {id: $id})
                    SET s.name = $name,
                        s.category = $category,
                        s.urgency_to_reskill = $urgency_to_reskill,
                        s.reskill_time_weeks = $reskill_time_weeks,
                        s.description = $description,
                        s.evolution_path = $evolution_path
                """, id=skill.id, name=skill.name, category=skill.category,
                   urgency_to_reskill=skill.urgency_to_reskill,
                   reskill_time_weeks=skill.reskill_time_weeks,
                   description=skill.description, evolution_path=skill.evolution_path)

            # 5. Connect Roles -> Activities (EXECUTES) and Activities -> Skills (REQUIRES)
            for act in p.activities:
                for role_ref in act.executing_roles:
                    role_id = role_ref if role_ref.startswith("role-") else f"role-{role_ref.lower().replace(' ', '-')}"
                    session.run("""
                        MATCH (r:Role {id: $role_id}), (a:Activity {id: $activity_id})
                        MERGE (r)-[rel:EXECUTES]->(a)
                    """, role_id=role_id, activity_id=act.id)

                for skill_ref in act.required_skills:
                    skill_id = skill_ref if skill_ref.startswith("skill-") else f"skill-{skill_ref.lower().replace(' ', '-')}"
                    session.run("""
                        MATCH (a:Activity {id: $activity_id}), (s:Skill {id: $skill_id})
                        MERGE (a)-[rel:REQUIRES]->(s)
                    """, activity_id=act.id, skill_id=skill_id)

    def calculate_cascading_impact(self, target_type: str, target_id: str) -> CascadeResult:
        """
        Execute multi-hop traversal to compute cascading impact:
        Process -> Activities -> Roles -> Skills
        """
        # Retrieve target node
        target_node = self.node_store.get(target_id)
        if not target_node:
            # Fallback to search by label/name
            for nid, n in self.node_store.items():
                if n["label"].lower() == target_id.lower() or n["id"].lower() == target_id.lower():
                    target_node = n
                    target_id = nid
                    break

        if not target_node:
            return CascadeResult(
                target_id=target_id,
                target_name=f"Entity {target_id}",
                target_type=target_type,
                composite_disruption_score=0.0,
                avg_automation_feasibility=0.0,
                financial_exposure_total=0.0,
                total_headcount_impacted=0,
                impacted_roles=[],
                impacted_skills=[],
                mitigation_strategies=["Target entity not found in intelligence graph."],
                multi_hop_pathways=[]
            )

        target_name = target_node["label"]
        actual_type = target_node["type"]

        # Determine target activities, processes, roles, skills
        relevant_activities = []
        relevant_processes = []
        relevant_roles = set()
        relevant_skills = set()

        if actual_type == "Process":
            relevant_processes.append(target_node)
            # Find all connected activities
            for edge in self.edge_store:
                if edge["source"] == target_id and edge["type"] == "CONTAINS_ACTIVITY":
                    act_node = self.node_store.get(edge["target"])
                    if act_node:
                        relevant_activities.append(act_node)
        elif actual_type == "Activity":
            relevant_activities.append(target_node)
            # Find parent process
            for edge in self.edge_store:
                if edge["target"] == target_id and edge["type"] == "CONTAINS_ACTIVITY":
                    proc_node = self.node_store.get(edge["source"])
                    if proc_node and proc_node not in relevant_processes:
                        relevant_processes.append(proc_node)
        elif actual_type == "Role":
            relevant_roles.add(target_id)
            # Find activities this role executes
            for edge in self.edge_store:
                if edge["source"] == target_id and edge["type"] == "EXECUTES":
                    act_node = self.node_store.get(edge["target"])
                    if act_node and act_node not in relevant_activities:
                        relevant_activities.append(act_node)
        elif actual_type == "Skill":
            relevant_skills.add(target_id)
            # Find activities requiring this skill
            for edge in self.edge_store:
                if edge["target"] == target_id and edge["type"] == "REQUIRES":
                    act_node = self.node_store.get(edge["source"])
                    if act_node and act_node not in relevant_activities:
                        relevant_activities.append(act_node)

        # Multi-hop traversal: For all relevant activities, find executing roles & required skills
        activity_to_roles: Dict[str, List[str]] = {}
        activity_to_skills: Dict[str, List[str]] = {}

        for act in relevant_activities:
            act_id = act["id"]
            activity_to_roles[act_id] = []
            activity_to_skills[act_id] = []

            for edge in self.edge_store:
                if edge["target"] == act_id and edge["type"] == "EXECUTES":
                    role_id = edge["source"]
                    relevant_roles.add(role_id)
                    activity_to_roles[act_id].append(role_id)
                elif edge["source"] == act_id and edge["type"] == "REQUIRES":
                    skill_id = edge["target"]
                    relevant_skills.add(skill_id)
                    activity_to_skills[act_id].append(skill_id)

        # Build Multi-Hop Pathways
        multi_hop_pathways: List[MultiHopPathway] = []
        for act in relevant_activities:
            act_id = act["id"]
            act_name = act["label"]
            feasibility = act["data"].get("automation_feasibility", 0.7)
            proc_name = relevant_processes[0]["label"] if relevant_processes else "Enterprise Operations"
            
            roles_for_act = activity_to_roles.get(act_id, [])
            skills_for_act = activity_to_skills.get(act_id, [])
            
            if roles_for_act and skills_for_act:
                for r_id in roles_for_act:
                    r_node = self.node_store.get(r_id, {})
                    r_name = r_node.get("label", r_id)
                    for s_id in skills_for_act:
                        s_node = self.node_store.get(s_id, {})
                        s_name = s_node.get("label", s_id)
                        urgency = s_node.get("data", {}).get("urgency_to_reskill", "Medium")
                        multi_hop_pathways.append(MultiHopPathway(
                            process=proc_name,
                            activity=act_name,
                            role=r_name,
                            skill=s_name,
                            automation_feasibility=feasibility,
                            urgency=urgency
                        ))

        # Compute Role Impacts
        impacted_roles: List[ImpactedRole] = []
        total_financial_exposure = 0.0
        total_headcount = 0

        for r_id in relevant_roles:
            r_node = self.node_store.get(r_id)
            if not r_node:
                continue
            r_data = r_node.get("data", {})
            headcount = r_data.get("headcount", 5)
            avg_salary = float(r_data.get("avg_salary", 70000.0))
            
            # Find activities this role executes in the current scope
            r_acts = [act["label"] for act in relevant_activities if r_id in activity_to_roles.get(act["id"], [])]
            if not r_acts and actual_type == "Role":
                r_acts = [act["label"] for act in relevant_activities]

            # Calculate automation exposure percentage
            feasibilities = [act["data"].get("automation_feasibility", 0.6) for act in relevant_activities if r_id in activity_to_roles.get(act["id"], [])]
            avg_feasibility = sum(feasibilities) / len(feasibilities) if feasibilities else 0.65

            financial_exposure = headcount * avg_salary * avg_feasibility
            total_financial_exposure += financial_exposure
            total_headcount += headcount

            transition_risk = "Critical" if avg_feasibility > 0.8 else "High" if avg_feasibility > 0.6 else "Medium"

            impacted_roles.append(ImpactedRole(
                role_id=r_id,
                role_name=r_node["label"],
                department=r_data.get("department", "Operations"),
                headcount=headcount,
                avg_salary=avg_salary,
                automation_exposure_pct=round(avg_feasibility * 100, 1),
                transition_risk=transition_risk,
                financial_exposure=round(financial_exposure, 2),
                impacted_activities=r_acts
            ))

        # Compute Skill Impacts
        impacted_skills: List[ImpactedSkill] = []
        for s_id in relevant_skills:
            s_node = self.node_store.get(s_id)
            if not s_node:
                continue
            s_data = s_node.get("data", {})
            
            # Roles tied to this skill
            tied_roles = set()
            for act in relevant_activities:
                if s_id in activity_to_skills.get(act["id"], []):
                    for r_id in activity_to_roles.get(act["id"], []):
                        rn = self.node_store.get(r_id)
                        if rn:
                            tied_roles.add(rn["label"])

            impacted_skills.append(ImpactedSkill(
                skill_id=s_id,
                skill_name=s_node["label"],
                category=s_data.get("category", "Domain"),
                urgency_to_reskill=s_data.get("urgency_to_reskill", "High"),
                reskill_time_weeks=s_data.get("reskill_time_weeks", 6),
                evolution_path=s_data.get("evolution_path", f"Shift from manual execution to AI Supervisor role"),
                affected_roles=list(tied_roles)
            ))

        # Calculate Composite Disruption Score
        act_feasibilities = [a["data"].get("automation_feasibility", 0.5) for a in relevant_activities]
        avg_act_feasibility = sum(act_feasibilities) / len(act_feasibilities) if act_feasibilities else 0.70
        composite_score = round(avg_act_feasibility * 100, 1)

        # Strategic AI Transformation Mitigation Strategies
        mitigation_strategies = [
            f"Deploy Autonomous AI Agents for high-feasibility activities ({round(avg_act_feasibility*100)}% automation potential).",
            f"Launch targeted {max([s.reskill_time_weeks for s in impacted_skills], default=6)}-week reskilling cohort for {len(impacted_roles)} affected roles.",
            f"Transition repetitive operational roles into AI Exception Handlers & Quality Orchestrators.",
            f"Establish human-in-the-loop validation threshold for critical low-confidence edge cases."
        ]

        return CascadeResult(
            target_id=target_id,
            target_name=target_name,
            target_type=actual_type,
            composite_disruption_score=composite_score,
            avg_automation_feasibility=round(avg_act_feasibility, 2),
            financial_exposure_total=round(total_financial_exposure, 2),
            total_headcount_impacted=total_headcount,
            impacted_roles=impacted_roles,
            impacted_skills=impacted_skills,
            mitigation_strategies=mitigation_strategies,
            multi_hop_pathways=multi_hop_pathways
        )

    def get_all_graph(self) -> GraphResponse:
        """Return the complete graph with visual styling and metadata statistics."""
        nodes: List[GraphNode] = []
        for nid, n in self.node_store.items():
            nodes.append(GraphNode(
                id=n["id"],
                label=n["label"],
                type=n["type"],
                data=n["data"]
            ))

        edges: List[GraphEdge] = []
        for e in self.edge_store:
            edges.append(GraphEdge(
                id=e["id"],
                source=e["source"],
                target=e["target"],
                type=e["type"],
                label=e.get("label", e["type"]),
                data=e.get("data")
            ))

        # Calculate statistics
        proc_count = sum(1 for n in nodes if n.type == "Process")
        act_count = sum(1 for n in nodes if n.type == "Activity")
        role_count = sum(1 for n in nodes if n.type == "Role")
        skill_count = sum(1 for n in nodes if n.type == "Skill")
        
        avg_automation = 0.0
        if act_count > 0:
            avg_automation = sum(n.data.get("automation_feasibility", 0.0) for n in nodes if n.type == "Activity") / act_count

        high_risk_roles = sum(1 for n in nodes if n.type == "Role" and n.data.get("transition_risk") in ["High", "Critical"])

        stats = {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "processes_count": proc_count,
            "activities_count": act_count,
            "roles_count": role_count,
            "skills_count": skill_count,
            "avg_automation_feasibility": round(avg_automation * 100, 1),
            "high_risk_roles_count": high_risk_roles,
            "is_neo4j_connected": self.is_connected
        }

        return GraphResponse(nodes=nodes, edges=edges, stats=stats)


# Global Singleton Client
graph_client = Neo4jClient()
