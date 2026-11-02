/**
 * tests/helpers/api.ts
 * Centralized API helper for Mobilim.az E2E & Integration tests
 */

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
}

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5500';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { token?: string; csrfToken?: string } = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.csrfToken) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((val, key) => {
    responseHeaders[key.toLowerCase()] = val;
  });

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: responseHeaders,
  };
}

export async function checkBackendHealth(): Promise<{ status: string; uptime: number }> {
  const res = await apiRequest<{ status: string; uptime: number }>('/api/health');
  if (!res.ok) {
    throw new Error(`Backend health check failed with HTTP ${res.status}`);
  }
  return res.data;
}

export async function checkBackendDetailedHealth(): Promise<{
  redis: string;
  rateLimiterStore: string;
  workers: number;
  uptime: number;
}> {
  const res = await apiRequest('/api/health-detailed');
  if (!res.ok) {
    throw new Error(`Detailed health check failed with HTTP ${res.status}`);
  }
  return res.data;
}
