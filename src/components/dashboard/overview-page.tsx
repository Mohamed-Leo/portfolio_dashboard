import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api';
import { dashboardQueryOptions } from '@/queries/dashboard';
import { OverviewCards } from './overview-cards';
import { OverviewChart } from './overview-chart';
import {
  messageLabels,
  projectLabels,
  skillLabels,
} from '@/constants/layout-data';

function OverviewSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading portfolio overview"
    >
      <span className="sr-only">Loading portfolio overview…</span>
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-hidden="true"
      >
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mx-auto size-44 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardOverviewPage() {
  const query = useQuery(dashboardQueryOptions());
  const overview = query.data;

  return (
    <section
      className="space-y-6"
      aria-busy={query.isFetching}
      aria-labelledby="overview-heading"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            YOUR WORKSPACE AT A GLANCE
          </p>
          <h1
            id="overview-heading"
            className="text-balance text-3xl font-semibold"
          >
            Portfolio overview
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Your work, your toolkit, and the conversations coming in.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {query.dataUpdatedAt > 0 && (
            <p className="text-xs text-muted-foreground">
              Updated{' '}
              <time dateTime={new Date(query.dataUpdatedAt).toISOString()}>
                {new Date(query.dataUpdatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </p>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCwIcon className="size-4" aria-hidden="true" />
            {query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {query.isPending && <OverviewSkeleton />}
      {query.isError && !overview && (
        <Card>
          <CardContent
            className="flex min-h-72 flex-col items-center justify-center gap-4 text-center"
            role="alert"
          >
            <AlertCircleIcon
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="text-balance text-lg font-semibold">
              Couldn't load your overview
            </h2>
            <p className="max-w-md text-pretty text-sm text-muted-foreground">
              {errorMessage(query.error)}
            </p>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
      {overview && (
        <>
          {query.isError && (
            <p
              role="alert"
              className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-pretty text-sm"
            >
              Couldn't refresh the overview. Showing the last successful update.
              Use Refresh to try again.
            </p>
          )}
          <OverviewCards overview={overview} />
          <div className="space-y-4">
            <div>
              <h2 className="text-balance text-base font-semibold">
                A closer look
              </h2>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">
                How your portfolio and inbox are distributed.
              </p>
            </div>
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              <OverviewChart
                title="Project mix"
                description="Projects by category"
                unit="projects"
                {...overview.projects}
                labels={projectLabels}
                to="/dashboard/projects"
                action="View projects"
                empty="No projects yet. Your project mix will appear here."
              />
              <OverviewChart
                title="Skill groups"
                description="The shape of your toolkit"
                unit="skills"
                {...overview.skills}
                labels={skillLabels}
                to="/dashboard/skills"
                action="View skills"
                empty="No skills yet. Your skill groups will appear here."
              />
              <OverviewChart
                title="Message status"
                description="A snapshot of your inbox"
                unit="messages"
                {...overview.messages}
                labels={messageLabels}
                to="/dashboard/contacts"
                action="Open inbox"
                empty="No messages yet. New enquiries will appear here."
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
