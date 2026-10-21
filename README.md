# EMCL-CU: Explainable Multi-Scale Counterfactual Deep Learning for Sub-Millimeter Lesion Localization and Calibrated Uncertainty

> **Research Prototype** — Medical Imaging Computer Vision Prototype  
> **Notice:** Experimental software for research exploration only. **NOT FOR CLINICAL DIAGNOSTIC USE.**

---

## 1. Project Overview

**EMCL-CU** is a full-stack research prototype designed to investigate explainable lesion localization, counterfactual visual reasoning, clinical concept attribution, and calibrated uncertainty estimation for sub-millimeter anatomical structures in medical imaging (such as mammography microcalcifications, early pulmonary nodules, and MRI microvascular lesions).

### Key Highlights
- **Zero Heavyweight Dependencies:** Runs entirely on CPU with standard Python libraries and standard web tooling. No PyTorch, TensorFlow, GPU, or paid external cloud APIs required.
- **Genuine Image Processing:** Implements a genuine 2D Discrete Wavelet Transform (DWT) via PyWavelets, adaptive CLAHE contrast enhancement, OpenCV morphological filtering, and pixel-perturbation faithfulness curve integration.
- **Calibrated Uncertainty & Faithfulness:** Computes an Aggregated Faithfulness Score (AFS) via trapezoidal numerical integration of insertion/deletion curves alongside a 5-factor calibrated uncertainty proxy.
- **Fail-Safe Safety Routing:** Enforces research demo threshold boundaries (`AFS ≥ 0.85` and `Uncertainty ≤ 0.15`) to route scans to `REVIEW_READY` or `REVIEW_REQUIRED`.

---

## 2. System Architecture

```
[Raw Image / DICOM] 
        │
        ▼
[100: Acquisition & Validation] ────> Validated NumPy Array (uint8) + Metadata
        │
        ▼
[101: Preprocessing & Wavelet]  ────> CLAHE/Denoised Image + 7 DWT Subbands (LL, LH, HL, HH)
        │                             │
        ▼                             │ (Image Statistics)
[102: Dual-Branch Features]           │
        │                             ▼
        ▼                      [105: Uncertainty & Faithfulness Audit]
[103: Counterfactual & Candidates] ───┘   │ (AFS + Uncertainty Score)
        │ (Candidates, Ref, Diff)         ▼
        │                      [106: Safety Routing & Escalation]
        ▼                                 │
[104: Concept Attribution]                ▼
        │                      [REVIEW_READY / REVIEW_REQUIRED]
        ▼
[12 Morphological Descriptors]
```

### Module Descriptions [100] – [106]

| Module | Name | Implementation Type | Description & Purpose |
|--------|------|---------------------|-----------------------|
| **[100]** | **Image Acquisition & Validation** | *Genuine Image Processing* | Magic-byte format verification (PNG, JPG, TIFF, BMP, DICOM), size/dimension boundary enforcement (≤50MB, 32–4096px), grayscale standardization, and intensity range calculation. |
| **[101]** | **Preprocessing & Wavelet Decomposition** | *Genuine Image Processing* | Bilateral/Gaussian filtering, CLAHE adaptive contrast adjustment, and multi-level 2D Discrete Wavelet Transform (`db2`, `haar`, `sym4`) decomposing spatial scans into approximation (LL) and directional detail (LH, HL, HH) subbands. |
| **[102]** | **Dual-Branch Multi-Scale Features** | *Genuine Image Processing* | Separates low-frequency anatomical baseline tissue from high-frequency directional edge energy, performing multi-scale cross-frequency integration into a unified saliency map. |
| **[103]** | **Counterfactual & Candidate Detection** | *Computational Proxy* | Segments candidate bounding regions from localized detail peaks and generates an adaptive computational background reference to produce difference maps and alpha overlays. |
| **[104]** | **Clinical Concept Attribution** | *Genuine Image Processing* | Quantifies 12 morphometric descriptors (compactness, eccentricity, border irregularity, contrast ratio, high-frequency wavelet energy) with qualitative clinical interpretations. |
| **[105]** | **Uncertainty & Faithfulness Audit** | *Computational Proxy* | Computes trapezoidal numerical integration of pixel-perturbation insertion and deletion curves to yield the Aggregated Faithfulness Score (AFS = (AUC_ins - AUC_del + 1) / 2) alongside a 5-factor calibrated uncertainty proxy. |
| **[106]** | **Safety Routing & Escalation** | *Heuristic Rule Engine* | Evaluates test conditions against research thresholds (`AFS ≥ 0.85` and `Uncertainty ≤ 0.15`). Automatically escalates missing, corrupted, or sub-threshold evaluations to `REVIEW_REQUIRED`. |

