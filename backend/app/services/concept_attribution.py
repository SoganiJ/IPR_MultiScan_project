"""
Module [104]: Clinical concept attribution and interpretable feature summaries.

Implements:
- Computation of meaningful, image-derived descriptors for each candidate region
- Feature normalization and human-readable explanations
- Concept-attribution panel data generation

Note: Features are measured image descriptors, NOT clinical diagnoses.
Clinical category assignments (e.g., BI-RADS, Lung-RADS) are NOT implemented
and would require trained models with clinical validation.
"""
import cv2
import numpy as np
from typing import Dict, List, Any, Optional


# Feature definitions with human-readable explanations
FEATURE_DEFINITIONS = {
    "mean_intensity": {
        "label": "Mean Intensity",
        "description": "Average pixel intensity within the candidate region",
        "unit": "pixel value (0-255)",
        "interpretation": "Higher values indicate brighter regions"
    },
    "std_intensity": {
        "label": "Intensity Variation",
        "description": "Standard deviation of pixel intensity within the region",
        "unit": "pixel value",
        "interpretation": "Higher values indicate more heterogeneous regions"
    },
    "local_contrast": {
        "label": "Local Contrast",
        "description": "Absolute difference between region mean and surrounding mean intensity",
        "unit": "pixel value",
        "interpretation": "Higher values indicate the region stands out from its surroundings"
    },
    "edge_density": {
        "label": "Edge Density",
        "description": "Proportion of edge pixels within the candidate region",
        "unit": "ratio (0-1)",
        "interpretation": "Higher values indicate more internal structure or boundaries"
    },
    "compactness": {
        "label": "Compactness",
        "description": "4π × Area / Perimeter² — measures how close to circular the shape is",
        "unit": "ratio (0-1)",
        "interpretation": "Values near 1.0 indicate circular shapes; lower values indicate irregular shapes"
    },
    "irregularity": {
        "label": "Shape Irregularity",
        "description": "1 - Compactness — measures deviation from circular shape",
        "unit": "ratio (0-1)",
        "interpretation": "Higher values indicate more irregular, non-circular boundaries"
    },
    "texture_variation": {
        "label": "Texture Variation",
        "description": "Variance of pixel intensities within the region",
        "unit": "pixel value²",
        "interpretation": "Higher values indicate more textural complexity"
    },
    "boundary_strength": {
        "label": "Boundary Strength",
        "description": "Mean gradient magnitude along the region boundary",
        "unit": "gradient magnitude",
        "interpretation": "Higher values indicate sharper, more defined boundaries"
    },
    "feature_strength": {
        "label": "Multi-Scale Feature Strength",
        "description": "Mean value of the integrated multi-scale feature map within the region",
        "unit": "normalized (0-1)",
        "interpretation": "Higher values indicate stronger multi-scale structural features"
    },
    "area": {
        "label": "Region Area",
        "description": "Total number of pixels in the candidate region",
        "unit": "pixels",
        "interpretation": "Larger values indicate bigger candidate regions"
    },
    "perimeter": {
        "label": "Region Perimeter",
        "description": "Length of the region boundary",
        "unit": "pixels",
        "interpretation": "Longer perimeters with small areas suggest irregular shapes"
    },
    "saliency_score": {
        "label": "Saliency Score",
        "description": "Composite ranking score derived from contrast, edge density, feature strength, boundary strength, and irregularity",
        "unit": "normalized (0-1)",
        "interpretation": "Higher values indicate regions more likely to warrant inspection"
    },
}


