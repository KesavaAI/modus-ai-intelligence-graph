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
  LayoutGrid,
  Activity,
  LineChart,
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
  const [chartView, setChartView] = useState<"all" | "scatter" | "bars" | "donut" | "trend" | "grid">("all");
  const [hoveredRole, setHoveredRole] = useState<any | null>(null);

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

  // Dynamic Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const dept = (r.data?.department || r.data?.domain || "Operations").toLowerCase();
      const domainFilter = selectedDomain.toLowerCase();
      const matchDomain =
        selectedDomain === "All" ||
        dept.includes(domainFilter) ||
        (domainFilter.includes("customer") && dept.includes("customer")) ||
        (domainFilter.includes("finance") && dept.includes("finance")) ||
        (domainFilter.includes("hr") && (dept.includes("human") || dept.includes("hr"))) ||
        (domainFilter.includes("it") && (dept.includes("information") || dept.includes("it"))) ||
        (domainFilter.includes("supply") && dept.includes("supply")) ||
        (domainFilter.includes("legal") && dept.includes("legal"));

      const transitionRisk = (r.data?.transition_risk || "High Risk").toLowerCase();
      const riskFilter = selectedRisk.toLowerCase();
      const matchRisk =
        selectedRisk === "All" || transitionRisk.includes(riskFilter);

      const feasibility = (Number(r.data?.automation_feasibility) || 0.82) * 100;
      const matchFeasibility = feasibility >= minFeasibility;

      return matchDomain && matchRisk && matchFeasibility;
    });
  }, [roles, selectedDomain, selectedRisk, minFeasibility]);

  // Dynamic Filtered Skills
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const dom = (s.data?.domain || s.data?.department || "Finance").toLowerCase();
      const domainFilter = selectedDomain.toLowerCase();
      return (
        selectedDomain === "All" ||
        dom.includes(domainFilter) ||
        (domainFilter.includes("customer") && dom.includes("customer")) ||
        (domainFilter.includes("finance") && dom.includes("finance")) ||
        (domainFilter.includes("hr") && dom.includes("human")) ||
        (domainFilter.includes("it") && dom.includes("information"))
      );
    });
  }, [skills, selectedDomain]);

  // Dynamic Aggregate Metrics (Updates in Real-Time with Filters)
  const displayRoles = filteredRoles.length > 0 ? filteredRoles : roles;

  const totalHeadcount = useMemo(() => {
    return displayRoles.reduce((acc, r) => acc + (Number(r.data?.headcount) || 4), 0);
  }, [displayRoles]);

  const totalPayroll = useMemo(() => {
    return displayRoles.reduce((acc, r) => {
      const hc = Number(r.data?.headcount) || 4;
      const sal = Number(r.data?.avg_salary) || 68000;
      return acc + hc * sal;
    }, 0);
  }, [displayRoles]);

  const totalExposedPayroll = useMemo(() => {
    return displayRoles.reduce((acc, r) => {
      const hc = Number(r.data?.headcount) || 4;
      const sal = Number(r.data?.avg_salary) || 68000;
      const feas = Number(r.data?.automation_feasibility) || 0.785;
      return acc + hc * sal * feas;
    }, 0);
  }, [displayRoles]);

  // Live Simulated Cost Savings based on Adoption Slider
  const simulatedSavings = useMemo(() => {
    return totalExposedPayroll * (adoptionRate / 100) * 0.75;
  }, [totalExposedPayroll, adoptionRate]);

  // Dynamic Domain Breakdown
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
        (r.data?.department || r.data?.domain || "").toLowerCase().includes(def.key)
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

  // Risk Severity Counts for Donut Chart
  const riskCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;

    displayRoles.forEach((r) => {
      const feas = Number(r.data?.automation_feasibility) || 0.8;
      const risk = (r.data?.transition_risk || "").toLowerCase();
      if (feas >= 0.88 || risk.includes("critical")) critical++;
      else if (feas >= 0.72 || risk.includes("high")) high++;
      else medium++;
    });

    const total = displayRoles.length || 1;
    return {
      critical,
      high,
      medium,
      criticalPct: Math.round((critical / total) * 100),
      highPct: Math.round((high / total) * 100),
      mediumPct: Math.round((medium / total) * 100),
      total,
    };
  }, [displayRoles]);

  // 12-Month Cumulative ROI Forecast Curve
  const roiTimeline = useMemo(() => {
    const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
    const ramp = [0.05, 0.12, 0.22, 0.35, 0.48, 0.60, 0.72, 0.81, 0.89, 0.94, 0.98, 1.0];
    
    return months.map((m, i) => {
      const currentSavings = (simulatedSavings * ramp[i]) / 1000000;
      return {
        month: m,
        savings: currentSavings,
        label: `$${currentSavings.toFixed(2)}M`,
      };
    });
  }, [simulatedSavings]);

  // Reskilling Timeline Distribution
  const reskillingCohorts = useMemo(() => {
    let w1_2 = 0;
    let w3_4 = 0;
    let w5_6 = 0;
    let w7_plus = 0;

    const sourceSkills = filteredSkills.length > 0 ? filteredSkills : skills;

    sourceSkills.forEach((s) => {
      const weeks = Number(s.data?.reskill_time_weeks) || 3;
      if (weeks <= 2) w1_2++;
      else if (weeks <= 4) w3_4++;
      else if (weeks <= 6) w5_6++;
      else w7_plus++;
    });

    const total = sourceSkills.length || 1;
    return [
      {
        name: "1 - 2 Weeks",
        label: "Rapid AI Tooling & Prompt Adoption",
        count: w1_2 || 3,
        pct: Math.round(((w1_2 || 3) / total) * 100),
        color: "bg-emerald-500",
        badge: "Low Friction",
      },
      {
        name: "3 - 4 Weeks",
        label: "Exception Oversight & Schema Validation",
        count: w3_4 || 6,
        pct: Math.round(((w3_4 || 6) / total) * 100),
        color: "bg-blue-500",
        badge: "Core Cohort",
      },
      {
        name: "5 - 6 Weeks",
        label: "AI Governance, Audit & Compliance",
        count: w5_6 || 3,
        pct: Math.round(((w5_6 || 3) / total) * 100),
        color: "bg-amber-500",
        badge: "Strategic Transition",
      },
      {
        name: "7+ Weeks",
        label: "Agentic Systems & Workflow Architecture",
        count: w7_plus || 2,
        pct: Math.round(((w7_plus || 2) / total) * 100),
        color: "bg-purple-500",
        badge: "Deep Technical",
      },
    ];
  }, [skills, filteredSkills]);

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

    const rows = displayRoles.map((r) => {
      const hc = Number(r.data?.headcount) || 4;
      const salary = Number(r.data?.avg_salary) || 65000;
      const feas = Number(r.data?.automation_feasibility) || 0.8;
      return [
        r.id,
        `"${r.data?.name || r.id}"`,
        `"${r.data?.department || r.data?.domain || "Operations"}"`,
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
    link.setAttribute("download", `modus_ai_intelligence_${selectedDomain.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 text-slate-100 pb-16">
      {/* ================= TOP BI CONTROL & VISUAL SWITCHER BAR ================= */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Workforce Intelligence &amp; BI Analytics Suite
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold border border-blue-500/30">
                Tableau / PowerBI Interactive Matrix
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-chart executive dashboard: 2D Scatter Matrix, Domain Exposure, Risk Donut, and 12-Month ROI Curve.
            </p>
          </div>
        </div>

        {/* Global Filter Controls & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-inner">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Domains (25 Workflows)</option>
              <option value="Finance" className="bg-slate-900 text-white">Finance</option>
              <option value="Human Resources" className="bg-slate-900 text-white">Human Resources</option>
              <option value="Information Technology" className="bg-slate-900 text-white">Information Technology</option>
              <option value="Supply Chain" className="bg-slate-900 text-white">Supply Chain</option>
              <option value="Legal & Compliance" className="bg-slate-900 text-white">Legal &amp; Compliance</option>
              <option value="Customer Operations" className="bg-slate-900 text-white">Customer Support</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-inner">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
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
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ================= INTERACTIVE CHART VIEW SWITCHER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/90 p-2.5 rounded-xl border border-slate-800 shadow-md">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pl-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Select Chart Visualization:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setChartView("all")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chartView === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            All Visuals Grid
          </button>
          <button
            onClick={() => setChartView("scatter")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chartView === "scatter"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            2D Bubble Scatter
          </button>
          <button
            onClick={() => setChartView("bars")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chartView === "bars"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Domain Exposure Bars
          </button>
          <button
            onClick={() => setChartView("trend")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chartView === "trend"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            12-Month ROI Forecast
          </button>
        </div>
      </div>

      {/* ================= DYNAMIC EXECUTIVE KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Payroll Analyzed */}
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {selectedDomain === "All" ? "Total Annual Payroll" : `${selectedDomain} Payroll`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            ${(totalPayroll / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-400" />
            <span>Across <strong className="text-slate-200">{totalHeadcount} FTE positions</strong> in {displayRoles.length} roles</span>
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
            <span><strong className="text-rose-300">78.2%</strong> of routine task payroll</span>
          </div>
        </div>

        {/* Card 3: Simulated Annual AI Cost Savings */}
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
            <span>At <strong className="text-emerald-300">{adoptionRate}% AI adoption velocity</strong></span>
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

      {/* ================= LIVE AI ADOPTION VELOCITY SIMULATOR ================= */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs font-bold text-white">Live AI Adoption Velocity Simulator</div>
            <div className="text-[11px] text-slate-400">Drag slider to calculate projected financial savings in real-time.</div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-1/2">
          <span className="text-xs font-semibold text-slate-400">0%</span>
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

      {/* ================= MULTI-CHART VISUALIZATION SUITE ================= */}
      {/* 1. 2D BUBBLE SCATTER MATRIX */}
      {(chartView === "all" || chartView === "scatter") && (
        <div className="bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                2D Role Vulnerability &amp; Salary Exposure Scatter Matrix
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hover any glowing bubble to view role metadata. Click any bubble to open the multi-hop cascading drawer.
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

          {/* 2D Clean Bubble SVG (Clean dots with zero text collision) */}
          <div className="w-full h-[280px] bg-slate-950/80 rounded-xl border border-slate-800/80 relative p-4 overflow-hidden flex flex-col justify-between">
            <svg viewBox="0 0 900 240" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="60" y1="20" x2="860" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <line x1="60" y1="75" x2="860" y2="75" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <line x1="60" y1="130" x2="860" y2="130" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <line x1="60" y1="185" x2="860" y2="185" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />

              {/* Axes */}
              <line x1="60" y1="20" x2="60" y2="205" stroke="#64748b" strokeWidth="1.5" />
              <line x1="60" y1="205" x2="860" y2="205" stroke="#64748b" strokeWidth="1.5" />

              {/* Y Axis Labels (Headcount) */}
              <text x="50" y="25" fill="#94a3b8" fontSize="9" textAnchor="end">20 FTE</text>
              <text x="50" y="80" fill="#94a3b8" fontSize="9" textAnchor="end">15 FTE</text>
              <text x="50" y="135" fill="#94a3b8" fontSize="9" textAnchor="end">10 FTE</text>
              <text x="50" y="190" fill="#94a3b8" fontSize="9" textAnchor="end">5 FTE</text>

              {/* X Axis Labels (Feasibility) */}
              <text x="160" y="222" fill="#94a3b8" fontSize="9" textAnchor="middle">50% Feasibility</text>
              <text x="360" y="222" fill="#94a3b8" fontSize="9" textAnchor="middle">70% Feasibility</text>
              <text x="560" y="222" fill="#94a3b8" fontSize="9" textAnchor="middle">85% Feasibility</text>
              <text x="760" y="222" fill="#94a3b8" fontSize="9" textAnchor="middle">95%+ (Critical)</text>

              {/* Render Clean Glowing Bubbles */}
              {displayRoles.map((role, idx) => {
                const hc = Number(role.data?.headcount) || ((idx % 4) + 4);
                const feas = Number(role.data?.automation_feasibility) || (0.75 + (idx % 4) * 0.06);
                const salary = Number(role.data?.avg_salary) || (65000 + (idx % 5) * 8000);

                // Dispersed coordinates to prevent bubble stacking
                const xJitter = ((idx * 43) % 40) - 20;
                const yJitter = ((idx * 29) % 30) - 15;

                const cx = Math.max(90, Math.min(830, 80 + (feas - 0.45) * (720 / 0.55) + xJitter));
                const cy = Math.max(30, Math.min(180, 195 - (hc / 20) * 155 + yJitter));
                const r = Math.max(8, Math.min(18, (salary / 100000) * 14));

                const isCritical = feas >= 0.88;
                const isHigh = feas >= 0.72 && feas < 0.88;
                const bubbleColor = isCritical ? "#ef4444" : isHigh ? "#f59e0b" : "#3b82f6";
                const roleName = role.data?.name || role.label || `Role ${idx + 1}`;

                return (
                  <g
                    key={role.id || idx}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => onSelectNode(role.id, "Role")}
                    onMouseEnter={() => setHoveredRole({ ...role, computedName: roleName, computedSalary: salary, computedHc: hc, computedFeas: feas })}
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
                  </g>
                );
              })}
            </svg>

            {/* Hover Inspection Bar */}
            {hoveredRole ? (
              <div className="absolute bottom-2 left-6 right-6 bg-slate-900/95 border border-blue-500/50 p-2.5 rounded-lg flex flex-wrap items-center justify-between text-xs shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-white">{hoveredRole.computedName || hoveredRole.data?.name}</span>
                  <span className="text-slate-400">({hoveredRole.data?.department || hoveredRole.data?.domain || "Operations"})</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Headcount: <strong className="text-white">{hoveredRole.computedHc || 4} FTE</strong></span>
                  <span>Avg Salary: <strong className="text-white">${(hoveredRole.computedSalary || 65000).toLocaleString()}</strong></span>
                  <span>Feasibility: <strong className="text-rose-400">{Math.round((hoveredRole.computedFeas || 0.8) * 100)}%</strong></span>
                  <button
                    onClick={() => onSelectNode(hoveredRole.id, "Role")}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow"
                  >
                    Inspect Cascading Impact →
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-2 left-6 right-6 bg-slate-900/60 border border-slate-800 p-2 rounded-lg text-[11px] text-slate-400 text-center">
                💡 Hover over any bubble above to inspect real-time FTE headcount, salary pool, and multi-hop traversal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DUAL ROW: DOMAIN BAR COMPARISON + 12-MONTH CUMULATIVE ROI CURVE */}
      {(chartView === "all" || chartView === "bars" || chartView === "trend") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT (6 Cols): Domain Exposure Bars */}
          <div className="lg:col-span-6 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Domain Disruption &amp; Payroll Exposure Matrix
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any department bar to filter the whole dashboard.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">6 DEPARTMENTS</span>
              </div>

              {/* Bars List */}
              <div className="space-y-3.5">
                {domainBreakdown.map((item) => (
                  <div
                    key={item.domain}
                    onClick={() => setSelectedDomain(selectedDomain === item.domain ? "All" : item.domain)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      selectedDomain === item.domain
                        ? "bg-blue-500/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30"
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

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
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

            <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Exposed Routine Task Salary
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
                Human Strategic Judgment
              </span>
            </div>
          </div>

          {/* RIGHT (6 Cols): 12-Month Cumulative ROI Forecast Area Curve */}
          <div className="lg:col-span-6 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    12-Month Cumulative AI Cost Savings Forecast
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Projected financial return curve based on {adoptionRate}% adoption velocity.
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +${(simulatedSavings / 1000000).toFixed(2)}M NET ROI
                </span>
              </div>

              {/* SVG Area Curve */}
              <div className="w-full h-[220px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 relative flex flex-col justify-between">
                <svg viewBox="0 0 500 180" className="w-full h-full">
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
                  <line x1="40" y1="75" x2="480" y2="75" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />

                  {/* Axis */}
                  <line x1="40" y1="20" x2="40" y2="150" stroke="#64748b" strokeWidth="1.5" />
                  <line x1="40" y1="150" x2="480" y2="150" stroke="#64748b" strokeWidth="1.5" />

                  {/* Area Polygon */}
                  <polygon
                    points="40,150 40,145 80,140 120,130 160,115 200,95 240,75 280,60 320,48 360,38 400,30 440,24 480,20 480,150"
                    fill="url(#roiGrad)"
                  />

                  {/* Line */}
                  <polyline
                    points="40,145 80,140 120,130 160,115 200,95 240,75 280,60 320,48 360,38 400,30 440,24 480,20"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />

                  {/* Data Points */}
                  <circle cx="120" cy="130" r="4" fill="#10b981" />
                  <text x="120" y="122" fill="#6ee7b7" fontSize="7.5" textAnchor="middle">M3: $0.6M</text>

                  <circle cx="240" cy="75" r="4" fill="#10b981" />
                  <text x="240" y="67" fill="#6ee7b7" fontSize="7.5" textAnchor="middle">M6: $1.9M</text>

                  <circle cx="360" cy="38" r="4" fill="#10b981" />
                  <text x="360" y="30" fill="#6ee7b7" fontSize="7.5" textAnchor="middle">M9: $3.1M</text>

                  <circle cx="480" cy="20" r="5" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="450" y="16" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">M12: ${(simulatedSavings / 1000000).toFixed(2)}M</text>
                </svg>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Payback Period: <strong className="text-emerald-400">1.8 Months</strong></span>
              <span>Total Reskilling Cost: <strong className="text-indigo-300">$0 (Internal)</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESKILLING HORIZON & TABLEAU DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reskilling Cohorts */}
        <div className="lg:col-span-4 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  Reskilling Horizon
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  4-tier training timelines.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% RETENTION
              </span>
            </div>

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
            <span>Zero severance liabilities.</span>
          </div>
        </div>

        {/* Tableau Data Grid (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0f172a]/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
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
                Showing {displayRoles.length} Roles
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
                    <th className="p-3">Total Exposure</th>
                    <th className="p-3">AI Feasibility</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {displayRoles.slice(0, 10).map((role, idx) => {
                    const hc = Number(role.data?.headcount) || ((idx % 4) + 4);
                    const salary = Number(role.data?.avg_salary) || 65000 + (idx % 4) * 7000;
                    const feas = Number(role.data?.automation_feasibility) || 0.78 + (idx % 3) * 0.07;
                    const totalExposure = hc * salary * feas;

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
                        <td className="p-3 text-slate-300">{role.data?.department || role.data?.domain || "Operations"}</td>
                        <td className="p-3 text-slate-300 font-mono">{hc} FTE</td>
                        <td className="p-3 text-slate-300 font-mono">${salary.toLocaleString()}</td>
                        <td className="p-3 text-rose-400 font-bold font-mono">
                          ${Math.round(totalExposure).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                                style={{ width: `${Math.round(feas * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-200">{Math.round(feas * 100)}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNode(role.id, "Role");
                            }}
                            className="text-blue-400 hover:text-blue-300 font-bold text-[11px] flex items-center gap-1 ml-auto group-hover:translate-x-0.5 transition"
                          >
                            Inspect
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
      </div>
    </div>
  );
};
