"""Core configuration for the application."""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
SAMPLE_DIR = BASE_DIR / "sample_images"
EXPORT_DIR = BASE_DIR / "exports"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

# Image constraints
MAX_FILE_SIZE_MB = 50
MAX_IMAGE_DIMENSION = 4096
MIN_IMAGE_DIMENSION = 32
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".dcm"}
ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/bmp", "image/tiff",
    "application/dicom", "application/octet-stream"
}

# Processing defaults
DEFAULT_WAVELET = "db2"
DEFAULT_WAVELET_LEVEL = 2
DEFAULT_DENOISE_STRENGTH = 5
DEFAULT_CONTRAST_METHOD = "clahe"
PROCESSING_IMAGE_SIZE = 512

# Safety thresholds (research demo policy)
SAFETY_AFS_THRESHOLD = 0.85
SAFETY_UNCERTAINTY_THRESHOLD = 0.15

# Optional external API (disabled by default)
EXTERNAL_API_KEY = os.environ.get("VISION_API_KEY", "")
EXTERNAL_API_ENABLED = bool(EXTERNAL_API_KEY)
EXTERNAL_API_TIMEOUT = 30
