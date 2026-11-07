import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/global/mode-toggle"

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <p className="text-base font-medium">{title}</p>
        <div className="ml-auto"><ModeToggle /></div>
      </div>
    </header>
  )
}
