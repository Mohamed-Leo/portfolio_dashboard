import { QueryClientProvider } from '@tanstack/react-query';

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { queryClient } from './lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} position="left" />
    </QueryClientProvider>
  );
}

export default App;
