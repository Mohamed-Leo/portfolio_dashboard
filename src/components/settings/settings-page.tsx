import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { MonitorIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeToggle } from '@/components/global/mode-toggle';
import { contactInfoQueryOptions } from '@/queries/settings';
import { sessionQueryOptions } from '@/queries/session';
import { errorMessage } from '@/lib/api';
import type { ContactInfo } from '@/lib/validations/contactSchema';
import { ContactInfoForm } from './contact-info-form';

export function SettingsPage() {
  const query = useQuery(contactInfoQueryOptions());
  const session = useQuery(sessionQueryOptions());
  const { theme } = useTheme();
  const [initial, setInitial] = useState<{ info: ContactInfo | null }>();
  if (!initial && query.isSuccess && !query.isFetching)
    setInitial({ info: query.data });
  const themeLabel =
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  return (
    <section className="min-w-0 space-y-6" aria-labelledby="settings-heading">
      <header className="space-y-2">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          MAKE YOUR WORKSPACE YOURS
        </p>
        <h1
          id="settings-heading"
          className="text-balance text-3xl font-semibold"
        >
          Settings
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Your public contact details, appearance, and account information.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-balance">
              <UserRoundIcon
                className="size-4 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
              Account
            </CardTitle>
            <CardDescription>Your current dashboard session.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Login email</dt>
                <dd className="mt-1 break-all font-medium">
                  {session.data?.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="mt-1 font-medium">
                  {session.data?.role === 'admin' ? 'Administrator' : '—'}
                </dd>
              </div>
            </dl>
            <p className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
              Account credentials are managed separately from public contact
              details.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-balance">
              <MonitorIcon
                className="size-4 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose the theme that works for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">{themeLabel} theme</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  System follows your device automatically.
                </p>
              </div>
              <ModeToggle />
            </div>
            <p className="mt-4 text-pretty text-xs text-muted-foreground">
              Your preference is saved in this browser. The default is your
              system theme.
            </p>
          </CardContent>
        </Card>
      </div>
      {query.isSuccess && query.data === null && (
        <p role="status" className="rounded-lg border bg-muted/20 p-4 text-sm">
          Your public contact information has not been configured. Complete all
          fields below to publish it.
        </p>
      )}
      {initial ? (
        <ContactInfoForm info={initial.info} />
      ) : query.isError ? (
        <Card>
          <CardContent className="space-y-4 py-6" role="alert">
            <p className="text-sm text-muted-foreground">
              {errorMessage(query.error)}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent
            className="space-y-5 py-6"
            role="status"
            aria-label="Loading contact settings"
          >
            <Skeleton className="h-8 w-52" />
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
