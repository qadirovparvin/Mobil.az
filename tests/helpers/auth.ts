/**
 * tests/helpers/auth.ts
 * Auth helpers for Mobilim.az testing (CSRF token, login, test credentials)
 */

import { apiRequest, BACKEND_URL } from './api';

export interface AuthSession {
  token: string;
  csrfToken: string;
  cookies: string;
  user: any;
}

/**
 * Fetch a valid CSRF token and its accompanying signed cookie
 */
export async function getCsrfSession(): Promise<{ csrfToken: string; cookies: string }> {
  const res = await apiRequest<{ csrfToken: string }>('/api/auth/csrf-token');
  const csrfToken = res.data?.csrfToken || '';
  const setCookie = res.headers['set-cookie'] || '';
  return { csrfToken, cookies: setCookie };
}

/**
 * Perform login using email/password and retrieve access token + CSRF
 */
export async function loginTestUser(
  email = process.env.E2E_EMAIL || 'test_user@mobilim.az',
  password = process.env.E2E_PASSWORD || 'TestPass123!@#'
): Promise<AuthSession | null> {
  const { csrfToken, cookies } = await getCsrfSession();

  const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    csrfToken,
    headers: {
      'Cookie': cookies,
      'Origin': 'http://localhost:5500',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok || !res.data?.token) {
    return null;
  }

  const combinedCookies = [cookies, res.headers['set-cookie']].filter(Boolean).join('; ');

  return {
    token: res.data.token,
    csrfToken,
    cookies: combinedCookies,
    user: res.data.user,
  };
}

/**
 * Generate authenticated request headers given an AuthSession
 */
export function getAuthHeaders(session: AuthSession, origin = 'http://localhost:5500') {
  return {
    'Authorization': `Bearer ${session.token}`,
    'X-CSRF-Token': session.csrfToken,
    'Cookie': session.cookies,
    'Origin': origin,
    'Content-Type': 'application/json',
  };
}
