from __future__ import annotations

from collections import Counter
from itertools import combinations
from typing import Any
import math
import uuid

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Pattern Discovery Engine API", version="1.0.0")

# Local Vite/React development servers commonly use 3000 or 5173.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                   "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASETS: dict[str, dict[str, Any]] = {}


class DatasetRequest(BaseModel):
    dataset_id: str
    column_mapping: dict[str, str] | None = None


class MiningRequest(BaseModel):
    dataset_id: str
    min_support: float = 0.001
    min_confidence: float = 0.10
    min_lift: float = 1.0
    max_antecedent_size: int = 2
    max_consequent_size: int = 1


class AnalyzeRequest(BaseModel):
    dataset_id: str
    target_category: str | None = None
    target_product: str | None = None
    metric: str = "revenue"
    granularity: str = "M"


class ForecastRequest(BaseModel):
    dataset_id: str
    target_product: str
    horizon: int = 4
    granularity: str = "M"


class ExplainRequest(BaseModel):
    antecedent: list[str]
    consequent: list[str]
    support: float
    confidence: float
    lift: float


def make_demo() -> pd.DataFrame:
    """Clearly synthetic sample transactions for local testing."""
    rng = np.random.default_rng(42)
    products = [
        ("P100", "Ceramic Mug", 7.50), ("P101", "Tea Tin", 12.00),
        ("P102", "Reusable Bottle", 15.00), ("P103", "Notebook", 4.50),
        ("P104", "Pen Set", 6.00), ("P105", "Canvas Tote", 9.00),
        ("P106", "Desk Organizer", 18.00), ("P107", "Gift Wrap", 3.00),
        ("P108", "Scented Candle", 11.00), ("P109", "Tea Tin", 12.00),
    ]
    bundles = [
        [0, 1, 7], [2, 5], [3, 4, 6], [0, 8, 7],
        [1, 8], [2, 3, 4], [0, 1], [5, 7], [3, 4], [0, 5, 8]
    ]
    rows = []
    start = pd.Timestamp("2024-01-01")
    for invoice_idx in range(1, 241):
        chosen = bundles[(invoice_idx + int(rng.integers(0, len(bundles)))) % len(bundles)]
        # Add a little variety while preserving recurring product combinations.
        if rng.random() < 0.25:
            chosen = list(set(chosen + [int(rng.integers(0, len(products)))]))
        dt = start + pd.Timedelta(days=int(rng.integers(0, 730)))
        country = rng.choice(["United Kingdom", "Germany", "France", "Spain", "Netherlands"])
        customer = int(rng.integers(10000, 10120))
        for pidx in chosen:
            code, name, price = products[pidx]
            qty = int(rng.integers(1, 5))
            rows.append({
                "InvoiceNo": f"INV{invoice_idx:05d}",
                "StockCode": code,
                "Description": name,
                "Quantity": qty,
                "InvoiceDate": dt,
                "UnitPrice": price,
                "CustomerID": customer,
                "Country": country,
            })
    return pd.DataFrame(rows)


