export type Category = {
    id: number;
    name: string;
    color: string | null;
    tasks_count?: number;
};

export type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    is_overdue: boolean;
    category_id: number | null;
    category: Category | null;
    created_at: string;
    updated_at: string;
};

export type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};
