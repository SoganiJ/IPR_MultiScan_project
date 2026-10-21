"""
Synthetic sample image generator.

Generates medical-style grayscale test images programmatically using NumPy and OpenCV.
These are synthetic image-processing test cases, NOT actual medical scans.
"""
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

from app.core.config import SAMPLE_DIR


SAMPLE_CASES = [
    {
        "id": "sample_001",
        "name": "Low-Contrast Circular Region",
        "description": "Synthetic grayscale image with a subtle low-contrast circular region embedded in uniform tissue-like background. Tests detection sensitivity for subtle features.",
        "category": "subtle_feature",
        "is_synthetic": True,
    },
    {
        "id": "sample_002",
        "name": "Irregular Bright Region",
        "description": "Synthetic image with an irregular bright region against a textured background. Tests shape irregularity detection and boundary analysis.",
        "category": "irregular_feature",
        "is_synthetic": True,
    },
    {
        "id": "sample_003",
        "name": "Multiple Candidate Structures",
        "description": "Synthetic image containing multiple distinct structures of varying size and contrast. Tests multi-candidate detection and ranking.",
        "category": "multiple_features",
        "is_synthetic": True,
    },
    {
        "id": "sample_004",
        "name": "Noisy Low-Contrast Image",
        "description": "Synthetic image with significant noise and poor contrast. Tests robustness and uncertainty estimation under challenging conditions.",
        "category": "noisy",
        "is_synthetic": True,
    },
    {
        "id": "sample_005",
        "name": "Clean Image — No Obvious Candidates",
        "description": "Synthetic image with smooth tissue-like texture and no obvious candidate structures. Tests the system's behavior when nothing significant is found.",
        "category": "no_feature",
        "is_synthetic": True,
    },
]


