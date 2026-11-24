import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilIcon, SparklesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api';
import { skillQueryOptions } from '@/queries/skills';
import { skillLabels } from '@/constants/layout-data';
import type { Skill } from '@/lib/validations/skillSchema';
import { SkillFormSheet } from './skill-form-sheet';
import { capabilityLabels, levelLabels } from './skill-labels';

export type SkillPanelState = { mode: 'create' } | { mode: 'view' | 'edit'; id: string };

export function SkillPanel({ panel, onClose, onEdit }: { panel: SkillPanelState; onClose: () => void; onEdit: (id: string) => void }) {
  const query = useQuery(skillQueryOptions(panel.mode === 'create' ? null : panel.id));
  const [baseline, setBaseline] = useState<Skill>();
  // Await fresh details once; later background requests must not replace a draft.
  if (panel.mode === 'edit' && !baseline && query.isSuccess && !query.isFetching) {
    setBaseline(query.data);
  }
  if (panel.mode === 'edit' && baseline) return <SkillFormSheet skill={baseline} onClose={onClose} />;
  if (panel.mode === 'create') return <SkillFormSheet onClose={onClose} />;
  const skill = query.data;
  if (query.isPending || query.isFetching || query.isError || !skill) {
    return (
      <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
        <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b p-6"><SheetTitle>Skill details</SheetTitle><SheetDescription>Current information from your portfolio.</SheetDescription></SheetHeader>
          <div className="space-y-5 p-6">
            {query.isError ? <div role="alert" className="space-y-4"><p className="text-sm text-muted-foreground">{errorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <div role="status" aria-label="Loading skill"><Skeleton className="h-8 w-3/4" /><Skeleton className="mt-4 h-32 w-full" /></div>}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  if (panel.mode === 'edit') return null;
  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b p-6 pr-12"><SheetTitle className="text-xl font-semibold">{skill.name}</SheetTitle><SheetDescription className="mt-1">{skill.id}</SheetDescription></SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex size-14 items-center justify-center rounded-xl border bg-muted text-emerald-700 dark:text-emerald-400"><SparklesIcon className="size-7" aria-hidden="true" /></div>
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">{skillLabels[skill.groupId]}</Badge><Badge variant="outline">{levelLabels[skill.level]}</Badge></div>
          <section className="space-y-3"><h3 className="font-semibold">About this skill</h3><p className="whitespace-pre-wrap break-words text-pretty text-sm leading-relaxed text-muted-foreground">{skill.description}</p></section>
          <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Capability</dt><dd className="mt-1 font-medium">{capabilityLabels[skill.capability ?? 'none']}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Display order</dt><dd className="mt-1 font-medium tabular-nums">{skill.sortOrder}</dd></div>
          </dl>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => onEdit(skill.id)}><PencilIcon className="size-4" aria-hidden="true" />Edit skill</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
