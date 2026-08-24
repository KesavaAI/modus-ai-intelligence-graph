"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
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
  TrendingUp,
  Activity,
  BarChart3,
  Network,
} from "lucide-react";
import defaultGraphData from "@/data/graph_db.json";
import { SurpriseRecordModal } from "@/components/SurpriseRecordModal";
import { CascadeImpactDrawer } from "@/components/CascadeImpactDrawer";
import { BiAnalyticsDashboard } from "@/components/BiAnalyticsDashboard";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas").then((mod) => ({ default: mod.GraphCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090d16] text-slate-400 text-xs gap-2 rounded-2xl border border-slate-800">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing Interactive Graph Canvas...</span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"graph" | "bi">("graph");
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; stats: any }>(defaultGraphData);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("Finance");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [health, setHealth] = useState<any>({ neo4j_connected: true, groq_configured: true });

  const API_BASE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : "";

  // Fetch Entire Graph
  const fetchGraph = async () => {
    if (!API_BASE) {
      setGraphData(defaultGraphData);
      setHealth({ neo4j_connected: true, groq_configured: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/graph/all`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
      const healthRes = await fetch(`${API_BASE}/api/v1/health`);
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      }
    } catch (e) {
      console.warn("Using built-in intelligence graph data");
      setGraphData(defaultGraphData);
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
    if (!API_BASE) {
      setTimeout(() => {
        setGraphData(defaultGraphData);
        setIsSeeding(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/seed`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchGraph();
      }
    } catch (e) {
      setGraphData(defaultGraphData);
    } finally {
      setIsSeeding(false);
    }
  };

  // Node selection for cascading impact analysis
  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
  };

  // Structured Workflow Tree Cluster Layout Engine
  const { flowNodes, flowEdges } = useMemo(() => {
    const rawNodes = graphData.nodes || [];
    const rawEdges = graphData.edges || [];

    // Filter by search, domain, and type with robust domain matching
    const filteredNodes = rawNodes.filter((n) => {
      const label = (n.label || "").toLowerCase();
      const type = (n.type || "").toLowerCase();
      const nodeDomain = (n.data?.domain || n.data?.department || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !query || label.includes(query) || nodeDomain.includes(query);
      
      const domainFilter = selectedDomain.toLowerCase();
      const matchesDomain =
        selectedDomain === "All" ||
        nodeDomain.includes(domainFilter) ||
        (domainFilter.includes("customer") && nodeDomain.includes("customer")) ||
        (domainFilter.includes("finance") && nodeDomain.includes("finance")) ||
        (domainFilter.includes("hr") && (nodeDomain.includes("human") || nodeDomain.includes("hr"))) ||
        (domainFilter.includes("it") && (nodeDomain.includes("information") || nodeDomain.includes("it"))) ||
        (domainFilter.includes("supply") && nodeDomain.includes("supply")) ||
        (domainFilter.includes("legal") && nodeDomain.includes("legal"));
      
      const matchesType =
        selectedType === "All" || type === selectedType.toLowerCase();

      return matchesSearch && matchesDomain && matchesType;
    });

    const activeNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Position Nodes into Clean Vertical Workflow Tree Columns
    const procNodes = filteredNodes.filter((n) => (n.type || "").toLowerCase() === "process");
    const actNodes = filteredNodes.filter((n) => (n.type || "").toLowerCase() === "activity");
    const roleNodes = filteredNodes.filter((n) => (n.type || "").toLowerCase() === "role");
    const skillNodes = filteredNodes.filter((n) => (n.type || "").toLowerCase() === "skill");

    const positionedNodes = filteredNodes.map((node) => {
      const nodeType = (node.type || "").toLowerCase();
      const nodeDomain = (node.data?.domain || node.data?.department || "Finance").toLowerCase();
      
      let x = 80;
      let y = 80;

      if (selectedType !== "All") {
        // When filtered to a single type (e.g. "Processes Only", "Roles Only"):
        // Lay out in a clean 2D Grid ($3 \times N$)
        const typeNodes = filteredNodes.filter(n => (n.type || "").toLowerCase() === selectedType.toLowerCase());
        const idx = typeNodes.findIndex(n => n.id === node.id);
        const safeIdx = idx >= 0 ? idx : 0;
        x = 80 + (safeIdx % 4) * 340;
        y = 80 + Math.floor(safeIdx / 4) * 220;
      } else {
        // Complete 4-Tier Tree Layout:
        // Group by Process / Domain Columns with Vertical Tier Progression
        if (nodeType === "process") {
          const idx = procNodes.findIndex(n => n.id === node.id);
          const safeIdx = idx >= 0 ? idx : 0;
          x = 80 + safeIdx * 460;
          y = 60;
        } else if (nodeType === "activity") {
          // Find parent process
          const parentProcId = node.data?.process_id;
          let procIdx = procNodes.findIndex(p => p.id === parentProcId);
          if (procIdx === -1) {
            const idx = actNodes.findIndex(n => n.id === node.id);
            procIdx = Math.floor(idx / 3);
          }
          const stepNum = Number(node.data?.step_number) || 1;
          x = 80 + procIdx * 460;
          y = 240 + (stepNum - 1) * 160;
        } else if (nodeType === "role") {
          const idx = roleNodes.findIndex(n => n.id === node.id);
          const safeIdx = idx >= 0 ? idx : 0;
          const colIdx = Math.floor(safeIdx / 2);
          const rowSub = safeIdx % 2;
          x = 80 + colIdx * 460;
          y = 740 + rowSub * 140;
        } else if (nodeType === "skill") {
          const idx = skillNodes.findIndex(n => n.id === node.id);
          const safeIdx = idx >= 0 ? idx : 0;
          const colIdx = Math.floor(safeIdx / 3);
          const rowSub = safeIdx % 3;
          x = 80 + colIdx * 460;
          y = 1040 + rowSub * 140;
        }
      }

      return {
        id: node.id,
        type: node.type,
        position: { x, y },
        data: { ...node.data, label: node.label },
        selected: node.id === selectedNodeId,
      };
    });

    // Filter edges
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
          opacity: 0.85,
        },
      }));

    return { flowNodes: positionedNodes, flowEdges: filteredEdges };
  }, [graphData, searchTerm, selectedDomain, selectedType, selectedNodeId]);

  const stats = graphData.stats || {};

  return (
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 overflow-hidden">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="min-h-16 py-2.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 md:px-6 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
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

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "graph"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Graph Canvas View
          </button>
          <button
            onClick={() => setActiveTab("bi")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "bi"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            BI &amp; Tableau Analytics
          </button>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Engine:
            </span>
            <span className="text-emerald-400 font-semibold">Active Matrix</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400">LangGraph Ready</span>
          </div>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Seed</span> 25 Processes
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 md:px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ingest Surprise Record
          </button>
        </div>
      </header>

      {/* ================= KPI METRICS RIBBON ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 p-3 md:p-4 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-500/20 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Processes Mapped
            </div>
            <div className="text-xl font-black text-blue-400">
              {stats.processes_count || 25}
            </div>
          </div>
          <Layers className="w-6 h-6 text-blue-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/20 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Activities Mapped
            </div>
            <div className="text-xl font-black text-purple-400">
              {stats.activities_count || 75}
            </div>
          </div>
          <Zap className="w-6 h-6 text-purple-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Monitored Roles
            </div>
            <div className="text-xl font-black text-amber-400">
              {stats.roles_count || 50}
            </div>
          </div>
          <Users className="w-6 h-6 text-amber-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Skills At Risk
            </div>
            <div className="text-xl font-black text-emerald-400">
              {stats.skills_count || 75}
            </div>
          </div>
          <Award className="w-6 h-6 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/20 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Avg AI Feasibility
            </div>
            <div className="text-xl font-black text-rose-400">
              {stats.avg_automation_feasibility ?? 78.5}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-rose-500/40" />
        </div>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      {activeTab === "graph" ? (
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
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Finance">Finance</option>
                <option value="Customer Support">Customer Support</option>
                <option value="HR">Human Resources</option>
                <option value="IT">Information Technology</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Legal">Legal &amp; Compliance</option>
                <option value="All">All Domains (Wide View)</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
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
      ) : (
        /* BI & TABLEAU ANALYTICS VIEW */
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
          <BiAnalyticsDashboard
            graphData={graphData}
            onSelectNode={handleNodeClick}
          />
        </div>
      )}

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
