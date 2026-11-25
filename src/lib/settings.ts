import { apiRequest, ApiError } from './api';
import { getCsrfToken } from './auth';
import {
  contactInfoSchema,
  contactInfoResponseSchema,
  type ContactInfo,
} from './validations/contactSchema';

export async function getContactInfo(signal?: AbortSignal) {
  try {
    return contactInfoResponseSchema.parse(
      await apiRequest('/dashboard/contact-info', { signal })
    ).contact;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
export async function saveContactInfo(values: ContactInfo) {
  const body = contactInfoSchema.parse(values);
  const token = await getCsrfToken();
  return contactInfoResponseSchema.parse(
    await apiRequest('/contacts/info', {
      method: 'PUT',
      headers: { 'X-CSRF-Token': token },
      body: JSON.stringify(body),
    })
  ).contact;
}
