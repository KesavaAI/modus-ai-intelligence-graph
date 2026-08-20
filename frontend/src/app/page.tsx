"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Zap,
  Users,
  Award,
  Sparkles,
  Database,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { SurpriseRecordModal } from "@/components/SurpriseRecordModal";
import { CascadeImpactDrawer } from "@/components/CascadeImpactDrawer";

export default function DashboardPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; stats: any }>({
    nodes: [],
    edges: [],
    stats: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [health, setHealth] = useState<any>({ neo4j_connected: false, groq_configured: false });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch Entire Graph
  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/graph/all`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
      // Check health
      const healthRes = await fetch(`${API_BASE}/api/v1/health`);
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      }
    } catch (e) {
      console.error("Error fetching graph data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Handle Seeding
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/seed`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchGraph();
      }
    } catch (e) {
      console.error("Error seeding graph:", e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Node selection for cascading impact analysis
  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
  };

  // Filter & Layout Nodes for React Flow Canvas
  const { flowNodes, flowEdges } = useMemo(() => {
    const rawNodes = graphData.nodes || [];
    const rawEdges = graphData.edges || [];

    // Filter by search, domain, and type
    const filteredNodes = rawNodes.filter((n) => {
      const label = (n.label || "").toLowerCase();
      const type = n.type || "";
      const domain = (n.data?.domain || n.data?.department || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !query || label.includes(query) || domain.includes(query);
      const matchesDomain =
        selectedDomain === "All" ||
        (n.data?.domain && n.data.domain.toLowerCase() === selectedDomain.toLowerCase()) ||
        (n.data?.department && n.data.department.toLowerCase() === selectedDomain.toLowerCase());
      const matchesType = selectedType === "All" || type === selectedType;

      return matchesSearch && (selectedDomain === "All" || matchesDomain) && matchesType;
    });

    const activeNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Dynamic Hierarchical Multi-Tier Layout Positioning
    const processNodes = filteredNodes.filter((n) => n.type === "Process");
    const activityNodes = filteredNodes.filter((n) => n.type === "Activity");
    const roleNodes = filteredNodes.filter((n) => n.type === "Role");
    const skillNodes = filteredNodes.filter((n) => n.type === "Skill");

    const positionedNodes = filteredNodes.map((node) => {
      let x = 100;
      let y = 100;

      if (node.type === "Process") {
        const idx = processNodes.findIndex((n) => n.id === node.id);
        x = 60 + (idx % 5) * 340;
        y = 60 + Math.floor(idx / 5) * 220;
      } else if (node.type === "Activity") {
        const idx = activityNodes.findIndex((n) => n.id === node.id);
        x = 60 + (idx % 6) * 300;
        y = 340 + Math.floor(idx / 6) * 220;
      } else if (node.type === "Role") {
        const idx = roleNodes.findIndex((n) => n.id === node.id);
        x = 60 + (idx % 5) * 300;
        y = 650 + Math.floor(idx / 5) * 200;
      } else if (node.type === "Skill") {
        const idx = skillNodes.findIndex((n) => n.id === node.id);
        x = 60 + (idx % 5) * 290;
        y = 940 + Math.floor(idx / 5) * 200;
      }

      return {
        id: node.id,
        type: node.type,
        position: { x, y },
        data: { ...node.data, label: node.label },
        selected: node.id === selectedNodeId,
      };
    });

    // Filter edges to only include active visible nodes with vibrant colors
    const filteredEdges = rawEdges
      .filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: true,
        label: e.label,
        style: {
          stroke:
            e.type === "CONTAINS_ACTIVITY"
              ? "#60a5fa"
              : e.type === "EXECUTES"
              ? "#fbbf24"
              : "#34d399",
          strokeWidth: 2,
          opacity: 0.9,
        },
      }));

    return { flowNodes: positionedNodes, flowEdges: filteredEdges };
  }, [graphData, searchTerm, selectedDomain, selectedType, selectedNodeId]);

  const stats = graphData.stats || {};

  return (
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="min-h-16 py-2 border-b border-slate-800 bg-slate-950/80 px-4 md:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Enterprise AI Intelligence Graph
            </h1>
            <p className="text-[10px] md:text-[11px] text-slate-400">
              Modus Stage 2 • Process × Role × Skill Cascading Impact Ontology
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Seed</span> 25 Processes
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 md:px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ingest Surprise Record
          </button>
        </div>
      </header>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 p-3 md:p-4 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-500/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Processes
            </div>
            <div className="text-xl font-black text-blue-400">
              {stats.processes_count || 0}
            </div>
          </div>
          <Layers className="w-6 h-6 text-blue-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Activities Mapped
            </div>
            <div className="text-xl font-black text-purple-400">
              {stats.activities_count || 0}
            </div>
          </div>
          <Zap className="w-6 h-6 text-purple-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Monitored Roles
            </div>
            <div className="text-xl font-black text-amber-400">
              {stats.roles_count || 0}
            </div>
          </div>
          <Users className="w-6 h-6 text-amber-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Skills At Risk
            </div>
            <div className="text-xl font-black text-emerald-400">
              {stats.skills_count || 0}
            </div>
          </div>
          <Award className="w-6 h-6 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/20 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Avg Auto Potential
            </div>
            <div className="text-xl font-black text-rose-400">
              {stats.avg_automation_feasibility ?? 82}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-rose-500/40" />
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col p-4 gap-3 relative overflow-hidden">
        {/* Filters & Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search processes, activities, roles, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Domains</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="Legal">Legal</option>
              <option value="Customer Support">Customer Support</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Entity Types</option>
              <option value="Process">Processes Only</option>
              <option value="Activity">Activities Only</option>
              <option value="Role">Roles Only</option>
              <option value="Skill">Skills Only</option>
            </select>
          </div>

          {/* Color Legend */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Process
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Activity
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Role
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Skill
            </span>
          </div>
        </div>

        {/* Graph Canvas Container */}
        <div className="flex-1 relative">
          <GraphCanvas
            nodes={flowNodes}
            edges={flowEdges}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>

      {/* Ingestion Modal */}
      <SurpriseRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchGraph();
        }}
      />

      {/* Cascading Impact Side Drawer */}
      <CascadeImpactDrawer
        nodeId={selectedNodeId}
        nodeType={selectedNodeType}
        onClose={() => {
          setSelectedNodeId(null);
          setSelectedNodeType(null);
        }}
      />
    </div>
  );
}
