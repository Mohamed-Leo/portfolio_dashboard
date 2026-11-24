import { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { skillLabels } from '@/constants/layout-data';
import { skillGroupSchema, skillLevelSchema, skillCapabilitySchema, type Skill, type SkillFormValues } from '@/lib/validations/skillSchema';
import { useSkillForm } from '@/hooks/useSkillForm';
import { capabilityLabels, levelLabels } from './skill-labels';

function SkillSelect({ form, name, label, options, labels, disabled }: {
  form: UseFormReturn<SkillFormValues>;
  name: 'groupId' | 'level' | 'capability';
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  disabled: boolean;
}) {
  const error = form.formState.errors[name];
  return (
    <Field className="gap-1.5" data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={'skill-' + name}>{label}</FieldLabel>
      <Controller name={name} control={form.control} render={({ field }) => (
        <Select disabled={disabled} value={field.value} onValueChange={value => { if (value && options.includes(value)) field.onChange(value); }}>
          <SelectTrigger id={'skill-' + name} onBlur={field.onBlur} className="w-full" aria-invalid={Boolean(error)}>
            <SelectValue>{labels[field.value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>{options.map(value => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent>
        </Select>
      )} />
      {error && <FieldError>{error.message}</FieldError>}
    </Field>
  );
}

export function SkillFormSheet({ skill, onClose }: { skill?: Skill; onClose: () => void }) {
  const { form, submit, pending } = useSkillForm(skill, onClose);
  const [discard, setDiscard] = useState(false);
  const blocker = useBlocker({
    shouldBlockFn: () => form.formState.isDirty || pending,
    enableBeforeUnload: form.formState.isDirty || pending,
    withResolver: !pending,
  });
  const requestClose = () => {
    if (pending) return;
    if (form.formState.isDirty) setDiscard(true);
    else onClose();
  };
  const errors = form.formState.errors;

  return (
    <Sheet open onOpenChange={open => { if (!open) requestClose(); }}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl" showCloseButton={!pending}>
        <SheetHeader className="shrink-0 border-b p-6 pr-12">
          <SheetTitle className="text-xl font-semibold">{skill ? 'Edit skill' : 'Add a skill'}</SheetTitle>
          <SheetDescription className="mt-1 text-pretty">{skill ? 'Keep your expertise up to date.' : 'Show the tools and strengths behind your work.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <fieldset disabled={pending} className="space-y-7">
              <section className="space-y-4" aria-labelledby="skill-basics">
                <div><h3 id="skill-basics" className="font-semibold">The essentials</h3><p className="mt-1 text-xs text-muted-foreground">Give the skill a clear name and description.</p></div>
                <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
                  <FieldLabel htmlFor="skill-name">Skill name</FieldLabel>
                  <Input {...form.register('name')} id="skill-name" maxLength={80} placeholder="e.g. TypeScript" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'skill-name-error' : undefined} />
                  {errors.name && <FieldError id="skill-name-error">{errors.name.message}</FieldError>}
                </Field>
                <Field data-invalid={Boolean(errors.id)} className="gap-1.5">
                  <FieldLabel htmlFor="skill-id">Skill ID</FieldLabel>
                  <Input {...form.register('id')} id="skill-id" maxLength={64} readOnly={Boolean(skill)} placeholder="typescript" aria-invalid={Boolean(errors.id)} aria-describedby="skill-id-hint skill-id-error" />
                  <p id="skill-id-hint" className="text-xs text-muted-foreground">{skill ? 'The skill ID cannot be changed.' : 'A unique lowercase ID, such as node-js.'}</p>
                  {errors.id && <FieldError id="skill-id-error">{errors.id.message}</FieldError>}
                </Field>
                <Field data-invalid={Boolean(errors.description)} className="gap-1.5">
                  <FieldLabel htmlFor="skill-description">Description</FieldLabel>
                  <Textarea {...form.register('description')} id="skill-description" rows={5} maxLength={1000} placeholder="How you use this skill in your work" aria-invalid={Boolean(errors.description)} aria-describedby="skill-description-hint skill-description-error" />
                  <p id="skill-description-hint" className="text-xs text-muted-foreground">Up to 1000 characters.</p>
                  {errors.description && <FieldError id="skill-description-error">{errors.description.message}</FieldError>}
                </Field>
              </section>
              <section className="space-y-4 border-t pt-6" aria-labelledby="skill-classification">
                <h3 id="skill-classification" className="font-semibold">Classification</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SkillSelect form={form} name="groupId" label="Skill group" options={skillGroupSchema.options} labels={skillLabels} disabled={pending} />
                  <SkillSelect form={form} name="level" label="Skill level" options={skillLevelSchema.options} labels={levelLabels} disabled={pending} />
                </div>
                <p className="text-pretty text-xs text-muted-foreground">Core skills are central to your work. Applied skills support specific tasks and projects.</p>
                <SkillSelect form={form} name="capability" label="Capability" options={['none', ...skillCapabilitySchema.options]} labels={capabilityLabels} disabled={pending} />
                <p className="text-xs text-muted-foreground">Optional. Choose No capability to clear an existing value.</p>
              </section>
              <section className="space-y-4 border-t pt-6" aria-labelledby="skill-order">
                <h3 id="skill-order" className="font-semibold">Display order</h3>
                <Field data-invalid={Boolean(errors.sortOrder)} className="gap-1.5">
                  <FieldLabel htmlFor="skill-sortOrder">Sort order</FieldLabel>
                  <Input {...form.register('sortOrder', { valueAsNumber: true })} id="skill-sortOrder" type="number" min={0} max={10000} step={1} aria-invalid={Boolean(errors.sortOrder)} aria-describedby="skill-sortOrder-hint skill-sortOrder-error" />
                  <p id="skill-sortOrder-hint" className="text-xs text-muted-foreground">Lower numbers appear first. Use a whole number from 0 to 10000.</p>
                  {errors.sortOrder && <FieldError id="skill-sortOrder-error">{errors.sortOrder.message}</FieldError>}
                </Field>
              </section>
            </fieldset>
            {errors.root?.server && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{errors.root.server.message}</p>}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>Cancel</Button>
            <Button type="submit" disabled={pending || Boolean(skill && !form.formState.isDirty)}><SaveIcon className="size-4" aria-hidden="true" />{pending ? 'Saving…' : skill ? 'Save changes' : 'Add skill'}</Button>
          </div>
        </form>
        <ConfirmDialog
          open={discard || blocker?.status === 'blocked'}
          onOpenChange={open => { setDiscard(open); if (!open && blocker?.status === 'blocked') blocker.reset(); }}
          title="Discard your changes?" description="Your unsaved skill changes will be lost."
          confirmLabel="Discard changes" cancelLabel="Keep editing"
          onConfirm={() => { if (blocker?.status === 'blocked') blocker.proceed(); else onClose(); }}
        />
      </SheetContent>
    </Sheet>
  );
}
