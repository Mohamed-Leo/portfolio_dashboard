import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  FolderKanbanIcon,
  GlobeIcon,
  LockKeyholeIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { projectLabels } from '@/constants/layout-data';
import { errorMessage } from '@/lib/api';
import {
  projectCategorySchema,
  type Project,
  type ProjectsSearch,
} from '@/lib/validations/projectSchema';
import { projectsQueryOptions } from '@/queries/projects';
import { useDeleteProject } from '@/hooks/useDeleteProject';
import { ProjectPanel, type ProjectPanelState } from './project-panel';
import { ProjectsTable } from './projects-table';

const emptyProjects: Project[] = [];

function ProjectsToolbar({
  filters,
  onChange,
  busy,
}: {
  filters: ProjectsSearch;
  onChange: (patch: Partial<ProjectsSearch>) => void;
  busy: boolean;
}) {
  const [search, setSearch] = useState(filters.q);
  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ q: search.trim(), page: 1 });
        }}
        className="flex min-w-0 flex-1 gap-2 sm:max-w-lg"
      >
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search projects"
            maxLength={120}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, role or technology…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" type="submit" disabled={busy}>
          Search
        </Button>
      </form>
      <div className="flex items-center gap-2">
        <Select
          value={filters.categoryId}
          onValueChange={(value) => {
            if (value)
              onChange({
                categoryId:
                  projectCategorySchema.options.find(
                    (category) => category === value
                  ) ?? 'all',
                page: 1,
              });
          }}
          disabled={busy}
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter project type"
          >
            <SelectValue>
              {filters.categoryId === 'all'
                ? 'All project types'
                : projectLabels[filters.categoryId]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All project types</SelectItem>
            {projectCategorySchema.options.map((value) => (
              <SelectItem key={value} value={value}>
                {projectLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filters.q || filters.categoryId !== 'all') && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset filters"
            onClick={() => onChange({ q: '', categoryId: 'all', page: 1 })}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProjectsPage({
  filters,
  onFiltersChange,
}: {
  filters: ProjectsSearch;
  onFiltersChange: (patch: Partial<ProjectsSearch>) => void;
}) {
  const query = useQuery(projectsQueryOptions(filters));
  const [panel, setPanel] = useState<ProjectPanelState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const onDeleted = useCallback(() => setDeleteTarget(null), []);
  const deletion = useDeleteProject(onDeleted);
  const { reset: resetDeletion } = deletion;
  const onAdd = useCallback(() => setPanel({ mode: 'create' }), []);
  const onView = useCallback(
    (id: string) => setPanel({ mode: 'view', id }),
    []
  );
  const onEdit = useCallback(
    (id: string) => setPanel({ mode: 'edit', id }),
    []
  );
  const onClose = useCallback(() => setPanel(null), []);
  const onDelete = useCallback(
    (project: Project) => {
      resetDeletion();
      setDeleteTarget(project);
    },
    [resetDeletion]
  );

  // A delete or an out-of-range bookmark may leave the current page empty.
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    const lastPage = Math.max(1, Math.ceil(query.data.total / filters.limit));
    if (filters.page > lastPage) onFiltersChange({ page: lastPage });
  }, [
    query.data,
    query.isPlaceholderData,
    filters.limit,
    filters.page,
    onFiltersChange,
  ]);

  const summary = query.data?.summary;
  const stats = [
    {
      label: 'Total projects',
      value: summary?.total,
      description: 'Across your entire portfolio',
      icon: FolderKanbanIcon,
    },
    {
      label: 'With live preview',
      value: summary?.live,
      description: 'Projects with a live URL',
      icon: GlobeIcon,
    },
    {
      label: 'Private repositories',
      value: summary?.privateRepositories,
      description: 'Code repositories marked private',
      icon: LockKeyholeIcon,
    },
  ];

  return (
    <section className="min-w-0 space-y-6" aria-labelledby="projects-heading">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            YOUR WORK, IN ONE PLACE
          </p>
          <h1
            id="projects-heading"
            className="text-balance text-3xl font-semibold"
          >
            Projects
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Manage the work that tells your story.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={query.isFetching || deletion.isPending}
            onClick={() => void query.refetch()}
          >
            <RefreshCwIcon className="size-4" aria-hidden="true" />
            {query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button onClick={onAdd} disabled={deletion.isPending}>
            <PlusIcon className="size-4" aria-hidden="true" />
            Add project
          </Button>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, description, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="gap-2 px-5">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {query.isPending ? (
                  <Skeleton className="h-9 w-14" />
                ) : (
                  (value?.toLocaleString('en-US') ?? '—')
                )}
              </CardTitle>
              <CardAction>
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-emerald-700 dark:text-emerald-400">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardAction>
              <p className="col-span-2 text-pretty text-xs text-muted-foreground">
                {description}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-balance font-semibold">Project library</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              View the details, refine your content, or add something new.
            </p>
          </div>
          {query.data && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground">
              {query.data.total}{' '}
              {filters.q || filters.categoryId !== 'all'
                ? 'matching'
                : 'projects'}
            </span>
          )}
        </div>
        <ProjectsToolbar
          key={filters.q}
          filters={filters}
          onChange={onFiltersChange}
          busy={query.isFetching}
        />
        {query.isError && !query.data ? (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center"
          >
            <AlertCircleIcon
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-medium">Couldn't load your projects</h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage(query.error)}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {query.isError && (
              <p
                role="alert"
                className="border-b bg-amber-500/5 px-5 py-3 text-sm"
              >
                Couldn't refresh the projects. Showing the last successful
                result. Use Refresh to try again.
              </p>
            )}
            <ProjectsTable
              projects={query.data?.projects ?? emptyProjects}
              total={query.data?.total ?? 0}
              filters={filters}
              loading={query.isPending}
              busy={query.isFetching || deletion.isPending}
              onFiltersChange={onFiltersChange}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              filtered={Boolean(filters.q || filters.categoryId !== 'all')}
              onReset={() =>
                onFiltersChange({ q: '', categoryId: 'all', page: 1 })
              }
            />
          </>
        )}
      </Card>
      {panel && (
        <ProjectPanel
          key={panel.mode === 'create' ? 'create' : panel.mode + panel.id}
          panel={panel}
          onClose={onClose}
          onEdit={onEdit}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this project?"
        description={
          <>
            This will permanently remove{' '}
            <strong className="font-medium text-foreground">
              {deleteTarget?.title}
            </strong>{' '}
            from your portfolio. This action cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        pending={deletion.isPending}
        error={deletion.isError ? errorMessage(deletion.error) : undefined}
        onConfirm={() => {
          if (deleteTarget) deletion.mutate(deleteTarget.id);
        }}
      />
    </section>
  );
}
