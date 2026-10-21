"""
Module [103]: Counterfactual-style image comparison and difference-map generation.

Implements:
- Reference image generation via controlled smoothing / local background estimation
- Pixel-wise difference map: ΔI = |I - I_reference|
- Colormap application and overlay
- Difference statistics
- Side-by-side comparison support

Note: The reference image is a computational baseline produced by image processing,
NOT a learned healthy-anatomy reconstruction. This is clearly labeled throughout.
"""
import cv2
import numpy as np
from typing import Dict, Any, Optional, Tuple


# Available colormaps for difference visualization
COLORMAPS = {
    "jet": cv2.COLORMAP_JET,
    "hot": cv2.COLORMAP_HOT,
    "inferno": cv2.COLORMAP_INFERNO,
    "viridis": cv2.COLORMAP_VIRIDIS,
    "magma": cv2.COLORMAP_MAGMA,
    "plasma": cv2.COLORMAP_PLASMA,
    "turbo": cv2.COLORMAP_TURBO,
    "bone": cv2.COLORMAP_BONE,
}


def generate_reference_image(
    image: np.ndarray,
    method: str = "gaussian_background",
    kernel_size: int = 31
) -> np.ndarray:
    """
    Generate a reference image using reproducible image-processing operations.
    
    This is a COMPUTATIONAL BASELINE, not a learned healthy-anatomy reconstruction.
    
    Methods:
    - 'gaussian_background': Heavy Gaussian blur to estimate local background
    - 'median_background': Large-kernel median filter
    - 'morphological_background': Morphological opening for background estimation
    
    Args:
        image: Preprocessed grayscale image (uint8)
        method: Reference generation method
        kernel_size: Kernel size for smoothing (must be odd)
    
    Returns:
        Reference image (uint8, same dimensions as input)
    """
    # Ensure odd kernel size
    ks = kernel_size if kernel_size % 2 == 1 else kernel_size + 1
    
    if method == "gaussian_background":
        # Heavy Gaussian smoothing to estimate local tissue background
        reference = cv2.GaussianBlur(image, (ks, ks), sigmaX=ks / 3)
    
    elif method == "median_background":
        # Large-window median for robust background
        reference = cv2.medianBlur(image, min(ks, 31))
    
    elif method == "morphological_background":
        # Morphological opening: removes bright features smaller than kernel
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ks, ks))
        reference = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
    
    else:
        reference = cv2.GaussianBlur(image, (ks, ks), sigmaX=ks / 3)
    
    return reference


def compute_difference_map(
    original: np.ndarray,
    reference: np.ndarray
) -> np.ndarray:
    """
    Compute pixel-wise absolute difference: ΔI = |I - I_reference|
    
    Args:
        original: Original processed image (uint8)
        reference: Reference/baseline image (uint8)
    
    Returns:
        Difference map (float64, non-negative)
    """
    diff = np.abs(original.astype(np.float64) - reference.astype(np.float64))
    return diff


def colorize_difference_map(
    diff_map: np.ndarray,
    colormap_name: str = "jet",
    normalize: bool = True
) -> np.ndarray:
    """
    Apply a colormap to the difference map for visualization.
    
    Returns:
        RGB image (uint8) with colormap applied
    """
    if normalize:
        dmax = diff_map.max()
        if dmax > 1e-10:
            norm = (diff_map / dmax * 255).astype(np.uint8)
        else:
            norm = np.zeros_like(diff_map, dtype=np.uint8)
    else:
        norm = np.clip(diff_map, 0, 255).astype(np.uint8)
    
    cmap = COLORMAPS.get(colormap_name, cv2.COLORMAP_JET)
    colored = cv2.applyColorMap(norm, cmap)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)


