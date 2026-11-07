import { Card, CardDescription, CardHeader } from '@/components/ui/card'

export function DashboardSection({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold">{title}</h1>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
