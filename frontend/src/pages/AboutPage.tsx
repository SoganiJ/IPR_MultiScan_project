import React from 'react';
import {
  Info,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Research Context & Methodology
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            About the EMCL-CU Research Prototype
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Theoretical motivations, architectural breakdown, and transparent implementation
          boundaries.
        </p>
      </div>

      {/* Core Motivation */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          The Clinical Challenge & Research Motivation
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Early detection of sub-millimeter lesions in radiological imaging (such as microcalcifications in
          mammography, early pulmonary nodules in low-dose CT, and subtle microbleeds in MRI) poses
          severe diagnostic challenges. Conventional deep learning classifiers frequently fail in
          clinical workflows due to three systemic vulnerabilities:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <span className="text-xs font-semibold text-cyan-300 block">1. Saliency Hallucination</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard post-hoc attribution methods (Grad-CAM, saliency maps) often produce diffuse,
              unfaithful heatmaps that highlight background artifacts rather than true morphological
              boundaries.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <span className="text-xs font-semibold text-teal-300 block">2. High-Frequency Loss</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard downsampling convolutions destroy fine directional edges and textural subtleties
              critical for distinguishing benign parenchymal tissue from early malignant spiculation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <span className="text-xs font-semibold text-amber-300 block">3. Overconfident Predictions</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Softmax probability scores are poorly calibrated, expressing near-100% certainty even on
              degraded, noisy, or out-of-distribution scans where human clinicians would hesitate.
            </p>
          </div>
        </div>
      </div>

      {/* Implemented vs Future Trained Models Comparison Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" />
              Transparent Implementation Accounting
            </h3>
            <p className="text-xs text-slate-400">
              Honest distinction between genuine image-processing components and computational proxies
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Zero GPU / Pure CPU</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Subsystem</th>
                <th className="pb-3 font-semibold">In this Prototype (Implemented)</th>
                <th className="pb-3 font-semibold">Full Clinical Vision (Future Work)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 font-semibold text-white">Wavelet Decomposition</td>
                <td className="py-3 text-cyan-300">
                  Genuine 2D Discrete Wavelet Transform (PyWavelets) extracting 7 directional subbands.
                </td>
                <td className="py-3 text-slate-400">
                  Learned wavelet filter-banks within an end-to-end differentiable neural network.
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Candidate Localization</td>
                <td className="py-3 text-cyan-300">
                  Algorithmic cross-scale detail energy integration &amp; morphological contour segmentation.
                </td>
                <td className="py-3 text-slate-400">
                  Multi-scale feature pyramid object detector (e.g., Mask R-CNN or Detection Transformer).
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Counterfactual Reference</td>
                <td className="py-3 text-teal-300">
                  Adaptive computational background estimation modeling surrounding healthy tissue.
                </td>
                <td className="py-3 text-slate-400">
                  Generative counterfactual diffusion model trained on healthy retrospective cohorts.
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Concept Attribution</td>
                <td className="py-3 text-cyan-300">
                  12 quantifiable morphological descriptors (compactness, eccentricity, contrast, etc.).
                </td>
                <td className="py-3 text-slate-400">
                  Concept Bottleneck Models (CBMs) mapped to verified BI-RADS / Lung-RADS lexicons.
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Faithfulness Audit</td>
                <td className="py-3 text-cyan-300">
                  Genuine pixel-perturbation insertion &amp; deletion curves with trapezoidal AUC &amp; AFS.
                </td>
                <td className="py-3 text-slate-400">
                  Shapley-value integrated gradient auditing evaluated across multi-institutional cohorts.
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Uncertainty Estimation</td>
                <td className="py-3 text-amber-300">
                  5-factor calibrated heuristic proxy incorporating SNR, entropy, and stability.
                </td>
                <td className="py-3 text-slate-400">
                  Deep Ensembles or Monte Carlo Dropout with formal conformal prediction sets.
                </td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-white">Safety Routing</td>
                <td className="py-3 text-amber-300">
                  Demonstration threshold policy (AFS ≥ 0.85 &amp; U ≤ 0.15) with fail-safe escalation.
                </td>
                <td className="py-3 text-slate-400">
                  Regulatory-cleared triaging pipeline with clinical radiologist-in-the-loop sign-off.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety & Ethics Disclaimer */}
      <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3 text-xs leading-relaxed text-amber-200/90">
        <h4 className="font-semibold text-amber-300 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Clinical Regulatory Disclaimer
        </h4>
        <p>
          The EMCL-CU prototype is designed purely as an academic research demonstrator to showcase
          interpretable multi-scale computer vision concepts without requiring heavy GPU clusters,
          proprietary API keys, or multi-gigabyte neural network weights.
        </p>
        <p>
          Status <strong>REVIEW_READY</strong> indicates solely that the demonstration mathematical
          thresholds were met for that specific scan. It does <em>not</em> constitute medical clearance,
          benignity verification, or absence of disease.
        </p>
      </div>
    </div>
  );
};
