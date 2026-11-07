import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginSchema } from '@/lib/validations/loginSchema';
import { onLoginSubmit } from '@/utils/onLoginSubmit';

export function useLoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return { register, errors, isSubmitting, submit: handleSubmit(onLoginSubmit) };
}
