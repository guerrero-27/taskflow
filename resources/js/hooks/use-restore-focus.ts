import { useRef } from 'react';

type FocusTarget = () => HTMLElement | null;

function canFocus(el: HTMLElement | null): el is HTMLElement {
    return (
        !!el &&
        el.isConnected &&
        !el.matches(':disabled') &&
        !el.closest('[inert]') &&
        // Not display:none / detached from layout (e.g. the hidden mobile/desktop copy).
        el.getClientRects().length > 0
    );
}

/**
 * Returns focus to the element that opened a dialog once it closes.
 *
 * Radix only restores focus to a <DialogTrigger>. Dialogs opened from state
 * (row buttons, page actions) have no trigger, so focus fell back to <body>.
 * Spread the returned handlers onto <DialogContent>: the opener is recorded just
 * before Radix moves focus into the dialog, and restored on close (Escape, Cancel,
 * the close button, or closing after a successful submit). If the opener is gone
 * or unfocusable (e.g. its row was deleted), `fallback` is focused instead.
 *
 * Don't put `autoFocus` on fields inside the dialog: React applies it before
 * `onOpenAutoFocus` fires, so the field would be recorded as the opener. Radix
 * already focuses the first focusable field on open.
 */
export function useRestoreFocus(fallback?: FocusTarget) {
    const opener = useRef<HTMLElement | null>(null);

    return {
        onOpenAutoFocus: () => {
            const active = document.activeElement;
            opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
        },
        onCloseAutoFocus: (event: Event) => {
            const target = [opener.current, fallback?.() ?? null].find(canFocus);
            opener.current = null;
            if (!target) return; // Let Radix apply its default.

            event.preventDefault();
            // Non-interactive fallbacks such as headings need tabindex to take focus.
            if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }
            target.focus();
        },
    };
}
