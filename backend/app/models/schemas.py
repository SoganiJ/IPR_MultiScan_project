"""Pydantic models for API request/response validation."""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    ERROR = "error"


class PreprocessingSettings(BaseModel):
    denoise_method: str = Field(default="gaussian", description="Denoising method: gaussian, bilateral, nlm")
    denoise_strength: int = Field(default=5, ge=1, le=15, description="Denoising strength")
    contrast_method: str = Field(default="clahe", description="Contrast method: clahe, histogram_eq, none")
    clahe_clip: float = Field(default=2.0, ge=0.5, le=10.0, description="CLAHE clip limit")
    clahe_grid: int = Field(default=8, ge=2, le=32, description="CLAHE grid size")
    wavelet: str = Field(default="db2", description="Wavelet family: haar, db2, db4, sym4, coif1")
    wavelet_level: int = Field(default=2, ge=1, le=3, description="Wavelet decomposition level")
    processing_size: int = Field(default=512, ge=128, le=1024, description="Processing image size")


class CounterfactualSettings(BaseModel):
    reference_method: str = Field(default="gaussian_background", description="Reference method")
    kernel_size: int = Field(default=31, ge=5, le=101, description="Smoothing kernel size")
    colormap: str = Field(default="jet", description="Colormap name")
    overlay_opacity: float = Field(default=0.5, ge=0.0, le=1.0, description="Overlay opacity")


class AuditRequest(BaseModel):
    candidate_id: int = Field(default=0, ge=0, description="Candidate ID to audit")
    num_steps: int = Field(default=20, ge=5, le=50, description="Number of perturbation steps")


class AnalysisRequest(BaseModel):
    preprocessing: PreprocessingSettings = Field(default_factory=PreprocessingSettings)
    counterfactual: CounterfactualSettings = Field(default_factory=CounterfactualSettings)


class ImageMetadata(BaseModel):
    filename: str
    file_size_bytes: int
    file_size_mb: float
    width: int
    height: int
    channels: int
    format: str = ""
    detected_format: str = ""
    extension: str = ""
    intensity_min: int = 0
    intensity_max: int = 255
    intensity_mean: float = 128.0
    is_dicom: bool = False
    original_mode: Optional[str] = None
    original_size: Optional[List[int]] = None


class CandidateRegion(BaseModel):
    id: int
    bbox: Dict[str, int]
    center: Dict[str, int]
    area: int
    features: Dict[str, float]
    saliency_score: float


class SafetyResult(BaseModel):
    status: str
    reasons: List[str]
    values: Dict[str, Any]
    thresholds: Dict[str, float]
    policy_note: str


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: AnalysisStatus
    image_metadata: Optional[ImageMetadata] = None
    processing_settings: Optional[Dict[str, Any]] = None
    image_statistics: Optional[Dict[str, Any]] = None
    wavelet_metadata: Optional[Dict[str, Any]] = None
    candidates: Optional[List[CandidateRegion]] = None
    counterfactual_statistics: Optional[Dict[str, Any]] = None
    concept_attribution: Optional[Dict[str, Any]] = None
    uncertainty: Optional[Dict[str, Any]] = None
    audit_result: Optional[Dict[str, Any]] = None
    safety_result: Optional[SafetyResult] = None
    visual_state: Optional[Dict[str, Any]] = None
    processing_duration_ms: Optional[float] = None
    implementation_notes: List[str] = Field(default_factory=list)
    error: Optional[str] = None


class BenchmarkEntry(BaseModel):
    method: str
    auc: Optional[float] = None
    sensitivity: Optional[float] = None
    specificity: Optional[float] = None
    insertion_auc: Optional[float] = None
    deletion_auc: Optional[float] = None
    pointing_game: Optional[float] = None
    latency_ms: Optional[float] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    modules: List[str]


class ExportReport(BaseModel):
    analysis_id: str
    timestamp: str
    image_metadata: Dict[str, Any]
    processing_settings: Dict[str, Any]
    image_statistics: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    counterfactual_statistics: Dict[str, Any]
    uncertainty: Dict[str, Any]
    audit_result: Optional[Dict[str, Any]] = None
    safety_result: Dict[str, Any]
    implementation_limitations: List[str]
