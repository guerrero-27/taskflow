import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardListIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Heading from '@/components/heading';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusBadge } from '@/components/status-badge';
import { TaskDialog } from '@/components/task-dialog';
import { TaskDueDate } from '@/components/task-due-date';
import { TaskFilters, type TaskFilters as TFilters } from '@/components/task-filters';
import { Button } from '@/components/ui/button';
import { index as tasksIndex, destroy } from '@/routes/tasks';
import type { Category, Paginator, Task } from '@/types';

type PageProps = {
    tasks: Paginator<Task>;
    categories: Category[];
    filters: TFilters;
};

export default function TasksIndex({ tasks, categories, filters }: PageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Task | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState(false);

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(task: Task) {
        setEditTarget(task);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        router.delete(destroy.url(deleteTarget), {
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Tasks" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        variant="small"
                        id="tasks-heading"
                        title="Tasks"
                        description="Manage and track your tasks"
                    />
                    <Button
                        onClick={openCreate}
                        className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <PlusIcon />
                        Add Task
                    </Button>
                </div>

                <TaskFilters filters={filters} categories={categories} />

                {tasks.data.length === 0 ? (
                    <EmptyState onAdd={openCreate} hasFilters={hasActiveFilters(filters)} />
                ) : (
                    <>
                        <div className="divide-y divide-border rounded-lg border bg-card shadow-sm">
                            {tasks.data.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onEdit={openEdit}
                                    onDelete={setDeleteTarget}
                                />
                            ))}
                        </div>

                        <Pagination paginator={tasks} filters={filters} />
                    </>
                )}
            </div>

            <TaskDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                task={editTarget}
                categories={categories}
                fallbackFocus={focusTasksHeading}
            />

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="Delete Task"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
                        : ''
                }
                onConfirm={handleDelete}
                processing={deleting}
                fallbackFocus={focusTasksHeading}
            />
        </>
    );
}

// Where focus lands when a dialog's opener is gone, e.g. after deleting its row.
function focusTasksHeading() {
    return document.getElementById('tasks-heading');
}

function hasActiveFilters(filters: TFilters) {
    return !!(filters.search || filters.status || filters.priority || filters.category_id || filters.due);
}

function TaskRow({
    task,
    onEdit,
    onDelete,
}: {
    task: Task;
    onEdit: (t: Task) => void;
    onDelete: (t: Task) => void;
}) {
    const titleClass = task.status === 'done' ? 'text-muted-foreground line-through' : '';

    const actions = (
        <div className="flex shrink-0 gap-1 pointer-fine:opacity-0 pointer-fine:transition-opacity pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                aria-label={`Edit ${task.title}`}
            >
                <PencilIcon />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task)}
                aria-label={`Delete ${task.title}`}
                className="text-destructive hover:text-destructive"
            >
                <Trash2Icon />
            </Button>
        </div>
    );

    return (
        <div className="group px-4 py-3">
            {/* Mobile layout */}
            <div className="sm:hidden">
                <div className="flex items-start justify-between gap-2">
                    <p className={`flex-1 font-medium leading-snug ${titleClass}`}>{task.title}</p>
                    {actions}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <TaskMeta task={task} />
                </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex sm:items-center sm:gap-3">
                <p className={`flex-1 truncate font-medium ${titleClass}`}>{task.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                    <TaskMeta task={task} />
                    {actions}
                </div>
            </div>
        </div>
    );
}

function TaskMeta({ task }: { task: Task }) {
    return (
        <>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.category && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: task.category.color ?? '#e5e7eb' }}
                        aria-hidden="true"
                    />
                    {task.category.name}
                </span>
            )}
            {task.due_date && <TaskDueDate date={task.due_date} overdue={task.is_overdue} />}
        </>
    );
}

type PageItem = number | 'gap';

/** First, last, and the pages around the current one, with gaps for skipped ranges. */
function pageItems(current: number, last: number): PageItem[] {
    const pages = [...new Set([1, current - 1, current, current + 1, last])]
        .filter((page) => page >= 1 && page <= last)
        .sort((a, b) => a - b);

    const items: PageItem[] = [];
    pages.forEach((page, i) => {
        const previous = pages[i - 1];
        if (previous !== undefined && page - previous === 2) items.push(previous + 1);
        else if (previous !== undefined && page - previous > 2) items.push('gap');
        items.push(page);
    });

    return items;
}

// Comfortable touch targets on phones, compact from sm up.
const PAGE_BUTTON = 'h-10 min-w-10 sm:h-8 sm:min-w-8';

function Pagination({
    paginator,
    filters,
}: {
    paginator: Paginator<Task>;
    filters: TFilters;
}) {
    if (paginator.last_page <= 1) return null;

    const { current_page: current, last_page: last } = paginator;

    // Keep the active filters on every page link.
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value) query[key] = value;
    }
    const pageUrl = (page: number) =>
        tasksIndex.url({ query: page > 1 ? { ...query, page: String(page) } : query });

    return (
        <nav
            aria-label="Tasks pagination"
            className="flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between"
        >
            <p>
                Showing {paginator.from}–{paginator.to} of {paginator.total} tasks
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-1">
                <li>
                    <PageLink href={current > 1 ? pageUrl(current - 1) : null} label="Previous page">
                        Previous
                    </PageLink>
                </li>

                {pageItems(current, last).map((item, i) =>
                    item === 'gap' ? (
                        <li key={`gap-${i}`} aria-hidden="true" className="px-1">
                            …
                        </li>
                    ) : (
                        <li key={item}>
                            <PageLink
                                href={pageUrl(item)}
                                label={`Page ${item}`}
                                current={item === current}
                            >
                                {item}
                            </PageLink>
                        </li>
                    ),
                )}

                <li>
                    <PageLink href={current < last ? pageUrl(current + 1) : null} label="Next page">
                        Next
                    </PageLink>
                </li>
            </ul>
        </nav>
    );
}

function PageLink({
    href,
    label,
    current = false,
    children,
}: {
    href: string | null;
    label: string;
    current?: boolean;
    children: React.ReactNode;
}) {
    // No href (first/last page): a disabled button, skipped by the keyboard.
    if (href === null) {
        return (
            <Button variant="outline" size="sm" className={PAGE_BUTTON} disabled aria-label={label}>
                {children}
            </Button>
        );
    }

    return (
        <Button
            asChild
            variant={current ? 'default' : 'outline'}
            size="sm"
            className={`${PAGE_BUTTON} ${current ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
        >
            <Link
                href={href}
                preserveState
                aria-label={label}
                aria-current={current ? 'page' : undefined}
            >
                {children}
            </Link>
        </Button>
    );
}

function EmptyState({ onAdd, hasFilters }: { onAdd: () => void; hasFilters: boolean }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <ClipboardListIcon className="mb-4 size-12 text-muted-foreground/40" />
            {hasFilters ? (
                <>
                    <h3 className="text-base font-medium">No tasks match your filters</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting the filters or clear them to see all tasks.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-base font-medium">No tasks yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first task to get started.
                    </p>
                    <Button
                        onClick={onAdd}
                        className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <PlusIcon />
                        Add Task
                    </Button>
                </>
            )}
        </div>
    );
}

TasksIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tasks',
            href: tasksIndex(),
        },
    ],
};
