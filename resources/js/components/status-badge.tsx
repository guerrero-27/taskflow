import { cn } from '@/lib/utils';
import type { Task } from '@/types';

const CONFIG: Record<Task['status'], { label: string; className: string }> = {
    todo: {
        label: 'To Do',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    in_progress: {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    done: {
        label: 'Done',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
};

export function StatusBadge({ status }: { status: Task['status'] }) {
    const { label, className } = CONFIG[status];
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                className,
            )}
        >
            {label}
        </span>
    );
}
