import type { Category, Task } from './models';

/** Server-computed dashboard statistics (DashboardController). */
export type DashboardStats = {
    /** All of the user's tasks that are not deleted. */
    total: number;
    /** To do + in progress. */
    active: number;
    in_progress: number;
    completed: number;
    overdue: number;
    /** Incomplete tasks due within the rolling window (`upcoming_days`). */
    due_soon: number;
    /** Whole percent, rounded down; null when there are no tasks. */
    completion_rate: number | null;
};

export type DashboardProps = {
    stats: DashboardStats;
    upcoming_tasks: Task[];
    recent_tasks: Task[];
    categories: Category[];
    upcoming_days: number;
};
