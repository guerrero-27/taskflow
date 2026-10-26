import { useState } from 'react';

/**
 * Returns a number that increments each time `open` turns true.
 *
 * Use it as the `key` of a dialog's form so every open starts from fresh initial
 * values, while the form keeps its state during the close animation.
 */
export function useDialogSession(open: boolean): number {
    const [session, setSession] = useState(0);
    const [wasOpen, setWasOpen] = useState(open);

    // Adjusting state during render (instead of in an effect) avoids a frame of stale values.
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) setSession((s) => s + 1);
    }

    return session;
}
