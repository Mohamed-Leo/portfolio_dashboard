import { useQuery } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { ArchiveIcon, CheckCheckIcon, MailIcon, ReplyIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { messageLabels } from '@/constants/layout-data';
import { errorMessage } from '@/lib/api';
import type { ContactSummary } from '@/lib/validations/contactSchema';
import { contactQueryOptions } from '@/queries/contacts';
import { useContactStatus } from '@/hooks/useContactActions';

export function ContactPanel({ id, onClose, onDelete }: { id: string; onClose: () => void; onDelete: (message: ContactSummary) => void }) {
  const query = useQuery(contactQueryOptions(id));
  const mutation = useContactStatus(id);
  useBlocker({ shouldBlockFn: () => mutation.isPending, enableBeforeUnload: mutation.isPending, withResolver: false });
  // A reopened message must be confirmed by the server before enabling actions.
  const message = query.isFetching || query.isError ? undefined : query.data;
  return (
    <Sheet open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl" showCloseButton={!mutation.isPending}>
        <SheetHeader className="shrink-0 border-b p-6 pr-12">
          <SheetTitle className="text-xl font-semibold">{message?.name ?? 'Message details'}</SheetTitle>
          <SheetDescription className="mt-1 break-all">{message?.email ?? 'Private messages from your portfolio visitors.'}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {!message ? query.isError ? <div role="alert" className="space-y-4"><p className="text-sm text-muted-foreground">{errorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <div role="status" aria-label="Loading message"><Skeleton className="h-8 w-32" /><Skeleton className="mt-4 h-40 w-full" /></div> : <>
            <div className="flex flex-wrap items-center gap-2"><Badge variant={message.status === 'new' ? 'default' : 'secondary'}>{messageLabels[message.status]}</Badge><time dateTime={message.createdAt} className="text-xs tabular-nums text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</time></div>
            {message.company && <div><p className="text-xs text-muted-foreground">Company</p><p className="mt-1 break-words text-sm font-medium">{message.company}</p></div>}
            <section className="space-y-3"><h3 className="font-semibold">Message</h3><p className="whitespace-pre-wrap break-words rounded-xl border bg-muted/20 p-4 text-pretty text-sm leading-relaxed">{message.message}</p></section>
            <section className="space-y-3"><h3 className="font-semibold">Manage status</h3><p className="text-xs text-muted-foreground">Opening a message does not change its status.</p>
              <div className="flex flex-wrap gap-2">
                {message.status !== 'read' && <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate('read')}><CheckCheckIcon aria-hidden="true" />Mark as read</Button>}
                {message.status !== 'archived' && <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate('archived')}><ArchiveIcon aria-hidden="true" />Archive message</Button>}
                {message.status !== 'new' && <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate('new')}><MailIcon aria-hidden="true" />Mark as new</Button>}
              </div>
              {mutation.isPending && <p role="status" className="text-xs text-muted-foreground">Updating message…</p>}
              {mutation.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(mutation.error)}</p>}
            </section>
            <div className="flex flex-wrap gap-2 border-t pt-5">
              <Button variant="outline" nativeButton={false} render={<a href={'mailto:' + message.email} />}><ReplyIcon aria-hidden="true" />Reply by email</Button>
              <Button variant="ghost" className="text-destructive" disabled={mutation.isPending} onClick={() => onDelete(message)}><Trash2Icon aria-hidden="true" />Delete message</Button>
            </div>
          </>}
        </div>
        <div className="flex shrink-0 justify-end border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Close</Button></div>
      </SheetContent>
    </Sheet>
  );
}
