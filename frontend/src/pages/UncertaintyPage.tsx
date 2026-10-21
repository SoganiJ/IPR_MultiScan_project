import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { SafetyBadge } from '../components/SafetyBadge';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Activity,
  ArrowRight,
  Sliders,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const UncertaintyPage: React.FC = () => {
  const { currentAnalysis, setActiveTab, loadDemoCase } = useAnalysis();

  if (!currentAnalysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Analysis Active</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Run an analysis or load a synthetic test case to view uncertainty decomposition and
          calibrated safety routing.
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

  const uncertainty = currentAnalysis.uncertainty;
  const safety = currentAnalysis.safety_result;
  const score = uncertainty?.uncertainty_score ?? 0;
  const factors = uncertainty?.factors;

  // Factors mapping
  const factorList = factors
    ? [
        {
          name: 'Image Quality Factor',
          val: factors.image_quality,
          desc: 'Signal-to-noise ratio and dynamic range adequacy',
        },
        {
          name: 'Candidate Strength Factor',
          val: factors.candidate_strength,
          desc: 'Confidence and saliency margin of segmented regions',
        },
        {
          name: 'Detection Consistency Factor',
          val: factors.detection_consistency,
          desc: 'Agreement between spatial and frequency subband detections',
        },
        {
          name: 'Perturbation Stability Factor',
          val: factors.stability,
          desc: 'Feature invariance under local smoothing and intensity noise',
        },
        {
          name: 'Information Sufficiency Factor',
          val: factors.information_sufficiency,
          desc: 'Local entropy and detail content sufficiency in bounding region',
        },
      ]
    : [];

  const isLowUncertainty = score <= 0.15;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
            Module [105] – [106]
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Calibrated Uncertainty Estimation & Safety Routing
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Multi-factor uncertainty breakdown and dual-condition safety escalation policy (AFS ≥ 0.85
          and Uncertainty ≤ 0.15).
        </p>
      </div>

      {/* Top Banner: Safety Routing Status */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Automated Safety Routing Decision
            </span>
            <div className="mt-2">
              <SafetyBadge safety={safety} size="lg" />
            </div>
          </div>

          {safety?.status !== 'REVIEW_READY' && (
            <button
              onClick={() => setActiveTab('audit')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition shrink-0"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Run Faithfulness Audit to update AFS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Safety Details Banner */}
        <SafetyBadge safety={safety} showDetails={true} />
      </div>

      {/* Grid: Uncertainty Gauge + 5-Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gauge / Score Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Aggregate Uncertainty Score
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Derived from weighted multi-scale heuristic factors.
            </p>
          </div>

          {/* Visual Meter */}
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-24 overflow-hidden mb-2">
              {/* Half-circle gauge background */}
              <div className="absolute inset-0 rounded-t-full border-[18px] border-slate-800" />
              {/* Threshold indicator line at 0.15 (15% of 180 deg = 27 deg) */}
              <div
                className={`absolute inset-0 rounded-t-full border-[18px] ${
                  isLowUncertainty ? 'border-emerald-500' : 'border-amber-500'
                } transition-all duration-700`}
                style={{
                  clipPath: `polygon(0 100%, 100% 100%, 100% 0, 0 0)`,
                  transform: `rotate(${Math.min(180, Math.max(0, score * 180 - 180))}deg)`,
                  transformOrigin: 'bottom center',
                }}
              />
            </div>

            <div className="text-4xl font-extrabold font-mono text-white">
              {score.toFixed(3)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold ${
                  isLowUncertainty ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {uncertainty?.qualitative_rating || (isLowUncertainty ? 'Low' : 'Moderate')} Rating
              </span>
              <span className="text-slate-500">· Threshold: ≤ 0.150</span>
            </div>
          </div>

          {/* Threshold Compliance Box */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Uncertainty Condition:</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isLowUncertainty ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isLowUncertainty ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Met (≤ 0.150)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Exceeded (&gt; 0.150)
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-700/40 pt-2">
              <span className="text-slate-300">Faithfulness AFS Condition:</span>
              <span className="font-semibold text-slate-400">
                {currentAnalysis.audit_result?.afs !== undefined ? (
                  currentAnalysis.audit_result.afs >= 0.85 ? (
                    <span className="text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Met ({currentAnalysis.audit_result.afs.toFixed(3)} ≥ 0.85)
                    </span>
                  ) : (
                    <span className="text-amber-400 inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Sub-threshold ({currentAnalysis.audit_result.afs.toFixed(3)} &lt; 0.85)
                    </span>
                  )
                ) : (
                  <span className="text-amber-400 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Audit Not Run
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Factor Decomposition Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white">5-Factor Uncertainty Breakdown</h3>
            <p className="text-xs text-slate-400 mt-1">
              Individual heuristic factors contributing to the overall confidence calibration.
            </p>
          </div>

          <div className="space-y-4">
            {factorList.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-200">{f.name}</span>
                    <span className="text-[11px] text-slate-500 block">{f.desc}</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {f.val?.toFixed(3) || '0.000'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (f.val || 0) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Methodology Truth:</span> In this
            prototype, uncertainty is estimated through genuine multi-scale image quality and
            stability heuristics. In production clinical deep learning architectures, uncertainty
            would be calibrated via Monte Carlo Dropout, Deep Ensembles, or Evidential Deep Learning.
          </div>
        </div>
      </div>
    </div>
  );
};
