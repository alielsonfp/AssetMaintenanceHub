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

// Tipos de Manutenção
export interface MaintenanceType {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMaintenanceTypeData {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface UpdateMaintenanceTypeData {
  name?: string;
  description?: string;
  is_default?: boolean;
}

// Registros de Manutenção
export interface MaintenanceRecord {
  id?: number;
  asset_id: number;
  maintenance_type_id?: number;
  date_performed: string;
  notes?: string;
  cost?: number;
  created_at?: string;
  updated_at?: string;
  // Campos extras para joins
  asset_name?: string;
  maintenance_type_name?: string;
}

export interface CreateMaintenanceRecordData {
  asset_id: number;
  maintenance_type_id?: number;
  date_performed: string;
  notes?: string;
  cost?: number;
}

export interface UpdateMaintenanceRecordData {
  maintenance_type_id?: number | null;
  date_performed?: string;
  notes?: string | null;
  cost?: number | null;
}

// Agendamentos de Manutenção
export interface MaintenanceSchedule {
  id?: number;
  asset_id: number;
  maintenance_type_id?: number;
  based_on_record_id?: number;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'overdue';
  frequency_type: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value: number;
  created_at?: string;
  updated_at?: string;
  // Campos extras para joins
  asset_name?: string;
  maintenance_type_name?: string;
  last_maintenance_date?: string;
}

export interface CreateMaintenanceScheduleData {
  asset_id: number;
  maintenance_type_id?: number;
  based_on_record_id?: number;
  frequency_type: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value: number;
  scheduled_date?: string;
}

export interface UpdateMaintenanceScheduleData {
  scheduled_date?: string;
  status?: 'pending' | 'completed' | 'overdue';
  frequency_type?: 'days' | 'weeks' | 'months' | 'kilometers' | 'hours';
  frequency_value?: number;
}

// Respostas da API
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

export interface MaintenanceTypesResponse {
  maintenanceTypes: MaintenanceType[];
  total: number;
}

export interface MaintenanceTypeResponse {
  maintenanceType: MaintenanceType;
}

export interface MaintenanceRecordsResponse {
  maintenanceRecords: MaintenanceRecord[];
  total: number;
}

export interface MaintenanceRecordResponse {
  maintenanceRecord: MaintenanceRecord;
}

export interface MaintenanceSchedulesResponse {
  schedules: MaintenanceSchedule[];
  total: number;
}

export interface MaintenanceScheduleResponse {
  schedule: MaintenanceSchedule;
}