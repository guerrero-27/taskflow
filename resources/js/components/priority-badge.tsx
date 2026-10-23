import { cn } from '@/lib/utils';
import type { Task } from '@/types';

const CONFIG: Record<Task['priority'], { label: string; className: string }> = {
    low: {
        label: 'Low',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
    medium: {
        label: 'Medium',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    high: {
        label: 'High',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
    const { label, className } = CONFIG[priority];
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
