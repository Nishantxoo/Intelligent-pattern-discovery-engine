import {
  DatasetResponse,
  PreprocessingResponse,
  MiningResponse,
  DemographicPreference,
  TemporalTrend,
  ForecastResponse,
  Insight,
  ExplainResponse,
  RuleItem
} from "./types";

const rawBase = 
  (typeof window !== 'undefined' && (window as any).__API_URL__) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://127.0.0.1:8000";

const API_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail ?? body?.message;
    return typeof detail === "string" ? detail : JSON.stringify(detail ?? body);
  } catch {
    return (await response.text().catch(() => "")) || `Request failed (${response.status})`;
  }
}

export const api = {
  async loadDemoDataset(): Promise<DatasetResponse> {
    const res = await fetch(`${API_URL}/dataset/demo`, { method: "POST" });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async uploadDataset(file: File): Promise<DatasetResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/dataset/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async runPreprocessing(datasetId: string, columnMapping?: Record<string, string>): Promise<PreprocessingResponse> {
    const res = await fetch(`${API_URL}/preprocessing/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, column_mapping: columnMapping }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async runMining(datasetId: string, params: any): Promise<MiningResponse> {
    const res = await fetch(`${API_URL}/mining/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, ...params }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async analyzeDemographics(datasetId: string): Promise<any> {
    const res = await fetch(`${API_URL}/demographics/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async analyzeTemporal(
    datasetId: string,
    options?: { target_category?: string; target_product?: string; metric?: string; granularity?: string }
  ): Promise<any> {
    const res = await fetch(`${API_URL}/temporal/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, ...options }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async runForecast(datasetId: string, targetProduct: string, horizon: number = 4): Promise<ForecastResponse> {
    const res = await fetch(`${API_URL}/forecast/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, target_product: targetProduct, horizon }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async generateInsights(datasetId: string): Promise<{ insights: Insight[] }> {
    const res = await fetch(`${API_URL}/insights/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  },

  async explainRule(rule: RuleItem): Promise<ExplainResponse> {
    const res = await fetch(`${API_URL}/llm/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
  }
};