def normalize_columns(df: pd.DataFrame, mapping: dict[str, str] | None = None)-> pd.DataFrame:
    out = df.copy()
    out.columns = [str(c).strip() for c in out.columns]
    # Mapping contract is source column -> canonical column.
    if mapping:
        safe_mapping = {str(k): str(v) for k, v in mapping.items() if k in out.columns}
        out = out.rename(columns=safe_mapping)
    aliases = {
        # Transaction/order identifiers
        "invoiceno": "InvoiceNo", "invoice": "InvoiceNo", "invoice number": "InvoiceNo",
        "order id": "InvoiceNo", "order number": "InvoiceNo",
        "transaction id": "InvoiceNo", "transaction": "InvoiceNo",
        # Product identifiers and names
        "stockcode": "StockCode", "product id": "StockCode", "product": "Description",
        "description": "Description", "product name": "Description",
        "product category": "Category", "category": "Category",
        # Quantity, date and price
        "quantity": "Quantity", "qty": "Quantity",
        "invoicedate": "InvoiceDate", "date": "InvoiceDate", "order date": "InvoiceDate",
        "transaction date": "InvoiceDate", "purchase date": "InvoiceDate",
        "unitprice": "UnitPrice", "price": "UnitPrice", "unit price": "UnitPrice",
        # Customer and geographic fields
        "customerid": "CustomerID", "customer id": "CustomerID", "customer": "CustomerID",
        "country": "Country", "store country": "Country",
    }
    renames = {}
    for col in out.columns:
        key = str(col).strip().lower().replace("_", " ")
        compact = key.replace(" ", "")
        if key in aliases:
            renames[col] = aliases[key]
        elif compact in aliases:
            renames[col] = aliases[compact]
    out = out.rename(columns=renames)
    # Avoid duplicate canonical names from a file with multiple aliases.
    out = out.loc[:, ~out.columns.duplicated()].copy()
    if "Description" not in out.columns and "StockCode" in out.columns:
        out["Description"] = out["StockCode"].astype(str)
    if "StockCode" not in out.columns and "Description" in out.columns:
        out["StockCode"] = out["Description"].astype(str)
    required = ["InvoiceNo", "StockCode", "Quantity", "UnitPrice", "InvoiceDate"]
    missing = [c for c in required if c not in out.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required transaction columns: {', '.join(missing)}. "
                   "Expected invoice/order ID, product, quantity, unit price, and date. "
                   "Use column_mapping to map source columns.",
        )
    if "CustomerID" not in out.columns:
        out["CustomerID"] = pd.NA
    if "Country" not in out.columns:
        out["Country"] = "Unknown"
    return out


