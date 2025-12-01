import type { AuthResponse, ProfileType, Profile } from '../../shared/types';

const jsonHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    } catch {
      const text = await res.text().catch(() => 'Login failed');
      throw new Error(text || 'Login failed');
    }
  }
  return res.json();
}

export async function register(email: string, password: string, profile_type: ProfileType): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password, profile_type }),
  });
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    } catch {
      const text = await res.text().catch(() => 'Registration failed');
      throw new Error(text || 'Registration failed');
    }
  }
  return res.json();
}

export async function getProfile(token: string): Promise<Profile> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    headers: jsonHeaders(token),
  });
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || 'Unauthorized');
    } catch {
      const text = await res.text().catch(() => 'Unauthorized');
      throw new Error(text || 'Unauthorized');
    }
  }
  return res.json();
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}
