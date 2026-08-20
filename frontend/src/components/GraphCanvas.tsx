"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Layers,
  Zap,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// Custom Process Node Component
function ProcessNode({ data, selected }: NodeProps) {
  const d = (data || {}) as Record<string, any>;
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 transition-all shadow-xl bg-slate-900/95 backdrop-blur-md min-w-[240px] max-w-[280px] ${
        selected
          ? "border-blue-400 shadow-blue-500/30 ring-2 ring-blue-400/50"
          : "border-blue-500/60 hover:border-blue-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Layers className="w-3 h-3" />
          Process
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {d.domain || "Enterprise"}
        </span>
      </div>
      <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-tight">
        {d.name || d.label}
      </h3>
      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Cycle: {d.cycle_time_days ?? 3.5}d</span>
        <span className="flex items-center gap-1 text-blue-400 font-medium">
          <Sparkles className="w-3 h-3" />
          {Math.round((d.overall_automation_potential ?? 0.8) * 100)}% Auto
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
}

// Custom Activity Node Component
function ActivityNode({ data, selected }: NodeProps) {
  const d = (data || {}) as Record<string, any>;
  const feasibility = d.automation_feasibility ?? 0.75;
  const isHigh = feasibility >= 0.8;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border-2 transition-all shadow-lg bg-slate-900/95 backdrop-blur-md min-w-[220px] max-w-[260px] ${
        selected
          ? "border-purple-400 shadow-purple-500/30 ring-2 ring-purple-400/50"
          : "border-purple-500/60 hover:border-purple-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
          <Zap className="w-3 h-3" />
          Step {d.step_number || 1}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isHigh
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}
        >
          {d.ai_disruption_potential || "High"} Risk
        </span>
      </div>
      <h4 className="font-medium text-xs text-slate-100 line-clamp-2">
        {d.name || d.label}
      </h4>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Feasibility</span>
        <span className="font-semibold text-purple-300">
          {Math.round(feasibility * 100)}%
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
          style={{ width: `${Math.round(feasibility * 100)}%` }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
}

// Custom Role Node Component
function RoleNode({ data, selected }: NodeProps) {
  const d = (data || {}) as Record<string, any>;
  const risk = d.transition_risk || "High";
  const riskColor =
    risk === "Critical"
      ? "text-rose-400 bg-rose-500/20 border-rose-500/30"
      : risk === "High"
      ? "text-amber-400 bg-amber-500/20 border-amber-500/30"
      : "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border-2 transition-all shadow-lg bg-slate-900/95 backdrop-blur-md min-w-[210px] max-w-[250px] ${
        selected
          ? "border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400/50"
          : "border-amber-500/60 hover:border-amber-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Users className="w-3 h-3" />
          Role
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${riskColor}`}
        >
          {risk}
        </span>
      </div>
      <h4 className="font-semibold text-xs text-slate-100 line-clamp-2">
        {d.name || d.label}
      </h4>
      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>HC: {d.headcount || 10}</span>
        <span className="font-mono text-slate-300">
          ${Math.round((d.avg_salary || 65000) / 1000)}k/yr
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
    </div>
  );
}

// Custom Skill Node Component
function SkillNode({ data, selected }: NodeProps) {
  const d = (data || {}) as Record<string, any>;
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border-2 transition-all shadow-lg bg-slate-900/95 backdrop-blur-md min-w-[200px] max-w-[240px] ${
        selected
          ? "border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/50"
          : "border-emerald-500/60 hover:border-emerald-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Award className="w-3 h-3" />
          Skill
        </span>
        <span className="text-[10px] text-slate-400">
          {d.reskill_time_weeks || 4}w reskill
        </span>
      </div>
      <h4 className="font-medium text-xs text-slate-100 line-clamp-2">
        {d.name || d.label}
      </h4>
      {d.evolution_path && (
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-300/80 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
          <TrendingUp className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{d.evolution_path}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
    </div>
  );
}

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string, nodeType: string) => void;
  selectedNodeId?: string | null;
}

export function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: GraphCanvasProps) {
  const nodeTypes = useMemo(
    () => ({
      Process: ProcessNode,
      Activity: ActivityNode,
      Role: RoleNode,
      Skill: SkillNode,
    }),
    []
  );

  return (
    <div className="w-full h-full relative bg-[#090d16] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Interactive Helper Banner */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-lg text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>
          <b>Interactive Graph:</b> Click any card to inspect downstream <b>AI Disruption</b> & <b>Reskilling Roadmaps</b>. Drag canvas to pan, scroll to zoom.
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id, (node.type || "Process"))}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={1.8}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#64748b", strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1e293b"
        />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 !rounded-xl" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            if (n.type === "Process") return "#3B82F6";
            if (n.type === "Activity") return "#8B5CF6";
            if (n.type === "Role") return "#F59E0B";
            return "#10B981";
          }}
          className="!bg-slate-950/80 !border-slate-800 !rounded-xl overflow-hidden"
          maskColor="rgba(9, 13, 22, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
