import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { api } from '../services/api';
import {
  Layers,
  Sparkles,
  BarChart2,
  Maximize2,
  CheckCircle,
  Eye,
  Sliders,
  Crosshair,
  Info,
  ChevronRight,
} from 'lucide-react';

export const ImageProcessingPage: React.FC = () => {
  const { currentAnalysis, selectedCandidateId, setSelectedCandidateId, setActiveTab, loadDemoCase } =
    useAnalysis();

  const [activeSubband, setActiveSubband] = useState<string>('LL');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'candidates' | 'features'>('candidates');

  if (!currentAnalysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Image Analysis Active</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please run an analysis or load a synthetic test case to view multi-scale wavelet
          decomposition, image statistics, and localized candidates.
        </p>
        <button
          onClick={() => loadDemoCase('sample_001')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition"
        >
          <Sparkles className="w-4 h-4" /> Load Sample Case 1 (Subtle Feature)
        </button>
      </div>
    );
  }

  const analysisId = currentAnalysis.analysis_id;
  const candidates = currentAnalysis.candidates || [];
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  const stats = currentAnalysis.image_statistics;
  const waveletMeta = currentAnalysis.wavelet_metadata;

  const subbandKeys = [
    { key: 'wavelet_LL', label: 'LL (Low-Low)', desc: 'Approximation / Base Tissue' },
    { key: 'wavelet_LH1', label: 'LH1 (Level 1)', desc: 'Horizontal Edges' },
    { key: 'wavelet_HL1', label: 'HL1 (Level 1)', desc: 'Vertical Edges' },
    { key: 'wavelet_HH1', label: 'HH1 (Level 1)', desc: 'Diagonal High-Frequency' },
    { key: 'wavelet_LH2', label: 'LH2 (Level 2)', desc: 'Coarse Horizontal Details' },
    { key: 'wavelet_HL2', label: 'HL2 (Level 2)', desc: 'Coarse Vertical Details' },
    { key: 'wavelet_HH2', label: 'HH2 (Level 2)', desc: 'Coarse Diagonal Details' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Module [101] – [103]
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Multi-Scale Preprocessing & Wavelet Decomposition
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Analysis ID: <span className="font-mono text-cyan-400">{analysisId}</span> · Wavelet:{' '}
            <span className="font-mono text-teal-300">{waveletMeta?.wavelet || 'db2'} (Level {waveletMeta?.level || 2})</span> ·
            Candidates Localized: <span className="font-semibold text-white">{candidates.length}</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('candidates')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              viewMode === 'candidates'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Candidates Overlay
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Original vs Processed
          </button>
          <button
            onClick={() => setViewMode('features')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              viewMode === 'features'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Feature Heatmap
          </button>
        </div>
      </div>

      {/* Main Image Viewer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold uppercase tracking-wider">
              <span>
                {viewMode === 'candidates' && 'Detected Candidates on CLAHE Processed Scan'}
                {viewMode === 'side-by-side' && 'Original (Left) vs Preprocessed CLAHE (Right)'}
                {viewMode === 'features' && 'Cross-Scale Integrated Feature Saliency Map'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                512 × 512 px
              </span>
            </div>

            <div className="aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 relative">
              {viewMode === 'candidates' && (
                <img
                  src={api.getImageUrl(analysisId, 'candidates')}
                  alt="Candidates overlay"
                  className="w-full h-full object-contain"
                />
              )}

              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-2 w-full h-full">
                  <div className="relative border-r border-slate-800 flex items-center justify-center">
                    <img
                      src={api.getImageUrl(analysisId, 'original')}
                      alt="Original scan"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-slate-300 font-mono">
                      Original
                    </span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <img
                      src={api.getImageUrl(analysisId, 'processed')}
                      alt="Processed scan"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-cyan-300 font-mono">
                      CLAHE + Denoise
                    </span>
                  </div>
                </div>
              )}

              {viewMode === 'features' && (
                <img
                  src={api.getImageUrl(analysisId, 'feature_heatmap')}
                  alt="Feature heatmap"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Image Statistics Panel */}
          {stats && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Genuine Image Statistics (Data-Derived)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Mean / Median</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {stats.mean?.toFixed(1)} / {stats.median?.toFixed(1)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Standard Dev</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    {stats.std?.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Shannon Entropy</div>
                  <div className="text-sm font-bold text-teal-300 mt-1">
                    {stats.entropy?.toFixed(3)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[11px] text-slate-400">Estimated SNR</div>
                  <div className="text-sm font-bold text-sky-300 mt-1">
                    {stats.snr_db?.toFixed(1)} dB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Candidate List & Selected Candidate Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                Localized Candidate Regions ({candidates.length})
              </h3>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            {candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No high-saliency candidate regions localized above detection threshold.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {candidates.map((c) => {
                  const isSel = c.id === selectedCandidateId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSel
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">
                            Region #{c.id}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                            Saliency: {c.saliency_score?.toFixed(3)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          BBox: [{c.bbox.x}, {c.bbox.y}, {c.bbox.w}×{c.bbox.h}] · Area:{' '}
                          {c.area} px
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ${
                          isSel ? 'text-cyan-400 translate-x-1' : 'text-slate-500'
                        } transition`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Candidate Detailed Metrics */}
            {selectedCandidate && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">
                    Candidate #{selectedCandidate.id} Morphological Descriptors
                  </span>
                  <button
                    onClick={() => setActiveTab('explainability')}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Counterfactual Explanations &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">Contrast Ratio</span>
                    <span className="text-white font-semibold">
                      {selectedCandidate.features.contrast?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">Compactness</span>
                    <span className="text-white font-semibold">
                      {selectedCandidate.features.compactness?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">Eccentricity</span>
                    <span className="text-white font-semibold">
                      {selectedCandidate.features.eccentricity?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">Border Irregularity</span>
                    <span className="text-white font-semibold">
                      {selectedCandidate.features.border_irregularity?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-200/90 leading-relaxed">
                  <span className="font-semibold text-cyan-300">Methodology Note:</span> Candidate
                  regions are segmented algorithmically on CPU from cross-scale integrated wavelet
                  detail energy. These represent morphological candidates for research analysis,
                  NOT confirmed pathological lesions.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wavelet Subbands Gallery */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              2D Discrete Wavelet Transform Subbands Gallery
            </h3>
            <p className="text-xs text-slate-400">
              Genuine PyWavelets decomposition capturing multi-frequency anatomical directional bands
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {waveletMeta?.wavelet || 'db2'} decomposition
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {subbandKeys.map((sb) => {
            const subbandName = sb.key.replace('wavelet_', '');
            const subbandData = waveletMeta?.subbands?.[subbandName];
            return (
              <div
                key={sb.key}
                onClick={() => setActiveSubband(subbandName)}
                className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  activeSubband === subbandName
                    ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-black mb-2 border border-slate-800 flex items-center justify-center">
                  <img
                    src={api.getImageUrl(analysisId, sb.key as any)}
                    alt={sb.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">{sb.label}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{sb.desc}</div>
                  {subbandData && (
                    <div className="mt-1 text-[10px] font-mono text-teal-400">
                      Energy: {subbandData.energy?.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
