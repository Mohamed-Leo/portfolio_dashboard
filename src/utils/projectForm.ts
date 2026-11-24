import { splitTechnologies, splitHighlights, type Project, type ProjectFormValues, type ProjectInput, type ProjectUpdate } from '@/lib/validations/projectSchema';

export function projectFormDefaults(project?: Project): ProjectFormValues {
  return {
    id: project?.id ?? '', title: project?.title ?? '', category: project?.category ?? 'Web application', categoryId: project?.categoryId ?? 'web-application',
    role: project?.role ?? '', summary: project?.summary ?? '', description: project?.description ?? '',
    technologiesText: project?.technologies.join(', ') ?? '', highlightsText: project?.highlights.join('\n') ?? '',
    imageUrl: project?.image.src ?? '', imageAlt: project?.image.alt ?? '',
    repositoryUrl: project?.repository?.url ?? '', repositoryPrivate: project?.repository?.private ?? false,
    liveUrl: project?.liveUrl ?? '', overviewUrl: project?.overviewUrl ?? '', sortOrder: project?.sortOrder ?? 0,
  };
}

export function projectFormPayload(values: ProjectFormValues): ProjectInput {
  return {
    id: values.id, title: values.title, category: values.category, categoryId: values.categoryId,
    role: values.role, summary: values.summary, description: values.description,
    technologies: splitTechnologies(values.technologiesText), highlights: splitHighlights(values.highlightsText),
    image: { src: values.imageUrl, alt: values.imageAlt },
    repository: values.repositoryUrl ? { url: values.repositoryUrl, private: values.repositoryPrivate } : null,
    liveUrl: values.liveUrl || null, overviewUrl: values.overviewUrl || null, sortOrder: values.sortOrder,
  };
}

export function projectFormPatch(values: ProjectFormValues, original: Project): ProjectUpdate {
  const previous = new Map(Object.entries(projectFormPayload(projectFormDefaults(original))));
  return Object.fromEntries(Object.entries(projectFormPayload(values)).filter(([key, value]) => key !== 'id' && JSON.stringify(value) !== JSON.stringify(previous.get(key))));
}
