import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArchiveIcon, CheckCheckIcon, InboxIcon, MailIcon, RefreshCwIcon, SearchIcon, XIcon } from 'lucide-react';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { contactStatusSchema, type ContactsSearch, type ContactSummary } from '@/lib/validations/contactSchema';
import { messageLabels } from '@/constants/layout-data';
import { errorMessage } from '@/lib/api';
import { contactsQueryOptions } from '@/queries/contacts';
import { useDeleteContact } from '@/hooks/useContactActions';
import { ContactsTable } from './contacts-table';
import { ContactPanel } from './contact-panel';

const emptyContacts: ContactSummary[] = [];

function ContactsToolbar({ filters, onChange, busy }: { filters: ContactsSearch; onChange: (patch: Partial<ContactsSearch>) => void; busy: boolean }) {
  const [search, setSearch] = useState(filters.q);
  return <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
    <form role="search" className="flex min-w-0 flex-1 gap-2 sm:max-w-lg" onSubmit={event => { event.preventDefault(); onChange({ q: search.trim(), page: 1 }); }}>
      <div className="relative min-w-0 flex-1"><SearchIcon className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search messages" maxLength={120} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email or company…" className="pl-9" /></div>
      <Button variant="outline" type="submit" disabled={busy}>Search</Button>
    </form>
    <div className="flex items-center gap-2">
      <Select value={filters.status} disabled={busy} onValueChange={value => { if (value) onChange({ status: contactStatusSchema.options.find(status => status === value) ?? 'all', page: 1 }); }}>
        <SelectTrigger className="w-40" aria-label="Filter message status"><SelectValue>{filters.status === 'all' ? 'All statuses' : messageLabels[filters.status]}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem>{contactStatusSchema.options.map(value => <SelectItem key={value} value={value}>{messageLabels[value]}</SelectItem>)}</SelectContent>
      </Select>
      {(filters.q || filters.status !== 'all') && <Button variant="ghost" size="icon" aria-label="Reset filters" onClick={() => onChange({ q: '', status: 'all', page: 1 })}><XIcon aria-hidden="true" /></Button>}
    </div>
  </div>;
}

export function ContactsPage({ filters, onFiltersChange }: { filters: ContactsSearch; onFiltersChange: (patch: Partial<ContactsSearch>) => void }) {
  const query = useQuery(contactsQueryOptions(filters));
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactSummary | null>(null);
  const onDeleted = useCallback(() => { setDeleteTarget(null); setSelected(null); }, []);
  const deletion = useDeleteContact(onDeleted);
  const { reset } = deletion;
  const onDelete = useCallback((contact: ContactSummary) => { reset(); setDeleteTarget(contact); }, [reset]);
  const onView = useCallback((id: string) => setSelected(id), []);
  const onClose = useCallback(() => setSelected(null), []);
  const onReset = () => onFiltersChange({ q: '', status: 'all', page: 1 });
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    const lastPage = Math.max(1, Math.ceil(query.data.total / filters.limit));
    if (filters.page > lastPage) onFiltersChange({ page: lastPage });
  }, [query.data, query.isPlaceholderData, filters.limit, filters.page, onFiltersChange]);
  const summary = query.data?.summary;
  const stats = [
    { label: 'Total messages', value: summary?.total, icon: InboxIcon, description: 'All portfolio enquiries' },
    { label: 'New', value: summary?.new, icon: MailIcon, description: 'Waiting to be reviewed' },
    { label: 'Read', value: summary?.read, icon: CheckCheckIcon, description: 'Messages you have reviewed' },
    { label: 'Archived', value: summary?.archived, icon: ArchiveIcon, description: 'Kept for your records' },
  ];
  return <section className="min-w-0 space-y-6" aria-labelledby="contacts-heading">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="space-y-2"><p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">CONVERSATIONS THAT MOVE WORK FORWARD</p><h1 id="contacts-heading" className="text-balance text-3xl font-semibold">Contacts</h1><p className="text-pretty text-sm text-muted-foreground">Review enquiries, keep track of replies, and organize your inbox.</p></div><Button variant="outline" disabled={query.isFetching || deletion.isPending} onClick={() => void query.refetch()}><RefreshCwIcon aria-hidden="true" />{query.isFetching ? 'Refreshing…' : 'Refresh'}</Button></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, description }) => <Card key={label}><CardHeader className="gap-2 px-5"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl font-semibold tabular-nums">{query.isPending ? <Skeleton className="h-9 w-14" /> : value?.toLocaleString('en-US') ?? '—'}</CardTitle><CardAction><span className="flex size-9 items-center justify-center rounded-lg bg-muted text-emerald-700 dark:text-emerald-400"><Icon className="size-4" aria-hidden="true" /></span></CardAction><p className="col-span-2 text-xs text-muted-foreground">{description}</p></CardHeader></Card>)}</div>
    <Card className="gap-0 overflow-hidden py-0"><div className="flex items-center justify-between gap-3 border-b px-5 py-4"><div><h2 className="text-balance font-semibold">Your inbox</h2><p className="mt-1 text-xs text-muted-foreground">Visitor messages are private to your admin account.</p></div>{query.data && <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground">{query.data.total} {filters.q || filters.status !== 'all' ? 'matching' : 'messages'}</span>}</div>
      <ContactsToolbar key={filters.q} filters={filters} onChange={onFiltersChange} busy={query.isFetching} />
      {query.isError && !query.data ? <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center"><MailIcon className="size-7 text-muted-foreground" aria-hidden="true" /><h3 className="font-medium">Couldn't load your inbox</h3><p className="text-sm text-muted-foreground">{errorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <>
        {query.isError && <p role="alert" className="border-b bg-amber-500/5 px-5 py-3 text-sm">Couldn't refresh messages. Showing the last successful result.</p>}
        <ContactsTable contacts={query.data?.contacts ?? emptyContacts} total={query.data?.total ?? 0} filters={filters} loading={query.isPending} busy={query.isFetching || deletion.isPending} onFiltersChange={onFiltersChange} onView={onView} onDelete={onDelete} onRefresh={() => void query.refetch()} onReset={onReset} filtered={Boolean(filters.q || filters.status !== 'all')} />
      </>}
    </Card>
    {selected && <ContactPanel key={selected} id={selected} onClose={onClose} onDelete={onDelete} />}
    <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open) setDeleteTarget(null); }} title="Delete this message?" description={<>This permanently removes the message from <strong className="font-medium text-foreground">{deleteTarget?.name}</strong>. This action cannot be undone.</>} confirmLabel="Delete message" pending={deletion.isPending} error={deletion.isError ? errorMessage(deletion.error) : undefined} onConfirm={() => { if (deleteTarget) deletion.mutate(deleteTarget.id); }} />
  </section>;
}
