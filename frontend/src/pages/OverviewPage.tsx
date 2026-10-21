import React, { useEffect, useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { api } from '../services/api';
import { SampleCase } from '../types/api';
import {
  Upload,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  FileCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { setActiveTab, loadDemoCase, loadAnalysis, analysesList, refreshHistory, loading } =
    useAnalysis();
  const [demoCases, setDemoCases] = useState<SampleCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    setLoadingCases(true);
    api
      .getDemoCases()
      .then((res) => setDemoCases(res.cases))
      .catch((err) => console.error(err))
      .finally(() => setLoadingCases(false));
  }, []);

  const totalAnalyses = analysesList.length;
  const totalCandidates = analysesList.reduce(
    (acc, curr) => acc + (curr.candidate_count || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#131d2e] to-[#0f172a] border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Research Prototype Architecture [100] – [106]</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Explainable Multi-Scale Counterfactual Deep Learning
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400">
              Sub-Millimeter Lesion Localization & Calibrated Uncertainty
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            A medical-imaging research software prototype combining 2D Discrete Wavelet
            Transform (DWT), algorithmic counterfactual comparison, clinical concept attribution,
            pixel-perturbation faithfulness auditing, and calibrated safety routing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('new-analysis')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Start New Analysis</span>
            </button>

            <button
              onClick={() => loadDemoCase('sample_001')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Load Sample Case 1 (Subtle Feature)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Session Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Analyses in Session
            </span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{totalAnalyses}</div>
          <div className="mt-1 text-xs text-slate-500">Stored in-memory backend session</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Candidates Localized
            </span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{totalCandidates}</div>
          <div className="mt-1 text-xs text-slate-500">Multi-scale wavelet detected regions</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Faithfulness Benchmark
            </span>
            <FileCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">0.850+</div>
          <div className="mt-1 text-xs text-slate-500">AFS Target for REVIEW_READY</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Uncertainty Bound
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">≤ 0.150</div>
          <div className="mt-1 text-xs text-slate-500">Calibrated safety cutoff limit</div>
        </div>
      </div>

      {/* Two-Column Section: Quick Sample Loaders & Recent Analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sample Cases Quick Launch (1 col) */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-white text-sm">Synthetic Test Cases</h3>
              <p className="text-xs text-slate-400">1-click test runs for immediate validation</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">5 cases</span>
          </div>

          <div className="space-y-2">
            {demoCases.map((c) => (
              <div
                key={c.id}
                onClick={() => loadDemoCase(c.id)}
                className="group p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white group-hover:text-cyan-300 transition">
                      {c.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                      {c.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition shrink-0" />
              </div>
            ))}
            {loadingCases && (
              <div className="text-xs text-slate-500 text-center py-4">Loading sample cases...</div>
            )}
          </div>
        </div>

        {/* Recent Analyses Table (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-white text-sm">Session Analysis History</h3>
              <p className="text-xs text-slate-400">
                Analyses performed during this application session
              </p>
            </div>
            <button
              onClick={() => refreshHistory()}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {analysesList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400">No analyses performed yet in this session.</p>
              <p className="text-xs text-slate-500">
                Upload your medical scan image or click any synthetic test case to begin.
              </p>
              <button
                onClick={() => loadDemoCase('sample_001')}
                className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Load Sample Case 1 now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">Analysis ID</th>
                    <th className="pb-2 font-medium">File Name</th>
                    <th className="pb-2 font-medium">Candidates</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysesList.map((item) => (
                    <tr key={item.analysis_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-mono text-cyan-400 font-medium">
                        {item.analysis_id}
                      </td>
                      <td className="py-2.5 text-slate-300">{item.filename}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                          {item.candidate_count}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.status === 'complete'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => {
                            loadAnalysis(item.analysis_id);
                            setActiveTab('processing');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Core Research Capabilities Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-semibold text-white">
          Key Research Capabilities of the Prototype
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Scale Wavelet DWT</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Genuine 2D Discrete Wavelet Transform separating low-frequency tissue baselines from
              high-frequency directional subbands (LH, HL, HH) to capture sub-millimeter lesion
              boundaries.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-semibold">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Counterfactual Heatmaps</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Calculates algorithmic reference baselines and absolute difference maps with custom
              colormaps and opacity blending to isolate anomalous morphological variations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Calibrated Safety Routing</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Evaluates Aggregated Faithfulness Scores (AFS) from pixel perturbation curves against
              calibrated uncertainty proxies to enforce demo safety bounds (AFS ≥ 0.85, U ≤ 0.15).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
