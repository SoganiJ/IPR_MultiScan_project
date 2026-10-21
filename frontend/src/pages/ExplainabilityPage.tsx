import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { api } from '../services/api';
import {
  Sparkles,
  Layers,
  Sliders,
  Info,
  BarChart2,
  Eye,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const ExplainabilityPage: React.FC = () => {
  const { currentAnalysis, selectedCandidateId, loadDemoCase, setActiveTab } = useAnalysis();

  const [activeView, setActiveView] = useState<'difference' | 'overlay' | 'reference'>('difference');
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  if (!currentAnalysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Analysis Loaded</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Run an analysis or load a synthetic test case to view counterfactual difference heatmaps
          and clinical concept attribution.
        </p>
        <button
          onClick={() => loadDemoCase('sample_001')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition"
        >
          <Sparkles className="w-4 h-4" /> Load Sample Case 1
        </button>
      </div>
    );
  }

  const analysisId = currentAnalysis.analysis_id;
  const cfStats = currentAnalysis.counterfactual_statistics;
  const attribution = currentAnalysis.concept_attribution;
  const candidates = currentAnalysis.candidates || [];

  // Prepare radar/bar data from concept attribution descriptors
  const radarData = attribution?.descriptors
    ? Object.entries(attribution.descriptors).map(([key, desc]) => ({
        subject: desc.name || key,
        score: Math.round(desc.normalized_score * 100),
        raw: desc.value,
        interpretation: desc.clinical_interpretation,
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Module [103] – [104]
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Counterfactual Visualization & Concept Attribution
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Algorithmic reference reconstruction, difference heatmaps, and morphological concept
          attribution vectors.
        </p>
      </div>

      {/* Grid: Counterfactual Gallery (7 cols) + Difference Metrics (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {activeView === 'difference' && 'Counterfactual Difference Heatmap (Colormapped)'}
                {activeView === 'overlay' && 'Alpha Blended Anomaly Overlay on Original Scan'}
                {activeView === 'reference' && 'Computational Reference Baseline (Healthy Tissue)'}
              </span>

              {/* View Switcher */}
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setActiveView('difference')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeView === 'difference'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Difference
                </button>
                <button
                  onClick={() => setActiveView('overlay')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeView === 'overlay'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Overlay
                </button>
                <button
                  onClick={() => setActiveView('reference')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeView === 'reference'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Reference
                </button>
              </div>
            </div>

            {/* Image Box */}
            <div className="aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 relative">
              <img
                src={api.getImageUrl(analysisId, activeView as any)}
                alt="Counterfactual view"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-cyan-300 font-mono">
                {activeView.toUpperCase()}
              </div>
            </div>

            {/* 3-thumbnail comparison row */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div
                onClick={() => setActiveView('reference')}
                className={`p-2 rounded-lg border cursor-pointer transition text-center ${
                  activeView === 'reference'
                    ? 'border-cyan-500 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="aspect-square w-full rounded overflow-hidden bg-black mb-1">
                  <img
                    src={api.getImageUrl(analysisId, 'reference')}
                    alt="Reference"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-slate-400">1. Reference</span>
              </div>

              <div
                onClick={() => setActiveView('difference')}
                className={`p-2 rounded-lg border cursor-pointer transition text-center ${
                  activeView === 'difference'
                    ? 'border-cyan-500 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="aspect-square w-full rounded overflow-hidden bg-black mb-1">
                  <img
                    src={api.getImageUrl(analysisId, 'difference')}
                    alt="Difference"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-cyan-300">2. Diff Heatmap</span>
              </div>

              <div
                onClick={() => setActiveView('overlay')}
                className={`p-2 rounded-lg border cursor-pointer transition text-center ${
                  activeView === 'overlay'
                    ? 'border-cyan-500 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="aspect-square w-full rounded overflow-hidden bg-black mb-1">
                  <img
                    src={api.getImageUrl(analysisId, 'overlay')}
                    alt="Overlay"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-teal-300">3. Overlay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Counterfactual Statistics & Methodology (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Counterfactual Difference Metrics
            </h3>

            {cfStats ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 text-[11px] block">Mean Diff (Intensity)</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    {cfStats.mean_difference?.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 text-[11px] block">Max Diff Peak</span>
                  <span className="text-base font-bold text-cyan-300 mt-1 block">
                    {cfStats.max_difference?.toFixed(1)} / 255
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 text-[11px] block">Altered Pixel Ratio</span>
                  <span className="text-base font-bold text-teal-300 mt-1 block">
                    {((cfStats.altered_pixel_ratio || 0) * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 text-[11px] block">Energy Shift</span>
                  <span className="text-base font-bold text-sky-300 mt-1 block">
                    {((cfStats.relative_energy_shift || 0) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">No difference metrics recorded.</div>
            )}

            {/* Methodology Alert */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Reference Baseline Methodology</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The reference image is generated via large-scale adaptive Gaussian background
                estimation, serving as an algorithmic approximation of healthy surrounding tissue.
                In a production clinical model, this baseline would be synthesized by a trained
                healthy-anatomy generative network (e.g. Counterfactual Diffusion).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Attribution Section */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
                Module [104]
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Clinical Concept Attribution Descriptors
              </h3>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Translating low-level wavelet and morphological features into interpretable clinical
              descriptors.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setChartType('radar')}
              className={`px-3 py-1 rounded font-medium transition ${
                chartType === 'radar'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Radar Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded font-medium transition ${
                chartType === 'bar'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bar Chart
            </button>
          </div>
        </div>

        {radarData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Chart Column (7 cols) */}
            <div className="lg:col-span-7 h-80 w-full flex items-center justify-center">
              {chartType === 'radar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#2a374a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Radar
                      name="Concept Attribution"
                      dataKey="score"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={radarData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} stroke="#475569" />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161f30',
                        borderColor: '#2a374a',
                        color: '#f8fafc',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="score" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Observations & Attribution Summary (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <span className="font-semibold text-white block">Attribution Summary</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {attribution?.attribution_summary ||
                    'Clinical concept attribution derived from morphological and wavelet descriptors.'}
                </p>
              </div>

              {attribution?.observations && attribution.observations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <span className="font-semibold text-teal-300 block">
                    Morphological Observations
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    {attribution.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No concept attribution data available. Please detect candidates first.
          </div>
        )}
      </div>
    </div>
  );
};
