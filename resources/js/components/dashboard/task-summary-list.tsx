import { Link } from '@inertiajs/react';
import { ArrowRightIcon } from 'lucide-react';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusBadge } from '@/components/status-badge';
import { TaskDueDate } from '@/components/task-due-date';
import type { Task } from '@/types';

type Props = {
    id: string;
    title: string;
    description: string;
    tasks: Task[];
    emptyMessage: string;
    viewAllHref: string;
};

/** A compact, read-only list of up to five tasks with a link to the full Tasks page. */
export function TaskSummaryList({
    id,
    title,
    description,
    tasks,
    emptyMessage,
    viewAllHref,
}: Props) {
    return (
        <section
            aria-labelledby={id}
            className="flex animate-in flex-col rounded-xl border bg-card shadow-sm duration-300 fade-in-0 motion-reduce:animate-none"
        >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    <h3 id={id} className="font-semibold">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <Link
                    href={viewAllHref}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:min-h-8 dark:text-indigo-400"
                >
                    View all<span className="sr-only"> tasks</span>
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
            </div>

            {tasks.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
                    {emptyMessage}
                </p>
            ) : (
                <ul className="divide-y">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className="flex flex-col gap-1.5 px-4 py-3 sm:px-5"
                        >
                            <p
                                className={`truncate font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}
                                title={task.title}
                            >
                                {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={task.status} />
                                <PriorityBadge priority={task.priority} />
                                {task.due_date && (
                                    <TaskDueDate
                                        date={task.due_date}
                                        overdue={task.is_overdue}
                                    />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