def _create_tissue_background(h: int, w: int, seed: int = 42) -> np.ndarray:
    """Create a realistic-looking tissue-like background."""
    rng = np.random.RandomState(seed)
    
    # Base gradient
    y_grad = np.linspace(100, 140, h).reshape(-1, 1)
    x_grad = np.linspace(110, 130, w).reshape(1, -1)
    base = (y_grad + x_grad) / 2
    
    # Add low-frequency texture
    noise = rng.randn(h // 8, w // 8) * 15
    noise_resized = cv2.resize(noise, (w, h), interpolation=cv2.INTER_CUBIC)
    
    # Add fine texture
    fine_noise = rng.randn(h, w) * 3
    
    result = base + noise_resized + fine_noise
    return np.clip(result, 0, 255).astype(np.uint8)


def generate_sample_001(size: int = 512) -> np.ndarray:
    """Low-contrast circular region."""
    img = _create_tissue_background(size, size, seed=42)
    
    # Add subtle circular region
    center = (size // 2 + 30, size // 2 - 20)
    radius = 35
    y, x = np.ogrid[:size, :size]
    mask = ((x - center[0]) ** 2 + (y - center[1]) ** 2) <= radius ** 2
    
    # Subtle brightness increase (low contrast)
    img_float = img.astype(np.float64)
    img_float[mask] += 15  # Only 15 levels brighter
    
    # Smooth edges
    blur_mask = np.zeros((size, size), dtype=np.float64)
    blur_mask[mask] = 1.0
    blur_mask = cv2.GaussianBlur(blur_mask, (11, 11), 3)
    
    img_float = img.astype(np.float64) * (1 - blur_mask) + img_float * blur_mask
    
    return np.clip(img_float, 0, 255).astype(np.uint8)


def generate_sample_002(size: int = 512) -> np.ndarray:
    """Irregular bright region."""
    img = _create_tissue_background(size, size, seed=101)
    
    # Create irregular shape using multiple overlapping ellipses
    mask = np.zeros((size, size), dtype=np.uint8)
    cv2.ellipse(mask, (size//2 - 40, size//2 + 20), (45, 25), 30, 0, 360, 255, -1)
    cv2.ellipse(mask, (size//2 - 20, size//2 + 10), (20, 35), -15, 0, 360, 255, -1)
    cv2.ellipse(mask, (size//2 - 50, size//2 + 35), (15, 20), 60, 0, 360, 255, -1)
    
    # Smooth the mask
    mask = cv2.GaussianBlur(mask, (9, 9), 3)
    mask_float = mask.astype(np.float64) / 255.0
    
    # Apply bright feature with internal texture
    rng = np.random.RandomState(202)
    texture = rng.randn(size, size) * 8
    bright = img.astype(np.float64) + 40 * mask_float + texture * mask_float
    
    return np.clip(bright, 0, 255).astype(np.uint8)


def generate_sample_003(size: int = 512) -> np.ndarray:
    """Multiple candidate structures."""
    img = _create_tissue_background(size, size, seed=303)
    img_float = img.astype(np.float64)
    
    # Structure 1: Small bright circle (top-left quadrant)
    y, x = np.ogrid[:size, :size]
    mask1 = ((x - size//4) ** 2 + (y - size//4) ** 2) <= 20 ** 2
    img_float[mask1] += 35
    
    # Structure 2: Larger dark region (bottom-right)
    mask2 = ((x - 3*size//4) ** 2 + (y - 3*size//4) ** 2) <= 40 ** 2
    img_float[mask2] -= 25
    
    # Structure 3: Elongated bright feature (center-right)
    mask3 = np.zeros((size, size), dtype=np.uint8)
    cv2.ellipse(mask3, (3*size//4, size//3), (50, 15), 45, 0, 360, 255, -1)
    mask3_float = cv2.GaussianBlur(mask3, (7, 7), 2).astype(np.float64) / 255.0
    img_float += 30 * mask3_float
    
    # Structure 4: Tiny spot (bottom-left)
    mask4 = ((x - size//4 - 20) ** 2 + (y - 3*size//4 + 10) ** 2) <= 12 ** 2
    img_float[mask4] += 45
    
    return np.clip(img_float, 0, 255).astype(np.uint8)


def generate_sample_004(size: int = 512) -> np.ndarray:
    """Noisy low-contrast image."""
    rng = np.random.RandomState(404)
    
    # Low-contrast base
    base = np.full((size, size), 120, dtype=np.float64)
    base += rng.randn(size, size) * 25  # Heavy noise
    
    # Very subtle feature
    y, x = np.ogrid[:size, :size]
    mask = ((x - size//2 + 15) ** 2 + (y - size//2 - 10) ** 2) <= 30 ** 2
    base[mask] += 8  # Very subtle
    
    # Add low-frequency variation
    low_freq = rng.randn(size // 16, size // 16) * 10
    low_freq_resized = cv2.resize(low_freq, (size, size), interpolation=cv2.INTER_CUBIC)
    base += low_freq_resized
    
    return np.clip(base, 0, 255).astype(np.uint8)


def generate_sample_005(size: int = 512) -> np.ndarray:
    """Clean image with no obvious candidates."""
    rng = np.random.RandomState(505)
    
    # Smooth tissue-like background
    y_grad = np.linspace(90, 160, size).reshape(-1, 1)
    x_grad = np.linspace(100, 150, size).reshape(1, -1)
    base = (y_grad + x_grad) / 2
    
    # Only very smooth low-frequency texture
    smooth_texture = rng.randn(size // 16, size // 16) * 8
    smooth_resized = cv2.resize(smooth_texture, (size, size), interpolation=cv2.INTER_CUBIC)
    base += smooth_resized
    
    # Minimal fine noise
    base += rng.randn(size, size) * 1.5
    
    return np.clip(base, 0, 255).astype(np.uint8)


GENERATORS = {
    "sample_001": generate_sample_001,
    "sample_002": generate_sample_002,
    "sample_003": generate_sample_003,
    "sample_004": generate_sample_004,
    "sample_005": generate_sample_005,
}


def generate_all_samples() -> List[Dict[str, Any]]:
    """Generate all sample images and save them to disk."""
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    
    results = []
    for case in SAMPLE_CASES:
        generator = GENERATORS.get(case["id"])
        if generator is None:
            continue
        
        img = generator()
        filepath = SAMPLE_DIR / f"{case['id']}.png"
        cv2.imwrite(str(filepath), img)
        
        results.append({
            **case,
            "filepath": str(filepath),
            "dimensions": {"width": img.shape[1], "height": img.shape[0]},
            "intensity_range": {"min": int(img.min()), "max": int(img.max())},
        })
    
    return results


def get_sample_cases() -> List[Dict[str, Any]]:
    """Get sample case metadata, generating images if needed."""
    results = []
    for case in SAMPLE_CASES:
        filepath = SAMPLE_DIR / f"{case['id']}.png"
        if not filepath.exists():
            generator = GENERATORS.get(case["id"])
            if generator:
                img = generator()
                cv2.imwrite(str(filepath), img)
        
        if filepath.exists():
            img = cv2.imread(str(filepath), cv2.IMREAD_GRAYSCALE)
            results.append({
                **case,
                "filepath": str(filepath),
                "dimensions": {"width": img.shape[1], "height": img.shape[0]},
                "intensity_range": {"min": int(img.min()), "max": int(img.max())},
            })
    
    return results
