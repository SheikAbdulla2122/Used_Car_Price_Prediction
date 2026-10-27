
import { useState, type FormEvent } from "react";
import "./index.css";

type PredictionResult = {
    predicted_price: number;
    currency: string;
    message: string;
};

/* ── brand → model mapping from the training dataset ── */
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

const brands = Object.keys(brandModels).sort();

const vehicleAges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 25, 29];
const seatOptions = [2, 4, 5, 6, 7, 8, 9];

function App() {
    const [form, setForm] = useState({
        brand: "Maruti",
        model: "Alto",
        seller_type: "Individual",
        fuel_type: "Petrol",
        transmission_type: "Manual",
        vehicle_age: "5",
        km_driven: "40000",
        mileage: "22",
        engine: "800",
        max_power: "48",
        seats: "5",
    });

    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(name: string, value: string) {
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    function updateBrand(newBrand: string) {
        const models = brandModels[newBrand] ?? [];
        setForm((previous) => ({
            ...previous,
            brand: newBrand,
            model: models[0] ?? "",
        }));
    }

    async function predictPrice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setPrediction(null);

        try {
            const response = await fetch("http://127.0.0.1:8000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
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
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the prediction server."
            );
        } finally {
            setLoading(false);
        }
    }

    const availableModels = brandModels[form.brand] ?? [];

    return (
        <div className="app-shell">
            <header className="topbar">
                <a className="brand-logo" href="#">AutoValue<span> AI</span></a>
                <span className="status"><i /> ML API connected through localhost</span>
            </header>

            <main>
                <section className="hero">
                    <p className="eyebrow">SMART AUTOMOTIVE VALUATION</p>
                    <h1>Discover what your car<br /><span>is really worth.</span></h1>
                    <p className="hero-copy">
                        Estimate a used car's resale price using vehicle details and our
                        trained machine learning model.
                    </p>
                    <div className="hero-stats">
                        <div><strong>15,411</strong><span>Dataset records</span></div>
                        <div><strong>3</strong><span>Models evaluated</span></div>
                        <div><strong>Random Forest</strong><span>Selected algorithm</span></div>
                    </div>
                </section>

                <section className="content-grid">
                    <div className="form-card">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">VEHICLE DETAILS</p>
                                <h2>Calculate resale value</h2>
                            </div>
                            <span className="step-badge">01 / INPUT</span>
                        </div>

                        <form onSubmit={predictPrice}>
                            <div className="form-grid">
                                {/* Brand – dropdown */}
                                <label className="field">
                                    <span>Brand</span>
                                    <select
                                        value={form.brand}
                                        onChange={(e) => updateBrand(e.target.value)}
                                    >
                                        {brands.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </label>

                                {/* Model – filtered by brand */}
                                <label className="field">
                                    <span>Model</span>
                                    <select
                                        value={form.model}
                                        onChange={(e) => updateField("model", e.target.value)}
                                    >
                                        {availableModels.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </label>

                                {/* Seller Type */}
                                <label className="field">
                                    <span>Seller Type</span>
                                    <select
                                        value={form.seller_type}
                                        onChange={(e) => updateField("seller_type", e.target.value)}
                                    >
                                        {["Individual", "Dealer", "Trustmark Dealer"].map((o) => (
                                            <option key={o} value={o}>{o}</option>
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
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </label>

                                {/* Transmission */}
                                <label className="field">
                                    <span>Transmission</span>
                                    <select
                                        value={form.transmission_type}
                                        onChange={(e) => updateField("transmission_type", e.target.value)}
                                    >
                                        {["Manual", "Automatic"].map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </label>

                                {/* Vehicle Age – dropdown */}
                                <label className="field">
                                    <span>Vehicle Age (years)</span>
                                    <select
                                        value={form.vehicle_age}
                                        onChange={(e) => updateField("vehicle_age", e.target.value)}
                                    >
                                        {vehicleAges.map((a) => (
                                            <option key={a} value={String(a)}>
                                                {a === 0 ? "Brand New" : `${a} year${a > 1 ? "s" : ""}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {/* Kilometres Driven – number input */}
                                <label className="field">
                                    <span>Kilometres Driven</span>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="e.g. 40000"
                                        value={form.km_driven}
                                        onChange={(e) => updateField("km_driven", e.target.value)}
                                    />
                                </label>

                                {/* Mileage – number input */}
                                <label className="field">
                                    <span>Mileage (km/l)</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        required
                                        placeholder="e.g. 22"
                                        value={form.mileage}
                                        onChange={(e) => updateField("mileage", e.target.value)}
                                    />
                                </label>

                                {/* Engine – number input */}
                                <label className="field">
                                    <span>Engine (cc)</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        required
                                        placeholder="e.g. 1248"
                                        value={form.engine}
                                        onChange={(e) => updateField("engine", e.target.value)}
                                    />
                                </label>

                                {/* Max Power – number input */}
                                <label className="field">
                                    <span>Max Power (bhp)</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        required
                                        placeholder="e.g. 88.5"
                                        value={form.max_power}
                                        onChange={(e) => updateField("max_power", e.target.value)}
                                    />
                                </label>

                                {/* Seats – dropdown */}
                                <label className="field">
                                    <span>Seats</span>
                                    <select
                                        value={form.seats}
                                        onChange={(e) => updateField("seats", e.target.value)}
                                    >
                                        {seatOptions.map((s) => (
                                            <option key={s} value={String(s)}>{s} Seater</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <button className="predict-button" type="submit" disabled={loading}>
                                {loading ? "Calculating estimate..." : "Estimate car price →"}
                            </button>
                        </form>
                    </div>

                    <aside className="result-card">
                        <div className="result-icon">₹</div>
                        <p className="eyebrow">YOUR ESTIMATED VALUE</p>
                        {prediction ? (
                            <>
                                <div className="price">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                        maximumFractionDigits: 0,
                                    }).format(prediction.predicted_price)}
                                </div>
                                <p className="result-description">{prediction.message}</p>
                                <p className="disclaimer">
                                    This is a model-based estimate, not a guaranteed selling price.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2>Ready when<br />you are.</h2>
                                <p className="result-description">
                                    Enter your vehicle details and calculate an estimated resale value.
                                </p>
                            </>
                        )}

                        {error && <div className="error-box">{error}</div>}

                        <div className="result-divider" />
                        <div className="model-note">
                            <span className="model-dot" />
                            <div>
                                <strong>Random Forest Regressor</strong>
                                <p>Chosen from three evaluated models based on test-set MAE.</p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="method-section">
                    <p className="eyebrow">HOW IT WORKS</p>
                    <h2>Data-driven. Easy to understand.</h2>
                    <div className="method-grid">
                        <article><span>01</span><h3>Select details</h3><p>Pick your car's brand, model, fuel type and other features from dropdowns.</p></article>
                        <article><span>02</span><h3>Model analysis</h3><p>The saved preprocessing pipeline prepares the details for prediction.</p></article>
                        <article><span>03</span><h3>Get an estimate</h3><p>The trained model returns an estimated resale price in Indian rupees.</p></article>
                    </div>
                </section>
            </main>

            <footer>AutoValue AI · Used Car Resale Price Prediction · Academic project</footer>
        </div>
    );
}

export default App;
