import type { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The SSR bootstrap script is unnecessary in this client-rendered Vite app.
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      storageKey="portfolio-dashboard.theme"
      scriptProps={{ type: 'application/json' }}
    >
      {children}
    </NextThemesProvider>
  );
}
