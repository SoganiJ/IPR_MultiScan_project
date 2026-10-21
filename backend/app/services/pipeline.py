"""
Analysis pipeline orchestrator.

Connects all processing modules into a single analysis workflow.
Manages in-memory session state and image storage.
"""
import io
import time
import uuid
import base64
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

import cv2
import numpy as np
from PIL import Image

from app.core.config import UPLOAD_DIR, EXPORT_DIR
from app.core.validation import validate_and_load_image
from app.services.preprocessing import (
    preprocess_image, compute_wavelet_decomposition, to_grayscale
)
from app.services.feature_analysis import (
    compute_multiscale_features, detect_candidates,
    generate_candidate_overlay, generate_feature_heatmap
)
from app.services.counterfactual import run_counterfactual_analysis
from app.services.concept_attribution import compute_concept_attribution
from app.services.uncertainty import (
    compute_uncertainty, compute_insertion_deletion_audit
)
from app.services.safety import (
    evaluate_safety_routing, determine_visual_state, SafetyStatus
)


# In-memory analysis store (session-scoped, no database needed)
_analysis_store: Dict[str, Dict[str, Any]] = {}


def get_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve analysis result by ID."""
    return _analysis_store.get(analysis_id)


def list_analyses() -> List[Dict[str, Any]]:
    """List all analyses in the current session."""
    summaries = []
    for aid, data in _analysis_store.items():
        summaries.append({
            "analysis_id": aid,
            "status": data.get("status", "unknown"),
            "filename": data.get("image_metadata", {}).get("filename", "Unknown"),
            "timestamp": data.get("timestamp", ""),
            "num_candidates": len(data.get("candidates", [])),
            "safety_status": data.get("safety_result", {}).get("status", "pending"),
        })
    return sorted(summaries, key=lambda x: x.get("timestamp", ""), reverse=True)


def run_analysis(
    content: bytes,
    filename: str,
    preprocessing_settings: Optional[Dict[str, Any]] = None,
    counterfactual_settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run complete analysis pipeline on an uploaded image.
    
    Returns the analysis result dictionary.
    """
    analysis_id = str(uuid.uuid4())[:12]
    start_time = time.time()
    
    result = {
        "analysis_id": analysis_id,
        "status": "processing",
        "timestamp": datetime.now().isoformat(),
        "implementation_notes": [],
    }
    
    try:
        # --- Module [100]: Image acquisition and validation ---
        image, metadata = validate_and_load_image(content, filename)
        result["image_metadata"] = metadata
        
        # Save original image for serving
        img_dir = UPLOAD_DIR / analysis_id
        img_dir.mkdir(parents=True, exist_ok=True)
        
        # Save original
        if image.ndim == 2:
            cv2.imwrite(str(img_dir / "original.png"), image)
        else:
            cv2.imwrite(str(img_dir / "original.png"), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        
        # --- Module [101]: Preprocessing and wavelet decomposition ---
        ps = preprocessing_settings or {}
        prep_result = preprocess_image(
            image,
            denoise_method=ps.get("denoise_method", "gaussian"),
            denoise_strength=ps.get("denoise_strength", 5),
            contrast_method=ps.get("contrast_method", "clahe"),
            clahe_clip=ps.get("clahe_clip", 2.0),
            clahe_grid=ps.get("clahe_grid", 8),
            processing_size=ps.get("processing_size", 512),
        )
        
        processed = prep_result["processed"]
        result["processing_settings"] = prep_result["settings"]
        result["image_statistics"] = prep_result["statistics"]
        
        # Save processed image
        cv2.imwrite(str(img_dir / "processed.png"), processed)
        
        # Wavelet decomposition
        wavelet_name = ps.get("wavelet", "db2")
        wavelet_level = ps.get("wavelet_level", 2)
        wavelet_result = compute_wavelet_decomposition(
            processed, wavelet=wavelet_name, level=wavelet_level
        )
        result["wavelet_metadata"] = wavelet_result["metadata"]
        
        # Save wavelet subbands
        for name, subband_data in wavelet_result["subbands"].items():
            subband_resized = cv2.resize(
                subband_data["array"],
                (processed.shape[1], processed.shape[0]),
                interpolation=cv2.INTER_NEAREST
            )
            cv2.imwrite(str(img_dir / f"wavelet_{name}.png"), subband_resized)
        
        # --- Module [102]: Multi-scale feature analysis ---
        features = compute_multiscale_features(processed, wavelet_result)
        
        # Save feature heatmap
        heatmap = generate_feature_heatmap(features["integrated_feature_map"])
        cv2.imwrite(
            str(img_dir / "feature_heatmap.png"),
            cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR)
        )
        
        # --- Module [103 part 1]: Candidate detection ---
        candidates = detect_candidates(
            processed, features["integrated_feature_map"]
        )
        
        # Serialize candidates (remove mask arrays)
        serializable_candidates = []
        candidate_masks = {}
        for c in candidates:
            mask = c.pop("_mask", None)
            if mask is not None:
                candidate_masks[c["id"]] = mask
            c.pop("mask_shape", None)
            serializable_candidates.append(c)
        
        result["candidates"] = serializable_candidates
        
        # Save candidate overlay
        overlay = generate_candidate_overlay(processed, candidates)
        cv2.imwrite(
            str(img_dir / "candidates.png"),
            cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
        )
        
        # --- Module [103 part 2]: Counterfactual analysis ---
        cs = counterfactual_settings or {}
        cf_result = run_counterfactual_analysis(
            processed,
            reference_method=cs.get("reference_method", "gaussian_background"),
            kernel_size=cs.get("kernel_size", 31),
            colormap=cs.get("colormap", "jet"),
            overlay_opacity=cs.get("overlay_opacity", 0.5),
        )
        
        result["counterfactual_statistics"] = cf_result["statistics"]
        result["counterfactual_settings"] = cf_result["settings"]
        result["counterfactual_methodology"] = cf_result["methodology_note"]
        
        # Save counterfactual images
        cv2.imwrite(str(img_dir / "reference.png"), cf_result["reference_image"])
        
        diff_colored = cf_result["difference_colored"]
        cv2.imwrite(
            str(img_dir / "difference.png"),
            cv2.cvtColor(diff_colored, cv2.COLOR_RGB2BGR)
        )
        
        overlay_cf = cf_result["overlay"]
        cv2.imwrite(
            str(img_dir / "overlay.png"),
            cv2.cvtColor(overlay_cf, cv2.COLOR_RGB2BGR)
        )
        
        # --- Module [104]: Concept attribution ---
        if candidates:
            best = candidates[0]
            attribution = compute_concept_attribution(
                best, candidates, result["image_statistics"]
            )
            result["concept_attribution"] = attribution
        else:
            result["concept_attribution"] = None
        
        # --- Module [105]: Uncertainty estimation ---
        uncertainty = compute_uncertainty(
            processed, candidates, result["image_statistics"],
            prep_result["settings"]
        )
        result["uncertainty"] = uncertainty
        
        # --- Module [106]: Safety routing (without audit initially) ---
        # Initial safety evaluation (without audit results)
        safety = evaluate_safety_routing(
            afs=None,  # No audit yet
            uncertainty=uncertainty["uncertainty_score"],
        )
        result["safety_result"] = safety
        result["visual_state"] = determine_visual_state(safety)
        
        # Add implementation notes
        result["implementation_notes"] = [
            "Wavelet decomposition uses a genuine 2D DWT via PyWavelets",
            "Candidate regions are detected using image-derived features, not a trained model",
            "The reference image is a computational baseline, not a learned healthy-anatomy reconstruction",
            "Uncertainty is a heuristic proxy, not a calibrated probabilistic estimate",
            "Safety routing uses configurable thresholds for research demonstration only",
            "No clinical diagnoses or category assignments are implemented",
        ]
        
        result["status"] = "complete"
        
        # Store internal data for audit (not serialized to response)
        result["_processed"] = processed
        result["_candidates"] = candidates
        result["_candidate_masks"] = candidate_masks
        result["_image_dir"] = str(img_dir)
        
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        result["safety_result"] = evaluate_safety_routing(afs=None, uncertainty=None)
        result["visual_state"] = determine_visual_state(
            {"status": SafetyStatus.PROCESSING_ERROR}
        )
    
    # Record duration
    result["processing_duration_ms"] = round((time.time() - start_time) * 1000, 1)
    
    # Store in session
    _analysis_store[analysis_id] = result
    
    return result