---

## 3. Technology Stack

### Backend
- **Python 3.11 – 3.13**
- **FastAPI** — High-performance asynchronous REST API framework
- **PyWavelets (pywt)** — Genuine 2D Discrete Wavelet Transform
- **OpenCV (opencv-python-headless)** — Computer vision operations, morphological filtering, CLAHE
- **NumPy & SciPy** — Matrix calculations and trapezoidal curve integration
- **scikit-image** — Morphological feature measurements (eccentricity, perimeter, solidity)
- **Pillow & aiofiles** — Format ingestion, stream handling, and file storage
- **Pytest** — Comprehensive unit and integration test suite

### Frontend
- **React 18+ with TypeScript**
- **Vite 5** — High-speed build tooling and proxy dev server
- **Tailwind CSS 3** — Custom dark theme design system (`#0d1117`, `#0f172a`, `#161f30`) with cyan (`#06b6d4`) and teal (`#14b8a6`) accents
- **Recharts** — Responsive interactive charts (LineCharts for perturbation curves, RadarCharts for concept attribution, BarCharts for benchmarks)
- **Lucide React** — Modern iconography

---

## 4. Repository Structure

```
d:\IPR\
├── README.md                     # Comprehensive documentation
├── .env.example                  # Environment variable configuration template
├── backend/                      # Python FastAPI backend
│   ├── requirements.txt          # Python dependencies
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point, CORS, lifespan hooks
│   │   ├── core/
│   │   │   ├── config.py         # Paths, constraints, thresholds
│   │   │   └── validation.py     # Module [100]: Magic bytes, DICOM, dimension validation
│   │   ├── services/
│   │   │   ├── preprocessing.py  # Module [101]: CLAHE, Denoising, 2D DWT
│   │   │   ├── feature_analysis.py # Module [102-103]: Saliency & candidate detection
│   │   │   ├── counterfactual.py # Module [103]: Reference baseline & diff maps
│   │   │   ├── concept_attribution.py # Module [104]: 12 clinical concept descriptors
│   │   │   ├── uncertainty.py    # Module [105]: 5-factor uncertainty & AFS audit
│   │   │   ├── safety.py         # Module [106]: Safety routing rules
│   │   │   ├── pipeline.py       # Orchestrator & in-memory session store
│   │   │   └── sample_generator.py # 5 synthetic test cases generator
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic data models
│   │   └── routes/
│   │       └── analysis.py       # API endpoints
│   └── tests/
│       └── test_analysis.py      # Comprehensive pytest suite (58 tests)
└── frontend/                     # React + TypeScript + Vite frontend
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── index.css             # Tailwind base and custom theme styling
        ├── main.tsx              # Entry point
        ├── App.tsx               # Main layout and tab router
        ├── types/api.ts          # Typed API schemas
        ├── services/api.ts       # Typed fetch API client
        ├── context/AnalysisContext.tsx # Global state provider
        ├── components/
        │   ├── Header.tsx        # Top navigation with live status
        │   ├── Footer.tsx        # Research disclaimer and documentation links
        │   └── SafetyBadge.tsx   # Color-coded safety routing status badge
        └── pages/
            ├── OverviewPage.tsx          # Tab 1: Project overview and stats
            ├── NewAnalysisPage.tsx       # Tab 2: Upload and sample case launcher
            ├── ImageProcessingPage.tsx   # Tab 3: Preprocessing & Wavelet subbands
            ├── ExplainabilityPage.tsx    # Tab 4: Counterfactuals & Radar attribution
            ├── UncertaintyPage.tsx       # Tab 5: Uncertainty gauge & safety decision
            ├── FaithfulnessAuditPage.tsx # Tab 6: Insertion/deletion curves & AFS
            ├── BenchmarkResultsPage.tsx  # Tab 7: Literature comparative tables & charts
            ├── SystemArchitecturePage.tsx# Tab 8: Interactive SVG flowchart
            └── AboutPage.tsx             # Tab 9: Research methodology & limitations
```

