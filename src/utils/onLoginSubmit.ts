import { toast } from 'sonner';
import type { QueryClient } from '@tanstack/react-query';
import { login } from '@/lib/auth';
import { resetSessionCache } from '@/queries/session';
import { errorMessage } from '@/lib/api';
import type { LoginSchema } from '@/lib/validations/loginSchema';

export async function onLoginSubmit(values: LoginSchema, queryClient: QueryClient) {
  try {
    const user = await login(values);
    await resetSessionCache(queryClient, user);
    toast.success('Signed in successfully.');
    return user;
  } catch (error) {
    toast.error(errorMessage(error));
    throw error;
  }
}
