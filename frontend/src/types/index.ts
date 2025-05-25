// frontend/src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  name: string;
  description?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateAssetData {
  name?: string;
  description?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface AssetStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AssetsResponse {
  assets: Asset[];
  total: number;
}

export interface AssetResponse {
  asset: Asset;
}

export interface StatsResponse {
  stats: AssetStats;
}