"""
Module [105]: Uncertainty estimation, insertion/deletion analysis, and faithfulness auditing.

Implements:
- Uncertainty proxy based on measurable image properties
- Progressive insertion/deletion perturbation
- AUC calculation for insertion and deletion curves
- Aggregated Faithfulness Score (AFS)

Note: The uncertainty score is an explicitly documented heuristic proxy,
NOT a statistically calibrated output from a trained evidential neural network.
"""
import cv2
import numpy as np
from typing import Dict, List, Any, Optional, Tuple


def compute_uncertainty(
    image: np.ndarray,
    candidates: List[Dict[str, Any]],
    image_stats: Dict[str, Any],
    preprocessing_settings: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Compute uncertainty proxy from measurable image and analysis properties.
    
    The uncertainty score is normalized to [0, 1], where higher values
    indicate greater uncertainty about the analysis results.
    
    Contributing factors:
    1. Image quality (noise level, dynamic range, entropy)
    2. Candidate strength (saliency score of best candidate)
    3. Detection consistency (agreement between feature types)
    4. Candidate stability (how sensitive detection is to parameters)
    5. Information sufficiency (image has enough content for analysis)
    
    Formula: uncertainty = weighted average of factor scores
    
    This is NOT a calibrated probabilistic uncertainty estimate.
    It is a heuristic indicator for research demonstration purposes.
    """
    factors = {}
    
    # Factor 1: Image quality (0 = high quality, 1 = poor quality)
    intensity_stats = image_stats.get("intensity", {})
    dynamic_range = intensity_stats.get("dynamic_range", 0)
    entropy = image_stats.get("texture", {}).get("entropy", 0)
    noise_level = intensity_stats.get("std", 0)
    
    # Low dynamic range = poor quality
    quality_dr = 1.0 - min(dynamic_range / 200.0, 1.0)
    # Low entropy = less information
    quality_entropy = 1.0 - min(entropy / 7.5, 1.0)
    # Very high or very low noise
    if noise_level < 10:
        quality_noise = 0.5  # Very uniform - hard to analyze
    elif noise_level > 80:
        quality_noise = 0.7  # Very noisy
    else:
        quality_noise = 0.1  # Reasonable noise level
    
    image_quality_score = 0.4 * quality_dr + 0.3 * quality_entropy + 0.3 * quality_noise
    factors["image_quality"] = {
        "score": round(image_quality_score, 4),
        "weight": 0.25,
        "components": {
            "dynamic_range_factor": round(quality_dr, 4),
            "entropy_factor": round(quality_entropy, 4),
            "noise_factor": round(quality_noise, 4),
        },
        "description": "Assessment of image quality based on dynamic range, entropy, and noise level"
    }
    
    # Factor 2: Candidate strength (0 = strong candidates, 1 = weak/no candidates)
    if candidates:
        best_saliency = candidates[0]["saliency_score"]
        candidate_strength = 1.0 - min(best_saliency * 2.0, 1.0)
    else:
        candidate_strength = 0.8  # No candidates = moderate uncertainty
    
    factors["candidate_strength"] = {
        "score": round(candidate_strength, 4),
        "weight": 0.25,
        "description": "Strength of the strongest detected candidate region"
    }
    
    # Factor 3: Detection consistency (0 = consistent, 1 = inconsistent)
    if len(candidates) > 1:
        saliencies = [c["saliency_score"] for c in candidates]
        consistency = min(np.std(saliencies) / (np.mean(saliencies) + 1e-10), 1.0)
    else:
        consistency = 0.3  # Single or no candidate
    
    factors["detection_consistency"] = {
        "score": round(consistency, 4),
        "weight": 0.20,
        "description": "Variability in saliency scores across detected candidates"
    }
    
    # Factor 4: Stability proxy (perturbation-based)
    stability = _estimate_detection_stability(image, candidates)
    factors["detection_stability"] = {
        "score": round(stability, 4),
        "weight": 0.15,
        "description": "Estimated stability of detection under small preprocessing changes"
    }
    
    # Factor 5: Information sufficiency
    h, w = image.shape[:2]
    resolution_factor = 1.0 - min((h * w) / (256 * 256), 1.0)
    sufficiency = 0.5 * resolution_factor + 0.5 * quality_entropy
    factors["information_sufficiency"] = {
        "score": round(sufficiency, 4),
        "weight": 0.15,
        "description": "Whether the image provides sufficient information for analysis"
    }
    
    # Weighted combination
    total_uncertainty = sum(
        f["score"] * f["weight"] for f in factors.values()
    )
    total_uncertainty = max(0.0, min(1.0, total_uncertainty))
    
    return {
        "uncertainty_score": round(total_uncertainty, 4),
        "factors": factors,
        "methodology_note": (
            "This uncertainty score is a heuristic proxy computed from measurable "
            "image properties (quality, candidate strength, detection consistency, "
            "stability, and information sufficiency). It is NOT a statistically "
            "calibrated probabilistic estimate. The formula is: "
            "uncertainty = Σ(factor_score × factor_weight) where weights sum to 1.0."
        ),
    }


def _estimate_detection_stability(
    image: np.ndarray,
    candidates: List[Dict[str, Any]]
) -> float:
    """
    Estimate detection stability by checking if small image perturbations
    would significantly change the analysis.
    
    Returns instability score (0 = stable, 1 = unstable)
    """
    if not candidates:
        return 0.5
    
    # Simple perturbation: slight brightness change
    img_bright = np.clip(image.astype(np.int16) + 5, 0, 255).astype(np.uint8)
    img_dark = np.clip(image.astype(np.int16) - 5, 0, 255).astype(np.uint8)
    
    # Check if candidate region features change significantly
    best = candidates[0]
    bbox = best["bbox"]
    x, y, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
    
    # Extract regions
    region_orig = image[y:y+bh, x:x+bw].astype(np.float64)
    region_bright = img_bright[y:y+bh, x:x+bw].astype(np.float64)
    region_dark = img_dark[y:y+bh, x:x+bw].astype(np.float64)
    
    if region_orig.size == 0:
        return 0.5
    
    # Measure relative change in region features
    std_orig = np.std(region_orig)
    std_bright = np.std(region_bright)
    std_dark = np.std(region_dark)
    
    if std_orig > 1e-10:
        change_bright = abs(std_bright - std_orig) / std_orig
        change_dark = abs(std_dark - std_orig) / std_orig
        instability = (change_bright + change_dark) / 2
    else:
        instability = 0.5
    
    return min(instability * 10, 1.0)  # Scale up small changes


def compute_insertion_deletion_audit(
    image: np.ndarray,
    candidate: Dict[str, Any],
    num_steps: int = 20,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Perform insertion/deletion faithfulness audit.
    
    Insertion: progressively reveal candidate region features onto a baseline.
    Deletion: progressively remove candidate region features.
    
    The scoring function is an image-derived saliency metric based on
    local contrast and feature intensity, NOT a neural network classifier.
    
    Args:
        image: Processed grayscale image
        candidate: Selected candidate dict (must include _mask or bbox)
        num_steps: Number of perturbation steps
        seed: Random seed for reproducibility
    
    Returns:
        Dictionary with insertion/deletion curves, AUCs, and AFS
    """
    np.random.seed(seed)
    
    h, w = image.shape[:2]
    img_float = image.astype(np.float64) / 255.0
    
    # Create importance map for the candidate region
    bbox = candidate["bbox"]
    bx, by = bbox["x"], bbox["y"]
    bw, bh = bbox["width"], bbox["height"]
    
    # Use gradient magnitude as importance within the region
    grad_x = cv2.Sobel(img_float, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(img_float, cv2.CV_64F, 0, 1, ksize=3)
    importance = np.sqrt(grad_x ** 2 + grad_y ** 2)
    
    # Normalize importance
    imp_max = importance.max()
    if imp_max > 1e-10:
        importance = importance / imp_max
    
    # Sort pixels by importance (descending)
    pixel_indices = np.argsort(importance.ravel())[::-1]
    total_pixels = len(pixel_indices)
    step_size = max(1, total_pixels // num_steps)
    
    # Baseline: blurred version of the image
    baseline = cv2.GaussianBlur(image, (31, 31), 10).astype(np.float64) / 255.0
    
    # Scoring function: measures "how much diagnostic-relevant information is present"
    # Based on local contrast and feature intensity in the candidate region
    def score_image(img: np.ndarray) -> float:
        """
        Image-derived saliency score.
        NOT a neural network classifier output.
        """
        region = img[by:by+bh, bx:bx+bw]
        if region.size == 0:
            return 0.0
        
        # Local contrast relative to surroundings
        pad = 20
        y1 = max(0, by - pad)
        y2 = min(h, by + bh + pad)
        x1 = max(0, bx - pad)
        x2 = min(w, bx + bw + pad)
        surround = img[y1:y2, x1:x2]
        
        contrast = abs(np.mean(region) - np.mean(surround))
        
        # Edge content within region
        region_uint8 = (np.clip(region, 0, 1) * 255).astype(np.uint8)
        edges = cv2.Canny(region_uint8, 30, 100)
        edge_content = np.sum(edges > 0) / (edges.size + 1e-10)
        
        # Feature intensity
        region_std = np.std(region)
        
        score = 0.4 * min(contrast * 5, 1.0) + 0.3 * min(edge_content * 10, 1.0) + 0.3 * min(region_std * 5, 1.0)
        return float(score)
    
    # Insertion: progressively reveal important pixels from baseline
    insertion_scores = []
    current = baseline.copy()
    for step in range(num_steps + 1):
        score = score_image(current)
        insertion_scores.append(score)
        
        if step < num_steps:
            start_idx = step * step_size
            end_idx = min((step + 1) * step_size, total_pixels)
            indices = pixel_indices[start_idx:end_idx]
            rows, cols = np.unravel_index(indices, (h, w))
            current[rows, cols] = img_float[rows, cols]
    
    # Deletion: progressively remove important pixels
    deletion_scores = []
    current = img_float.copy()
    for step in range(num_steps + 1):
        score = score_image(current)
        deletion_scores.append(score)
        
        if step < num_steps:
            start_idx = step * step_size
            end_idx = min((step + 1) * step_size, total_pixels)
            indices = pixel_indices[start_idx:end_idx]
            rows, cols = np.unravel_index(indices, (h, w))
            current[rows, cols] = baseline[rows, cols]
    
    # Compute AUCs using trapezoidal rule
    x_vals = np.linspace(0, 1, num_steps + 1)
    trapz_func = getattr(np, "trapezoid", getattr(np, "trapz", None))
    auc_insertion = float(trapz_func(insertion_scores, x_vals))
    auc_deletion = float(trapz_func(deletion_scores, x_vals))
    
    # Aggregated Faithfulness Score: AFS = (AUC_insertion - AUC_deletion + 1) / 2
    afs = compute_afs(auc_insertion, auc_deletion)
    
    return {
        "insertion_scores": [round(s, 4) for s in insertion_scores],
        "deletion_scores": [round(s, 4) for s in deletion_scores],
        "x_values": [round(x, 4) for x in x_vals.tolist()],
        "auc_insertion": round(auc_insertion, 4),
        "auc_deletion": round(auc_deletion, 4),
        "afs": round(afs, 4),
        "num_steps": num_steps,
        "candidate_id": candidate["id"],
        "methodology_note": (
            "This insertion/deletion audit uses an image-derived saliency scoring "
            "function (based on local contrast, edge content, and intensity variation), "
            "NOT a trained diagnostic classifier. The AFS formula is: "
            "AFS = (AUC_insertion - AUC_deletion + 1) / 2. The curves show how "
            "the score changes as important pixels are progressively inserted (from "
            "a blurred baseline) or deleted (replaced with blurred values)."
        ),
    }


def compute_afs(auc_insertion: float, auc_deletion: float) -> float:
    """
    Compute Aggregated Faithfulness Score.
    
    Formula: AFS = (AUC_insertion - AUC_deletion + 1) / 2
    
    Valid range: [0, 1] where higher is better.
    
    Args:
        auc_insertion: Area under insertion curve
        auc_deletion: Area under deletion curve
    
    Returns:
        AFS value, or NaN if inputs are invalid
    """
    if not (np.isfinite(auc_insertion) and np.isfinite(auc_deletion)):
        return float('nan')
    
    afs = (auc_insertion - auc_deletion + 1) / 2
    return max(0.0, min(1.0, afs))
