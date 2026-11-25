import { z } from 'zod';

export const contactStatusSchema = z.enum(['new', 'read', 'archived']);
export const contactIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid message ID.');
export const contactSummarySchema = z.object({
  id: contactIdSchema, name: z.string().min(2).max(100), email: z.email().max(254), company: z.string().max(120),
  status: contactStatusSchema, createdAt: z.iso.datetime(),
});
export const contactSchema = contactSummarySchema.extend({ message: z.string().min(10).max(2000), updatedAt: z.iso.datetime() });
export const contactResponseSchema = z.object({ contact: contactSchema });
export const contactStatusUpdateSchema = z.object({ status: contactStatusSchema }).strict();
export type ContactSummary = z.infer<typeof contactSummarySchema>;
export type ContactMessage = z.infer<typeof contactSchema>;
export type ContactStatus = z.infer<typeof contactStatusSchema>;
export const contactsSearchSchema = z.object({
  q: z.string().trim().max(120).catch(''), status: z.enum([...contactStatusSchema.options, 'all']).catch('all'),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  limit: z.coerce.number().pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])).catch(10),
  sort: z.enum(['createdAt', 'name', 'company', 'status']).catch('createdAt'), direction: z.enum(['asc', 'desc']).catch('desc'),
});
export type ContactsSearch = z.infer<typeof contactsSearchSchema>;
const count = z.number().int().nonnegative();
export const contactListSchema = z.object({
  contacts: z.array(contactSummarySchema), total: count, page: z.number().int().min(1).max(1000), limit: z.number().int().min(1).max(50), hasMore: z.boolean(),
  summary: z.object({ total: count, new: count, read: count, archived: count }).refine(value => value.new + value.read + value.archived <= value.total),
}).refine(value => value.contacts.length <= value.limit && value.contacts.length <= value.total && value.total <= value.summary.total && value.hasMore === (value.page * value.limit < value.total));

function socialLink(host: string) {
  return z.string().trim().max(2048).refine(value => {
    if (/\s/.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && [host, 'www.' + host].includes(url.hostname);
    } catch { return false; }
  }, 'Use an HTTPS link on ' + host + ' without login details.');
}
export const contactInfoSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.').max(254)).transform(value => value.toLowerCase()),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use international format, such as +201001234567.'),
  phoneLabel: z.string().trim().min(1, 'Enter a display phone number.').max(40),
  location: z.string().trim().min(1, 'Enter your location.').max(120),
  linkedin: socialLink('linkedin.com'), github: socialLink('github.com'),
}).strict();
export const contactInfoResponseSchema = z.object({ contact: contactInfoSchema });
export type ContactInfo = z.infer<typeof contactInfoSchema>;
