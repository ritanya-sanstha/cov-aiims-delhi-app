import { api, saveToken, removeToken } from './api';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  batchYear?: number;
  specialty?: string;
  memberId?: number;
  profilePhoto?: string;
}

interface LoginResponse {
  token: string;
  user: SessionUser;
}

export async function login(identifier: string, password: string): Promise<SessionUser> {
  const { token, user } = await api.post<LoginResponse>('/auth/login', {
    identifier,
    password,
  });
  await saveToken(token);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {});
  } catch {
    // best-effort server-side logout
  }
  await removeToken();
}

export async function getMe(): Promise<SessionUser> {
  return api.get<SessionUser>('/auth/me');
}

export async function sendOtp(email: string): Promise<void> {
  await api.post('/auth/send-otp', { email });
}

export async function verifyOtp(email: string, otp: string): Promise<SessionUser> {
  const { token, user } = await api.post<LoginResponse>('/auth/verify-otp', { email, otp });
  await saveToken(token);
  return user;
}
