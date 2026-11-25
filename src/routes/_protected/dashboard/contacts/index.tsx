import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';
import { ContactsPage } from '@/components/contacts/contacts-page';
import { contactsSearchSchema, type ContactsSearch } from '@/lib/validations/contactSchema';

export const Route = createFileRoute('/_protected/dashboard/contacts/')({
  validateSearch: (search: SearchSchemaInput & Partial<ContactsSearch>) => contactsSearchSchema.parse(search),
  component: function ContactsRoute() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    return <ContactsPage filters={filters} onFiltersChange={patch => { void navigate({ search: previous => ({ ...previous, ...patch }) }); }} />;
  },
});
