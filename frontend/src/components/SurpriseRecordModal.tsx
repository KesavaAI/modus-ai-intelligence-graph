"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Cpu,
  Database,
  Network,
  Zap,
} from "lucide-react";

interface SurpriseRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESETS = [
  {
    title: "Automated Invoice Matching & Exception Handling in Accounts Payable",
    domain: "Finance",
    text: `Automated Invoice Matching & Exception Handling in Accounts Payable:
- Receipt of vendor invoices via multi-channel OCR and EDI gateways.
- Neural extraction of line-items, tax codes, and currency conversions.
- Autonomous 3-way matching against ERP purchase orders and goods receipt notes.
- High-variance discrepancy routing to accounts payable managers and vendor portals.
- Automated ledger voucher posting and dynamic early-payment discount optimization.`,
  },
  {
    title: "Autonomous Cloud FinOps & Real-time Resource Rightsizing",
    domain: "IT",
    text: `Autonomous Cloud FinOps & Real-time Resource Rightsizing:
- Continuous multi-cloud telemetry aggregation across AWS, Azure, and GCP.
- Machine learning anomaly detection for unattached EBS volumes and idle RDS instances.
- Automated rightsizing recommendations and spot instance bidding orchestration.
- Engineering budget attribution and real-time Slack notification alerts.`,
  },
  {
    title: "AI-Powered Candidate Sourcing & Competency Mapping",
    domain: "HR",
    text: `AI-Powered Candidate Sourcing & Competency Mapping:
- Inbound resume semantic shredding and competency graph construction.
- Automated asynchronous video/chat pre-screening for core skill evaluation.
- Bias-audited candidate shortlist generation for hiring manager interview calibration.
- Real-time calendar synchronization and interview rubric synthesis.`,
  },
];

export function SurpriseRecordModal({
  isOpen,
  onClose,
  onSuccess,
}: SurpriseRecordModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customText, setCustomText] = useState<string>(PRESETS[0].text);
  const [customTitle, setCustomTitle] = useState<string>(PRESETS[0].title);
  const [domain, setDomain] = useState<string>(PRESETS[0].domain);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<any>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setSelectedText(PRESETS[idx].text);
    setCustomTitle(PRESETS[idx].title);
    setDomain(PRESETS[idx].domain);
    setResultSummary(null);
    setError(null);
  };

  const setSelectedText = (t: string) => {
    setCustomText(t);
  };

  const handleIngest = async () => {
    setIsProcessing(true);
    setError(null);
    setResultSummary(null);
    setCurrentStep(1);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Step 1 Simulation transition
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(2);

      const res = await fetch(`${apiBase}/api/v1/process/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          process_description: customText,
          process_name: customTitle,
          domain: domain,
        }),
      });

      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 500));

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to ingest process");
      }

      const data = await res.json();
      setCurrentStep(4);
      setResultSummary(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend ingestion service");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Live Process Ingestion Pipeline
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  LangGraph + Neo4j
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Execute unstructured entity extraction & multi-hop graph synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Select Preset or Surprise Challenge
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedPreset === idx
                      ? "border-blue-500 bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/50"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold line-clamp-1">{preset.domain}</div>
                  <div className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Process Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Legal">Legal</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Unstructured Process Narrative & Workflow Steps
            </label>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Pipeline Execution Animation */}
          {isProcessing && (
            <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                LangGraph Extraction Pipeline In Progress...
              </div>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div
                  className={`p-2 rounded border flex flex-col items-center text-center gap-1 ${
                    currentStep >= 1
                      ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                      : "border-slate-800 text-slate-600"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>1. Ingesting</span>
                </div>
                <div
                  className={`p-2 rounded border flex flex-col items-center text-center gap-1 ${
                    currentStep >= 2
                      ? "border-purple-500/60 bg-purple-500/10 text-purple-300"
                      : "border-slate-800 text-slate-600"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. LLM Parsing</span>
                </div>
                <div
                  className={`p-2 rounded border flex flex-col items-center text-center gap-1 ${
                    currentStep >= 3
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                      : "border-slate-800 text-slate-600"
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>3. Multi-Hop Graph</span>
                </div>
                <div
                  className={`p-2 rounded border flex flex-col items-center text-center gap-1 ${
                    currentStep >= 4
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-800 text-slate-600"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>4. Neo4j Store</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {resultSummary && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Ingestion Completed & Graph Synchronized!
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-900/40 text-center">
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Process</div>
                  <div className="text-sm font-bold text-blue-400">1</div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Activities</div>
                  <div className="text-sm font-bold text-purple-400">
                    {resultSummary.graph_delta?.activities_added || 4}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Roles</div>
                  <div className="text-sm font-bold text-amber-400">
                    {resultSummary.graph_delta?.roles_added || 2}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Skills</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {resultSummary.graph_delta?.skills_added || 3}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleIngest}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 transition"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ingesting into Graph...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Run AI Ingestion Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
