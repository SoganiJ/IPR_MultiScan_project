"""
Comprehensive test suite for the EMCL-CU backend.

Tests cover:
- Health endpoint
- Sample case listing
- Valid/invalid image upload
- Wavelet decomposition
- Candidate detection
- Difference map
- Uncertainty bounds
- AFS calculation
- Safety thresholds
- Complete analysis pipeline
- Export report
"""
import io
import math
import json
import numpy as np
import cv2
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.core.validation import (
    validate_file_extension, validate_file_size, validate_and_load_image,
    ImageValidationError
)
from app.services.preprocessing import (
    preprocess_image, compute_wavelet_decomposition, to_grayscale
)
from app.services.feature_analysis import (
    compute_multiscale_features, detect_candidates
)
from app.services.counterfactual import (
    compute_difference_map, generate_reference_image, run_counterfactual_analysis
)
from app.services.uncertainty import (
    compute_uncertainty, compute_insertion_deletion_audit, compute_afs
)
from app.services.safety import evaluate_safety_routing, SafetyStatus


client = TestClient(app)


def _make_test_image(width=256, height=256, channels=1) -> np.ndarray:
    """Create a test image with some structure."""
    rng = np.random.RandomState(42)
    if channels == 1:
        img = np.full((height, width), 120, dtype=np.uint8)
        # Add a feature
        cv2.circle(img, (width//2, height//2), 30, 180, -1)
        img = img + (rng.randn(height, width) * 5).astype(np.int16)
        return np.clip(img, 0, 255).astype(np.uint8)
    else:
        img = np.full((height, width, channels), 120, dtype=np.uint8)
        cv2.circle(img, (width//2, height//2), 30, (180, 180, 180), -1)
        return img


def _image_to_bytes(img: np.ndarray, fmt="PNG") -> bytes:
    """Convert numpy image to bytes."""
    pil = Image.fromarray(img)
    buf = io.BytesIO()
    pil.save(buf, format=fmt)
    return buf.getvalue()


# ==================== Health Endpoint ====================

class TestHealthEndpoint:
    def test_health_returns_ok(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "modules" in data
        assert len(data["modules"]) == 7

    def test_health_version(self):
        response = client.get("/api/health")
        assert response.json()["version"] == "1.0.0"


# ==================== Sample Cases ====================

class TestSampleCases:
    def test_list_cases(self):
        response = client.get("/api/demo/cases")
        assert response.status_code == 200
        data = response.json()
        assert "cases" in data
        assert data["count"] >= 5

    def test_each_case_has_metadata(self):
        response = client.get("/api/demo/cases")
        for case in response.json()["cases"]:
            assert "id" in case
            assert "name" in case
            assert "description" in case
            assert case["is_synthetic"] is True

    def test_serve_sample_image(self):
        response = client.get("/api/demo/cases/sample_001/image")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"

    def test_missing_sample(self):
        response = client.get("/api/demo/cases/nonexistent/image")
        assert response.status_code == 404


# ==================== Image Validation ====================

class TestImageValidation:
    def test_valid_png(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        arr, meta = validate_and_load_image(content, "test.png")
        assert arr.shape == (256, 256)
        assert meta["width"] == 256
        assert meta["height"] == 256

    def test_valid_jpeg(self):
        img = _make_test_image()
        content = _image_to_bytes(img, "JPEG")
        arr, meta = validate_and_load_image(content, "test.jpg")
        assert arr.shape[0] > 0

    def test_rgb_image(self):
        img = _make_test_image(channels=3)
        content = _image_to_bytes(img)
        arr, meta = validate_and_load_image(content, "test.png")
        assert meta["channels"] == 3

    def test_invalid_extension(self):
        with pytest.raises(ImageValidationError) as exc:
            validate_file_extension("test.xyz")
        assert exc.value.code == "INVALID_EXTENSION"

    def test_empty_file(self):
        with pytest.raises(ImageValidationError) as exc:
            validate_file_size(b"")
        assert exc.value.code == "EMPTY_FILE"

    def test_oversized_file(self):
        big = b"x" * (51 * 1024 * 1024)
        with pytest.raises(ImageValidationError) as exc:
            validate_file_size(big)
        assert exc.value.code == "FILE_TOO_LARGE"

    def test_corrupted_file(self):
        with pytest.raises(ImageValidationError):
            validate_and_load_image(b"not an image at all", "test.png")

    def test_valid_upload_endpoint(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        response = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "complete"
        assert "analysis_id" in data

    def test_invalid_upload(self):
        response = client.post(
            "/api/analyze",
            files={"file": ("test.txt", b"not an image", "text/plain")}
        )
        # Should return error (422 or 200 with error status)
        assert response.status_code in (200, 422)


# ==================== Wavelet Decomposition ====================

class TestWaveletDecomposition:
    def test_basic_decomposition(self):
        img = _make_test_image()
        result = compute_wavelet_decomposition(img, wavelet="db2", level=2)
        assert "subbands" in result
        assert "LL" in result["subbands"]
        assert "LH1" in result["subbands"]
        assert "HL1" in result["subbands"]
        assert "HH1" in result["subbands"]
        assert "LH2" in result["subbands"]
        assert "HL2" in result["subbands"]
        assert "HH2" in result["subbands"]

    def test_subband_shapes(self):
        img = _make_test_image()
        result = compute_wavelet_decomposition(img, wavelet="db2", level=2)
        # LL should be smaller than original
        ll_shape = result["subbands"]["LL"]["array"].shape
        assert ll_shape[0] < img.shape[0]
        assert ll_shape[1] < img.shape[1]

    def test_subband_stats(self):
        img = _make_test_image()
        result = compute_wavelet_decomposition(img, wavelet="db2", level=2)
        stats = result["metadata"]["subband_stats"]
        for name in ["LL", "LH1", "HL1", "HH1"]:
            assert name in stats
            assert "energy" in stats[name]
            assert stats[name]["energy"] >= 0

    def test_different_wavelets(self):
        img = _make_test_image()
        for wavelet in ["haar", "db2", "sym4"]:
            result = compute_wavelet_decomposition(img, wavelet=wavelet, level=1)
            assert "LL" in result["subbands"]

    def test_level_1(self):
        img = _make_test_image()
        result = compute_wavelet_decomposition(img, wavelet="db2", level=1)
        assert "LH1" in result["subbands"]
        assert "LH2" not in result["subbands"]


# ==================== Candidate Detection ====================

class TestCandidateDetection:
    def test_detects_feature(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        processed = prep["processed"]
        wavelet = compute_wavelet_decomposition(processed)
        features = compute_multiscale_features(processed, wavelet)
        candidates = detect_candidates(processed, features["integrated_feature_map"])
        # Should find at least one candidate (the circle)
        assert len(candidates) >= 1

    def test_candidate_bounds(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        processed = prep["processed"]
        wavelet = compute_wavelet_decomposition(processed)
        features = compute_multiscale_features(processed, wavelet)
        candidates = detect_candidates(processed, features["integrated_feature_map"])
        h, w = processed.shape[:2]
        for c in candidates:
            bbox = c["bbox"]
            assert bbox["x"] >= 0
            assert bbox["y"] >= 0
            assert bbox["x"] + bbox["width"] <= w
            assert bbox["y"] + bbox["height"] <= h
            assert c["area"] > 0
            assert 0 <= c["saliency_score"] <= 1

    def test_candidate_features_present(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        processed = prep["processed"]
        wavelet = compute_wavelet_decomposition(processed)
        features = compute_multiscale_features(processed, wavelet)
        candidates = detect_candidates(processed, features["integrated_feature_map"])
        if candidates:
            c = candidates[0]
            assert "mean_intensity" in c["features"]
            assert "local_contrast" in c["features"]
            assert "edge_density" in c["features"]
            assert "compactness" in c["features"]


# ==================== Difference Map ====================

class TestDifferenceMap:
    def test_dimensions_match(self):
        img = _make_test_image()
        ref = generate_reference_image(img)
        diff = compute_difference_map(img, ref)
        assert diff.shape == img.shape

    def test_non_negative(self):
        img = _make_test_image()
        ref = generate_reference_image(img)
        diff = compute_difference_map(img, ref)
        assert np.all(diff >= 0)

    def test_identical_images(self):
        img = _make_test_image()
        diff = compute_difference_map(img, img)
        assert np.allclose(diff, 0)

    def test_counterfactual_pipeline(self):
        img = _make_test_image()
        result = run_counterfactual_analysis(img)
        assert "reference_image" in result
        assert "difference_map" in result
        assert "statistics" in result
        assert result["statistics"]["mean_difference"] >= 0


# ==================== Uncertainty ====================

class TestUncertainty:
    def test_score_bounds(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        uncertainty = compute_uncertainty(
            prep["processed"], [], prep["statistics"], prep["settings"]
        )
        score = uncertainty["uncertainty_score"]
        assert 0 <= score <= 1

    def test_factors_present(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        uncertainty = compute_uncertainty(
            prep["processed"], [], prep["statistics"], prep["settings"]
        )
        factors = uncertainty["factors"]
        assert "image_quality" in factors
        assert "candidate_strength" in factors
        assert "detection_consistency" in factors


# ==================== AFS Calculation ====================

class TestAFSCalculation:
    def test_basic_afs(self):
        # AFS = (insertion - deletion + 1) / 2
        afs = compute_afs(0.8, 0.2)
        expected = (0.8 - 0.2 + 1) / 2
        assert abs(afs - expected) < 1e-10

    def test_perfect_afs(self):
        afs = compute_afs(1.0, 0.0)
        assert afs == 1.0

    def test_worst_afs(self):
        afs = compute_afs(0.0, 1.0)
        assert afs == 0.0

    def test_nan_handling(self):
        afs = compute_afs(float('nan'), 0.5)
        assert math.isnan(afs)

    def test_inf_handling(self):
        afs = compute_afs(float('inf'), 0.5)
        assert math.isnan(afs)

    def test_afs_range(self):
        # For valid inputs, AFS should be in [0, 1]
        for ins in np.linspace(0, 1, 20):
            for dele in np.linspace(0, 1, 20):
                afs = compute_afs(ins, dele)
                assert 0 <= afs <= 1


# ==================== Safety Thresholds ====================

class TestSafetyThresholds:
    def test_exact_boundary_pass(self):
        """AFS=0.85 and uncertainty=0.15 should satisfy the rule."""
        result = evaluate_safety_routing(afs=0.85, uncertainty=0.15)
        assert result["status"] == SafetyStatus.REVIEW_READY

    def test_afs_below_threshold(self):
        result = evaluate_safety_routing(afs=0.84, uncertainty=0.10)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_uncertainty_above_threshold(self):
        result = evaluate_safety_routing(afs=0.90, uncertainty=0.16)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_both_fail(self):
        result = evaluate_safety_routing(afs=0.50, uncertainty=0.50)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_missing_afs(self):
        result = evaluate_safety_routing(afs=None, uncertainty=0.10)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_missing_uncertainty(self):
        result = evaluate_safety_routing(afs=0.90, uncertainty=None)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_nan_afs(self):
        result = evaluate_safety_routing(afs=float('nan'), uncertainty=0.10)
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_inf_uncertainty(self):
        result = evaluate_safety_routing(afs=0.90, uncertainty=float('inf'))
        assert result["status"] == SafetyStatus.REVIEW_REQUIRED

    def test_reasons_present(self):
        result = evaluate_safety_routing(afs=0.50, uncertainty=0.50)
        assert len(result["reasons"]) > 0

    def test_values_present(self):
        result = evaluate_safety_routing(afs=0.85, uncertainty=0.15)
        assert result["values"]["afs"] == 0.85
        assert result["values"]["uncertainty"] == 0.15

    def test_perfect_scores(self):
        result = evaluate_safety_routing(afs=1.0, uncertainty=0.0)
        assert result["status"] == SafetyStatus.REVIEW_READY


# ==================== Insertion/Deletion Audit ====================

class TestInsertionDeletion:
    def test_audit_runs(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        processed = prep["processed"]
        wavelet = compute_wavelet_decomposition(processed)
        features = compute_multiscale_features(processed, wavelet)
        candidates = detect_candidates(processed, features["integrated_feature_map"])
        
        if candidates:
            result = compute_insertion_deletion_audit(
                processed, candidates[0], num_steps=10
            )
            assert "insertion_scores" in result
            assert "deletion_scores" in result
            assert 0 <= result["auc_insertion"] <= 1
            assert 0 <= result["auc_deletion"] <= 1
            assert 0 <= result["afs"] <= 1
            assert len(result["insertion_scores"]) == 11  # steps + 1

    def test_audit_deterministic(self):
        img = _make_test_image()
        prep = preprocess_image(img, processing_size=256)
        processed = prep["processed"]
        wavelet = compute_wavelet_decomposition(processed)
        features = compute_multiscale_features(processed, wavelet)
        candidates = detect_candidates(processed, features["integrated_feature_map"])
        
        if candidates:
            r1 = compute_insertion_deletion_audit(processed, candidates[0], num_steps=10, seed=42)
            r2 = compute_insertion_deletion_audit(processed, candidates[0], num_steps=10, seed=42)
            assert r1["afs"] == r2["afs"]


# ==================== Complete Analysis ====================

class TestCompleteAnalysis:
    def test_full_pipeline_via_api(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        response = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "complete"
        assert data["analysis_id"]
        assert data["image_metadata"]["width"] == 256
        assert "candidates" in data
        assert "uncertainty" in data
        assert "safety_result" in data
        assert "processing_duration_ms" in data

    def test_retrieve_analysis(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        response = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        aid = response.json()["analysis_id"]
        
        response2 = client.get(f"/api/analyze/{aid}")
        assert response2.status_code == 200
        assert response2.json()["analysis_id"] == aid

    def test_list_analyses(self):
        response = client.get("/api/analyze/list")
        assert response.status_code == 200
        assert "analyses" in response.json()

    def test_get_analysis_image(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        response = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        aid = response.json()["analysis_id"]
        
        for img_type in ["original", "processed", "candidates"]:
            resp = client.get(f"/api/analyze/{aid}/image/{img_type}")
            assert resp.status_code == 200, f"Failed for {img_type}"

    def test_audit_via_api(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        resp = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        aid = resp.json()["analysis_id"]
        
        audit_resp = client.post(
            f"/api/analyze/{aid}/audit",
            json={"candidate_id": 0, "num_steps": 10}
        )
        # May fail if no candidates
        if resp.json().get("candidates"):
            assert audit_resp.status_code == 200
            data = audit_resp.json()
            assert "audit_result" in data
            assert "safety_result" in data


# ==================== Export ====================

class TestExport:
    def test_export_report(self):
        img = _make_test_image()
        content = _image_to_bytes(img)
        resp = client.post(
            "/api/analyze",
            files={"file": ("test.png", content, "image/png")}
        )
        aid = resp.json()["analysis_id"]
        
        export_resp = client.get(f"/api/analyze/{aid}/export")
        assert export_resp.status_code == 200
        data = export_resp.json()
        assert "analysis_id" in data
        assert "image_metadata" in data
        assert "implementation_limitations" in data
        assert len(data["implementation_limitations"]) > 0

    def test_export_missing_analysis(self):
        resp = client.get("/api/analyze/nonexistent/export")
        assert resp.status_code == 404


# ==================== Benchmark ====================

class TestBenchmark:
    def test_benchmark_endpoint(self):
        resp = client.get("/api/benchmark")
        assert resp.status_code == 200
        data = resp.json()
        assert "disclaimer" in data
        assert "detection_performance" in data
        assert "faithfulness_metrics" in data

    def test_benchmark_has_disclaimer(self):
        resp = client.get("/api/benchmark")
        data = resp.json()
        assert "Not independently reproduced" in data["disclaimer"]


# ==================== Architecture ====================

class TestArchitecture:
    def test_architecture_endpoint(self):
        resp = client.get("/api/architecture")
        assert resp.status_code == 200
        data = resp.json()
        assert "modules" in data
        assert "data_flow" in data
        assert len(data["modules"]) == 7
