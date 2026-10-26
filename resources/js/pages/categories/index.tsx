import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FolderOpenIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { CategoryDialog } from '@/components/category-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { index as categoriesIndex, destroy } from '@/routes/categories';
import type { Category } from '@/types';

type PageProps = {
    categories: Category[];
};

export default function CategoriesIndex({ categories }: PageProps) {

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(category: Category) {
        setEditTarget(category);
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
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        variant="small"
                        id="categories-heading"
                        title="Categories"
                        description="Organize your tasks with categories"
                    />
                    <Button
                        onClick={openCreate}
                        className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <PlusIcon />
                        Add Category
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <EmptyState onAdd={openCreate} />
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onEdit={openEdit}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={editTarget}
                fallbackFocus={focusCategoriesHeading}
            />

            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="Delete Category"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete "${deleteTarget.name}"? Tasks in this category will become uncategorized.`
                        : ''
                }
                onConfirm={handleDelete}
                processing={deleting}
                fallbackFocus={focusCategoriesHeading}
            />
        </>
    );
}

// Where focus lands when a dialog's opener is gone, e.g. after deleting its card.
function focusCategoriesHeading() {
    return document.getElementById('categories-heading');
}

function CategoryCard({
    category,
    onEdit,
    onDelete,
}: {
    category: Category;
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
}) {
    return (
        <div className="group flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <span
                className="size-9 shrink-0 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: category.color ?? '#e5e7eb' }}
                aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{category.name}</p>
                {/* tasks_count is only present when loaded with withCount; omit it otherwise. */}
                {typeof category.tasks_count === 'number' && (
                    <p className="text-sm text-muted-foreground">
                        {category.tasks_count === 1 ? '1 task' : `${category.tasks_count} tasks`}
                    </p>
                )}
            </div>
            <div className="flex gap-1 pointer-fine:opacity-0 pointer-fine:transition-opacity pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                    aria-label={`Edit ${category.name}`}
                >
                    <PencilIcon />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2Icon />
                </Button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <FolderOpenIcon className="mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-base font-medium">No categories yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Create categories to keep your tasks organized
            </p>
            <Button
                onClick={onAdd}
                className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700"
            >
                <PlusIcon />
                Add Category
            </Button>
        </div>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: categoriesIndex(),
        },
    ],
};
