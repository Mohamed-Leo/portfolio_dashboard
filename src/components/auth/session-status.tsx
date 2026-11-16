import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { sessionKey } from '@/queries/session';

export function SessionPending() {
  return <main className="grid min-h-svh place-items-center" role="status">Checking your session…</main>;
}

export function SessionError() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function retry() {
    await queryClient.invalidateQueries({ queryKey: sessionKey, refetchType: 'none' });
    await router.invalidate();
  }
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="space-y-4 text-center" role="alert">
        <h1 className="text-xl font-semibold">Unable to check your session</h1>
        <p className="text-sm text-muted-foreground">Check that the backend is running, then try again.</p>
        <Button onClick={() => void retry()}>Try again</Button>
      </div>
    </main>
  );
}
