// frontend/src/services/api.ts
import axios from 'axios';
import type {
  AuthResponse,
  AssetsResponse,
  AssetResponse,
  StatsResponse,
  CreateAssetData,
  UpdateAssetData,
  MaintenanceTypesResponse,
  MaintenanceTypeResponse,
  CreateMaintenanceTypeData,
  UpdateMaintenanceTypeData,
  MaintenanceRecordsResponse,
  MaintenanceRecordResponse,
  CreateMaintenanceRecordData,
  UpdateMaintenanceRecordData,
  MaintenanceSchedulesResponse,
  MaintenanceScheduleResponse,
  CreateMaintenanceScheduleData,
  UpdateMaintenanceScheduleData
} from '../types';

// Configurar URL base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async getProfile(): Promise<{ user: any }> {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Serviços de ativos
export const assetService = {
  async getAll(): Promise<AssetsResponse> {
    const response = await api.get('/assets');
    return response.data;
  },

  async getById(id: number): Promise<AssetResponse> {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  async create(assetData: CreateAssetData): Promise<AssetResponse> {
    const response = await api.post('/assets', assetData);
    return response.data;
  },

  async update(id: number, assetData: UpdateAssetData): Promise<AssetResponse> {
    const response = await api.put(`/assets/${id}`, assetData);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  async getStats(): Promise<StatsResponse> {
    const response = await api.get('/assets/stats');
    return response.data;
  }
};

// Serviços de tipos de manutenção
export const maintenanceTypeService = {
  async getAll(): Promise<MaintenanceTypesResponse> {
    const response = await api.get('/maintenance-types');
    return response.data;
  },

  async getById(id: number): Promise<MaintenanceTypeResponse> {
    const response = await api.get(`/maintenance-types/${id}`);
    return response.data;
  },

  async create(data: CreateMaintenanceTypeData): Promise<MaintenanceTypeResponse> {
    const response = await api.post('/maintenance-types', data);
    return response.data;
  },

  async update(id: number, data: UpdateMaintenanceTypeData): Promise<MaintenanceTypeResponse> {
    const response = await api.put(`/maintenance-types/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/maintenance-types/${id}`);
    return response.data;
  },

  async getStats(): Promise<{ stats: any }> {
    const response = await api.get('/maintenance-types/stats');
    return response.data;
  },

  async createDefaults(): Promise<MaintenanceTypesResponse> {
    const response = await api.post('/maintenance-types/create-defaults');
    return response.data;
  }
};

// Serviços de registros de manutenção
export const maintenanceRecordService = {
  async getAll(): Promise<MaintenanceRecordsResponse> {
    const response = await api.get('/maintenance-records');
    return response.data;
  },

  async getById(id: number): Promise<MaintenanceRecordResponse> {
    const response = await api.get(`/maintenance-records/${id}`);
    return response.data;
  },

  async getByAsset(assetId: number): Promise<MaintenanceRecordsResponse> {
    const response = await api.get(`/maintenance-records/asset/${assetId}`);
    return response.data;
  },

  async getByType(typeId: number): Promise<MaintenanceRecordsResponse> {
    const response = await api.get(`/maintenance-records/type/${typeId}`);
    return response.data;
  },

  async getRecent(limit: number = 10): Promise<MaintenanceRecordsResponse> {
    const response = await api.get(`/maintenance-records/recent?limit=${limit}`);
    return response.data;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<MaintenanceRecordsResponse> {
    const response = await api.get(`/maintenance-records/date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  async create(data: CreateMaintenanceRecordData): Promise<MaintenanceRecordResponse> {
    const response = await api.post('/maintenance-records', data);
    return response.data;
  },

  async update(id: number, data: UpdateMaintenanceRecordData): Promise<MaintenanceRecordResponse> {
    const response = await api.put(`/maintenance-records/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/maintenance-records/${id}`);
    return response.data;
  },

  async getStats(): Promise<{ stats: any }> {
    const response = await api.get('/maintenance-records/stats');
    return response.data;
  }
};

// Serviços de agendamentos de manutenção
export const maintenanceScheduleService = {
  async getAll(): Promise<MaintenanceSchedulesResponse> {
    const response = await api.get('/maintenance-schedules');
    return response.data;
  },

  async getById(id: number): Promise<MaintenanceScheduleResponse> {
    const response = await api.get(`/maintenance-schedules/${id}`);
    return response.data;
  },

  async getByAsset(assetId: number): Promise<MaintenanceSchedulesResponse> {
    const response = await api.get(`/maintenance-schedules/asset/${assetId}`);
    return response.data;
  },

  async getUpcoming(days: number = 7): Promise<MaintenanceSchedulesResponse> {
    const response = await api.get(`/maintenance-schedules/upcoming?days=${days}`);
    return response.data;
  },

  async getOverdue(): Promise<MaintenanceSchedulesResponse> {
    const response = await api.get('/maintenance-schedules/overdue');
    return response.data;
  },

  async create(data: CreateMaintenanceScheduleData): Promise<MaintenanceScheduleResponse> {
    const response = await api.post('/maintenance-schedules', data);
    return response.data;
  },

  async update(id: number, data: UpdateMaintenanceScheduleData): Promise<MaintenanceScheduleResponse> {
    const response = await api.put(`/maintenance-schedules/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/maintenance-schedules/${id}`);
    return response.data;
  },

  async markCompleted(id: number, recordId: number): Promise<MaintenanceScheduleResponse> {
    const response = await api.post(`/maintenance-schedules/${id}/complete`, { recordId });
    return response.data;
  },

  async getStats(): Promise<{ stats: any }> {
    const response = await api.get('/maintenance-schedules/stats');
    return response.data;
  }
};

export default api;