---

## 5. Quickstart Guide

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Node.js 18+ and npm

### Installation

1. **Install Backend Dependencies:**
   ```powershell
   cd d:\IPR\backend
   pip install -r requirements.txt
   ```

2. **Install Frontend Dependencies:**
   ```powershell
   cd d:\IPR\frontend
   npm install
   ```

---

## 6. Running the Application

### Terminal 1: Backend Server
```powershell
cd d:\IPR\backend
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc UI: `http://localhost:8000/redoc`

### Terminal 2: Frontend Dashboard
```powershell
cd d:\IPR\frontend
npm run dev
```
- Open browser at `http://localhost:5173`

---

## 7. Running the Test Suite

Run the comprehensive pytest suite covering all modules [100]–[106], edge cases, and safety boundary conditions:

```powershell
cd d:\IPR\backend
python -m pytest tests/ -v
```

Expected output:
```
============================= 58 passed in 7.59s ==============================
```

To validate the frontend build:
```powershell
cd d:\IPR\frontend
npm run build
```

---

## 8. API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health status and module enumeration |
| `GET` | `/api/demo/cases` | List all available synthetic sample benchmark cases |
| `GET` | `/api/demo/cases/{case_id}/image` | Stream synthetic sample scan PNG image |
| `POST` | `/api/analyze` | Multipart image upload + query parameters for settings |
| `GET` | `/api/analyze/list` | List recent analysis sessions |
| `GET` | `/api/analyze/{analysis_id}` | Retrieve JSON analysis result |
| `GET` | `/api/analyze/{analysis_id}/image/{type}` | Stream processed image: `original`, `processed`, `candidates`, `reference`, `difference`, `overlay`, `feature_heatmap`, `wavelet_LL`, `wavelet_LH1`, etc. |
| `POST` | `/api/analyze/{analysis_id}/audit` | Run pixel perturbation audit (`candidate_id`, `num_steps`) |
| `GET` | `/api/analyze/{analysis_id}/export` | Export full analysis report as JSON |
| `GET` | `/api/benchmark` | Literature comparative benchmark figures |
| `GET` | `/api/architecture` | Architectural modules and data-flow specifications |

---

## 9. Implementation Accounting: Authentic vs Heuristic vs Illustrative

To maintain scientific integrity, the following accounting clarifies what is genuinely computed from image data versus what represents a computational proxy or research literature reference:

1. **Genuine Image-Derived Outputs:**
   - Image validation, dimension verification, and bit-depth normalization
   - 2D Discrete Wavelet Decomposition (`LL`, `LH1`, `HL1`, `HH1`, `LH2`, `HL2`, `HH2`)
   - Adaptive CLAHE contrast enhancement and Gaussian/bilateral denoising
   - Cross-scale high-frequency detail energy integration
   - Morphological candidate segmentation and contour feature extraction
   - Insertion and deletion pixel-perturbation trajectories and trapezoidal AUC integration

2. **Computational Proxies:**
   - **Reference Image:** Computed via large-scale adaptive Gaussian background filtering to approximate healthy surrounding tissue. In a production deep clinical system, this would be synthesized by a generative counterfactual model (e.g., Counterfactual Diffusion).
   - **Uncertainty Score:** Derived from a calibrated 5-factor heuristic weighting image SNR, entropy, boundary stability, and candidate margin. In deep learning, this would be computed via Deep Ensembles or Monte Carlo Dropout.

3. **Illustrative Benchmark Literature:**
   - The figures displayed on the **Benchmark Results** tab are reported directly from the published research document for comparison and have not been independently reproduced by this lightweight CPU prototype.

---

## 10. Clinical Safety Disclaimer

> **IMPORTANT WARNING:**  
> The EMCL-CU software prototype is strictly an engineering and algorithmic research prototype. It has **NOT** been evaluated, certified, or cleared by the U.S. Food and Drug Administration (FDA), European Medicines Agency (EMA), or any regulatory medical authority.  
> 
> Outputs produced by this software—including candidate bounding boxes, saliency heatmaps, uncertainty scores, and safety status designations—do **NOT** constitute medical advice, diagnostic evaluations, or clinical clearance. Status `REVIEW_READY` indicates only that the input data met specific experimental threshold parameters within this demonstration software. Under no circumstances should this software be utilized in patient care or clinical decision-making.