def run_audit(analysis_id: str, candidate_id: int = 0, num_steps: int = 20) -> Dict[str, Any]:
    """Run insertion/deletion audit on a stored analysis."""
    analysis = _analysis_store.get(analysis_id)
    if analysis is None:
        raise ValueError(f"Analysis {analysis_id} not found")
    
    if analysis["status"] != "complete":
        raise ValueError(f"Analysis {analysis_id} is not complete (status: {analysis['status']})")
    
    processed = analysis.get("_processed")
    candidates = analysis.get("_candidates", [])
    
    if processed is None:
        raise ValueError("Processed image data not available for audit")
    
    if not candidates:
        raise ValueError("No candidates available for audit")
    
    if candidate_id >= len(candidates):
        raise ValueError(f"Candidate {candidate_id} not found (available: 0-{len(candidates)-1})")
    
    candidate = candidates[candidate_id]
    
    # Run audit
    audit_result = compute_insertion_deletion_audit(
        processed, candidate, num_steps=num_steps
    )
    
    # Update safety routing with audit results
    uncertainty_score = analysis["uncertainty"]["uncertainty_score"]
    safety = evaluate_safety_routing(
        afs=audit_result["afs"],
        uncertainty=uncertainty_score,
    )
    
    # Update stored analysis
    analysis["audit_result"] = audit_result
    analysis["safety_result"] = safety
    analysis["visual_state"] = determine_visual_state(safety)
    
    return {
        "analysis_id": analysis_id,
        "audit_result": audit_result,
        "safety_result": safety,
        "visual_state": determine_visual_state(safety),
    }


