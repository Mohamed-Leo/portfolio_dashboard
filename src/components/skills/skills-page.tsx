import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  SparklesIcon,
  LayersIcon,
  WrenchIcon,
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
import { skillLabels } from '@/constants/layout-data';
import { errorMessage } from '@/lib/api';
import {
  skillGroupSchema,
  skillLevelSchema,
  type Skill,
  type SkillsSearch,
} from '@/lib/validations/skillSchema';
import { skillsQueryOptions } from '@/queries/skills';
import { useDeleteSkill } from '@/hooks/useDeleteSkill';
import { SkillPanel, type SkillPanelState } from './skill-panel';
import { SkillsTable } from './skills-table';
import { levelLabels } from './skill-labels';

const emptySkills: Skill[] = [];

function SkillsToolbar({
  filters,
  onChange,
  busy,
}: {
  filters: SkillsSearch;
  onChange: (patch: Partial<SkillsSearch>) => void;
  busy: boolean;
}) {
  const [search, setSearch] = useState(filters.q);
  return (
    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
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
            aria-label="Search skills"
            maxLength={120}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, description or capability…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" type="submit" disabled={busy}>
          Search
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.groupId}
          onValueChange={(value) => {
            if (value)
              onChange({
                groupId:
                  skillGroupSchema.options.find((group) => group === value) ??
                  'all',
                page: 1,
              });
          }}
          disabled={busy}
        >
          <SelectTrigger className="w-36" aria-label="Filter skill group">
            <SelectValue>
              {filters.groupId === 'all'
                ? 'All groups'
                : skillLabels[filters.groupId]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {skillGroupSchema.options.map((value) => (
              <SelectItem key={value} value={value}>
                {skillLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.level}
          disabled={busy}
          onValueChange={(value) => {
            if (value)
              onChange({
                level:
                  skillLevelSchema.options.find((level) => level === value) ??
                  'all',
                page: 1,
              });
          }}
        >
          <SelectTrigger className="w-32" aria-label="Filter skill level">
            <SelectValue>
              {filters.level === 'all'
                ? 'All levels'
                : levelLabels[filters.level]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {skillLevelSchema.options.map((value) => (
              <SelectItem key={value} value={value}>
                {levelLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filters.q ||
          filters.groupId !== 'all' ||
          filters.level !== 'all') && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset filters"
            onClick={() =>
              onChange({ q: '', groupId: 'all', level: 'all', page: 1 })
            }
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SkillsPage({
  filters,
  onFiltersChange,
}: {
  filters: SkillsSearch;
  onFiltersChange: (patch: Partial<SkillsSearch>) => void;
}) {
  const query = useQuery(skillsQueryOptions(filters));
  const [panel, setPanel] = useState<SkillPanelState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const onDeleted = useCallback(() => setDeleteTarget(null), []);
  const deletion = useDeleteSkill(onDeleted);
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
    (skill: Skill) => {
      resetDeletion();
      setDeleteTarget(skill);
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
      label: 'Total skills',
      value: summary?.total,
      description: 'Across your entire portfolio',
      icon: SparklesIcon,
    },
    {
      label: 'Core skills',
      value: summary?.core,
      description: 'Central to your everyday work',
      icon: LayersIcon,
    },
    {
      label: 'Applied skills',
      value: summary?.applied,
      description: 'Supporting specific tasks and projects',
      icon: WrenchIcon,
    },
  ];

  return (
    <section className="min-w-0 space-y-6" aria-labelledby="skills-heading">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            THE EXPERTISE BEHIND YOUR WORK
          </p>
          <h1
            id="skills-heading"
            className="text-balance text-3xl font-semibold"
          >
            Skills
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Curate the tools and strengths you bring to every project.
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
            Add skill
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
            <h2 className="text-balance font-semibold">Skill library</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              View the details, refine your content, or add something new.
            </p>
          </div>
          {query.data && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground">
              {query.data.total}{' '}
              {filters.q || filters.groupId !== 'all' || filters.level !== 'all'
                ? 'matching'
                : 'skills'}
            </span>
          )}
        </div>
        <SkillsToolbar
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
            <h3 className="font-medium">Couldn't load your skills</h3>
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
                Couldn't refresh the skills. Showing the last successful result.
                Use Refresh to try again.
              </p>
            )}
            <SkillsTable
              skills={query.data?.skills ?? emptySkills}
              total={query.data?.total ?? 0}
              filters={filters}
              loading={query.isPending}
              busy={query.isFetching || deletion.isPending}
              onFiltersChange={onFiltersChange}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              filtered={Boolean(
                filters.q ||
                filters.groupId !== 'all' ||
                filters.level !== 'all'
              )}
              onReset={() =>
                onFiltersChange({
                  q: '',
                  groupId: 'all',
                  level: 'all',
                  page: 1,
                })
              }
            />
          </>
        )}
      </Card>
      {panel && (
        <SkillPanel
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
        title="Delete this skill?"
        description={
          <>
            This will permanently remove{' '}
            <strong className="font-medium text-foreground">
              {deleteTarget?.name}
            </strong>{' '}
            from your portfolio. This action cannot be undone.
          </>
        }
        confirmLabel="Delete skill"
        pending={deletion.isPending}
        error={deletion.isError ? errorMessage(deletion.error) : undefined}
        onConfirm={() => {
          if (deleteTarget) deletion.mutate(deleteTarget.id);
        }}
      />
    </section>
  );
}
