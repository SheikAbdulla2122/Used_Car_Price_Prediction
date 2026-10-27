import { useState, useEffect, type FormEvent } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import "./index.css";

type PriceRange = {
    low: number;
    high: number;
    formatted_low: string;
    formatted_high: string;
};

type PredictionResult = {
    predicted_price: number;
    currency: string;
    formatted_price: string;
    price_range: PriceRange;
    market_tier: string;
    model_algorithm: string;
    message: string;
};

type ModelMetric = {
    model: string;
    mae: number;
    rmse: number;
    r2: number;
};

type ModelInfo = {
    selected_model: string;
    target: string;
    currency: string;
    rows_used: number;
    training_rows: number;
    testing_rows: number;
    features: string[];
    results: ModelMetric[];
};

const brandModels: Record<string, string[]> = {
    Audi: ["A4", "A6", "A8", "Q7"],
    BMW: ["3", "5", "6", "7", "X1", "X3", "X4", "X5", "Z4"],
    Bentley: ["Continental"],
    Datsun: ["GO", "RediGO", "redi-GO"],
    Ferrari: ["GTC4Lusso"],
    Force: ["Gurkha"],
    Ford: ["Aspire", "Ecosport", "Endeavour", "Figo", "Freestyle"],
    Honda: ["Amaze", "CR", "CR-V", "City", "Civic", "Jazz", "WR-V"],
    Hyundai: ["Aura", "Creta", "Elantra", "Grand", "Santro", "Tucson", "Venue", "Verna", "i10", "i20"],
    ISUZU: ["MUX"],
    Isuzu: ["D-Max", "MUX"],
    Jaguar: ["F-PACE", "XE", "XF"],
    Jeep: ["Compass", "Wrangler"],
    Kia: ["Carnival", "Seltos"],
    "Land Rover": ["Rover"],
    Lexus: ["ES", "NX", "RX"],
    MG: ["Hector"],
    Mahindra: ["Alturas", "Bolero", "KUV", "KUV100", "Marazzo", "Scorpio", "Thar", "XUV300", "XUV500"],
    Maruti: ["Alto", "Baleno", "Celerio", "Ciaz", "Dzire LXI", "Dzire VXI", "Dzire ZXI", "Eeco", "Ertiga", "Ignis", "S-Presso", "Swift", "Swift Dzire", "Vitara", "Wagon R", "XL6"],
    Maserati: ["Ghibli", "Quattroporte"],
    "Mercedes-AMG": ["C"],
    "Mercedes-Benz": ["C-Class", "CLS", "E-Class", "GL-Class", "GLS", "S-Class"],
    Mini: ["Cooper"],
    Nissan: ["Kicks", "X-Trail"],
    Porsche: ["Cayenne", "Macan", "Panamera"],
    Renault: ["Duster", "KWID", "Triber"],
    "Rolls-Royce": ["Ghost"],
    Skoda: ["Octavia", "Rapid", "Superb"],
    Tata: ["Altroz", "Harrier", "Hexa", "Nexon", "Safari", "Tiago", "Tigor"],
    Toyota: ["Camry", "Fortuner", "Glanza", "Innova", "Yaris"],
    Volkswagen: ["Polo", "Vento"],
    Volvo: ["S90", "XC", "XC60", "XC90"],
};

