"""
FastAPI Backend for Used Car Price Prediction
Provides endpoints for health checks, model info/metrics, metadata options, and price prediction.
"""

from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.joblib"
METRICS_PATH = BASE_DIR / "model_metrics.json"

# In-memory cached model & metrics
_cached_model = None
_cached_metrics = None


def get_cached_metrics() -> Optional[Dict[str, Any]]:
    global _cached_metrics
    if _cached_metrics is None and METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                _cached_metrics = json.load(f)
        except Exception:
            _cached_metrics = None
    return _cached_metrics


def get_model():
    """Retrieve in-memory cached model or load it if not yet loaded."""
    global _cached_model
    if _cached_model is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="Trained model not found. Please run: python -m backend.train",
            )
        try:
            _cached_model = joblib.load(MODEL_PATH)
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"Failed to load machine learning model: {exc}"
            )
    return _cached_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm model in memory at server startup
    if MODEL_PATH.exists():
        try:
            get_model()
            print("Model successfully preloaded into memory.")
        except Exception as e:
            print(f"Warning: could not preload model: {e}")
    yield


app = FastAPI(
    title="Used Car Price Prediction API",
    description="Production-ready REST API for estimating used vehicle resale prices.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    brand: str = Field(..., min_length=1, example="Maruti")
    model: str = Field(..., min_length=1, example="Swift")
    seller_type: str = Field(..., min_length=1, example="Individual")
    fuel_type: str = Field(..., min_length=1, example="Petrol")
    transmission_type: str = Field(..., min_length=1, example="Manual")
    vehicle_age: float = Field(..., ge=0, le=100, example=5.0)
    km_driven: float = Field(..., ge=0, example=40000.0)
    mileage: float = Field(..., gt=0, example=22.0)
    engine: float = Field(..., gt=0, example=1197.0)
    max_power: float = Field(..., gt=0, example=82.0)
    seats: int = Field(..., ge=1, le=20, example=5)


class PriceRange(BaseModel):
    low: float
    high: float
    formatted_low: str
    formatted_high: str


class PredictResponse(BaseModel):
    predicted_price: float
    currency: str
    formatted_price: str
    price_range: PriceRange
    market_tier: str
    model_algorithm: str
    message: str


def format_inr(amount: float) -> str:
    """Format numeric values into readable Indian Rupee strings (Lakhs / Crores)."""
    if amount >= 10_000_000:
        return f"Rs. {amount / 10_000_000:.2f} Cr"
    elif amount >= 100_000:
        return f"Rs. {amount / 100_000:.2f} Lakh"
    return f"Rs. {amount:,.0f}"


def get_market_tier(price: float) -> str:
    if price < 400_000:
        return "Budget Entry"
    elif price < 1_000_000:
        return "Mid-Range Popular"
    elif price < 2_500_000:
        return "Premium Executive"
    else:
        return "Luxury Class"


@app.get("/")
def root():
    return {
        "service": "Used Car Price Prediction API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health")
def health():
    model_loaded = _cached_model is not None or MODEL_PATH.exists()
    return {
        "status": "healthy",
        "model_available": model_loaded,
        "metrics_available": METRICS_PATH.exists(),
    }


@app.get("/model-info")
def model_info():
    metrics = get_cached_metrics()
    return {
        "model_exists": MODEL_PATH.exists(),
        "algorithm": metrics.get("selected_model", "Random Forest") if metrics else "Random Forest",
        "metrics": metrics,
    }


@app.get("/metadata")
def metadata():
    """Return dropdown options and available brands/models."""
    metrics = get_cached_metrics()
    brand_models = {
        "Audi": ["A4", "A6", "A8", "Q7"],
        "BMW": ["3", "5", "6", "7", "X1", "X3", "X4", "X5", "Z4"],
        "Bentley": ["Continental"],
        "Datsun": ["GO", "RediGO", "redi-GO"],
        "Ferrari": ["GTC4Lusso"],
        "Force": ["Gurkha"],
        "Ford": ["Aspire", "Ecosport", "Endeavour", "Figo", "Freestyle"],
        "Honda": ["Amaze", "CR", "CR-V", "City", "Civic", "Jazz", "WR-V"],
        "Hyundai": ["Aura", "Creta", "Elantra", "Grand", "Santro", "Tucson", "Venue", "Verna", "i10", "i20"],
        "ISUZU": ["MUX"],
        "Isuzu": ["D-Max", "MUX"],
        "Jaguar": ["F-PACE", "XE", "XF"],
        "Jeep": ["Compass", "Wrangler"],
        "Kia": ["Carnival", "Seltos"],
        "Land Rover": ["Rover"],
        "Lexus": ["ES", "NX", "RX"],
        "MG": ["Hector"],
        "Mahindra": ["Alturas", "Bolero", "KUV", "KUV100", "Marazzo", "Scorpio", "Thar", "XUV300", "XUV500"],
        "Maruti": ["Alto", "Baleno", "Celerio", "Ciaz", "Dzire LXI", "Dzire VXI", "Dzire ZXI", "Eeco", "Ertiga", "Ignis", "S-Presso", "Swift", "Swift Dzire", "Vitara", "Wagon R", "XL6"],
        "Maserati": ["Ghibli", "Quattroporte"],
        "Mercedes-AMG": ["C"],
        "Mercedes-Benz": ["C-Class", "CLS", "E-Class", "GL-Class", "GLS", "S-Class"],
        "Mini": ["Cooper"],
        "Nissan": ["Kicks", "X-Trail"],
        "Porsche": ["Cayenne", "Macan", "Panamera"],
        "Renault": ["Duster", "KWID", "Triber"],
        "Rolls-Royce": ["Ghost"],
        "Skoda": ["Octavia", "Rapid", "Superb"],
        "Tata": ["Altroz", "Harrier", "Hexa", "Nexon", "Safari", "Tiago", "Tigor"],
        "Toyota": ["Camry", "Fortuner", "Glanza", "Innova", "Yaris"],
        "Volkswagen": ["Polo", "Vento"],
        "Volvo": ["S90", "XC", "XC60", "XC90"],
    }
    return {
        "brands": sorted(list(brand_models.keys())),
        "brand_models": brand_models,
        "seller_types": ["Individual", "Dealer", "Trustmark Dealer"],
        "fuel_types": ["Petrol", "Diesel", "CNG", "LPG", "Electric"],
        "transmission_types": ["Manual", "Automatic"],
        "seat_options": [2, 4, 5, 6, 7, 8, 9],
        "metrics_summary": metrics,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    model = get_model()

    try:
        vehicle_df = pd.DataFrame([request.model_dump()])
        raw_price = float(model.predict(vehicle_df)[0])

        # Enforce reasonable lower bound
        predicted_price = max(raw_price, 25_000.0)

        # Calculate estimated confidence / fair market band (+/- 7%)
        low_bound = round(predicted_price * 0.93, 2)
        high_bound = round(predicted_price * 1.07, 2)

        return PredictResponse(
            predicted_price=round(predicted_price, 2),
            currency="INR",
            formatted_price=format_inr(predicted_price),
            price_range=PriceRange(
                low=low_bound,
                high=high_bound,
                formatted_low=format_inr(low_bound),
                formatted_high=format_inr(high_bound),
            ),
            market_tier=get_market_tier(predicted_price),
            model_algorithm="Random Forest Regressor",
            message="Prediction generated successfully using trained Machine Learning model.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Price prediction computation failed: {exc}",
        )
