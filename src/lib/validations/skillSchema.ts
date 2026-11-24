import { z } from 'zod';

export const skillGroupSchema = z.enum(['frontend', 'backend', 'creative', 'workflow']);
export const skillLevelSchema = z.enum(['core', 'applied']);
export const skillCapabilitySchema = z.enum(['image', 'video', 'content', 'context', 'review', 'api', 'data', 'architecture', 'tools', 'ide']);
export const skillIdSchema = z.string().min(1, 'Enter a skill ID.').max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');
const skillFields = z.object({
  name: z.string().trim().min(1, 'Enter a skill name.').max(80),
  description: z.string().trim().min(1, 'Describe the skill.').max(1000),
  groupId: skillGroupSchema,
  level: skillLevelSchema,
  capability: skillCapabilitySchema.nullable().optional(),
  sortOrder: z.number().int('Use a whole number.').min(0).max(10000),
}).strict();

export const skillSchema = skillFields.extend({ id: skillIdSchema });
export const skillResponseSchema = z.object({ skill: skillSchema });
export const skillUpdateSchema = skillFields.partial().refine(value => Object.keys(value).length > 0, 'Provide at least one change.');
export const skillFormSchema = skillSchema.extend({ capability: z.enum([...skillCapabilitySchema.options, 'none']) });
export type Skill = z.infer<typeof skillSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type SkillUpdate = z.infer<typeof skillUpdateSchema>;
export type SkillFormValues = z.infer<typeof skillFormSchema>;

export const skillsSearchSchema = z.object({
  q: z.string().trim().max(120).catch(''),
  groupId: z.enum([...skillGroupSchema.options, 'all']).catch('all'),
  level: z.enum([...skillLevelSchema.options, 'all']).catch('all'),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  limit: z.coerce.number().pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])).catch(10),
  sort: z.enum(['sortOrder', 'name', 'groupId', 'level']).catch('sortOrder'),
  direction: z.enum(['asc', 'desc']).catch('asc'),
});
export type SkillsSearch = z.infer<typeof skillsSearchSchema>;
const count = z.number().int().nonnegative();
export const skillListSchema = z.object({
  skills: z.array(skillSchema), total: count,
  page: z.number().int().min(1).max(1000), limit: z.number().int().min(1).max(50), hasMore: z.boolean(),
  summary: z.object({ total: count, core: count, applied: count }).refine(value => value.core + value.applied <= value.total),
}).refine(value => value.skills.length <= value.limit && value.skills.length <= value.total && value.total <= value.summary.total && value.hasMore === (value.page * value.limit < value.total));
export type SkillList = z.infer<typeof skillListSchema>;
