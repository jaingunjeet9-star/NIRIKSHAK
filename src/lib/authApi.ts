import { requestJson } from './api';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  userId: string;
  designation: string;
  department: string;
  organization: string;
  region: string;
  role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'INSPECTOR' | 'REVIEWER';
  isDemo: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getAuthSession() {
  return requestJson<{ authenticated: boolean; user?: AuthUser }>('/api/auth/session');
}

export function loginAccount(identifier: string, password: string, rememberMe: boolean) {
  return requestJson<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, rememberMe }),
  });
}

export function registerAccount(payload: Record<string, string>) {
  return requestJson<{ user: AuthUser; message: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function activateDemo(rememberMe = false) {
  return requestJson<{ user: AuthUser; message: string }>('/api/auth/demo', {
    method: 'POST',
    body: JSON.stringify({ rememberMe }),
  });
}

export function logoutAccount() {
  return requestJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function requestPasswordReset(email: string) {
  return requestJson<{ requestId: string; message: string; developmentCode?: string }>('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyPasswordReset(requestId: string, code: string) {
  return requestJson<{ verified: boolean }>('/api/auth/password-reset/verify', {
    method: 'POST',
    body: JSON.stringify({ requestId, code }),
  });
}

export function completePasswordReset(requestId: string, code: string, password: string, confirmPassword: string) {
  return requestJson<{ message: string }>('/api/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify({ requestId, code, password, confirmPassword }),
  });
}
