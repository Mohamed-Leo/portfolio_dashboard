import { z } from 'zod';
import { ApiError, apiRequest } from './api';
import type { LoginSchema } from './validations/loginSchema';

const userSchema = z.object({
  id: z.literal('owner'),
  email: z.email(),
  role: z.literal('admin'),
});
const userResponse = z.object({ user: userSchema });
const csrfResponse = z.object({ csrfToken: z.string().regex(/^[a-f0-9]{64}$/) });
const loginResponse = userResponse.extend({ csrfToken: csrfResponse.shape.csrfToken });

export type AuthUser = z.infer<typeof userSchema>;

async function csrfToken() {
  return csrfResponse.parse(await apiRequest('/auth/csrf')).csrfToken;
}

export async function login(values: LoginSchema): Promise<AuthUser> {
  const token = await csrfToken();
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': token },
    body: JSON.stringify(values),
  });
  return loginResponse.parse(result).user;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    return userResponse.parse(await apiRequest('/auth/me', { signal })).user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  try {
    // Read the current token after a refresh or a session rotation in another tab.
    const token = await csrfToken();
    await apiRequest('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': token } });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
}

