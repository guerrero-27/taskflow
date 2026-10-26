import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useRestoreFocus } from '@/hooks/use-restore-focus';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description: ReactNode;
    confirmLabel?: string;
    onConfirm: () => void;
    processing?: boolean;
    /** Focused on close when the element that opened the dialog no longer exists (e.g. after deleting its row). */
    fallbackFocus?: () => HTMLElement | null;
};

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title = 'Confirm deletion',
    description,
    confirmLabel = 'Delete',
    onConfirm,
    processing = false,
    fallbackFocus,
}: Props) {
    const restoreFocus = useRestoreFocus(fallbackFocus);

    function handleOpenChange(next: boolean) {
        // Keep the dialog open while the deletion is in progress.
        if (!next && processing) return;
        onOpenChange(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent {...restoreFocus}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Deleting…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
