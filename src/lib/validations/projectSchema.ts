import { z } from 'zod';

export const projectCategorySchema = z.enum(['website', 'landing-page', 'web-application', 'dashboard', '3d-website']);
export const projectIdSchema = z.string().min(1, 'Enter a project ID.').max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');
const httpsUrl = z.string().max(2048).refine(value => {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}, 'Use an HTTPS URL without a username or password.');
const optionalUrl = z.string().trim().pipe(z.union([httpsUrl, z.literal('')]));
const projectFields = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(120),
  category: z.string().trim().min(1, 'Enter a display category.').max(80),
  categoryId: projectCategorySchema,
  role: z.string().trim().min(1, 'Enter your role.').max(160),
  summary: z.string().trim().min(1, 'Enter a short summary.').max(240),
  description: z.string().trim().min(1, 'Enter a description.').max(4000),
  technologies: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  highlights: z.array(z.string().trim().min(1).max(240)).min(1).max(10),
  image: z.object({ src: httpsUrl, alt: z.string().trim().min(1).max(200) }).strict(),
  repository: z.object({ url: httpsUrl, private: z.boolean() }).strict().nullable(),
  liveUrl: httpsUrl.nullable(),
  overviewUrl: httpsUrl.nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000),
}).strict();

export const projectSchema = projectFields.extend({ id: projectIdSchema });
export const projectResponseSchema = z.object({ project: projectSchema });
export const projectUpdateSchema = projectFields.partial().refine(value => Object.keys(value).length > 0, 'Provide at least one change.');
export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export const splitTechnologies = (text: string) => text.split(',').map(value => value.trim()).filter(Boolean);
export const splitHighlights = (text: string) => text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
const validList = (items: string[], maxItems: number, maxLength: number) => items.length > 0 && items.length <= maxItems && items.every(item => item.length <= maxLength);

export const projectFormSchema = z.object({
  id: projectIdSchema,
  title: projectFields.shape.title,
  category: projectFields.shape.category,
  categoryId: projectCategorySchema,
  role: projectFields.shape.role,
  summary: projectFields.shape.summary,
  description: projectFields.shape.description,
  technologiesText: z.string().refine(value => validList(splitTechnologies(value), 20, 80), 'Enter 1–20 comma-separated technologies, up to 80 characters each.'),
  highlightsText: z.string().refine(value => validList(splitHighlights(value), 10, 240), 'Enter 1–10 highlights, one per line, up to 240 characters each.'),
  imageUrl: z.string().trim().pipe(httpsUrl),
  imageAlt: z.string().trim().min(1, 'Describe the project image.').max(200),
  repositoryUrl: optionalUrl,
  repositoryPrivate: z.boolean(),
  liveUrl: optionalUrl,
  overviewUrl: optionalUrl,
  sortOrder: projectFields.shape.sortOrder,
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const projectsSearchSchema = z.object({
  q: z.string().trim().max(120).catch(''),
  categoryId: z.enum([...projectCategorySchema.options, 'all']).catch('all'),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  limit: z.coerce.number().pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])).catch(10),
  sort: z.enum(['sortOrder', 'title', 'category']).catch('sortOrder'),
  direction: z.enum(['asc', 'desc']).catch('asc'),
});
export type ProjectsSearch = z.infer<typeof projectsSearchSchema>;
const count = z.number().int().nonnegative();
export const projectListSchema = z.object({
  projects: z.array(projectSchema), total: count, page: z.number().int().positive(), limit: z.number().int().min(1).max(50), hasMore: z.boolean(),
  summary: z.object({ total: count, live: count, privateRepositories: count }).refine(value => value.live <= value.total && value.privateRepositories <= value.total),
}).refine(value => value.projects.length <= value.limit && value.projects.length <= value.total && value.total <= value.summary.total && value.hasMore === (value.page * value.limit < value.total));
export type ProjectList = z.infer<typeof projectListSchema>;
