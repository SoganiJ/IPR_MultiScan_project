import React, { useEffect, useState } from 'react';
import { useAnalysis, TabKey } from '../context/AnalysisContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  Sparkles,
  ShieldAlert,
  Activity,
  Award,
  Network,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, currentAnalysis, loading } = useAnalysis();
  const [serverHealth, setServerHealth] = useState<'healthy' | 'checking' | 'offline'>('checking');

  useEffect(() => {
    api
      .getHealth()
      .then(() => setServerHealth('healthy'))
      .catch(() => setServerHealth('offline'));
  }, []);

  const navItems: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'new-analysis', label: 'New Analysis', icon: PlusCircle },
    { key: 'processing', label: 'Image Processing', icon: Layers },
    { key: 'explainability', label: 'Explainability', icon: Sparkles },
    { key: 'uncertainty', label: 'Uncertainty & Safety', icon: ShieldAlert },
    { key: 'audit', label: 'Faithfulness Audit', icon: Activity },
    { key: 'benchmark', label: 'Benchmark Results', icon: Award },
    { key: 'architecture', label: 'System Architecture', icon: Network },
    { key: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-teal-950/40 px-4 py-1.5 text-xs border-b border-slate-800/80 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Research Prototype
          </span>
          <span className="hidden sm:inline text-slate-400">
            Explainable Multi-Scale Counterfactual Deep Learning for Sub-Millimeter Lesion Localization
          </span>
          <span className="text-rose-400 font-medium">· NOT FOR CLINICAL USE</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                serverHealth === 'healthy'
                  ? 'bg-emerald-400 animate-pulse'
                  : serverHealth === 'checking'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400">
              API: {serverHealth === 'healthy' ? 'Online (8000)' : serverHealth}
            </span>
          </div>
          {currentAnalysis && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-700">
              <span className="text-slate-400">Analysis:</span>
              <span className="font-mono text-cyan-400 font-medium">{currentAnalysis.analysis_id}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Candidates:</span>
              <span className="text-teal-300 font-medium">
                {currentAnalysis.candidates?.length ?? 0}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">EMCL-CU</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Multi-Scale Medical Imaging Analysis
              </p>
            </div>
          </div>

          {/* Quick Actions if analysis loaded */}
          {currentAnalysis && (
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const report = await api.exportReport(currentAnalysis.analysis_id);
                    const blob = new Blob([JSON.stringify(report, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `EMCL-CU-Report-${currentAnalysis.analysis_id}.json`;
                    a.click();
                  } catch (e) {
                    alert('Export failed');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
                title="Download JSON Export Report"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Export JSON
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
