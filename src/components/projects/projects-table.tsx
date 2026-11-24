import { useMemo } from 'react';
import { createColumnHelper, functionalUpdate, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable, type SortingState } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, EyeIcon, FolderIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { projectLabels } from '@/constants/layout-data';
import { projectsSearchSchema, type Project, type ProjectsSearch } from '@/lib/validations/projectSchema';

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });
const helper = createColumnHelper<typeof features, Project>();

interface ProjectsTableProps {
  projects: Project[];
  total: number;
  filters: ProjectsSearch;
  loading: boolean;
  busy: boolean;
  onFiltersChange: (patch: Partial<ProjectsSearch>) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (project: Project) => void;
  onAdd: () => void;
  onReset: () => void;
  filtered: boolean;
}

export function ProjectsTable({ projects, total, filters, loading, busy, onFiltersChange, onView, onEdit, onDelete, onAdd, onReset, filtered }: ProjectsTableProps) {
  const columns = useMemo(() => helper.columns([
    helper.accessor('title', { header: 'Project', cell: context => (
      <button type="button" disabled={busy} onClick={() => onView(context.row.original.id)} className="group flex max-w-80 items-center gap-3 text-left disabled:opacity-50">
        <img src={context.row.original.image.src} alt="" loading="lazy" className="h-11 w-16 shrink-0 rounded-md border bg-muted object-cover" />
        <span className="min-w-0"><span className="block truncate font-medium group-hover:underline">{context.getValue()}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{context.row.original.id}</span></span>
      </button>
    ) }),
    helper.accessor('category', { header: 'Category', cell: context => <div className="space-y-1.5"><Badge variant="secondary" className="font-normal">{projectLabels[context.row.original.categoryId]}</Badge><p className="max-w-40 truncate text-xs text-muted-foreground">{context.getValue()}</p></div> }),
    helper.accessor('role', { header: 'Role', enableSorting: false, cell: context => <span className="block max-w-44 truncate text-muted-foreground">{context.getValue()}</span> }),
    helper.accessor('technologies', { header: 'Technologies', enableSorting: false, cell: context => <div className="flex max-w-52 flex-wrap gap-1">{context.getValue().slice(0, 2).map((value, index) => <Badge variant="outline" className="text-xs font-normal" key={index}>{value}</Badge>)}{context.getValue().length > 2 && <span className="text-xs text-muted-foreground" title={context.getValue().join(', ')}>+{context.getValue().length - 2}</span>}</div> }),
    helper.accessor('sortOrder', { header: 'Order', cell: context => <span className="tabular-nums text-muted-foreground">{context.getValue()}</span> }),
    helper.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: context => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={busy} aria-label={`Actions for ${context.row.original.title}`} />}><MoreHorizontalIcon aria-hidden="true" /></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(context.row.original.id)}><EyeIcon aria-hidden="true" />View details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(context.row.original.id)}><PencilIcon aria-hidden="true" />Edit project</DropdownMenuItem>
          {context.row.original.liveUrl && <DropdownMenuItem render={<a href={context.row.original.liveUrl} target="_blank" rel="noopener noreferrer" />}><ExternalLinkIcon aria-hidden="true" />Live preview</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(context.row.original)}><Trash2Icon aria-hidden="true" />Delete project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) }),
  ]), [busy, onView, onEdit, onDelete]);
  const sorting = useMemo<SortingState>(() => [{ id: filters.sort, desc: filters.direction === 'desc' }], [filters.sort, filters.direction]);
  const pagination = useMemo(() => ({ pageIndex: filters.page - 1, pageSize: filters.limit }), [filters.page, filters.limit]);
  const table = useTable({
    features, columns, data: projects, getRowId: row => row.id, rowCount: total,
    manualSorting: true, manualPagination: true, autoResetPageIndex: false, enableMultiSort: false, enableSortingRemoval: false,
    state: { sorting, pagination },
    onSortingChange: updater => {
      const next = functionalUpdate(updater, sorting)[0];
      onFiltersChange({ sort: projectsSearchSchema.shape.sort.parse(next?.id), direction: next?.desc ? 'desc' : 'asc', page: 1 });
    },
    onPaginationChange: updater => {
      const next = functionalUpdate(updater, pagination);
      onFiltersChange({ page: next.pageSize !== filters.limit ? 1 : next.pageIndex + 1, limit: projectsSearchSchema.shape.limit.parse(next.pageSize) });
    },
  });

  return (
    <div aria-busy={busy}>
      <Table className="min-w-4xl">
        <caption className="sr-only">Portfolio projects with server-side sorting and pagination.</caption>
        <TableHeader className="bg-muted/30">{table.getHeaderGroups().map(group => <TableRow key={group.id}>{group.headers.map(header => (
          <TableHead key={header.id} scope="col" className="px-5" aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
            {header.isPlaceholder ? null : header.column.getCanSort() ? <button type="button" disabled={busy} className="inline-flex items-center gap-2 py-3 text-xs font-medium disabled:opacity-50" onClick={header.column.getToggleSortingHandler()}><table.FlexRender header={header} />{header.column.getIsSorted() === 'asc' ? <ArrowUpIcon className="size-3.5" aria-hidden="true" /> : header.column.getIsSorted() === 'desc' ? <ArrowDownIcon className="size-3.5" aria-hidden="true" /> : <ArrowUpDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />}</button> : <table.FlexRender header={header} />}
          </TableHead>
        ))}</TableRow>)}</TableHeader>
        <TableBody>
          {loading ? [0, 1, 2, 3, 4].map(index => <TableRow key={index}>{columns.map((_column, columnIndex) => <TableCell key={columnIndex} className="px-5 py-5"><Skeleton className="h-6 w-full" /></TableCell>)}</TableRow>) : table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>{row.getAllCells().map(cell => <TableCell key={cell.id} className="px-5 py-4"><table.FlexRender cell={cell} /></TableCell>)}</TableRow>
          )) : <TableRow><TableCell colSpan={columns.length} className="h-64 text-center"><div className="flex flex-col items-center gap-3"><FolderIcon className="size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">{filtered ? 'No projects match your search' : 'Your next project starts here'}</p><p className="text-sm text-muted-foreground">{filtered ? 'Try a different search or reset your filters.' : 'Add your first project to start building your portfolio.'}</p><Button variant="outline" onClick={filtered ? onReset : onAdd}>{filtered ? 'Reset filters' : 'Add your first project'}</Button></div></TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="flex flex-col justify-between gap-4 border-t p-4 text-xs sm:flex-row sm:items-center">
        <p className="tabular-nums text-muted-foreground" aria-live="polite">{loading ? 'Loading projects…' : busy ? 'Updating results…' : `${total ? (filters.page - 1) * filters.limit + 1 : 0}–${Math.min(filters.page * filters.limit, total)} of ${total.toLocaleString('en-US')} projects`}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="project-page-size" className="text-muted-foreground">Rows</label>
          <Select value={String(filters.limit)} onValueChange={value => table.setPageSize(Number(value))} disabled={busy}><SelectTrigger id="project-page-size" className="w-17"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 50].map(value => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select>
          <span className="tabular-nums text-muted-foreground">Page {filters.page} of {Math.max(1, table.getPageCount())}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" aria-label="First page" disabled={busy || !table.getCanPreviousPage()} onClick={() => table.firstPage()}><ChevronsLeftIcon aria-hidden="true" /></Button>
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={busy || !table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeftIcon aria-hidden="true" /></Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={busy || !table.getCanNextPage()} onClick={() => table.nextPage()}><ChevronRightIcon aria-hidden="true" /></Button>
            <Button variant="outline" size="icon-sm" aria-label="Last page" disabled={busy || !table.getCanNextPage()} onClick={() => table.lastPage()}><ChevronsRightIcon aria-hidden="true" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
