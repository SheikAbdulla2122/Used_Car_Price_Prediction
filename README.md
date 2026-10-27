# 🚗 AutoValue AI — Used Car Price Prediction

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?style=flat-square&logo=scikitlearn)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An end-to-end Machine Learning web application that predicts used car resale valuations with high accuracy. Trained on **15,411 real-world vehicle transaction records**, the system compares multiple regression paradigms, uses a **Random Forest Regressor** pipeline with column transformers and imputer strategies, and delivers sub-10ms predictions through a **FastAPI** backend and modern **React + Vite** frontend.

---

## 🌟 Key Features

- **High-Accuracy ML Pipeline**: Benchmarked across Linear Regression, Decision Tree, and Random Forest models; Random Forest achieved an **$R^2$ score of 93.5%** and test MAE of ₹99,803.
- **In-Memory Model Caching**: Zero-latency predictions (&lt; 10ms) with startup model pre-warming instead of cold-loading from disk.
- **Live Connection Telemetry**: Real-time health status indicator dynamically pinging backend availability.
- **Fair Market Price Bands**: Computes a ±7% valuation spread (95% confidence interval) rather than just a single point estimate.
- **Model Benchmark & Metrics Dashboard**: Interactive charts (powered by Recharts) comparing $R^2$ accuracy and Mean Absolute Error across evaluated algorithms.
- **Quick Presets**: 1-click test configurations (Maruti Swift, Hyundai Creta, Honda City, BMW 3 Series, Toyota Innova).
- **Responsive & Accessible UI**: Modern glassmorphic aesthetic built with Vanilla CSS and modern typography (Manrope & DM Sans).

---

## 📊 Model Evaluation Benchmarks

All models were evaluated on an independent 20% holdout test set (3,083 samples) using 11 feature inputs:

| Model Algorithm | $R^2$ Score (Variance Explained) | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | 68.65% | ₹ 2,64,971 | ₹ 4,85,832 | Baseline |
| **Decision Tree Regressor** | 89.09% | ₹ 1,22,307 | ₹ 2,86,623 | Evaluated |
| **Random Forest Regressor** | **93.46%** | **₹ 99,803** | **₹ 2,21,894** | **Selected Best** |

### Input Features:
1. `brand` *(Categorical, 32 brands)*
2. `model` *(Categorical, vehicle model line)*
3. `seller_type` *(Individual, Dealer, Trustmark Dealer)*
4. `fuel_type` *(Petrol, Diesel, CNG, LPG, Electric)*
5. `transmission_type` *(Manual, Automatic)*
6. `vehicle_age` *(Years)*
7. `km_driven` *(Odometer in km)*
8. `mileage` *(Fuel efficiency in km/l)*
9. `engine` *(Engine displacement in cc)*
10. `max_power` *(Power output in bhp)*
11. `seats` *(Passenger capacity)*

---

## 📁 Project Architecture

```
Used_Car_Price_Prediction/
├── backend/
│   ├── main.py               # FastAPI REST API with caching & endpoints
│   ├── train.py              # ML pipeline, model training & benchmark evaluation
│   ├── model.joblib          # Compressed serialized Random Forest pipeline
│   ├── model_metrics.json    # Benchmark evaluation scores and metadata
│   └── requirements.txt      # Python dependencies
├── data/
│   └── raw/
│       └── cardekho_dataset.csv  # 15,411 used car records
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # React application (Tabs, Form, Charts, Result Card)
│   │   ├── index.css         # Custom responsive design system
│   │   └── main.tsx          # React DOM entry point
│   ├── index.html            # HTML shell with SEO meta tags
│   ├── package.json          # Node dependencies (React, Recharts, Vite)
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite build tool config
├── .gitignore                # Production git exclusion rules
└── README.md                 # Complete project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: Version 3.10+
- **Node.js**: Version 18+ and `npm`

---

### 2. Backend Setup

1. Open a terminal and navigate to the project root:
   ```bash
   cd Used_Car_Price_Prediction
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. (Optional) Re-train and benchmark the model from scratch:
   ```bash
   python -m backend.train
   ```

5. Start the FastAPI development server:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   *The backend will be live at `http://127.0.0.1:8000`. Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.*

---

### 3. Frontend Setup

1. In a second terminal window, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install JavaScript dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   # Or on Windows if execution policy applies:
   npm.cmd run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API service identity and health summary |
| `GET` | `/health` | Live health probe & in-memory model availability |
| `GET` | `/model-info` | Evaluation metrics, $R^2$ scores, and feature metadata |
| `GET` | `/metadata` | Dropdown choices (brands, models, fuel types, etc.) |
| `POST` | `/predict` | Computes price estimate, valuation range, and market tier |

### Sample POST `/predict` Request:
```json
{
  "brand": "Maruti",
  "model": "Swift",
  "seller_type": "Individual",
  "fuel_type": "Petrol",
  "transmission_type": "Manual",
  "vehicle_age": 4,
  "km_driven": 32000,
  "mileage": 21.2,
  "engine": 1197,
  "max_power": 88.5,
  "seats": 5
}
```

### Sample Response:
```json
{
  "predicted_price": 442521.41,
  "currency": "INR",
  "formatted_price": "Rs. 4.43 Lakh",
  "price_range": {
    "low": 411544.91,
    "high": 473497.91,
    "formatted_low": "Rs. 4.12 Lakh",
    "formatted_high": "Rs. 4.73 Lakh"
  },
  "market_tier": "Mid-Range Popular",
  "model_algorithm": "Random Forest Regressor",
  "message": "Prediction generated successfully using trained Machine Learning model."
}
```

---

## 🛠️ Tech Stack

- **Machine Learning**: `scikit-learn`, `pandas`, `numpy`, `joblib`
- **Backend API**: `FastAPI`, `Uvicorn`, `Pydantic`
- **Frontend UI**: `React 18`, `TypeScript`, `Vite`, `Recharts`
- **Design System**: Vanilla CSS, Flexbox/Grid, Glassmorphism, Google Fonts (`Manrope`, `DM Sans`)

---

## 📄 License
This project is open-source and available under the MIT License.
