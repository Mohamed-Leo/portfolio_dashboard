import type { ContactInfo } from '@/lib/validations/contactSchema';

export function contactInfoDefaults(info: ContactInfo | null): ContactInfo {
  return info ?? { email: '', phone: '', phoneLabel: '', location: '', linkedin: '', github: '' };
}