def clean_data(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    data = normalize_columns(df)
    counts: dict[str, int] = {"initial_rows": int(len(data))}
    data["InvoiceDate"] = pd.to_datetime(data["InvoiceDate"], errors="coerce")
    data["Quantity"] = pd.to_numeric(data["Quantity"], errors="coerce")
    data["UnitPrice"] = pd.to_numeric(data["UnitPrice"], errors="coerce")
    cancelled = data["InvoiceNo"].astype("string").str.strip().str.upper().str.startswith("C", na=False)
    counts["cancelled_invoices"] = int(cancelled.sum())
    data = data.loc[~cancelled].copy()
    invalid = data["InvoiceDate"].isna() | data["Quantity"].isna() | data["UnitPrice"].isna()
    counts["rows_removed_missing_critical"] = int(invalid.sum())
    data = data.loc[~invalid].copy()
    bad_values = (data["Quantity"] <= 0) | (data["UnitPrice"] <= 0)
    counts["rows_removed_nonpositive"] = int(bad_values.sum())
    data = data.loc[~bad_values].copy()
    missing_core = data["InvoiceNo"].isna() | data["StockCode"].isna()
    counts["rows_removed_missing_ids"] = int(missing_core.sum())
    data = data.loc[~missing_core].copy()
    before = len(data)
    data = data.drop_duplicates().copy()
    counts["duplicate_rows_removed"] = int(before - len(data))
    data["Revenue"] = data["Quantity"] * data["UnitPrice"]
    data["Country"] = data["Country"].fillna("Unknown").astype(str)
    data["Description"] = data["Description"].fillna(data["StockCode"].astype(str)).astype(str)
    data["StockCode"] = data["StockCode"].astype(str)
    counts["final_rows"] = int(len(data))
    return data.reset_index(drop=True), counts


def get_record(dataset_id: str) -> dict[str, Any]:
    if dataset_id not in DATASETS:
        raise HTTPException(status_code=404, detail="Dataset not found. Load or upload a dataset first.")
    return DATASETS[dataset_id]


def register_dataset(df: pd.DataFrame, source: str, synthetic: bool = False) -> dict[str, Any]:
    # Validate required columns now, so users get a useful error on upload.
    normalized = normalize_columns(df)
    dataset_id = str(uuid.uuid4())
    DATASETS[dataset_id] = {
        "raw": normalized, "clean": None, "source": source, "synthetic": synthetic,
        "mapping": {},
    }
    return {
        "dataset_id": dataset_id,
        "row_count": int(len(normalized)),
        "columns": [str(c) for c in normalized.columns],
        "suggested_mapping": {
            "InvoiceNo": "InvoiceNo", "StockCode": "StockCode", "Description":"Description",
            "Quantity": "Quantity", "InvoiceDate": "InvoiceDate", "UnitPrice":"UnitPrice",
            "CustomerID": "CustomerID", "Country": "Country",
        },
    }


@app.get("/")
def root():
    return {"name": "Pattern Discovery Engine API", "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/dataset/demo")
def load_demo():
    return register_dataset(make_demo(), "Synthetic demo transactions", synthetic=True)


@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = (file.filename or "").lower()
    try:
        # Read directly from UploadFile's spooled file instead of copying the
        # entire upload into a second in-memory bytes object. Large CSVs can
        # still require substantial RAM once parsed into a DataFrame.
        if filename.endswith(".csv"):
            df = pd.read_csv(file.file, encoding_errors="replace", low_memory=False)
        elif filename.endswith((".xlsx", ".xlsm", ".xls")):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(status_code=400, detail="Upload a CSV, XLSX, or XLSM file.")
        return register_dataset(df, file.filename or "uploaded file")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded dataset: {exc}") from exc


@app.post("/api/preprocessing/run")
def run_preprocessing(req: DatasetRequest):
    rec = get_record(req.dataset_id)
    try:
        source = normalize_columns(rec["raw"], req.column_mapping)
        clean, counts = clean_data(source)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Preprocessing failed: {exc}") from exc
    rec["clean"] = clean
    rec["mapping"] = req.column_mapping or {}
    dates = clean["InvoiceDate"]
    date_range = ""
    if not dates.empty:
        date_range = f"{dates.min().date().isoformat()} to {dates.max().date().isoformat()}"
    return {
        "initial_rows": counts["initial_rows"], "final_rows": counts["final_rows"],
        "duplicate_rows_removed": counts["duplicate_rows_removed"],
        "rows_removed_missing_critical": counts["rows_removed_missing_critical"],
        "unique_transactions": int(clean["InvoiceNo"].nunique()),
        "unique_products": int(clean["StockCode"].nunique()),
        "date_range": date_range, "status": "success",
    }


def analysis_df(dataset_id: str) -> pd.DataFrame:
    rec = get_record(dataset_id)
    if rec["clean"] is None:
        cleaned, _ = clean_data(rec["raw"])
        rec["clean"] = cleaned
    return rec["clean"].copy()


@app.post("/api/mining/run")
def run_mining(req: MiningRequest):
    """Mine product pairs by counting only pairs that actually occur in a basket.

    This avoids enumerating every possible combination of the full product catalog,
    which is prohibitively expensive for datasets with thousands of distinct products.
    """
    df = analysis_df(req.dataset_id)
    if df.empty:
        return {"rule_count": 0, "rules": [], "transactions_checked": 0}

    # One basket per transaction. Prefer product names for readable rules, and fall
    # back to product IDs if descriptions are missing.
    product_col = "Description" if "Description" in df.columns else "StockCode"
    baskets = (
        df.dropna(subset=["InvoiceNo", product_col])
          .groupby("InvoiceNo", sort=False)[product_col]
          .apply(lambda values: set(values.astype(str).str.strip()) - {"", "nan", "None"})
    )
    transactions = [basket for basket in baskets.tolist() if basket]
    n = len(transactions)
    if not n:
        return {"rule_count": 0, "rules": [], "transactions_checked": 0}

    min_support = max(0.0, min(float(req.min_support), 1.0))
    min_conf = max(0.0, min(float(req.min_confidence), 1.0))
    min_lift = max(0.0, float(req.min_lift))

    # Count item and observed-pair occurrences in a single pass. Never iterate over
    # combinations of all ~10,000 catalog items; only pairs inside actual baskets.
    item_counts: Counter[str] = Counter()
    pair_counts: Counter[tuple[str, str]] = Counter()
    for basket in transactions:
        item_counts.update(basket)
        if len(basket) > 1:
            pair_counts.update(combinations(sorted(basket), 2))

    item_support = {item: count / n for item, count in item_counts.items()}
    rules = []
    for (left, right), count in pair_counts.items():
        support = count / n
        if support < min_support:
            continue
        left_support = item_support.get(left, 0.0)
        right_support = item_support.get(right, 0.0)
        if not left_support or not right_support:
            continue

        # Both directions are valid association rules for a co-occurring pair.
        for antecedent, consequent, antecedent_support, consequent_support in (
            (left, right, left_support, right_support),
            (right, left, right_support, left_support),
        ):
            confidence = support / antecedent_support
            lift = confidence / consequent_support if consequent_support else 0.0
            if confidence >= min_conf and lift >= min_lift:
                rules.append({
                    "antecedent": [antecedent],
                    "consequent": [consequent],
                    "support": round(float(support), 6),
                    "confidence": round(float(confidence), 6),
                    "lift": round(float(lift), 5),
                })

    rules.sort(key=lambda r: (r["lift"], r["confidence"], r["support"]), reverse=True)
    rules = rules[:200]
    return {
        "rule_count": len(rules),
        "rules": rules,
        "transactions_checked": n,
        "unique_products": len(item_counts),
        "min_support_used": min_support,
    }


@app.post("/api/demographics/analyze")
def analyze_demographics(req: DatasetRequest):
    df = analysis_df(req.dataset_id)
    if df.empty:
        return {"status": "success", "summary": {"segments": {}}, "preferences": []}
    cust = df.dropna(subset=["CustomerID"]).copy()
    if cust.empty:
        return {"status": "success", "summary": {
            "segmentation_type": "spend-based", "total_unique_customers": 0,
            "repeat_customers": 0, "repeat_purchase_rate_percent": 0.0,
            "average_units_per_basket": 0.0, "segments": {}, "countries": {},
        }, "preferences": []}
    spend = cust.groupby("CustomerID")["Revenue"].sum()
    q1, q2 = spend.quantile([0.33, 0.67]).tolist()
    def segment(value):
        if value <= q1: return "Low spend"
        if value <= q2: return "Mid spend"
        return "High spend"
    spend_segments = spend.map(segment).to_dict()
    cust["customer_segment"] = cust["CustomerID"].map(spend_segments)
    segments = cust[["CustomerID", "customer_segment"]].drop_duplicates()["customer_segment"].value_counts().to_dict()
    customer_orders = cust.groupby("CustomerID")["InvoiceNo"].nunique()
    repeat_customers = int((customer_orders > 1).sum())
    total_customers = int(customer_orders.size)
    baskets = df.groupby("InvoiceNo")["Quantity"].sum()
    countries = cust.groupby("Country")["CustomerID"].nunique().sort_values(ascending=False).to_dict()
    grouped = cust.groupby(["customer_segment", "Description", "StockCode"], dropna=False)["Quantity"].sum().reset_index()
    total_by_segment = grouped.groupby("customer_segment")["Quantity"].sum().to_dict()
    preferences = []
    for _, row in grouped.iterrows():
        total = float(total_by_segment.get(row["customer_segment"], 0))
        preferences.append({
            "customer_segment": str(row["customer_segment"]),
            "age_group": str(row["customer_segment"]),
            "category": str(row["Description"]),
            "product_name": str(row["Description"]),
            "purchase_count": int(row["Quantity"]),
            "total_age_purchases": int(total),
            "probability": round(float(row["Quantity"]) / total, 5) if total else 0,
        })
    preferences.sort(key=lambda p: (p["customer_segment"], -p["probability"]))
    return {
        "status": "success",
        "summary": {
            "segmentation_type": "spend-based",
            "total_unique_customers": total_customers,
            "repeat_customers": repeat_customers,
            "repeat_purchase_rate_percent": round(repeat_customers / total_customers * 100, 2) if total_customers else 0.0,
            "average_units_per_basket": round(float(baskets.mean()), 2) if len(baskets) else 0.0,
            "segments": {str(k): int(v) for k, v in segments.items()},
            "countries": {str(k): int(v) for k, v in countries.items()},
            "note": "Segments are based on customer spend, not demographic age data."
        },
        "preferences": preferences[:500],
    }


@app.post("/api/temporal/analyze")
def analyze_temporal(req: AnalyzeRequest):
    df = analysis_df(req.dataset_id)
    if df.empty:
        return {"status": "success", "monthly_trend": [], "categories": [], "products": []}
    if req.target_product and req.target_product not in ("All Products", "All"):
        df = df.loc[df["Description"].astype(str) == req.target_product]
    if req.target_category and "Category" in df.columns:
        df = df.loc[df["Category"].astype(str) == req.target_category]
    metric = (req.metric or "revenue").lower()
    if metric in ("quantity", "units", "sales_volume"):
        df["_value"] = df["Quantity"]
    elif metric in ("transactions", "orders", "transaction_count"):
        df["_value"] = 1
    else:
        df["_value"] = df["Revenue"]
    gran = (req.granularity or "M").upper()
    freq = {"D": "D", "W": "W-SUN", "WEEK": "W-SUN", "M": "MS", "MONTH": "MS","Q": "QS", "Y": "YS"}.get(gran, "MS")
    series = df.set_index("InvoiceDate").resample(freq)["_value"].sum()
    trend = []
    for idx, value in series.items():
        label = idx.strftime("%Y-%m-%d") if freq == "D" else idx.strftime("%Y-%m")
        trend.append({"period": label, "year_month": label, "date": label, "value": round(float(value), 2)})
    return {
        "status": "success", "monthly_trend": trend,
        "categories": sorted(df["Category"].dropna().astype(str).unique().tolist()) if "Category" in df.columns else [],
        "products": sorted(df["Description"].dropna().astype(str).unique().tolist()),
        "metric": metric, "granularity": gran,
    }


def safe_metrics(actual: np.ndarray, pred: np.ndarray) -> tuple[float, float, float, float]:
    if len(actual) == 0:
        return 0.0, 0.0, 0.0, 0.0
    errors = actual - pred
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    denom = float(np.sum(np.abs(actual)))
    wape = float(np.sum(np.abs(errors)) / denom * 100) if denom else 0.0
    if len(actual) >= 2 and float(np.var(actual)) > 0:
        r2 = float(1 - np.sum(errors ** 2) / np.sum((actual - np.mean(actual))** 2))
    else:
        r2 = 0.0
    return mae, rmse, r2, wape


@app.post("/api/forecast/run")
def run_forecast(req: ForecastRequest):
    df = analysis_df(req.dataset_id)
    target = (req.target_product or "Overall").strip()
    if target.lower() not in {"overall", "all", "all items", "all products", "overall store demand"}:
        if "Category" in df.columns and (df["Category"].astype(str) == target).any():
            df = df.loc[df["Category"].astype(str) == target].copy()
        else:
            df = df.loc[df["Description"].astype(str) == target].copy()
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No rows found for target: {target}. Choose Overall Store Demand or a category/product present in the uploaded data.")
    gran = (req.granularity or "M").upper()
    freq = {"D": "D", "W": "W-SUN", "M": "MS", "Q": "QS"}.get(gran, "MS")
    series = df.set_index("InvoiceDate")["Quantity"].resample(freq).sum().sort_index()
    if len(series) < 3:
        raise HTTPException(status_code=400, detail="At least three time periods are needed for a forecast. Try monthly granularity or a product with more history.")
    # Fill missing periods so that the model has a continuous time series.
    series = series.asfreq(freq, fill_value=0).astype(float)
    horizon = max(1, min(int(req.horizon), 24))
    split = max(1, min(len(series) - 1, int(math.ceil(len(series) * 0.8))))
    train, test = series.iloc[:split], series.iloc[split:]
    baseline = float(train.tail(min(3, len(train))).mean())
    test_pred = np.array([float(train.iloc[max(0, i-3):i].mean()) if i > 0 else baseline
                          for i in range(len(test))])
    if len(test_pred):
        # Reproducible expanding-window naive rolling average.
        hist = list(train.values)
        test_pred = []
        for actual in test.values:
            test_pred.append(float(np.mean(hist[-3:])))
            hist.append(float(actual))
        test_pred = np.array(test_pred)
    actual = test.values.astype(float)
    mae, rmse, r2, wape = safe_metrics(actual, test_pred)
    full = list(series.values.astype(float))
    future = []
    for _ in range(horizon):
        pred = max(0.0, float(np.mean(full[-3:])))
        future.append(pred)
        full.append(pred)
    last_date = series.index[-1]
    future_index = pd.date_range(start=last_date, periods=horizon + 1, freq=freq)[1:]
    residual = float(mae) if len(actual) else float(np.std(series.values))
    return {
        "historical_dates": [x.strftime("%Y-%m-%d") for x in series.index],
        "historical_actuals": [round(float(x), 3) for x in series.values],
        "test_dates": [x.strftime("%Y-%m-%d") for x in test.index],
        "test_actuals": [round(float(x), 3) for x in actual],
        "test_preds": [round(float(x), 3) for x in test_pred],
        "future_dates": [x.strftime("%Y-%m-%d") for x in future_index],
        "future_preds": [round(float(x), 3) for x in future],
        "mae": round(mae, 4), "rmse": round(rmse, 4), "r2": round(r2, 4),
        "mape": round(wape, 2), "wape": round(wape, 2),
        "training_period": f"{train.index.min().date()} to {train.index.max().date()}",
        "testing_period": f"{test.index.min().date()} to {test.index.max().date()}" if len(test) else "No holdout period",
        "future_lower_80": [round(max(0.0, x - 1.28 * residual), 3) for x in future],
        "future_upper_80": [round(x + 1.28 * residual, 3) for x in future],
        "model_name": "3-period rolling-average baseline",
    }


@app.post("/api/insights/generate")
def generate_insights(req: DatasetRequest):
    df = analysis_df(req.dataset_id)
    if df.empty:
        return {"insights": []}
    insights = []
    revenue = float(df["Revenue"].sum())
    top_products = df.groupby("Description")["Revenue"].sum().sort_values(ascending=False)
    if len(top_products):
        name = str(top_products.index[0])
        share = float(top_products.iloc[0] / revenue * 100) if revenue else 0
        insights.append({
            "type": "Product performance",
            "pattern": f"{name} is the top product by revenue in the selected dataset.",
            "metrics": {"revenue": round(float(top_products.iloc[0]), 2), "revenue_share_percent": round(share, 2)},
            "raw_data": {"product": name, "revenue": round(float(top_products.iloc[0]), 2)},
            "importance": "High" if share >= 20 else "Medium",
        })
    country_sales = df.groupby("Country")["Revenue"].sum().sort_values(ascending=False)
    if len(country_sales):
        name = str(country_sales.index[0])
        insights.append({
            "type": "Geographic performance",
            "pattern": f"{name} contributes the most revenue among countries in this dataset.",
            "metrics": {"revenue": round(float(country_sales.iloc[0]), 2)},
            "raw_data": {"country": name, "revenue": round(float(country_sales.iloc[0]), 2)},
            "importance": "Medium",
        })
    monthly = df.set_index("InvoiceDate").resample("MS")["Revenue"].sum()
    if len(monthly) >= 2:
        first, last = float(monthly.iloc[0]), float(monthly.iloc[-1])
        change = ((last - first) / first * 100) if first else 0.0
        insights.append({
            "type": "Temporal trend",
            "pattern": f"Revenue changed by {change:.1f}% between the first and last observed months.",
            "metrics": {"first_month_revenue": round(first, 2), "last_month_revenue": round(last, 2), "change_percent": round(change, 2)},
            "raw_data": {"first_month": monthly.index[0].strftime("%Y-%m"), "last_month": monthly.index[-1].strftime("%Y-%m")},
            "importance": "High" if abs(change) >= 25 else "Low",
        })
    return {"insights": insights}


@app.post("/api/llm/explain")
def explain_rule(req: ExplainRequest):
    antecedent = " + ".join(req.antecedent)
    consequent = " + ".join(req.consequent)
    return {
        "explanation": (
            f"Transactions containing {antecedent} also contain {consequent} "
            f"in {req.confidence * 100:.1f}% of cases. The rule has {req.support * 100:.1f}% support "
            f"across all transactions and a lift of {req.lift:.2f}. "
            + ("This is a positive association because lift is greater than 1."
               if req.lift > 1 else
               "This association is no stronger than the baseline rate (lift is at or below 1).")
        ),
        "evidence": {"support": req.support, "confidence": req.confidence, "lift": req.lift},
        "validated": True,
    }
