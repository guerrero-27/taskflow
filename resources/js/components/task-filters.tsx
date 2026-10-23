import { useEffect, useRef, useState } from 'react';
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

// The server sends every key, with null for filters that are unset or invalid.
export type TaskFilters = {
    search?: string | null;
    status?: string | null;
    priority?: string | null;
    category_id?: string | null;
    due?: string | null;
    sort?: string | null;
    direction?: string | null;
};

type Props = {
    filters: TaskFilters;
    categories: Category[];
};

export function TaskFilters({ filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Latest requested filters, so a debounced search never builds on stale props.
    const latestFilters = useRef<TaskFilters>(filters);

    useEffect(() => {
        latestFilters.current = filters;

        // Don't overwrite text the user is still typing; the pending search will sync it.
        if (searchTimer.current) return;
        const serverSearch = filters.search ?? '';
        setSearch((current) => (current.trim() === serverSearch ? current : serverSearch));
    }, [filters]);

    useEffect(() => cancelPendingSearch, []);

    function cancelPendingSearch() {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = null;
    }

    function navigate(patch: Partial<TaskFilters>) {
        cancelPendingSearch();
        const merged: TaskFilters = { ...latestFilters.current, ...patch };
        latestFilters.current = merged;

        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries({ ...merged, page: '1' })) {
            if (v) next[k] = v;
        }
        router.get(index.url(), next, { preserveState: true, replace: true });
    }

    function handleSearch(value: string) {
        setSearch(value);
        cancelPendingSearch();
        searchTimer.current = setTimeout(() => navigate({ search: value.trim() }), 350);
    }

    function handleSelect(key: keyof TaskFilters, value: string) {
        // Include any in-progress search text so it isn't lost or applied later.
        navigate({ search: search.trim(), [key]: value === '__all__' ? '' : value });
    }

    function clearFilters() {
        setSearch('');
        navigate({ search: '', status: '', priority: '', category_id: '', due: '' });
    }

    const activeCount = [
        filters.search,
        filters.status,
        filters.priority,
        filters.category_id,
        filters.due,
    ].filter(Boolean).length;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
                <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
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
                        onClick={clearFilters}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Clear filters ({activeCount})
                    </button>
                )}
            </div>
        </div>
    );
}