def compute_concept_attribution(
    candidate: Dict[str, Any],
    all_candidates: List[Dict[str, Any]],
    image_stats: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compute concept attribution for a candidate region.
    
    Generates normalized feature values and contextual comparisons
    against the overall image and other candidates.
    
    Args:
        candidate: The selected candidate
        all_candidates: All detected candidates
        image_stats: Image-level statistics
    
    Returns:
        Concept attribution dictionary
    """
    features = candidate["features"]
    
    # Normalize features to [0, 1] for radar/bar visualization
    normalized = {}
    feature_details = []
    
    # Define normalization ranges (based on typical image values)
    norm_ranges = {
        "mean_intensity": (0, 255),
        "std_intensity": (0, 80),
        "local_contrast": (0, 100),
        "edge_density": (0, 0.5),
        "compactness": (0, 1),
        "irregularity": (0, 1),
        "texture_variation": (0, 3000),
        "boundary_strength": (0, 80),
        "feature_strength": (0, 1),
    }
    
    for feat_name, value in features.items():
        if feat_name in norm_ranges:
            low, high = norm_ranges[feat_name]
            norm_val = max(0.0, min(1.0, (value - low) / (high - low + 1e-10)))
        elif feat_name == "perimeter":
            norm_val = min(1.0, value / 500.0)
        elif feat_name == "surround_mean":
            norm_val = value / 255.0
        else:
            norm_val = min(1.0, abs(value) / 100.0)
        
        normalized[feat_name] = round(norm_val, 4)
        
        # Build detail entry
        definition = FEATURE_DEFINITIONS.get(feat_name, {})
        feature_details.append({
            "name": feat_name,
            "label": definition.get("label", feat_name),
            "value": value,
            "normalized": norm_val,
            "unit": definition.get("unit", ""),
            "description": definition.get("description", ""),
            "interpretation": definition.get("interpretation", ""),
        })
    
    # Contextual comparison: how does this candidate compare to others?
    comparison = {}
    if len(all_candidates) > 1:
        for feat_name in features:
            all_values = [c["features"].get(feat_name, 0) for c in all_candidates]
            comparison[feat_name] = {
                "rank": sorted(all_values, reverse=True).index(features[feat_name]) + 1,
                "total": len(all_values),
                "percentile": round(
                    sum(1 for v in all_values if v <= features[feat_name]) / len(all_values) * 100, 1
                ),
            }
    
    # Key observations (data-driven, not diagnostic)
    observations = _generate_observations(features, image_stats)
    
    return {
        "candidate_id": candidate["id"],
        "feature_details": feature_details,
        "normalized_features": normalized,
        "comparison_with_peers": comparison,
        "observations": observations,
        "saliency_score": candidate["saliency_score"],
        "methodology_note": (
            "These are measured image descriptors computed from pixel data. "
            "They are NOT clinical diagnoses. No clinical category assignments "
            "(e.g., BI-RADS, Lung-RADS) are implemented. Clinical interpretation "
            "requires trained models and expert validation."
        ),
    }


def _generate_observations(
    features: Dict[str, Any],
    image_stats: Dict[str, Any]
) -> List[Dict[str, str]]:
    """Generate data-driven observations about the candidate."""
    observations = []
    
    contrast = features.get("local_contrast", 0)
    if contrast > 30:
        observations.append({
            "type": "contrast",
            "level": "high",
            "text": f"High local contrast ({contrast:.1f}) — region stands out from surroundings"
        })
    elif contrast < 10:
        observations.append({
            "type": "contrast",
            "level": "low",
            "text": f"Low local contrast ({contrast:.1f}) — region is subtle relative to surroundings"
        })
    
    irregularity = features.get("irregularity", 0)
    if irregularity > 0.6:
        observations.append({
            "type": "shape",
            "level": "notable",
            "text": f"Irregular shape (irregularity: {irregularity:.3f})"
        })
    elif irregularity < 0.2:
        observations.append({
            "type": "shape",
            "level": "normal",
            "text": f"Nearly circular shape (irregularity: {irregularity:.3f})"
        })
    
    edge_density = features.get("edge_density", 0)
    if edge_density > 0.15:
        observations.append({
            "type": "texture",
            "level": "notable",
            "text": f"High edge density ({edge_density:.3f}) — significant internal structure"
        })
    
    feature_strength = features.get("feature_strength", 0)
    if feature_strength > 0.5:
        observations.append({
            "type": "saliency",
            "level": "high",
            "text": f"Strong multi-scale features ({feature_strength:.3f})"
        })
    
    boundary = features.get("boundary_strength", 0)
    if boundary > 30:
        observations.append({
            "type": "boundary",
            "level": "notable",
            "text": f"Well-defined boundary (strength: {boundary:.1f})"
        })
    
    return observations