def get_image_path(analysis_id: str, image_type: str) -> Optional[Path]:
    """Get path to a stored analysis image."""
    analysis = _analysis_store.get(analysis_id)
    if analysis is None:
        return None
    
    img_dir = analysis.get("_image_dir")
    if img_dir is None:
        return None
    
    valid_types = [
        "original", "processed", "candidates", "reference",
        "difference", "overlay", "feature_heatmap",
        "wavelet_LL", "wavelet_LH1", "wavelet_HL1", "wavelet_HH1",
        "wavelet_LH2", "wavelet_HL2", "wavelet_HH2",
    ]
    
    if image_type not in valid_types:
        return None
    
    path = Path(img_dir) / f"{image_type}.png"
    return path if path.exists() else None


def generate_export_report(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Generate a complete export report for an analysis."""
    analysis = _analysis_store.get(analysis_id)
    if analysis is None:
        return None
    
    # Build clean export (no internal numpy arrays)
    report = {
        "analysis_id": analysis_id,
        "timestamp": analysis.get("timestamp", ""),
        "image_metadata": analysis.get("image_metadata", {}),
        "processing_settings": analysis.get("processing_settings", {}),
        "image_statistics": analysis.get("image_statistics", {}),
        "wavelet_metadata": analysis.get("wavelet_metadata", {}),
        "candidates": [
            {k: v for k, v in c.items() if not k.startswith("_")}
            for c in analysis.get("candidates", [])
        ],
        "counterfactual_statistics": analysis.get("counterfactual_statistics", {}),
        "counterfactual_methodology": analysis.get("counterfactual_methodology", ""),
        "concept_attribution": analysis.get("concept_attribution"),
        "uncertainty": analysis.get("uncertainty", {}),
        "audit_result": analysis.get("audit_result"),
        "safety_result": analysis.get("safety_result", {}),
        "processing_duration_ms": analysis.get("processing_duration_ms"),
        "implementation_limitations": [
            "Candidate detection uses image-processing heuristics, not a trained diagnostic model",
            "Wavelet decomposition is a standard 2D DWT, not a dual-tree complex wavelet transform",
            "The reference image is computed via smoothing, not a learned healthy-anatomy reconstruction",
            "Uncertainty is a heuristic proxy, not a calibrated evidential neural network output",
            "The faithfulness audit uses an image-derived scoring function, not a classifier",
            "Safety routing is a research demo policy, not a clinically validated protocol",
            "No clinical diagnoses, BI-RADS, or Lung-RADS assessments are implemented",
            "Sample images are synthetic test cases, not real medical scans",
        ],
    }
    
    return report
