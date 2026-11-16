import { createFileRoute } from '@tanstack/react-router'
import { ChartAreaInteractive } from '@/components/layout/chart-area-interactive'
import { DataTable } from '@/components/layout/data-table'
import { SectionCards } from '@/components/layout/section-cards'
import sampleData from '@/app/dashboard/data.json'

export const Route = createFileRoute('/_protected/dashboard/')({
  component: () => (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preview of the dashboard layout with sample data.</p>
      </div>
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={sampleData} />
    </>
  ),
})
