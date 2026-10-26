import { useRef } from 'react';
import { useForm } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { useDialogSession } from '@/hooks/use-dialog-session';
import { useRestoreFocus } from '@/hooks/use-restore-focus';
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

type Field = keyof FormData;

const FIELD_IDS: Record<Field, string> = {
    title: 'task-title',
    description: 'task-description',
    status: 'task-status',
    priority: 'task-priority',
    due_date: 'task-due-date',
    category_id: 'task-category',
};

// Comfortable touch targets on phones, the standard compact height from sm up.
const CONTROL_HEIGHT = 'h-10 sm:h-9';
const SELECT_HEIGHT = 'w-full data-[size=default]:h-10 sm:data-[size=default]:h-9';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null;
    categories: Category[];
    /** Focused on close when the element that opened the dialog no longer exists. */
    fallbackFocus?: () => HTMLElement | null;
};

export function TaskDialog(props: Props) {
    const session = useDialogSession(props.open);

    // A new key per open gives the form fresh initial values for the task being
    // created or edited, so nothing carries over from a previous open.
    return <TaskDialogSession key={session} {...props} />;
}

function TaskDialogSession({ open, onOpenChange, task = null, categories, fallbackFocus }: Props) {
    const isEditing = task !== null;
    const submitting = useRef(false);
    const restoreFocus = useRestoreFocus(fallbackFocus);

    const { data, setData, post, patch, processing, errors } = useForm<FormData>({
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status ?? 'todo',
        priority: task?.priority ?? 'medium',
        due_date: task?.due_date ?? null,
        category_id: task?.category_id ?? null,
    });

    function handleOpenChange(next: boolean) {
        // Keep the dialog open while saving so validation errors aren't hidden.
        if (!next && processing) return;
        onOpenChange(next);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Guards double clicks/Enter presses before `processing` re-renders.
        if (submitting.current) return;
        submitting.current = true;

        const options = {
            onSuccess: () => onOpenChange(false),
            onError: (fieldErrors: Partial<Record<Field, string>>) => {
                const first = (Object.keys(FIELD_IDS) as Field[]).find((f) => fieldErrors[f]);
                if (first) document.getElementById(FIELD_IDS[first])?.focus();
            },
            onFinish: () => {
                submitting.current = false;
            },
        };

        if (isEditing) {
            patch(update.url(task), options);
        } else {
            post(store.url(), options);
        }
    }

    function fieldA11y(field: Field) {
        return {
            id: FIELD_IDS[field],
            'aria-invalid': errors[field] ? true : undefined,
            'aria-describedby': errors[field] ? `${FIELD_IDS[field]}-error` : undefined,
        };
    }

    function fieldError(field: Field) {
        return <InputError id={`${FIELD_IDS[field]}-error`} message={errors[field]} />;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
                {...restoreFocus}
            >
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? `Update the details of “${task.title}”.`
                            : 'Add a new task to your list.'}{' '}
                        Title, status, and priority are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor={FIELD_IDS.title}>Title</Label>
                        <Input
                            {...fieldA11y('title')}
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Write project proposal"
                            required
                            maxLength={255}
                            className={CONTROL_HEIGHT}
                        />
                        {fieldError('title')}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={FIELD_IDS.description}>
                            Description{' '}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                            {...fieldA11y('description')}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Add details…"
                            rows={3}
                        />
                        {fieldError('description')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={FIELD_IDS.status}>Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v as Task['status'])}
                            >
                                <SelectTrigger {...fieldA11y('status')} className={SELECT_HEIGHT}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldError('status')}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={FIELD_IDS.priority}>Priority</Label>
                            <Select
                                value={data.priority}
                                onValueChange={(v) => setData('priority', v as Task['priority'])}
                            >
                                <SelectTrigger {...fieldA11y('priority')} className={SELECT_HEIGHT}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldError('priority')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={FIELD_IDS.due_date}>
                                Due date{' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                {...fieldA11y('due_date')}
                                type="date"
                                value={data.due_date ?? ''}
                                onChange={(e) => setData('due_date', e.target.value || null)}
                                className={CONTROL_HEIGHT}
                            />
                            {fieldError('due_date')}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={FIELD_IDS.category_id}>
                                Category{' '}
                                <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <Select
                                value={data.category_id != null ? String(data.category_id) : '__none__'}
                                onValueChange={(v) =>
                                    setData('category_id', v === '__none__' ? null : Number(v))
                                }
                            >
                                <SelectTrigger {...fieldA11y('category_id')} className={SELECT_HEIGHT}>
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
                                                aria-hidden="true"
                                            />
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldError('category_id')}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                            className={CONTROL_HEIGHT}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className={`${CONTROL_HEIGHT} bg-indigo-600 text-white hover:bg-indigo-700`}
                        >
                            {processing ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
