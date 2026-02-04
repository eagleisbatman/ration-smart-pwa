// API Response Types based on FastAPI backend

export interface User {
  id: number;
  email: string;
  country_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  pin: string;
  country_code: string;
}

export interface UserLogin {
  email: string;
  pin: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

export interface Cow {
  id: number;
  user_id: number;
  name: string;
  breed: string;
  weight_kg: number;
  milk_yield_liters: number;
  lactation_stage: 'early' | 'mid' | 'late' | 'dry';
  pregnancy_status: 'not_pregnant' | 'pregnant' | 'unknown';
  age_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CowCreate {
  name: string;
  breed: string;
  weight_kg: number;
  milk_yield_liters: number;
  lactation_stage: 'early' | 'mid' | 'late' | 'dry';
  pregnancy_status?: 'not_pregnant' | 'pregnant' | 'unknown';
  age_months: number;
}

export interface CowUpdate extends Partial<CowCreate> {
  is_active?: boolean;
}

export interface Feed {
  id: number;
  name: string;
  category: 'roughage' | 'concentrate' | 'supplement' | 'mineral';
  dry_matter_percent: number;
  crude_protein_percent: number;
  metabolizable_energy_mj: number;
  calcium_percent: number;
  phosphorus_percent: number;
  price_per_kg: number;
  is_custom: boolean;
  user_id?: number;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedCreate {
  name: string;
  category: 'roughage' | 'concentrate' | 'supplement' | 'mineral';
  dry_matter_percent: number;
  crude_protein_percent: number;
  metabolizable_energy_mj: number;
  calcium_percent: number;
  phosphorus_percent: number;
  price_per_kg: number;
}

export interface FeedUpdate extends Partial<FeedCreate> {}

export interface DietOptimizationRequest {
  cow_id: number;
  available_feed_ids: number[];
  optimization_goal: 'cost' | 'balanced' | 'production';
  max_budget_per_day?: number;
}

export interface DietIngredient {
  feed_id: number;
  feed_name: string;
  quantity_kg: number;
  cost: number;
}

export interface DietResult {
  id: number;
  cow_id: number;
  user_id: number;
  ingredients: DietIngredient[];
  total_cost_per_day: number;
  total_dry_matter_kg: number;
  total_crude_protein_g: number;
  total_metabolizable_energy_mj: number;
  meets_requirements: boolean;
  optimization_goal: 'cost' | 'balanced' | 'production';
  notes?: string;
  created_at: string;
}

export interface MilkLog {
  id: number;
  cow_id: number;
  user_id: number;
  date: string;
  morning_liters: number;
  evening_liters: number;
  total_liters: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MilkLogCreate {
  cow_id: number;
  date: string;
  morning_liters: number;
  evening_liters: number;
  notes?: string;
}

export interface MilkLogUpdate extends Partial<MilkLogCreate> {}

export interface MilkSummary {
  cow_id: number;
  cow_name: string;
  period: 'day' | 'week' | 'month';
  start_date: string;
  end_date: string;
  total_liters: number;
  average_per_day: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Report {
  id: number;
  user_id: number;
  type: 'diet' | 'milk_production' | 'cost_analysis' | 'cow_performance';
  title: string;
  parameters: Record<string, unknown>;
  generated_at: string;
  file_url?: string;
}

export interface ReportRequest {
  type: 'diet' | 'milk_production' | 'cost_analysis' | 'cow_performance';
  start_date?: string;
  end_date?: string;
  cow_ids?: number[];
}

// API Error Response
export interface ApiError {
  detail: string;
  status_code?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