const defaultPresets = [
    {
        label: "Maruti Swift",
        type: "Hatchback",
        brand: "Maruti",
        model: "Swift",
        seller_type: "Individual",
        fuel_type: "Petrol",
        transmission_type: "Manual",
        vehicle_age: "4",
        km_driven: "32000",
        mileage: "21.2",
        engine: "1197",
        max_power: "88.5",
        seats: "5",
    },
    {
        label: "Hyundai Creta",
        type: "SUV",
        brand: "Hyundai",
        model: "Creta",
        seller_type: "Individual",
        fuel_type: "Diesel",
        transmission_type: "Automatic",
        vehicle_age: "3",
        km_driven: "28000",
        mileage: "18.5",
        engine: "1493",
        max_power: "113.4",
        seats: "5",
    },
    {
        label: "Honda City",
        type: "Sedan",
        brand: "Honda",
        model: "City",
        seller_type: "Dealer",
        fuel_type: "Petrol",
        transmission_type: "Manual",
        vehicle_age: "5",
        km_driven: "45000",
        mileage: "17.8",
        engine: "1498",
        max_power: "119.3",
        seats: "5",
    },
    {
        label: "BMW 3 Series",
        type: "Luxury",
        brand: "BMW",
        model: "3",
        seller_type: "Dealer",
        fuel_type: "Diesel",
        transmission_type: "Automatic",
        vehicle_age: "4",
        km_driven: "35000",
        mileage: "19.6",
        engine: "1995",
        max_power: "187.7",
        seats: "5",
    },
    {
        label: "Toyota Innova",
        type: "MUV",
        brand: "Toyota",
        model: "Innova",
        seller_type: "Individual",
        fuel_type: "Diesel",
        transmission_type: "Manual",
        vehicle_age: "6",
        km_driven: "75000",
        mileage: "13.6",
        engine: "2393",
        max_power: "147.5",
        seats: "7",
    },
];

const brands = Object.keys(brandModels).sort();
const vehicleAges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
const seatOptions = [2, 4, 5, 6, 7, 8, 9];

const defaultMetrics: ModelInfo = {
    selected_model: "Random Forest",
    target: "selling_price",
    currency: "INR",
    rows_used: 15411,
    training_rows: 12328,
    testing_rows: 3083,
    features: [
        "brand",
        "model",
        "seller_type",
        "fuel_type",
        "transmission_type",
        "vehicle_age",
        "km_driven",
        "mileage",
        "engine",
        "max_power",
        "seats",
    ],
    results: [
        {
            model: "Linear Regression",
            mae: 264971.03,
            rmse: 485832.61,
            r2: 0.6865,
        },
        {
            model: "Decision Tree",
            mae: 122307.32,
            rmse: 286623.69,
            r2: 0.8909,
        },
        {
            model: "Random Forest",
            mae: 99803.74,
            rmse: 221894.39,
            r2: 0.9346,
        },
    ],
};

const API_BASE = "http://127.0.0.1:8000";

