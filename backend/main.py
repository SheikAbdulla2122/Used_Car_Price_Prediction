
from pathlib import Path
import json

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.joblib"
METRICS_PATH = BASE_DIR / "model_metrics.json"

app = FastAPI(title="Used Car Price Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    seller_type: str = Field(min_length=1)
    fuel_type: str = Field(min_length=1)
    transmission_type: str = Field(min_length=1)
    vehicle_age: float = Field(ge=0, le=100)
    km_driven: float = Field(ge=0)
    mileage: float = Field(gt=0)
    engine: float = Field(gt=0)
    max_power: float = Field(gt=0)
    seats: int = Field(ge=1, le=20)


def load_model():
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Trained model not found.")
    try:
        return joblib.load(MODEL_PATH)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model loading failed: {exc}")


@app.get("/")
def root():
    return {"message": "Used Car Price Prediction API is ready"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model-info")
def model_info():
    info = {"model_exists": MODEL_PATH.exists()}
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as file:
                info["metrics"] = json.load(file)
        except Exception as exc:
            info["metrics_error"] = str(exc)
    else:
        info["metrics"] = None
    return info


@app.post("/predict")
def predict(request: PredictRequest):
    model = load_model()
    try:
        vehicle = pd.DataFrame([request.model_dump()])
        predicted_price = float(model.predict(vehicle)[0])
        return {
            "predicted_price": round(predicted_price, 2),
            "currency": "INR",
            "message": "Prediction generated successfully",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {exc}")


@app.get("/predict")
def get_predict_placeholder():
    raise HTTPException(status_code=405, detail="Use POST /predict.")
