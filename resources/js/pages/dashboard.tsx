import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { CompletionCard } from '@/components/dashboard/completion-card';
import {
    DASHBOARD_HEADING_ID,
    DashboardHeader,
} from '@/components/dashboard/dashboard-header';
import { GettingStarted } from '@/components/dashboard/getting-started';
import { StatCards } from '@/components/dashboard/stat-cards';
import { TaskSummaryList } from '@/components/dashboard/task-summary-list';
import { TaskDialog } from '@/components/task-dialog';
import { dashboard } from '@/routes';
import { index as tasksIndex } from '@/routes/tasks';
import type { DashboardProps } from '@/types';

// Where focus lands after Add Task if its opener is gone (e.g. the Getting Started
// button disappears once the first task exists).
function focusDashboardHeading() {
    return document.getElementById(DASHBOARD_HEADING_ID);
}

export default function Dashboard({
    stats,
    upcoming_tasks,
    recent_tasks,
    categories,
    upcoming_days,
}: DashboardProps) {
    const [addOpen, setAddOpen] = useState(false);
    const openAdd = () => setAddOpen(true);

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <DashboardHeader
                    stats={stats}
                    upcomingDays={upcoming_days}
                    onAddTask={openAdd}
                />

                {stats.total === 0 || stats.completion_rate === null ? (
                    <GettingStarted onAddTask={openAdd} />
                ) : (
                    <>
                        <StatCards stats={stats} />

                        <CompletionCard
                            rate={stats.completion_rate}
                            completed={stats.completed}
                            total={stats.total}
                        />

                        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                            <TaskSummaryList
                                id="upcoming-heading"
                                title="Upcoming deadlines"
                                description={`Incomplete tasks due in the next ${upcoming_days} days`}
                                tasks={upcoming_tasks}
                                emptyMessage={`Nothing due in the next ${upcoming_days} days.`}
                                viewAllHref={tasksIndex.url()}
                            />
                            <TaskSummaryList
                                id="recent-heading"
                                title="Recently updated"
                                description="Your latest task activity"
                                tasks={recent_tasks}
                                emptyMessage="No recent activity."
                                viewAllHref={tasksIndex.url({
                                    query: {
                                        sort: 'updated_at',
                                        direction: 'desc',
                                    },
                                })}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Saving returns to the dashboard (TaskController@store), refreshing these props. */}
            <TaskDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                categories={categories}
                fallbackFocus={focusDashboardHeading}
            />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
