import { Link } from '@tanstack/react-router';
import {
  ArrowUpRightIcon,
  CodeXmlIcon,
  FolderKanbanIcon,
  InboxIcon,
  MailIcon,
} from 'lucide-react';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { DashboardOverview } from '@/lib/validations/dashboardSchema';

export function OverviewCards({ overview }: { overview: DashboardOverview }) {
  const cards = [
    {
      label: 'Total projects',
      value: overview.projects.total,
      description: 'Work in your portfolio',
      action: 'View projects',
      to: '/dashboard/projects',
      icon: FolderKanbanIcon,
    },
    {
      label: 'Total skills',
      value: overview.skills.total,
      description: 'Skills across your toolkit',
      action: 'View skills',
      to: '/dashboard/skills',
      icon: CodeXmlIcon,
    },
    {
      label: 'Total messages',
      value: overview.messages.total,
      description: 'All incoming enquiries',
      action: 'View messages',
      to: '/dashboard/contacts',
      icon: MailIcon,
    },
    {
      label: 'New messages',
      value: overview.messages.breakdown.new,
      description: 'Waiting to be reviewed',
      action: 'Open inbox',
      to: '/dashboard/contacts',
      icon: InboxIcon,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, description, action, to, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          className="group rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Card className="h-full transition-colors group-hover:bg-muted/40">
            <CardHeader className="gap-2 p-1 px-5">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-4xl font-semibold tabular-nums">
                {value.toLocaleString('en-US')}
              </CardTitle>
              <CardAction>
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-emerald-700 dark:text-emerald-400">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardAction>
              <p className="col-span-2 mt-1 text-pretty text-xs text-muted-foreground">
                {description}
              </p>
            </CardHeader>
            <CardFooter className="justify-between px-5 text-xs text-muted-foreground group-hover:text-foreground">
              {action}
              <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