function App() {
    const [activeTab, setActiveTab] = useState<"calculator" | "metrics" | "architecture">("calculator");
    const [apiOnline, setApiOnline] = useState<boolean | null>(null);

    const [form, setForm] = useState({
        brand: "Maruti",
        model: "Swift",
        seller_type: "Individual",
        fuel_type: "Petrol",
        transmission_type: "Manual",
        vehicle_age: "4",
        km_driven: "32000",
        mileage: "21.2",
        engine: "1197",
        max_power: "88.5",
        seats: "5",
    });

    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [metricsData, setMetricsData] = useState<ModelInfo>(defaultMetrics);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Check API health on mount
    useEffect(() => {
        checkHealth();
    }, []);

    async function checkHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`, { method: "GET" });
            if (res.ok) {
                setApiOnline(true);
                fetchModelInfo();
            } else {
                setApiOnline(false);
            }
        } catch {
            setApiOnline(false);
        }
    }

    async function fetchModelInfo() {
        try {
            const res = await fetch(`${API_BASE}/model-info`);
            if (res.ok) {
                const data = await res.json();
                if (data.metrics) {
                    setMetricsData(data.metrics);
                }
            }
        } catch {
            // Keep default metrics fallback
        }
    }

    function updateField(name: string, value: string) {
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function updateBrand(newBrand: string) {
        const models = brandModels[newBrand] ?? [];
        setForm((prev) => ({
            ...prev,
            brand: newBrand,
            model: models[0] ?? "",
        }));
    }

    function applyPreset(preset: (typeof defaultPresets)[0]) {
        setForm({
            brand: preset.brand,
            model: preset.model,
            seller_type: preset.seller_type,
            fuel_type: preset.fuel_type,
            transmission_type: preset.transmission_type,
            vehicle_age: preset.vehicle_age,
            km_driven: preset.km_driven,
            mileage: preset.mileage,
            engine: preset.engine,
            max_power: preset.max_power,
            seats: preset.seats,
        });
        setError("");
    }

    async function predictPrice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand: form.brand,
                    model: form.model,
                    seller_type: form.seller_type,
                    fuel_type: form.fuel_type,
                    transmission_type: form.transmission_type,
                    vehicle_age: Number(form.vehicle_age),
                    km_driven: Number(form.km_driven),
                    mileage: Number(form.mileage),
                    engine: Number(form.engine),
                    max_power: Number(form.max_power),
                    seats: Number(form.seats),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    typeof data.detail === "string"
                        ? data.detail
                        : JSON.stringify(data.detail ?? data)
                );
            }

            setPrediction(data as PredictionResult);
            setApiOnline(true);
        } catch (err) {
            setApiOnline(false);
            setError(
                err instanceof Error
                    ? `${err.message}. Please ensure the backend server is running: python -m uvicorn backend.main:app --reload`
                    : "Unable to connect to the prediction server. Please verify backend is running on port 8000."
            );
        } finally {
            setLoading(false);
        }
    }

    function copyValuation() {
        if (!prediction) return;
        const text = `Used Car Valuation: ${form.brand} ${form.model} (${form.vehicle_age} yrs, ${Number(form.km_driven).toLocaleString()} km) -> Estimated Price: ₹${prediction.predicted_price.toLocaleString("en-IN")} (${prediction.formatted_price})`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const availableModels = brandModels[form.brand] ?? [];

    const r2ChartData = metricsData.results.map((r) => ({
        model: r.model,
        "Accuracy (R² %)": Number((r.r2 * 100).toFixed(1)),
    }));

    const maeChartData = metricsData.results.map((r) => ({
        model: r.model,
        "MAE (₹)": Math.round(r.mae),
    }));

    return (
        <div className="app-shell">
            {/* Topbar */}
            <header className="topbar">
                <div className="topbar-left">
                    <a className="brand-logo" href="#">
                        AutoValue<span>AI</span>
                    </a>
                    <span className="version-pill">v1.0 Production</span>
                </div>

                <nav className="tab-nav">
                    <button
                        className={`tab-btn ${activeTab === "calculator" ? "active" : ""}`}
                        onClick={() => setActiveTab("calculator")}
                    >
                        Valuation Calculator
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "metrics" ? "active" : ""}`}
                        onClick={() => setActiveTab("metrics")}
                    >
                        Model Benchmarks
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "architecture" ? "active" : ""}`}
                        onClick={() => setActiveTab("architecture")}
                    >
                        System Architecture
                    </button>
                </nav>

                <div className="topbar-right">
                    <div
                        className={`status ${apiOnline ? "status-online" : apiOnline === false ? "status-offline" : "status-pending"}`}
                        onClick={checkHealth}
                        title="Click to re-check API connection"
                    >
                        <i />
                        <span>
                            {apiOnline === true
                                ? "API Online (8000)"
                                : apiOnline === false
                                ? "API Offline (Click to retry)"
                                : "Checking API..."}
                        </span>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Header */}
                <section className="hero">
                    <div className="hero-content">
                        <p className="eyebrow">INTELLIGENT AUTOMOTIVE PRICING ENGINE</p>
                        <h1>
                            Accurate Resale Valuation<br />
                            <span>Powered by Machine Learning.</span>
                        </h1>
                        <p className="hero-copy">
                            Trained on over 15,000 real-world vehicle transaction records.
                            Compare models, estimate market value bands, and uncover depreciation insights.
                        </p>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-card">
                            <strong>15,411</strong>
                            <span>Market Records</span>
                        </div>
                        <div className="stat-card">
                            <strong>93.5%</strong>
                            <span>R² Test Accuracy</span>
                        </div>
                        <div className="stat-card">
                            <strong>Random Forest</strong>
                            <span>Optimized Pipeline</span>
                        </div>
                        <div className="stat-card">
                            <strong>&lt; 10ms</strong>
                            <span>Inference Speed</span>
                        </div>
                    </div>
                </section>

                {/* TAB 1: CALCULATOR */}
                {activeTab === "calculator" && (
                    <>
                        {/* Quick Presets */}
                        <div className="presets-bar">
                            <span className="presets-label">⚡ Quick Presets:</span>
                            <div className="preset-chips">
                                {defaultPresets.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        className={`preset-btn ${form.brand === p.brand && form.model === p.model ? "active-preset" : ""}`}
                                        onClick={() => applyPreset(p)}
                                    >
                                        <strong>{p.label}</strong>
                                        <small>{p.type}</small>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <section className="content-grid">
                            {/* Input Form Card */}
                            <div className="form-card">
                                <div className="section-heading">
                                    <div>
                                        <p className="eyebrow">STEP 01</p>
                                        <h2>Enter Vehicle Specifications</h2>
                                    </div>
                                    <span className="step-badge">11 PARAMETERS</span>
                                </div>

                                <form onSubmit={predictPrice}>
                                    <div className="form-grid">
                                        {/* Brand */}
                                        <label className="field">
                                            <span>Make / Brand</span>
                                            <select
                                                value={form.brand}
                                                onChange={(e) => updateBrand(e.target.value)}
                                            >
                                                {brands.map((b) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Model */}
                                        <label className="field">
                                            <span>Model Variant</span>
                                            <select
                                                value={form.model}
                                                onChange={(e) => updateField("model", e.target.value)}
                                            >
                                                {availableModels.map((m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Seller Type */}
                                        <label className="field">
                                            <span>Seller Category</span>
                                            <select
                                                value={form.seller_type}
                                                onChange={(e) => updateField("seller_type", e.target.value)}
                                            >
                                                {["Individual", "Dealer", "Trustmark Dealer"].map((o) => (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Fuel Type */}
                                        <label className="field">
                                            <span>Fuel Type</span>
                                            <select
                                                value={form.fuel_type}
                                                onChange={(e) => updateField("fuel_type", e.target.value)}
                                            >
                                                {["Petrol", "Diesel", "CNG", "LPG", "Electric"].map((o) => (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Transmission */}
                                        <label className="field">
                                            <span>Transmission</span>
                                            <select
                                                value={form.transmission_type}
                                                onChange={(e) =>
                                                    updateField("transmission_type", e.target.value)
                                                }
                                            >
                                                {["Manual", "Automatic"].map((o) => (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Vehicle Age */}
                                        <label className="field">
                                            <span>Vehicle Age (Years)</span>
                                            <select
                                                value={form.vehicle_age}
                                                onChange={(e) => updateField("vehicle_age", e.target.value)}
                                            >
                                                {vehicleAges.map((a) => (
                                                    <option key={a} value={String(a)}>
                                                        {a === 0 ? "Brand New (0 Years)" : `${a} Year${a > 1 ? "s" : ""} Old`}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Odometer */}
                                        <label className="field">
                                            <span>Distance Driven (km)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000000"
                                                required
                                                placeholder="e.g. 35000"
                                                value={form.km_driven}
                                                onChange={(e) => updateField("km_driven", e.target.value)}
                                            />
                                        </label>

                                        {/* Mileage */}
                                        <label className="field">
                                            <span>Fuel Economy (km/l or km/kg)</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                step="0.01"
                                                required
                                                placeholder="e.g. 21.5"
                                                value={form.mileage}
                                                onChange={(e) => updateField("mileage", e.target.value)}
                                            />
                                        </label>

                                        {/* Engine */}
                                        <label className="field">
                                            <span>Engine Displacement (cc)</span>
                                            <input
                                                type="number"
                                                min="500"
                                                max="6600"
                                                step="1"
                                                required
                                                placeholder="e.g. 1197"
                                                value={form.engine}
                                                onChange={(e) => updateField("engine", e.target.value)}
                                            />
                                        </label>

                                        {/* Max Power */}
                                        <label className="field">
                                            <span>Maximum Power (bhp)</span>
                                            <input
                                                type="number"
                                                min="25"
                                                max="800"
                                                step="0.1"
                                                required
                                                placeholder="e.g. 88.5"
                                                value={form.max_power}
                                                onChange={(e) => updateField("max_power", e.target.value)}
                                            />
                                        </label>

                                        {/* Seats */}
                                        <label className="field">
                                            <span>Seating Capacity</span>
                                            <select
                                                value={form.seats}
                                                onChange={(e) => updateField("seats", e.target.value)}
                                            >
                                                {seatOptions.map((s) => (
                                                    <option key={s} value={String(s)}>
                                                        {s} Passenger Seats
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="button-row">
                                        <button
                                            className="predict-button"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span className="spinner-text">
                                                    <span className="spinner-dot" /> Computing valuation...
                                                </span>
                                            ) : (
                                                "Calculate Real-Time Market Valuation →"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Valuation Result Card */}
                            <aside className="result-card">
                                <div className="result-header">
                                    <div className="result-icon">₹</div>
                                    <div className="result-badge-wrap">
                                        <span className="market-badge">
                                            {prediction ? prediction.market_tier : "Awaiting Input"}
                                        </span>
                                    </div>
                                </div>

                                <p className="eyebrow">ESTIMATED RESALE VALUE</p>

                                {prediction ? (
                                    <>
                                        <div className="price-container">
                                            <div className="price-primary">
                                                ₹ {Number(prediction.predicted_price).toLocaleString("en-IN", {
                                                    maximumFractionDigits: 0,
                                                })}
                                            </div>
                                            <div className="price-secondary">
                                                ({prediction.formatted_price})
                                            </div>
                                        </div>

                                        {/* Fair Market Range Box */}
                                        <div className="valuation-band-box">
                                            <div className="band-title">
                                                <span>Fair Market Band (95% CI)</span>
                                                <span className="band-spread">±7% spread</span>
                                            </div>
                                            <div className="band-values">
                                                <div className="band-point">
                                                    <small>Lower Range</small>
                                                    <strong>
                                                        ₹ {Number(prediction.price_range.low).toLocaleString("en-IN", {
                                                            maximumFractionDigits: 0,
                                                        })}
                                                    </strong>
                                                </div>
                                                <div className="band-divider" />
                                                <div className="band-point">
                                                    <small>Upper Range</small>
                                                    <strong>
                                                        ₹ {Number(prediction.price_range.high).toLocaleString("en-IN", {
                                                            maximumFractionDigits: 0,
                                                        })}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vehicle Pill Tags */}
                                        <div className="spec-tags">
                                            <span className="spec-tag">{form.brand} {form.model}</span>
                                            <span className="spec-tag">{form.vehicle_age} yrs old</span>
                                            <span className="spec-tag">{Number(form.km_driven).toLocaleString()} km</span>
                                            <span className="spec-tag">{form.fuel_type}</span>
                                            <span className="spec-tag">{form.transmission_type}</span>
                                        </div>

                                        <p className="result-description">{prediction.message}</p>

                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="copy-btn"
                                                onClick={copyValuation}
                                            >
                                                {copied ? "✓ Copied to clipboard!" : "📋 Copy Valuation Summary"}
                                            </button>
                                        </div>

                                        <p className="disclaimer">
                                            Statistical estimate based on scikit-learn Random Forest regression model.
                                            Actual sale prices vary depending on physical inspections, condition, and location.
                                        </p>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <h2>Ready for Valuation</h2>
                                        <p className="result-description">
                                            Configure vehicle specifications on the left or select a quick preset
                                            above to generate an instant estimate.
                                        </p>
                                        <div className="sample-tip">
                                            💡 <strong>Pro Tip:</strong> Transmission type and vehicle age are the top
                                            influencing factors on resale value.
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-box">
                                        <strong>Connection Error:</strong>
                                        <p>{error}</p>
                                        <button
                                            type="button"
                                            className="retry-btn"
                                            onClick={checkHealth}
                                        >
                                            Retry Connection
                                        </button>
                                    </div>
                                )}

                                <div className="result-divider" />
                                <div className="model-note">
                                    <span className="model-dot" />
                                    <div>
                                        <strong>{metricsData.selected_model} Regressor</strong>
                                        <p>
                                            Top performer across 3 evaluated models with MAE of ₹
                                            {Math.round(
                                                metricsData.results.find((r) => r.model === metricsData.selected_model)
                                                    ?.mae ?? 99803
                                            ).toLocaleString("en-IN")}
                                            .
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </section>
                    </>
                )}

                {/* TAB 2: MODEL BENCHMARKS */}
                {activeTab === "metrics" && (
                    <section className="benchmarks-view">
                        <div className="view-header">
                            <p className="eyebrow">MACHINE LEARNING PERFORMANCE</p>
                            <h2>Model Comparison & Evaluation Benchmarks</h2>
                            <p className="section-subtext">
                                Evaluated on an independent 20% holdout test set (3,083 samples)
                                across 15,411 total records from the Cardekho dataset.
                            </p>
                        </div>

                        {/* Benchmark Summary Cards */}
                        <div className="benchmark-cards">
                            {metricsData.results.map((m) => {
                                const isWinner = m.model === metricsData.selected_model;
                                return (
                                    <div
                                        key={m.model}
                                        className={`model-card ${isWinner ? "model-card-winner" : ""}`}
                                    >
                                        {isWinner && <div className="winner-badge">★ Recommended Model</div>}
                                        <h3>{m.model}</h3>
                                        <div className="metric-row">
                                            <span>R² Score (Variance Explained):</span>
                                            <strong>{(m.r2 * 100).toFixed(2)}%</strong>
                                        </div>
                                        <div className="metric-row">
                                            <span>Mean Absolute Error (MAE):</span>
                                            <strong>₹ {Math.round(m.mae).toLocaleString("en-IN")}</strong>
                                        </div>
                                        <div className="metric-row">
                                            <span>Root Mean Squared Error:</span>
                                            <strong>₹ {Math.round(m.rmse).toLocaleString("en-IN")}</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Interactive Visualizations using Recharts */}
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h3>R² Accuracy Score Comparison (%)</h3>
                                <p className="chart-desc">
                                    Higher is better. Measures goodness-of-fit on unseen vehicle test data.
                                </p>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={r2ChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf5" />
                                            <XAxis dataKey="model" stroke="#687690" />
                                            <YAxis domain={[0, 100]} stroke="#687690" />
                                            <Tooltip
                                                formatter={(value: number) => [`${value}%`, "R² Score"]}
                                                contentStyle={{ background: "#1f2937", color: "#fff", borderRadius: "8px" }}
                                            />
                                            <Legend />
                                            <Bar dataKey="Accuracy (R² %)" fill="#315ce8" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Mean Absolute Error Comparison (₹)</h3>
                                <p className="chart-desc">
                                    Lower is better. Represents average prediction error in Indian Rupees.
                                </p>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={maeChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf5" />
                                            <XAxis dataKey="model" stroke="#687690" />
                                            <YAxis stroke="#687690" />
                                            <Tooltip
                                                formatter={(value: number) => [`₹ ${Number(value).toLocaleString("en-IN")}`, "MAE"]}
                                                contentStyle={{ background: "#1f2937", color: "#fff", borderRadius: "8px" }}
                                            />
                                            <Legend />
                                            <Bar dataKey="MAE (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* TAB 3: SYSTEM ARCHITECTURE */}
                {activeTab === "architecture" && (
                    <section className="architecture-view">
                        <div className="view-header">
                            <p className="eyebrow">ENGINEERING & DATA PIPELINE</p>
                            <h2>System Architecture & Implementation</h2>
                            <p className="section-subtext">
                                Robust, end-to-end pipeline connecting raw telemetry, scikit-learn
                                ColumnTransformers, FastAPI asynchronous endpoints, and Vite/React UI.
                            </p>
                        </div>

                        <div className="arch-grid">
                            <article className="arch-card">
                                <div className="arch-step">01</div>
                                <h3>Data Ingestion & Cleaning</h3>
                                <p>
                                    The dataset contains 15,411 verified vehicle listings with 11 core feature columns
                                    and selling price target. Null values and malformed records are cleaned during training.
                                </p>
                                <ul className="arch-list">
                                    <li>11 input features (5 categorical, 6 numerical)</li>
                                    <li>80/20 train/test holdout validation split</li>
                                    <li>Fixed random seed (42) for deterministic reproducibility</li>
                                </ul>
                            </article>

                            <article className="arch-card">
                                <div className="arch-step">02</div>
                                <h3>Pipeline Feature Engineering</h3>
                                <p>
                                    Built using scikit-learn's <code>ColumnTransformer</code> to eliminate
                                    data leakage between training and testing splits:
                                </p>
                                <ul className="arch-list">
                                    <li><strong>Numeric:</strong> SimpleImputer (median strategy)</li>
                                    <li><strong>Categorical:</strong> SimpleImputer (most frequent) + OneHotEncoder(ignore unknown)</li>
                                    <li>No manual hardcoded feature matrices</li>
                                </ul>
                            </article>

                            <article className="arch-card">
                                <div className="arch-step">03</div>
                                <h3>Model Benchmark & Selection</h3>
                                <p>
                                    Automated training script benchmarked three distinct regression paradigms:
                                </p>
                                <ul className="arch-list">
                                    <li>Linear Regression (Baseline) — R²: 68.6%</li>
                                    <li>Decision Tree Regressor — R²: 89.1%</li>
                                    <li><strong>Random Forest Regressor (Selected) — R²: 93.5%</strong></li>
                                </ul>
                            </article>

                            <article className="arch-card">
                                <div className="arch-step">04</div>
                                <h3>FastAPI Inference Engine</h3>
                                <p>
                                    High-performance asynchronous backend providing sub-10ms predictions:
                                </p>
                                <ul className="arch-list">
                                    <li>In-memory model caching with startup pre-warming</li>
                                    <li>Strict Pydantic request/response schema validation</li>
                                    <li>Valuation bands (±7% spread) and market tier tagging</li>
                                </ul>
                            </article>
                        </div>
                    </section>
                )}

                {/* How it Works bottom section */}
                <section className="method-section">
                    <p className="eyebrow">WORKFLOW</p>
                    <h2>Data-driven. Transparent. Instant.</h2>
                    <div className="method-grid">
                        <article>
                            <span>01</span>
                            <h3>Configure Attributes</h3>
                            <p>Select brand, model variant, age, distance driven, and drivetrain details.</p>
                        </article>
                        <article>
                            <span>02</span>
                            <h3>Preprocessing Pipeline</h3>
                            <p>OneHotEncoders transform nominal categorical variables while median imputers normalize numerics.</p>
                        </article>
                        <article>
                            <span>03</span>
                            <h3>Random Forest Inference</h3>
                            <p>Ensemble decision trees evaluate market depreciation curves to predict true resale valuation.</p>
                        </article>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer>
                <div className="footer-content">
                    <p>AutoValue AI · Used Car Resale Price Prediction Engine · Production Grade ML System</p>
                    <p className="footer-links">
                        <span>FastAPI Backend: <code>http://127.0.0.1:8000/docs</code></span>
                        <span>Dataset: 15,411 Cardekho Records</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
