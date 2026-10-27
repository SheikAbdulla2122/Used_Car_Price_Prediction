"""
Model Training & Evaluation Pipeline for Used Car Price Prediction
Evaluates Linear Regression, Decision Tree, and Random Forest Regressors.
Selects the best performing model based on test MAE, serializes the trained pipeline
to `model.joblib`, and outputs evaluation metrics to `model_metrics.json`.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor
import joblib

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "cardekho_dataset.csv"
MODEL_PATH = BASE_DIR / "model.joblib"
METRICS_PATH = BASE_DIR / "model_metrics.json"

NUMERIC_FEATURES = [
    "vehicle_age",
    "km_driven",
    "mileage",
    "engine",
    "max_power",
    "seats",
]

CATEGORICAL_FEATURES = [
    "brand",
    "model",
    "seller_type",
    "fuel_type",
    "transmission_type",
]

TARGET = "selling_price"


def load_and_preprocess_data(data_path: Path) -> pd.DataFrame:
    """Load dataset and perform initial schema cleaning."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {data_path}")

    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Drop index column if present
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    # Basic data sanity checks
    initial_len = len(df)
    df = df.dropna(subset=[TARGET] + NUMERIC_FEATURES + CATEGORICAL_FEATURES)
    print(f"Dataset loaded: {initial_len} records ({len(df)} after cleaning).")
    return df


def build_preprocessor() -> ColumnTransformer:
    """Construct sklearn ColumnTransformer for numeric and categorical features."""
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, NUMERIC_FEATURES),
            ("categorical", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor


def evaluate_models(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    preprocessor: ColumnTransformer,
):
    """Train candidate models, evaluate metrics, and select the best model."""
    candidates = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(random_state=42),
        "Random Forest": RandomForestRegressor(
            n_estimators=100, min_samples_leaf=2, n_jobs=-1, random_state=42
        ),
    }

    results = []
    trained_pipelines = {}

    print("\n" + "=" * 65)
    print("MODEL EVALUATION BENCHMARK")
    print("=" * 65)

    for name, regressor in candidates.items():
        print(f"Training {name}...")
        pipeline = Pipeline(
            steps=[
                ("preprocessing", preprocessor),
                ("model", regressor),
            ]
        )
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        # Compute RMSE compatible with both old and new scikit-learn
        try:
            rmse = float(mean_squared_error(y_test, y_pred, squared=False))
        except TypeError:
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        results.append(
            {
                "model": name,
                "mae": mae,
                "rmse": rmse,
                "r2": r2,
            }
        )
        trained_pipelines[name] = pipeline

        print(f"  -> {name} | MAE: INR {mae:,.2f} | RMSE: INR {rmse:,.2f} | R2: {r2:.4f}")

    # Best model selection by lowest MAE
    best_result = min(results, key=lambda x: x["mae"])
    best_name = best_result["model"]
    best_pipeline = trained_pipelines[best_name]

    print("\n" + "=" * 65)
    print(f"Selected Best Model: {best_name} (Lowest Test MAE: INR {best_result['mae']:,.2f})")
    print("=" * 65)

    return best_name, best_pipeline, results


def run_training_pipeline():
    """Execute end-to-end training and serialization pipeline."""
    df = load_and_preprocess_data(DATA_PATH)

    features = CATEGORICAL_FEATURES + NUMERIC_FEATURES
    X = df[features]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    preprocessor = build_preprocessor()
    best_name, best_pipeline, results = evaluate_models(
        X_train, X_test, y_train, y_test, preprocessor
    )

    # Save model pipeline
    print(f"\nSaving model to: {MODEL_PATH}")
    joblib.dump(best_pipeline, MODEL_PATH, compress=3)

    # Save metrics JSON
    metrics_payload = {
        "selected_model": best_name,
        "target": TARGET,
        "currency": "INR",
        "dataset_file": "data/raw/cardekho_dataset.csv",
        "rows_used": int(len(df)),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "test_size": 0.2,
        "selection_metric": "lowest MAE",
        "features": features,
        "results": results,
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=4)
    print(f"Metrics saved to: {METRICS_PATH}")
    print("Training pipeline finished successfully!")


if __name__ == "__main__":
    run_training_pipeline()
