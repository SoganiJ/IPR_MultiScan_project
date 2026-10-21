import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Award,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const BenchmarkResultsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMetricTab, setActiveMetricTab] = useState<'detection' | 'faithfulness' | 'calibration'>('detection');

  useEffect(() => {
    api
      .getBenchmark()
      .then((res) => setData(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Literature Evaluation
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Research Benchmark Comparisons
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Comparative empirical evaluations reported in the published EMCL-CU research document.
        </p>
      </div>

      {/* Mandatory Prominent Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/50 text-amber-200 space-y-1 shadow-lg">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Reported in the research document · Not independently reproduced by this prototype</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed pl-7">
          {data?.disclaimer ||
            'These benchmark figures are reported in the published research document and are presented here for architectural reference and comparison. This CPU prototype implementation has not undergone large-scale retrospective clinical validation.'}
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveMetricTab('detection')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeMetricTab === 'detection'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Detection Performance (AUC / Sensitivity / Specificity)
        </button>
        <button
          onClick={() => setActiveMetricTab('faithfulness')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeMetricTab === 'faithfulness'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Faithfulness Metrics (Insertion / Deletion / Pointing Game)
        </button>
        <button
          onClick={() => setActiveMetricTab('calibration')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeMetricTab === 'calibration'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Uncertainty Calibration (ECE / Brier / NLL)
        </button>
      </div>

      {/* View Content */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading benchmark figures...</div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Detection Performance */}
          {activeMetricTab === 'detection' && data?.detection_performance && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Detection Performance Comparison
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.detection_performance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="method" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" domain={[0.5, 1.0]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161f30',
                          borderColor: '#2a374a',
                          color: '#f8fafc',
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="auc" name="AUC (Area Under Curve)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sensitivity" name="Sensitivity (Recall)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="specificity" name="Specificity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">AUC</th>
                      <th className="pb-3 font-semibold">Sensitivity</th>
                      <th className="pb-3 font-semibold">Specificity</th>
                      <th className="pb-3 font-semibold">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.detection_performance.map((row: any) => {
                      const isProposed = row.method.includes('Proposed');
                      return (
                        <tr
                          key={row.method}
                          className={isProposed ? 'bg-cyan-950/30 text-cyan-200 font-semibold' : 'hover:bg-slate-800/30'}
                        >
                          <td className="py-3 font-sans text-white flex items-center gap-1.5">
                            {isProposed && <Award className="w-4 h-4 text-cyan-400" />}
                            {row.method}
                          </td>
                          <td className="py-3 text-cyan-300">{row.auc.toFixed(3)}</td>
                          <td className="py-3 text-teal-300">{row.sensitivity.toFixed(3)}</td>
                          <td className="py-3 text-blue-300">{row.specificity.toFixed(3)}</td>
                          <td className="py-3 text-slate-400">{row.latency_ms} ms</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Faithfulness Metrics */}
          {activeMetricTab === 'faithfulness' && data?.faithfulness_metrics && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Explainability Faithfulness & Pointing Game Accuracy
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.faithfulness_metrics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="method" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" domain={[0, 1.0]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161f30',
                          borderColor: '#2a374a',
                          color: '#f8fafc',
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="insertion_auc" name="Insertion AUC (Higher is better)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="deletion_auc" name="Deletion AUC (Lower is better)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Insertion AUC ↑</th>
                      <th className="pb-3 font-semibold">Deletion AUC ↓</th>
                      <th className="pb-3 font-semibold">Pointing Game (%) ↑</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.faithfulness_metrics.map((row: any) => {
                      const isProposed = row.method.includes('Proposed');
                      return (
                        <tr
                          key={row.method}
                          className={isProposed ? 'bg-cyan-950/30 text-cyan-200 font-semibold' : 'hover:bg-slate-800/30'}
                        >
                          <td className="py-3 font-sans text-white flex items-center gap-1.5">
                            {isProposed && <Award className="w-4 h-4 text-cyan-400" />}
                            {row.method}
                          </td>
                          <td className="py-3 text-emerald-400">{row.insertion_auc.toFixed(3)}</td>
                          <td className="py-3 text-amber-400">{row.deletion_auc.toFixed(3)}</td>
                          <td className="py-3 text-teal-300">{row.pointing_game.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Calibration Metrics */}
          {activeMetricTab === 'calibration' && data?.uncertainty_calibration && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Uncertainty Calibration Error Comparison (Lower is better)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.uncertainty_calibration} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="method" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" domain={[0, 0.5]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161f30',
                          borderColor: '#2a374a',
                          color: '#f8fafc',
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="ece" name="Expected Calibration Error (ECE)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="brier" name="Brier Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nll" name="Negative Log-Likelihood (NLL)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">ECE (Lower = Better)</th>
                      <th className="pb-3 font-semibold">Brier Score</th>
                      <th className="pb-3 font-semibold">NLL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.uncertainty_calibration.map((row: any) => {
                      const isProposed = row.method.includes('Proposed');
                      return (
                        <tr
                          key={row.method}
                          className={isProposed ? 'bg-cyan-950/30 text-cyan-200 font-semibold' : 'hover:bg-slate-800/30'}
                        >
                          <td className="py-3 font-sans text-white flex items-center gap-1.5">
                            {isProposed && <Award className="w-4 h-4 text-cyan-400" />}
                            {row.method}
                          </td>
                          <td className="py-3 text-cyan-300">{row.ece.toFixed(3)}</td>
                          <td className="py-3 text-blue-300">{row.brier.toFixed(3)}</td>
                          <td className="py-3 text-purple-300">{row.nll.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
