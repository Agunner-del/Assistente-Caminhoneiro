export type ProfileType = 'TAC' | 'CLT' | 'COMISSIONADO';

export interface Profile {
  id: string;
  email: string;
  profile_type: ProfileType;
  settings: ProfileSettings;
  created_at: string;
  updated_at: string;
}

export interface ProfileSettings {
  fuel_efficiency_goal?: number;
  overtime_rate?: number;
  theme?: 'dark';
}

export type TransactionCategory = 
  | 'frete' 
  | 'adiantamento' 
  | 'saldo' 
  | 'diesel' 
  | 'arla' 
  | 'pedagio' 
  | 'chapa' 
  | 'diaria' 
  | 'quebra_caixa' 
  | 'manutencao';

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'paid';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  proof_url?: string;
  transaction_date: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  user_id: string;
  vehicle_id?: string;
  odometer: number;
  liters: number;
  total_price: number;
  is_full_tank: boolean;
  arla_liters: number;
  created_at: string;
}

export interface VisualInventoryItem {
  id: string;
  user_id: string;
  photo_url: string;
  ai_tags: string[];
  description?: string;
  created_at: string;
  item_name?: string;
  quantity?: number;
  category?: string;
}

export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  profit: number;
  balance_receivable: number;
  daily_allowance_available: number;
  daily_allowance_used: number;
  commission_base: number;
  fuel_average?: number;
}

export interface AIProcessingRequest {
  input_type: 'text' | 'image';
  content: string;
  context?: string;
}

// Resposta estruturada do Gemini 2.5 Flash Lite
export interface AIProcessingResponse {
  intent: 'fuel' | 'transaction' | 'inventory' | 'unknown';
  confidence: number;
  data: {
    category?: TransactionCategory;
    amount?: number;
    type?: TransactionType;
    description?: string;
    odometer?: number;
    liters?: number;
    total_price?: number;
    is_full_tank?: boolean;
    fuel_type?: 'diesel' | 'arla32';
    items?: string[];
    missing_suggestion?: string[];
    station_name?: string;
  };
  suggested_action: 'create_fuel_record' | 'create_transaction' | 'update_inventory' | 'manual_input';
  model_version: 'gemini-2.5-flash-lite';
}

// Caso especial para quando a IA não conseguir classificar
export interface AIUnknownResponse extends AIProcessingResponse {
  intent: 'unknown';
  data: {};
  suggested_action: 'manual_input';
  fallback_reason: string;
}

export interface AuthResponse {
  user: Profile;
  token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  profile_type: ProfileType;
}