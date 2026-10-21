export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'error';

export type SafetyStatus = 'REVIEW_READY' | 'REVIEW_REQUIRED' | 'PROCESSING_ERROR';

export interface ImageMetadata {
  filename: string;
  file_size_bytes: number;
  file_size_mb: floatNumber;
  width: number;
  height: number;
  channels: number;
  format?: string;
  detected_format?: string;
  extension?: string;
  intensity_min?: number;
  intensity_max?: number;
  intensity_mean?: number;
  is_dicom?: boolean;
  original_mode?: string | null;
  original_size?: number[] | null;
}

type floatNumber = number;

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CandidateFeatures {
  area: number;
  mean_intensity: number;
  max_intensity: number;
  contrast: number;
  saliency: number;
  aspect_ratio: number;
  compactness: number;
  eccentricity: number;
  perimeter: number;
  solidity: number;
  extent: number;
  border_irregularity: number;
  [key: string]: number;
}

export interface CandidateRegion {
  id: number;
  bbox: BoundingBox;
  center: { x: number; y: number };
  area: number;
  features: CandidateFeatures;
  saliency_score: number;
}

export interface SafetyResult {
  status: SafetyStatus;
  reasons: string[];
  values: {
    afs?: number | null;
    uncertainty?: number | null;
    [key: string]: any;
  };
  thresholds: {
    afs_threshold: number;
    uncertainty_threshold: number;
    [key: string]: number;
  };
  policy_note: string;
}

export interface VisualState {
  badge_color: string;
  badge_text: string;
  allow_export: boolean;
  banner_message: string;
}

export interface PreprocessingSettings {
  denoise_method: string;
  denoise_strength: number;
  contrast_method: string;
  clahe_clip: number;
  clahe_grid: number;
  wavelet: string;
  wavelet_level: number;
  processing_size: number;
}

export interface CounterfactualSettings {
  reference_method: string;
  kernel_size: number;
  colormap: string;
  overlay_opacity: number;
}

export interface ImageStatistics {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  snr_db: number;
  entropy: number;
  contrast: number;
  dynamic_range: number;
  skewness: number;
  kurtosis: number;
}

export interface WaveletSubbandStats {
  energy: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  shape: number[];
}

export interface WaveletMetadata {
  wavelet: string;
  level: number;
  subbands: {
    [key: string]: WaveletSubbandStats;
  };
}

export interface ConceptAttributionDescriptor {
  name: string;
  value: number;
  normalized_score: number;
  clinical_interpretation: string;
}

export interface ConceptAttribution {
  candidate_id: number;
  descriptors: {
    [key: string]: ConceptAttributionDescriptor;
  };
  observations: string[];
  attribution_summary: string;
}

export interface UncertaintyFactors {
  image_quality: number;
  candidate_strength: number;
  detection_consistency: number;
  stability: number;
  information_sufficiency: number;
}

export interface UncertaintyData {
  uncertainty_score: number;
  factors: UncertaintyFactors;
  qualitative_rating: 'Low' | 'Moderate' | 'High';
  methodology_note: string;
}

export interface AuditResult {
  candidate_id: number;
  num_steps: number;
  insertion_scores: number[];
  deletion_scores: number[];
  x_values: number[];
  auc_insertion: number;
  auc_deletion: number;
  afs: number;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: AnalysisStatus;
  image_metadata?: ImageMetadata;
  processing_settings?: PreprocessingSettings;
  image_statistics?: ImageStatistics;
  wavelet_metadata?: WaveletMetadata;
  candidates?: CandidateRegion[];
  counterfactual_statistics?: {
    mean_difference: number;
    max_difference: number;
    std_difference: number;
    altered_pixel_ratio: number;
    relative_energy_shift: number;
    [key: string]: any;
  };
  counterfactual_settings?: CounterfactualSettings;
  counterfactual_methodology?: string;
  concept_attribution?: ConceptAttribution | null;
  uncertainty?: UncertaintyData;
  audit_result?: AuditResult | null;
  safety_result?: SafetyResult;
  visual_state?: VisualState;
  processing_duration_ms?: number;
  implementation_notes?: string[];
  error?: string;
}

export interface SampleCase {
  id: string;
  name: string;
  description: string;
  category: string;
  is_synthetic: boolean;
}

export interface BenchmarkEntry {
  method: string;
  auc?: number;
  sensitivity?: number;
  specificity?: number;
  insertion_auc?: number;
  deletion_auc?: number;
  pointing_game?: number;
  latency_ms?: number;
  ece?: number;
  brier_score?: number;
  nll?: number;
}

export interface BenchmarkResponse {
  disclaimer: string;
  source: string;
  comparison_table: BenchmarkEntry[];
  uncertainty_calibration: {
    method: string;
    ece: number;
    brier_score: number;
    nll: number;
  }[];
  notes: string[];
}

export interface ArchitectureModule {
  id: string;
  name: string;
  title: string;
  status: string;
  description: string;
  inputs: string[];
  outputs: string[];
  implementation_type: 'genuine_image_processing' | 'computational_proxy' | 'heuristic_rule';
  details: string;
}

export interface ArchitectureDataFlow {
  from: string;
  to: string;
  label: string;
}

export interface ArchitectureResponse {
  pipeline_name: string;
  description: string;
  modules: {
    [key: string]: ArchitectureModule;
  };
  data_flow: ArchitectureDataFlow[];
}

export interface ExportReport {
  analysis_id: string;
  timestamp: string;
  image_metadata: any;
  processing_settings: any;
  image_statistics: any;
  candidates: any[];
  counterfactual_statistics: any;
  uncertainty: any;
  audit_result?: any;
  safety_result: any;
  implementation_limitations: string[];
}
