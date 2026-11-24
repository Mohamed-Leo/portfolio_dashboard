import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';
import { ProjectsPage } from '@/components/projects/projects-page';
import { projectsSearchSchema, type ProjectsSearch } from '@/lib/validations/projectSchema';

export const Route = createFileRoute('/_protected/dashboard/projects/')({
  validateSearch: (search: SearchSchemaInput & Partial<ProjectsSearch>) => projectsSearchSchema.parse(search),
  component: function ProjectsRoute() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    return <ProjectsPage filters={filters} onFiltersChange={patch => { void navigate({ search: previous => ({ ...previous, ...patch }) }); }} />;
  },
});
