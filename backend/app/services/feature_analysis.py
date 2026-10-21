"""
Module [102]: Dual-branch feature analysis and cross-scale feature integration.
Module [103]: Candidate localization from image features.

Implements:
- Multi-scale feature extraction using wavelet subbands and image gradients
- Cross-scale feature integration (combining detail from different resolution levels)
- Connected-component-based candidate region detection
- Candidate ranking using image-derived features
- Feature computation for each candidate region
"""
import cv2
import numpy as np
from scipy import ndimage
from skimage import measure, morphology
from typing import Dict, List, Any, Optional, Tuple


def compute_multiscale_features(
    processed_image: np.ndarray,
    wavelet_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Module [102]: Extract features at multiple scales and integrate them.
    
    Combines:
    - Fine-scale edge and gradient features from the processed image
    - Coarse-scale structural features from wavelet approximation
    - Detail features from wavelet subbands (LH, HL, HH at each level)
    
    Returns:
        Dictionary containing multi-scale feature maps and metadata
    """
    h, w = processed_image.shape[:2]
    img_float = processed_image.astype(np.float64) / 255.0
    
    # Fine-scale features from processed image
    grad_x = cv2.Sobel(img_float, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(img_float, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = np.sqrt(grad_x ** 2 + grad_y ** 2)
    
    # Local standard deviation (texture complexity at fine scale)
    local_mean = cv2.blur(img_float, (11, 11))
    local_var = cv2.blur((img_float - local_mean) ** 2, (11, 11))
    local_std = np.sqrt(local_var + 1e-10)
    
    # Coarse-scale features from wavelet subbands
    subbands = wavelet_result["subbands"]
    
    # Resize wavelet subbands to match processed image size
    detail_maps = {}
    for name, subband_data in subbands.items():
        if name == "LL":
            continue  # Skip approximation for detail analysis
        resized = cv2.resize(
            subband_data["array"].astype(np.float64),
            (w, h),
            interpolation=cv2.INTER_LINEAR
        )
        detail_maps[name] = resized / (resized.max() + 1e-10)
    
    # Cross-scale integration: combine detail from different levels
    # Weighted combination emphasizing finer details
    level1_detail = np.zeros((h, w), dtype=np.float64)
    level2_detail = np.zeros((h, w), dtype=np.float64)
    
    for name, detail in detail_maps.items():
        if "1" in name:
            level1_detail += detail
        elif "2" in name:
            level2_detail += detail
    
    # Normalize each level
    level1_detail = level1_detail / (level1_detail.max() + 1e-10)
    level2_detail = level2_detail / (level2_detail.max() + 1e-10)
    
    # Integrated feature map: weighted sum of multi-scale features
    # Fine-scale gradient + level-1 wavelet detail + level-2 structure
    integrated = (
        0.35 * (gradient_magnitude / (gradient_magnitude.max() + 1e-10)) +
        0.35 * level1_detail +
        0.15 * level2_detail +
        0.15 * (local_std / (local_std.max() + 1e-10))
    )
    
    return {
        "gradient_magnitude": gradient_magnitude,
        "local_std": local_std,
        "level1_detail": level1_detail,
        "level2_detail": level2_detail,
        "integrated_feature_map": integrated,
        "detail_maps": detail_maps,
    }


def detect_candidates(
    processed_image: np.ndarray,
    feature_map: np.ndarray,
    intensity_threshold_percentile: float = 85,
    min_area: int = 50,
    max_area_ratio: float = 0.25,
    morphology_size: int = 3
) -> List[Dict[str, Any]]:
    """
    Module [103]: Detect candidate regions from the integrated feature map.
    
    Uses thresholding, connected components, and morphological filtering
    to identify regions that deserve closer inspection.
    
    Args:
        processed_image: Preprocessed grayscale image
        feature_map: Integrated multi-scale feature map
        intensity_threshold_percentile: Percentile for thresholding
        min_area: Minimum candidate area in pixels
        max_area_ratio: Maximum candidate area as ratio of image area
        morphology_size: Structuring element size for morphological ops
    
    Returns:
        List of candidate region dictionaries, ranked by saliency score
    """
    h, w = processed_image.shape[:2]
    total_area = h * w
    max_area = int(total_area * max_area_ratio)
    
    # Normalize feature map to [0, 255]
    feat_norm = (feature_map / (feature_map.max() + 1e-10) * 255).astype(np.uint8)
    
    # Adaptive thresholding on feature map
    threshold_value = np.percentile(feat_norm, intensity_threshold_percentile)
    _, binary = cv2.threshold(feat_norm, int(threshold_value), 255, cv2.THRESH_BINARY)
    
    # Morphological operations to clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morphology_size, morphology_size))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Connected component analysis
    labeled, num_labels = ndimage.label(binary)
    
    candidates = []
    img_float = processed_image.astype(np.float64)
    
    for label_id in range(1, num_labels + 1):
        mask = (labeled == label_id)
        area = int(np.sum(mask))
        
        # Filter by area
        if area < min_area or area > max_area:
            continue
        
        # Compute bounding box
        coords = np.where(mask)
        y_min, y_max = int(coords[0].min()), int(coords[0].max())
        x_min, x_max = int(coords[1].min()), int(coords[1].max())
        bbox_w = x_max - x_min + 1
        bbox_h = y_max - y_min + 1
        
        # Compute candidate features
        region_pixels = img_float[mask]
        
        # Surrounding region (dilated mask minus original mask)
        dilated = cv2.dilate(mask.astype(np.uint8), kernel, iterations=3)
        surround_mask = (dilated > 0) & (~mask)
        surround_pixels = img_float[surround_mask] if surround_mask.any() else region_pixels
        
        # Feature scores
        mean_intensity = float(np.mean(region_pixels))
        std_intensity = float(np.std(region_pixels))
        surround_mean = float(np.mean(surround_pixels))
        local_contrast = abs(mean_intensity - surround_mean)
        
        # Edge density within region
        edges = cv2.Canny(processed_image, 50, 150)
        edge_density = float(np.sum(edges[mask] > 0) / area) if area > 0 else 0.0
        
        # Feature map intensity within region
        feature_strength = float(np.mean(feature_map[mask]))
        
        # Shape features
        perimeter = float(measure.perimeter(mask))
        compactness = (4 * np.pi * area) / (perimeter ** 2 + 1e-10)
        
        # Irregularity (1 - compactness; higher = more irregular)
        irregularity = 1.0 - min(compactness, 1.0)
        
        # Texture variation within region
        texture_var = float(np.var(region_pixels))
        
        # Gradient strength at boundary
        grad_x = cv2.Sobel(img_float, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(img_float, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(grad_x ** 2 + grad_y ** 2)
        boundary_mask = cv2.dilate(mask.astype(np.uint8), kernel, iterations=1) - mask.astype(np.uint8)
        boundary_strength = float(np.mean(grad_mag[boundary_mask > 0])) if boundary_mask.any() else 0.0
        
        # Saliency score: composite ranking metric
        saliency = (
            0.25 * min(local_contrast / 50.0, 1.0) +
            0.25 * min(feature_strength, 1.0) +
            0.20 * min(edge_density * 5.0, 1.0) +
            0.15 * min(boundary_strength / 50.0, 1.0) +
            0.15 * min(irregularity, 1.0)
        )
        
        candidate = {
            "id": len(candidates),
            "bbox": {
                "x": x_min, "y": y_min,
                "width": bbox_w, "height": bbox_h
            },
            "center": {
                "x": int((x_min + x_max) / 2),
                "y": int((y_min + y_max) / 2)
            },
            "area": area,
            "features": {
                "mean_intensity": round(mean_intensity, 2),
                "std_intensity": round(std_intensity, 2),
                "local_contrast": round(local_contrast, 2),
                "surround_mean": round(surround_mean, 2),
                "edge_density": round(edge_density, 4),
                "feature_strength": round(feature_strength, 4),
                "compactness": round(compactness, 4),
                "irregularity": round(irregularity, 4),
                "texture_variation": round(texture_var, 2),
                "boundary_strength": round(boundary_strength, 2),
                "perimeter": round(perimeter, 2),
            },
            "saliency_score": round(saliency, 4),
            "mask_shape": list(mask.shape),
        }
        
        # Store mask indices for later use (not serialized to JSON)
        candidate["_mask"] = mask
        
        candidates.append(candidate)
    
    # Sort by saliency score (descending)
    candidates.sort(key=lambda c: c["saliency_score"], reverse=True)
    
    # Re-assign IDs after sorting
    for i, c in enumerate(candidates):
        c["id"] = i
    
    return candidates


def generate_candidate_overlay(
    image: np.ndarray,
    candidates: List[Dict[str, Any]],
    selected_id: Optional[int] = None
) -> np.ndarray:
    """
    Draw candidate bounding boxes on the image.
    
    Args:
        image: Grayscale or RGB image
        candidates: List of candidate dictionaries
        selected_id: ID of currently selected candidate (highlighted)
    
    Returns:
        RGB image with overlaid candidate boxes
    """
    if image.ndim == 2:
        overlay = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    else:
        overlay = image.copy()
    
    for candidate in candidates:
        bbox = candidate["bbox"]
        x, y, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
        
        is_selected = (candidate["id"] == selected_id)
        
        # Color: cyan for selected, green for others
        color = (0, 255, 255) if is_selected else (0, 200, 100)
        thickness = 3 if is_selected else 1
        
        cv2.rectangle(overlay, (x, y), (x + bw, y + bh), color, thickness)
        
        # Label with ID and saliency score
        label = f"#{candidate['id']} ({candidate['saliency_score']:.2f})"
        label_y = max(y - 5, 15)
        cv2.putText(overlay, label, (x, label_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)
    
    return overlay


def generate_feature_heatmap(
    feature_map: np.ndarray,
    colormap: int = cv2.COLORMAP_JET
) -> np.ndarray:
    """Generate a colored heatmap from a feature map."""
    norm = (feature_map / (feature_map.max() + 1e-10) * 255).astype(np.uint8)
    heatmap = cv2.applyColorMap(norm, colormap)
    return cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
