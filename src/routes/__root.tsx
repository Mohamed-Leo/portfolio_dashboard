import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools
        position="bottom-right"
        toggleButtonProps={{ style: { bottom: '3.5rem' } }}
      />
    </>
  ),
  notFoundComponent: () => (
    <main>
      <h1>Page not found</h1>
      <Link to="/">Go to home</Link>
    </main>
  ),
});
