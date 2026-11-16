import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  async function changeTheme(nextTheme: string) {
    flushSync(() => setOpen(false));
    if (nextTheme === theme) return;

    const button = trigger.current;
    if (!document.startViewTransition || !button ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
      return;
    }

    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    setAnimating(true);
    document.documentElement.dataset.themeTransition = '';
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });

    try {
      await transition.ready;
      await document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      ).finished;
    } catch {
      // Hidden tabs or an interrupted animation can skip the visual transition.
      transition.skipTransition();
    } finally {
      delete document.documentElement.dataset.themeTransition;
      setAnimating(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button ref={trigger} disabled={animating} variant="outline" size="icon" className="relative" />}>
        <Sun aria-hidden="true" className="scale-100 rotate-0 transition-transform duration-200 motion-reduce:transition-none dark:scale-0 dark:-rotate-90" />
        <Moon aria-hidden="true" className="absolute scale-0 rotate-90 transition-transform duration-200 motion-reduce:transition-none dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={(value) => void changeTheme(value)}>
          <DropdownMenuRadioItem value="light" closeOnClick>Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
