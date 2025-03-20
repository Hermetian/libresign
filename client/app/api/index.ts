import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiService {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: true,
    });

    // Add request interceptor to include auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.request(config);
      return response.data;
    } catch (error) {
      // Handle errors, possibly transform them
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        
        // Handle authentication errors
        if (statusCode === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        throw {
          status: statusCode,
          message: error.response.data.message || 'An error occurred',
          errors: error.response.data.errors,
        };
      }
      
      throw error;
    }
  }

  // HTTP methods
  async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, params });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url });
  }

  // File upload with progress
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (percentage: number) => void,
    additionalData?: Record<string, any>,
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1),
            );
            onProgress(percentage);
          }
        : undefined,
    });
  }
}

// Create and export API instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const api = new ApiService({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
});

// Type definitions for API responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Authentication API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/register', { name, email, password }),
  getUser: () => api.get<{ user: any }>('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
};

// Documents API
export const documentsApi = {
  getAll: () => api.get<any[]>('/documents'),
  getById: (id: string) => api.get<any>(`/documents/${id}`),
  create: (file: File, data: { title: string; description?: string }) =>
    api.uploadFile<any>('/documents', file, undefined, data),
  delete: (id: string) => api.delete<void>(`/documents/${id}`),
  getAuditTrail: (id: string) => api.get<any[]>(`/documents/${id}/audit`),
};

// Signature Requests API
export const signatureRequestsApi = {
  create: (data: {
    documentId: string;
    signerEmail: string;
    message?: string;
  }) => api.post<any>('/signature-requests', data),
  getAll: (type?: 'sent' | 'received') =>
    api.get<any[]>('/signature-requests', { type }),
  getById: (id: string) => api.get<any>(`/signature-requests/${id}`),
  getSigningSession: (id: string, token: string) =>
    api.get<any>(`/signature-requests/sign/${id}`, { token }),
  sign: (
    id: string,
    data: {
      signatureData: string;
      signatureType: string;
      consentToElectronicSignature: boolean;
    },
    token: string,
  ) => api.post<any>(`/signature-requests/sign/${id}?token=${token}`, data),
};

export default api;