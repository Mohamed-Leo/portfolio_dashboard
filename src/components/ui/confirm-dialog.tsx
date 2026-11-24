import type { ReactNode } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = 'Cancel', onConfirm, pending = false, error }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={next => { if (!pending) onOpenChange(next); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border bg-popover p-6 text-popover-foreground shadow-lg">
          <AlertDialog.Title className="text-balance text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</AlertDialog.Description>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" disabled={pending} />}>{cancelLabel}</AlertDialog.Close>
            <Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? 'Please wait…' : confirmLabel}</Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
