import { apiRequest } from './api';
import { getCsrfToken } from './auth';
import { contactIdSchema, contactListSchema, contactResponseSchema, contactsSearchSchema, contactStatusUpdateSchema, type ContactsSearch, type ContactStatus } from './validations/contactSchema';

export async function getContacts(filters: ContactsSearch, signal?: AbortSignal) {
  const value = contactsSearchSchema.parse(filters);
  const params = new URLSearchParams({ q: value.q, page: String(value.page), limit: String(value.limit), sort: value.sort, direction: value.direction });
  if (value.status !== 'all') params.set('status', value.status);
  return contactListSchema.parse(await apiRequest('/dashboard/contacts?' + params, { signal }));
}
export async function getContact(id: string, signal?: AbortSignal) {
  contactIdSchema.parse(id);
  return contactResponseSchema.parse(await apiRequest('/contacts/' + encodeURIComponent(id), { signal })).contact;
}
export async function updateContactStatus(id: string, values: { status: ContactStatus }) {
  contactIdSchema.parse(id);
  const body = contactStatusUpdateSchema.parse(values);
  const token = await getCsrfToken();
  return contactResponseSchema.parse(await apiRequest('/contacts/' + id, { method: 'PATCH', headers: { 'X-CSRF-Token': token }, body: JSON.stringify(body) })).contact;
}
export async function deleteContact(id: string) {
  contactIdSchema.parse(id);
  const token = await getCsrfToken();
  await apiRequest('/contacts/' + id, { method: 'DELETE', headers: { 'X-CSRF-Token': token } });
}
