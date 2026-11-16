import { QueryClientProvider } from '@tanstack/react-query';

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { queryClient } from './lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors />
        <ReactQueryDevtools initialIsOpen={false} position="left" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