def create_overlay(
    original: np.ndarray,
    diff_colored: np.ndarray,
    opacity: float = 0.5
) -> np.ndarray:
    """
    Create an overlay of the colored difference map on the original image.
    
    Args:
        original: Grayscale image
        diff_colored: RGB colorized difference map
        opacity: Blend opacity for the difference map (0 = original, 1 = diff only)
    
    Returns:
        RGB blended image
    """
    if original.ndim == 2:
        base = cv2.cvtColor(original, cv2.COLOR_GRAY2RGB)
    else:
        base = original.copy()
    
    opacity = max(0.0, min(1.0, opacity))
    blended = cv2.addWeighted(base, 1.0 - opacity, diff_colored, opacity, 0)
    return blended


def compute_difference_statistics(
    diff_map: np.ndarray,
    original: np.ndarray,
    reference: np.ndarray
) -> Dict[str, Any]:
    """
    Compute statistics for the difference map.
    
    Returns:
        Dictionary of difference statistics
    """
    return {
        "mean_difference": float(np.mean(diff_map)),
        "std_difference": float(np.std(diff_map)),
        "max_difference": float(np.max(diff_map)),
        "min_difference": float(np.min(diff_map)),
        "median_difference": float(np.median(diff_map)),
        "mean_absolute_difference": float(np.mean(np.abs(diff_map))),
        "rmse": float(np.sqrt(np.mean(diff_map ** 2))),
        "psnr": _compute_psnr(original, reference),
        "ssim_estimate": _compute_simple_ssim(original, reference),
        "nonzero_ratio": float(np.sum(diff_map > 5) / diff_map.size),
        "high_diff_ratio": float(np.sum(diff_map > np.percentile(diff_map, 95)) / diff_map.size),
        "original_mean": float(np.mean(original.astype(np.float64))),
        "reference_mean": float(np.mean(reference.astype(np.float64))),
    }


def _compute_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute Peak Signal-to-Noise Ratio."""
    mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
    if mse < 1e-10:
        return 100.0  # Identical images
    return float(10 * np.log10(255.0 ** 2 / mse))


def _compute_simple_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute simplified structural similarity index."""
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    
    img1_f = img1.astype(np.float64)
    img2_f = img2.astype(np.float64)
    
    mu1 = cv2.GaussianBlur(img1_f, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(img2_f, (11, 11), 1.5)
    
    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2
    
    sigma1_sq = cv2.GaussianBlur(img1_f ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(img2_f ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(img1_f * img2_f, (11, 11), 1.5) - mu1_mu2
    
    num = (2 * mu1_mu2 + c1) * (2 * sigma12 + c2)
    den = (mu1_sq + mu2_sq + c1) * (sigma1_sq + sigma2_sq + c2)
    
    ssim_map = num / den
    return float(np.mean(ssim_map))


def run_counterfactual_analysis(
    processed_image: np.ndarray,
    reference_method: str = "gaussian_background",
    kernel_size: int = 31,
    colormap: str = "jet",
    overlay_opacity: float = 0.5,
) -> Dict[str, Any]:
    """
    Complete counterfactual-style analysis pipeline for Module [103].
    
    Returns:
        Dictionary containing reference image, difference map, overlays, and statistics
    """
    # Generate reference
    reference = generate_reference_image(processed_image, reference_method, kernel_size)
    
    # Compute difference
    diff_map = compute_difference_map(processed_image, reference)
    
    # Colorize
    diff_colored = colorize_difference_map(diff_map, colormap)
    
    # Create overlay
    overlay = create_overlay(processed_image, diff_colored, overlay_opacity)
    
    # Statistics
    stats = compute_difference_statistics(diff_map, processed_image, reference)
    
    return {
        "reference_image": reference,
        "difference_map": diff_map,
        "difference_colored": diff_colored,
        "overlay": overlay,
        "statistics": stats,
        "settings": {
            "reference_method": reference_method,
            "kernel_size": kernel_size,
            "colormap": colormap,
            "overlay_opacity": overlay_opacity,
        },
        "methodology_note": (
            "The reference image is a computational baseline produced by "
            f"{reference_method} smoothing, NOT a learned healthy-anatomy "
            "reconstruction. The difference map shows ΔI = |I - I_reference|."
        ),
    }
