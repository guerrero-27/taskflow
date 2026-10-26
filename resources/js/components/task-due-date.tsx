import { AlertCircleIcon, CalendarIcon } from 'lucide-react';

/**
 * A task's due date, with a text "Overdue" label and icon so the state never relies
 * on color alone. `overdue` comes from the server (Task::is_overdue), which applies
 * the app timezone; the date itself is a plain Y-m-d calendar date.
 */
export function TaskDueDate({
    date,
    overdue,
}: {
    date: string;
    overdue: boolean;
}) {
    // Parse as local midnight so the calendar date never shifts with the browser timezone.
    const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (overdue) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircleIcon className="size-3" aria-hidden="true" />
                <span className="font-medium">Overdue</span>
                <span aria-hidden="true">·</span>
                <span className="sr-only">, was due</span>
                <time dateTime={date}>{label}</time>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" aria-hidden="true" />
            <span className="sr-only">Due</span>
            <time dateTime={date}>{label}</time>
        </span>
    );
}
