import { z } from 'zod';

const count = z.number().int().nonnegative();
const totalMatches = (summary: { total: number; breakdown: Record<string, number> }) =>
  summary.total === Object.values(summary.breakdown).reduce((sum, value) => sum + value, 0);
const consistentTotal = { message: 'The total must match its breakdown.' };

export const dashboardSchema = z.object({
  projects: z.object({
    total: count,
    breakdown: z.object({ website: count, 'landing-page': count, 'web-application': count, dashboard: count, '3d-website': count, other: count }),
  }).refine(totalMatches, consistentTotal),
  skills: z.object({
    total: count,
    breakdown: z.object({ frontend: count, backend: count, creative: count, workflow: count, other: count }),
  }).refine(totalMatches, consistentTotal),
  messages: z.object({
    total: count,
    breakdown: z.object({ new: count, read: count, archived: count, other: count }),
  }).refine(totalMatches, consistentTotal),
});

export const dashboardResponseSchema = z.object({ overview: dashboardSchema });
export type DashboardOverview = z.infer<typeof dashboardSchema>;
