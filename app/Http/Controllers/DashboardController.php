<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** Length of the rolling "due soon" window, starting today. */
    private const UPCOMING_DAYS = 7;

    private const LIST_LIMIT = 5;

    public function index(Request $request): Response
    {
        $user = $request->user();

        // One grouped query for every status count (soft-deleted tasks are excluded
        // by the SoftDeletes scope, which toBase() still applies).
        $counts = $user->tasks()
            ->toBase()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $total = (int) $counts->sum();
        $completed = (int) ($counts[TaskStatus::Done->value] ?? 0);
        $hasTasks = $total > 0;

        return Inertia::render('dashboard', [
            'stats' => [
                'total' => $total,
                'active' => $total - $completed,
                'in_progress' => (int) ($counts[TaskStatus::InProgress->value] ?? 0),
                'completed' => $completed,
                // Skip the remaining queries for a user with no tasks.
                'overdue' => $hasTasks ? $user->tasks()->overdue()->count() : 0,
                'due_soon' => $hasTasks ? $user->tasks()->dueSoon(self::UPCOMING_DAYS)->count() : 0,
                // Rounded down so 100% only ever means every task is done; null avoids a fake 0%.
                'completion_rate' => $hasTasks ? intdiv($completed * 100, $total) : null,
            ],
            'upcoming_tasks' => $hasTasks
                ? $user->tasks()
                    ->dueSoon(self::UPCOMING_DAYS)
                    ->with('category:id,name,color')
                    ->orderBy('due_date')
                    ->orderBy('id')
                    ->limit(self::LIST_LIMIT)
                    ->get()
                : [],
            'recent_tasks' => $hasTasks
                ? $user->tasks()
                    ->with('category:id,name,color')
                    ->latest('updated_at')
                    ->orderByDesc('id')
                    ->limit(self::LIST_LIMIT)
                    ->get()
                : [],
            // For the Add Task dialog's category select.
            'categories' => $user->categories()->orderBy('name')->get(['id', 'name', 'color']),
            'upcoming_days' => self::UPCOMING_DAYS,
        ]);
    }
}
