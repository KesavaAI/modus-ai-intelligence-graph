"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  Layers,
  ArrowRight,
} from "lucide-react";

interface CascadeImpactDrawerProps {
  nodeId: string | null;
  nodeType: string | null;
  onClose: () => void;
}

export function CascadeImpactDrawer({
  nodeId,
  nodeType,
  onClose,
}: CascadeImpactDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) return;

    async function fetchCascade() {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(
          `${apiBase}/api/v1/intelligence/cascade`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_id: nodeId,
              target_type: nodeType || "Process",
            }),
          }
        );
        if (!res.ok) {
          throw new Error("Failed to compute cascading impact");
        }
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load cascading intelligence");
      } finally {
        setLoading(false);
      }
    }

    fetchCascade();
  }, [nodeId, nodeType]);

  if (!nodeId) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              {nodeType || "Entity"} Impact Traversal
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ID: {nodeId}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 mt-1 line-clamp-1">
            {data?.target_name || nodeId}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-medium">
              Traversing Multi-Hop Downstream Graph...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Top Score Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Disruption Score</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">
                  {data.composite_disruption_score}%
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Composite exposure
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Financial At-Risk</div>
                <div className="text-lg font-black text-rose-400 mt-0.5">
                  ${Math.round(data.financial_exposure_total / 1000)}k
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Annual salary pool
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Headcount Impact</div>
                <div className="text-lg font-black text-blue-400 mt-0.5">
                  {data.total_headcount_impacted}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  FTE positions
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Auto Feasibility</div>
                <div className="text-lg font-black text-purple-400 mt-0.5">
                  {Math.round(data.avg_automation_feasibility * 100)}%
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  AI replacement potential
                </div>
              </div>
            </div>

            {/* Impacted Roles Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Downstream Impacted Roles ({data.impacted_roles?.length || 0})
              </h3>
              <div className="space-y-2">
                {data.impacted_roles?.map((role: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">
                        {role.role_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          role.transition_risk === "Critical"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {role.transition_risk} Risk
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Dept: {role.department}</span>
                      <span>
                        Headcount: <b>{role.headcount}</b> ($
                        {Math.round(role.avg_salary / 1000)}k avg)
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Automation Exposure:
                      </span>
                      <span className="font-semibold text-purple-400">
                        {role.automation_exposure_pct}% ($
                        {Math.round(role.financial_exposure / 1000)}k at risk)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reskilling & Skill Evolution Delta */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Reskilling & AI Evolution Delta ({data.impacted_skills?.length || 0})
              </h3>
              <div className="space-y-2">
                {data.impacted_skills?.map((skill: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">
                        {skill.skill_name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {skill.reskill_time_weeks} Weeks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {skill.category}
                      </span>
                      <span>Urgency: {skill.urgency_to_reskill}</span>
                    </div>
                    {skill.evolution_path && (
                      <div className="pt-1 text-[11px] text-emerald-300 flex items-start gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          <b>Evolution Path:</b> {skill.evolution_path}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Hop Pathways */}
            {data.multi_hop_pathways?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Multi-Hop Graph Pathway Traversal
                </h3>
                <div className="space-y-1.5">
                  {data.multi_hop_pathways.slice(0, 4).map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-[11px] flex items-center gap-1.5 flex-wrap text-slate-300"
                    >
                      <span className="text-blue-400 font-medium">{p.process}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-purple-400">{p.activity}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-amber-400">{p.role}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-emerald-400 font-semibold">{p.skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Workforce Transformation Recommendations */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Strategic AI Transformation & Mitigation
              </h3>
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
                {data.mitigation_strategies?.map((strat: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-indigo-200/90"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{strat}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
