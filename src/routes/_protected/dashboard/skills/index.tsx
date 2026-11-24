import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';
import { SkillsPage } from '@/components/skills/skills-page';
import { skillsSearchSchema, type SkillsSearch } from '@/lib/validations/skillSchema';

export const Route = createFileRoute('/_protected/dashboard/skills/')({
  validateSearch: (search: SearchSchemaInput & Partial<SkillsSearch>) => skillsSearchSchema.parse(search),
  component: function SkillsRoute() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    return <SkillsPage filters={filters} onFiltersChange={patch => { void navigate({ search: previous => ({ ...previous, ...patch }) }); }} />;
  },
});
