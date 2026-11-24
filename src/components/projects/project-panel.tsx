import { useQuery } from '@tanstack/react-query';
import { ExternalLinkIcon, GitBranchIcon, PencilIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api';
import { projectQueryOptions } from '@/queries/projects';
import { projectLabels } from '@/constants/layout-data';
import { ProjectFormSheet } from './project-form-sheet';

export type ProjectPanelState = { mode: 'create' } | { mode: 'view' | 'edit'; id: string };

export function ProjectPanel({ panel, onClose, onEdit }: { panel: ProjectPanelState; onClose: () => void; onEdit: (id: string) => void }) {
  const query = useQuery(projectQueryOptions(panel.mode === 'create' ? null : panel.id));
  if (panel.mode === 'create') return <ProjectFormSheet onClose={onClose} />;
  const project = query.data;
  if (query.isPending || query.isFetching || query.isError || !project) {
    return (
      <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader className="border-b p-6"><SheetTitle>Project details</SheetTitle><SheetDescription>Current project information from your portfolio.</SheetDescription></SheetHeader>
          <div className="space-y-5 p-6">
            {query.isError ? <div role="alert" className="space-y-4"><p className="text-sm text-muted-foreground">{errorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <div role="status" aria-label="Loading project"><Skeleton className="h-48 w-full" /><Skeleton className="mt-4 h-8 w-3/4" /><Skeleton className="mt-4 h-24 w-full" /></div>}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  if (panel.mode === 'edit') return <ProjectFormSheet project={project} onClose={onClose} />;
  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="shrink-0 border-b p-6 pr-12"><SheetTitle className="text-xl font-semibold">{project.title}</SheetTitle><SheetDescription className="mt-1">{project.id}</SheetDescription></SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <img src={project.image.src} alt={project.image.alt} className="aspect-video w-full rounded-xl border bg-muted object-cover" />
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">{projectLabels[project.categoryId]}</Badge><Badge variant="outline">Order {project.sortOrder}</Badge>{project.repository?.private && <Badge variant="outline">Private repository</Badge>}</div>
          <p className="text-pretty text-lg font-medium">{project.summary}</p>
          <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4 text-sm"><div><dt className="text-xs text-muted-foreground">Display category</dt><dd className="mt-1 font-medium">{project.category}</dd></div><div><dt className="text-xs text-muted-foreground">Your role</dt><dd className="mt-1 font-medium">{project.role}</dd></div></dl>
          <section className="space-y-2"><h3 className="font-semibold">About the project</h3><p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-muted-foreground">{project.description}</p></section>
          <section className="space-y-3"><h3 className="font-semibold">Highlights</h3><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{project.highlights.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          <section className="space-y-3"><h3 className="font-semibold">Technologies</h3><div className="flex flex-wrap gap-2">{project.technologies.map((item, index) => <Badge key={index} variant="outline">{item}</Badge>)}</div></section>
          <div className="flex flex-wrap gap-2 border-t pt-5">
            {project.liveUrl && <Button variant="outline" nativeButton={false} render={<a href={project.liveUrl} target="_blank" rel="noopener noreferrer" />}><ExternalLinkIcon className="size-4" aria-hidden="true" />Live preview</Button>}
            {project.repository && <Button variant="outline" nativeButton={false} render={<a href={project.repository.url} target="_blank" rel="noopener noreferrer" />}><GitBranchIcon className="size-4" aria-hidden="true" />Repository</Button>}
            {project.overviewUrl && <Button variant="outline" nativeButton={false} render={<a href={project.overviewUrl} target="_blank" rel="noopener noreferrer" />}><ExternalLinkIcon className="size-4" aria-hidden="true" />Case study</Button>}
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => onEdit(project.id)}><PencilIcon className="size-4" aria-hidden="true" />Edit project</Button></div>
      </SheetContent>
    </Sheet>
  );
}
