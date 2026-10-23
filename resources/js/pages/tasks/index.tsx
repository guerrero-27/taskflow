import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CalendarIcon, ClipboardListIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Heading from '@/components/heading';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusBadge } from '@/components/status-badge';
import { TaskDialog } from '@/components/task-dialog';
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
        if (!deleteTarget) return;
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
            />
        </>
    );
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
    const dueDateLabel = task.due_date
        ? new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

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
                    <p className={`flex-1 font-medium leading-snug ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
                        {task.title}
                    </p>
                    {actions}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.category && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: task.category.color ?? '#e5e7eb' }}
                            />
                            {task.category.name}
                        </span>
                    )}
                    {dueDateLabel && (
                        <span
                            className={`inline-flex items-center gap-1 text-xs ${task.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
                        >
                            <CalendarIcon className="size-3" />
                            {dueDateLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex sm:items-center sm:gap-3">
                <p className={`flex-1 truncate font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
                    {task.title}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.category && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: task.category.color ?? '#e5e7eb' }}
                            />
                            {task.category.name}
                        </span>
                    )}
                    {dueDateLabel && (
                        <span
                            className={`inline-flex items-center gap-1 text-xs ${task.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
                        >
                            <CalendarIcon className="size-3" />
                            {dueDateLabel}
                        </span>
                    )}
                    {actions}
                </div>
            </div>
        </div>
    );
}

function Pagination({
    paginator,
    filters,
}: {
    paginator: Paginator<Task>;
    filters: TFilters;
}) {
    if (paginator.last_page <= 1) return null;

    function goTo(page: number) {
        const params: Record<string, string> = { page: String(page) };
        for (const [k, v] of Object.entries(filters)) {
            if (v) params[k] = v;
        }
        router.get(tasksIndex.url(), params, { preserveState: true, replace: false });
    }

    const pages = paginator.links
        .filter((l) => !['&laquo; Previous', 'Next &raquo;'].includes(l.label))
        .map((l) => ({ ...l, page: parseInt(l.label, 10) }))
        .filter((l) => !isNaN(l.page));

    return (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
                {paginator.from}–{paginator.to} of {paginator.total}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page === 1}
                    onClick={() => goTo(paginator.current_page - 1)}
                >
                    Previous
                </Button>

                {pages.map(({ page, active }) => (
                    <Button
                        key={page}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goTo(page)}
                        className={active ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page === paginator.last_page}
                    onClick={() => goTo(paginator.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
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
