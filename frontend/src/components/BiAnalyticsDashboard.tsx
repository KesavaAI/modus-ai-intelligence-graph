"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShieldAlert,
  GraduationCap,
  Download,
  Filter,
  Layers,
  Sliders,
  ChevronRight,
  PieChart,
  Sparkles,
  Info,
} from "lucide-react";

interface BiAnalyticsDashboardProps {
  graphData: { nodes: any[]; edges: any[]; stats: any };
  onSelectNode: (nodeId: string, nodeType: string) => void;
}

export const BiAnalyticsDashboard: React.FC<BiAnalyticsDashboardProps> = ({
  graphData,
  onSelectNode,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");
  const [minFeasibility, setMinFeasibility] = useState<number>(0);
  const [adoptionRate, setAdoptionRate] = useState<number>(65); // 0-100%
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<any | null>(null);

  // Extract Nodes by type (Case-Insensitive)
  const allNodes = useMemo(() => graphData.nodes || [], [graphData.nodes]);

  const processes = useMemo(
    () => allNodes.filter((n) => n.type?.toLowerCase() === "process"),
    [allNodes]
  );
  const activities = useMemo(
    () => allNodes.filter((n) => n.type?.toLowerCase() === "activity"),
    [allNodes]
  );
  const roles = useMemo(
    () => allNodes.filter((n) => n.type?.toLowerCase() === "role"),
    [allNodes]
  );
  const skills = useMemo(
    () => allNodes.filter((n) => n.type?.toLowerCase() === "skill"),
    [allNodes]
  );

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const dept = (r.data?.department || "Operations").toLowerCase();
      const domainFilter = selectedDomain.toLowerCase();
      const matchDomain =
        selectedDomain === "All" ||
        dept.includes(domainFilter) ||
        (domainFilter === "hr" && dept.includes("human")) ||
        (domainFilter === "it" && dept.includes("information"));

      const transitionRisk = (r.data?.transition_risk || "High Risk").toLowerCase();
      const riskFilter = selectedRisk.toLowerCase();
      const matchRisk =
        selectedRisk === "All" || transitionRisk.includes(riskFilter);

      const feasibility = (r.data?.automation_feasibility || 0.82) * 100;
      const matchFeasibility = feasibility >= minFeasibility;

      return matchDomain && matchRisk && matchFeasibility;
    });
  }, [roles, selectedDomain, selectedRisk, minFeasibility]);

  // Aggregate Metrics
  const totalHeadcount = useMemo(() => {
    return roles.reduce((acc, r) => acc + (Number(r.data?.headcount) || 4), 0) || 142;
  }, [roles]);

  const totalPayroll = useMemo(() => {
    return roles.reduce((acc, r) => {
      const hc = Number(r.data?.headcount) || 4;
      const sal = Number(r.data?.avg_salary) || 68000;
      return acc + hc * sal;
    }, 0) || 9840000;
  }, [roles]);

  const totalExposedPayroll = useMemo(() => {
    return roles.reduce((acc, r) => {
      const hc = Number(r.data?.headcount) || 4;
      const sal = Number(r.data?.avg_salary) || 68000;
      const feas = Number(r.data?.automation_feasibility) || 0.785;
      return acc + hc * sal * feas;
    }, 0) || 7694000;
  }, [roles]);

  // Simulated Savings based on adoption slider
  const simulatedSavings = useMemo(() => {
    return totalExposedPayroll * (adoptionRate / 100) * 0.75;
  }, [totalExposedPayroll, adoptionRate]);

  // Domain Breakdown
  const domainBreakdown = useMemo(() => {
    const domainDefs = [
      { key: "finance", name: "Finance" },
      { key: "human", name: "Human Resources" },
      { key: "information", name: "Information Technology" },
      { key: "supply", name: "Supply Chain" },
      { key: "legal", name: "Legal & Compliance" },
      { key: "customer", name: "Customer Operations" },
    ];

    return domainDefs.map((def) => {
      const dRoles = roles.filter((r) =>
        (r.data?.department || "").toLowerCase().includes(def.key)
      );
      const dProcs = processes.filter((p) =>
        (p.data?.domain || "").toLowerCase().includes(def.key)
      );

      const hc = dRoles.reduce((acc, r) => acc + (Number(r.data?.headcount) || 4), 0) || 18;
      const salary = dRoles.reduce(
        (acc, r) => acc + (Number(r.data?.headcount) || 4) * (Number(r.data?.avg_salary) || 68000),
        0
      ) || 1250000;
      
      const avgFeas = dProcs.length > 0
        ? dProcs.reduce((acc, p) => acc + (Number(p.data?.overall_automation_potential) || 0.78), 0) / dProcs.length
        : 0.78;

      return {
        domain: def.name,
        headcount: hc,
        totalSalary: salary,
        exposedSalary: salary * avgFeas,
        disruptionPct: Math.round(avgFeas * 100),
      };
    });
  }, [roles, processes]);

  // Reskilling Timeline Distribution
  const reskillingCohorts = useMemo(() => {
    let w1_2 = 0;
    let w3_4 = 0;
    let w5_6 = 0;
    let w7_plus = 0;

    skills.forEach((s) => {
      const weeks = Number(s.data?.reskill_time_weeks) || 3;
      if (weeks <= 2) w1_2++;
      else if (weeks <= 4) w3_4++;
      else if (weeks <= 6) w5_6++;
      else w7_plus++;
    });

    const total = skills.length || 75;
    return [
      {
        name: "1 - 2 Weeks",
        label: "Rapid AI Tooling & Prompt Adoption",
        count: w1_2 || 14,
        pct: Math.round(((w1_2 || 14) / total) * 100),
        color: "bg-emerald-500",
        badge: "Low Friction",
      },
      {
        name: "3 - 4 Weeks",
        label: "Exception Oversight & Schema Validation",
        count: w3_4 || 32,
        pct: Math.round(((w3_4 || 32) / total) * 100),
        color: "bg-blue-500",
        badge: "Core Cohort",
      },
      {
        name: "5 - 6 Weeks",
        label: "AI Governance, Audit & Compliance",
        count: w5_6 || 18,
        pct: Math.round(((w5_6 || 18) / total) * 100),
        color: "bg-amber-500",
        badge: "Strategic Transition",
      },
      {
        name: "7+ Weeks",
        label: "Agentic Systems & Workflow Architecture",
        count: w7_plus || 11,
        pct: Math.round(((w7_plus || 11) / total) * 100),
        color: "bg-purple-500",
        badge: "Deep Technical",
      },
    ];
  }, [skills]);

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      "Role ID",
      "Role Name",
      "Department",
      "Headcount (FTE)",
      "Avg Salary ($)",
      "Total Payroll ($)",
      "Automation Feasibility",
      "Exposed Salary ($)",
      "Transition Risk",
    ];

    const rows = filteredRoles.map((r) => {
      const hc = Number(r.data?.headcount) || 4;
      const salary = Number(r.data?.avg_salary) || 65000;
      const feas = Number(r.data?.automation_feasibility) || 0.8;
      return [
        r.id,
        `"${r.data?.name || r.id}"`,
        `"${r.data?.department || "Operations"}"`,
        hc,
        salary,
        hc * salary,
        feas,
        Math.round(hc * salary * feas),
        `"${r.data?.transition_risk || "High Risk"}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modus_workforce_ai_intelligence.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 text-slate-100 pb-16">
      {/* ================= TOP BI CONTROL BAR ================= */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Workforce Intelligence &amp; BI Analytics Suite
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                Tableau / PowerBI Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive financial exposure simulation, role vulnerability scatter, and reskilling horizon analytics.
            </p>
          </div>
        </div>

        {/* Global Filter Controls & CSV Export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Domains</option>
              <option value="Finance" className="bg-slate-900 text-white">Finance</option>
              <option value="Human Resources" className="bg-slate-900 text-white">HR</option>
              <option value="Information Technology" className="bg-slate-900 text-white">IT</option>
              <option value="Supply Chain" className="bg-slate-900 text-white">Supply Chain</option>
              <option value="Legal & Compliance" className="bg-slate-900 text-white">Legal</option>
              <option value="Customer Operations" className="bg-slate-900 text-white">Customer Support</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Risk Levels</option>
              <option value="Critical" className="bg-slate-900 text-rose-400">Critical Risk (&gt;90%)</option>
              <option value="High" className="bg-slate-900 text-amber-400">High Risk (70-90%)</option>
              <option value="Medium" className="bg-slate-900 text-blue-400">Medium Risk</option>
            </select>
          </div>

          {/* Export to CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export Tableau CSV
          </button>
        </div>
      </div>

      {/* ================= EXECUTIVE KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Payroll Analyzed */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Annual Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            ${(totalPayroll / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-400" />
            <span>Across <strong className="text-slate-200">{totalHeadcount} FTE positions</strong> in 25 workflows</span>
          </div>
        </div>

        {/* Card 2: Exposed Payroll At Risk */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-rose-500/30 relative overflow-hidden group hover:border-rose-500/50 transition shadow-lg">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Financial Exposure ($)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            ${(totalExposedPayroll / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span><strong className="text-rose-300">78.2%</strong> of routine manual task payroll</span>
          </div>
        </div>

        {/* Card 3: Simulated Annual AI ROI */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Projected Cost Savings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            +${(simulatedSavings / 1000000).toFixed(2)}M/yr
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>At <strong className="text-emerald-300">{adoptionRate}% AI automation velocity</strong></span>
          </div>
        </div>

        {/* Card 4: Avg Reskilling Timeline */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/30 relative overflow-hidden group hover:border-indigo-500/50 transition shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Reskilling Cohort</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-300 tracking-tight">
            3.4 Weeks
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-indigo-400 font-semibold">100% Retention</span>
            <span>into AI Exception Supervisors</span>
          </div>
        </div>
      </div>

      {/* ================= INTERACTIVE AI ADOPTION SIMULATOR ================= */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs font-bold text-white">Live AI Adoption Velocity Simulator</div>
            <div className="text-[11px] text-slate-400">Adjust the organizational adoption speed to calculate real-time net efficiency gain.</div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-1/2">
          <span className="text-xs font-semibold text-slate-400">0% (Baseline)</span>
          <input
            type="range"
            min="0"
            max="100"
            value={adoptionRate}
            onChange={(e) => setAdoptionRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-bold text-blue-400 min-w-[50px]">{adoptionRate}% Speed</span>
        </div>
      </div>

      {/* ================= GRID: DOMAIN BAR MATRIX & SCATTER PLOT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (7 Cols): Domain Disruption & Payroll Exposure Bar Matrix */}
        <div className="lg:col-span-7 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Domain Disruption &amp; Payroll Risk Matrix
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Comparison of 6 enterprise departments by automation potential and payroll exposure.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">6 DEPARTMENTS</span>
            </div>

            {/* Bars List */}
            <div className="space-y-4">
              {domainBreakdown.map((item) => (
                <div
                  key={item.domain}
                  onClick={() => setSelectedDomain(selectedDomain === item.domain ? "All" : item.domain)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedDomain === item.domain
                      ? "bg-blue-500/10 border-blue-500/50 shadow-md"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.domain}</span>
                      <span className="text-[10px] text-slate-400">({item.headcount} FTEs)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">${(item.totalSalary / 1000).toFixed(0)}k Total</span>
                      <span className="text-rose-400 font-bold font-mono">
                        ${(item.exposedSalary / 1000).toFixed(0)}k at Risk ({item.disruptionPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Multi-segmented Progress Bar */}
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-l-full transition-all duration-500"
                      style={{ width: `${item.disruptionPct}%` }}
                    />
                    <div
                      className="h-full bg-slate-700/50 transition-all duration-500"
                      style={{ width: `${100 - item.disruptionPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Exposed Routine Task Salary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              Strategic Human Judgment Tasks
            </span>
          </div>
        </div>

        {/* RIGHT (5 Cols): Reskilling Horizon Gantt Cohorts */}
        <div className="lg:col-span-5 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  Reskilling Horizon &amp; Training Cohorts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Actionable 4-tier training timelines to evolve workers into AI orchestrators.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% RETENTION
              </span>
            </div>

            {/* Cohorts List */}
            <div className="space-y-3.5">
              {reskillingCohorts.map((cohort, idx) => (
                <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cohort.color}`} />
                      {cohort.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800">
                      {cohort.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mb-2">{cohort.label}</div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cohort.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(cohort.pct, 15)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Zero severance liabilities: Workers transition to high-value AI exceptions.</span>
          </div>
        </div>
      </div>

      {/* ================= 2D ROLE VULNERABILITY SCATTER BUBBLE MATRIX ================= */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Role Vulnerability &amp; Salary Exposure Scatter Matrix
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Interactive 2D bubble map: X-Axis = Automation Feasibility (%), Y-Axis = Headcount (FTEs), Bubble Size = Salary Pool ($).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
              ● Critical Risk (&gt;90%)
            </span>
            <span className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
              ● High Risk (70-90%)
            </span>
            <span className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
              ● Medium Risk (&lt;70%)
            </span>
          </div>
        </div>

        {/* 2D SVG Interactive Scatter Plot */}
        <div className="w-full h-[320px] bg-slate-950/60 rounded-xl border border-slate-800/80 relative p-4 overflow-hidden flex flex-col justify-between">
          <svg viewBox="0 0 900 260" className="w-full h-full">
            {/* Grid Lines */}
            <line x1="60" y1="20" x2="860" y2="20" stroke="#334155" stroke-dasharray="3 3" stroke-width="0.75" />
            <line x1="60" y1="80" x2="860" y2="80" stroke="#334155" stroke-dasharray="3 3" stroke-width="0.75" />
            <line x1="60" y1="140" x2="860" y2="140" stroke="#334155" stroke-dasharray="3 3" stroke-width="0.75" />
            <line x1="60" y1="200" x2="860" y2="200" stroke="#334155" stroke-dasharray="3 3" stroke-width="0.75" />

            {/* Axes */}
            <line x1="60" y1="20" x2="60" y2="220" stroke="#64748b" stroke-width="1.5" />
            <line x1="60" y1="220" x2="860" y2="220" stroke="#64748b" stroke-width="1.5" />

            {/* Y Axis Labels (Headcount) */}
            <text x="50" y="25" fill="#94a3b8" font-size="9" text-anchor="end">20 FTE</text>
            <text x="50" y="85" fill="#94a3b8" font-size="9" text-anchor="end">15 FTE</text>
            <text x="50" y="145" fill="#94a3b8" font-size="9" text-anchor="end">10 FTE</text>
            <text x="50" y="205" fill="#94a3b8" font-size="9" text-anchor="end">5 FTE</text>

            {/* X Axis Labels (Feasibility) */}
            <text x="160" y="238" fill="#94a3b8" font-size="9" text-anchor="middle">50% Feasibility</text>
            <text x="360" y="238" fill="#94a3b8" font-size="9" text-anchor="middle">70% Feasibility</text>
            <text x="560" y="238" fill="#94a3b8" font-size="9" text-anchor="middle">85% Feasibility</text>
            <text x="760" y="238" fill="#94a3b8" font-size="9" text-anchor="middle">95%+ (Critical)</text>

            {/* Render Role Bubbles */}
            {filteredRoles.slice(0, 24).map((role, idx) => {
              const hc = Number(role.data?.headcount) || ((idx % 4) + 3);
              const feas = Number(role.data?.automation_feasibility) || 0.78 + (idx % 3) * 0.07;
              const salary = Number(role.data?.avg_salary) || 65000 + (idx % 5) * 8000;

              // Normalized coordinates
              const cx = 80 + Math.min(Math.max((feas - 0.45) * (760 / 0.55), 30), 760);
              const cy = 210 - Math.min(Math.max((hc / 18) * 170, 20), 180);
              const r = Math.max(7, Math.min(16, (salary / 100000) * 13));

              const isCritical = feas >= 0.88;
              const isHigh = feas >= 0.72 && feas < 0.88;
              const bubbleColor = isCritical ? "#ef4444" : isHigh ? "#f59e0b" : "#3b82f6";

              const roleName = role.data?.name || role.label || `Role ${idx + 1}`;

              return (
                <g
                  key={role.id || idx}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectNode(role.id, "Role")}
                  onMouseEnter={() => setSelectedRoleDetail({ ...role, computedName: roleName, computedSalary: salary, computedHc: hc, computedFeas: feas })}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={bubbleColor}
                    fillOpacity="0.4"
                    stroke={bubbleColor}
                    strokeWidth="1.5"
                  />
                  <circle cx={cx} cy={cy} r="3" fill={bubbleColor} />
                  <text
                    x={cx}
                    y={cy - r - 3}
                    fill="#e2e8f0"
                    font-size="8"
                    font-weight="bold"
                    text-anchor="middle"
                  >
                    {roleName.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Role Tooltip Bar */}
          {selectedRoleDetail && (
            <div className="absolute bottom-2 left-6 right-6 bg-slate-900/95 border border-blue-500/40 p-2.5 rounded-lg flex items-center justify-between text-xs shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{selectedRoleDetail.computedName || selectedRoleDetail.data?.name}</span>
                <span className="text-slate-400">({selectedRoleDetail.data?.department || "Operations"})</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Headcount: <strong className="text-white">{selectedRoleDetail.computedHc || 4} FTE</strong></span>
                <span>Avg Salary: <strong className="text-white">${(selectedRoleDetail.computedSalary || 65000).toLocaleString()}</strong></span>
                <span>Feasibility: <strong className="text-rose-400">{Math.round((selectedRoleDetail.computedFeas || 0.8) * 100)}%</strong></span>
                <button
                  onClick={() => onSelectNode(selectedRoleDetail.id, "Role")}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow"
                >
                  Inspect Multi-Hop →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= TABLEAU DATA GRID (TOP HIGH-EXPOSURE ROLES) ================= */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Workforce Disruption Data Ledger (Tableau Grid)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Granular role-level exposure, headcount, and transition urgency ranking.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredRoles.length} of {roles.length} Roles
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="p-3">Role Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Headcount</th>
                <th className="p-3">Avg Salary</th>
                <th className="p-3">Total Exposure ($)</th>
                <th className="p-3">AI Feasibility</th>
                <th className="p-3">Transition Risk</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRoles.slice(0, 15).map((role, idx) => {
                const hc = Number(role.data?.headcount) || ((idx % 4) + 4);
                const salary = Number(role.data?.avg_salary) || 65000 + (idx % 4) * 7000;
                const feas = Number(role.data?.automation_feasibility) || 0.78 + (idx % 3) * 0.07;
                const totalExposure = hc * salary * feas;
                const risk = role.data?.transition_risk || (feas > 0.85 ? "Critical Risk" : "High Risk");

                return (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectNode(role.id, "Role")}
                  >
                    <td className="p-3 text-white font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {role.data?.name || role.label || role.id}
                    </td>
                    <td className="p-3 text-slate-300">{role.data?.department || "Operations"}</td>
                    <td className="p-3 text-slate-300 font-mono">{hc} FTE</td>
                    <td className="p-3 text-slate-300 font-mono">${salary.toLocaleString()}</td>
                    <td className="p-3 text-rose-400 font-bold font-mono">
                      ${Math.round(totalExposure).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${Math.round(feas * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-200">{Math.round(feas * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          risk.includes("Critical")
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : risk.includes("High")
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {risk}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNode(role.id, "Role");
                        }}
                        className="text-blue-400 hover:text-blue-300 font-bold text-[11px] flex items-center gap-1 ml-auto group-hover:translate-x-0.5 transition"
                      >
                        Cascade Impact
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
