import axios from 'axios';
import type {
  AuthResponse,
  AssetsResponse,
  AssetResponse,
  StatsResponse,
  CreateAssetData,
  UpdateAssetData
} from '../types';

// Configurar URL base da API
// frontend/src/services/api.ts
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

export default api;