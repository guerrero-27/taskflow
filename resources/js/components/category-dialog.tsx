import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
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
};

export function CategoryDialog({ open, onOpenChange, category = null }: Props) {
    const isEditing = category !== null;

    const { data, setData, post, patch, processing, errors, clearErrors, reset } = useForm<{
        name: string;
        color: string | null;
    }>({
        name: '',
        color: null,
    });

    useEffect(() => {
        if (!open) return;
        setData({
            name: category?.name ?? '',
            color: category?.color ?? null,
        });
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, category?.id]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(update.url(category), {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post(store.url(), {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="category-name">Name</Label>
                        <Input
                            id="category-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Work"
                            autoFocus
                            aria-invalid={!!errors.name}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Color{' '}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <div
                            className="flex flex-wrap gap-2"
                            role="group"
                            aria-label="Color options"
                        >
                            <button
                                type="button"
                                onClick={() => setData('color', null)}
                                aria-pressed={data.color === null}
                                aria-label="No color"
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full border-2 transition-all',
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
                                        'size-7 rounded-full border-2 transition-all hover:scale-110',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
                                        data.color === color
                                            ? 'border-white ring-2 ring-indigo-500 ring-offset-1'
                                            : 'border-transparent',
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
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
