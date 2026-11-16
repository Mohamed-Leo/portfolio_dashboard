import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.').max(254)).transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Enter your password.').max(128, 'Password must be at most 128 characters.'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
