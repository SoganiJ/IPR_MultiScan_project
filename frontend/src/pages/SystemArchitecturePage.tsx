import React, { useState } from 'react';
import {
  Network,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface ModuleDef {
  id: string;
  name: string;
  title: string;
  status: string;
  description: string;
  inputs: string[];
  outputs: string[];
  type: 'genuine_image_processing' | 'computational_proxy' | 'heuristic_rule';
  details: string;
}

const MODULES: Record<string, ModuleDef> = {
  '100': {
    id: '100',
    name: 'Image Acquisition & Validation',
    title: 'Module [100]: Input Validation & Normalization',
    status: 'Implemented',
    description: 'Header validation, magic-byte format detection, dimension checks, and DICOM metadata parsing.',
    inputs: ['Raw File Byte Buffer (PNG, JPG, TIFF, BMP, DICOM)'],
    outputs: ['Validated Grayscale NumPy ndarray (uint8)', 'ImageMetadata Schema'],
    type: 'genuine_image_processing',
    details: 'Validates file integrity, enforces size/dimension limits (≤ 50MB, 32-4096px), and extracts intensity statistics.',
  },
  '101': {
    id: '101',
    name: 'Preprocessing & Wavelet Decomposition',
    title: 'Module [101]: Wavelet Transform & Contrast Enhancement',
    status: 'Implemented',
    description: 'Bilateral/Gaussian denoising, adaptive CLAHE contrast enhancement, and 2D Discrete Wavelet Transform (DWT).',
    inputs: ['Grayscale Normalized Image'],
    outputs: ['Processed Spatial Image (512x512)', '7 Wavelet Subbands (LL, LH1, HL1, HH1, LH2, HL2, HH2)'],
    type: 'genuine_image_processing',
    details: 'Uses PyWavelets with Daubechies/Haar/Symlet wavelets to extract multi-resolution frequency bands for boundary isolation.',
  },
  '102': {
    id: '102',
    name: 'Dual-Branch Multi-Scale Features',
    title: 'Module [102]: Multi-Scale Cross-Scale Integration',
    status: 'Implemented',
    description: 'Separates low-frequency anatomical baseline from high-frequency directional edge subbands, combining across scales.',
    inputs: ['Wavelet Decomposition Subband Pyramids'],
    outputs: ['Integrated Cross-Scale Saliency Heatmap (0.0 to 1.0)'],
    type: 'genuine_image_processing',
    details: 'Weights and normalizes horizontal, vertical, and diagonal detail energy into a unified morphological saliency map.',
  },
  '103': {
    id: '103',
    name: 'Counterfactual & Candidate Detection',
    title: 'Module [103]: Counterfactual Comparison & Localization',
    status: 'Implemented',
    description: 'Segments candidate bounding regions and computes counterfactual difference maps against a reference baseline.',
    inputs: ['Processed Image', 'Cross-Scale Saliency Heatmap'],
    outputs: ['CandidateRegion[] with Bounding Boxes', 'Reference Baseline Image', 'Difference Heatmap'],
    type: 'computational_proxy',
    details: 'Segments local maxima into bounded candidates and estimates a computational background reference via adaptive Gaussian filtering.',
  },
  '104': {
    id: '104',
    name: 'Clinical Concept Attribution',
    title: 'Module [104]: Morphological Concept Descriptors',
    status: 'Implemented',
    description: 'Extracts 12 quantifiable shape, texture, and intensity descriptors with clinical morphological translations.',
    inputs: ['CandidateRegion', 'Processed Image', 'Wavelet Subbands'],
    outputs: ['ConceptAttribution Vector (12 descriptors)', 'Clinical Observations'],
    type: 'genuine_image_processing',
    details: 'Measures compactness, eccentricity, border irregularity, contrast ratio, and high-frequency wavelet energy.',
  },
  '105': {
    id: '105',
    name: 'Uncertainty & Faithfulness Audit',
    title: 'Module [105]: Calibrated Uncertainty & Pixel Perturbation',
    status: 'Implemented',
    description: '5-factor calibrated uncertainty proxy and insertion/deletion pixel-flipping faithfulness auditing.',
    inputs: ['CandidateRegion', 'Image Statistics', 'Preprocessing Settings'],
    outputs: ['UncertaintyData (0.0 to 1.0)', 'AuditResult (AFS Score, Insertion/Deletion Curves)'],
    type: 'computational_proxy',
    details: 'Computes trapezoidal Area Under the Curve (AUC) for progressive pixel restoration and occlusion to yield AFS.',
  },
  '106': {
    id: '106',
    name: 'Safety Routing & Escalation',
    title: 'Module [106]: Decision Routing & Threshold Policy',
    status: 'Implemented',
    description: 'Applies dual demonstration thresholds (AFS ≥ 0.85 and Uncertainty ≤ 0.15) to route cases to REVIEW_READY or REVIEW_REQUIRED.',
    inputs: ['Aggregated Faithfulness Score (AFS)', 'Uncertainty Score'],
    outputs: ['SafetyResult (Status, Escalation Reasons, Policy Note)'],
    type: 'heuristic_rule',
    details: 'Enforces fail-safe escalation. Missing, corrupted, or sub-threshold audits automatically trigger REVIEW_REQUIRED.',
  },
};

export const SystemArchitecturePage: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('103');

  const selectedModule = MODULES[selectedModuleId] || MODULES['100'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            System Architecture
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Pipeline Architecture & Data Flow Diagram
          </h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          End-to-end data processing workflow across Modules [100] through [106].
        </p>
      </div>

      {/* Interactive SVG Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            Interactive System Flowchart (Click any module to inspect)
          </span>
          <span className="text-xs text-slate-500 font-mono">Modules [100] – [106]</span>
        </div>

        {/* SVG Diagram Canvas */}
        <div className="w-full overflow-x-auto py-4">
          <div className="min-w-[780px] max-w-4xl mx-auto relative">
            <svg viewBox="0 0 820 420" className="w-full h-auto select-none font-sans">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
                </marker>
                <marker
                  id="arrowhead-amber"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                </marker>
                <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="boxGradActive" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#083344" />
                  <stop offset="100%" stopColor="#164e63" />
                </linearGradient>
              </defs>

              {/* Data Flow Connections */}
              {/* [100] -> [101] */}
              <line x1="120" y1="70" x2="180" y2="70" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="150" y="60" fill="#94a3b8" fontSize="9" textAnchor="middle">Image</text>

              {/* [101] -> [102] */}
              <line x1="300" y1="70" x2="360" y2="70" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="330" y="60" fill="#94a3b8" fontSize="9" textAnchor="middle">Subbands</text>

              {/* [102] -> [103] */}
              <line x1="480" y1="70" x2="540" y2="70" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="510" y="60" fill="#94a3b8" fontSize="9" textAnchor="middle">Features</text>

              {/* [103] -> [104] */}
              <line x1="660" y1="70" x2="720" y2="70" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="690" y="60" fill="#94a3b8" fontSize="9" textAnchor="middle">Candidates</text>

              {/* Branching from [101] down to [105] */}
              <path d="M 240 105 L 240 230 L 400 230" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead)" />
              <text x="260" y="220" fill="#94a3b8" fontSize="9">Image Stats</text>

              {/* Branching from [103] down to [105] */}
              <path d="M 600 105 L 600 230 L 525 230" fill="none" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="575" y="220" fill="#94a3b8" fontSize="9">Candidate Mask</text>

              {/* [105] -> [106] */}
              <line x1="460" y1="265" x2="460" y2="320" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowhead-amber)" />
              <text x="495" y="295" fill="#f59e0b" fontSize="9" textAnchor="start">AFS + Uncertainty</text>

              {/* MODULE NODES */}
              {/* [100] */}
              <g onClick={() => setSelectedModuleId('100')} className="cursor-pointer">
                <rect
                  x="20" y="35" width="100" height="70" rx="8"
                  fill={selectedModuleId === '100' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '100' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '100' ? 2 : 1}
                />
                <text x="70" y="58" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">[100] Validation</text>
                <text x="70" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle">Acquisition</text>
                <text x="70" y="88" fill="#64748b" fontSize="8" textAnchor="middle">&amp; DICOM</text>
              </g>

              {/* [101] */}
              <g onClick={() => setSelectedModuleId('101')} className="cursor-pointer">
                <rect
                  x="180" y="35" width="120" height="70" rx="8"
                  fill={selectedModuleId === '101' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '101' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '101' ? 2 : 1}
                />
                <text x="240" y="58" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">[101] Wavelet</text>
                <text x="240" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle">CLAHE + Denoise</text>
                <text x="240" y="88" fill="#64748b" fontSize="8" textAnchor="middle">2D DWT Decomposition</text>
              </g>

              {/* [102] */}
              <g onClick={() => setSelectedModuleId('102')} className="cursor-pointer">
                <rect
                  x="360" y="35" width="120" height="70" rx="8"
                  fill={selectedModuleId === '102' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '102' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '102' ? 2 : 1}
                />
                <text x="420" y="58" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">[102] Dual Branch</text>
                <text x="420" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle">Multi-Scale Energy</text>
                <text x="420" y="88" fill="#64748b" fontSize="8" textAnchor="middle">Cross-Scale Fusion</text>
              </g>

              {/* [103] */}
              <g onClick={() => setSelectedModuleId('103')} className="cursor-pointer">
                <rect
                  x="540" y="35" width="120" height="70" rx="8"
                  fill={selectedModuleId === '103' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '103' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '103' ? 2 : 1}
                />
                <text x="600" y="58" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">[103] Counterfactual</text>
                <text x="600" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle">Candidates Segment</text>
                <text x="600" y="88" fill="#64748b" fontSize="8" textAnchor="middle">Difference Heatmap</text>
              </g>

              {/* [104] */}
              <g onClick={() => setSelectedModuleId('104')} className="cursor-pointer">
                <rect
                  x="720" y="35" width="90" height="70" rx="8"
                  fill={selectedModuleId === '104' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '104' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '104' ? 2 : 1}
                />
                <text x="765" y="58" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">[104] Concept</text>
                <text x="765" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle">12 Clinical</text>
                <text x="765" y="88" fill="#64748b" fontSize="8" textAnchor="middle">Descriptors</text>
              </g>

              {/* [105] */}
              <g onClick={() => setSelectedModuleId('105')} className="cursor-pointer">
                <rect
                  x="400" y="195" width="125" height="70" rx="8"
                  fill={selectedModuleId === '105' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '105' ? '#06b6d4' : '#334155'}
                  strokeWidth={selectedModuleId === '105' ? 2 : 1}
                />
                <text x="462" y="218" fill="#2dd4bf" fontSize="11" fontWeight="bold" textAnchor="middle">[105] Uncertainty</text>
                <text x="462" y="235" fill="#94a3b8" fontSize="9" textAnchor="middle">5-Factor Heuristics</text>
                <text x="462" y="248" fill="#64748b" fontSize="8" textAnchor="middle">AFS Faithfulness Audit</text>
              </g>

              {/* [106] */}
              <g onClick={() => setSelectedModuleId('106')} className="cursor-pointer">
                <rect
                  x="390" y="325" width="145" height="70" rx="8"
                  fill={selectedModuleId === '106' ? 'url(#boxGradActive)' : 'url(#boxGrad)'}
                  stroke={selectedModuleId === '106' ? '#f59e0b' : '#d97706'}
                  strokeWidth={selectedModuleId === '106' ? 2 : 1}
                />
                <text x="462" y="348" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">[106] Safety Routing</text>
                <text x="462" y="365" fill="#fde68a" fontSize="9" textAnchor="middle">AFS ≥ 0.85 &amp; U ≤ 0.15</text>
                <text x="462" y="378" fill="#f59e0b" fontSize="8" textAnchor="middle">REVIEW_READY / REQUIRED</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Module Detail Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
              Module [{selectedModule.id}]
            </span>
            <h3 className="text-lg font-bold text-white">{selectedModule.name}</h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              selectedModule.type === 'genuine_image_processing'
                ? 'bg-teal-950 text-teal-300 border border-teal-800'
                : selectedModule.type === 'computational_proxy'
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {selectedModule.type === 'genuine_image_processing' && 'Genuine Image Processing (CPU)'}
            {selectedModule.type === 'computational_proxy' && 'Computational Baseline Proxy'}
            {selectedModule.type === 'heuristic_rule' && 'Threshold Rule Engine'}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{selectedModule.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 font-sans font-semibold block mb-1">
              Input Contracts
            </span>
            <ul className="space-y-1 text-slate-300">
              {selectedModule.inputs.map((inp, i) => (
                <li key={i}>• {inp}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 font-sans font-semibold block mb-1">
              Output Contracts
            </span>
            <ul className="space-y-1 text-cyan-300">
              {selectedModule.outputs.map((out, i) => (
                <li key={i}>• {out}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40 text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-200">Implementation Details: </span>
          {selectedModule.details}
        </div>
      </div>
    </div>
  );
};
