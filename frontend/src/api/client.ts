import { API_CONFIG } from './config';
import type { ApiError, ErrorResponse } from './types';

// Generic fetch utility that handles the base URL and common configurations
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data: unknown = null;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (error) {
          if (response.ok) {
            data = null;
          } else {
            throw error;
          }
        }
      } else {
        const text = await response.text();
        data = text.length ? text : null;
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const message =
          typeof data === 'object' && data !== null && 'message' in data
            ? String((data as Record<string, unknown>).message)
            : 'An error occurred';

        const error = new Error(message) as ApiError;
        error.status = response.status;
        if (typeof data === 'object' && data !== null) {
          error.response = data as ErrorResponse;
        }
        throw error;
      }

      return data as T;
    } catch (error) {
      // Re-throw ApiError as is
      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      
      // Handle network errors or other fetch errors
      const apiError = new Error('Network error or server unavailable') as ApiError;
      apiError.status = 0;
      throw apiError;
    }
  }

  // GET request
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    });
  }
}

// Default API client instance
export const apiClient = new ApiClient();
