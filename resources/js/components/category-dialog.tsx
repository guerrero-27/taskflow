import { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useDialogSession } from '@/hooks/use-dialog-session';
import { useRestoreFocus } from '@/hooks/use-restore-focus';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/categories';
import type { Category } from '@/types';

const PRESET_COLORS = [
    '#6366f1',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
    /** Focused on close when the element that opened the dialog no longer exists. */
    fallbackFocus?: () => HTMLElement | null;
};

export function CategoryDialog(props: Props) {
    const session = useDialogSession(props.open);

    // A new key per open gives the form fresh initial values for the category.
    return <CategoryDialogSession key={session} {...props} />;
}

function CategoryDialogSession({ open, onOpenChange, category = null, fallbackFocus }: Props) {
    const isEditing = category !== null;
    const submitting = useRef(false);
    const restoreFocus = useRestoreFocus(fallbackFocus);

    const { data, setData, post, patch, processing, errors } = useForm<{
        name: string;
        color: string | null;
    }>({
        name: category?.name ?? '',
        color: category?.color ?? null,
    });

    function handleOpenChange(next: boolean) {
        // Keep the dialog open while saving so validation errors aren't hidden.
        if (!next && processing) return;
        onOpenChange(next);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;

        const options = {
            onSuccess: () => onOpenChange(false),
            onError: (fieldErrors: Partial<Record<'name' | 'color', string>>) => {
                if (fieldErrors.name) document.getElementById('category-name')?.focus();
            },
            onFinish: () => {
                submitting.current = false;
            },
        };

        if (isEditing) {
            patch(update.url(category), options);
        } else {
            post(store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" {...restoreFocus}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? `Rename “${category.name}” or change its color.`
                            : 'Create a category to group related tasks.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor="category-name">Name</Label>
                        <Input
                            id="category-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Work"
                            required
                            maxLength={100}
                            className="h-10 sm:h-9"
                            aria-invalid={errors.name ? true : undefined}
                            aria-describedby={errors.name ? 'category-name-error' : undefined}
                        />
                        <InputError id="category-name-error" message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <span id="category-color-label" className="text-sm leading-none font-medium">
                            Color{' '}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </span>
                        <div
                            className="flex flex-wrap gap-2"
                            role="group"
                            aria-labelledby="category-color-label"
                            aria-describedby={errors.color ? 'category-color-error' : undefined}
                        >
                            <button
                                type="button"
                                onClick={() => setData('color', null)}
                                aria-pressed={data.color === null}
                                aria-label="No color"
                                className={cn(
                                    'flex size-9 items-center justify-center rounded-full border-2 transition-all sm:size-7',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
                                    data.color === null
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                        : 'border-border hover:border-muted-foreground',
                                )}
                            >
                                <XIcon className="size-3 text-muted-foreground" />
                            </button>

                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData('color', color)}
                                    aria-pressed={data.color === color}
                                    aria-label={`Color ${color}`}
                                    style={{ backgroundColor: color }}
                                    className={cn(
                                        'size-9 rounded-full border-2 transition-all hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:size-7',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
                                        data.color === color
                                            ? 'border-white ring-2 ring-indigo-500 ring-offset-1'
                                            : 'border-transparent',
                                    )}
                                />
                            ))}
                        </div>
                        <InputError id="category-color-error" message={errors.color} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                            className="h-10 sm:h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-10 bg-indigo-600 text-white hover:bg-indigo-700 sm:h-9"
                        >
                            {processing
                                ? 'Saving…'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Add Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
