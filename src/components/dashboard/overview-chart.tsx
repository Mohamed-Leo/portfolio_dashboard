import { Link } from '@tanstack/react-router';
import { ArrowUpRightIcon } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface OverviewChartProps {
  title: string;
  description: string;
  unit: string;
  total: number;
  breakdown: Record<string, number>;
  labels: Record<string, string>;
  to: '/dashboard/projects' | '/dashboard/skills' | '/dashboard/contacts';
  action: string;
  empty: string;
}

export function OverviewChart({ title, description, unit, total, breakdown, labels, to, action, empty }: OverviewChartProps) {
  const data = Object.entries(breakdown).map(([key, count], index) => ({
    key, count, label: labels[key] ?? 'Other',
    fill: index < 5 ? `var(--chart-${index + 1})` : 'var(--foreground)',
  })).filter(item => item.count > 0);
  const config: ChartConfig = Object.fromEntries(data.map(item => [item.key, { label: item.label, color: item.fill }]));

  return (
    <Card className="h-full">
      <CardHeader className="px-5 pt-1">
        <CardTitle><h2 className="text-balance font-semibold">{title}</h2></CardTitle>
        <CardDescription className="text-pretty text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5">
        {total === 0 ? (
          <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="flex size-36 items-center justify-center rounded-full border-16 border-muted text-3xl font-semibold tabular-nums">0</div>
            <p className="max-w-56 text-pretty text-sm text-muted-foreground">{empty}</p>
          </div>
        ) : (
          <>
            <ChartContainer config={config} className="mx-auto aspect-square h-56 w-full max-w-64">
              <PieChart accessibilityLayer aria-label={`${title}: ${total} ${unit}`}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
                <Pie data={data} dataKey="count" nameKey="key" innerRadius={64} outerRadius={90} paddingAngle={2} stroke="var(--card)" strokeWidth={3} isAnimationActive={false}>
                  <Label content={({ viewBox }) => viewBox && 'cx' in viewBox && 'cy' in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-semibold tabular-nums">{total.toLocaleString('en-US')}</tspan>
                      <tspan x={viewBox.cx} y={Number(viewBox.cy) + 24} className="fill-muted-foreground text-xs">{unit}</tspan>
                    </text>
                  ) : null} />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-3 pb-2" aria-label={`${title} breakdown`}>
              {data.map(item => (
                <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="flex shrink-0 gap-3 tabular-nums">
                    <span className="font-medium">{item.count.toLocaleString('en-US')}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{(item.count / total * 100).toLocaleString('en-US', { maximumFractionDigits: 1 })}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-between gap-3 px-5 text-xs">
        <span className="text-muted-foreground">All time</span>
        <Link to={to} className="flex items-center gap-1.5 font-medium hover:underline">
          {action}<ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
