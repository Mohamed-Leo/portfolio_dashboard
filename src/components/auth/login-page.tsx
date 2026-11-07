import { GalleryVerticalEnd } from 'lucide-react'
import { ModeToggle } from '@/components/global/mode-toggle'
import { LoginForm } from './login-form'
import { LoginArtwork } from './login-artwork'

export function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" aria-hidden="true" />
          </span>
          Portfolio Dashboard
          <div className="ml-auto"><ModeToggle /></div>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <LoginArtwork />
    </main>
  )
}
