import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLoginForm } from '@/hooks/useLoginForm';

export function LoginForm() {
  const { register, errors, isSubmitting, submit } = useLoginForm();

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your dashboard</h1>
          <p className="text-sm text-muted-foreground">Enter your email and password to sign in.</p>
        </div>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="username"
            placeholder="name@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            required
          />
          {errors.email && <FieldError id="email-error">{errors.email.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            required
          />
          {errors.password && <FieldError id="password-error">{errors.password.message}</FieldError>}
        </Field>
        {errors.root?.server && <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </FieldGroup>
    </form>
  );
}
