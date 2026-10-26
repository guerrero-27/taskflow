import { Link } from '@inertiajs/react';
import { ClipboardListIcon, FolderOpenIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as categoriesIndex } from '@/routes/categories';

/** Shown instead of statistics for a user with no tasks, so nothing reads as a misleading zero. */
export function GettingStarted({ onAddTask }: { onAddTask: () => void }) {
    return (
        <section
            aria-labelledby="getting-started-heading"
            className="flex animate-in flex-col items-center rounded-xl border border-dashed bg-card px-4 py-10 text-center duration-300 fade-in-0 motion-reduce:animate-none sm:px-10"
        >
            <ClipboardListIcon
                className="mb-4 size-12 text-muted-foreground/40"
                aria-hidden="true"
            />
            <h3
                id="getting-started-heading"
                className="text-base font-semibold"
            >
                Get started with TaskFlow
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Your progress, upcoming deadlines, and recent activity will
                appear here once you add tasks.
            </p>

            <ol className="mt-8 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
                <li className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                    <div>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Step 1
                        </p>
                        <p className="font-medium">Create your first task</p>
                        <p className="text-sm text-muted-foreground">
                            Add a due date to see it under upcoming deadlines.
                        </p>
                    </div>
                    <Button
                        onClick={onAddTask}
                        className="mt-auto h-10 bg-indigo-600 text-white hover:bg-indigo-700 sm:h-9 sm:self-start"
                    >
                        <PlusIcon aria-hidden="true" />
                        Add Task
                    </Button>
                </li>
                <li className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                    <div>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Step 2
                        </p>
                        <p className="font-medium">Organize with categories</p>
                        <p className="text-sm text-muted-foreground">
                            Group related tasks, like Work or Personal.
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        className="mt-auto h-10 sm:h-9 sm:self-start"
                    >
                        <Link href={categoriesIndex.url()}>
                            <FolderOpenIcon aria-hidden="true" />
                            Manage Categories
                        </Link>
                    </Button>
                </li>
            </ol>
        </section>
    );
}
