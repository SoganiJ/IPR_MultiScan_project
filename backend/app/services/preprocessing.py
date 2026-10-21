"""
Module [101]: Preprocessing and multi-scale wavelet decomposition.

Implements:
- Image normalization
- Grayscale conversion
- Noise reduction (Gaussian, bilateral, non-local means)
- Contrast enhancement (CLAHE, histogram equalization)
- Two-level discrete wavelet decomposition using PyWavelets
- Subband extraction and visualization
- Image statistics and texture measurements
"""
import cv2
import numpy as np
import pywt
from typing import Dict, List, Optional, Tuple, Any


def to_grayscale(image: np.ndarray) -> np.ndarray:
    """Convert image to grayscale if needed."""
    if image.ndim == 3 and image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    elif image.ndim == 3 and image.shape[2] == 1:
        return image[:, :, 0]
    return image.copy()


def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    Normalize image to [0, 255] uint8 range.
    Handles edge case where all pixels have the same value.
    """
    img = image.astype(np.float64)
    vmin, vmax = img.min(), img.max()
    if vmax - vmin < 1e-10:
        return np.full_like(image, 128, dtype=np.uint8)
    normalized = ((img - vmin) / (vmax - vmin) * 255.0)
    return normalized.astype(np.uint8)


def denoise_image(
    image: np.ndarray,
    method: str = "gaussian",
    strength: int = 5
) -> np.ndarray:
    """
    Apply noise reduction filter.
    
    Args:
        image: Input grayscale image (uint8)
        method: 'gaussian', 'bilateral', or 'nlm' (non-local means)
        strength: Filter strength (kernel size for gaussian, or strength for others)
    
    Returns:
        Denoised image
    """
    # Ensure odd kernel size
    ksize = max(3, strength if strength % 2 == 1 else strength + 1)
    
    if method == "gaussian":
        return cv2.GaussianBlur(image, (ksize, ksize), 0)
    elif method == "bilateral":
        return cv2.bilateralFilter(image, d=ksize, sigmaColor=75, sigmaSpace=75)
    elif method == "nlm":
        # Non-local means denoising
        h = max(3, strength)
        return cv2.fastNlMeansDenoising(image, None, h=h, templateWindowSize=7, searchWindowSize=21)
    else:
        return cv2.GaussianBlur(image, (ksize, ksize), 0)


def enhance_contrast(
    image: np.ndarray,
    method: str = "clahe",
    clip_limit: float = 2.0,
    grid_size: int = 8
) -> np.ndarray:
    """
    Apply contrast enhancement.
    
    Args:
        image: Input grayscale image (uint8)
        method: 'clahe', 'histogram_eq', or 'none'
        clip_limit: CLAHE clip limit
        grid_size: CLAHE tile grid size
    
    Returns:
        Contrast-enhanced image
    """
    if method == "clahe":
        clahe = cv2.createCLAHE(
            clipLimit=clip_limit,
            tileGridSize=(grid_size, grid_size)
        )
        return clahe.apply(image)
    elif method == "histogram_eq":
        return cv2.equalizeHist(image)
    elif method == "none":
        return image.copy()
    else:
        return image.copy()


def resize_for_processing(
    image: np.ndarray,
    max_dim: int = 512
) -> Tuple[np.ndarray, float]:
    """
    Resize image for processing if needed, preserving aspect ratio.
    
    Returns:
        Tuple of (resized image, scale factor)
    """
    h, w = image.shape[:2]
    if max(h, w) <= max_dim:
        return image.copy(), 1.0
    
    scale = max_dim / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized, scale


def compute_wavelet_decomposition(
    image: np.ndarray,
    wavelet: str = "db2",
    level: int = 2
) -> Dict[str, Any]:
    """
    Perform multi-level 2D discrete wavelet transform.
    
    Module [101]: Multi-scale wavelet decomposition.
    
    Args:
        image: Grayscale image (uint8)
        wavelet: Wavelet family name (e.g., 'db2', 'haar', 'sym4')
        level: Decomposition level (1 or 2)
    
    Returns:
        Dictionary containing:
        - coeffs: Raw wavelet coefficients
        - subbands: Dict of named subband images (normalized to uint8 for display)
        - metadata: Decomposition parameters and statistics
    """
    # Convert to float for wavelet transform
    img_float = image.astype(np.float64) / 255.0
    
    # Perform multi-level DWT
    coeffs = pywt.wavedec2(img_float, wavelet=wavelet, level=level)
    
    result = {
        "coeffs": coeffs,
        "subbands": {},
        "metadata": {
            "wavelet": wavelet,
            "level": level,
            "original_shape": list(image.shape),
        }
    }
    
    # Extract and normalize subbands for visualization
    # Level 1 detail coefficients
    if level >= 1:
        cH1, cV1, cD1 = coeffs[-1]  # Last element = finest level
        result["subbands"]["LH1"] = _normalize_subband(cH1, "LH1 (Level 1 Horizontal Detail)")
        result["subbands"]["HL1"] = _normalize_subband(cV1, "HL1 (Level 1 Vertical Detail)")
        result["subbands"]["HH1"] = _normalize_subband(cD1, "HH1 (Level 1 Diagonal Detail)")
    
    # Level 2 detail coefficients
    if level >= 2:
        cH2, cV2, cD2 = coeffs[-2]
        result["subbands"]["LH2"] = _normalize_subband(cH2, "LH2 (Level 2 Horizontal Detail)")
        result["subbands"]["HL2"] = _normalize_subband(cV2, "HL2 (Level 2 Vertical Detail)")
        result["subbands"]["HH2"] = _normalize_subband(cD2, "HH2 (Level 2 Diagonal Detail)")
    
    # Approximation coefficients (lowest frequency)
    ll = coeffs[0]
    result["subbands"]["LL"] = _normalize_subband(ll, f"LL (Level {level} Approximation)")
    
    # Compute subband statistics
    all_subbands = {}
    for name, data in result["subbands"].items():
        all_subbands[name] = {
            "shape": list(data["array"].shape),
            "energy": float(np.sum(data["raw"] ** 2)),
            "mean": float(np.mean(np.abs(data["raw"]))),
            "std": float(np.std(data["raw"])),
            "max": float(np.max(np.abs(data["raw"]))),
        }
    result["metadata"]["subband_stats"] = all_subbands
    
    return result


def _normalize_subband(coeffs: np.ndarray, label: str) -> Dict:
    """Normalize wavelet coefficients to uint8 for display."""
    abs_coeffs = np.abs(coeffs)
    vmax = abs_coeffs.max()
    if vmax > 1e-10:
        display = (abs_coeffs / vmax * 255).astype(np.uint8)
    else:
        display = np.zeros_like(coeffs, dtype=np.uint8)
    
    return {
        "array": display,
        "raw": coeffs,
        "label": label,
        "shape": list(coeffs.shape),
    }


def compute_image_statistics(image: np.ndarray) -> Dict[str, Any]:
    """
    Compute comprehensive image statistics and texture measurements.
    
    Args:
        image: Grayscale image (uint8)
    
    Returns:
        Dictionary of image statistics
    """
    img_float = image.astype(np.float64)
    
    stats = {
        "dimensions": {"width": image.shape[1], "height": image.shape[0]},
        "intensity": {
            "min": int(image.min()),
            "max": int(image.max()),
            "mean": float(np.mean(img_float)),
            "std": float(np.std(img_float)),
            "median": float(np.median(img_float)),
            "dynamic_range": int(image.max()) - int(image.min()),
        },
        "histogram": {
            "bins": list(range(0, 257, 16)),
            "counts": [int(x) for x in np.histogram(image, bins=range(0, 257, 16))[0]],
        },
    }
    
    # Texture measurements
    # Local variance (texture complexity)
    local_mean = cv2.blur(img_float, (15, 15))
    local_var = cv2.blur((img_float - local_mean) ** 2, (15, 15))
    stats["texture"] = {
        "local_variance_mean": float(np.mean(local_var)),
        "local_variance_std": float(np.std(local_var)),
    }
    
    # Edge density
    edges = cv2.Canny(image, 50, 150)
    edge_density = float(np.sum(edges > 0) / edges.size)
    stats["texture"]["edge_density"] = edge_density
    
    # Gradient magnitude
    grad_x = cv2.Sobel(img_float, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(img_float, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(grad_x ** 2 + grad_y ** 2)
    stats["texture"]["gradient_mean"] = float(np.mean(grad_mag))
    stats["texture"]["gradient_std"] = float(np.std(grad_mag))
    
    # Shannon entropy
    hist, _ = np.histogram(image, bins=256, range=(0, 256))
    probs = hist / hist.sum()
    probs = probs[probs > 0]
    entropy = -np.sum(probs * np.log2(probs))
    stats["texture"]["entropy"] = float(entropy)
    
    return stats


def preprocess_image(
    image: np.ndarray,
    denoise_method: str = "gaussian",
    denoise_strength: int = 5,
    contrast_method: str = "clahe",
    clahe_clip: float = 2.0,
    clahe_grid: int = 8,
    processing_size: int = 512
) -> Dict[str, Any]:
    """
    Complete preprocessing pipeline for Module [101].
    
    Returns dictionary with:
    - gray: Grayscale image
    - processed: Preprocessed image
    - scale_factor: Resize scale factor
    - statistics: Image statistics
    - settings: Applied settings
    """
    # Convert to grayscale
    gray = to_grayscale(image)
    
    # Resize for processing
    resized, scale = resize_for_processing(gray, processing_size)
    
    # Denoise
    denoised = denoise_image(resized, method=denoise_method, strength=denoise_strength)
    
    # Enhance contrast
    enhanced = enhance_contrast(
        denoised, method=contrast_method,
        clip_limit=clahe_clip, grid_size=clahe_grid
    )
    
    # Compute statistics on processed image
    statistics = compute_image_statistics(enhanced)
    
    return {
        "gray": gray,
        "resized": resized,
        "processed": enhanced,
        "scale_factor": scale,
        "statistics": statistics,
        "settings": {
            "denoise_method": denoise_method,
            "denoise_strength": denoise_strength,
            "contrast_method": contrast_method,
            "clahe_clip": clahe_clip,
            "clahe_grid": clahe_grid,
            "processing_size": processing_size,
        }
    }
