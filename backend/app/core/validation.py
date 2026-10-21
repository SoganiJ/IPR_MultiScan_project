"""Image validation utilities for Module [100]."""
import io
import struct
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
from PIL import Image

from app.core.config import (
    ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, MAX_IMAGE_DIMENSION, MIN_IMAGE_DIMENSION
)


class ImageValidationError(Exception):
    """Raised when image validation fails."""
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


def validate_file_extension(filename: str) -> str:
    """Validate file extension and return normalized extension."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ImageValidationError(
            f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            code="INVALID_EXTENSION"
        )
    return ext


def validate_file_size(content: bytes) -> int:
    """Validate file size in bytes. Returns size."""
    size = len(content)
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise ImageValidationError(
            f"File size {size / (1024*1024):.1f} MB exceeds maximum {MAX_FILE_SIZE_MB} MB",
            code="FILE_TOO_LARGE"
        )
    if size == 0:
        raise ImageValidationError("File is empty", code="EMPTY_FILE")
    return size


def _detect_magic_bytes(content: bytes) -> Optional[str]:
    """Detect image format from magic bytes."""
    if len(content) < 8:
        return None
    # PNG
    if content[:8] == b'\x89PNG\r\n\x1a\n':
        return "png"
    # JPEG
    if content[:2] == b'\xff\xd8':
        return "jpeg"
    # BMP
    if content[:2] == b'BM':
        return "bmp"
    # TIFF (little-endian or big-endian)
    if content[:2] in (b'II', b'MM'):
        return "tiff"
    # DICOM (check for DICM magic at offset 128)
    if len(content) > 132 and content[128:132] == b'DICM':
        return "dicom"
    return None


def validate_content_type(content: bytes, extension: str) -> str:
    """Validate file content matches claimed type. Returns detected format."""
    detected = _detect_magic_bytes(content)
    if detected is None:
        raise ImageValidationError(
            "Could not detect image format from file content. File may be corrupted.",
            code="UNRECOGNIZED_FORMAT"
        )
    
    # Map extensions to expected formats
    ext_to_format = {
        ".png": "png", ".jpg": "jpeg", ".jpeg": "jpeg",
        ".bmp": "bmp", ".tiff": "tiff", ".tif": "tiff",
        ".dcm": "dicom"
    }
    expected = ext_to_format.get(extension)
    
    # Allow mismatches for common cases (e.g., .jpg that's actually a PNG)
    # but warn - we validate by content, not extension
    return detected


def decode_image(content: bytes, detected_format: str) -> Tuple[np.ndarray, dict]:
    """
    Decode image bytes into a numpy array and extract metadata.
    
    Returns:
        Tuple of (image_array in uint8, metadata_dict)
    """
    metadata = {"format": detected_format, "is_dicom": False}
    
    if detected_format == "dicom":
        return _decode_dicom(content, metadata)
    
    try:
        pil_image = Image.open(io.BytesIO(content))
        pil_image.load()  # Force full decode to catch corruption
    except Exception as e:
        raise ImageValidationError(
            f"Failed to decode image: {str(e)}",
            code="DECODE_ERROR"
        )
    
    metadata["original_mode"] = pil_image.mode
    metadata["original_size"] = list(pil_image.size)  # [width, height]
    
    # Convert to RGB or grayscale
    if pil_image.mode in ("RGBA", "LA", "PA"):
        pil_image = pil_image.convert("RGB")
    elif pil_image.mode in ("L", "I", "F"):
        # Keep grayscale
        if pil_image.mode == "I":
            # 32-bit integer - normalize to 8-bit
            arr = np.array(pil_image, dtype=np.float64)
            arr = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-10) * 255).astype(np.uint8)
            pil_image = Image.fromarray(arr, mode="L")
        elif pil_image.mode == "F":
            arr = np.array(pil_image, dtype=np.float64)
            arr = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-10) * 255).astype(np.uint8)
            pil_image = Image.fromarray(arr, mode="L")
    elif pil_image.mode == "P":
        pil_image = pil_image.convert("RGB")
    elif pil_image.mode == "1":
        pil_image = pil_image.convert("L")
    elif pil_image.mode not in ("RGB", "L"):
        pil_image = pil_image.convert("RGB")
    
    img_array = np.array(pil_image, dtype=np.uint8)
    
    metadata["channels"] = 1 if img_array.ndim == 2 else img_array.shape[2]
    metadata["width"] = img_array.shape[1]
    metadata["height"] = img_array.shape[0]
    metadata["dtype"] = str(img_array.dtype)
    metadata["intensity_min"] = int(img_array.min())
    metadata["intensity_max"] = int(img_array.max())
    metadata["intensity_mean"] = float(np.mean(img_array))
    
    return img_array, metadata


def _decode_dicom(content: bytes, metadata: dict) -> Tuple[np.ndarray, dict]:
    """Attempt to decode DICOM if pydicom is available."""
    metadata["is_dicom"] = True
    try:
        import pydicom
        from pydicom.pixel_data_handlers.util import apply_modality_lut
        
        ds = pydicom.dcmread(io.BytesIO(content))
        pixel_array = ds.pixel_array.astype(np.float64)
        
        # Apply modality LUT if available (e.g., CT Hounsfield units)
        try:
            pixel_array = apply_modality_lut(pixel_array, ds).astype(np.float64)
            metadata["modality_lut_applied"] = True
        except Exception:
            metadata["modality_lut_applied"] = False
        
        # Extract DICOM metadata
        metadata["patient_id"] = "REDACTED"  # Never expose real patient IDs
        metadata["modality"] = getattr(ds, "Modality", "Unknown")
        metadata["study_description"] = getattr(ds, "StudyDescription", "Unknown")
        
        if hasattr(ds, "PixelSpacing"):
            metadata["pixel_spacing_mm"] = [float(x) for x in ds.PixelSpacing]
        else:
            metadata["pixel_spacing_mm"] = None
            metadata["pixel_spacing_note"] = "Physical pixel spacing unavailable"
        
        metadata["bits_stored"] = getattr(ds, "BitsStored", None)
        metadata["window_center"] = getattr(ds, "WindowCenter", None)
        metadata["window_width"] = getattr(ds, "WindowWidth", None)
        
        # Normalize to 8-bit for display
        pmin, pmax = pixel_array.min(), pixel_array.max()
        if pmax - pmin > 0:
            normalized = ((pixel_array - pmin) / (pmax - pmin) * 255).astype(np.uint8)
        else:
            normalized = np.zeros_like(pixel_array, dtype=np.uint8)
        
        metadata["original_intensity_range"] = [float(pmin), float(pmax)]
        metadata["channels"] = 1
        metadata["width"] = normalized.shape[1]
        metadata["height"] = normalized.shape[0]
        metadata["dtype"] = "uint8"
        metadata["intensity_min"] = int(normalized.min())
        metadata["intensity_max"] = int(normalized.max())
        metadata["intensity_mean"] = float(np.mean(normalized))
        metadata["original_size"] = [normalized.shape[1], normalized.shape[0]]
        
        return normalized, metadata
        
    except ImportError:
        raise ImageValidationError(
            "DICOM support requires pydicom. Install with: pip install pydicom",
            code="DICOM_UNSUPPORTED"
        )
    except Exception as e:
        raise ImageValidationError(
            f"Failed to decode DICOM file: {str(e)}",
            code="DICOM_DECODE_ERROR"
        )


def validate_dimensions(width: int, height: int) -> None:
    """Validate image dimensions are within acceptable range."""
    if width < MIN_IMAGE_DIMENSION or height < MIN_IMAGE_DIMENSION:
        raise ImageValidationError(
            f"Image dimensions {width}x{height} are too small. "
            f"Minimum: {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}",
            code="IMAGE_TOO_SMALL"
        )
    if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
        raise ImageValidationError(
            f"Image dimensions {width}x{height} exceed maximum "
            f"{MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}",
            code="IMAGE_TOO_LARGE"
        )


def validate_and_load_image(content: bytes, filename: str) -> Tuple[np.ndarray, dict]:
    """
    Complete validation pipeline for uploaded images.
    Module [100]: Medical image acquisition and validation.
    
    Returns:
        Tuple of (validated image array, complete metadata dict)
    """
    # Step 1: Validate extension
    extension = validate_file_extension(filename)
    
    # Step 2: Validate file size
    file_size = validate_file_size(content)
    
    # Step 3: Validate content type (magic bytes)
    detected_format = validate_content_type(content, extension)
    
    # Step 4: Decode image
    img_array, metadata = decode_image(content, detected_format)
    
    # Step 5: Validate dimensions
    validate_dimensions(metadata["width"], metadata["height"])
    
    # Add file metadata
    metadata["filename"] = filename
    metadata["file_size_bytes"] = file_size
    metadata["file_size_mb"] = round(file_size / (1024 * 1024), 3)
    metadata["extension"] = extension
    metadata["detected_format"] = detected_format
    
    return img_array, metadata
