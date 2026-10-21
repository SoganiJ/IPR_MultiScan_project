import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import {
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

export const FaithfulnessAuditPage: React.FC = () => {
  const {
    currentAnalysis,
    selectedCandidateId,
    setSelectedCandidateId,
    auditResult,
    executeAudit,
    loading,
    loadingMessage,
    loadDemoCase,
  } = useAnalysis();

  const [numSteps, setNumSteps] = useState<number>(20);

  if (!currentAnalysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Active Analysis</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Run an analysis or load a synthetic test case to perform an insertion/deletion
          faithfulness audit.
        </p>
        <button
          onClick={() => loadDemoCase('sample_001')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition"
        >
          <Activity className="w-4 h-4" /> Load Sample Case 1
        </button>
      </div>
    );
  }

  const candidates = currentAnalysis.candidates || [];
  const afs = auditResult?.afs ?? currentAnalysis.audit_result?.afs;
  const insAuc = auditResult?.auc_insertion ?? currentAnalysis.audit_result?.auc_insertion;
  const delAuc = auditResult?.auc_deletion ?? currentAnalysis.audit_result?.auc_deletion;
  const currentAudit = auditResult || currentAnalysis.audit_result;

  // Chart data
  const chartData =
    currentAudit && currentAudit.x_values
      ? currentAudit.x_values.map((x, idx) => ({
          fraction: `${Math.round(x * 100)}%`,
          x: x,
          insertion: currentAudit.insertion_scores[idx],
          deletion: currentAudit.deletion_scores[idx],
        }))
      : [];

  const handleRunAudit = async () => {
    await executeAudit(selectedCandidateId, numSteps);
  };

  const isPassingAfs = afs !== undefined && afs >= 0.85;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Module [105]
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Insertion & Deletion Faithfulness Audit
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Pixel-perturbation auditing evaluating whether detected salient regions authentically
          drive the model's confidence curves.
        </p>
      </div>

      {/* Audit Action Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Target Candidate Region</label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  Candidate #{c.id} (Area: {c.area} px, Saliency: {c.saliency_score?.toFixed(3)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Perturbation Steps</label>
            <select
              value={numSteps}
              onChange={(e) => setNumSteps(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value={10}>10 Steps (Fast)</option>
              <option value={20}>20 Steps (Standard)</option>
              <option value={30}>30 Steps (Detailed)</option>
              <option value={50}>50 Steps (High-Res)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={loading || candidates.length === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>{loadingMessage || 'Running Audit...'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{currentAudit ? 'Re-Run Faithfulness Audit' : 'Start Faithfulness Audit'}</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row: AFS Score + Insertion AUC + Deletion AUC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* AFS Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-medium">
            <span>Aggregated Faithfulness (AFS)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {afs !== undefined ? afs.toFixed(4) : 'N/A'}
            </span>
            <span className="text-xs text-slate-500">/ 1.0000</span>
          </div>
          <div className="text-xs flex items-center gap-1.5 pt-1">
            {afs !== undefined ? (
              isPassingAfs ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passes Safety Target (≥ 0.85)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Sub-threshold (&lt; 0.85)
                </span>
              )
            ) : (
              <span className="text-slate-500">Run audit to calculate</span>
            )}
          </div>
        </div>

        {/* Insertion AUC */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-medium">
            <span>Insertion AUC (Climbing)</span>
            <span className="text-teal-400 font-mono text-xs">Higher = Better</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-teal-300">
            {insAuc !== undefined ? insAuc.toFixed(4) : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            Measures response speed as salient pixels are restored.
          </div>
        </div>

        {/* Deletion AUC */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-medium">
            <span>Deletion AUC (Decaying)</span>
            <span className="text-amber-400 font-mono text-xs">Lower = Better</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-300">
            {delAuc !== undefined ? delAuc.toFixed(4) : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            Measures response decay as salient pixels are removed.
          </div>
        </div>
      </div>

      {/* Main Curves Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Perturbation Response Curves (Insertion vs Deletion)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across {currentAudit?.num_steps || 20} incremental perturbation steps.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Formula: <span className="text-cyan-300">AFS = (AUC_ins - AUC_del + 1) / 2</span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="fraction"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: 'Fraction of Pixels Perturbed (%)',
                    position: 'insideBottomRight',
                    offset: -5,
                    fill: '#64748b',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: 'Salience Response',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161f30',
                    borderColor: '#2a374a',
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }}
                />
                <Line
                  type="monotone"
                  dataKey="insertion"
                  name="Insertion Curve (Restoring Salient Pixels)"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#14b8a6' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="deletion"
                  name="Deletion Curve (Perturbing Salient Pixels)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300">Faithfulness audit has not been executed yet.</p>
            <p className="text-slate-500">
              Click &quot;Start Faithfulness Audit&quot; above to compute genuine insertion &amp; deletion
              trajectories.
            </p>
          </div>
        )}
      </div>

      {/* Methodology Description */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs leading-relaxed text-slate-300">
        <h4 className="font-semibold text-white flex items-center gap-1.5">
          <Info className="w-4 h-4 text-cyan-400" />
          Audit Methodology Explanation
        </h4>
        <p>
          The <strong>Insertion Curve</strong> starts with a blurred/neutral baseline image and
          progressively inserts pixels from the original image in descending order of their
          detected saliency. A faithful explanation causes confidence to rise sharply (high AUC).
        </p>
        <p>
          The <strong>Deletion Curve</strong> starts with the original image and progressively
          removes/replaces pixels with surrounding baseline tissue in descending order of saliency.
          A faithful explanation causes rapid drop in response (low AUC).
        </p>
        <p className="text-slate-400">
          The <strong>Aggregated Faithfulness Score (AFS)</strong> normalizes both into a unified
          metric between 0 and 1. Scores ≥ 0.85 fulfill the demonstration safety condition.
        </p>
      </div>
    </div>
  );
};
