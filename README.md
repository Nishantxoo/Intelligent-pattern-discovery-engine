# Intelligent Pattern Discovery Engine

A local retail analytics web application for exploring transaction data, product co-occurrence patterns, customer segments, temporal trends, and baseline forecasts.

## Features

- Upload CSV or Excel transaction data, or load a clearly labelled synthetic demo dataset.
- Clean and summarize transaction records before analysis.
- Discover directional product-pair association rules using support, confidence, and lift.
- Explore spend-based customer segments and product preferences.
- Review temporal trends and simple demand forecasts.
- Generate plain-language explanations from association-rule metrics.

## Technology

- Frontend: React, TypeScript, Vite, and Recharts
- API: FastAPI, pandas, and NumPy
- Data stays in the running API process's memory; restarting the API clears loaded data.

## Run locally on Windows

You need Node.js with npm and Python 3.10 or newer.

### 1. Start the API

From the project root in PowerShell:

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The API health check is at `http://127.0.0.1:8000/health`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

### 2. Start the frontend

Open a second PowerShell window in the project root:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite (usually `http://localhost:5173`). Keep both processes running while using the app.

## Dataset format

The API accepts CSV, XLSX, XLSM, and XLS files. Data should include transaction/order ID, product, quantity, unit price, and date columns. Common retail column names are recognized automatically. The app includes synthetic demo data if you do not have a dataset ready.

Do not commit private, licensed, or customer-level datasets. The repository intentionally does not include the local retail spreadsheet.

## Method notes and limitations

- Product rules are directional single-product-to-single-product associations calculated from products that co-occur in a transaction. Results are ranked by lift, confidence, and support.
- Forecasts use a transparent three-period rolling-average baseline; they are not produced by XGBoost or another trained forecasting model.
- Customer segments are based on spend. The input schema does not provide age or other demographic attributes.
- Rule explanations are generated from the calculated support, confidence, and lift values with a deterministic text template; they do not call a language model.
- Uploaded datasets are held in memory and are cleared when the API process restarts.
- The backend is configured for local development. It has no authentication or production deployment configuration.

## Project layout

```text
backend/     FastAPI application and Python dependencies
src/         React application, pages, components, and API client
public/      Static frontend assets
```
