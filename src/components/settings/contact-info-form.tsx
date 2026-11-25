import { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useContactInfoForm } from '@/hooks/useContactInfoForm';
import type { ContactInfo } from '@/lib/validations/contactSchema';

const fields: {
  name: keyof ContactInfo;
  label: string;
  hint: string;
  type: 'text' | 'email' | 'tel' | 'url';
  maxLength: number;
  placeholder: string;
}[] = [
  {
    name: 'email',
    label: 'Public email',
    hint: 'Shown to visitors. This does not change your login email.',
    type: 'email',
    maxLength: 254,
    placeholder: 'hello@example.com',
  },
  {
    name: 'phone',
    label: 'Phone number',
    hint: 'International format with country code, without spaces.',
    type: 'tel',
    maxLength: 16,
    placeholder: '+201001234567',
  },
  {
    name: 'phoneLabel',
    label: 'Phone display label',
    hint: 'The readable number shown on your portfolio.',
    type: 'text',
    maxLength: 40,
    placeholder: '+20 100 123 4567',
  },
  {
    name: 'location',
    label: 'Location',
    hint: 'Your public city and country.',
    type: 'text',
    maxLength: 120,
    placeholder: 'Cairo, Egypt',
  },
  {
    name: 'linkedin',
    label: 'LinkedIn URL',
    hint: 'An HTTPS link on linkedin.com.',
    type: 'url',
    maxLength: 2048,
    placeholder: 'https://www.linkedin.com/in/your-profile',
  },
  {
    name: 'github',
    label: 'GitHub URL',
    hint: 'An HTTPS link on github.com.',
    type: 'url',
    maxLength: 2048,
    placeholder: 'https://github.com/your-username',
  },
];

export function ContactInfoForm({ info }: { info: ContactInfo | null }) {
  const { form, submit, pending } = useContactInfoForm(info);
  const [resetOpen, setResetOpen] = useState(false);
  const blocker = useBlocker({
    shouldBlockFn: () => form.formState.isDirty || pending,
    enableBeforeUnload: form.formState.isDirty || pending,
    withResolver: !pending,
  });
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-balance text-lg">
            Public contact information
          </CardTitle>
          <CardDescription className="text-pretty">
            Manage how visitors can reach you. All six fields are published on
            your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-6">
            <fieldset disabled={pending} className="grid gap-5 md:grid-cols-2">
              {fields.map(({ name, label, hint, ...input }) => {
                const error = form.formState.errors[name];
                return (
                  <Field
                    key={name}
                    className="gap-1.5"
                    data-invalid={Boolean(error)}
                  >
                    <FieldLabel htmlFor={'contact-info-' + name}>
                      {label}
                    </FieldLabel>
                    <Input
                      {...form.register(name)}
                      {...input}
                      id={'contact-info-' + name}
                      aria-invalid={Boolean(error)}
                      aria-describedby={
                        'contact-info-' +
                        name +
                        '-hint' +
                        (error ? ' contact-info-' + name + '-error' : '')
                      }
                    />
                    <p
                      id={'contact-info-' + name + '-hint'}
                      className="text-pretty text-xs text-muted-foreground"
                    >
                      {hint}
                    </p>
                    {error && (
                      <FieldError id={'contact-info-' + name + '-error'}>
                        {error.message}
                      </FieldError>
                    )}
                  </Field>
                );
              })}
            </fieldset>
            {form.formState.errors.root?.server && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {form.formState.errors.root.server.message}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <p className="text-pretty text-xs text-muted-foreground">
                {form.formState.isDirty
                  ? 'You have unsaved changes.'
                  : 'No unsaved changes.'}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !form.formState.isDirty}
                  onClick={() => setResetOpen(true)}
                >
                  Reset changes
                </Button>
                <Button
                  type="submit"
                  disabled={pending || !form.formState.isDirty}
                >
                  <SaveIcon aria-hidden="true" />
                  {pending ? 'Saving…' : 'contact information'}Save
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={resetOpen || blocker?.status === 'blocked'}
        onOpenChange={(open) => {
          setResetOpen(open);
          if (!open && blocker?.status === 'blocked') blocker.reset();
        }}
        title="Discard your changes?"
        description="Your unsaved contact information changes will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          if (blocker?.status === 'blocked') blocker.proceed();
          else {
            form.reset();
            setResetOpen(false);
          }
        }}
      />
    </>
  );
}
