import { Link, usePage } from '@inertiajs/react';
import { FolderOpenIcon, ListChecksIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as categoriesIndex } from '@/routes/categories';
import { index as tasksIndex } from '@/routes/tasks';
import type { DashboardStats } from '@/types';

export const DASHBOARD_HEADING_ID = 'dashboard-heading';

function plural(count: number, word: string) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** A short, factual status line built from the server statistics. */
function summary(stats: DashboardStats, upcomingDays: number): string {
    if (stats.total === 0)
        return 'Add your first task to start tracking your work.';
    if (stats.active === 0) return 'All caught up — every task is complete.';

    const parts = [`You have ${plural(stats.active, 'active task')}`];
    if (stats.overdue > 0) parts.push(`${stats.overdue} overdue`);
    parts.push(
        stats.due_soon > 0
            ? `${stats.due_soon} due in the next ${upcomingDays} days`
            : `nothing due in the next ${upcomingDays} days`,
    );

    return `${parts.join(' · ')}.`;
}

type Props = {
    stats: DashboardStats;
    upcomingDays: number;
    onAddTask: () => void;
};

export function DashboardHeader({ stats, upcomingDays, onAddTask }: Props) {
    const { auth } = usePage().props;

    return (
        // Side by side only from xl: with the sidebar open, narrower content widths
        // would squeeze the welcome text into a thin column.
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
                <h2
                    id={DASHBOARD_HEADING_ID}
                    className="text-xl font-semibold tracking-tight break-words"
                >
                    Welcome back, {auth.user.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {summary(stats, upcomingDays)}
                </p>
            </div>

            <nav aria-label="Quick actions" className="shrink-0">
                <ul className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                    <li>
                        <Button
                            onClick={onAddTask}
                            className="h-10 w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:h-9 sm:w-auto"
                        >
                            <PlusIcon aria-hidden="true" />
                            Add Task
                        </Button>
                    </li>
                    <li>
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 w-full sm:h-9 sm:w-auto"
                        >
                            <Link href={tasksIndex.url()}>
                                <ListChecksIcon aria-hidden="true" />
                                View All Tasks
                            </Link>
                        </Button>
                    </li>
                    <li>
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 w-full sm:h-9 sm:w-auto"
                        >
                            <Link href={categoriesIndex.url()}>
                                <FolderOpenIcon aria-hidden="true" />
                                Manage Categories
                            </Link>
                        </Button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
