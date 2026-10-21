import React from 'react';
import { ShieldAlert, BookOpen, ExternalLink, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#0b0f17] text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Research Disclaimer Card */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-200/90 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300">
              Research Prototype Notice & Clinical Safety Disclaimer
            </h4>
            <p className="text-slate-300 leading-relaxed text-xs">
              This system is an experimental computer vision research prototype exploring explainable
              counterfactual reasoning and multi-scale wavelet decomposition for lesion localization.
              All candidate detections, difference maps, uncertainty metrics, and safety flags are
              generated algorithmically on CPU and <strong>must not</strong> be used as clinical
              diagnoses, medical advice, or safety clearance for patient management.
            </p>
          </div>
        </div>

        {/* Modules & Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800/80">
          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Architecture Modules</h5>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>[100] Image Acquisition & DICOM</li>
              <li>[101] Preprocessing & Wavelet (DWT)</li>
              <li>[102] Dual-Branch Multi-Scale Features</li>
              <li>[103] Counterfactual & Candidate Detect</li>
              <li>[104] Concept Attribution Descriptors</li>
              <li>[105] Uncertainty & Faithfulness (AFS)</li>
              <li>[106] Safety Routing & Escalation</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Implementation Truths</h5>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• Genuine 2D Discrete Wavelet Transform</li>
              <li>• Algorithmic candidate localization (CPU)</li>
              <li>• Computational background reference baseline</li>
              <li>• Pixel-perturbation insertion/deletion audit</li>
              <li>• 5-factor calibrated uncertainty proxy</li>
              <li>• Zero external GPU or paid API dependencies</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">Safety Thresholds (Demo)</h5>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>
                • Aggregated Faithfulness (AFS): <span className="font-mono text-cyan-400">≥ 0.85</span>
              </li>
              <li>
                • Total Uncertainty Score: <span className="font-mono text-cyan-400">≤ 0.15</span>
              </li>
              <li>• Fail-safe: Missing or NaN audit routes to REVIEW_REQUIRED</li>
              <li>• Status REVIEW_READY indicates passing demo threshold only</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 mb-2">API Documentation</h5>
            <p className="text-[11px] text-slate-400 mb-2">
              FastAPI backend running locally with OpenAPI interactive documentation.
            </p>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition text-[11px] font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Swagger Docs (/docs)
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          EMCL-CU Research Prototype © {new Date().getFullYear()} · Medical Imaging Computer Vision Prototype
        </div>
      </div>
    </footer>
  );
};
