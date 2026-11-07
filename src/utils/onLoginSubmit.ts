import type { LoginSchema } from '@/lib/validations/loginSchema';

export function onLoginSubmit(values: LoginSchema) {
  if (import.meta.env.DEV) {
    console.info('Login form submitted', { email: values.email, password: '[redacted]' });
  }
}
