"""API routes for the analysis endpoints."""
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse

from app.models.schemas import (
    AnalysisRequest, AuditRequest, PreprocessingSettings, CounterfactualSettings
)
from app.services.pipeline import (
    run_analysis, run_audit, get_analysis, list_analyses,
    get_image_path, generate_export_report
)
from app.services.sample_generator import get_sample_cases
from app.core.config import MAX_FILE_SIZE_MB, SAMPLE_DIR

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "modules": [
            "[100] Image Acquisition & Validation",
            "[101] Preprocessing & Wavelet Decomposition",
            "[102] Dual-Branch Feature Analysis",
            "[103] Counterfactual Comparison & Candidate Detection",
            "[104] Clinical Concept Attribution",
            "[105] Uncertainty & Faithfulness Audit",
            "[106] Safety Routing & Escalation",
        ]
    }


@router.get("/demo/cases")
async def get_demo_cases():
    """Get available sample/demo cases."""
    cases = get_sample_cases()
    return {"cases": cases, "count": len(cases)}


@router.get("/demo/cases/{case_id}/image")
async def get_demo_image(case_id: str):
    """Serve a sample case image."""
    filepath = SAMPLE_DIR / f"{case_id}.png"
    if not filepath.exists():
        # Try generating it
        cases = get_sample_cases()
        filepath = SAMPLE_DIR / f"{case_id}.png"
    
    if not filepath.exists():
        raise HTTPException(404, f"Sample case {case_id} not found")
    
    return FileResponse(str(filepath), media_type="image/png")


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    denoise_method: str = Query("gaussian", description="Denoising method"),
    denoise_strength: int = Query(5, ge=1, le=15),
    contrast_method: str = Query("clahe", description="Contrast method"),
    clahe_clip: float = Query(2.0, ge=0.5, le=10.0),
    clahe_grid: int = Query(8, ge=2, le=32),
    wavelet: str = Query("db2", description="Wavelet family"),
    wavelet_level: int = Query(2, ge=1, le=3),
    processing_size: int = Query(512, ge=128, le=1024),
    reference_method: str = Query("gaussian_background"),
    kernel_size: int = Query(31, ge=5, le=101),
    colormap: str = Query("jet"),
    overlay_opacity: float = Query(0.5, ge=0.0, le=1.0),
):
    """
    Upload and analyze an image.
    Accepts real uploaded images and runs the complete processing pipeline.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File size exceeds {MAX_FILE_SIZE_MB} MB limit")
    
    if len(content) == 0:
        raise HTTPException(400, "Empty file uploaded")
    
    preprocessing_settings = {
        "denoise_method": denoise_method,
        "denoise_strength": denoise_strength,
        "contrast_method": contrast_method,
        "clahe_clip": clahe_clip,
        "clahe_grid": clahe_grid,
        "wavelet": wavelet,
        "wavelet_level": wavelet_level,
        "processing_size": processing_size,
    }
    
    counterfactual_settings = {
        "reference_method": reference_method,
        "kernel_size": kernel_size,
        "colormap": colormap,
        "overlay_opacity": overlay_opacity,
    }
    
    try:
        result = run_analysis(
            content, file.filename,
            preprocessing_settings=preprocessing_settings,
            counterfactual_settings=counterfactual_settings,
        )
    except Exception as e:
        raise HTTPException(422, str(e))
    
    # Clean internal fields from response
    clean = _clean_result(result)
    return clean


@router.get("/analyze/list")
async def list_all_analyses():
    """List all analyses in the current session."""
    return {"analyses": list_analyses()}


@router.get("/analyze/{analysis_id}")
async def get_analysis_result(analysis_id: str):
    """Get a specific analysis result."""
    result = get_analysis(analysis_id)
    if result is None:
        raise HTTPException(404, f"Analysis {analysis_id} not found")
    return _clean_result(result)


@router.get("/analyze/{analysis_id}/image/{image_type}")
async def get_analysis_image(analysis_id: str, image_type: str):
    """
    Serve a processed image from an analysis.
    
    Valid image_type values:
    - original, processed, candidates, reference
    - difference, overlay, feature_heatmap
    - wavelet_LL, wavelet_LH1, wavelet_HL1, wavelet_HH1
    - wavelet_LH2, wavelet_HL2, wavelet_HH2
    """
    path = get_image_path(analysis_id, image_type)
    if path is None:
        raise HTTPException(404, f"Image '{image_type}' not found for analysis {analysis_id}")
    return FileResponse(str(path), media_type="image/png")


@router.post("/analyze/{analysis_id}/audit")
async def run_faithfulness_audit(
    analysis_id: str,
    request: AuditRequest = None,
):
    """Run insertion/deletion faithfulness audit on an analysis."""
    if request is None:
        request = AuditRequest()
    
    try:
        result = run_audit(
            analysis_id,
            candidate_id=request.candidate_id,
            num_steps=request.num_steps,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Audit failed: {str(e)}")
    
    return result


@router.get("/analyze/{analysis_id}/export")
async def export_analysis(analysis_id: str):
    """Export analysis results as a JSON report."""
    report = generate_export_report(analysis_id)
    if report is None:
        raise HTTPException(404, f"Analysis {analysis_id} not found")
    
    return JSONResponse(
        content=report,
        headers={
            "Content-Disposition": f'attachment; filename="analysis_{analysis_id}.json"'
        }
    )


@router.get("/benchmark")
async def get_benchmark_data():
    """
    Return benchmark figures reported in the research document.
    
    IMPORTANT: These are values reported in the research paper,
    NOT independently reproduced by this prototype.
    """
    return {
        "disclaimer": (
            "Reported in the research document · Not independently reproduced by this prototype. "
            "These benchmark figures are from the published research and are shown for reference only. "
            "This implementation has NOT been evaluated against these benchmarks."
        ),
        "detection_performance": [
            {"method": "Grad-CAM", "auc": 0.741, "sensitivity": 0.682, "specificity": 0.798, "latency_ms": 45},
            {"method": "LIME", "auc": 0.723, "sensitivity": 0.665, "specificity": 0.781, "latency_ms": 2800},
            {"method": "SHAP", "auc": 0.756, "sensitivity": 0.701, "specificity": 0.811, "latency_ms": 3200},
            {"method": "Attention Rollout", "auc": 0.768, "sensitivity": 0.715, "specificity": 0.821, "latency_ms": 52},
            {"method": "Proposed (EMCL-CU)", "auc": 0.892, "sensitivity": 0.847, "specificity": 0.901, "latency_ms": 120},
        ],
        "faithfulness_metrics": [
            {"method": "Grad-CAM", "insertion_auc": 0.512, "deletion_auc": 0.348, "pointing_game": 68.2},
            {"method": "LIME", "insertion_auc": 0.534, "deletion_auc": 0.312, "pointing_game": 71.5},
            {"method": "SHAP", "insertion_auc": 0.558, "deletion_auc": 0.289, "pointing_game": 73.1},
            {"method": "Attention Rollout", "insertion_auc": 0.571, "deletion_auc": 0.301, "pointing_game": 72.8},
            {"method": "Proposed (EMCL-CU)", "insertion_auc": 0.723, "deletion_auc": 0.198, "pointing_game": 86.4},
        ],
        "uncertainty_calibration": [
            {"method": "MC Dropout", "ece": 0.089, "brier": 0.142, "nll": 0.423},
            {"method": "Deep Ensemble", "ece": 0.067, "brier": 0.118, "nll": 0.378},
            {"method": "Evidential", "ece": 0.052, "brier": 0.098, "nll": 0.312},
            {"method": "Proposed (EMCL-CU)", "ece": 0.034, "brier": 0.071, "nll": 0.245},
        ],
    }


@router.get("/architecture")
async def get_architecture():
    """Return system architecture description for visualization."""
    return {
        "modules": [
            {
                "id": "100",
                "name": "Image Acquisition & Validation",
                "description": "File upload, format detection, DICOM support, dimension/quality validation",
                "inputs": ["Raw image file"],
                "outputs": ["Validated image array", "Image metadata"],
                "status": "implemented",
            },
            {
                "id": "101",
                "name": "Preprocessing & Wavelet Decomposition",
                "description": "Normalization, denoising, contrast enhancement, multi-level 2D DWT",
                "inputs": ["Validated image"],
                "outputs": ["Processed image", "Wavelet subbands", "Image statistics"],
                "status": "implemented",
            },
            {
                "id": "102",
                "name": "Dual-Branch Feature Analysis",
                "description": "Multi-scale gradient features, cross-scale wavelet integration",
                "inputs": ["Processed image", "Wavelet subbands"],
                "outputs": ["Integrated feature map", "Multi-scale feature vectors"],
                "status": "implemented_adapter",
                "note": "Uses image-processing features instead of learned transformer features",
            },
            {
                "id": "103",
                "name": "Counterfactual Comparison & Localization",
                "description": "Reference image generation, difference mapping, candidate detection",
                "inputs": ["Processed image", "Feature map"],
                "outputs": ["Candidates", "Difference map", "Reference image"],
                "status": "implemented_adapter",
                "note": "Reference is a smoothing-based baseline, not a learned reconstruction",
            },
            {
                "id": "104",
                "name": "Clinical Concept Attribution",
                "description": "Per-candidate feature computation, concept explanations",
                "inputs": ["Candidates", "Image statistics"],
                "outputs": ["Feature vectors", "Concept attributions", "Observations"],
                "status": "implemented_adapter",
                "note": "Features are image descriptors; no clinical categories assigned",
            },
            {
                "id": "105",
                "name": "Uncertainty & Faithfulness Audit",
                "description": "Heuristic uncertainty estimation, insertion/deletion perturbation",
                "inputs": ["Image", "Candidates", "Statistics"],
                "outputs": ["Uncertainty score", "Audit curves", "AFS"],
                "status": "implemented_adapter",
                "note": "Uncertainty is a heuristic proxy; audit uses image-derived scoring",
            },
            {
                "id": "106",
                "name": "Safety Routing & Escalation",
                "description": "Threshold-based routing, fail-safe escalation, decision transparency",
                "inputs": ["AFS", "Uncertainty"],
                "outputs": ["Safety status", "Escalation reasons"],
                "status": "implemented",
                "note": "Research demo policy, not a clinically validated protocol",
            },
        ],
        "data_flow": [
            {"from": "100", "to": "101", "label": "Validated Image"},
            {"from": "101", "to": "102", "label": "Processed Image + Subbands"},
            {"from": "102", "to": "103", "label": "Feature Map"},
            {"from": "101", "to": "103", "label": "Processed Image"},
            {"from": "103", "to": "104", "label": "Candidates"},
            {"from": "101", "to": "104", "label": "Image Statistics"},
            {"from": "101", "to": "105", "label": "Image Data"},
            {"from": "103", "to": "105", "label": "Candidates"},
            {"from": "105", "to": "106", "label": "AFS + Uncertainty"},
        ],
    }


def _clean_result(result: Dict) -> Dict:
    """Remove internal numpy arrays and non-serializable data from result."""
    clean = {}
    skip_keys = {"_processed", "_candidates", "_candidate_masks", "_image_dir"}
    for k, v in result.items():
        if k in skip_keys:
            continue
        clean[k] = v
    return clean
