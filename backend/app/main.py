"""
FastAPI application entry point.

Explainable Multi-Scale Counterfactual Deep Learning
for Sub-Millimeter Lesion Localization and Calibrated Uncertainty
in Early Diagnostic Imaging

Research Prototype — NOT a clinically validated diagnostic system.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.analysis import router as analysis_router
from app.core.config import UPLOAD_DIR, SAMPLE_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Generate sample images on startup."""
    from app.services.sample_generator import generate_all_samples
    generate_all_samples()
    print("[OK] Sample images generated")
    print("[OK] EMCL-CU Research Prototype ready")
    print("  API docs: http://localhost:8000/docs")
    yield


app = FastAPI(
    title="EMCL-CU Research Prototype",
    description=(
        "Explainable Multi-Scale Counterfactual Deep Learning for "
        "Sub-Millimeter Lesion Localization and Calibrated Uncertainty. "
        "This is a research prototype, NOT a clinically validated diagnostic system."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(analysis_router)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
