import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { errorMessage } from '@/lib/api';
import { loginSchema, type LoginSchema } from '@/lib/validations/loginSchema';
import { onLoginSubmit } from '@/utils/onLoginSubmit';

export function useLoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onLoginSubmit(values, queryClient);
      await navigate({ to: '/dashboard', replace: true });
    } catch (error) {
      setError('root.server', { message: errorMessage(error) });
    }
  });

  return { register, errors, isSubmitting, submit };
}
