import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { store, update } from '@/routes/tasks';
import type { Category, Task } from '@/types';

type FormData = {
    title: string;
    description: string;
    status: Task['status'];
    priority: Task['priority'];
    due_date: string | null;
    category_id: number | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null;
    categories: Category[];
};

export function TaskDialog({ open, onOpenChange, task = null, categories }: Props) {
    const isEditing = task !== null;

    const { data, setData, post, patch, processing, errors, clearErrors, reset } =
        useForm<FormData>({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: null,
            category_id: null,
        });

    useEffect(() => {
        if (!open) return;
        setData({
            title: task?.title ?? '',
            description: task?.description ?? '',
            status: task?.status ?? 'todo',
            priority: task?.priority ?? 'medium',
            due_date: task?.due_date ?? null,
            category_id: task?.category_id ?? null,
        });
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, task?.id]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(update.url(task), {
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Write project proposal"
                            autoFocus
                            aria-invalid={!!errors.title}
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="task-description">
                            Description{' '}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                            id="task-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Add details…"
                            rows={3}
                            aria-invalid={!!errors.description}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task-status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v as Task['status'])}
                            >
                                <SelectTrigger
                                    id="task-status"
                                    className="w-full"
                                    aria-invalid={!!errors.status}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="task-priority">Priority</Label>
                            <Select
                                value={data.priority}
                                onValueChange={(v) => setData('priority', v as Task['priority'])}
                            >
                                <SelectTrigger
                                    id="task-priority"
                                    className="w-full"
                                    aria-invalid={!!errors.priority}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.priority} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task-due-date">
                                Due date{' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="task-due-date"
                                type="date"
                                value={data.due_date ?? ''}
                                onChange={(e) =>
                                    setData('due_date', e.target.value || null)
                                }
                                aria-invalid={!!errors.due_date}
                            />
                            <InputError message={errors.due_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="task-category">
                                Category{' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Select
                                value={data.category_id != null ? String(data.category_id) : '__none__'}
                                onValueChange={(v) =>
                                    setData('category_id', v === '__none__' ? null : Number(v))
                                }
                            >
                                <SelectTrigger
                                    id="task-category"
                                    className="w-full"
                                    aria-invalid={!!errors.category_id}
                                >
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            <span
                                                className="mr-1.5 inline-block size-2.5 rounded-full"
                                                style={{
                                                    backgroundColor: cat.color ?? '#e5e7eb',
                                                }}
                                            />
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category_id} />
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
                            {processing ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
