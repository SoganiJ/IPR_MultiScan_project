import {
  AnalysisResponse,
  AuditResult,
  BenchmarkResponse,
  ArchitectureResponse,
  SampleCase,
  ExportReport,
  PreprocessingSettings,
  CounterfactualSettings,
} from '../types/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Demo Cases
  async getDemoCases(): Promise<{ cases: SampleCase[]; count: number }> {
    const res = await fetch(`${API_BASE}/demo/cases`);
    if (!res.ok) throw new Error('Failed to load sample cases');
    return res.json();
  },

  getDemoImageUrl(caseId: string): string {
    return `${API_BASE}/demo/cases/${caseId}/image`;
  },

  // Analyze Image
  async analyze(
    file: File,
    preprocessing?: Partial<PreprocessingSettings>,
    counterfactual?: Partial<CounterfactualSettings>
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (preprocessing) {
      if (preprocessing.denoise_method) params.append('denoise_method', preprocessing.denoise_method);
      if (preprocessing.denoise_strength) params.append('denoise_strength', preprocessing.denoise_strength.toString());
      if (preprocessing.contrast_method) params.append('contrast_method', preprocessing.contrast_method);
      if (preprocessing.clahe_clip) params.append('clahe_clip', preprocessing.clahe_clip.toString());
      if (preprocessing.clahe_grid) params.append('clahe_grid', preprocessing.clahe_grid.toString());
      if (preprocessing.wavelet) params.append('wavelet', preprocessing.wavelet);
      if (preprocessing.wavelet_level) params.append('wavelet_level', preprocessing.wavelet_level.toString());
      if (preprocessing.processing_size) params.append('processing_size', preprocessing.processing_size.toString());
    }

    if (counterfactual) {
      if (counterfactual.reference_method) params.append('reference_method', counterfactual.reference_method);
      if (counterfactual.kernel_size) params.append('kernel_size', counterfactual.kernel_size.toString());
      if (counterfactual.colormap) params.append('colormap', counterfactual.colormap);
      if (counterfactual.overlay_opacity !== undefined) params.append('overlay_opacity', counterfactual.overlay_opacity.toString());
    }

    const url = `${API_BASE}/analyze?${params.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(errorData.detail || errorData.message || 'Image analysis failed');
    }

    return res.json();
  },

  // List analyses
  async listAnalyses(): Promise<{ analyses: any[]; count: number }> {
    const res = await fetch(`${API_BASE}/analyze/list`);
    if (!res.ok) throw new Error('Failed to list analyses');
    return res.json();
  },

  // Get specific analysis
  async getAnalysis(id: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/analyze/${id}`);
    if (!res.ok) throw new Error(`Failed to load analysis ${id}`);
    return res.json();
  },

  // Image URL generator
  getImageUrl(
    analysisId: string,
    imageType:
      | 'original'
      | 'processed'
      | 'candidates'
      | 'reference'
      | 'difference'
      | 'overlay'
      | 'feature_heatmap'
      | 'wavelet_LL'
      | 'wavelet_LH1'
      | 'wavelet_HL1'
      | 'wavelet_HH1'
      | 'wavelet_LH2'
      | 'wavelet_HL2'
      | 'wavelet_HH2'
  ): string {
    return `${API_BASE}/analyze/${analysisId}/image/${imageType}`;
  },

  // Run audit
  async runAudit(
    analysisId: string,
    candidateId: number = 0,
    numSteps: number = 20
  ): Promise<AuditResult> {
    const res = await fetch(`${API_BASE}/analyze/${analysisId}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidateId,
        num_steps: numSteps,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Audit failed' }));
      throw new Error(err.detail || 'Faithfulness audit failed');
    }

    const data = await res.json();
    return data.audit_result || data;
  },

  // Export report
  async exportReport(analysisId: string): Promise<ExportReport> {
    const res = await fetch(`${API_BASE}/analyze/${analysisId}/export`);
    if (!res.ok) throw new Error('Export report failed');
    return res.json();
  },

  // Benchmark
  async getBenchmark(): Promise<BenchmarkResponse> {
    const res = await fetch(`${API_BASE}/benchmark`);
    if (!res.ok) throw new Error('Failed to load benchmark data');
    return res.json();
  },

  // Architecture
  async getArchitecture(): Promise<ArchitectureResponse> {
    const res = await fetch(`${API_BASE}/architecture`);
    if (!res.ok) throw new Error('Failed to load architecture data');
    return res.json();
  },
};
