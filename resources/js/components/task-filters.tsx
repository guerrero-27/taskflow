import { useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/tasks';
import type { Category } from '@/types';

export type TaskFilters = {
    search?: string;
    status?: string;
    priority?: string;
    category_id?: string;
    due?: string;
    sort?: string;
    direction?: string;
};

type Props = {
    filters: TaskFilters;
    categories: Category[];
};

export function TaskFilters({ filters, categories }: Props) {
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useCallback(
        (patch: Partial<TaskFilters>) => {
            const next: Record<string, string> = {};
            const merged = { ...filters, ...patch, page: '1' };
            for (const [k, v] of Object.entries(merged)) {
                if (v) next[k] = v;
            }
            router.get(index.url(), next, { preserveState: true, replace: true });
        },
        [filters],
    );

    function handleSearch(value: string) {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => navigate({ search: value }), 350);
    }

    function handleSelect(key: keyof TaskFilters, value: string) {
        navigate({ [key]: value === '__all__' ? '' : value });
    }

    const activeCount = [filters.status, filters.priority, filters.category_id, filters.due].filter(
        Boolean,
    ).length;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
                <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search tasks…"
                    className="pl-8"
                    aria-label="Search tasks"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <Select
                    value={filters.status ?? '__all__'}
                    onValueChange={(v) => handleSelect('status', v)}
                >
                    <SelectTrigger className="w-[130px]" aria-label="Filter by status">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.priority ?? '__all__'}
                    onValueChange={(v) => handleSelect('priority', v)}
                >
                    <SelectTrigger className="w-[130px]" aria-label="Filter by priority">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.category_id ?? '__all__'}
                    onValueChange={(v) => handleSelect('category_id', v)}
                >
                    <SelectTrigger className="w-[140px]" aria-label="Filter by category">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                <span
                                    className="mr-1.5 inline-block size-2.5 rounded-full"
                                    style={{ backgroundColor: cat.color ?? '#e5e7eb' }}
                                />
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.due ?? '__all__'}
                    onValueChange={(v) => handleSelect('due', v)}
                >
                    <SelectTrigger className="w-[130px]" aria-label="Filter by due date">
                        <SelectValue placeholder="Due" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All dates</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this_week">This week</SelectItem>
                        <SelectItem value="no_due">No due date</SelectItem>
                    </SelectContent>
                </Select>

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            navigate({ status: '', priority: '', category_id: '', due: '' })
                        }
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Clear filters ({activeCount})
                    </button>
                )}
            </div>
        </div>
    );
}
