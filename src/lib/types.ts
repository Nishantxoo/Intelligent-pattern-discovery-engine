export interface DatasetResponse {
  dataset_id: string;
  row_count: number;
  columns: string[];
  suggested_mapping: Record<string, string>;
}

export interface PreprocessingRequest {
  dataset_id: string;
  column_mapping?: Record<string, string>;
}

export interface PreprocessingResponse {
  initial_rows: number;
  final_rows: number;
  duplicate_rows_removed: number;
  rows_removed_missing_critical: number;
  unique_transactions: number;
  unique_products: number;
  date_range?: string;
  status: string;
}

export interface MiningRequest {
  dataset_id: string;
  min_support?: number;
  min_confidence?: number;
  min_lift?: number;
  max_antecedent_size?: number;
  max_consequent_size?: number;
}

export interface RuleItem {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface MiningResponse {
  rule_count: number;
  rules: RuleItem[];
}

export interface TemporalAnalyzeRequest {
  dataset_id: string;
}

export interface ForecastRequest {
  dataset_id: string;
  target_product: string;
  horizon?: number;
  granularity?: string;
}

export interface ForecastResponse {
  historical_dates: string[];
  historical_actuals: number[];
  test_dates: string[];
  test_actuals: number[];
  test_preds: number[];
  future_dates: string[];
  future_preds: number[];
  mae: number;
  rmse: number;
  r2: number;
  mape?: number;
  training_period: string;
  testing_period: string;
  future_lower_80?: number[];
  future_upper_80?: number[];
  wape?: number;
  model_name?: string;
}

export interface InsightRequest {
  dataset_id: string;
}

export interface ExplainRequest {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface ExplainResponse {
  explanation?: string;
  evidence?: Record<string, any>;
  validated: boolean;
  error?: string;
}

// API Error Normalized Type
export interface APIError {
  message: string;
  status?: number;
  details?: any;
}

export interface DemographicPreference {
  age_group: string;
  category?: string;
  product_name?: string;
  purchase_count: number;
  total_age_purchases: number;
  probability: number;
}

export interface TemporalTrend {
  year_month?: string;
  date_only?: string;
  value: number;
}

export interface Insight {
  type: string;
  pattern: string;
  metrics: Record<string, any>;
  raw_data: any;
  importance: string;
}
