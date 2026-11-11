import { APIError } from '../types';

const rawBase = 
  (typeof window !== 'undefined' && (window as any).__API_URL__) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://127.0.0.1:8000';

const API_BASE_URL = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred while communicating with the server.';
    let errorDetails;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
      errorDetails = errorData;
    } catch {
      // response might not be JSON
    }
    
    const error: APIError = {
      message: errorMessage,
      status: response.status,
      details: errorDetails,
    };
    throw error;
  }
  return response.json();
}

export const apiClient = {
  get: async <T>(endpoint: string, params?: Record<string, string | number>): Promise<T> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      // Note: Do not set Content-Type header when sending FormData, the browser will set it with the correct boundary
      body: formData,
    });
    return handleResponse<T>(response);
  }
};
