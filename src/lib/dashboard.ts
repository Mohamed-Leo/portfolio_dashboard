import { apiRequest } from './api';
import { dashboardResponseSchema } from './validations/dashboardSchema';

export async function getDashboardOverview(signal?: AbortSignal) {
  return dashboardResponseSchema.parse(await apiRequest('/dashboard/overview', { signal })).overview;
}
