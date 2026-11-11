# Intelligent Pattern Discovery Engine — API backend

## Windows PowerShell setup

Open a terminal in the project root (the folder containing `package.json`):

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Check that the API is responding at `http://127.0.0.1:8000/health` and view endpoints at `http://127.0.0.1:8000/docs`.

In a second terminal, from the project root:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. The sidebar loads a synthetic sample dataset on first entry; use **Upload CSV / Excel** to load your own `.csv`, `.xlsx`, `.xlsm`, or `.xls` file.

## Expected columns

The uploaded data must contain transaction/order ID, product, quantity, unit price, and date columns. Common names such as `InvoiceNo`, `Order ID`, `Product`, `Description`, `Qty`, `UnitPrice`, `Price`, `InvoiceDate`, and `Order Date` are recognized. The API returns a helpful error if required columns cannot be detected.

Datasets are held in server memory for the duration of the API process. Restarting the backend clears uploaded datasets, so upload the file again after a restart.

The forecasting endpoint uses a transparent rolling-average baseline; it does not claim to use XGBoost.
