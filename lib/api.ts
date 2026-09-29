import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'https://aiimsdelhi.ritanyasanstha.in/api';

const TOKEN_KEY = 'jwt_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string) {
    return request<T>('GET', path);
  },
  post<T>(path: string, body: object) {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body: object) {
    return request<T>('PATCH', path, body);
  },
};
