"""
Module [106]: Clinical decision-support interface and safety-based escalation.

Implements:
- Safety routing based on configurable thresholds
- Escalation reasons and decision transparency
- Safe handling of missing/invalid values
- Visual state determination

Note: This is a RESEARCH DEMO policy, NOT a clinically validated safety protocol.
The review-ready state is NOT medical clearance or diagnostic approval.
"""
import math
from typing import Dict, Any, Optional, List

from app.core.config import SAFETY_AFS_THRESHOLD, SAFETY_UNCERTAINTY_THRESHOLD


class SafetyStatus:
    """Safety routing status values."""
    REVIEW_READY = "review_ready"
    REVIEW_REQUIRED = "review_required"
    INSUFFICIENT_QUALITY = "insufficient_quality"
    PROCESSING_ERROR = "processing_error"
    PENDING = "pending"


def evaluate_safety_routing(
    afs: Optional[float],
    uncertainty: Optional[float],
    image_quality_score: Optional[float] = None,
    afs_threshold: float = SAFETY_AFS_THRESHOLD,
    uncertainty_threshold: float = SAFETY_UNCERTAINTY_THRESHOLD,
) -> Dict[str, Any]:
    """
    Evaluate safety routing based on configurable thresholds.
    
    Research demo policy:
    - REVIEW_READY: AFS >= 0.85 AND uncertainty <= 0.15
    - REVIEW_REQUIRED: thresholds not met
    - Fail-safe: missing/invalid values always require review
    
    This is NOT medical clearance or permission to treat a patient.
    
    Args:
        afs: Aggregated Faithfulness Score (0-1, higher = better)
        uncertainty: Uncertainty score (0-1, lower = better)
        image_quality_score: Optional image quality factor
        afs_threshold: Minimum AFS for review-ready (default 0.85)
        uncertainty_threshold: Maximum uncertainty for review-ready (default 0.15)
    
    Returns:
        Safety routing result dictionary
    """
    reasons = []
    values = {
        "afs": afs,
        "uncertainty": uncertainty,
        "afs_threshold": afs_threshold,
        "uncertainty_threshold": uncertainty_threshold,
    }
    
    # Check for missing or invalid values (fail-safe)
    if afs is None:
        reasons.append("AFS value is missing — cannot verify analysis faithfulness")
        status = SafetyStatus.REVIEW_REQUIRED
    elif not math.isfinite(afs):
        reasons.append(f"AFS value is non-finite ({afs}) — numerical error in audit")
        status = SafetyStatus.REVIEW_REQUIRED
    elif uncertainty is None:
        reasons.append("Uncertainty score is missing — cannot assess confidence")
        status = SafetyStatus.REVIEW_REQUIRED
    elif not math.isfinite(uncertainty):
        reasons.append(f"Uncertainty value is non-finite ({uncertainty}) — numerical error")
        status = SafetyStatus.REVIEW_REQUIRED
    else:
        # Both values are valid finite numbers
        afs_ok = afs >= afs_threshold
        unc_ok = uncertainty <= uncertainty_threshold
        
        if afs_ok and unc_ok:
            status = SafetyStatus.REVIEW_READY
            reasons.append(
                f"AFS ({afs:.4f}) ≥ threshold ({afs_threshold}) — analysis appears faithful"
            )
            reasons.append(
                f"Uncertainty ({uncertainty:.4f}) ≤ threshold ({uncertainty_threshold}) — confidence adequate"
            )
        else:
            status = SafetyStatus.REVIEW_REQUIRED
            if not afs_ok:
                reasons.append(
                    f"AFS ({afs:.4f}) < threshold ({afs_threshold}) — "
                    "analysis faithfulness below minimum"
                )
            if not unc_ok:
                reasons.append(
                    f"Uncertainty ({uncertainty:.4f}) > threshold ({uncertainty_threshold}) — "
                    "confidence insufficient"
                )
    
    # Optional image quality check
    if image_quality_score is not None and image_quality_score > 0.7:
        if status != SafetyStatus.REVIEW_REQUIRED:
            status = SafetyStatus.INSUFFICIENT_QUALITY
        reasons.append(
            f"Image quality factor ({image_quality_score:.4f}) indicates poor image quality"
        )
    
    return {
        "status": status,
        "reasons": reasons,
        "values": values,
        "thresholds": {
            "afs_minimum": afs_threshold,
            "uncertainty_maximum": uncertainty_threshold,
        },
        "policy_note": (
            "This is a RESEARCH DEMO safety policy. The 'review_ready' status "
            "is NOT medical clearance, diagnostic approval, or permission to "
            "treat a patient. This rule demonstrates configurable threshold-based "
            "escalation for research purposes only."
        ),
    }


def determine_visual_state(safety_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map safety status to visual display states.
    
    Returns:
        Visual state configuration for the frontend
    """
    status = safety_result["status"]
    
    states = {
        SafetyStatus.REVIEW_READY: {
            "color": "green",
            "icon": "check-circle",
            "title": "Analysis Complete — Demo Review Ready",
            "description": "All configured thresholds are met. This is a research demo state.",
            "badge": "REVIEW READY",
        },
        SafetyStatus.REVIEW_REQUIRED: {
            "color": "amber",
            "icon": "alert-triangle",
            "title": "Human Review Required",
            "description": "One or more thresholds were not met. Results should be reviewed.",
            "badge": "REVIEW REQUIRED",
        },
        SafetyStatus.INSUFFICIENT_QUALITY: {
            "color": "red",
            "icon": "x-circle",
            "title": "Insufficient Image Quality",
            "description": "Image quality is insufficient for reliable analysis.",
            "badge": "QUALITY ISSUE",
        },
        SafetyStatus.PROCESSING_ERROR: {
            "color": "red",
            "icon": "alert-octagon",
            "title": "Processing Error",
            "description": "An error occurred during analysis. Results are unreliable.",
            "badge": "ERROR",
        },
        SafetyStatus.PENDING: {
            "color": "blue",
            "icon": "clock",
            "title": "Analysis Pending",
            "description": "Analysis is in progress or has not been started.",
            "badge": "PENDING",
        },
    }
    
    return states.get(status, states[SafetyStatus.PROCESSING_ERROR])
