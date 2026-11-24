import { useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { projectLabels } from '@/constants/layout-data';
import { projectCategorySchema, type Project, type ProjectFormValues } from '@/lib/validations/projectSchema';
import { useProjectForm } from '@/hooks/useProjectForm';

interface ProjectFieldProps {
  form: UseFormReturn<ProjectFormValues>;
  name: Exclude<keyof ProjectFormValues, 'repositoryPrivate' | 'categoryId'>;
  label: string;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  type?: 'text' | 'number' | 'url';
}

function ProjectField({ form, name, label, hint, multiline, ...props }: ProjectFieldProps) {
  const error = form.formState.errors[name];
  const id = `project-${name}`;
  const input = {
    ...form.register(name, props.type === 'number' ? { valueAsNumber: true } : undefined),
    id, 'aria-invalid': Boolean(error), 'aria-describedby': [hint ? id + '-hint' : '', error ? id + '-error' : ''].filter(Boolean).join(' ') || undefined,
    ...props,
  };
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? <Textarea {...input} rows={name === 'description' ? 5 : 3} /> : <Input {...input} min={props.type === 'number' ? 0 : undefined} max={props.type === 'number' ? 10000 : undefined} />}
      {hint && <p id={id + '-hint'} className="text-pretty text-xs text-muted-foreground">{hint}</p>}
      {error && <FieldError id={id + '-error'}>{error.message}</FieldError>}
    </Field>
  );
}

export function ProjectFormSheet({ project, onClose }: { project?: Project; onClose: () => void }) {
  const { form, submit, pending } = useProjectForm(project, onClose);
  const [discard, setDiscard] = useState(false);
  const blocker = useBlocker({
    shouldBlockFn: () => form.formState.isDirty || pending,
    enableBeforeUnload: form.formState.isDirty || pending,
    // A saving form cancels navigation immediately, without leaving a resolver pending.
    withResolver: !pending,
  });
  const requestClose = () => {
    if (pending) return;
    if (form.formState.isDirty) setDiscard(true);
    else onClose();
  };

  return (
    <Sheet open onOpenChange={open => { if (!open) requestClose(); }}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl" showCloseButton={!pending}>
        <SheetHeader className="shrink-0 border-b p-6 pr-12">
          <SheetTitle className="text-xl font-semibold">{project ? 'Edit project' : 'Add a project'}</SheetTitle>
          <SheetDescription className="mt-1 text-pretty">{project ? 'Update the details that appear in your portfolio.' : 'Bring your next piece of work into your portfolio.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <fieldset disabled={pending} className="space-y-8">
              <section className="space-y-4" aria-labelledby="project-basics">
                <div><h3 id="project-basics" className="font-semibold">The essentials</h3><p className="mt-1 text-xs text-muted-foreground">Give the project a clear identity.</p></div>
                <ProjectField form={form} name="title" label="Project title" placeholder="e.g. Operations dashboard" maxLength={120} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectField form={form} name="id" label="Project ID" placeholder="operations-dashboard" readOnly={Boolean(project)} maxLength={64} hint={project ? 'The project ID cannot be changed.' : 'A unique lowercase ID, such as operations-dashboard.'} />
                  <Field className="gap-1.5"><FieldLabel htmlFor="project-categoryId">Project type</FieldLabel>
                    <Controller name="categoryId" control={form.control} render={({ field }) => (
                      <Select disabled={pending} value={field.value} onValueChange={value => { if (value) field.onChange(value); }}>
                        <SelectTrigger id="project-categoryId" className="w-full"><SelectValue>{projectLabels[field.value]}</SelectValue></SelectTrigger>
                        <SelectContent>{projectCategorySchema.options.map(value => <SelectItem key={value} value={value}>{projectLabels[value]}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProjectField form={form} name="category" label="Display category" placeholder="e.g. Business operations" maxLength={80} />
                  <ProjectField form={form} name="role" label="Your role" placeholder="e.g. Full-stack developer" maxLength={160} />
                </div>
              </section>
              <section className="space-y-4 border-t pt-6" aria-labelledby="project-content">
                <h3 id="project-content" className="font-semibold">Tell the story</h3>
                <ProjectField form={form} name="summary" label="Short summary" placeholder="A short introduction to the project" maxLength={240} hint="Up to 240 characters." />
                <ProjectField form={form} name="description" label="Description" multiline maxLength={4000} hint="Describe the project, its purpose and what you built." />
                <ProjectField form={form} name="technologiesText" label="Technologies" placeholder="React, TypeScript, Node.js" hint="Separate technologies with commas. Up to 20 items." />
                <ProjectField form={form} name="highlightsText" label="Project highlights" multiline placeholder={'Clear reporting\nFast navigation'} hint="One highlight per line. Up to 10 items." />
              </section>
              <section className="space-y-4 border-t pt-6" aria-labelledby="project-media">
                <h3 id="project-media" className="font-semibold">Image & links</h3>
                <ProjectField form={form} name="imageUrl" label="Image URL" type="url" placeholder="https://…" hint="Use an existing HTTPS image URL." maxLength={2048} />
                <ProjectField form={form} name="imageAlt" label="Image description" placeholder="Describe what the project preview shows" maxLength={200} />
                <ProjectField form={form} name="liveUrl" label="Live preview URL" type="url" placeholder="https://…" hint="Optional. Leave empty if there is no live preview." maxLength={2048} />
                <ProjectField form={form} name="overviewUrl" label="Case study URL" type="url" placeholder="https://…" hint="Optional link to a project overview or case study." maxLength={2048} />
                <ProjectField form={form} name="repositoryUrl" label="Repository URL" type="url" placeholder="https://github.com/…" hint="Optional. Clear this field to remove the repository." maxLength={2048} />
                <Controller name="repositoryPrivate" control={form.control} render={({ field }) => <label className="flex items-center gap-2 text-sm"><Checkbox disabled={pending} checked={field.value} onCheckedChange={checked => field.onChange(checked === true)} />Private repository</label>} />
              </section>
              <section className="space-y-4 border-t pt-6" aria-labelledby="project-order"><h3 id="project-order" className="font-semibold">Display order</h3><ProjectField form={form} name="sortOrder" label="Sort order" type="number" hint="Lower numbers appear first. Use a whole number from 0 to 10000." /></section>
            </fieldset>
            {form.formState.errors.root?.server && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>Cancel</Button>
            <Button type="submit" disabled={pending || Boolean(project && !form.formState.isDirty)}><SaveIcon className="size-4" aria-hidden="true" />{pending ? 'Saving…' : project ? 'Save changes' : 'Add project'}</Button>
          </div>
        </form>
        <ConfirmDialog open={discard || blocker?.status === 'blocked'} onOpenChange={open => { setDiscard(open); if (!open && blocker?.status === 'blocked') blocker.reset(); }} title="Discard your changes?" description="Your unsaved project changes will be lost." confirmLabel="Discard changes" cancelLabel="Keep editing" onConfirm={() => { if (blocker?.status === 'blocked') blocker.proceed(); else onClose(); }} />
      </SheetContent>
    </Sheet>
  );
}
