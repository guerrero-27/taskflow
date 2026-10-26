import { Link } from '@inertiajs/react';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    CircleDashedIcon,
    ListTodoIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { index as tasksIndex } from '@/routes/tasks';
import type { DashboardStats } from '@/types';

type StatCardProps = {
    label: string;
    value: number;
    hint: string;
    icon: LucideIcon;
    /** Optional filtered Tasks list; the whole card becomes clickable. */
    href?: string;
    linkLabel?: string;
    attention?: boolean;
};

function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    href,
    linkLabel,
    attention = false,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'relative flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm sm:p-5',
                'animate-in duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none',
                href &&
                    'transition-shadow focus-within:ring-[3px] focus-within:ring-ring/50 hover:shadow-md motion-reduce:transition-none',
                attention &&
                    'border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20',
            )}
        >
            <dt className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
                {label}
                <Icon
                    className={cn(
                        'size-4',
                        attention
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-indigo-500',
                    )}
                    aria-hidden="true"
                />
            </dt>
            <dd
                className={cn(
                    'text-2xl font-semibold tabular-nums sm:text-3xl',
                    attention && 'text-red-700 dark:text-red-400',
                )}
            >
                {value}
            </dd>
            <dd className="text-xs text-muted-foreground">
                {href ? (
                    // Stretched link: the visible text stays short, the whole card is clickable.
                    <Link
                        href={href}
                        aria-label={linkLabel}
                        className="after:absolute after:inset-0 after:rounded-xl focus:outline-none"
                    >
                        {hint}
                    </Link>
                ) : (
                    hint
                )}
            </dd>
        </div>
    );
}

export function StatCards({ stats }: { stats: DashboardStats }) {
    return (
        <section aria-labelledby="overview-heading">
            <h3 id="overview-heading" className="sr-only">
                Overview
            </h3>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {/* Informational only: the Tasks list has no "not done" filter to link to. */}
                <StatCard
                    label="Active"
                    value={stats.active}
                    hint="To do and in progress"
                    icon={ListTodoIcon}
                />
                <StatCard
                    label="In progress"
                    value={stats.in_progress}
                    hint="View in progress"
                    icon={CircleDashedIcon}
                    href={tasksIndex.url({ query: { status: 'in_progress' } })}
                    linkLabel={`View ${stats.in_progress} in-progress tasks`}
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    hint="View completed"
                    icon={CheckCircle2Icon}
                    href={tasksIndex.url({ query: { status: 'done' } })}
                    linkLabel={`View ${stats.completed} completed tasks`}
                />
                <StatCard
                    label="Overdue"
                    value={stats.overdue}
                    hint={
                        stats.overdue > 0
                            ? 'Needs attention'
                            : 'Nothing overdue'
                    }
                    icon={AlertCircleIcon}
                    href={tasksIndex.url({ query: { due: 'overdue' } })}
                    linkLabel={`View ${stats.overdue} overdue tasks`}
                    attention={stats.overdue > 0}
                />
            </dl>
        </section>
    );
}
