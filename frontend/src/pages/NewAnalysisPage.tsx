import React, { useState, useEffect, useRef } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { api } from '../services/api';
import { SampleCase, PreprocessingSettings, CounterfactualSettings } from '../types/api';
import {
  Upload,
  FileImage,
  Sliders,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from 'lucide-react';

export const NewAnalysisPage: React.FC = () => {
  const { executeAnalysis, loadDemoCase, loading, loadingMessage } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [demoCases, setDemoCases] = useState<SampleCase[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [prepSettings, setPrepSettings] = useState<PreprocessingSettings>({
    denoise_method: 'gaussian',
    denoise_strength: 5,
    contrast_method: 'clahe',
    clahe_clip: 2.0,
    clahe_grid: 8,
    wavelet: 'db2',
    wavelet_level: 2,
    processing_size: 512,
  });

  const [cfSettings, setCfSettings] = useState<CounterfactualSettings>({
    reference_method: 'gaussian_background',
    kernel_size: 31,
    colormap: 'jet',
    overlay_opacity: 0.5,
  });

  useEffect(() => {
    api
      .getDemoCases()
      .then((res) => setDemoCases(res.cases))
      .catch((e) => console.error(e));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedSampleId(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setSelectedSampleId(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSelectSample = async (caseId: string) => {
    setSelectedSampleId(caseId);
    setSelectedFile(null);
    setPreviewUrl(api.getDemoImageUrl(caseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSampleId) {
      await loadDemoCase(selectedSampleId);
    } else if (selectedFile) {
      await executeAnalysis(selectedFile, prepSettings, cfSettings);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedSampleId(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Acquire & Analyze Image</h2>
        <p className="text-slate-400 text-sm mt-1">
          Module [100] – [103]: Upload an imaging scan (PNG, JPEG, TIFF, BMP, DICOM) or select a
          synthetic benchmark case.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload & Sample selection (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl cursor-pointer text-center transition flex flex-col items-center justify-center min-h-[220px] ${
                selectedFile
                  ? 'border-cyan-500 bg-cyan-950/20'
                  : 'border-slate-700 bg-slate-900/60 hover:border-cyan-500/60 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.bmp,.tiff,.tif,.dcm"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 text-cyan-400">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-white text-base">
                {selectedFile ? selectedFile.name : 'Choose an image or drag & drop'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supported formats: PNG, JPG, JPEG, TIFF, BMP, DICOM (.dcm). Maximum 50 MB.
              </p>
              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB loaded</span>
                </div>
              )}
            </div>

            {/* Synthetic Sample Cases Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Or Select a Synthetic Test Case
                </h4>
                <span className="text-xs text-slate-500">Programmatically generated (CPU)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoCases.map((c) => {
                  const isSelected = selectedSampleId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectSample(c.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            {c.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {c.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>
                      </div>
                      <div className="mt-2 text-[10px] text-teal-400/80 font-medium flex items-center gap-1">
                        <span>● Synthetic benchmark</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Preview & Parameters (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Image Preview Box */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-cyan-400" />
                  Input Preview
                </span>
                {(selectedFile || selectedSampleId) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {previewUrl ? (
                <div className="relative aspect-square max-h-72 w-full mx-auto rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Scan preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-slate-300">
                    {selectedSampleId ? `Synthetic: ${selectedSampleId}` : selectedFile?.name}
                  </div>
                </div>
              ) : (
                <div className="aspect-square max-h-72 w-full mx-auto rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
                  <FileImage className="w-10 h-10 mb-2 text-slate-600" />
                  Select an image or sample case to preview before starting analysis.
                </div>
              )}
            </div>

            {/* Advanced Preprocessing Controls Toggle */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  Pipeline Parameters (Wavelet & CLAHE)
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 text-xs border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Wavelet Family</label>
                      <select
                        value={prepSettings.wavelet}
                        onChange={(e) =>
                          setPrepSettings({ ...prepSettings, wavelet: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                      >
                        <option value="db2">Daubechies 2 (db2)</option>
                        <option value="haar">Haar</option>
                        <option value="db4">Daubechies 4 (db4)</option>
                        <option value="sym4">Symlet 4 (sym4)</option>
                        <option value="coif1">Coiflet 1 (coif1)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Wavelet Level</label>
                      <select
                        value={prepSettings.wavelet_level}
                        onChange={(e) =>
                          setPrepSettings({
                            ...prepSettings,
                            wavelet_level: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                      >
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2 (Recommended)</option>
                        <option value={3}>Level 3</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Contrast Enhancement</label>
                      <select
                        value={prepSettings.contrast_method}
                        onChange={(e) =>
                          setPrepSettings({ ...prepSettings, contrast_method: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                      >
                        <option value="clahe">CLAHE (Adaptive)</option>
                        <option value="histogram_eq">Global Histogram Eq</option>
                        <option value="none">None (Raw)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Denoise Method</label>
                      <select
                        value={prepSettings.denoise_method}
                        onChange={(e) =>
                          setPrepSettings({ ...prepSettings, denoise_method: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                      >
                        <option value="gaussian">Gaussian Filter</option>
                        <option value="bilateral">Bilateral (Edge-Preserving)</option>
                        <option value="nlm">Non-Local Means</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>CLAHE Clip Limit</span>
                      <span className="font-mono text-cyan-400">{prepSettings.clahe_clip}</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={6.0}
                      step={0.5}
                      value={prepSettings.clahe_clip}
                      onChange={(e) =>
                        setPrepSettings({
                          ...prepSettings,
                          clahe_clip: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Processing Size</span>
                      <span className="font-mono text-cyan-400">
                        {prepSettings.processing_size} × {prepSettings.processing_size}
                      </span>
                    </div>
                    <select
                      value={prepSettings.processing_size}
                      onChange={(e) =>
                        setPrepSettings({
                          ...prepSettings,
                          processing_size: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 outline-none"
                    >
                      <option value={256}>256 × 256 (Fast)</option>
                      <option value={512}>512 × 512 (Standard)</option>
                      <option value={1024}>1024 × 1024 (High-Res)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              type="submit"
              disabled={loading || (!selectedFile && !selectedSampleId)}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 text-slate-950 hover:opacity-95 shadow-lg shadow-cyan-500/25 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{loadingMessage || 'Executing Analysis Pipeline...'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Execute Multi-Scale Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
